import { BACKEND_URL } from "./config";

export interface ExperimentDetail {
  id: string;
  name: string;
  case_count: number;
  total_cases: number;
  revenue_at_risk: number;
  ai_recovered: number;
  gross_recovered: number;
  baseline_recovered: number;
  incremental_recovered: number;
  recovery_rate: number;
  baseline_recovery_rate: number;
  ai_recovery_rate: number;
  auto_count: number;
  human_count: number;
  blocked_count: number;
  stopped_count: number;
  safety_actions_prevented: number;
  created_at: string;
}

function parseExperimentData(data: any): ExperimentDetail {
  const count = data.case_count ?? data.total_cases ?? 0;
  const gross = data.ai_recovered ?? data.gross_recovered ?? 0;
  const baseRec = data.baseline_recovered ?? 0;
  const rate = data.ai_recovery_rate ?? data.recovery_rate ?? 0;
  const baseRate = data.baseline_recovery_rate ?? 0;
  const results = data.results || [];

  let autoCount = data.auto_count || 0;
  let humanCount = data.human_count || 0;
  let blockedCount = data.blocked_count || 0;
  let stoppedCount = data.stopped_count || 0;

  if (autoCount === 0 && humanCount === 0 && blockedCount === 0 && results.length > 0) {
    for (const r of results) {
      if (r.ai_outcome === "RECOVERED") autoCount++;
      else if (r.ai_outcome === "AWAITING_HUMAN_APPROVAL") humanCount++;
      else if (r.ai_outcome === "BLOCKED_SAFETY") blockedCount++;
      else if (r.ai_outcome === "STOPPED") stoppedCount++;
    }
    if (blockedCount === 0 && stoppedCount > 0) blockedCount = stoppedCount;
  }

  return {
    id: data.id,
    name: data.name,
    case_count: count,
    total_cases: count,
    revenue_at_risk: data.revenue_at_risk ?? 0,
    ai_recovered: gross,
    gross_recovered: gross,
    baseline_recovered: baseRec,
    incremental_recovered: data.incremental_recovered ?? 0,
    recovery_rate: rate,
    baseline_recovery_rate: baseRate,
    ai_recovery_rate: rate,
    auto_count: autoCount,
    human_count: humanCount,
    blocked_count: blockedCount,
    stopped_count: stoppedCount,
    safety_actions_prevented: data.safety_actions_prevented || blockedCount,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

export async function getExperiment(experimentId?: string): Promise<ExperimentDetail | null> {
  try {
    const url = experimentId ? `${BACKEND_URL}/experiments/${experimentId}` : `${BACKEND_URL}/experiments/latest`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch experiment data from backend API: HTTP ${res.status}`);
    }
    const data = await res.json();
    return parseExperimentData(data);
  } catch (err) {
    console.warn("Experiment backend fetch failed, returning default cohort metrics:", err);
    return parseExperimentData({});
  }
}

export async function runBatchExperiment(): Promise<ExperimentDetail> {
  const res = await fetch(`${BACKEND_URL}/experiments/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to execute batch experiment on backend API: HTTP ${res.status}`);
  }
  const data = await res.json();
  return parseExperimentData(data);
}
