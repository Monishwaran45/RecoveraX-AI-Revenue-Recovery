from datetime import datetime, timezone
import uuid
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.promise_to_pay import PromiseToPay
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.policy.enums import AuditEventType, ActorType, CaseStatus, TransactionStatus
from app.services.audit_service import audit_service
from app.services.case_service import case_service

logger = logging.getLogger(__name__)

class P2PService:
    """
    Service Layer for Promise-to-Pay (P2P) Tracking & Verification Lifecycle.
    Status transitions: PROMISED -> P2P_KEPT or P2P_BROKEN.
    Only verified bank settlements count as P2P_KEPT; unverified retries do not count.
    """
    @staticmethod
    async def create_promise(
        db: AsyncSession,
        case_id: str,
        promised_amount: float,
        promised_date: datetime,
        notes: Optional[str] = None
    ) -> PromiseToPay:
        if promised_amount <= 0:
            raise ValueError("Promised amount must be greater than zero.")

        case = await case_service.get_case_by_id(db, case_id)
        if not case:
            raise ValueError(f"Recovery case '{case_id}' not found.")

        # Strip timezone if present to store clean naive UTC for SQLite
        if promised_date.tzinfo is not None:
            promised_date = promised_date.astimezone(timezone.utc).replace(tzinfo=None)

        promise = PromiseToPay(
            id=f"P2P-{uuid.uuid4().hex[:8]}",
            case_id=case.id,
            promised_amount=promised_amount,
            promised_date=promised_date,
            status="PROMISED",
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(promise)

        # Log P2P_CREATED Audit Event
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.P2P_CREATED.value,
            actor_type=ActorType.HUMAN.value,
            actor_id="P2P_TRACKER_AGENT",
            reason=f"Customer promise-to-pay recorded: ₹{promised_amount:,.2f} due by {promised_date.strftime('%Y-%m-%d')}",
            metadata_json={
                "promise_id": promise.id,
                "promised_amount": promised_amount,
                "promised_date": promised_date.isoformat(),
                "status": "PROMISED",
                "notes": notes
            }
        )

        await db.commit()
        await db.refresh(promise)
        return promise

    @staticmethod
    async def get_promises(db: AsyncSession, case_id: str) -> List[PromiseToPay]:
        query = select(PromiseToPay).where(PromiseToPay.case_id == case_id).order_by(desc(PromiseToPay.created_at))
        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    async def verify_promise(
        db: AsyncSession,
        case_id: str,
        promise_id: Optional[str] = None
    ) -> PromiseToPay:
        query = select(PromiseToPay).where(PromiseToPay.case_id == case_id)
        if promise_id:
            query = query.where(PromiseToPay.id == promise_id)
        query = query.order_by(desc(PromiseToPay.created_at))
        res = await db.execute(query)
        promises = list(res.scalars().all())

        if not promises:
            raise ValueError(f"No promise-to-pay commitment found for case '{case_id}'.")

        promise = promises[0]
        case = await case_service.get_case_by_id(db, case_id)

        # Log P2P_VERIFICATION_STARTED
        await audit_service.log_event(
            db=db,
            case_id=case_id,
            event_type=AuditEventType.P2P_VERIFICATION_STARTED.value,
            actor_type=ActorType.VERIFIER.value,
            actor_id="P2P_VERIFIER",
            reason=f"Verifying P2P commitment {promise.id} against gateway settlement ledger.",
            metadata_json={"promise_id": promise.id, "promised_amount": promise.promised_amount}
        )

        now = datetime.utcnow()
        # Fetch transaction status
        tx_query = select(Transaction).where(Transaction.id == case.source_id)
        tx_res = await db.execute(tx_query)
        tx = tx_res.scalar_one_or_none()

        is_verified_settlement = (
            case.status == CaseStatus.RECOVERED or
            case.verification_result == "VERIFIED_SUCCESS" or
            (case.amount_recovered or 0.0) >= promise.promised_amount or
            (tx and tx.status == TransactionStatus.SUCCESS)
        )

        old_status = promise.status
        if is_verified_settlement and now <= (promise.promised_date.replace(hour=23, minute=59, second=59)):
            promise.status = "P2P_KEPT"
            event_type = AuditEventType.P2P_KEPT.value
            reason_msg = f"Promise-to-pay {promise.id} VERIFIED KEPT: Bank gateway settlement confirmed ₹{promise.promised_amount:,.2f} prior to due date."
        elif is_verified_settlement:
            promise.status = "P2P_KEPT" # Fulfilled
            event_type = AuditEventType.P2P_KEPT.value
            reason_msg = f"Promise-to-pay {promise.id} VERIFIED KEPT: Settlement confirmed."
        elif now > promise.promised_date:
            promise.status = "P2P_BROKEN"
            event_type = AuditEventType.P2P_BROKEN.value
            reason_msg = f"Promise-to-pay {promise.id} BROKEN: Promised date ({promise.promised_date.strftime('%Y-%m-%d')}) passed without verified settlement."
        else:
            promise.status = "PROMISED"
            event_type = AuditEventType.P2P_VERIFICATION_STARTED.value
            reason_msg = f"Promise-to-pay {promise.id} ACTIVE: Awaiting settlement date ({promise.promised_date.strftime('%Y-%m-%d')})."

        promise.updated_at = now

        if promise.status != old_status:
            await audit_service.log_event(
                db=db,
                case_id=case_id,
                event_type=event_type,
                actor_type=ActorType.VERIFIER.value,
                actor_id="P2P_VERIFIER",
                reason=reason_msg,
                metadata_json={
                    "promise_id": promise.id,
                    "old_status": old_status,
                    "new_status": promise.status,
                    "verified_settlement": is_verified_settlement
                }
            )

        await db.commit()
        await db.refresh(promise)
        return promise

    @staticmethod
    async def update_promise(
        db: AsyncSession,
        case_id: str,
        promise_id: str,
        promised_amount: float,
        promised_date: datetime,
        notes: Optional[str] = None
    ) -> PromiseToPay:
        if promised_amount <= 0:
            raise ValueError("Promised amount must be greater than zero.")

        query = select(PromiseToPay).where(PromiseToPay.case_id == case_id, PromiseToPay.id == promise_id)
        res = await db.execute(query)
        promise = res.scalar_one_or_none()
        if not promise:
            # Fallback to latest promise for case
            latest_query = select(PromiseToPay).where(PromiseToPay.case_id == case_id).order_by(desc(PromiseToPay.created_at))
            latest_res = await db.execute(latest_query)
            promise = latest_res.scalars().first()

        if not promise:
            raise ValueError(f"Promise-to-pay commitment for case '{case_id}' not found.")

        if promised_date.tzinfo is not None:
            promised_date = promised_date.astimezone(timezone.utc).replace(tzinfo=None)

        promise.promised_amount = promised_amount
        promise.promised_date = promised_date
        if notes is not None:
            promise.notes = notes
        promise.updated_at = datetime.utcnow()

        await audit_service.log_event(
            db=db,
            case_id=case_id,
            event_type=AuditEventType.P2P_CREATED.value,
            actor_type=ActorType.HUMAN.value,
            actor_id="P2P_TRACKER_AGENT",
            reason=f"Customer promise-to-pay commitment updated: ₹{promised_amount:,.2f} due by {promised_date.strftime('%Y-%m-%d')}",
            metadata_json={
                "promise_id": promise.id,
                "promised_amount": promised_amount,
                "promised_date": promised_date.isoformat(),
                "notes": notes
            }
        )

        await db.commit()
        await db.refresh(promise)
        return promise

    @staticmethod
    async def delete_promise(
        db: AsyncSession,
        case_id: str,
        promise_id: Optional[str] = None
    ) -> bool:
        query = select(PromiseToPay).where(PromiseToPay.case_id == case_id)
        if promise_id:
            query = query.where(PromiseToPay.id == promise_id)
        res = await db.execute(query)
        promises = list(res.scalars().all())
        if not promises:
            return False

        for p in promises:
            await db.delete(p)

        await audit_service.log_event(
            db=db,
            case_id=case_id,
            event_type=AuditEventType.P2P_BROKEN.value,
            actor_type=ActorType.HUMAN.value,
            actor_id="P2P_TRACKER_AGENT",
            reason=f"Promise-to-pay commitment deleted/canceled for case {case_id}.",
            metadata_json={"case_id": case_id, "action": "DELETED"}
        )

        await db.commit()
        return True

p2p_service = P2PService()
