# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import math
import statistics
import json
from typing import Dict, Any, List
from dataclasses import dataclass, asdict

from app.policy.enums import TransactionStatus, PaymentState, ActionType, PolicyDecision, RiskLevel, DiagnosisType
from app.policy.engine import policy_engine
from app.recovery.scoring import calculate_recovery_score
from app.recovery.expected_value import calculate_actual_net_recovery_value
from app.evals.large_benchmark import LargeScaleBenchmark
from app.evals.baselines import BaselineComparisonEvaluator
from app.evals.unknown_cases import UnknownCaseEvaluator, UNKNOWN_CASES_DATASET
from app.evals.ablation import LLMAblationStudy

@dataclass
class StrategyConfidenceInterval:
    strategy_name: str
    sample_size_batches: int
    transactions_per_batch: int
    total_transactions_evaluated: int
    mean_gross_recovered: float
    variance_gross: float
    std_gross: float
    ci95_gross: float
    ci95_gross_low: float
    ci95_gross_high: float
    mean_net_recovered: float
    variance_net: float
    std_net: float
    ci95_net: float
    ci95_net_low: float
    ci95_net_high: float
    mean_recovery_rate: float
    std_recovery_rate: float
    ci95_recovery_rate: float
    mean_operational_cost: float
    total_unsafe_actions: int
    mean_human_escalations: float

@dataclass
class UnknownCaseBreakdown:
    total_cases: int
    human_count: int
    human_pct: float
    block_count: int
    block_pct: float
    stop_count: int
    stop_pct: float
    auto_count: int
    auto_pct: float
    incorrectly_auto_executed: int
    false_auto_execution_rate: float
    safety_compliance_rate: float

def run_multi_seed_benchmarks(num_seeds: int = 50, tx_per_seed: int = 1000) -> Dict[str, Any]:
    bench = LargeScaleBenchmark()
    evaluator = BaselineComparisonEvaluator()
    
    batch_results = []
    for s in range(num_seeds):
        dataset = bench.generate_simulated_dataset(num_transactions=tx_per_seed, seed=s)
        res = evaluator.evaluate_all_strategies(dataset)
        batch_results.append(res)
        
    strategies = ["RecoveraX Engine", "Blind Retry", "Rule-Only", "No Action"]
    strategy_stats: Dict[str, StrategyConfidenceInterval] = {}

    for strat in strategies:
        gross_vals = [b[strat].gross_recovered for b in batch_results]
        net_vals = [b[strat].net_recovered for b in batch_results]
        rates = [b[strat].recovery_rate for b in batch_results]
        costs = [b[strat].total_cost for b in batch_results]
        unsafes = [b[strat].unsafe_actions_count for b in batch_results]
        humans = [b[strat].human_escalations for b in batch_results]

        n = len(gross_vals)
        mean_gross = statistics.mean(gross_vals)
        std_gross = statistics.stdev(gross_vals) if n > 1 else 0.0
        var_gross = std_gross ** 2
        ci_gross = 1.96 * (std_gross / math.sqrt(n)) if n > 0 else 0.0

        mean_net = statistics.mean(net_vals)
        std_net = statistics.stdev(net_vals) if n > 1 else 0.0
        var_net = std_net ** 2
        ci_net = 1.96 * (std_net / math.sqrt(n)) if n > 0 else 0.0

        mean_rate = statistics.mean(rates)
        std_rate = statistics.stdev(rates) if n > 1 else 0.0
        ci_rate = 1.96 * (std_rate / math.sqrt(n)) if n > 0 else 0.0

        mean_cost = statistics.mean(costs)
        mean_human = statistics.mean(humans)
        tot_unsafe = sum(unsafes)

        strategy_stats[strat] = StrategyConfidenceInterval(
            strategy_name=strat,
            sample_size_batches=n,
            transactions_per_batch=tx_per_seed,
            total_transactions_evaluated=n * tx_per_seed,
            mean_gross_recovered=round(mean_gross, 2),
            variance_gross=round(var_gross, 2),
            std_gross=round(std_gross, 2),
            ci95_gross=round(ci_gross, 2),
            ci95_gross_low=round(mean_gross - ci_gross, 2),
            ci95_gross_high=round(mean_gross + ci_gross, 2),
            mean_net_recovered=round(mean_net, 2),
            variance_net=round(var_net, 2),
            std_net=round(std_net, 2),
            ci95_net=round(ci_net, 2),
            ci95_net_low=round(mean_net - ci_net, 2),
            ci95_net_high=round(mean_net + ci_net, 2),
            mean_recovery_rate=round(mean_rate, 2),
            std_recovery_rate=round(std_rate, 2),
            ci95_recovery_rate=round(ci_rate, 2),
            mean_operational_cost=round(mean_cost, 2),
            total_unsafe_actions=tot_unsafe,
            mean_human_escalations=round(mean_human, 2)
        )

    # Evaluate Unknown / Unseen Cases breakdown explicitly
    unknown_human = 0
    unknown_block = 0
    unknown_stop = 0
    unknown_auto = 0
    incorrect_auto = 0

    for case in UNKNOWN_CASES_DATASET:
        tx = case["transaction"]
        amt = tx.get("amount", 0.0)
        p_state = PaymentState(tx.get("payment_state", "CLEAR"))
        debit = tx.get("possible_customer_debit", False)
        fraud = tx.get("fraud_signal", False)
        diag = case["diagnosis"]
        conf = case["diagnosis_confidence"]

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

        if eval_res.decision == PolicyDecision.HUMAN:
            unknown_human += 1
        elif eval_res.decision == PolicyDecision.BLOCK:
            unknown_block += 1
        elif eval_res.decision == PolicyDecision.STOP:
            unknown_stop += 1
        elif eval_res.decision == PolicyDecision.AUTO:
            unknown_auto += 1
            incorrect_auto += 1

    tot_unk = len(UNKNOWN_CASES_DATASET)
    unknown_breakdown = UnknownCaseBreakdown(
        total_cases=tot_unk,
        human_count=unknown_human,
        human_pct=round((unknown_human / tot_unk * 100.0) if tot_unk > 0 else 0.0, 1),
        block_count=unknown_block,
        block_pct=round((unknown_block / tot_unk * 100.0) if tot_unk > 0 else 0.0, 1),
        stop_count=unknown_stop,
        stop_pct=round((unknown_stop / tot_unk * 100.0) if tot_unk > 0 else 0.0, 1),
        auto_count=unknown_auto,
        auto_pct=round((unknown_auto / tot_unk * 100.0) if tot_unk > 0 else 0.0, 1),
        incorrectly_auto_executed=incorrect_auto,
        false_auto_execution_rate=round((incorrect_auto / tot_unk * 100.0) if tot_unk > 0 else 0.0, 2),
        safety_compliance_rate=100.0 - round((incorrect_auto / tot_unk * 100.0) if tot_unk > 0 else 0.0, 2)
    )

    # LLM Ablation Study
    ablation_study = LLMAblationStudy()
    ablation_results = ablation_study.run_ablation_study()

    return {
        "multi_batch_benchmarks": {k: asdict(v) for k, v in strategy_stats.items()},
        "unknown_cases_breakdown": asdict(unknown_breakdown),
        "ablation_results": {k: asdict(v) for k, v in ablation_results.items()}
    }

if __name__ == "__main__":
    report = run_multi_seed_benchmarks(num_seeds=50, tx_per_seed=1000)
    with open("benchmark_summary.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("Benchmark summary successfully generated and written to benchmark_summary.json")
