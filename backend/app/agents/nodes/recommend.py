import json
import logging
from app.agents.state import RecoveryState
from app.agents.llm import get_groq_llm
from app.agents.prompts import SYSTEM_RECOMMENDATION_PROMPT
from app.policy.enums import ActionType, AuditEventType, ActorType

logger = logging.getLogger(__name__)

def recommend_action_node(state: RecoveryState) -> RecoveryState:
    """
    Node 4: Recommend Action
    Uses Groq LLM to recommend action (RETRY, REMIND, ESCALATE, STOP).
    If Groq fails/invalid -> fallback RETRY, audit event, route to HUMAN.
    """
    llm = get_groq_llm()
    audit_events = list(state.get("audit_events", []))
    
    tx = state.get("transaction", {})
    
    if not llm:
        state["recommended_action"] = ActionType.RETRY.value
        state["delay_minutes"] = 30
        state["reason"] = "LLM unavailable; using default RETRY recommendation for policy evaluation"
        audit_events.append({
            "event_type": AuditEventType.ACTION_RECOMMENDED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "FALLBACK_ENGINE",
            "reason": "LLM missing; using fallback recommendation RETRY",
            "metadata": {"fallback": True}
        })
        state["audit_events"] = audit_events
        return state

    context_str = json.dumps({
        "diagnosis": state.get("diagnosis"),
        "recovery_score": state.get("recovery_score"),
        "transaction_amount": tx.get("amount"),
        "retry_count": tx.get("retry_count"),
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

        # Enforce action enum validity
        if action_str not in [a.value for a in ActionType]:
            action_str = ActionType.RETRY.value

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
    except Exception as e:
        logger.error(f"Error during LLM action recommendation: {str(e)}", exc_info=True)
        state["recommended_action"] = ActionType.RETRY.value
        state["delay_minutes"] = 30
        state["reason"] = f"LLM Recommendation exception: {str(e)}"
        
        audit_events.append({
            "event_type": AuditEventType.LLM_OUTPUT_INVALID.value,
            "actor_type": ActorType.AI.value,
            "actor_id": "GROQ_LLM",
            "reason": f"LLM action recommendation failed ({str(e)}). Routing to HUMAN review.",
            "metadata": {"error": str(e)}
        })

    state["audit_events"] = audit_events
    return state
