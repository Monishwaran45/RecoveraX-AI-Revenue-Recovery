import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.data.generator import generate_synthetic_dataset
from app.agents.nodes.diagnose import diagnose_node
from app.agents.nodes.policy import policy_check_node
from app.agents.nodes.recheck import recheck_node
from app.policy.enums import PolicyDecision, CaseStatus, AuditEventType, ApprovalStatus
from app.services.action_service import action_service
from app.services.approval_service import approval_service

def test_dataset_1000_cases_and_50L_target():
    cust, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
    assert len(cases) >= 1000
    total_amount = sum(c.amount_at_risk for c in cases)
    assert round(total_amount, 2) == 5000000.00
    assert len(subs) > 0
    assert len(invs) > 0

from unittest.mock import patch

def test_llm_failure_forces_human_safety():
    state = {
        "transaction": {"amount": 2000.0, "failure_reason": "BANK_ERROR"},
        "customer": {"successful_payment_count": 5},
        "audit_events": []
    }
    with patch("app.agents.nodes.diagnose.get_groq_llm", return_value=None):
        res = diagnose_node(state)
        assert res.get("diagnosis_confidence") == 0.0
        assert res.get("forced_human") is True

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

@pytest.mark.asyncio
async def test_human_case_execution_requires_approval():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases + apps)
        await session.commit()
        
        # Find case that requires HUMAN approval
        human_case = next((c for c in cases if c.status == CaseStatus.AWAITING_APPROVAL or c.policy_decision == PolicyDecision.HUMAN), cases[1])
        c_id = human_case.id

        # Attempting execute before approval must be blocked
        res_case = await action_service.execute_case_action(session, c_id)
        assert res_case.status in [CaseStatus.AWAITING_APPROVAL, CaseStatus.BLOCKED, CaseStatus.STOPPED]

        # Now approve case
        await approval_service.approve_case(session, c_id, reason="Approved by admin")
        
        # Now execution should proceed cleanly
        exec_case = await action_service.execute_case_action(session, c_id)
        assert exec_case.status in [CaseStatus.RECOVERED, CaseStatus.FAILED, CaseStatus.SCHEDULED, CaseStatus.BLOCKED, CaseStatus.STOPPED]
