import logging
from app.config import settings
from app.policy.enums import PolicyDecision, ActionType, PaymentState, TransactionStatus, RiskLevel
from app.policy.rules import evaluate_policy_rules, PolicyEvaluation

logger = logging.getLogger(__name__)

class PolicyEngine:
    """
    Deterministic Safety Policy Engine.
    Has final authority over LLM recommendations.
    Implements fail-closed security: any internal exception returns BLOCK.
    """
    def __init__(self):
        self.max_auto_retry_amount = settings.MAX_AUTO_RETRY_AMOUNT
        self.max_retries = settings.MAX_RETRIES
        self.min_auto_recovery_score = settings.MIN_AUTO_RECOVERY_SCORE

    def evaluate(
        self,
        transaction_status: TransactionStatus,
        payment_state: PaymentState,
        possible_customer_debit: bool,
        fraud_signal: bool,
        retry_count: int,
        max_retries: int,
        action: ActionType,
        amount: float,
        recovery_score: int,
        risk_level: RiskLevel,
        diagnosis: str,
        max_auto_retry_amount: float = None,
        min_auto_recovery_score: int = None,
        payment_method: str = "CARD",
    ) -> PolicyEvaluation:
        try:
            max_amt = max_auto_retry_amount if max_auto_retry_amount is not None else self.max_auto_retry_amount
            min_score = min_auto_recovery_score if min_auto_recovery_score is not None else self.min_auto_recovery_score
            return evaluate_policy_rules(
                transaction_status=transaction_status,
                payment_state=payment_state,
                possible_customer_debit=possible_customer_debit,
                fraud_signal=fraud_signal,
                retry_count=retry_count,
                max_retries=max_retries,
                action=action,
                amount=amount,
                recovery_score=recovery_score,
                risk_level=risk_level,
                diagnosis=diagnosis,
                max_auto_retry_amount=max_amt,
                min_auto_recovery_score=min_score,
                payment_method=payment_method,
            )
        except Exception as e:
            logger.error(f"Policy Engine exception encountered: {str(e)}. Failing closed to BLOCK.", exc_info=True)
            return PolicyEvaluation(
                decision=PolicyDecision.BLOCK,
                reason=f"POLICY_ENGINE_EXCEPTION: System failed closed ({str(e)})",
                rules_evaluated=[{"rule": "FAIL_CLOSED_EXCEPTION", "decision": PolicyDecision.BLOCK.value, "reason": str(e)}]
            )

policy_engine = PolicyEngine()
