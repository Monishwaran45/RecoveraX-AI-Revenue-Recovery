import { RecoveryCase, DashboardMetrics } from "./types";

export const INITIAL_METRICS: DashboardMetrics = {
  revenueAtRisk: 0,
  recoverableRevenue: 0,
  grossRecovered: 0,
  incrementalRecovered: 0,
  safetyActionsPrevented: 0,
  totalCases: 0,
  recoveryRate: 0,
  decisionDistribution: {
    auto: 0,
    human: 0,
    blocked: 0,
  },
};

export const INITIAL_CASES: RecoveryCase[] = [];
