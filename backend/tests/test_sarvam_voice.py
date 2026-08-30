import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.data.generator import generate_synthetic_dataset
from app.integrations.sarvam import generate_hinglish_voice_script, synthesize_hinglish_audio
from app.services.voice_service import voice_service
from app.policy.enums import CaseStatus, PolicyDecision, PaymentState

@pytest.mark.asyncio
async def test_generate_hinglish_script():
    script_sub = generate_hinglish_voice_script(customer_name="Rahul", amount=4999.0, problem_type="SUBSCRIPTION_FAILURE")
    assert "Rahul" in script_sub
    assert "₹4,999.00" in script_sub
    assert "Namaste" in script_sub
    assert "subscription" in script_sub

@pytest.mark.asyncio
async def test_sarvam_mock_mode():
    from unittest.mock import patch
    script = "Namaste Ji! Aapka payment ₹1,000 pending hai."
    with patch("app.config.settings.SARVAM_API_KEY", ""):
        res = synthesize_hinglish_audio(script)
        assert res["mode"] == "MOCK"
        assert res["status"] in ["COMPLETED", "SYNTHESIZED", "FALLBACK_MOCK"]
        assert res["audio_available"] is True
        assert res["script"] == script

@pytest.mark.asyncio
async def test_sarvam_voice_service_dispatch():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        test_case = cases[0]
        test_case.payment_state = PaymentState.CLEAR
        test_case.status = CaseStatus.OPEN
        await session.commit()

        res = await voice_service.dispatch_voice_call(db=session, case_id=test_case.id)
        assert res["case_id"] == test_case.id
        assert res["status"] in ["COMPLETED", "SYNTHESIZED"]
        assert res["voice_mode"] in ["MOCK", "REAL"]
        assert "Namaste" in res["script"]

@pytest.mark.asyncio
async def test_sarvam_voice_policy_blocked():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        blocked_case = next(c for c in cases if c.status == CaseStatus.BLOCKED or c.policy_decision == PolicyDecision.BLOCK)
        res = await voice_service.dispatch_voice_call(db=session, case_id=blocked_case.id)
        assert res["policy_blocked"] is True
        assert res["status"] == "BLOCKED"
        assert res["voice_mode"] == "BLOCKED"
