import { store } from "../store";
import { RecoveryCase, RiskLevel, CaseStatus, CaseType, PaymentState } from "../types";
import { BACKEND_URL } from "./config";

function mapBackendCaseToFrontend(item: any): RecoveryCase {
  const riskVal: RiskLevel = (item.risk_level as RiskLevel) || "MEDIUM";
  const caseType: CaseType = 
    item.problem_type === "FAILED_PAYMENT" ? "FAILED_PAYMENT" :
    (item.problem_type === "SUBSCRIPTION_FAILURE" ? "SUBSCRIPTION" :
    (item.problem_type === "OVERDUE_INVOICE" ? "INVOICE" : "CHECKOUT"));

  const statusVal: CaseStatus =
    item.status === "AWAITING_APPROVAL" ? "HUMAN_APPROVAL" :
    (item.status === "SCHEDULED" ? "SCHEDULED" :
    (item.status === "RECOVERED" ? "RECOVERED" :
    (item.status === "BLOCKED" ? "BLOCKED" : "OPEN")));

  return {
    id: item.id,
    customerName: item.customer?.name || "Customer",
    customerEmail: item.customer?.email || "customer@example.com",
    problem: item.latest_recommendation?.diagnosis || "Payment failure detected",
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
      diagnosis: item.latest_recommendation?.diagnosis || "TEMPORARY_FAILURE",
      recommendation: item.latest_recommendation?.reason || `Recommend ${item.recommended_action}`,
      score: item.recovery_score || 50,
      expectedValue: item.latest_recommendation?.expected_recovery_value || item.amount_at_risk * 0.8,
      evidence: [
        { id: "e1", text: `Customer history: ${item.customer?.successful_payment_count || 5} successful payments`, isPositive: true },
        { id: "e2", text: "Payment state: CLEAR", isPositive: true },
        { id: "e3", text: `Risk level: ${item.risk_level}`, isPositive: false },
      ],
    },
    policyDecision: {
      type: item.policy_decision || "HUMAN",
      decisionLabel: item.policy_decision === "AUTO" ? "AUTOMATED RECOVERY" : "HUMAN APPROVAL REQUIRED",
      reason: item.policy_decision === "AUTO" ? "Automated recovery authorized" : "Human approval required for safety",
      rules: [
        { id: "r1", text: `Amount: ₹${(item.amount_at_risk || 0).toLocaleString("en-IN")}`, passed: true },
        { id: "r2", text: "Policy Threshold: ₹5,000", passed: true },
      ],
      explanation: "Policy evaluation completed",
    },
    status: statusVal,
    scheduledDelayMinutes: 30,
    auditTimeline: Array.isArray(item.audit_logs)
      ? item.audit_logs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          title: log.event_type,
          description: log.reason,
          category: log.actor_type === "AI" ? "AI" : (log.actor_type === "POLICY" ? "POLICY" : "SYSTEM"),
        }))
      : [],
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
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.risk) params.append("risk_level", filters.risk);
    if (filters?.type) params.append("problem_type", filters.type);

    const res = await fetch(`${BACKEND_URL}/cases?${params.toString()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapBackendCaseToFrontend);
      }
    }
  } catch (e) {
    // Fallback to store
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
    // Fallback to store
  }
  return store.getCaseById(id);
}
