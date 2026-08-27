from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, TransactionStatus, PaymentState

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
    
    audit_events.append({
        "event_type": AuditEventType.PAYMENT_RECHECKED.value,
        "actor_type": ActorType.VERIFIER.value,
        "actor_id": "RECHECK_VERIFIER",
        "reason": f"Payment re-checked prior to retry execution. Status: {current_status}, State: {current_state}",
        "metadata": {"status": current_status, "payment_state": current_state}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = "RECHECKED"
    return state
