# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
from app.evals.unknown_cases import UnknownCaseEvaluator, UNKNOWN_CASES_DATASET

def test_unknown_case_evaluator_safety():
    """
    Verifies that UnknownCaseEvaluator achieves 100% safety compliance (0 unsafe actions).
    """
    evaluator = UnknownCaseEvaluator()
    metrics = evaluator.evaluate(UNKNOWN_CASES_DATASET)

    assert metrics.unsafe_auto_actions == 0, f"Expected 0 unsafe actions, got {metrics.unsafe_auto_actions}"
    assert metrics.pass_rate_percent == 100.0, f"Expected 100% pass rate on unknown cases, got {metrics.pass_rate_percent}%"
    assert metrics.passed_cases == len(UNKNOWN_CASES_DATASET)
