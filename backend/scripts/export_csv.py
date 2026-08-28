import os
import csv
import json
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.data.generator import generate_synthetic_dataset

def export_all_to_csv(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    customers, transactions, subscriptions, invoices, recovery_cases, recommendations, approval_requests, audit_logs = generate_synthetic_dataset(seed=42)

    # 1. Customers
    with open(os.path.join(output_dir, "customers.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "email", "lifetime_value", "successful_payment_count", "failed_payment_count", "average_payment_delay_days", "created_at"])
        for c in customers:
            writer.writerow([c.id, c.name, c.email, c.lifetime_value, c.successful_payment_count, c.failed_payment_count, c.average_payment_delay_days, c.created_at.isoformat()])

    # 2. Transactions
    with open(os.path.join(output_dir, "transactions.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "customer_id", "amount", "currency", "payment_method", "status", "failure_reason", "payment_state", "possible_customer_debit", "fraud_signal", "retry_count", "created_at"])
        for t in transactions:
            writer.writerow([t.id, t.customer_id, t.amount, t.currency, t.payment_method, t.status.value if hasattr(t.status, 'value') else t.status, t.failure_reason, t.payment_state.value if hasattr(t.payment_state, 'value') else t.payment_state, t.possible_customer_debit, t.fraud_signal, t.retry_count, t.created_at.isoformat()])

    # 3. Subscriptions
    with open(os.path.join(output_dir, "subscriptions.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "customer_id", "amount", "status", "next_payment_date"])
        for s in subscriptions:
            writer.writerow([s.id, s.customer_id, s.amount, s.status, s.next_payment_date.isoformat() if s.next_payment_date else ""])

    # 4. Invoices
    with open(os.path.join(output_dir, "invoices.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "customer_id", "amount", "due_date", "status", "created_at"])
        for inv in invoices:
            writer.writerow([inv.id, inv.customer_id, inv.amount, inv.due_date.isoformat() if inv.due_date else "", inv.status, inv.created_at.isoformat() if inv.created_at else ""])

    # 5. Recovery Cases
    with open(os.path.join(output_dir, "recovery_cases.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "source_type", "source_id", "customer_id", "amount_at_risk", "problem_type", "recovery_score", "risk_level", "recommended_action", "policy_decision", "status", "retry_count", "max_retries", "created_at"])
        for rc in recovery_cases:
            writer.writerow([
                rc.id, rc.source_type, rc.source_id, rc.customer_id, rc.amount_at_risk,
                rc.problem_type.value if hasattr(rc.problem_type, 'value') else rc.problem_type,
                rc.recovery_score,
                rc.risk_level.value if hasattr(rc.risk_level, 'value') else rc.risk_level,
                rc.recommended_action.value if hasattr(rc.recommended_action, 'value') else rc.recommended_action,
                rc.policy_decision.value if hasattr(rc.policy_decision, 'value') else rc.policy_decision,
                rc.status.value if hasattr(rc.status, 'value') else rc.status,
                rc.retry_count, rc.max_retries, rc.created_at.isoformat()
            ])

    # 6. Recommendations
    with open(os.path.join(output_dir, "recommendations.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "case_id", "diagnosis", "recovery_score", "recommended_action", "delay_minutes", "expected_recovery_value", "reason", "created_at"])
        for rec in recommendations:
            writer.writerow([
                rec.id, rec.case_id, rec.diagnosis, rec.recovery_score,
                rec.recommended_action.value if hasattr(rec.recommended_action, 'value') else rec.recommended_action,
                rec.delay_minutes, rec.expected_recovery_value, rec.reason, rec.created_at.isoformat()
            ])

    # 7. Approval Requests
    with open(os.path.join(output_dir, "approval_requests.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "case_id", "status", "ai_recommendation", "reason", "created_at"])
        for app in approval_requests:
            writer.writerow([
                app.id, app.case_id,
                app.status.value if hasattr(app.status, 'value') else app.status,
                app.ai_recommendation, app.reason, app.created_at.isoformat()
            ])

    # 8. Audit Logs
    with open(os.path.join(output_dir, "audit_logs.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "case_id", "event_type", "actor_type", "actor_id", "reason", "metadata_json", "timestamp"])
        for aud in audit_logs:
            writer.writerow([
                aud.id, aud.case_id,
                aud.event_type.value if hasattr(aud.event_type, 'value') else aud.event_type,
                aud.actor_type.value if hasattr(aud.actor_type, 'value') else aud.actor_type,
                aud.actor_id, aud.reason, json.dumps(aud.metadata_json), aud.timestamp.isoformat()
            ])

    print(f"Successfully exported dataset CSV files to: {os.path.abspath(output_dir)}")

if __name__ == "__main__":
    project_root_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    backend_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data_export"))
    export_all_to_csv(project_root_data)
    export_all_to_csv(backend_data)
