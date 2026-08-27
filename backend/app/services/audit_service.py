import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.policy.enums import AuditEventType, ActorType

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        case_id: str,
        event_type: AuditEventType,
        actor_type: ActorType,
        actor_id: str,
        reason: str,
        metadata_json: dict = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            event_type=event_type,
            actor_type=actor_type,
            actor_id=actor_id,
            reason=reason,
            metadata_json=metadata_json or {},
            timestamp=datetime.utcnow()
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def log_event_sync(
        db: Session,
        case_id: str,
        event_type: AuditEventType,
        actor_type: ActorType,
        actor_id: str,
        reason: str,
        metadata_json: dict = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            event_type=event_type,
            actor_type=actor_type,
            actor_id=actor_id,
            reason=reason,
            metadata_json=metadata_json or {},
            timestamp=datetime.utcnow()
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

audit_service = AuditService()
