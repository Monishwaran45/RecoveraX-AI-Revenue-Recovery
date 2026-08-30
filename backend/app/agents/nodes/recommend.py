import json
import logging
from app.agents.state import RecoveryState
from app.agents.llm import get_groq_llm
from app.agents.prompts import SYSTEM_RECOMMENDATION_PROMPT
from app.policy.enums import ActionType, AuditEventType, ActorType
from app.policy.mandate_sequencer import MandateSequencer

logger = logging.getLogger(__name__)

def recommend_action_node(state: RecoveryState) -> RecoveryState:
    """
    Node 4: Recommend Action
    Uses Groq LLM to recommend action (RETRY, REMIND, ESCALATE, STOP).
    If transaction payment method is NACH / E-Mandate / UPI Autopay,
    applies the specialized Mandate Retry Sequencer presentation window.
    """
    llm = get_groq_llm()
    audit_events = list(state.get("audit_events", []))
    
    tx = state.get("transaction", {})
    payment_method = tx.get("payment_method", "CARD")
    diagnosis = state.get("diagnosis", "")
    retry_count = tx.get("retry_count", 0)

    if not llm:
        action_str = ActionType.RETRY.value
        delay_val = 30
        reason_str = "LLM unavailable; using default RETRY recommendation for policy evaluation"
    else:
        context_str = json.dumps({
            "diagnosis": diagnosis,
            "recovery_score": state.get("recovery_score"),
            "transaction_amount": tx.get("amount"),
            "payment_method": payment_method,
            "retry_count": retry_count,
            "payment_state": tx.get("payment_state"),
        }, indent=2)

        prompt = SYSTEM_RECOMMENDATION_PROMPT.format(context=context_str) + "\n\nRespond ONLY with a valid JSON object matching this schema: {\"recommended_action\": \"<ENUM>\", \"delay_minutes\": <int>, \"reason\": \"<string>\"}"

        try:
            res = llm.invoke(prompt)
            content = res.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            data = json.loads(content)
            
            action_str = str(data.get("recommended_action", "RETRY")).upper()
            delay_val = int(data.get("delay_minutes", 30))
            reason_str = str(data.get("reason", "AI Action Recommended"))

            if action_str not in [a.value for a in ActionType]:
                action_str = ActionType.RETRY.value
                state["forced_human"] = True
                state["recommendation_invalid"] = True
        except Exception as e:
            logger.error(f"Error during LLM action recommendation: {str(e)}", exc_info=True)
            action_str = ActionType.RETRY.value
            delay_val = 30
            reason_str = "AI recommendation fallback: RETRY action evaluated under safety policy rules."
            state["forced_human"] = True
            audit_events.append({
                "event_type": AuditEventType.LLM_OUTPUT_INVALID.value,
                "actor_type": ActorType.AI.value,
                "actor_id": "GROQ_LLM",
                "reason": f"LLM action recommendation failed ({str(e)}). Routing to HUMAN review.",
                "metadata": {"error": str(e)}
            })

    # Apply Mandate Retry Sequencer if payment is NACH / E-Mandate / UPI Autopay
    if MandateSequencer.is_mandate_payment(payment_method) and action_str in (ActionType.RETRY.value, ActionType.REMIND.value):
        plan = MandateSequencer.calculate_presentation_window(
            payment_method=payment_method,
            diagnosis=diagnosis,
            retry_count=retry_count
        )
        delay_val = plan.recommended_delay_minutes
        reason_str = f"[Mandate Retry Sequencer] {plan.mandate_retry_reason}"
        state["is_mandate"] = True
        state["mandate_sequence_plan"] = {
            "target_batch_cycle": plan.target_batch_cycle,
            "salary_window_aligned": plan.salary_window_aligned,
            "bounce_fee_protection_applied": plan.bounce_fee_protection_applied,
            "mandate_retry_reason": plan.mandate_retry_reason,
            "recommended_delay_minutes": plan.recommended_delay_minutes
        }
        audit_events.append({
            "event_type": AuditEventType.ACTION_RECOMMENDED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "MANDATE_RETRY_SEQUENCER",
            "reason": f"Mandate Sequencer calculated optimal clearing window: {plan.target_batch_cycle} ({plan.recommended_delay_minutes // 60}h delay)",
            "metadata": {
                "payment_method": payment_method,
                "target_batch_cycle": plan.target_batch_cycle,
                "salary_window_aligned": plan.salary_window_aligned,
                "bounce_fee_protection_applied": plan.bounce_fee_protection_applied
            }
        })
    else:
        state["is_mandate"] = False

    state["recommended_action"] = action_str
    state["delay_minutes"] = delay_val
    state["reason"] = reason_str
    
    audit_events.append({
        "event_type": AuditEventType.ACTION_RECOMMENDED.value,
        "actor_type": ActorType.AI.value,
        "actor_id": "GROQ_LLM",
        "reason": f"AI Recommended action {action_str} with delay {delay_val}m: {reason_str}",
        "metadata": {"action": action_str, "delay": delay_val}
    })

    state["audit_events"] = audit_events
    return state

