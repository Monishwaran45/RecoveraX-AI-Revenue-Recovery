from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, TransactionStatus, CaseStatus
from app.recovery.expected_value import calculate_actual_net_recovery_value

def verify_node(state: RecoveryState) -> RecoveryState:
    """
    Node 10: Outcome Verifier
    Verifies transaction status after execution.
    Only counts recovered revenue when bank gateway confirms VERIFIED_SUCCESS.
    """
    tx = state.get("transaction", {})
    audit_events = list(state.get("audit_events", []))
    
    exec_result = state.get("execution_result")
    amount = tx.get("amount", 0.0)
    retry_count = tx.get("retry_count", 1)
    
    if exec_result == TransactionStatus.SUCCESS.value:
        state["verification_result"] = "VERIFIED_SUCCESS"
        state["amount_recovered"] = amount
        net_rec = calculate_actual_net_recovery_value(
            amount_recovered=amount,
            retry_attempts=retry_count,
            communication_channel=state.get("recommended_action", "RETRY"),
            human_reviewed=state.get("forced_human", False)
        )
        state["net_amount_recovered"] = net_rec
        state["workflow_status"] = CaseStatus.RECOVERED.value
        
        audit_events.append({
            "event_type": AuditEventType.PAYMENT_VERIFIED.value,
            "actor_type": ActorType.VERIFIER.value,
            "actor_id": "BANK_SETTLEMENT_VERIFIER",
            "reason": f"Payment verified & settled by bank gateway. ₹{amount:,.2f} deposited (Net Recovered: ₹{net_rec:,.2f}).",
            "metadata": {"amount_recovered": amount, "net_amount_recovered": net_rec}
        })
        audit_events.append({
            "event_type": AuditEventType.REVENUE_RECOVERED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "REVENUE_RECOVERY_ENGINE",
            "reason": f"Case successfully resolved with ₹{amount:,.2f} verified gross (₹{net_rec:,.2f} net) recovered revenue.",
            "metadata": {"amount_recovered": amount, "net_amount_recovered": net_rec}
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
