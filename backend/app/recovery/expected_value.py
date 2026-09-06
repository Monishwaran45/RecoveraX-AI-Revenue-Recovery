def calculate_expected_recovery_value(
    amount_at_risk: float,
    recovery_score: int,
    retry_cost: float = 15.0,
    gateway_fee_percent: float = 0.02,
    communication_cost: float = 1.5,
    human_review_cost: float = 0.0,
    risk_penalty: float = 0.0,
    customer_friction: float = 5.0
) -> float:
    """
    Expected Net Recovery Value Formula:
    expected_net_value = (amount_at_risk * p_success) - retry_cost - gateway_fee - communication_cost - human_review_cost - risk_penalty - customer_friction
    """
    p_success = max(0.0, min(1.0, recovery_score / 100.0))
    expected_gross = amount_at_risk * p_success
    gateway_fee = amount_at_risk * gateway_fee_percent if p_success > 0 else 0.0
    
    total_costs = retry_cost + gateway_fee + communication_cost + human_review_cost + risk_penalty + customer_friction
    net_value = expected_gross - total_costs
    return round(max(0.0, net_value), 2)

def calculate_actual_net_recovery_value(
    amount_recovered: float,
    retry_attempts: int = 1,
    retry_unit_cost: float = 15.0,
    gateway_fee_percent: float = 0.02,
    communication_channel: str = "SMS",
    human_reviewed: bool = False
) -> float:
    """
    Calculates actual Net Recovery Value realized after verified settlement:
    Net ₹ = Amount Recovered - (Retry Attempts * ₹15) - (Gateway Fee 2%) - (Comm Cost) - (Human Review ₹50)
    """
    if amount_recovered <= 0.0:
        return 0.0

    comm_cost = 5.0 if communication_channel == "VOICE_CALL" else 1.5
    human_cost = 50.0 if human_reviewed else 0.0
    gateway_fee = amount_recovered * gateway_fee_percent
    total_retry_cost = retry_attempts * retry_unit_cost

    net_value = amount_recovered - (total_retry_cost + gateway_fee + comm_cost + human_cost)
    return round(max(0.0, net_value), 2)

