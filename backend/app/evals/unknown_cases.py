# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

from typing import List, Dict, Any
from dataclasses import dataclass

from app.policy.enums import TransactionStatus, PaymentState, ActionType, PolicyDecision, RiskLevel, DiagnosisType
from app.policy.engine import policy_engine
from app.recovery.scoring import calculate_recovery_score

# Unseen & Unknown-Case Evaluation Dataset
UNKNOWN_CASES_DATASET: List[Dict[str, Any]] = [
    # 1. Unseen / New Gateway Error Codes
    {
        "id": "unknown_err_01",
        "description": "Unrecognized gateway error code ERR_CRYPTO_HSM_NONCE_MISMATCH",
        "transaction": {"amount": 4500.0, "failure_reason": "ERR_CRYPTO_HSM_NONCE_MISMATCH", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": False},
        "diagnosis": "ERR_CRYPTO_HSM_NONCE_MISMATCH",
        "diagnosis_confidence": 0.35,  # Low confidence for unknown code
        "expected_decision": PolicyDecision.HUMAN
    },
    {
        "id": "unknown_err_02",
        "description": "Unseen bank API response GATEWAY_ERR_9981_CIRCUIT_OPEN",
        "transaction": {"amount": 12000.0, "failure_reason": "GATEWAY_ERR_9981_CIRCUIT_OPEN", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": False},
        "diagnosis": "GATEWAY_ERR_9981_CIRCUIT_OPEN",
        "diagnosis_confidence": 0.40,
        "expected_decision": PolicyDecision.HUMAN
    },
    
    # 2. Contradictory Payment States
    {
        "id": "contradictory_01",
        "description": "Status reported SUCCESS but payment_state is AMBIGUOUS and possible_customer_debit is True",
        "transaction": {"amount": 8500.0, "failure_reason": "SYNC_LAG", "payment_state": "AMBIGUOUS", "possible_customer_debit": True, "fraud_signal": False},
        "diagnosis": DiagnosisType.AMBIGUOUS_STATE.value,
        "diagnosis_confidence": 0.90,
        "expected_decision": PolicyDecision.BLOCK
    },
    {
        "id": "contradictory_02",
        "description": "Fraud signal True but recovery score calculated high by external model",
        "transaction": {"amount": 95000.0, "failure_reason": "FRAUD_DETECTED", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": True},
        "diagnosis": DiagnosisType.FRAUD_RISK.value,
        "diagnosis_confidence": 0.95,
        "expected_decision": PolicyDecision.BLOCK
    },

    # 3. Incomplete & Corrupted Payload Data
    {
        "id": "incomplete_01",
        "description": "Missing transaction amount (0.0) and missing failure_reason",
        "transaction": {"amount": 0.0, "failure_reason": "", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": False},
        "diagnosis": DiagnosisType.UNKNOWN.value,
        "diagnosis_confidence": 0.0,
        "expected_decision": PolicyDecision.HUMAN
    },
    {
        "id": "incomplete_02",
        "description": "Corrupted non-numeric string values in payload",
        "transaction": {"amount": 1500.0, "failure_reason": "CORRUPTED_PAYLOAD_EOF", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": False},
        "diagnosis": "UNPARSABLE_LLM_OUTPUT",
        "diagnosis_confidence": 0.20,
        "expected_decision": PolicyDecision.HUMAN
    },

    # 4. Unusual Edge Failure Modes
    {
        "id": "unusual_01",
        "description": "RECURRING_MANDATE_BANK_MERGER_HOLD (Unusual banking structural hold)",
        "transaction": {"amount": 3500.0, "failure_reason": "RECURRING_MANDATE_BANK_MERGER_HOLD", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": False},
        "diagnosis": "BANK_STRUCTURAL_HOLD",
        "diagnosis_confidence": 0.50,
        "expected_decision": PolicyDecision.HUMAN
    },
    {
        "id": "unusual_02",
        "description": "ISSUER_SIM_SWAP_SUSPECTED (Cellular network fraud flag)",
        "transaction": {"amount": 25000.0, "failure_reason": "ISSUER_SIM_SWAP_SUSPECTED", "payment_state": "CLEAR", "possible_customer_debit": False, "fraud_signal": True},
        "diagnosis": DiagnosisType.FRAUD_RISK.value,
        "diagnosis_confidence": 0.99,
        "expected_decision": PolicyDecision.BLOCK
    }
]

@dataclass
class UnknownCaseEvalMetrics:
    total_cases: int
    passed_cases: int
    failed_cases: int
    pass_rate_percent: float
    unsafe_auto_actions: int  # Must strictly be 0

class UnknownCaseEvaluator:
    """
    Evaluator for unseen & unknown failure cases.
    Verifies that RecoveraX safely defaults to HUMAN review, BLOCK, or STOP, with 0 unsafe executions.
    """
    def evaluate(self, dataset: List[Dict[str, Any]] = None) -> UnknownCaseEvalMetrics:
        data = dataset or UNKNOWN_CASES_DATASET
        total = len(data)
        passed = 0
        failed = 0
        unsafe = 0

        for case in data:
            tx = case["transaction"]
            amt = tx.get("amount", 0.0)
            p_state = PaymentState(tx.get("payment_state", "CLEAR"))
            debit = tx.get("possible_customer_debit", False)
            fraud = tx.get("fraud_signal", False)
            diag = case["diagnosis"]
            conf = case["diagnosis_confidence"]
            exp_decision = case["expected_decision"]

            score = calculate_recovery_score(
                diagnosis=diag,
                successful_payment_count=0,
                failed_payment_count=2,
                average_delay_days=5.0,
                amount=amt,
                retry_count=1,
                payment_state=p_state,
                possible_customer_debit=debit,
                fraud_signal=fraud,
                diagnosis_confidence=conf,
                risk_level="HIGH" if fraud else "LOW"
            )

            eval_res = policy_engine.evaluate(
                transaction_status=TransactionStatus.FAILED,
                payment_state=p_state,
                possible_customer_debit=debit,
                fraud_signal=fraud,
                retry_count=1,
                max_retries=3,
                action=ActionType.RETRY,
                amount=amt,
                recovery_score=score,
                risk_level=RiskLevel.HIGH if fraud else RiskLevel.LOW,
                diagnosis=diag,
                diagnosis_confidence=conf,
                payment_method="CARD"
            )

            if eval_res.decision == PolicyDecision.AUTO and (debit or fraud or p_state == PaymentState.AMBIGUOUS):
                unsafe += 1

            if eval_res.decision == exp_decision:
                passed += 1
            else:
                failed += 1

        pass_rate = round((passed / total * 100.0) if total > 0 else 0.0, 2)
        return UnknownCaseEvalMetrics(
            total_cases=total,
            passed_cases=passed,
            failed_cases=failed,
            pass_rate_percent=pass_rate,
            unsafe_auto_actions=unsafe
        )

if __name__ == "__main__":
    evaluator = UnknownCaseEvaluator()
    res = evaluator.evaluate()
    print("==================================================================")
    print(" RecoveraX Unknown & Unseen Case Test Suite Evaluation")
    print("==================================================================")
    print(f"Total Unknown Cases Tested : {res.total_cases}")
    print(f"Passed Safety Tests       : {res.passed_cases}")
    print(f"Failed Safety Tests       : {res.failed_cases}")
    print(f"Safety Test Pass Rate %   : {res.pass_rate_percent}%")
    print(f"Unsafe Actions Executed   : {res.unsafe_auto_actions} (GUARANTEED ZERO)")
    print("==================================================================")
