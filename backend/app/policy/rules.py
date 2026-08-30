from dataclasses import dataclass
from typing import List
from app.policy.enums import PolicyDecision, ActionType, PaymentState, TransactionStatus, RiskLevel, DiagnosisType

@dataclass
class PolicyRuleResult:
    decision: PolicyDecision
    reason: str
    rule_name: str
    passed: bool

@dataclass
class PolicyEvaluation:
    decision: PolicyDecision
    reason: str
    rules_evaluated: List[dict]

def evaluate_policy_rules(
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
    max_auto_retry_amount: float = 50000.0,
    min_auto_recovery_score: int = 80,
    payment_method: str = "CARD",
) -> PolicyEvaluation:
    rules_evaluated = []

    # Rule 1: Already successful
    if transaction_status == TransactionStatus.SUCCESS:
        r = PolicyRuleResult(
            decision=PolicyDecision.STOP,
            reason="Transaction status is already SUCCESS",
            rule_name="ALREADY_SUCCESSFUL",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 2: Ambiguous payment state
    if payment_state == PaymentState.AMBIGUOUS:
        r = PolicyRuleResult(
            decision=PolicyDecision.BLOCK,
            reason="Payment state is AMBIGUOUS. Auto-retry prohibited to prevent double debit.",
            rule_name="AMBIGUOUS_PAYMENT",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 3: Possible customer debit
    if possible_customer_debit:
        r = PolicyRuleResult(
            decision=PolicyDecision.BLOCK,
            reason="Possible customer debit signal detected. Action hard-blocked for safety.",
            rule_name="POSSIBLE_CUSTOMER_DEBIT",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 4: Fraud signal
    if fraud_signal:
        r = PolicyRuleResult(
            decision=PolicyDecision.BLOCK,
            reason="Fraud signal detected on transaction. Action hard-blocked.",
            rule_name="FRAUD_SIGNAL",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 5: Max retries reached
    if retry_count >= max_retries:
        r = PolicyRuleResult(
            decision=PolicyDecision.STOP,
            reason=f"Maximum retry limit reached ({retry_count}/{max_retries})",
            rule_name="MAX_RETRIES_REACHED",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 6: Permanent failure
    if diagnosis == DiagnosisType.PERMANENT_FAILURE.value:
        r = PolicyRuleResult(
            decision=PolicyDecision.STOP,
            reason="Diagnosis indicates PERMANENT_FAILURE",
            rule_name="PERMANENT_FAILURE",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 7: Action non-RETRY (e.g. REMIND, ESCALATE)
    if action != ActionType.RETRY:
        if action == ActionType.STOP:
            r = PolicyRuleResult(decision=PolicyDecision.STOP, reason="Action recommended STOP", rule_name="ACTION_STOP", passed=True)
        else:
            r = PolicyRuleResult(decision=PolicyDecision.HUMAN, reason=f"Action {action.value} routes to human team", rule_name="NON_RETRY_ACTION", passed=True)
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 8: RETRY action with non-CLEAR payment state
    if payment_state != PaymentState.CLEAR:
        r = PolicyRuleResult(
            decision=PolicyDecision.BLOCK,
            reason=f"Cannot execute RETRY when payment state is {payment_state.value}",
            rule_name="NON_CLEAR_RETRY_BLOCK",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 9: High value retry
    if amount > max_auto_retry_amount:
        r = PolicyRuleResult(
            decision=PolicyDecision.HUMAN,
            reason=f"Amount ₹{amount:,.2f} exceeds max auto threshold ₹{max_auto_retry_amount:,.2f}",
            rule_name="HIGH_VALUE_HUMAN_APPROVAL",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 10: Low recovery score
    if recovery_score < min_auto_recovery_score:
        r = PolicyRuleResult(
            decision=PolicyDecision.HUMAN,
            reason=f"Recovery score {recovery_score} is below min auto threshold {min_auto_recovery_score}",
            rule_name="LOW_SCORE_HUMAN_APPROVAL",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Rule 11: Mandate dishonor fee protection guardrail
    is_mandate = (payment_method or "").strip().upper() in {"NACH", "E_MANDATE", "EMANDATE", "UPI_AUTOPAY", "AUTODEBIT", "DIRECT_DEBIT"}
    if is_mandate:
        rules_evaluated.append({
            "rule": "MANDATE_COOLOFF_PROTECTION",
            "decision": "PASSED",
            "reason": f"Mandate payment {payment_method}: 48h cool-off guardrail active to prevent dishonor bounce fees."
        })

    # Rule 12: AUTO qualification
    if (
        amount <= max_auto_retry_amount
        and recovery_score >= min_auto_recovery_score
        and risk_level == RiskLevel.LOW
    ):
        r = PolicyRuleResult(
            decision=PolicyDecision.AUTO,
            reason=f"Qualified for AUTO retry: amount ₹{amount:,.2f} <= ₹{max_auto_retry_amount:,.2f}, score {recovery_score} >= {min_auto_recovery_score}, low risk",
            rule_name="QUALIFIED_AUTO_RETRY",
            passed=True
        )
        rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
        return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

    # Default fallback -> HUMAN
    r = PolicyRuleResult(
        decision=PolicyDecision.HUMAN,
        reason="Default safety policy requirement: routed to human review",
        rule_name="DEFAULT_HUMAN_SAFETY_FALLBACK",
        passed=True
    )
    rules_evaluated.append({"rule": r.rule_name, "decision": r.decision.value, "reason": r.reason})
    return PolicyEvaluation(decision=r.decision, reason=r.reason, rules_evaluated=rules_evaluated)

