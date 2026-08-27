import pytest
from app.simulator.payment import payment_simulator
from app.policy.enums import PolicyDecision, PaymentState, TransactionStatus

def test_simulator_executes_unblocked_retry():
    status, p_state, msg = payment_simulator.simulate_retry(
        transaction_id="TX-100",
        amount=2000.0,
        current_retry_count=0,
        policy_decision=PolicyDecision.AUTO,
        payment_state=PaymentState.CLEAR,
        failure_profile_id="TEMPORARY_BANK_ERROR"
    )
    assert status == TransactionStatus.SUCCESS
    assert p_state == PaymentState.CLEAR

def test_simulator_rejects_blocked_policy():
    with pytest.raises(ValueError, match="BLOCKED by policy"):
        payment_simulator.simulate_retry(
            transaction_id="TX-101",
            amount=25000.0,
            current_retry_count=0,
            policy_decision=PolicyDecision.BLOCK,
            payment_state=PaymentState.AMBIGUOUS,
            failure_profile_id="AMBIGUOUS_PAYMENT"
        )
