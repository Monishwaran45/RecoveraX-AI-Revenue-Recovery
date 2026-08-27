def calculate_expected_recovery_value(
    amount_at_risk: float,
    recovery_score: int,
    retry_cost: float = 15.0,
    risk_penalty: float = 0.0,
    customer_friction: float = 5.0
) -> float:
    """
    Expected Recovery Value Formula in Python:
    expected_recovery_value = amount_at_risk * (recovery_score / 100) - retry_cost - risk_penalty - customer_friction
    """
    p_success = max(0.0, min(1.0, recovery_score / 100.0))
    expected_gross = amount_at_risk * p_success
    net_value = expected_gross - retry_cost - risk_penalty - customer_friction
    return round(max(0.0, net_value), 2)
