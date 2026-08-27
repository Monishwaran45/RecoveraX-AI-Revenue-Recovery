from app.policy.enums import RiskLevel

def calculate_priority_score(
    amount_at_risk: float,
    recovery_score: int,
    risk_level: RiskLevel,
    days_overdue: int = 0
) -> str:
    """
    Returns priority tier: HIGH, MEDIUM, LOW
    """
    weighted_score = (amount_at_risk * (recovery_score / 100.0)) + (days_overdue * 50)
    
    if risk_level == RiskLevel.HIGH or amount_at_risk >= 25000 or weighted_score >= 15000:
        return "HIGH"
    elif amount_at_risk >= 5000 or weighted_score >= 4000:
        return "MEDIUM"
    else:
        return "LOW"
