import pytest
from app.agents.graph import recovery_graph

def test_langgraph_pipeline_execution():
    initial_state = {
        "case_id": "CASE-1021",
        "transaction": {
            "id": "TX-1021",
            "amount": 2000.0,
            "status": "FAILED",
            "failure_reason": "TEMPORARY_BANK_ERROR",
            "payment_state": "CLEAR",
            "possible_customer_debit": False,
            "fraud_signal": False,
            "retry_count": 0,
        },
        "customer": {
            "id": "CUST-1021",
            "name": "Rohan Sharma",
            "successful_payment_count": 8,
            "failed_payment_count": 1,
            "average_payment_delay_days": 0.5,
        },
        "retry_count": 0,
        "max_retries": 2,
        "audit_events": []
    }
    
    final_state = recovery_graph.invoke(initial_state)
    assert final_state["recovery_score"] >= 80
    assert "audit_events" in final_state
    assert len(final_state["audit_events"]) > 0
