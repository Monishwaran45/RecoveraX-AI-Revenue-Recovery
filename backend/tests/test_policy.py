import pytest
from app.policy.engine import policy_engine
from app.policy.enums import TransactionStatus, PaymentState, ActionType, RiskLevel, PolicyDecision

def test_low_value_retry_auto():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=85,
        risk_level=RiskLevel.LOW,
        diagnosis="TEMPORARY_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.AUTO

def test_high_value_retry_human():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=75000.0,
        recovery_score=85,
        risk_level=RiskLevel.MEDIUM,
        diagnosis="TEMPORARY_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.HUMAN

def test_ambiguous_payment_block():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.AMBIGUOUS,
        payment_state=PaymentState.AMBIGUOUS,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=80,
        risk_level=RiskLevel.HIGH,
        diagnosis="AMBIGUOUS_STATE"
    )
    assert eval_res.decision == PolicyDecision.BLOCK

def test_possible_customer_debit_block():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=True,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=80,
        risk_level=RiskLevel.HIGH,
        diagnosis="TEMPORARY_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.BLOCK

def test_fraud_signal_block():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=True,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=80,
        risk_level=RiskLevel.HIGH,
        diagnosis="FRAUD_RISK"
    )
    assert eval_res.decision == PolicyDecision.BLOCK

def test_permanent_failure_stop():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=80,
        risk_level=RiskLevel.LOW,
        diagnosis="PERMANENT_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.STOP

def test_max_retries_stop():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=2,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=80,
        risk_level=RiskLevel.LOW,
        diagnosis="TEMPORARY_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.STOP

def test_already_successful_stop():
    eval_res = policy_engine.evaluate(
        transaction_status=TransactionStatus.SUCCESS,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=2000.0,
        recovery_score=90,
        risk_level=RiskLevel.LOW,
        diagnosis="TEMPORARY_FAILURE"
    )
    assert eval_res.decision == PolicyDecision.STOP
