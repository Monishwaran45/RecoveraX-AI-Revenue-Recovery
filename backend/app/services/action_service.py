from datetime import datetime
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.models.action import ActionModel
from app.policy.enums import CaseStatus, TransactionStatus, PaymentState, PolicyDecision, AuditEventType, ActorType
from app.policy.engine import policy_engine
from app.simulator.payment import payment_simulator
from app.services.audit_service import audit_service
from app.services.case_service import case_service

class ActionService:
    @staticmethod
    async def recheck_case(db: AsyncSession, case_id: str) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id)
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None

        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        status_str = tx.status.value if tx else "FAILED"
        state_str = tx.payment_state.value if tx else "CLEAR"
        possible_debit = tx.possible_customer_debit if tx else False

        if status_str == "SUCCESS":
            case.status = CaseStatus.RECOVERED
            case.policy_decision = PolicyDecision.STOP
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.REVENUE_RECOVERED,
                actor_type=ActorType.VERIFIER,
                actor_id="GATEWAY_VERIFIER",
                reason="Fresh re-check verified payment was settled with bank gateway. Case marked RECOVERED.",
                metadata_json={"status": "SUCCESS"}
            )
        elif state_str == "AMBIGUOUS" or possible_debit:
            case.status = CaseStatus.BLOCKED
            case.policy_decision = PolicyDecision.BLOCK
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.POLICY,
                actor_id="GATEWAY_VERIFIER",
                reason="Fresh re-check detected unconfirmed bank state or possible customer debit risk. Retry hard-blocked.",
                metadata_json={"payment_state": state_str, "possible_customer_debit": possible_debit}
            )
        else:
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.PAYMENT_RECHECKED,
                actor_type=ActorType.VERIFIER,
                actor_id="GATEWAY_VERIFIER",
                reason=f"Payment state re-checked prior to action: status={status_str}, payment_state={state_str}",
                metadata_json={"status": status_str, "payment_state": state_str}
            )

        await db.commit()
        return await case_service.get_case_by_id(db, case.id)

    @staticmethod
    async def execute_case_action(db: AsyncSession, case_id: str) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id)
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None

        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        # Never execute a terminal or approval-waiting case.
        if case.status in [CaseStatus.RECOVERED, CaseStatus.BLOCKED, CaseStatus.STOPPED, CaseStatus.AWAITING_APPROVAL]:
            return await case_service.get_case_by_id(db, case.id)

        policy_eval = policy_engine.evaluate(
            transaction_status=TransactionStatus(tx.status.value if tx else "FAILED"),
            payment_state=PaymentState(tx.payment_state.value if tx else "CLEAR"),
            possible_customer_debit=tx.possible_customer_debit if tx else False,
            fraud_signal=tx.fraud_signal if tx else False,
            retry_count=case.retry_count,
            max_retries=case.max_retries,
            action=case.recommended_action,
            amount=case.amount_at_risk,
            recovery_score=case.recovery_score,
            risk_level=case.risk_level,
            diagnosis="PRE_EXECUTION_CHECK"
        )

        if policy_eval.decision == PolicyDecision.BLOCK:
            case.status = CaseStatus.BLOCKED
            case.policy_decision = PolicyDecision.BLOCK
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.EXECUTOR,
                actor_id="ACTION_EXECUTOR",
                reason=f"Pre-execution policy check BLOCKED action: {policy_eval.reason}",
                metadata_json={"decision": "BLOCK"}
            )
            await db.commit()
            return await case_service.get_case_by_id(db, case.id)

        # HUMAN is fail-closed. Explicit merchant approval is required before execution.
        if policy_eval.decision == PolicyDecision.HUMAN or case.policy_decision == PolicyDecision.HUMAN:
            from app.models.approval import ApprovalRequest
            from app.policy.enums import ApprovalStatus
            app_query = select(ApprovalRequest).where(
                ApprovalRequest.case_id == case.id,
                ApprovalRequest.status.in_([ApprovalStatus.APPROVED, ApprovalStatus.MODIFIED])
            )
            app_res = await db.execute(app_query)
            approved_req = app_res.scalar_one_or_none()
            if not approved_req:
                case.status = CaseStatus.AWAITING_APPROVAL
                await audit_service.log_event(
                    db=db,
                    case_id=case.id,
                    event_type=AuditEventType.ACTION_BLOCKED,
                    actor_type=ActorType.POLICY,
                    actor_id="DETERMINISTIC_POLICY_ENGINE",
                    reason="Execution paused: explicit merchant approval is required.",
                    metadata_json={"decision": "HUMAN_APPROVAL_REQUIRED"}
                )
                await db.commit()
                return await case_service.get_case_by_id(db, case.id)

        case.status = CaseStatus.EXECUTING
        action_rec = ActionModel(
            id=f"ACT-{uuid.uuid4().hex[:8]}",
            case_id=case.id,
            action_type=case.recommended_action,
            status="EXECUTING",
            executed_at=datetime.utcnow(),
            created_by="SYSTEM"
        )
        db.add(action_rec)
        await db.commit()

        try:
            status, p_state, message = payment_simulator.simulate_retry(
                transaction_id=tx.id if tx else "TX-000",
                amount=case.amount_at_risk,
                current_retry_count=case.retry_count,
                policy_decision=case.policy_decision,
                payment_state=PaymentState(tx.payment_state.value if tx else "CLEAR"),
                failure_profile_id="TEMPORARY_BANK_ERROR"
            )

            case.retry_count += 1
            action_rec.result = message

            if status == TransactionStatus.SUCCESS:
                case.status = CaseStatus.RECOVERED
                action_rec.status = "SUCCESS"
                action_rec.amount_recovered = case.amount_at_risk
                if tx:
                    tx.status = TransactionStatus.SUCCESS
                    tx.payment_state = PaymentState.CLEAR

                await audit_service.log_event(
                    db=db,
                    case_id=case.id,
                    event_type=AuditEventType.REVENUE_RECOVERED,
                    actor_type=ActorType.VERIFIER,
                    actor_id="GATEWAY_VERIFIER",
                    reason=f"Payment verified & settled with bank gateway. Recovered ₹{case.amount_at_risk:,.2f}",
                    metadata_json={"amount_recovered": case.amount_at_risk}
                )
            else:
                case.status = CaseStatus.FAILED
                action_rec.status = "FAILED"
                if tx:
                    tx.status = TransactionStatus.FAILED
                await audit_service.log_event(
                    db=db,
                    case_id=case.id,
                    event_type=AuditEventType.PAYMENT_VERIFIED,
                    actor_type=ActorType.VERIFIER,
                    actor_id="GATEWAY_VERIFIER",
                    reason=f"Retry attempt failed. Gateway message: {message}",
                    metadata_json={"result": "FAILED"}
                )
        except Exception as e:
            case.status = CaseStatus.BLOCKED
            action_rec.status = "BLOCKED"
            action_rec.result = str(e)
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.EXECUTOR,
                actor_id="ACTION_EXECUTOR",
                reason=f"Execution exception encountered: {str(e)}",
                metadata_json={"error": str(e)}
            )

        await db.commit()
        return await case_service.get_case_by_id(db, case.id)

    @staticmethod
    async def stop_case(db: AsyncSession, case_id: str, reason: Optional[str] = None) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id)
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None

        case.status = CaseStatus.STOPPED
        case.policy_decision = PolicyDecision.STOP

        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.RECOVERY_STOPPED,
            actor_type=ActorType.SYSTEM,
            actor_id="RECOVERY_ENGINE",
            reason=reason or "Recovery case explicitly stopped",
            metadata_json={"status": "STOPPED"}
        )

        await db.commit()
        return await case_service.get_case_by_id(db, case.id)

action_service = ActionService()
