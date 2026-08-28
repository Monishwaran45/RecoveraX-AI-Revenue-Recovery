from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.recovery_case import RecoveryCase
from app.policy.enums import PolicyDecision, CaseStatus
from app.schemas.recovery_case import DashboardMetrics

class DashboardService:
    @staticmethod
    async def get_metrics(db: AsyncSession) -> DashboardMetrics:
        query = select(RecoveryCase)
        res = await db.execute(query)
        cases = list(res.scalars().all())

        total_cases = len(cases)
        if total_cases == 0:
            return DashboardMetrics(
                revenue_at_risk=0.0,
                recoverable_revenue=0.0,
                gross_recovered=0.0,
                incremental_recovered=0.0,
                recovery_rate=0.0,
                auto_count=0,
                human_count=0,
                blocked_count=0,
                stopped_count=0,
                total_cases=0,
                decision_distribution=[],
                safety_actions_prevented=0
            )

        revenue_at_risk = sum(c.amount_at_risk for c in cases)
        recoverable_revenue = sum(c.amount_at_risk for c in cases if c.recovery_score >= 70)
        gross_recovered = sum(c.amount_at_risk for c in cases if c.status == CaseStatus.RECOVERED)
        baseline_recovered = sum(c.amount_at_risk * 0.45 for c in cases if c.status == CaseStatus.RECOVERED)
        incremental_recovered = max(0.0, gross_recovered - baseline_recovered)

        recovery_rate = (gross_recovered / revenue_at_risk * 100.0) if revenue_at_risk > 0 else 0.0

        auto_count = sum(1 for c in cases if c.policy_decision == PolicyDecision.AUTO)
        human_count = sum(1 for c in cases if c.policy_decision == PolicyDecision.HUMAN or c.status == CaseStatus.AWAITING_APPROVAL)
        blocked_count = sum(1 for c in cases if c.policy_decision == PolicyDecision.BLOCK or c.status == CaseStatus.BLOCKED)
        stopped_count = sum(1 for c in cases if c.policy_decision == PolicyDecision.STOP or c.status == CaseStatus.STOPPED)

        decision_distribution = [
          {"name": "AUTO", "value": auto_count, "color": "#10b981"},
          {"name": "HUMAN", "value": human_count, "color": "#f59e0b"},
          {"name": "BLOCKED", "value": blocked_count, "color": "#ef4444"},
          {"name": "STOPPED", "value": stopped_count, "color": "#64748b"}
        ]

        safety_actions_prevented = blocked_count

        # Dynamic 7-day recovery trend calculated from database cases
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily_totals = {day: {"recovered": 0.0, "attempted": 0.0} for day in days}
        for c in cases:
            day_name = c.created_at.strftime("%a") if c.created_at else "Mon"
            if day_name in daily_totals:
                daily_totals[day_name]["attempted"] += c.amount_at_risk
                if c.status == CaseStatus.RECOVERED:
                    daily_totals[day_name]["recovered"] += c.amount_at_risk

        recovery_trend = [
            {
                "day": day,
                "recovered": round(daily_totals[day]["recovered"], 2),
                "attempted": round(daily_totals[day]["attempted"], 2)
            }
            for day in days
        ]

        return DashboardMetrics(
            revenue_at_risk=round(revenue_at_risk, 2),
            recoverable_revenue=round(recoverable_revenue, 2),
            gross_recovered=round(gross_recovered, 2),
            incremental_recovered=round(incremental_recovered, 2),
            recovery_rate=round(recovery_rate, 1),
            auto_count=auto_count,
            human_count=human_count,
            blocked_count=blocked_count,
            stopped_count=stopped_count,
            total_cases=total_cases,
            decision_distribution=decision_distribution,
            safety_actions_prevented=safety_actions_prevented,
            recovery_trend=recovery_trend
        )

dashboard_service = DashboardService()
