import uuid
from datetime import datetime
from typing import Optional
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
    ) -> Optional[AuditLog]:
        try:
            ev_str = str(event_type.value if hasattr(event_type, "value") else event_type)[:64]
            ac_str = str(actor_type.value if hasattr(actor_type, "value") else actor_type)[:64]
            audit_entry = AuditLog(
                id=f"AUD-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                event_type=ev_str,
                actor_type=ac_str,
                actor_id=str(actor_id)[:128],
                reason=str(reason)[:500],
                metadata_json=metadata_json or {},
                timestamp=datetime.utcnow()
            )
            db.add(audit_entry)
            try:
                async with db.begin_nested():
                    await db.flush()
            except Exception:
                pass
            return audit_entry
        except Exception as e:
            logger.warning(f"Audit log exception notice ({event_type}): {e}")
            return None

    @staticmethod
    def log_event_sync(
        db: Session,
        case_id: str,
        event_type: AuditEventType,
        actor_type: ActorType,
        actor_id: str,
        reason: str,
        metadata_json: dict = None
    ) -> Optional[AuditLog]:
        try:
            ev_str = str(event_type.value if hasattr(event_type, "value") else event_type)[:64]
            ac_str = str(actor_type.value if hasattr(actor_type, "value") else actor_type)[:64]
            audit_entry = AuditLog(
                id=f"AUD-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                event_type=ev_str,
                actor_type=ac_str,
                actor_id=str(actor_id)[:128],
                reason=str(reason)[:500],
                metadata_json=metadata_json or {},
                timestamp=datetime.utcnow()
            )
            db.add(audit_entry)
            try:
                with db.begin_nested():
                    db.flush()
            except Exception:
                pass
            return audit_entry
        except Exception as e:
            logger.warning(f"Audit log sync exception notice ({event_type}): {e}")
            return None

audit_service = AuditService()
