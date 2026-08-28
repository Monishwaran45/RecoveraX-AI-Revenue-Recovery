import random
from typing import Tuple
from app.policy.enums import TransactionStatus, PaymentState, PolicyDecision, ActionType
from app.simulator.failure_profiles import FAILURE_PROFILES

class PaymentSimulator:
    """
    Deterministic Payment Gateway Simulator.
    Simulates payment execution and outcome verification.
    Rejects execution if policy decision is BLOCK.
    """
    def simulate_retry(
        self,
        transaction_id: str,
        amount: float,
        current_retry_count: int,
        policy_decision: PolicyDecision,
        payment_state: PaymentState,
        failure_profile_id: str = "TEMPORARY_BANK_ERROR"
    ) -> Tuple[TransactionStatus, PaymentState, str]:
        # Rule: Must reject actions that policy engine blocked
        if policy_decision == PolicyDecision.BLOCK:
            raise ValueError(f"Simulator Error: Action for transaction {transaction_id} was BLOCKED by policy. Cannot execute retry.")

        if payment_state == PaymentState.AMBIGUOUS:
            return TransactionStatus.AMBIGUOUS, PaymentState.AMBIGUOUS, "Ambiguous payment state - execution blocked by simulator"

        profile = FAILURE_PROFILES.get(failure_profile_id, FAILURE_PROFILES["TEMPORARY_BANK_ERROR"])
        
        if current_retry_count < len(profile.retry_outcomes):
            outcome = profile.retry_outcomes[current_retry_count]
        else:
            outcome = profile.retry_outcomes[-1] if profile.retry_outcomes else TransactionStatus.SUCCESS

        if outcome == TransactionStatus.SUCCESS:
            return TransactionStatus.SUCCESS, PaymentState.CLEAR, "Payment successfully settled with bank gateway"
        else:
            return TransactionStatus.FAILED, PaymentState.CLEAR, "Gateway retry attempt failed - insufficient funds or decline"

payment_simulator = PaymentSimulator()
