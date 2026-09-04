# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
from app.evals.accuracy import evaluator, run_accuracy_evaluation, GROUND_TRUTH_EVAL_DATASET

def test_ground_truth_eval_dataset_structure():
    assert len(GROUND_TRUTH_EVAL_DATASET) == 100
    for case in GROUND_TRUTH_EVAL_DATASET:
        assert "id" in case
        assert "transaction" in case
        assert "expected_diagnosis" in case

def test_llm_diagnosis_accuracy_evaluation_metrics():
    metrics = evaluator.evaluate()
    assert metrics.total_cases == 100
    assert metrics.accuracy >= 0.70 # Expect at least 70%+ baseline accuracy on ground truth
    assert metrics.macro_f1_score >= 0.70
    assert isinstance(metrics.category_precision, dict)
    assert isinstance(metrics.category_recall, dict)

def test_run_accuracy_evaluation_dict_export():
    res = run_accuracy_evaluation()
    assert res["total_cases"] == 100
    assert "accuracy" in res
    assert "macro_f1_score" in res
