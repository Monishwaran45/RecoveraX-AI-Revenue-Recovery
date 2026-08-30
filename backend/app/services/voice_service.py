import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.recovery_case import RecoveryCase
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.policy.enums import CaseStatus, PolicyDecision, AuditEventType, ActorType, PaymentState
from app.integrations.sarvam import generate_hinglish_voice_script, synthesize_hinglish_audio
from app.services.audit_service import audit_service
from app.services.case_service import case_service

logger = logging.getLogger(__name__)

class VoiceService:
    """
    Service Layer for Sarvam AI Hinglish Voice Recovery Interactions.
    Ensures full compliance with deterministic financial safety policy engine.
    """
    @staticmethod
    async def dispatch_voice_call(
        db: AsyncSession,
        case_id: str,
        custom_intent: Optional[str] = None
    ) -> Dict[str, Any]:
        case = await case_service.get_case_by_id(db, case_id)
        if not case:
            raise ValueError(f"Recovery case '{case_id}' not found.")

        # Strict Policy Gate: Check if payment state is blocked or ambiguous
        is_blocked = (
            case.policy_decision == PolicyDecision.BLOCK or 
            case.status == CaseStatus.BLOCKED or 
            case.verification_result == "BLOCKED"
        )
        if is_blocked:
            await audit_service.log_event(
                db=db,
                case_id=case.id,
                event_type=AuditEventType.VOICE_CALL_FAILED.value,
                actor_type=ActorType.POLICY.value,
                actor_id="DETERMINISTIC_POLICY_ENGINE",
                reason="Voice recovery call prohibited by safety guardrail policy (ambiguous or blocked payment state).",
                metadata_json={"policy_decision": "BLOCK", "reason": "Ambiguous/Blocked payment state"}
            )
            await db.commit()
            return {
                "case_id": case.id,
                "status": "BLOCKED",
                "voice_mode": "BLOCKED",
                "script": "Voice interaction blocked to protect customer account from ambiguous payment state.",
                "message": "Action prohibited by deterministic policy guardrails.",
                "policy_blocked": True
            }

        # Log VOICE_CALL_REQUESTED
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.VOICE_CALL_REQUESTED.value,
            actor_type=ActorType.HUMAN.value,
            actor_id="VOICE_RECOVERY_AGENT",
            reason=f"Hinglish voice recovery intervention requested for case {case.id}",
            metadata_json={"custom_intent": custom_intent}
        )

        cust_name = case.customer.name if case.customer else "Customer"
        amt = case.amount_at_risk or 0.0
        prob_type = case.problem_type.value if hasattr(case.problem_type, "value") else str(case.problem_type)

        # Generate Hinglish script
        script = generate_hinglish_voice_script(
            customer_name=cust_name,
            amount=amt,
            problem_type=prob_type,
            custom_intent=custom_intent
        )

        # Synthesize Audio via Sarvam AI Client
        voice_result = synthesize_hinglish_audio(script)

        # Log VOICE_CALL_DISPATCHED
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.VOICE_CALL_DISPATCHED.value,
            actor_type=ActorType.AI.value,
            actor_id="SARVAM_AI_VOICE_ENGINE",
            reason=f"Sarvam AI Voice intervention audio payload synthesized in {voice_result['mode']} mode.",
            metadata_json={
                "mode": voice_result["mode"],
                "provider": voice_result["provider"],
                "language_code": voice_result.get("language_code", "hi-IN"),
                "speaker": voice_result.get("speaker", "priya")
            }
        )

        # Log VOICE_CALL_COMPLETED (Synthesis complete & payload ready for telephony dispatch)
        await audit_service.log_event(
            db=db,
            case_id=case.id,
            event_type=AuditEventType.VOICE_CALL_COMPLETED.value,
            actor_type=ActorType.SYSTEM.value,
            actor_id="SARVAM_AI_VOICE_ENGINE",
            reason=f"Hinglish AI voice intervention audio payload synthesized ({voice_result['mode']} mode) & ready for telephony dispatch.",
            metadata_json={"status": voice_result["status"], "mode": voice_result["mode"]}
        )

        await db.commit()

        return {
            "case_id": case.id,
            "status": "SYNTHESIZED",
            "voice_mode": voice_result["mode"],
            "provider": voice_result["provider"],
            "script": script,
            "audio_available": voice_result.get("audio_available", True),
            "audio_url": voice_result.get("audio_url"),
            "audio_b64": voice_result.get("audio_b64"),
            "message": voice_result.get("message"),
            "policy_blocked": False
        }

voice_service = VoiceService()
