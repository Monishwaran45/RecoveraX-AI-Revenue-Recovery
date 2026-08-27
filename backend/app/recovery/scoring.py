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
) -> int:
    """
    Transparent deterministic scoring function (0–100).
    Base score = 50.
    Factors:
      +20 temporary failure
      +15 strong successful payment history (>=5)
      +10 recent low delay (<=2 days)
      +10 low previous failure count (<=1)
      +10 retry_count == 0
    Penalties:
      -25 high retry count (>=2)
      -30 weak payment history (failures > successes)
      -50 ambiguous state
      -100 fraud signal or possible customer debit
    """
    if fraud_signal or possible_customer_debit:
        return 0

    if payment_state == PaymentState.AMBIGUOUS:
        return 10

    score = 50

    # Diagnosis Boosts / Penalties
    if diagnosis == DiagnosisType.TEMPORARY_FAILURE.value:
        score += 20
    elif diagnosis == DiagnosisType.INSUFFICIENT_FUNDS.value:
        score += 10
    elif diagnosis == DiagnosisType.CUSTOMER_ACTION_REQUIRED.value:
        score += 5
    elif diagnosis == DiagnosisType.PERMANENT_FAILURE.value:
        score -= 40
    elif diagnosis == DiagnosisType.FRAUD_RISK.value:
        return 0

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

    # Clamp to 0-100 range
    return max(0, min(100, score))
