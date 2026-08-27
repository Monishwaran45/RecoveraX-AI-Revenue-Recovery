import pytest
from app.data.generator import generate_synthetic_dataset
from app.agents.nodes.diagnose import diagnose_node
from app.agents.nodes.policy import policy_check_node
from app.agents.nodes.recheck import recheck_node
from app.policy.enums import PolicyDecision, CaseStatus, AuditEventType

def test_dataset_1000_cases_and_50L_target():
    cust, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
    assert len(cases) == 1000
    total_amount = sum(c.amount_at_risk for c in cases)
    assert round(total_amount, 2) == 5000000.00
    assert len(subs) > 0
    assert len(invs) > 0

def test_llm_failure_forces_human_safety():
    state = {
        "transaction": {"amount": 2000.0, "failure_reason": "BANK_ERROR"},
        "customer": {"successful_payment_count": 5},
        "audit_events": []
    }
    # Passing empty state without LLM triggers fail-closed safety
    res = diagnose_node(state)
    assert res.get("diagnosis_confidence") == 0.0
    assert res.get("forced_human") is True

    # Pass through policy node to verify forced_human is consumed
    pol_res = policy_check_node(res)
    assert pol_res.get("policy_decision") == PolicyDecision.HUMAN.value

def test_recheck_success_stops_workflow():
    state = {
        "transaction": {"status": "SUCCESS", "payment_state": "CLEAR"},
        "audit_events": []
    }
    res = recheck_node(state)
    assert res.get("workflow_status") == "RECOVERED"
    assert res.get("policy_decision") == PolicyDecision.STOP.value

def test_recheck_ambiguous_blocks_workflow():
    state = {
        "transaction": {"status": "FAILED", "payment_state": "AMBIGUOUS"},
        "audit_events": []
    }
    res = recheck_node(state)
    assert res.get("workflow_status") == "BLOCKED"
    assert res.get("policy_decision") == PolicyDecision.BLOCK.value
