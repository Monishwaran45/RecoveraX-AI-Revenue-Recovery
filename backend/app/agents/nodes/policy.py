from app.agents.state import RecoveryState
from app.policy.engine import policy_engine
from app.policy.enums import TransactionStatus, PaymentState, ActionType, RiskLevel, PolicyDecision, AuditEventType, ActorType

def policy_check_node(state: RecoveryState) -> RecoveryState:
    """
    Node 5: Policy Check
    Evaluates deterministic safety policy engine.
    Final authority over LLM.
    """
    tx = state.get("transaction", {})
    
    # Determine risk level
    amount = tx.get("amount", 0.0)
    score = state.get("recovery_score", 50)
    
    if tx.get("possible_customer_debit") or tx.get("fraud_signal") or tx.get("payment_state") == "AMBIGUOUS" or amount >= 25000:
        risk_level = RiskLevel.HIGH
    elif amount >= 5000 or score < 80:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW
        
    state["risk_level"] = risk_level.value
    
    rec_action_str = state.get("recommended_action", "RETRY")
    try:
        rec_action = ActionType(rec_action_str)
    except ValueError:
        rec_action = ActionType.RETRY

    eval_result = policy_engine.evaluate(
        transaction_status=TransactionStatus(tx.get("status", "FAILED")),
        payment_state=PaymentState(tx.get("payment_state", "CLEAR")),
        possible_customer_debit=tx.get("possible_customer_debit", False),
        fraud_signal=tx.get("fraud_signal", False),
        retry_count=tx.get("retry_count", 0),
        max_retries=state.get("max_retries", 2),
        action=rec_action,
        amount=amount,
        recovery_score=score,
        risk_level=risk_level,
        diagnosis=state.get("diagnosis", "TEMPORARY_FAILURE"),
    )
    
    state["policy_decision"] = eval_result.decision.value
    state["policy_reason"] = eval_result.reason
    state["rules_evaluated"] = eval_result.rules_evaluated
    
    audit_events = list(state.get("audit_events", []))
    
    if eval_result.decision == PolicyDecision.AUTO:
        event_type = AuditEventType.POLICY_APPROVED.value
    elif eval_result.decision == PolicyDecision.HUMAN:
        event_type = AuditEventType.HUMAN_APPROVAL_REQUIRED.value
    elif eval_result.decision == PolicyDecision.BLOCK:
        event_type = AuditEventType.ACTION_BLOCKED.value
    else:
        event_type = AuditEventType.RECOVERY_STOPPED.value

    audit_events.append({
        "event_type": event_type,
        "actor_type": ActorType.POLICY.value,
        "actor_id": "DETERMINISTIC_POLICY_ENGINE",
        "reason": f"Policy evaluated decision {eval_result.decision.value}: {eval_result.reason}",
        "metadata": {"decision": eval_result.decision.value, "rules": eval_result.rules_evaluated}
    })
    
    state["audit_events"] = audit_events
    return state
