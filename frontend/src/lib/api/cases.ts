import { RecoveryCase, RiskLevel, CaseStatus, CaseType, PolicyDecisionType } from "../types";
import { BACKEND_URL } from "./config";

export function formatDynamicTitle(rawStr?: string): string {
  if (!rawStr) return "Payment Failure Detected";
  const cleaned = String(rawStr).replace(/_/g, " ").trim().toLowerCase();
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapBackendCaseToFrontend(item: any): RecoveryCase {
  const riskVal: RiskLevel = (item.risk_level as RiskLevel) || "MEDIUM";
  
  let caseType: CaseType = "FAILED_PAYMENT";
  if (item.problem_type === "SUBSCRIPTION_FAILURE") caseType = "SUBSCRIPTION";
  else if (item.problem_type === "OVERDUE_INVOICE") caseType = "INVOICE";
  else if (item.problem_type === "CHECKOUT_ABANDONMENT") caseType = "CHECKOUT";



  const rec = item.latest_recommendation || (Array.isArray(item.recommendations) && item.recommendations[0]) || {};
  const cust = item.customer || {};

  const evidence = [
    {
      id: "e1",
      text: `Customer LTV: ₹${(cust.lifetime_value || 0).toLocaleString("en-IN")} (${cust.successful_payment_count || 0} successful payments)`,
      isPositive: (cust.successful_payment_count || 0) > 3,
    },
    {
      id: "e2",
      text: `Historical Payment Delay: ${cust.average_payment_delay_days || 0} days avg`,
      isPositive: (cust.average_payment_delay_days || 0) < 5,
    },
    {
      id: "e3",
      text: `AI Risk Assessment: ${riskVal} Risk Tier (Confidence Score ${item.recovery_score || 50}/100)`,
      isPositive: (item.recovery_score || 50) >= 70,
    },
    {
      id: "e4",
      text: `Attempt Tracking: ${item.retry_count || 0} of max ${item.max_retries || 2} retries executed`,
      isPositive: (item.retry_count || 0) < (item.max_retries || 2),
    },
  ];

  const rules = [
    {
      id: "r1",
      text: `Amount Policy: ₹${(item.amount_at_risk || 0).toLocaleString("en-IN")} <= ₹50,000 Auto Limit`,
      passed: (item.amount_at_risk || 0) <= 50000,
    },
    {
      id: "r2",
      text: `Confidence Threshold: ${item.recovery_score || 50}/100 >= 80 Score Minimum`,
      passed: (item.recovery_score || 50) >= 80,
    },
    {
      id: "r3",
      text: `Retry Limit: ${item.retry_count || 0} < ${item.max_retries || 2} Max Attempts`,
      passed: (item.retry_count || 0) < (item.max_retries || 2),
    },
  ];

  let rawPolicy = "";
  if (typeof item.policy_decision === "string") {
    rawPolicy = item.policy_decision;
  } else if (item.policy_decision?.value) {
    rawPolicy = item.policy_decision.value;
  } else if (item.policy_decision?.type) {
    rawPolicy = item.policy_decision.type;
  }

  let policyType: PolicyDecisionType = "HUMAN";
  const strUpper = String(rawPolicy || "").toUpperCase();
  if (strUpper.includes("BLOCK") || item.status === "BLOCKED") {
    policyType = "BLOCK";
  } else if (strUpper.includes("HUMAN") || item.status === "AWAITING_APPROVAL") {
    policyType = "HUMAN";
  } else if (strUpper.includes("AUTO") || item.status === "SCHEDULED") {
    policyType = "AUTO";
  } else if (strUpper.includes("STOP") || item.status === "STOPPED") {
    policyType = "STOP";
  } else {
    policyType = "HUMAN";
  }

  const verificationResult = item.verification_result || (item.status === "RECOVERED" ? "VERIFIED_SUCCESS" : "NONE");
  const amountRecovered = item.amount_recovered !== undefined ? item.amount_recovered : (item.status === "RECOVERED" ? (item.amount_at_risk || 0) : 0);
  const approvalStatus = item.approval_status || (item.status === "AWAITING_APPROVAL" ? "PENDING" : "NOT_REQUIRED");

  let statusVal: CaseStatus = "OPEN";
  if (item.status === "RECOVERED" && (verificationResult === "VERIFIED_SUCCESS" || amountRecovered > 0)) statusVal = "RECOVERED";
  else if (item.status === "BLOCKED") statusVal = "BLOCKED";
  else if (item.status === "SCHEDULED") statusVal = "SCHEDULED";
  else if (item.status === "AWAITING_APPROVAL" || approvalStatus === "PENDING") statusVal = "HUMAN_APPROVAL";
  else if (item.status === "STOPPED") statusVal = "STOPPED";
  else if (approvalStatus === "REJECTED") statusVal = "REJECTED";
  else if (item.status === "MODIFIED") statusVal = "MODIFIED";
  else if (item.status === "FAILED") statusVal = "FAILED";

  const rawTitleStr = item.title || item.problem_type || rec.diagnosis;
  const problemTitle = formatDynamicTitle(rawTitleStr);

  const backendOutcome = item.outcome || {
    state: statusVal === "HUMAN_APPROVAL" ? "AWAITING_APPROVAL" : statusVal,
    amount_recovered: statusVal === "RECOVERED" ? amountRecovered : 0,
    verification_result: verificationResult,
  };

  const outcomeObj = {
    state: (backendOutcome.state || "OPEN") as any,
    amountRecovered: backendOutcome.state === "RECOVERED" ? (backendOutcome.amount_recovered || 0) : 0,
    verificationResult: backendOutcome.verification_result || "NONE",
  };

  return {
    id: item.id,
    customerName: cust.name || "Customer",
    customerEmail: cust.email || "customer@example.com",
    problem: problemTitle,
    amount: item.amount_at_risk || 0,
    score: item.recovery_score || 50,
    recoveryScore: item.recovery_score || 50,
    recommendedAction: item.recommended_action || "RETRY",
    risk: riskVal,
    type: caseType,
    paymentState: item.status === "BLOCKED" ? "AMBIGUOUS" : "UNKNOWN",
    possibleDebit: Boolean(item.status === "BLOCKED"),
    retryCount: item.retry_count || 0,
    maxRetries: item.max_retries || 2,
    aiRecommendation: {
      badgeText: item.recommended_action || "RETRY",
      diagnosis: rec.diagnosis || "TEMPORARY_FAILURE",
      recommendation: rec.reason || `Recommend ${item.recommended_action || "RETRY"} action`,
      score: item.recovery_score || 50,
      expectedValue: rec.expected_recovery_value || Math.round((item.amount_at_risk * (item.recovery_score || 50)) / 100),
      evidence,
    },
    policyDecision: {
      type: policyType as PolicyDecisionType,
      decisionLabel: policyType === "AUTO" ? "AUTOMATED RECOVERY" : (policyType === "BLOCK" ? "POLICY BLOCKED" : "HUMAN APPROVAL REQUIRED"),
      reason: policyType === "AUTO"
        ? "Automated recovery authorized by deterministic policy rules."
        : (policyType === "BLOCK"
        ? "Safety engine blocked execution due to potential duplicate debit or policy violation."
        : `Amount (₹${(item.amount_at_risk || 0).toLocaleString("en-IN")}) or risk tier requires explicit merchant sign-off.`),
      rules,
      explanation: "Policy evaluation completed against active rule engine.",
    },
    status: statusVal,
    verificationResult,
    amountRecovered: statusVal === "RECOVERED" ? amountRecovered : 0,
    approvalStatus,
    outcome: outcomeObj,
    scheduledDelayMinutes: rec.delay_minutes || 30,
    isMandate: Boolean(item.is_mandate || item.transaction?.payment_method === "NACH" || item.payment_method === "NACH"),
    mandatePlan: item.mandate_sequence_plan ? {
      targetBatchCycle: item.mandate_sequence_plan.target_batch_cycle,
      salaryWindowAligned: item.mandate_sequence_plan.salary_window_aligned,
      bounceFeeProtectionApplied: item.mandate_sequence_plan.bounce_fee_protection_applied,
      mandateRetryReason: item.mandate_sequence_plan.mandate_retry_reason,
      recommendedDelayMinutes: item.mandate_sequence_plan.recommended_delay_minutes
    } : (item.transaction?.payment_method === "NACH" || item.payment_method === "NACH" ? {
      targetBatchCycle: "NPCI_MORNING_BATCH_0900_IST",
      salaryWindowAligned: true,
      bounceFeeProtectionApplied: true,
      mandateRetryReason: "Mandate presentation window calculated for NACH: aligned to NPCI_MORNING_BATCH_0900_IST after 48h cool-off. Bounce fee protection active.",
      recommendedDelayMinutes: 2880
    } : undefined),
    auditTimeline: Array.isArray(item.audit_logs) && item.audit_logs.length > 0
      ? item.audit_logs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          title: log.event_type,
          description: log.reason,
          category: log.actor_type === "AI" ? "AI" : (log.actor_type === "POLICY" ? "POLICY" : (log.actor_type === "HUMAN" ? "HUMAN" : "ACTION")),
        }))
      : [
          {
            id: `aud-${item.id}-1`,
            timestamp: new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            title: "CASE_INITIALIZED",
            description: `Case initialized from ${item.source_type || 'gateway'} for ₹${(item.amount_at_risk || 0).toLocaleString("en-IN")}`,
            category: "ACTION",
          },
          {
            id: `aud-${item.id}-2`,
            timestamp: new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            title: "AI_DIAGNOSIS_COMPLETED",
            description: `Diagnosis: ${rec.diagnosis || 'TEMPORARY_FAILURE'} with score ${item.recovery_score || 50}/100`,
            category: "AI",
          },
          {
            id: `aud-${item.id}-3`,
            timestamp: new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            title: "POLICY_EVALUATION_COMPLETED",
            description: `Policy Decision: ${policyType}`,
            category: "POLICY",
          },
        ],
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString(),
  };
}

