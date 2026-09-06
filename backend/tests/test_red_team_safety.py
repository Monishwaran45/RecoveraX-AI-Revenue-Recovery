# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
import concurrent.futures
from app.policy.enums import PolicyDecision, ActionType, PaymentState, TransactionStatus, RiskLevel, DiagnosisType
from app.policy.engine import policy_engine
from app.agents.nodes.diagnose import diagnose_node
from app.agents.nodes.recommend import recommend_action_node

def test_redteam_1_duplicate_payment_double_debit_protection():
    """
    Red-Team Attack 1: Duplicate Payment / Double Debit Attack.
    Attempts to force auto-retry when possible_customer_debit is True or payment_state is AMBIGUOUS.
    Must return PolicyDecision.BLOCK every time.
    """
    eval_debit = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=True,  # Customer debit signal
        fraud_signal=False,
        retry_count=0,
        max_retries=3,
        action=ActionType.RETRY,
        amount=1500.0,
        recovery_score=95,
        risk_level=RiskLevel.LOW,
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
    )
    assert eval_debit.decision == PolicyDecision.BLOCK
    assert "POSSIBLE_CUSTOMER_DEBIT" in eval_debit.rules_evaluated[0]["rule"]

    eval_ambig = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.AMBIGUOUS,  # Ambiguous payment state
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=3,
        action=ActionType.RETRY,
        amount=1500.0,
        recovery_score=95,
        risk_level=RiskLevel.LOW,
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
    )
    assert eval_ambig.decision == PolicyDecision.BLOCK
    assert "AMBIGUOUS_PAYMENT" in eval_ambig.rules_evaluated[0]["rule"]

def test_redteam_2_concurrent_race_condition_requests():
    """
    Red-Team Attack 2: Concurrent Race Condition Attack.
    Simulates 50 parallel requests firing auto-retry evaluations for the same payment state.
    Verifies thread safety and deterministic policy evaluation consistency.
    """
    def run_eval(i):
        return policy_engine.evaluate(
            transaction_status=TransactionStatus.FAILED,
            payment_state=PaymentState.AMBIGUOUS if i % 2 == 0 else PaymentState.CLEAR,
            possible_customer_debit=(i % 2 == 0),
            fraud_signal=False,
            retry_count=0,
            max_retries=3,
            action=ActionType.RETRY,
            amount=2500.0,
            recovery_score=90,
            risk_level=RiskLevel.LOW,
            diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(run_eval, range(50)))

    assert len(results) == 50
    for i, r in enumerate(results):
        if i % 2 == 0:
            assert r.decision == PolicyDecision.BLOCK
        else:
            assert r.decision == PolicyDecision.AUTO

def test_redteam_3_stale_transaction_state():
    """
    Red-Team Attack 3: Stale State Attack.
    Attempting auto-retry on a transaction that has already transitioned to SUCCESS concurrently.
    Must return PolicyDecision.STOP.
    """
    eval_stale = policy_engine.evaluate(
        transaction_status=TransactionStatus.SUCCESS,  # Concurrently resolved
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=3,
        action=ActionType.RETRY,
        amount=5000.0,
        recovery_score=90,
        risk_level=RiskLevel.LOW,
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
    )
    assert eval_stale.decision == PolicyDecision.STOP
    assert "ALREADY_SUCCESSFUL" in eval_stale.rules_evaluated[0]["rule"]

def test_redteam_4_high_risk_fraud_signal_injection():
    """
    Red-Team Attack 4: Fraud Signal Injection.
    Attempts to trigger auto-retry on high-risk or fraud-flagged transactions.
    Must return PolicyDecision.BLOCK.
    """
    eval_fraud = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=True,  # High risk fraud signal
        retry_count=0,
        max_retries=3,
        action=ActionType.RETRY,
        amount=15000.0,
        recovery_score=95,
        risk_level=RiskLevel.HIGH,
        diagnosis=DiagnosisType.FRAUD_RISK.value
    )
    assert eval_fraud.decision == PolicyDecision.BLOCK

def test_redteam_5_malformed_llm_output_injection(monkeypatch):
    """
    Red-Team Attack 5: Malformed / Hallucinated LLM Output.
    LLM returns invalid JSON or hallucinated diagnosis enum.
    Must fail-closed with diagnosis_confidence = 0.0, forced_human = True, and HUMAN routing.
    """
    # Mock LLM to return None or raise exception simulating malformed injection response
    monkeypatch.setattr("app.agents.nodes.diagnose.get_groq_llm", lambda: None)

    state = {
        "transaction": {"amount": 5000.0, "failure_reason": "MALFORMED_PROMPT_INJECTION", "payment_state": "CLEAR"},
        "customer": {},
        "audit_events": []
    }
    res = diagnose_node(state)
    assert res.get("forced_human") is True
    assert res.get("diagnosis_confidence") == 0.0

def test_redteam_6_webhook_duplication_replay():
    """
    Red-Team Attack 6: Webhook Replay / Max Retries Exceeded.
    Duplicate retry attempts exceeding max_retries limit.
    Must return PolicyDecision.STOP.
    """
    eval_replay = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=3,  # Equal to max_retries
        max_retries=3,
        action=ActionType.RETRY,
        amount=2500.0,
        recovery_score=90,
        risk_level=RiskLevel.LOW,
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
    )
    assert eval_replay.decision == PolicyDecision.STOP
    assert "MAX_RETRIES_REACHED" in eval_replay.rules_evaluated[0]["rule"]

def test_redteam_7_gateway_timeout_uncaught_exception(monkeypatch):
    """
    Red-Team Attack 7: Internal Policy Exception / Timeout.
    Verifies fail-closed behavior if unexpected internal exception occurs.
    """
    # Mock evaluate_policy_rules to raise an exception simulating gateway timeout or system crash
    def mock_evaluate_error(*args, **kwargs):
        raise TimeoutError("Gateway API connection timeout")

    monkeypatch.setattr("app.policy.engine.evaluate_policy_rules", mock_evaluate_error)

    eval_exc = policy_engine.evaluate(
        transaction_status=TransactionStatus.FAILED,
        payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_count=0,
        max_retries=3,
        action=ActionType.RETRY,
        amount=1000.0,
        recovery_score=90,
        risk_level=RiskLevel.LOW,
        diagnosis=DiagnosisType.TEMPORARY_FAILURE.value
    )
    assert eval_exc.decision == PolicyDecision.BLOCK
    assert "POLICY_ENGINE_EXCEPTION" in eval_exc.reason

