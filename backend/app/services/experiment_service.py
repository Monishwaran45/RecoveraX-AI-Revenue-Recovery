import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.experiment import Experiment
from app.models.experiment_result import ExperimentResult
from app.models.recovery_case import RecoveryCase
from app.policy.enums import CaseStatus, PolicyDecision

class ExperimentService:
    @staticmethod
    async def run_experiment(db: AsyncSession, name: str = "A/B Recovery Experiment") -> Experiment:
        query = select(RecoveryCase)
        res = await db.execute(query)
        cases = list(res.scalars().all())

        case_count = len(cases)
        revenue_at_risk = sum(c.amount_at_risk for c in cases)

        # Baseline strategy: Simple fixed retry rule (recovers ~32% of simple failed payments, 0% subscriptions/invoices)
        baseline_recovered = 0.0
        ai_recovered = 0.0

        exp_id = f"EXP-{uuid.uuid4().hex[:8]}"
        results = []

        for c in cases:
            # Baseline simulation
            if c.problem_type.value == "FAILED_PAYMENT" and c.amount_at_risk < 5000:
                base_recovered = c.amount_at_risk * 0.45
                base_outcome = "RECOVERED"
            else:
                base_recovered = 0.0
                base_outcome = "FAILED"

            baseline_recovered += base_recovered

            # AI Agent simulation (utilizes score, diagnosis, policy & HITL)
            if c.status == CaseStatus.RECOVERED:
                ai_rec = c.amount_at_risk
                ai_outcome = "RECOVERED"
            elif c.policy_decision == PolicyDecision.BLOCK:
                ai_rec = 0.0
                ai_outcome = "BLOCKED_SAFETY"
            elif c.recovery_score >= 60 and c.policy_decision != PolicyDecision.STOP:
                ai_rec = c.amount_at_risk * 0.78
                ai_outcome = "RECOVERED"
            else:
                ai_rec = 0.0
                ai_outcome = "FAILED"

            ai_recovered += ai_rec
            inc_rec = round(max(0.0, ai_rec - base_recovered), 2)

            res_obj = ExperimentResult(
                id=f"RES-{uuid.uuid4().hex[:8]}",
                experiment_id=exp_id,
                case_id=c.id,
                baseline_outcome=base_outcome,
                ai_outcome=ai_outcome,
                amount_at_risk=c.amount_at_risk,
                amount_recovered=round(ai_rec, 2),
                incremental_recovered=inc_rec,
                created_at=datetime.utcnow()
            )
            results.append(res_obj)

        incremental_recovered = round(max(0.0, ai_recovered - baseline_recovered), 2)

        exp = Experiment(
            id=exp_id,
            name=name,
            case_count=case_count,
            revenue_at_risk=round(revenue_at_risk, 2),
            baseline_recovered=round(baseline_recovered, 2),
            ai_recovered=round(ai_recovered, 2),
            incremental_recovered=incremental_recovered,
            created_at=datetime.utcnow()
        )

        db.add(exp)
        for r in results:
            db.add(r)

        await db.commit()
        await db.refresh(exp)
        return exp

    @staticmethod
    async def get_experiment_by_id(db: AsyncSession, experiment_id: str) -> Optional[Experiment]:
        query = select(Experiment).where(Experiment.id == experiment_id).options(
            selectinload(Experiment.results)
        )
        res = await db.execute(query)
        exp = res.scalar_one_or_none()
        if exp and exp.revenue_at_risk > 0:
            exp.baseline_recovery_rate = round((exp.baseline_recovered / exp.revenue_at_risk) * 100.0, 1)
            exp.ai_recovery_rate = round((exp.ai_recovered / exp.revenue_at_risk) * 100.0, 1)
        return exp

experiment_service = ExperimentService()
