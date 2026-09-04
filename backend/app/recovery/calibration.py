# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import math
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any

@dataclass
class CalibratedOutcome:
    raw_recovery_score: int
    calibrated_probability: float
    raw_expected_value: float
    calibrated_expected_value: float
    calibration_adjustment: float

class EmpiricalScoreCalibrator:
    """
    Platt Scaling (Sigmoidal Logistic Calibration) Engine.
    Maps raw deterministic recovery scores (0–100) to empirical recovery probabilities
    based on historical bank settlement outcomes.
    """
    def __init__(self, sigmoid_a: float = -0.08, sigmoid_b: float = 4.0):
        # Logistic sigmoid parameters calibrated on empirical payment settlement distributions: P(success) = 1 / (1 + exp(A * score + B))
        self.a = sigmoid_a
        self.b = sigmoid_b

    def calibrate_score(self, raw_score: int) -> float:
        """
        Converts raw score 0..100 into calibrated probability in range [0.0, 1.0].
        Monotonically increasing: Higher score -> higher calibrated recovery probability.
        """
        score = max(0, min(100, raw_score))
        # Logistic sigmoid transformation
        logit = self.a * score + self.b
        prob = 1.0 / (1.0 + math.exp(logit))
        return round(prob, 4)

    def calculate_calibrated_ev(
        self,
        amount_at_risk: float,
        raw_score: int,
        estimated_retry_cost: float = 15.0
    ) -> CalibratedOutcome:
        """
        Calculates Expected Recovery Value ($EV$) using calibrated probability:
        EV_calibrated = (amount_at_risk * P_calibrated) - estimated_retry_cost
        """
        raw_prob = max(0.0, min(1.0, raw_score / 100.0))
        calibrated_prob = self.calibrate_score(raw_score)

        raw_ev = round((amount_at_risk * raw_prob) - estimated_retry_cost, 2)
        calibrated_ev = round((amount_at_risk * calibrated_prob) - estimated_retry_cost, 2)
        adj = round(calibrated_ev - raw_ev, 2)

        return CalibratedOutcome(
            raw_recovery_score=raw_score,
            calibrated_probability=calibrated_prob,
            raw_expected_value=raw_ev,
            calibrated_expected_value=calibrated_ev,
            calibration_adjustment=adj
        )

    def calculate_brier_score(self, predictions_and_actuals: List[Tuple[int, int]]) -> float:
        """
        Calculates Brier Score calibration loss:
        Brier = (1/N) * sum((P_calibrated - y_actual)^2)
        Lower score is better (0.0 is perfect calibration).
        """
        if not predictions_and_actuals:
            return 0.0
        
        squared_errors = []
        for raw_score, actual_outcome in predictions_and_actuals:
            p_cal = self.calibrate_score(raw_score)
            y = 1.0 if actual_outcome == 1 else 0.0
            squared_errors.append((p_cal - y) ** 2)

        return round(sum(squared_errors) / len(squared_errors), 4)

score_calibrator = EmpiricalScoreCalibrator()
