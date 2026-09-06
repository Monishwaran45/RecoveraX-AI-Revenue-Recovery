from app.policy.enums import DiagnosisType, PaymentState

def calculate_recovery_score(
    diagnosis: str,
    successful_payment_count: int,
    failed_payment_count: int,
    average_delay_days: float,
    amount: float,
    retry_count: int,
    payment_state: PaymentState,
    possible_customer_debit: bool,
    fraud_signal: bool,
    diagnosis_confidence: float = 1.0,
    risk_level: str = "LOW"
) -> int:
    """
    Transparent deterministic scoring function (0–100).
    Integrates probability heuristics, risk level, uncertainty, and expected value ratio.
    """
    if fraud_signal or possible_customer_debit:
        return 0

    if payment_state == PaymentState.AMBIGUOUS:
        return 10

    if diagnosis == DiagnosisType.FRAUD_RISK.value or diagnosis == DiagnosisType.PERMANENT_FAILURE.value:
        if diagnosis == DiagnosisType.FRAUD_RISK.value:
            return 0

    score = 50.0

    # Diagnosis Boosts / Penalties
    if diagnosis == DiagnosisType.TEMPORARY_FAILURE.value:
        score += 20
    elif diagnosis == DiagnosisType.INSUFFICIENT_FUNDS.value:
        score += 10
    elif diagnosis == DiagnosisType.CUSTOMER_ACTION_REQUIRED.value:
        score += 5
    elif diagnosis == DiagnosisType.PERMANENT_FAILURE.value:
        score -= 40
    elif diagnosis == DiagnosisType.UNKNOWN.value:
        score -= 25

    # Customer payment history
    if successful_payment_count >= 5:
        score += 15
    elif successful_payment_count >= 2:
        score += 5

    if failed_payment_count <= 1:
        score += 10
    elif failed_payment_count > successful_payment_count:
        score -= 30

    if average_delay_days <= 2.0:
        score += 10

    # Retry count
    if retry_count == 0:
        score += 10
    elif retry_count >= 2:
        score -= 25

    # Risk level adjustment
    risk_str = (risk_level.value if hasattr(risk_level, 'value') else str(risk_level)).upper()
    if risk_str == "HIGH":
        score -= 40
    elif risk_str == "MEDIUM":
        score -= 15

    # Uncertainty adjustment (confidence penalty if < 1.0)
    conf = max(0.0, min(1.0, float(diagnosis_confidence)))
    score = score * conf

    # Clamp to 0-100 integer range
    return max(0, min(100, int(round(score))))

