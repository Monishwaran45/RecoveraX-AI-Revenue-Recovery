import pytest
from datetime import datetime
from app.policy.mandate_sequencer import MandateSequencer, MandateSequencePlan
from app.policy.rules import evaluate_policy_rules
from app.policy.enums import TransactionStatus, PaymentState, ActionType, RiskLevel

def test_is_mandate_payment():
    assert MandateSequencer.is_mandate_payment("NACH") is True
    assert MandateSequencer.is_mandate_payment("E_MANDATE") is True
    assert MandateSequencer.is_mandate_payment("UPI_AUTOPAY") is True
    assert MandateSequencer.is_mandate_payment("CARD") is False
    assert MandateSequencer.is_mandate_payment("") is False

def test_mandate_presentation_window_calculation():
    plan = MandateSequencer.calculate_presentation_window(
        payment_method="NACH",
        diagnosis="INSUFFICIENT_FUNDS",
        retry_count=0,
        ref_time=datetime(2026, 8, 25, 10, 0, 0)
    )
    
    assert plan.is_mandate is True
    assert plan.payment_method == "NACH"
    assert plan.recommended_delay_minutes >= 2880 # 48 hours minimum
    assert "NPCI" in plan.target_batch_cycle
    assert plan.bounce_fee_protection_applied is True

def test_mandate_cooloff_policy_rule():
    eval_result = evaluate_policy_rules(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=2,
        action=ActionType.RETRY,
        amount=1000.0,
        recovery_score=85,
        risk_level=RiskLevel.LOW,
        diagnosis="INSUFFICIENT_FUNDS",
        payment_method="NACH"
    )
    
    rule_names = [r["rule"] for r in eval_result.rules_evaluated]
    assert "MANDATE_COOLOFF_PROTECTION" in rule_names
