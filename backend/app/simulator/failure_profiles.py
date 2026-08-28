from dataclasses import dataclass
from typing import List
from app.policy.enums import TransactionStatus, PaymentState

@dataclass
class FailureProfile:
    profile_id: str
    name: str
    initial_status: TransactionStatus
    initial_payment_state: PaymentState
    possible_customer_debit: bool
    fraud_signal: bool
    retry_outcomes: List[TransactionStatus]

FAILURE_PROFILES = {
    "TEMPORARY_BANK_ERROR": FailureProfile(
        profile_id="TEMPORARY_BANK_ERROR",
        name="Temporary Gateway Timeout",
        initial_status=TransactionStatus.FAILED,
        initial_payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_outcomes=[TransactionStatus.SUCCESS]
    ),
    "AMBIGUOUS_PAYMENT": FailureProfile(
        profile_id="AMBIGUOUS_PAYMENT",
        name="Ambiguous Double Debit Risk",
        initial_status=TransactionStatus.AMBIGUOUS,
        initial_payment_state=PaymentState.AMBIGUOUS,
        possible_customer_debit=True,
        fraud_signal=False,
        retry_outcomes=[TransactionStatus.FAILED]
    ),
    "PERMANENT_HARD_DECLINE": FailureProfile(
        profile_id="PERMANENT_HARD_DECLINE",
        name="Stolen / Stolen Card Hard Decline",
        initial_status=TransactionStatus.FAILED,
        initial_payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_outcomes=[TransactionStatus.FAILED, TransactionStatus.FAILED]
    ),
    "SUBSCRIPTION_RETRY_FLAKE": FailureProfile(
        profile_id="SUBSCRIPTION_RETRY_FLAKE",
        name="Flaky Subscription Renewal",
        initial_status=TransactionStatus.FAILED,
        initial_payment_state=PaymentState.CLEAR,
        possible_customer_debit=False,
        fraud_signal=False,
        retry_outcomes=[TransactionStatus.SUCCESS]
    ),
}