export async function getCases(filters?: {
  search?: string;
  status?: string;
  risk?: string;
  type?: string;
}): Promise<RecoveryCase[]> {
  const params = new URLSearchParams();
  if (filters?.search && filters.search.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters?.status && filters.status !== "All") {
    let st = filters.status.toUpperCase();
    if (st === "HUMAN APPROVAL" || st === "HUMAN_APPROVAL") st = "AWAITING_APPROVAL";
    params.append("status", st);
  }

  if (filters?.risk && filters.risk !== "All") {
    params.append("risk_level", filters.risk.toUpperCase());
  }

  if (filters?.type && filters.type !== "All") {
    let tp = filters.type.toUpperCase();
    if (tp === "FAILED PAYMENT") tp = "FAILED_PAYMENT";
    else if (tp === "SUBSCRIPTION") tp = "SUBSCRIPTION_FAILURE";
    else if (tp === "CHECKOUT") tp = "CHECKOUT_ABANDONMENT";
    else if (tp === "INVOICE") tp = "OVERDUE_INVOICE";
    params.append("problem_type", tp);
  }

  const res = await fetch(`${BACKEND_URL}/cases?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch cases from backend API: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map(mapBackendCaseToFrontend);
  }
  return [];
}

export async function getCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch case ${id} from backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}

export async function analyzeCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/analyze`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to analyze case ${id} via LangGraph backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}

export async function recheckCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/recheck`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to recheck case ${id} via backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}

export async function executeCaseAction(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/execute`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to execute case ${id} via backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}

export async function stopCase(id: string, reason?: string): Promise<RecoveryCase> {
  const url = reason ? `${BACKEND_URL}/cases/${id}/stop?reason=${encodeURIComponent(reason)}` : `${BACKEND_URL}/cases/${id}/stop`;
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to stop case ${id} via backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}

export async function resetCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/reset`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to reset case ${id} via backend API: HTTP ${res.status}`);
  }
  const item = await res.json();
  return mapBackendCaseToFrontend(item);
}
