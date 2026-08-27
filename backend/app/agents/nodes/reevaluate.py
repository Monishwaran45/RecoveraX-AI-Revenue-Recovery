from app.agents.state import RecoveryState
from app.recovery.stopping import should_stop_case
from app.policy.enums import TransactionStatus, PaymentState, CaseStatus

def reevaluate_node(state: RecoveryState) -> RecoveryState:
    """
    Node 12: Re-evaluate Case
    Evaluates stopping rules after a payment attempt.
    """
    tx = state.get("transaction", {})
    
    stop, reason = should_stop_case(
        transaction_status=TransactionStatus(tx.get("status", "FAILED")),
        payment_state=PaymentState(tx.get("payment_state", "CLEAR")),
        retry_count=state.get("retry_count", 0),
        max_retries=state.get("max_retries", 2),
        possible_customer_debit=tx.get("possible_customer_debit", False),
        fraud_signal=tx.get("fraud_signal", False),
        diagnosis=state.get("diagnosis", "TEMPORARY_FAILURE"),
        human_decision=state.get("human_decision")
    )
    
    if stop:
        state["workflow_status"] = CaseStatus.STOPPED.value
        state["policy_reason"] = reason
    else:
        state["workflow_status"] = CaseStatus.OPEN.value
        
    return state
