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

logger = logging.getLogger(__name__)

from app.policy.enums import PolicyDecision, CaseStatus, RiskLevel

def ensure_demo_cases_updated(db: Session):
    demo_updates = {
        "CASE-1001": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW),
        "CASE-1002": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH),
        "CASE-1003": (PolicyDecision.BLOCK, CaseStatus.BLOCKED, RiskLevel.HIGH),
        "CASE-1004": (PolicyDecision.AUTO, CaseStatus.SCHEDULED, RiskLevel.LOW),
        "CASE-1005": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.LOW),
        "CASE-1006": (PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL, RiskLevel.HIGH),
    }
    for c_id, (policy, status, risk) in demo_updates.items():
        case = db.scalar(select(RecoveryCase).where(RecoveryCase.id == c_id))
        if case:
            case.policy_decision = policy
            case.status = status
            case.risk_level = risk
    db.commit()

def seed_database_if_empty():
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
