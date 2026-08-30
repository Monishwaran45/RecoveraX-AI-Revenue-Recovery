import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.approval import ApprovalRequest
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.policy.enums import ApprovalStatus, ActionType, PolicyDecision, CaseStatus, AuditEventType, ActorType, TransactionStatus, PaymentState, RiskLevel
from app.policy.engine import policy_engine
from app.services.audit_service import audit_service

from app.services.case_service import CaseService

class ApprovalService:
    @staticmethod
    def _require_pending_human_review(case: RecoveryCase) -> None:
        status_val = case.status.value if hasattr(case.status, "value") else str(case.status).upper()
        if status_val in ("RECOVERED", "BLOCKED", "STOPPED", "FAILED"):
            raise ValueError(f"Case {case.id} is already in terminal state {status_val} and cannot be modified.")

    @staticmethod
    async def get_pending_approvals(db: AsyncSession) -> List[ApprovalRequest]:
        query = select(ApprovalRequest).where(
            ApprovalRequest.status == ApprovalStatus.PENDING
        ).options(
            selectinload(ApprovalRequest.recovery_case).selectinload(RecoveryCase.customer),
            selectinload(ApprovalRequest.recovery_case).selectinload(RecoveryCase.recommendations)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def approve_case(db: AsyncSession, case_id: str, reason: Optional[str] = None) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id).options(
            selectinload(RecoveryCase.approval_requests)
        )
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None
        ApprovalService._require_pending_human_review(case)

        # Update or create approval request
        pending_found = False
        if case.approval_requests:
            for req in case.approval_requests:
                if req.status == ApprovalStatus.PENDING:
                    req.status = ApprovalStatus.APPROVED
                    req.human_decision = "APPROVE"
                    req.reason = reason or "Human operator approved AI recommendation"
                    req.resolved_at = datetime.utcnow()
                    pending_found = True

        if not pending_found:
            action_val = case.recommended_action.value if hasattr(case.recommended_action, "value") else str(case.recommended_action)
            new_app = ApprovalRequest(
                id=f"APP-{uuid.uuid4().hex[:8]}",
                case_id=case.id,
                status=ApprovalStatus.APPROVED,
                ai_recommendation=f"Recommend {action_val} delay 30m. Explicit merchant sign-off granted.",
                reason=reason or "Human operator approved AI recommendation",
                human_decision="APPROVE",
                created_at=datetime.utcnow(),
                resolved_at=datetime.utcnow()
            )
            db.add(new_app)

        case.status = CaseStatus.SCHEDULED
        case.approval_status = "APPROVED"
        # Approval authorizes this specific action; it does not rewrite policy authority.
        case.policy_decision = PolicyDecision.HUMAN
        
        action_val = case.recommended_action.value if hasattr(case.recommended_action, "value") else str(case.recommended_action)
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.HUMAN_APPROVED,
            actor_type=ActorType.HUMAN,
            actor_id="HUMAN_OPERATOR",
            reason=reason or "Human operator approved recovery retry",
            metadata_json={"action": action_val}
        )

        await db.commit()
        return await CaseService.get_case_by_id(db, case_id)

    @staticmethod
    async def reject_case(db: AsyncSession, case_id: str, reason: Optional[str] = None) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id).options(
            selectinload(RecoveryCase.approval_requests)
        )
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None
        ApprovalService._require_pending_human_review(case)

        for req in case.approval_requests:
            if req.status == ApprovalStatus.PENDING:
                req.status = ApprovalStatus.REJECTED
                req.human_decision = "REJECT"
                req.reason = reason or "Human operator rejected AI recommendation"
                req.resolved_at = datetime.utcnow()

        case.status = CaseStatus.STOPPED
        case.policy_decision = PolicyDecision.STOP

        action_val = case.recommended_action.value if hasattr(case.recommended_action, "value") else str(case.recommended_action)
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.HUMAN_REJECTED,
            actor_type=ActorType.HUMAN,
            actor_id="HUMAN_OPERATOR",
            reason=reason or "Human operator rejected recovery action",
            metadata_json={"action": action_val}
        )

        await db.commit()
        return await CaseService.get_case_by_id(db, case_id)

    @staticmethod
    async def modify_case(
        db: AsyncSession,
        case_id: str,
        modified_action: ActionType,
        modified_delay_minutes: int = 30,
        reason: Optional[str] = None
    ) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id).options(
            selectinload(RecoveryCase.approval_requests)
        )
        res = await db.execute(query)
        case = res.scalar_one_or_none()
        if not case:
            return None
        ApprovalService._require_pending_human_review(case)

        # Fetch transaction for mandatory re-policy evaluation
        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        mod_action_str = modified_action.value if hasattr(modified_action, "value") else str(modified_action)

        # IMPORTANT REQUIREMENT: Human-modified actions MUST pass through policy_check again
        policy_eval = policy_engine.evaluate(
            transaction_status=TransactionStatus(tx.status.value if tx else "FAILED"),
            payment_state=PaymentState(tx.payment_state.value if tx else "CLEAR"),
            possible_customer_debit=tx.possible_customer_debit if tx else False,
            fraud_signal=tx.fraud_signal if tx else False,
            retry_count=case.retry_count,
            max_retries=case.max_retries,
            action=modified_action,
            amount=case.amount_at_risk,
            recovery_score=case.recovery_score,
            risk_level=case.risk_level,
            diagnosis="HUMAN_MODIFIED"
        )

        for req in case.approval_requests:
            if req.status == ApprovalStatus.PENDING:
                req.status = ApprovalStatus.MODIFIED
                req.human_decision = "MODIFY"
                req.modified_action = modified_action
                req.modified_delay_minutes = modified_delay_minutes
                req.reason = reason or f"Human operator modified action to {mod_action_str}"
                req.resolved_at = datetime.utcnow()

        case.recommended_action = modified_action
        
        if policy_eval.decision == PolicyDecision.BLOCK:
            case.status = CaseStatus.BLOCKED
            case.policy_decision = PolicyDecision.BLOCK
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.ACTION_BLOCKED,
                actor_type=ActorType.POLICY,
                actor_id="DETERMINISTIC_POLICY_ENGINE",
                reason=f"Human-modified action {mod_action_str} failed re-policy check: {policy_eval.reason}",
                metadata_json={"decision": "BLOCK"}
            )
        else:
            case.status = CaseStatus.SCHEDULED
            case.policy_decision = PolicyDecision.HUMAN
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.HUMAN_MODIFIED,
                actor_type=ActorType.HUMAN,
                actor_id="HUMAN_OPERATOR",
                reason=reason or f"Human operator modified action to {mod_action_str}",
                metadata_json={"modified_action": mod_action_str, "delay_minutes": modified_delay_minutes}
            )

        await db.commit()
        return await CaseService.get_case_by_id(db, case_id)

approval_service = ApprovalService()
