from datetime import datetime
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.models.action import ActionModel
from app.policy.enums import CaseStatus, TransactionStatus, PaymentState, PolicyDecision, AuditEventType, ActorType, RiskLevel, ActionType
from app.policy.engine import policy_engine
from app.simulator.payment import payment_simulator
from app.services.audit_service import audit_service
from app.services.case_service import case_service

def _val(x, default=""):
    if x is None:
        return default
    return getattr(x, "value", str(x))

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

        if not tx:
            case.status = CaseStatus.BLOCKED.value
            case.policy_decision = PolicyDecision.BLOCK.value
            await audit_service.log_event(
                db=db, case_id=case.id, event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.POLICY, actor_id="GATEWAY_VERIFIER",
                reason="Gateway re-check failed: source transaction was not found. Action hard-blocked.",
                metadata_json={"source_id": case.source_id}
            )
            await db.commit()
            return await case_service.get_case_by_id(db, case.id)

        status_str = _val(tx.status, "FAILED")
        state_str = _val(tx.payment_state, "CLEAR")
        possible_debit = tx.possible_customer_debit

        if status_str == "SUCCESS":
            recovered_amount = float(tx.amount) if tx else float(case.amount_at_risk)
            case.status = CaseStatus.RECOVERED.value
            case.policy_decision = PolicyDecision.STOP.value
            case.verification_result = "VERIFIED_SUCCESS"
            case.amount_recovered = recovered_amount
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.REVENUE_RECOVERED,
                actor_type=ActorType.VERIFIER,
                actor_id="GATEWAY_VERIFIER",
                reason="Fresh re-check verified payment was settled with bank gateway. Case marked RECOVERED.",
                metadata_json={"status": "SUCCESS", "amount_recovered": recovered_amount}
            )
        elif state_str == "AMBIGUOUS" or possible_debit:
            case.status = CaseStatus.BLOCKED.value
            case.policy_decision = PolicyDecision.BLOCK.value
            case.verification_result = "VERIFIED_AMBIGUOUS"
            case.amount_recovered = 0.0
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
            # A fresh check does not authorize execution. It only confirms that the
            # transaction is still eligible to proceed to the pre-execution policy gate.
            if case.status in [CaseStatus.RECOVERED, CaseStatus.BLOCKED, CaseStatus.STOPPED]:
                return await case_service.get_case_by_id(db, case.id)
            case.amount_recovered = 0.0
            case.verification_result = "PENDING"
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

        # A missing source record must never be treated as a retryable failure.
        if not tx:
            case.status = CaseStatus.BLOCKED.value
            case.policy_decision = PolicyDecision.BLOCK.value
            await audit_service.log_event(
                db=db, case_id=case.id, event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.POLICY, actor_id="DETERMINISTIC_POLICY_ENGINE",
                reason="Execution blocked: source transaction was not found.",
                metadata_json={"source_id": case.source_id}
            )
            await db.commit()
            return await case_service.get_case_by_id(db, case.id)

        # Never execute a terminal case or case that reached max retries limit
        if case.retry_count >= case.max_retries or case.status in [CaseStatus.RECOVERED, CaseStatus.BLOCKED, CaseStatus.STOPPED]:
            if case.retry_count >= case.max_retries and case.status != CaseStatus.RECOVERED:
                case.status = CaseStatus.STOPPED.value
                case.verification_result = "STOPPED"
                case.amount_recovered = 0.0
                await db.commit()
            return await case_service.get_case_by_id(db, case.id)

        tx_stat_val = _val(tx.status, "FAILED")
        tx_state_val = _val(tx.payment_state, "CLEAR")
        policy_eval = policy_engine.evaluate(
            transaction_status=TransactionStatus(tx_stat_val) if hasattr(TransactionStatus, tx_stat_val) else TransactionStatus.FAILED,
            payment_state=PaymentState(tx_state_val) if hasattr(PaymentState, tx_state_val) else PaymentState.CLEAR,
            possible_customer_debit=tx.possible_customer_debit,
            fraud_signal=tx.fraud_signal,
            retry_count=case.retry_count or 0,
            max_retries=case.max_retries or 2,
            action=case.recommended_action,
            amount=case.amount_at_risk,
            recovery_score=case.recovery_score,
            risk_level=case.risk_level,
            diagnosis="PRE_EXECUTION_CHECK"
        )

        if policy_eval.decision == PolicyDecision.BLOCK:
            case.status = CaseStatus.BLOCKED.value
            case.policy_decision = PolicyDecision.BLOCK.value
            case.amount_recovered = 0.0
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

        if policy_eval.decision == PolicyDecision.STOP:
            case.status = CaseStatus.STOPPED.value
            case.policy_decision = PolicyDecision.STOP.value
            case.verification_result = "STOPPED"
            await audit_service.log_event(
                db=db, case_id=case.id, event_type=AuditEventType.RECOVERY_STOPPED,
                actor_type=ActorType.POLICY, actor_id="DETERMINISTIC_POLICY_ENGINE",
                reason=f"Pre-execution policy stopped action: {policy_eval.reason}",
                metadata_json={"decision": "STOP"}
            )
            await db.commit()
            return await case_service.get_case_by_id(db, case.id)

        # HUMAN is fail-closed. Explicit merchant approval is required before execution.
        if policy_eval.decision == PolicyDecision.HUMAN or case.policy_decision == PolicyDecision.HUMAN:
            from app.models.approval import ApprovalRequest
            from app.policy.enums import ApprovalStatus
            app_query = select(ApprovalRequest).where(
                ApprovalRequest.case_id == case.id,
                ApprovalRequest.status.in_([
                    ApprovalStatus.APPROVED, ApprovalStatus.MODIFIED,
                    "APPROVED", "MODIFIED", "Approved", "Modified"
                ])
            )
            app_res = await db.execute(app_query)
            approved_req = app_res.scalars().first()

            is_approved = approved_req is not None or (getattr(case, "approval_status", None) in ("APPROVED", "MODIFIED", "Approved", "Modified"))
            if not is_approved:
                case.status = CaseStatus.AWAITING_APPROVAL.value
                case.amount_recovered = 0.0
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

        case.status = CaseStatus.EXECUTING.value
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
            # REMIND and ESCALATE are communication/workflow actions, not payment retries.
            case_action_val = _val(case.recommended_action, "RETRY")
            if case_action_val != ActionType.RETRY.value:
                if case_action_val == "REMIND":
                    case.status = CaseStatus.SCHEDULED.value
                    case.policy_decision = PolicyDecision.AUTO.value
                else:
                    case.status = CaseStatus.STOPPED.value
                    case.policy_decision = PolicyDecision.STOP.value
                
                case.verification_result = "NONE"
                case.amount_recovered = 0.0
                action_rec.status = "SUCCESS"
                action_rec.result = f"{case_action_val} action completed; no payment retry was attempted."
                await audit_service.log_event(
                    db=db, case_id=case.id, event_type=AuditEventType.ACTION_EXECUTED,
                    actor_type=ActorType.EXECUTOR, actor_id="ACTION_EXECUTOR",
                    reason=action_rec.result,
                    metadata_json={"action": case_action_val, "payment_retry": False}
                )
                await db.commit()
                return await case_service.get_case_by_id(db, case.id)

            tx_pstate_val = _val(tx.payment_state, "CLEAR")
            status, p_state, message = payment_simulator.simulate_retry(
                transaction_id=tx.id,
                amount=case.amount_at_risk,
                current_retry_count=case.retry_count or 0,
                policy_decision=case.policy_decision,
                payment_state=PaymentState(tx_pstate_val) if hasattr(PaymentState, tx_pstate_val) else PaymentState.CLEAR,
                failure_profile_id=tx.failure_reason or "TEMPORARY_BANK_ERROR"
            )

            case.retry_count += 1
            tx.retry_count = case.retry_count
            action_rec.result = message

            if status == TransactionStatus.SUCCESS:
                case.status = CaseStatus.RECOVERED.value
                case.verification_result = "VERIFIED_SUCCESS"
                case.amount_recovered = case.amount_at_risk
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
                should_stop = case.retry_count >= case.max_retries
                case.status = CaseStatus.STOPPED.value if should_stop else CaseStatus.SCHEDULED.value
                if should_stop:
                    case.policy_decision = PolicyDecision.STOP.value
                case.verification_result = "VERIFIED_FAILED"
                case.amount_recovered = 0.0
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
                if should_stop:
                    await audit_service.log_event(
                        db=db, case_id=case.id, event_type=AuditEventType.RECOVERY_STOPPED,
                        actor_type=ActorType.POLICY, actor_id="DETERMINISTIC_POLICY_ENGINE",
                        reason=f"Maximum retry limit reached ({case.retry_count}/{case.max_retries}).",
                        metadata_json={"retry_count": case.retry_count, "max_retries": case.max_retries}
                    )
                else:
                    await audit_service.log_event(
                        db=db, case_id=case.id, event_type=AuditEventType.RETRY_SCHEDULED,
                        actor_type=ActorType.SYSTEM, actor_id="RECOVERY_ENGINE",
                        reason="Retry failed; case re-evaluated and scheduled for one bounded follow-up retry.",
                        metadata_json={"retry_count": case.retry_count, "max_retries": case.max_retries}
                    )
        except Exception as e:
            case.status = CaseStatus.BLOCKED.value
            case.amount_recovered = 0.0
            case.verification_result = "EXECUTION_ERROR"
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

        case.status = CaseStatus.STOPPED.value
        case.policy_decision = PolicyDecision.STOP.value
        case.amount_recovered = 0.0
        case.verification_result = "STOPPED"

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

    @staticmethod
    async def reset_case(db: AsyncSession, case_id: str) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id)
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None

        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        demo_defaults = {
            "CASE-1001": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW, 87, ActionType.RETRY, "NONE", 0.0, "NOT_REQUIRED", TransactionStatus.FAILED, PaymentState.CLEAR, False, 0, 15000.0),
            "CASE-1002": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH, 78, ActionType.RETRY, "NONE", 0.0, "PENDING", TransactionStatus.FAILED, PaymentState.CLEAR, False, 0, 75000.0),
            "CASE-1003": (PolicyDecision.BLOCK, CaseStatus.BLOCKED, RiskLevel.HIGH, 10, ActionType.STOP, "BLOCKED", 0.0, "NOT_REQUIRED", TransactionStatus.AMBIGUOUS, PaymentState.AMBIGUOUS, True, 0, 25000.0),
            "CASE-1004": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW, 85, ActionType.RETRY, "NONE", 0.0, "NOT_REQUIRED", TransactionStatus.FAILED, PaymentState.CLEAR, False, 0, 2499.0),
            "CASE-1005": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.MEDIUM, 75, ActionType.REMIND, "NONE", 0.0, "PENDING", TransactionStatus.FAILED, PaymentState.CLEAR, False, 0, 8500.0),
            "CASE-1006": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH, 65, ActionType.ESCALATE, "NONE", 0.0, "PENDING", TransactionStatus.FAILED, PaymentState.CLEAR, False, 0, 120000.0),
        }

        if case_id in demo_defaults:
            policy, status, risk, score, action, v_res, amt_rec, app_stat, tx_stat, p_state, poss_debit, retry_cnt, amt_risk = demo_defaults[case_id]
            case.policy_decision = policy.value if hasattr(policy, "value") else policy
            case.status = status.value if hasattr(status, "value") else status
            case.risk_level = risk.value if hasattr(risk, "value") else risk
            case.recovery_score = score
            case.recommended_action = action.value if hasattr(action, "value") else action
            case.verification_result = v_res
            case.amount_recovered = amt_rec
            case.approval_status = app_stat
            case.retry_count = retry_cnt
            case.amount_at_risk = amt_risk
            if tx:
                tx.amount = amt_risk
                tx.status = tx_stat
                tx.payment_state = p_state
                tx.possible_customer_debit = poss_debit
                tx.retry_count = retry_cnt
        else:
            case.status = CaseStatus.OPEN.value
            case.verification_result = "NONE"
            case.amount_recovered = 0.0
            case.retry_count = 0
            case.approval_status = "NOT_REQUIRED"
            if tx:
                tx.status = TransactionStatus.FAILED
                tx.retry_count = 0

        from app.models.approval import ApprovalRequest
        from app.policy.enums import ApprovalStatus

        app_reqs = (await db.execute(select(ApprovalRequest).where(ApprovalRequest.case_id == case.id))).scalars().all()
        for ar in app_reqs:
            ar.status = ApprovalStatus.PENDING if case.status == CaseStatus.AWAITING_APPROVAL else ApprovalStatus.APPROVED

        await db.commit()
        return await case_service.get_case_by_id(db, case.id)

action_service = ActionService()
