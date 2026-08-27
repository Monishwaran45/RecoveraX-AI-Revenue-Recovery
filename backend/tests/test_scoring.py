import pytest
from app.recovery.scoring import calculate_recovery_score
from app.policy.enums import PaymentState, DiagnosisType

def test_temporary_failure_high_score():
    score = calculate_recovery_score(
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value,
        successful_payment_count=10,
        failed_payment_count=0,
        average_delay_days=0.5,
        amount=2000.0,
        retry_count=0,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False
    )
    assert score >= 80

def test_ambiguous_payment_low_score():
    score = calculate_recovery_score(
        diagnosis=DiagnosisType.AMBIGUOUS_STATE.value,
        successful_payment_count=5,
        failed_payment_count=1,
        average_delay_days=1.0,
        amount=5000.0,
        retry_count=0,
        payment_state=PaymentState.AMBIGUOUS,
        possible_customer_debit=False,
        fraud_signal=False
    )
    assert score == 10

def test_fraud_signal_zero_score():
    score = calculate_recovery_score(
        diagnosis=DiagnosisType.FRAUD_RISK.value,
        successful_payment_count=15,
        failed_payment_count=0,
        average_delay_days=0.0,
        amount=1000.0,
        retry_count=0,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=True
    )
    assert score == 0
