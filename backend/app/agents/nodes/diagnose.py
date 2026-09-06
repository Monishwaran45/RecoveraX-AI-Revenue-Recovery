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
        logger.info("LLM unavailable. Executing deterministic root-cause diagnostic engine.")
        fail_reason = str(tx.get("failure_reason", "")).upper()
        p_state = str(tx.get("payment_state", "CLEAR")).upper()
        is_debit = tx.get("possible_customer_debit", False)
        is_fraud = tx.get("fraud_signal", False)

        if is_fraud or "FRAUD" in fail_reason or "HIGH_RISK" in fail_reason:
            state["diagnosis"] = DiagnosisType.FRAUD_RISK.value
            state["diagnosis_confidence"] = 0.95
            state["diagnosis_reason"] = "Security telemetry detected fraud risk or high-risk IP. Policy safety halt required."
            state["forced_human"] = False
        elif p_state == "AMBIGUOUS" or is_debit or "DROPPED_MID" in fail_reason:
            state["diagnosis"] = DiagnosisType.AMBIGUOUS_STATE.value
            state["diagnosis_confidence"] = 0.90
            state["diagnosis_reason"] = "Ambiguous payment state or possible customer debit detected. Retry blocked to prevent duplicate debit."
            state["forced_human"] = False
        elif "INSUFFICIENT" in fail_reason:
            state["diagnosis"] = DiagnosisType.INSUFFICIENT_FUNDS.value
            state["diagnosis_confidence"] = 0.95
            state["diagnosis_reason"] = "Customer account balance reload required. Align retry with liquidity window."
            state["forced_human"] = False
        elif fail_reason in ("ACCOUNT_CLOSED", "INVALID_CARD", "PERMANENT_HARD_DECLINE"):
            state["diagnosis"] = DiagnosisType.PERMANENT_FAILURE.value
            state["diagnosis_confidence"] = 0.98
            state["diagnosis_reason"] = "Permanent payment method failure. Customer must update payment details."
            state["forced_human"] = False
        elif "INVOICE" in fail_reason or "OVERDUE" in fail_reason or "RECEIVABLE" in fail_reason:
            state["diagnosis"] = DiagnosisType.OVERDUE_RECEIVABLE.value
            state["diagnosis_confidence"] = 0.90
            state["diagnosis_reason"] = "Receivable past due date. Structured reminder and operator escalation recommended."
            state["forced_human"] = False
        elif "SESSION" in fail_reason or "OTP" in fail_reason or "AUTH_FAILED" in fail_reason or "ABANDON" in fail_reason:
            state["diagnosis"] = DiagnosisType.CUSTOMER_ACTION_REQUIRED.value
            state["diagnosis_confidence"] = 0.85
            state["diagnosis_reason"] = "Customer authentication expired or abandoned. Automated reminder recommended."
            state["forced_human"] = False
        elif fail_reason in ("TEMPORARY_BANK_ERROR", "GATEWAY_TIMEOUT", "BANK_SYSTEM_OFFLINE", "NETWORK_TIMEOUT", "CARD_EXPIRED_MANDATE", "HIGH_VALUE_RETRY_LIMIT"):
            state["diagnosis"] = DiagnosisType.TEMPORARY_FAILURE.value
            state["diagnosis_confidence"] = 0.95
            state["diagnosis_reason"] = f"Temporary bank gateway decline ('{fail_reason}'). Bounded retry recommended."
            state["forced_human"] = False
        else:
            state["diagnosis"] = DiagnosisType.TEMPORARY_FAILURE.value
            state["diagnosis_confidence"] = 0.0
            state["diagnosis_reason"] = f"LLM unavailable for unclassified failure code ('{fail_reason}'); fail-closed safety forced HUMAN review."
            state["forced_human"] = True


        audit_events.append({
            "event_type": AuditEventType.AI_DIAGNOSED.value,
            "actor_type": ActorType.POLICY.value,
            "actor_id": "DETERMINISTIC_DIAGNOSTIC_ENGINE",
            "reason": state["diagnosis_reason"],
            "metadata": {"confidence": state["diagnosis_confidence"], "diagnosis": state["diagnosis"]}
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
        
        if not isinstance(data, dict):
            raise ValueError("LLM response JSON is not an object/dictionary")

        raw_diag = str(data.get("diagnosis", "")).upper().strip()
        valid_enum_names = [d.name for d in DiagnosisType] + [d.value for d in DiagnosisType]
        
        if raw_diag in valid_enum_names:
            diagnosis_str = raw_diag
            confidence_val = float(data.get("confidence", 0.8))
        else:
            # Hallucinated or unrecognized diagnosis -> force UNKNOWN with 0.0 confidence
            logger.warning(f"Unrecognized/hallucinated diagnosis from LLM: '{raw_diag}'. Falling back to UNKNOWN with 0.0 confidence.")
            diagnosis_str = DiagnosisType.UNKNOWN.value
            confidence_val = 0.0
            state["forced_human"] = True
            state["llm_fallback"] = True
            audit_events.append({
                "event_type": AuditEventType.LLM_OUTPUT_INVALID.value,
                "actor_type": ActorType.AI.value,
                "actor_id": "GROQ_LLM",
                "reason": f"Unrecognized/hallucinated LLM diagnosis ('{raw_diag}'). Setting confidence=0.0 and forcing HUMAN review.",
                "metadata": {"raw_diagnosis": raw_diag}
            })

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
