import { DashboardMetrics } from "../types";
import { BACKEND_URL } from "./config";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${BACKEND_URL}/dashboard/metrics`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics from backend API: HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    revenueAtRisk: data.revenue_at_risk,
    recoverableRevenue: data.recoverable_revenue,
    grossRecovered: data.gross_recovered,
    incrementalRecovered: data.incremental_recovered,
    recoveryRate: data.recovery_rate,
    decisionDistribution: {
      auto: data.auto_count || 0,
      human: data.human_count || 0,
      blocked: data.blocked_count || 0,
    },
    safetyActionsPrevented: data.safety_actions_prevented,
    totalCases: data.total_cases || 0,
    recoveryTrend: data.recovery_trend || [],
  };
}
