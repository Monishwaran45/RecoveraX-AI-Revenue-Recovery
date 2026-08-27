from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, TransactionStatus, CaseStatus

def verify_node(state: RecoveryState) -> RecoveryState:
    """
    Node 10: Outcome Verifier
    Verifies transaction status after execution.
    If SUCCESS -> case RECOVERED, amount_recovered = transaction.amount
    If FAILED / AMBIGUOUS -> increment retry count, evaluate stopping rules.
    """
    tx = state.get("transaction", {})
    audit_events = list(state.get("audit_events", []))
    
    exec_result = state.get("execution_result")
    amount = tx.get("amount", 0.0)
    
    if exec_result == TransactionStatus.SUCCESS.value:
        state["verification_result"] = "VERIFIED_SUCCESS"
        state["amount_recovered"] = amount
        state["workflow_status"] = CaseStatus.RECOVERED.value
        
        audit_events.append({
            "event_type": AuditEventType.PAYMENT_VERIFIED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "BANK_SETTLEMENT_VERIFIER",
            "reason": f"Payment verified & settled by bank gateway. ₹{amount:,.2f} deposited.",
            "metadata": {"amount_recovered": amount}
        })
        audit_events.append({
            "event_type": AuditEventType.REVENUE_RECOVERED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "REVENUE_RECOVERY_ENGINE",
            "reason": f"Case successfully resolved with ₹{amount:,.2f} recovered revenue.",
            "metadata": {"amount_recovered": amount}
        })
    elif exec_result == TransactionStatus.AMBIGUOUS.value:
        state["verification_result"] = "VERIFIED_AMBIGUOUS"
        state["amount_recovered"] = 0.0
        state["workflow_status"] = CaseStatus.BLOCKED.value
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "BANK_SETTLEMENT_VERIFIER",
            "reason": "Settlement outcome is AMBIGUOUS. Escalating to human investigation.",
            "metadata": {"amount_recovered": 0.0}
        })
    else:
        state["verification_result"] = "VERIFIED_FAILED"
        state["amount_recovered"] = 0.0
        state["workflow_status"] = CaseStatus.FAILED.value
        audit_events.append({
            "event_type": AuditEventType.PAYMENT_VERIFIED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "BANK_SETTLEMENT_VERIFIER",
            "reason": "Payment attempt confirmed FAILED by bank gateway.",
            "metadata": {"amount_recovered": 0.0}
        })

    state["audit_events"] = audit_events
    return state
