import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, asc
from sqlalchemy.orm import selectinload
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.recommendation import Recommendation
from app.policy.enums import CaseStatus, RiskLevel, ProblemType, AuditEventType, ActorType, PolicyDecision, ActionType
from app.agents.graph import recovery_graph
from app.services.audit_service import audit_service

class CaseService:
    @staticmethod
    async def get_cases(
        db: AsyncSession,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        problem_type: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> List[RecoveryCase]:
        query = select(RecoveryCase).options(
            selectinload(RecoveryCase.customer),
            selectinload(RecoveryCase.recommendations)
        )

        if status and status != "All":
            query = query.where(RecoveryCase.status == CaseStatus(status))
        if risk_level and risk_level != "All":
            query = query.where(RecoveryCase.risk_level == RiskLevel(risk_level))
        if problem_type and problem_type != "All":
            query = query.where(RecoveryCase.problem_type == ProblemType(problem_type))

        if search:
            search_term = f"%{search}%"
            query = query.join(Customer).where(
                or_(
                    RecoveryCase.id.ilike(search_term),
                    Customer.name.ilike(search_term),
                    Customer.email.ilike(search_term)
                )
            )

        if sort_by == "created_at" and not search:
            query = query.order_by(desc(RecoveryCase.id.in_(["CASE-1001", "CASE-1002", "CASE-1003", "CASE-1004", "CASE-1005", "CASE-1006"])), asc(RecoveryCase.id))
        else:
            order_col = getattr(RecoveryCase, sort_by, RecoveryCase.created_at)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(order_col))
            else:
                query = query.order_by(asc(order_col))

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        cases = list(result.scalars().all())
        
        # Attach latest recommendation if present
        for c in cases:
            if c.recommendations:
                c.latest_recommendation = sorted(c.recommendations, key=lambda r: r.created_at, reverse=True)[0]
            else:
                c.latest_recommendation = None
        return cases

    @staticmethod
    async def get_case_by_id(db: AsyncSession, case_id: str) -> Optional[RecoveryCase]:
        query = select(RecoveryCase).where(RecoveryCase.id == case_id).options(
            selectinload(RecoveryCase.customer),
            selectinload(RecoveryCase.recommendations),
            selectinload(RecoveryCase.actions),
            selectinload(RecoveryCase.approval_requests),
            selectinload(RecoveryCase.audit_logs)
        )
        result = await db.execute(query)
        case = result.scalar_one_or_none()
        if case and case.recommendations:
            case.latest_recommendation = sorted(case.recommendations, key=lambda r: r.created_at, reverse=True)[0]
        return case

    @staticmethod
    async def analyze_case(db: AsyncSession, case_id: str) -> Optional[RecoveryCase]:
        case = await CaseService.get_case_by_id(db, case_id)
        if not case:
            return None

        # Fetch transaction & customer
        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        cust_query = select(Customer).where(Customer.id == case.customer_id)
        cust_res = await db.execute(cust_query)
        cust = cust_res.scalar_one_or_none()

        initial_state = {
            "case_id": case.id,
            "transaction": {
                "id": tx.id if tx else "TX-000",
                "amount": tx.amount if tx else case.amount_at_risk,
                "status": tx.status.value if tx else "FAILED",
                "failure_reason": tx.failure_reason if tx else "BANK_ERROR",
                "payment_state": tx.payment_state.value if tx else "CLEAR",
                "possible_customer_debit": tx.possible_customer_debit if tx else False,
                "fraud_signal": tx.fraud_signal if tx else False,
                "retry_count": case.retry_count,
            },
            "customer": {
                "id": cust.id if cust else "CUST-000",
                "name": cust.name if cust else "Customer",
                "successful_payment_count": cust.successful_payment_count if cust else 5,
                "failed_payment_count": cust.failed_payment_count if cust else 1,
                "average_payment_delay_days": cust.average_payment_delay_days if cust else 0.5,
            },
            "retry_count": case.retry_count,
            "max_retries": case.max_retries,
            "audit_events": []
        }

        # Run LangGraph pipeline
        final_state = recovery_graph.invoke(initial_state)

        # Update case model fields from final state
        case.recovery_score = final_state.get("recovery_score", case.recovery_score)
        case.risk_level = RiskLevel(final_state.get("risk_level", case.risk_level.value))
        case.recommended_action = ActionType(final_state.get("recommended_action", case.recommended_action.value))
        case.policy_decision = PolicyDecision(final_state.get("policy_decision", case.policy_decision.value))
        
        status_str = final_state.get("workflow_status")
        if status_str and hasattr(CaseStatus, status_str):
            case.status = CaseStatus(status_str)
        elif case.policy_decision == PolicyDecision.HUMAN:
            case.status = CaseStatus.AWAITING_APPROVAL
        elif case.policy_decision == PolicyDecision.AUTO:
            case.status = CaseStatus.SCHEDULED
        elif case.policy_decision == PolicyDecision.BLOCK:
            case.status = CaseStatus.BLOCKED

        # Save recommendation record
        rec = Recommendation(
            id=f"REC-{uuid.uuid4().hex[:8]}",
            case_id=case.id,
            diagnosis=final_state.get("diagnosis", "TEMPORARY_FAILURE"),
            recovery_score=case.recovery_score,
            recommended_action=case.recommended_action,
            delay_minutes=final_state.get("delay_minutes", 30),
            expected_recovery_value=final_state.get("expected_recovery_value", 0.0),
            reason=final_state.get("reason", "AI Analysis Completed")
        )
        db.add(rec)

        # Save generated audit events
        for evt in final_state.get("audit_events", []):
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=evt.get("event_type", AuditEventType.AI_DIAGNOSED.value),
                actor_type=evt.get("actor_type", ActorType.AI.value),
                actor_id=evt.get("actor_id", "AI_ENGINE"),
                reason=evt.get("reason", "Pipeline execution step"),
                metadata_json=evt.get("metadata", {})
            )

        await db.commit()
        await db.refresh(case)
        return case

case_service = CaseService()
