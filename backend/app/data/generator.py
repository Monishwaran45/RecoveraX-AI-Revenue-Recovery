import random
import uuid
from datetime import datetime, timedelta
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.recovery_case import RecoveryCase
from app.models.recommendation import Recommendation
from app.models.approval import ApprovalRequest
from app.models.audit import AuditLog
from app.policy.enums import ProblemType, RiskLevel, ActionType, PolicyDecision, CaseStatus, TransactionStatus, PaymentState, AuditEventType, ActorType, ApprovalStatus

def generate_synthetic_dataset(seed: int = 42):
    random.seed(seed)
    
    customers = []
    transactions = []
    subscriptions = []
    invoices = []
    recovery_cases = []
    recommendations = []
    approval_requests = []
    audit_logs = []

    first_names = ["Rohan", "Priya", "Vikram", "Ananya", "Amit", "Sneha", "Karan", "Divya", "Rahul", "Meera", "Siddharth", "Pooja", "Arjun", "Kavya", "Nitin", "Ritu", "Gaurav", "Nisha", "Manish", "Swati"]
    last_names = ["Sharma", "Verma", "Gupta", "Patel", "Mehta", "Joshi", "Rao", "Nair", "Kapoor", "Singh", "Reddy", "Chawla", "Bhat", "Deshmukh", "Agarwal", "Saxena", "Trivedi", "Banerjee", "Kulkarni", "Iyer"]
    domains = ["gmail.com", "yahoo.com", "outlook.com", "acme.io", "techcorp.in", "enterprise.org"]

    # 1. Generate 300 Customers
    for i in range(1, 301):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}{i}@{random.choice(domains)}"
        cust = Customer(
            id=f"CUST-{1000+i}",
            name=name,
            email=email,
            lifetime_value=round(random.uniform(5000, 250000), 2),
            successful_payment_count=random.randint(2, 45),
            failed_payment_count=random.randint(0, 5),
            average_payment_delay_days=round(random.uniform(0.1, 4.5), 1),
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365))
        )
        customers.append(cust)

    used_case_ids = set()

    # Helper function for generating case
    def create_case(c_id, amount, prob_type, failure_reason, payment_state, poss_debit, fraud, score, risk, action, policy, status, retry_cnt=0):
        cust = random.choice(customers)
        tx_id = f"TX-{uuid.uuid4().hex[:8].upper()}"
        
        if c_id:
            case_id = c_id
        else:
            base_idx = len(recovery_cases) + 2000
            while f"CASE-{base_idx}" in used_case_ids:
                base_idx += 1
            case_id = f"CASE-{base_idx}"

        used_case_ids.add(case_id)

        tx = Transaction(
            id=tx_id,
            customer_id=cust.id,
            amount=amount,
            currency="INR",
            status=TransactionStatus.SUCCESS if status == CaseStatus.RECOVERED else (TransactionStatus.AMBIGUOUS if payment_state == PaymentState.AMBIGUOUS else TransactionStatus.FAILED),
            payment_method=random.choice(["CARD", "UPI", "NETBANKING", "NACH"]),
            failure_reason=failure_reason,
            payment_state=payment_state,
            possible_customer_debit=poss_debit,
            fraud_signal=fraud,
            retry_count=retry_cnt,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        )
        transactions.append(tx)

        # Generate corresponding Subscription / Invoice records for full relational completeness
        if prob_type == ProblemType.SUBSCRIPTION_FAILURE:
            sub = Subscription(
                id=f"SUB-{uuid.uuid4().hex[:8]}",
                customer_id=cust.id,
                amount=amount,
                status="PAST_DUE",
                next_payment_date=datetime.utcnow() + timedelta(hours=24)
            )
            subscriptions.append(sub)
        elif prob_type == ProblemType.OVERDUE_INVOICE:
            inv = Invoice(
                id=f"INV-{uuid.uuid4().hex[:8]}",
                customer_id=cust.id,
                amount=amount,
                due_date=datetime.utcnow() - timedelta(days=18),
                status="OVERDUE",
                created_at=datetime.utcnow() - timedelta(days=30)
            )
            invoices.append(inv)

        case = RecoveryCase(
            id=case_id,
            source_type="TRANSACTION",
            source_id=tx_id,
            customer_id=cust.id,
            amount_at_risk=amount,
            problem_type=prob_type,
            recovery_score=score,
            risk_level=risk,
            recommended_action=action,
            policy_decision=policy,
            status=status,
            retry_count=retry_cnt,
            max_retries=2,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        )
        recovery_cases.append(case)

        rec = Recommendation(
            id=f"REC-{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            diagnosis="TEMPORARY_FAILURE" if score > 70 else ("AMBIGUOUS_STATE" if payment_state == PaymentState.AMBIGUOUS else "INSUFFICIENT_FUNDS"),
            recovery_score=score,
            recommended_action=action,
            delay_minutes=30,
            expected_recovery_value=round(amount * (score / 100.0) - 20, 2),
            reason=f"AI Recommendation for {prob_type.value}: {failure_reason}",
            created_at=case.created_at
        )
        recommendations.append(rec)

        if policy == PolicyDecision.HUMAN or status == CaseStatus.AWAITING_APPROVAL:
            app = ApprovalRequest(
                id=f"APP-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                status=ApprovalStatus.PENDING,
                ai_recommendation=f"Recommend {action.value} delay 30m. Amount ₹{amount:,.2f} exceeds threshold.",
                reason="Policy requires human sign-off for high value or medium risk cases.",
                created_at=case.created_at
            )
            approval_requests.append(app)

        aud = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            event_type=AuditEventType.CASE_CREATED,
            actor_type=ActorType.SYSTEM,
            actor_id="SYSTEM",
            reason=f"Case initialized for {prob_type.value} amount ₹{amount:,.2f}",
            metadata_json={"amount_at_risk": amount, "score": score, "policy": policy.value},
            timestamp=case.created_at
        )
        audit_logs.append(aud)

    # 2. Seed 5 Mandatory Demo Cases (Sum: ₹1,79,000)
    create_case("CASE-1021", 2000.0, ProblemType.FAILED_PAYMENT, "TEMPORARY_BANK_ERROR", PaymentState.CLEAR, False, False, 87, RiskLevel.LOW, ActionType.RETRY, PolicyDecision.AUTO, CaseStatus.SCHEDULED)
    create_case("CASE-1032", 75000.0, ProblemType.FAILED_PAYMENT, "BANK_TIMEOUT", PaymentState.CLEAR, False, False, 82, RiskLevel.MEDIUM, ActionType.RETRY, PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL)
    create_case("CASE-1048", 25000.0, ProblemType.FAILED_PAYMENT, "GATEWAY_TIMEOUT_AMBIGUOUS", PaymentState.AMBIGUOUS, True, False, 10, RiskLevel.HIGH, ActionType.STOP, PolicyDecision.BLOCK, CaseStatus.BLOCKED)
    create_case("CASE-1088", 2000.0, ProblemType.SUBSCRIPTION_FAILURE, "CARD_EXPIRED", PaymentState.CLEAR, False, False, 65, RiskLevel.MEDIUM, ActionType.RETRY, PolicyDecision.HUMAN, CaseStatus.OPEN, retry_cnt=1)
    create_case("CASE-1102", 75000.0, ProblemType.OVERDUE_INVOICE, "INVOICE_OVERDUE_18_DAYS", PaymentState.CLEAR, False, False, 55, RiskLevel.HIGH, ActionType.ESCALATE, PolicyDecision.HUMAN, CaseStatus.AWAITING_APPROVAL)

    # Remaining target = ₹48,21,000 for 995 cases (~₹4,845 per case average)
    # 3. Generate 395 Failed Payments (Total ~₹19.5L)
    for _ in range(395):
        amt = round(random.choice([1499.0, 2499.0, 3999.0, 4999.0, 7500.0, 12000.0]), 2)
        score = random.randint(45, 95)
        risk = RiskLevel.LOW if amt <= 5000 and score >= 80 else (RiskLevel.HIGH if amt >= 25000 else RiskLevel.MEDIUM)
        policy = PolicyDecision.AUTO if risk == RiskLevel.LOW else (PolicyDecision.BLOCK if score < 20 else PolicyDecision.HUMAN)
        status = CaseStatus.RECOVERED if policy == PolicyDecision.AUTO and random.random() < 0.75 else (CaseStatus.AWAITING_APPROVAL if policy == PolicyDecision.HUMAN else CaseStatus.BLOCKED)
        create_case(None, amt, ProblemType.FAILED_PAYMENT, "INSUFFICIENT_FUNDS", PaymentState.CLEAR, False, False, score, risk, ActionType.RETRY, policy, status)

    # 4. Generate 250 Checkout Abandonment (Total ~₹12L)
    for _ in range(250):
        amt = round(random.choice([1200.0, 2999.0, 4800.0, 8500.0]), 2)
        score = random.randint(50, 90)
        risk = RiskLevel.LOW if amt <= 5000 else RiskLevel.MEDIUM
        policy = PolicyDecision.AUTO if risk == RiskLevel.LOW else PolicyDecision.HUMAN
        create_case(None, amt, ProblemType.CHECKOUT_ABANDONMENT, "SESSION_TIMEOUT", PaymentState.CLEAR, False, False, score, risk, ActionType.REMIND, policy, CaseStatus.OPEN)

    # 5. Generate 199 Subscription Failures (Total ~₹9.5L)
    for _ in range(199):
        amt = round(random.choice([999.0, 1999.0, 4999.0, 8999.0]), 2)
        score = random.randint(40, 88)
        risk = RiskLevel.LOW if amt <= 5000 and score >= 80 else RiskLevel.MEDIUM
        policy = PolicyDecision.AUTO if risk == RiskLevel.LOW else PolicyDecision.HUMAN
        create_case(None, amt, ProblemType.SUBSCRIPTION_FAILURE, "CARD_DECLINED", PaymentState.CLEAR, False, False, score, risk, ActionType.RETRY, policy, CaseStatus.SCHEDULED)

    # 6. Generate 151 Overdue Invoices (Total ~₹7.2L) -> Total sum EXACTLY ₹50,00,000.00 (1,000 total cases)
    for _ in range(151):
        amt = round(random.choice([3500.0, 4800.0, 6500.0, 12000.0]), 2)
        score = random.randint(30, 75)
        risk = RiskLevel.HIGH if amt >= 25000 else RiskLevel.MEDIUM
        policy = PolicyDecision.HUMAN
        create_case(None, amt, ProblemType.OVERDUE_INVOICE, "OVERDUE_PAYMENT_PROMISE", PaymentState.CLEAR, False, False, score, risk, ActionType.ESCALATE, policy, CaseStatus.AWAITING_APPROVAL)

    # Exact target sum normalization to ₹50,00,000.00
    TARGET_TOTAL = 5000000.00
    current_total = sum(c.amount_at_risk for c in recovery_cases)
    diff = TARGET_TOTAL - current_total
    
    non_demo_cases = [c for c in recovery_cases if c.id not in {"CASE-1021", "CASE-1032", "CASE-1048", "CASE-1088", "CASE-1102"}]
    if non_demo_cases:
        adj = round(diff / len(non_demo_cases), 2)
        for c in non_demo_cases[:-1]:
            c.amount_at_risk = round(c.amount_at_risk + adj, 2)
        
        # Sync transactions & recommendations
        tx_map = {t.id: t for t in transactions}
        for c in recovery_cases:
            if c.source_id in tx_map:
                tx_map[c.source_id].amount = c.amount_at_risk

        new_sum = sum(c.amount_at_risk for c in recovery_cases)
        remainder = round(TARGET_TOTAL - new_sum, 2)
        non_demo_cases[-1].amount_at_risk = round(non_demo_cases[-1].amount_at_risk + remainder, 2)
        if non_demo_cases[-1].source_id in tx_map:
            tx_map[non_demo_cases[-1].source_id].amount = non_demo_cases[-1].amount_at_risk

    return customers, transactions, subscriptions, invoices, recovery_cases, recommendations, approval_requests, audit_logs
