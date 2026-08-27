from typing import Tuple
from app.policy.enums import TransactionStatus, PaymentState, DiagnosisType

def should_stop_case(
    transaction_status: TransactionStatus,
    payment_state: PaymentState,
    retry_count: int,
    max_retries: int,
    possible_customer_debit: bool,
    fraud_signal: bool,
    diagnosis: str,
    human_decision: str = None
) -> Tuple[bool, str]:
    """
    Stopping Rules Evaluation.
    Returns (should_stop, reason).
    """
    if transaction_status == TransactionStatus.SUCCESS:
        return True, "Payment succeeded"
    if retry_count >= max_retries:
        return True, f"Max retries reached ({retry_count}/{max_retries})"
    if payment_state == PaymentState.AMBIGUOUS:
        return True, "Payment state became ambiguous"
    if possible_customer_debit:
        return True, "Possible customer debit detected"
    if fraud_signal:
        return True, "Fraud signal detected"
    if diagnosis == DiagnosisType.PERMANENT_FAILURE.value:
        return True, "Permanent failure diagnosis"
    if human_decision == "REJECT":
        return True, "Human operator rejected action"

    return False, ""
