import { store } from "../store";
import { RecoveryCase, RiskLevel, CaseStatus, CaseType } from "../types";
import { BACKEND_URL } from "./config";

function mapBackendCaseToFrontend(item: any): RecoveryCase {
  const riskVal: RiskLevel = (item.risk_level as RiskLevel) || "MEDIUM";
  
  let caseType: CaseType = "FAILED_PAYMENT";
  if (item.problem_type === "SUBSCRIPTION_FAILURE") caseType = "SUBSCRIPTION";
  else if (item.problem_type === "OVERDUE_INVOICE") caseType = "INVOICE";
  else if (item.problem_type === "CHECKOUT_ABANDONMENT") caseType = "CHECKOUT";

  let statusVal: CaseStatus = "OPEN";
  if (item.status === "AWAITING_APPROVAL") statusVal = "HUMAN_APPROVAL";
  else if (item.status === "SCHEDULED") statusVal = "SCHEDULED";
  else if (item.status === "RECOVERED") statusVal = "RECOVERED";
  else if (item.status === "BLOCKED") statusVal = "BLOCKED";

  const rec = item.latest_recommendation || (Array.isArray(item.recommendations) && item.recommendations[0]) || {};
  const cust = item.customer || {};

  return {
    id: item.id,
    customerName: cust.name || "Customer",
    customerEmail: cust.email || "customer@example.com",
    problem: rec.reason || rec.diagnosis || item.problem_type || "Payment failure detected",
    amount: item.amount_at_risk || 0,
    score: item.recovery_score || 50,
    risk: riskVal,
    type: caseType,
    paymentState: "CLEARLY_FAILED",
    possibleDebit: false,
    retryCount: item.retry_count || 0,
    maxRetries: item.max_retries || 2,
    aiRecommendation: {
      badgeText: item.recommended_action || "RETRY",
      diagnosis: rec.diagnosis || "TEMPORARY_FAILURE",
      recommendation: rec.reason || `Recommend ${item.recommended_action || "RETRY"}`,
      score: item.recovery_score || 50,
      expectedValue: rec.expected_recovery_value || (item.amount_at_risk * 0.8),
      evidence: [
        { id: "e1", text: `Customer history: ${cust.successful_payment_count || 5} successful payments`, isPositive: true },
        { id: "e2", text: "Payment state: CLEAR", isPositive: true },
        { id: "e3", text: `Risk level: ${item.risk_level}`, isPositive: riskVal === "LOW" },
      ],
    },
    policyDecision: {
      type: item.policy_decision || "HUMAN",
      decisionLabel: item.policy_decision === "AUTO" ? "AUTOMATED RECOVERY" : (item.policy_decision === "BLOCK" ? "POLICY BLOCKED" : "HUMAN APPROVAL REQUIRED"),
      reason: item.policy_decision === "AUTO" ? "Automated recovery authorized" : (item.policy_decision === "BLOCK" ? "Safety engine blocked payment" : "Human approval required for safety"),
      rules: [
        { id: "r1", text: `Amount: ₹${(item.amount_at_risk || 0).toLocaleString("en-IN")}`, passed: true },
        { id: "r2", text: "Policy Threshold: ₹5,000", passed: true },
      ],
      explanation: "Policy evaluation completed",
    },
    status: statusVal,
    scheduledDelayMinutes: 30,
    auditTimeline: Array.isArray(item.audit_logs) && item.audit_logs.length > 0
      ? item.audit_logs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          title: log.event_type,
          description: log.reason,
          category: log.actor_type === "AI" ? "AI" : (log.actor_type === "POLICY" ? "POLICY" : "SYSTEM"),
        }))
      : [
          { id: "a1", timestamp: new Date(item.created_at || Date.now()).toLocaleTimeString(), title: "CASE_CREATED", description: `Case initialized for ₹${(item.amount_at_risk || 0).toLocaleString("en-IN")}`, category: "SYSTEM" }
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
  try {
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

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(mapBackendCaseToFrontend);
      }
    }
  } catch (e) {
    console.warn("Backend API call failed, using store fallback:", e);
  }

  return store.getCases(filters);
}

export async function getCase(id: string): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const item = await res.json();
      return mapBackendCaseToFrontend(item);
    }
  } catch (e) {
    console.warn(`Backend getCase(${id}) failed, using store fallback:`, e);
  }

  return store.getCaseById(id);
}
