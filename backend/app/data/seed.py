import logging
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database.session import sync_engine, SyncSessionLocal
from app.database.base import Base
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.recovery_case import RecoveryCase
from app.models.recommendation import Recommendation
from app.models.approval import ApprovalRequest
from app.models.audit import AuditLog
from app.data.generator import generate_synthetic_dataset

from sqlalchemy import select, inspect, text

logger = logging.getLogger(__name__)

from app.policy.enums import PolicyDecision, CaseStatus, RiskLevel, ActionType

def ensure_columns_exist():
    try:
        inspector = inspect(sync_engine)
        if "recovery_cases" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("recovery_cases")]
            with sync_engine.begin() as conn:
                if "verification_result" not in columns:
                    logger.info("Migrating schema: Adding verification_result to recovery_cases table")
                    conn.execute(text("ALTER TABLE recovery_cases ADD COLUMN verification_result VARCHAR(64) DEFAULT 'NONE'"))
                if "amount_recovered" not in columns:
                    logger.info("Migrating schema: Adding amount_recovered to recovery_cases table")
                    conn.execute(text("ALTER TABLE recovery_cases ADD COLUMN amount_recovered DOUBLE DEFAULT 0.0"))
                if "approval_status" not in columns:
                    logger.info("Migrating schema: Adding approval_status to recovery_cases table")
                    conn.execute(text("ALTER TABLE recovery_cases ADD COLUMN approval_status VARCHAR(32) DEFAULT 'NOT_REQUIRED'"))
    except Exception as e:
        logger.warning(f"Column migration check non-fatal exception: {e}")

def ensure_demo_cases_updated(db: Session):
    demo_updates = {
        "CASE-1001": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW, 87, ActionType.RETRY, "NONE", 0.0, "NOT_REQUIRED"),
        "CASE-1002": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH, 78, ActionType.RETRY, "NONE", 0.0, "PENDING"),
        "CASE-1003": (PolicyDecision.BLOCK, CaseStatus.BLOCKED, RiskLevel.HIGH, 10, ActionType.STOP, "BLOCKED", 0.0, "NOT_REQUIRED"),
        "CASE-1004": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW, 82, ActionType.RETRY, "NONE", 0.0, "NOT_REQUIRED"),
        "CASE-1005": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.LOW, 75, ActionType.REMIND, "NONE", 0.0, "PENDING"),
        "CASE-1006": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH, 65, ActionType.ESCALATE, "NONE", 0.0, "PENDING"),
    }
    for c_id, (policy, status, risk, score, action, v_res, amt_rec, app_stat) in demo_updates.items():
        case = db.scalar(select(RecoveryCase).where(RecoveryCase.id == c_id))
        if case:
            case.policy_decision = policy
            case.status = status
            case.risk_level = risk
            case.recovery_score = score
            case.recommended_action = action
            if not getattr(case, 'verification_result', None):
                case.verification_result = v_res
            if getattr(case, 'amount_recovered', None) is None:
                case.amount_recovered = amt_rec
            if not getattr(case, 'approval_status', None):
                case.approval_status = app_stat
    db.commit()

def seed_database_if_empty():
    ensure_columns_exist()
    Base.metadata.create_all(bind=sync_engine)
    
    with SyncSessionLocal() as db:
        existing = db.scalars(select(RecoveryCase)).first()
        if existing:
            ensure_demo_cases_updated(db)
            logger.info("Database already seeded. Demo case decisions updated.")
            return

        logger.info("Seeding database with 1,000 synthetic cases and demo cases (seed=42)...")
        customers, transactions, subscriptions, invoices, recovery_cases, recommendations, approval_requests, audit_logs = generate_synthetic_dataset(seed=42)
        
        for c in customers:
            db.add(c)
        db.commit()

        for t in transactions:
            db.add(t)
        for s in subscriptions:
            db.add(s)
        for i in invoices:
            db.add(i)
        db.commit()

        for rc in recovery_cases:
            db.add(rc)
        db.commit()

        for rec in recommendations:
            db.add(rec)
        for app in approval_requests:
            db.add(app)
        for aud in audit_logs:
            db.add(aud)
        db.commit()

        logger.info(f"Database successfully seeded with {len(recovery_cases)} recovery cases!")

if __name__ == "__main__":
    seed_database_if_empty()
