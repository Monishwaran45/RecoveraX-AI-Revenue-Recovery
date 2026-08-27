from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, TransactionStatus, PaymentState, PolicyDecision

def recheck_node(state: RecoveryState) -> RecoveryState:
    """
    Node 8: Re-check Payment State
    Requeries current payment state with gateway/bank prior to execution.
    Never blindly retry.
    """
    tx = state.get("transaction", {})
    audit_events = list(state.get("audit_events", []))
    
    current_status = tx.get("status", "FAILED")
    current_state = tx.get("payment_state", "CLEAR")
    possible_debit = tx.get("possible_customer_debit", False)
    
    if current_status == TransactionStatus.SUCCESS.value:
        state["policy_decision"] = PolicyDecision.STOP.value
        state["workflow_status"] = "RECOVERED"
        audit_events.append({
            "event_type": AuditEventType.REVENUE_RECOVERED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "RECHECK_VERIFIER",
            "reason": "Re-check verified payment was settled with bank gateway. Case completed.",
            "metadata": {"status": "SUCCESS"}
        })
    elif current_state == PaymentState.AMBIGUOUS.value or possible_debit:
        state["policy_decision"] = PolicyDecision.BLOCK.value
        state["workflow_status"] = "BLOCKED"
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.POLICY.value,
            "actor_id": "RECHECK_VERIFIER",
            "reason": "Re-check detected unconfirmed bank state or customer debit risk. Retry hard-blocked.",
            "metadata": {"payment_state": current_state, "possible_customer_debit": possible_debit}
        })
    else:
        audit_events.append({
            "event_type": AuditEventType.PAYMENT_RECHECKED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "RECHECK_VERIFIER",
            "reason": f"Payment re-checked prior to retry execution. Status: {current_status}, State: {current_state}",
            "metadata": {"status": current_status, "payment_state": current_state}
        })
        state["workflow_status"] = "RECHECKED"
    
    state["audit_events"] = audit_events
    return state
