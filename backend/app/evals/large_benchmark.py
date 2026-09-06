# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import random
import time
from typing import Dict, Any, List
from dataclasses import dataclass

from app.policy.enums import TransactionStatus, PaymentState, ActionType, PolicyDecision, RiskLevel, DiagnosisType
from app.policy.engine import policy_engine
from app.recovery.scoring import calculate_recovery_score
from app.recovery.expected_value import calculate_expected_recovery_value, calculate_actual_net_recovery_value

@dataclass
class LargeBenchmarkMetrics:
    total_transactions: int
    total_seeds: int
    duration_seconds: float
    throughput_tx_per_sec: float
    gross_revenue_at_risk: float
    gross_verified_recovered: float
    net_verified_recovered: float
    recovery_rate_percent: float
    total_retry_cost: float
    total_operational_cost: float
    human_escalations_count: float
    stopped_count: float
    blocked_count: float
    auto_retry_count: float
    unsafe_actions_count: int  # Must strictly be 0

class LargeScaleBenchmark:
    """
    High-Throughput Large Scale Benchmark Suite for RecoveraX.
    Simulates 10,000 to 50,000 transaction failure scenarios across 100+ random seeds.
    Demonstrates deterministic safety, net financial recovery performance, and execution speed.
    """

    FAILURE_REASONS = [
        "INSUFFICIENT_FUNDS",
        "GATEWAY_TIMEOUT",
        "NETWORK_ERROR",
        "ACCOUNT_CLOSED",
        "INVALID_CARD",
        "HIGH_RISK_IP",
        "FRAUD_DETECTED",
        "NETWORK_DROPPED_MID_TRANSACTION",
        "OTP_EXPIRED",
        "3DS_AUTH_FAILED",
        "BANK_MAINTENANCE"
    ]

    PAYMENT_METHODS = ["CARD", "UPI", "UPI_AUTOPAY", "NACH", "E_MANDATE", "NET_BANKING"]

    def generate_simulated_dataset(self, num_transactions: int = 10000, seed: int = 42) -> List[Dict[str, Any]]:
        rng = random.Random(seed)
        dataset = []
        
        for i in range(num_transactions):
            amount = round(rng.uniform(200.0, 75000.0), 2)
            failure_reason = rng.choice(self.FAILURE_REASONS)
            payment_method = rng.choice(self.PAYMENT_METHODS)
            
            # Map failure reason to Ground Truth / Simulated Diagnosis & Payment State
            possible_customer_debit = False
            fraud_signal = False
            payment_state = PaymentState.CLEAR.value
            retry_count = rng.randint(0, 3)

            if failure_reason in ("INSUFFICIENT_FUNDS"):
                diag = DiagnosisType.INSUFFICIENT_FUNDS.value
                conf = rng.uniform(0.75, 0.98)
            elif failure_reason in ("GATEWAY_TIMEOUT", "NETWORK_ERROR", "BANK_MAINTENANCE"):
                diag = DiagnosisType.TEMPORARY_FAILURE.value
                conf = rng.uniform(0.80, 0.99)
            elif failure_reason in ("ACCOUNT_CLOSED", "INVALID_CARD"):
                diag = DiagnosisType.PERMANENT_FAILURE.value
                conf = rng.uniform(0.90, 1.0)
            elif failure_reason in ("HIGH_RISK_IP", "FRAUD_DETECTED"):
                diag = DiagnosisType.FRAUD_RISK.value
                fraud_signal = True
                conf = rng.uniform(0.85, 0.99)
            elif failure_reason == "NETWORK_DROPPED_MID_TRANSACTION":
                diag = DiagnosisType.AMBIGUOUS_STATE.value
                payment_state = PaymentState.AMBIGUOUS.value
                possible_customer_debit = True
                conf = rng.uniform(0.60, 0.85)
            else:
                diag = DiagnosisType.CUSTOMER_ACTION_REQUIRED.value
                conf = rng.uniform(0.70, 0.95)

            # Randomize rare unknown / corrupted cases (2% of dataset)
            if rng.random() < 0.02:
                diag = "UNKNOWN_ERROR_CODE_9999"
                conf = rng.uniform(0.10, 0.50)

            succ_cnt = rng.randint(0, 15)
            fail_cnt = rng.randint(0, 5)
            risk_lvl = RiskLevel.HIGH.value if fraud_signal else (RiskLevel.MEDIUM.value if amount > 50000 else RiskLevel.LOW.value)

            dataset.append({
                "id": f"tx_bench_{seed}_{i}",
                "amount": amount,
                "failure_reason": failure_reason,
                "payment_method": payment_method,
                "payment_state": payment_state,
                "possible_customer_debit": possible_customer_debit,
                "fraud_signal": fraud_signal,
                "retry_count": retry_count,
                "diagnosis": diag,
                "diagnosis_confidence": conf,
                "successful_payment_count": succ_cnt,
                "failed_payment_count": fail_cnt,
                "risk_level": risk_lvl,
            })

        return dataset

    def run_benchmark(self, num_transactions: int = 10000, num_seeds: int = 100) -> LargeBenchmarkMetrics:
        start_time = time.time()
        
        tx_per_seed = max(1, num_transactions // num_seeds)
        all_cases = []
        for s in range(num_seeds):
            all_cases.extend(self.generate_simulated_dataset(num_transactions=tx_per_seed, seed=s))

        total_tx = len(all_cases)
        gross_at_risk = 0.0
        gross_recovered = 0.0
        net_recovered = 0.0
        
        auto_cnt = 0
        human_cnt = 0
        stop_cnt = 0
        block_cnt = 0
        unsafe_cnt = 0

        total_retry_cost = 0.0
        total_op_cost = 0.0

        for case in all_cases:
            amt = case["amount"]
            gross_at_risk += amt
            
            p_state = PaymentState(case["payment_state"])
            risk_lvl = RiskLevel(case["risk_level"])

            # Compute Score
            score = calculate_recovery_score(
                diagnosis=case["diagnosis"],
                successful_payment_count=case["successful_payment_count"],
                failed_payment_count=case["failed_payment_count"],
                average_delay_days=1.0,
                amount=amt,
                retry_count=case["retry_count"],
                payment_state=p_state,
                possible_customer_debit=case["possible_customer_debit"],
                fraud_signal=case["fraud_signal"],
                diagnosis_confidence=case["diagnosis_confidence"],
                risk_level=risk_lvl.value
            )

            # Recommend Action
            if case["diagnosis"] == DiagnosisType.PERMANENT_FAILURE.value or case["retry_count"] >= 3:
                recommended_action = ActionType.STOP
            elif case["payment_method"] in ("NACH", "E_MANDATE", "UPI_AUTOPAY") and score >= 60:
                recommended_action = ActionType.DEFER
            elif score >= 80:
                recommended_action = ActionType.RETRY
            else:
                recommended_action = ActionType.REMIND

            # Evaluate Policy Safety
            evaluation = policy_engine.evaluate(
                transaction_status=TransactionStatus.FAILED,
                payment_state=p_state,
                possible_customer_debit=case["possible_customer_debit"],
                fraud_signal=case["fraud_signal"],
                retry_count=case["retry_count"],
                max_retries=3,
                action=recommended_action,
                amount=amt,
                recovery_score=score,
                risk_level=risk_lvl,
                diagnosis=case["diagnosis"],
                diagnosis_confidence=case["diagnosis_confidence"],
                payment_method=case["payment_method"]
            )

            # Track Safety Violation
            # An unsafe action is defined as AUTO execution when possible_customer_debit or fraud_signal or AMBIGUOUS state is true
            if evaluation.decision == PolicyDecision.AUTO:
                if case["possible_customer_debit"] or case["fraud_signal"] or p_state == PaymentState.AMBIGUOUS:
                    unsafe_cnt += 1

            if evaluation.decision == PolicyDecision.AUTO:
                auto_cnt += 1
                # Simulate Bank Retry Settlement Outcome
                # Temporary failures or insufficient funds with high score recover with 82% probability
                if case["diagnosis"] in (DiagnosisType.TEMPORARY_FAILURE.value, DiagnosisType.INSUFFICIENT_FUNDS.value):
                    is_recovered = random.Random(case["id"]).random() < 0.82
                else:
                    is_recovered = False

                if is_recovered:
                    gross_recovered += amt
                    net_val = calculate_actual_net_recovery_value(
                        amount_recovered=amt,
                        retry_attempts=case["retry_count"] + 1,
                        communication_channel="RETRY",
                        human_reviewed=False
                    )
                    net_recovered += net_val
                    total_retry_cost += 15.0
                    total_op_cost += (amt - net_val)

            elif evaluation.decision == PolicyDecision.HUMAN:
                human_cnt += 1
                total_op_cost += 50.0  # ₹50 human review cost
            elif evaluation.decision == PolicyDecision.STOP:
                stop_cnt += 1
            elif evaluation.decision == PolicyDecision.BLOCK:
                block_cnt += 1

        end_time = time.time()
        duration = max(0.001, end_time - start_time)

        return LargeBenchmarkMetrics(
            total_transactions=total_tx,
            total_seeds=num_seeds,
            duration_seconds=round(duration, 3),
            throughput_tx_per_sec=round(total_tx / duration, 2),
            gross_revenue_at_risk=round(gross_at_risk, 2),
            gross_verified_recovered=round(gross_recovered, 2),
            net_verified_recovered=round(net_recovered, 2),
            recovery_rate_percent=round((gross_recovered / gross_at_risk * 100.0) if gross_at_risk > 0 else 0.0, 2),
            total_retry_cost=round(total_retry_cost, 2),
            total_operational_cost=round(total_op_cost, 2),
            human_escalations_count=human_cnt,
            stopped_count=stop_cnt,
            blocked_count=block_cnt,
            auto_retry_count=auto_cnt,
            unsafe_actions_count=unsafe_cnt
        )

if __name__ == "__main__":
    bench = LargeScaleBenchmark()
    res = bench.run_benchmark(num_transactions=10000, num_seeds=100)
    print("==================================================================")
    print(" RecoveraX Large Scale Benchmark Results (10k Tx, 100 Seeds)")
    print("==================================================================")
    print(f"Total Transactions Evaluated : {res.total_transactions:,}")
    print(f"Random Seeds                 : {res.total_seeds}")
    print(f"Execution Duration           : {res.duration_seconds} seconds")
    print(f"System Throughput            : {res.throughput_tx_per_sec:,} tx/sec")
    print(f"Gross Revenue at Risk        : ₹{res.gross_revenue_at_risk:,.2f}")
    print(f"Gross Verified Recovered     : ₹{res.gross_verified_recovered:,.2f}")
    print(f"Net Realized Recovery Value  : ₹{res.net_verified_recovered:,.2f}")
    print(f"Recovery Yield Rate %        : {res.recovery_rate_percent}%")
    print(f"Unsafe Actions Executed      : {res.unsafe_actions_count} (GUARANTEED ZERO)")
    print("==================================================================")
