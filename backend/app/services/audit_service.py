import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.policy.enums import AuditEventType, ActorType

import logging

logger = logging.getLogger(__name__)

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
            event_type=str(event_type.value if hasattr(event_type, "value") else event_type),
            actor_type=str(actor_type.value if hasattr(actor_type, "value") else actor_type),
            actor_id=actor_id,
            reason=reason,
            metadata_json=metadata_json or {},
            timestamp=datetime.utcnow()
        )
        db.add(audit_entry)
        try:
            await db.commit()
            await db.refresh(audit_entry)
        except Exception as e:
            logger.warning(f"Audit log commit fallback notice ({event_type}): {e}")
            await db.rollback()
            # Try fallback short event type if schema constrained
            try:
                audit_entry.event_type = "ACTION_EXECUTED"
                db.add(audit_entry)
                await db.commit()
            except Exception:
                await db.rollback()
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
            event_type=str(event_type.value if hasattr(event_type, "value") else event_type),
            actor_type=str(actor_type.value if hasattr(actor_type, "value") else actor_type),
            actor_id=actor_id,
            reason=reason,
            metadata_json=metadata_json or {},
            timestamp=datetime.utcnow()
        )
        db.add(audit_entry)
        try:
            db.commit()
            db.refresh(audit_entry)
        except Exception as e:
            logger.warning(f"Audit log sync commit fallback notice ({event_type}): {e}")
            db.rollback()
            try:
                audit_entry.event_type = "ACTION_EXECUTED"
                db.add(audit_entry)
                db.commit()
            except Exception:
                db.rollback()
        return audit_entry

audit_service = AuditService()
