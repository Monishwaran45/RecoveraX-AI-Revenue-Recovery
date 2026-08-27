from app.agents.state import RecoveryState
from app.recovery.scoring import calculate_recovery_score
from app.recovery.expected_value import calculate_expected_recovery_value
from app.policy.enums import PaymentState, AuditEventType, ActorType

def calculate_score_node(state: RecoveryState) -> RecoveryState:
    """
    Node 3: Recovery Score
    Deterministic Python calculation (0–100).
    Do NOT ask Groq to calculate financial scores or values.
    """
    tx = state.get("transaction", {})
    cust = state.get("customer", {})
    
    score = calculate_recovery_score(
        diagnosis=state.get("diagnosis", "TEMPORARY_FAILURE"),
        successful_payment_count=cust.get("successful_payment_count", 0),
        failed_payment_count=cust.get("failed_payment_count", 0),
        average_delay_days=cust.get("average_payment_delay_days", 0.0),
        amount=tx.get("amount", 0.0),
        retry_count=tx.get("retry_count", 0),
        payment_state=PaymentState(tx.get("payment_state", "CLEAR")),
        possible_customer_debit=tx.get("possible_customer_debit", False),
        fraud_signal=tx.get("fraud_signal", False),
    )
    
    ev = calculate_expected_recovery_value(
        amount_at_risk=tx.get("amount", 0.0),
        recovery_score=score
    )
    
    state["recovery_score"] = score
    state["expected_recovery_value"] = ev
    
    audit_events = list(state.get("audit_events", []))
    audit_events.append({
        "event_type": AuditEventType.RECOVERY_SCORE_CALCULATED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "DETERMINISTIC_SCORING_ENGINE",
        "reason": f"Calculated recovery score {score}/100 and expected recovery value ₹{ev:,.2f}",
        "metadata": {"score": score, "expected_value": ev}
    })
    
    state["audit_events"] = audit_events
    return state
