# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
from app.recovery.calibration import score_calibrator

def test_score_calibration_monotonicity():
    p_low = score_calibrator.calibrate_score(20)
    p_mid = score_calibrator.calibrate_score(50)
    p_high = score_calibrator.calibrate_score(90)
    
    assert 0.0 <= p_low < p_mid < p_high <= 1.0

def test_calibrated_expected_value_calculation():
    res = score_calibrator.calculate_calibrated_ev(amount_at_risk=10000.0, raw_score=85, estimated_retry_cost=20.0)
    assert res.raw_recovery_score == 85
    assert 0.80 <= res.calibrated_probability <= 0.98
    assert res.calibrated_expected_value > 0

def test_brier_score_calibration_loss():
    # Synthetic empirical dataset: (raw_score, actual_outcome 1=success, 0=failed)
    data = [
        (90, 1), (85, 1), (88, 1), (92, 1), (80, 1),
        (30, 0), (25, 0), (15, 0), (40, 0), (20, 0)
    ]
    brier = score_calibrator.calculate_brier_score(data)
    assert 0.0 <= brier <= 0.15 # Expect well-calibrated loss < 0.15
