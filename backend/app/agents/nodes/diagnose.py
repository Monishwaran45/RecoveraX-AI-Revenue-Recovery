import json
import logging
from app.agents.state import RecoveryState
from app.agents.llm import get_groq_llm
from app.agents.prompts import SYSTEM_DIAGNOSIS_PROMPT
from app.policy.enums import DiagnosisType, AuditEventType, ActorType

logger = logging.getLogger(__name__)

def diagnose_node(state: RecoveryState) -> RecoveryState:
    """
    Node 2: Diagnose
    Uses Groq LLM to classify root cause. Parses JSON response.
    If Groq fails/invalid -> audit LLM_OUTPUT_INVALID, force confidence=0.0 and route to HUMAN.
    """
    llm = get_groq_llm()
    audit_events = list(state.get("audit_events", []))
    
    tx = state.get("transaction", {})
    cust = state.get("customer", {})
    
    if not llm:
        logger.warning("No LLM available. Setting confidence to 0.0 to force fail-closed HUMAN routing.")
        state["diagnosis"] = DiagnosisType.TEMPORARY_FAILURE.value
        state["diagnosis_confidence"] = 0.0
        state["diagnosis_reason"] = "LLM unavailable; fail-closed safety routing to HUMAN"
        state["forced_human"] = True
        
        audit_events.append({
            "event_type": AuditEventType.LLM_OUTPUT_INVALID.value,
            "actor_type": ActorType.AI.value,
            "actor_id": "GROQ_LLM",
            "reason": "GROQ_API_KEY missing or ChatGroq unavailable. Fail-closed safety forced HUMAN review.",
            "metadata": {"fallback": True}
        })
        state["audit_events"] = audit_events
        return state

    context_str = json.dumps({
        "transaction_amount": tx.get("amount"),
        "failure_reason": tx.get("failure_reason"),
        "payment_state": tx.get("payment_state"),
        "possible_customer_debit": tx.get("possible_customer_debit"),
        "fraud_signal": tx.get("fraud_signal"),
        "customer_successful_payments": cust.get("successful_payment_count"),
        "customer_failed_payments": cust.get("failed_payment_count"),
    }, indent=2)

    prompt = SYSTEM_DIAGNOSIS_PROMPT.format(context=context_str) + "\n\nRespond ONLY with a valid JSON object matching this schema: {\"diagnosis\": \"<ENUM>\", \"confidence\": <float>, \"reason\": \"<string>\"}"
    
    try:
        res = llm.invoke(prompt)
        content = res.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
        
        raw_diag = data.get("diagnosis", "TEMPORARY_FAILURE").upper()
        # Validate against DiagnosisType enum
        if hasattr(DiagnosisType, raw_diag):
            diagnosis_str = raw_diag
        else:
            diagnosis_str = DiagnosisType.TEMPORARY_FAILURE.value

        confidence_val = float(data.get("confidence", 0.8))
        reason_str = str(data.get("reason", "AI Diagnosis Completed"))

        state["diagnosis"] = diagnosis_str
        state["diagnosis_confidence"] = confidence_val
        state["diagnosis_reason"] = reason_str
        
        audit_events.append({
            "event_type": AuditEventType.AI_DIAGNOSED.value,
            "actor_type": ActorType.AI.value,
            "actor_id": "GROQ_LLM",
            "reason": f"AI Diagnosed root cause as {diagnosis_str}: {reason_str}",
            "metadata": {"confidence": confidence_val, "diagnosis": diagnosis_str}
        })
    except Exception as e:
        logger.error(f"Error during LLM diagnosis: {str(e)}. Defaulting to fail-closed HUMAN routing.", exc_info=True)
        state["diagnosis"] = DiagnosisType.TEMPORARY_FAILURE.value
        state["diagnosis_confidence"] = 0.0
        state["diagnosis_reason"] = "LLM evaluation unavailable; fail-closed safety forced HUMAN review."
        state["forced_human"] = True
        
        audit_events.append({
            "event_type": AuditEventType.LLM_OUTPUT_INVALID.value,
            "actor_type": ActorType.AI.value,
            "actor_id": "GROQ_LLM",
            "reason": f"LLM diagnosis exception: {str(e)}. Fail-closed safety forced HUMAN review.",
            "metadata": {"error": str(e)}
        })

    state["audit_events"] = audit_events
    return state
