export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PolicyDecisionType = "AUTO" | "HUMAN" | "BLOCK";
export type CaseStatus = "OPEN" | "SCHEDULED" | "HUMAN_APPROVAL" | "RECOVERED" | "BLOCKED" | "REJECTED" | "MODIFIED";
export type CaseType = "FAILED_PAYMENT" | "SUBSCRIPTION" | "CHECKOUT" | "INVOICE";
export type PaymentState = "CLEARLY_FAILED" | "BANK_TIMEOUT" | "AMBIGUOUS";

export interface EvidenceItem {
  id: string;
  text: string;
  isPositive: boolean;
}

export interface PolicyRule {
  id: string;
  text: string;
  passed: boolean;
}

export interface AIRecommendation {
  badgeText: string;
  diagnosis: string;
  recommendation: string;
  score: number;
  expectedValue: number;
  evidence: EvidenceItem[];
}

export interface PolicyDecision {
  type: PolicyDecisionType;
  decisionLabel: string;
  reason: string;
  rules: PolicyRule[];
  explanation: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "SYSTEM" | "AI" | "POLICY" | "ACTION" | "HUMAN";
  badgeText?: string;
}

export interface RecoveryCase {
  id: string;
  customerName: string;
  customerEmail: string;
  problem: string;
  amount: number;
  score: number;
  risk: RiskLevel;
  type: CaseType;
  paymentState: PaymentState;
  possibleDebit: boolean;
  retryCount: number;
  maxRetries: number;
  aiRecommendation: AIRecommendation;
  policyDecision: PolicyDecision;
  status: CaseStatus;
  scheduledDelayMinutes: number;
  auditTimeline: AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  revenueAtRisk: number;
  recoverableRevenue: number;
  grossRecovered: number;
  incrementalRecovered: number;
  recoveryRate?: number;
  safetyActionsPrevented: number;
  decisionDistribution: {
    auto: number;
    human: number;
    blocked: number;
  };
}

export interface ModifyActionInput {
  action?: string;
  delayMinutes: number;
  maxRetries?: number;
  notes?: string;
}
