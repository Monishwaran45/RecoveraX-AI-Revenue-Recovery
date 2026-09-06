# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
from app.evals.large_benchmark import LargeScaleBenchmark
from app.evals.baselines import BaselineComparisonEvaluator
from app.evals.ablation import LLMAblationStudy

def test_baseline_comparison():
    bench = LargeScaleBenchmark()
    dataset = bench.generate_simulated_dataset(num_transactions=1000, seed=42)
    
    evaluator = BaselineComparisonEvaluator()
    results = evaluator.evaluate_all_strategies(dataset)

    assert "No Action" in results
    assert "Blind Retry" in results
    assert "Rule-Only" in results
    assert "RecoveraX Engine" in results

    recoverax = results["RecoveraX Engine"]
    blind = results["Blind Retry"]

    assert recoverax.unsafe_actions_count == 0, "RecoveraX must have 0 unsafe actions"
    assert recoverax.net_recovered > blind.net_recovered, "RecoveraX net recovery must exceed blind retry"

def test_llm_ablation_study():
    study = LLMAblationStudy()
    results = study.run_ablation_study()

    assert "Rules Only" in results
    assert "LLM + Rules" in results

    llm_plus = results["LLM + Rules"]
    rules_only = results["Rules Only"]

    assert llm_plus.diagnosis_accuracy > rules_only.diagnosis_accuracy, "LLM + Rules must achieve higher diagnosis accuracy than Rules Only"
    assert llm_plus.unsafe_actions_count == 0
    assert rules_only.unsafe_actions_count == 0
