from datetime import datetime, timedelta
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.data.generator import generate_synthetic_dataset
from app.services.p2p_service import p2p_service
from app.policy.enums import CaseStatus

@pytest.mark.asyncio
async def test_create_p2p_promise():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        test_case = cases[0]
        future_date = datetime.utcnow() + timedelta(days=5)
        promise = await p2p_service.create_promise(
            db=session,
            case_id=test_case.id,
            promised_amount=test_case.amount_at_risk,
            promised_date=future_date,
            notes="Customer promised salary deposit on 5th"
        )
        assert promise.id.startswith("P2P-")
        assert promise.case_id == test_case.id
        assert promise.status == "PROMISED"
        assert promise.promised_amount == test_case.amount_at_risk

@pytest.mark.asyncio
async def test_create_p2p_invalid_amount():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        test_case = cases[0]
        future_date = datetime.utcnow() + timedelta(days=3)
        with pytest.raises(ValueError, match="must be greater than zero"):
            await p2p_service.create_promise(
                db=session,
                case_id=test_case.id,
                promised_amount=0.0,
                promised_date=future_date
            )

@pytest.mark.asyncio
async def test_verify_p2p_kept():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        test_case = cases[0]
        future_date = datetime.utcnow() + timedelta(days=2)
        promise = await p2p_service.create_promise(
            db=session,
            case_id=test_case.id,
            promised_amount=test_case.amount_at_risk,
            promised_date=future_date
        )

        # Mark case as RECOVERED
        test_case.status = CaseStatus.RECOVERED
        await session.commit()

        verified = await p2p_service.verify_promise(
            db=session,
            case_id=test_case.id,
            promise_id=promise.id
        )
        assert verified.status == "P2P_KEPT"

@pytest.mark.asyncio
async def test_verify_p2p_broken():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        custs, txs, subs, invs, cases, recs, apps, logs = generate_synthetic_dataset(seed=42)
        session.add_all(custs + txs + cases)
        await session.commit()

        test_case = cases[0]
        past_date = datetime.utcnow() - timedelta(days=2)
        promise = await p2p_service.create_promise(
            db=session,
            case_id=test_case.id,
            promised_amount=test_case.amount_at_risk,
            promised_date=past_date
        )

        # Case remains FAILED
        test_case.status = CaseStatus.FAILED
        await session.commit()

        verified = await p2p_service.verify_promise(
            db=session,
            case_id=test_case.id,
            promise_id=promise.id
        )
        assert verified.status == "P2P_BROKEN"
