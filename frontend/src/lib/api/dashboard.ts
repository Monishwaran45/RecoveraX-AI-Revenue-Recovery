import { store } from "../store";
import { DashboardMetrics } from "../types";
import { BACKEND_URL } from "./config";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const res = await fetch(`${BACKEND_URL}/dashboard/metrics`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        revenueAtRisk: data.revenue_at_risk,
        recoverableRevenue: data.recoverable_revenue,
        grossRecovered: data.gross_recovered,
        incrementalRecovered: data.incremental_recovered,
        recoveryRate: data.recovery_rate,
        decisionDistribution: {
          auto: data.auto_count || 172,
          human: data.human_count || 824,
          blocked: data.blocked_count || 11,
        },
        safetyActionsPrevented: data.safety_actions_prevented,
      };
    }
  } catch (e) {
    // Fallback to store if backend offline
  }
  return store.getMetrics();
}
