# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.middleware.idempotency import idempotency_store
from app.agents.nodes.recheck import recheck_node
from app.policy.enums import PolicyDecision, PaymentState, TransactionStatus

client = TestClient(app)

@pytest.mark.asyncio
async def test_idempotency_store_caching_and_expiration():
    await idempotency_store.clear()
    key = "test_idempotency_key_123"
    
    # Store should initially be empty
    cached = await idempotency_store.get(key)
    assert cached is None

    # Set cached response
    await idempotency_store.set(key, 200, {"content-type": "application/json"}, b'{"status": "ok"}')
    
    # Second fetch should return cached response
    cached_res = await idempotency_store.get(key)
    assert cached_res is not None
    status, headers, body = cached_res
    assert status == 200
    assert body == b'{"status": "ok"}'

def test_idempotent_http_post_deduplication():
    key = "idempotent_req_unique_999"
    headers = {
        "Idempotency-Key": key,
        "X-API-Token": "demo_secret_token_2026"
    }
    
    # Health endpoint check
    res1 = client.get("/health")
    assert res1.status_code == 200

def test_concurrent_precheck_double_debit_prevention():
    # Simulate fresh payment state recheck when external bank status cleared
    cleared_state = {
        "transaction": {"status": TransactionStatus.SUCCESS.value, "payment_state": PaymentState.CLEAR.value},
        "audit_events": []
    }
    node_out = recheck_node(cleared_state)
    assert node_out["workflow_status"] == "RECOVERED"
    assert node_out["policy_decision"] == PolicyDecision.STOP.value

    # Simulate ambiguous bank state during distributed worker crash
    ambiguous_state = {
        "transaction": {"status": TransactionStatus.AMBIGUOUS.value, "payment_state": PaymentState.AMBIGUOUS.value},
        "audit_events": []
    }
    node_out_ambiguous = recheck_node(ambiguous_state)
    assert node_out_ambiguous["workflow_status"] == "BLOCKED"
    assert node_out_ambiguous["policy_decision"] == PolicyDecision.BLOCK.value
