/**
 * ==============================================================================
 * RecoveraX — Autonomous AI Revenue Recovery Engine
 * Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
 * Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
 * All Rights Reserved.
 * ==============================================================================
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PolicyDecisionType = "AUTO" | "HUMAN" | "BLOCK" | "STOP";
export type CaseStatus = "OPEN" | "SCHEDULED" | "HUMAN_APPROVAL" | "RECOVERED" | "BLOCKED" | "REJECTED" | "MODIFIED" | "STOPPED" | "FAILED";
export type CaseType = "FAILED_PAYMENT" | "SUBSCRIPTION" | "CHECKOUT" | "INVOICE";
export type PaymentState = "CLEARLY_FAILED" | "BANK_TIMEOUT" | "AMBIGUOUS" | "UNKNOWN";

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

export interface CaseOutcome {
  state: "RECOVERED" | "AWAITING_APPROVAL" | "BLOCKED" | "STOPPED" | "FAILED" | "SCHEDULED" | "OPEN";
  amountRecovered: number;
  verificationResult: string;
}

export interface RecoveryCase {
  id: string;
  customerName: string;
  customerEmail: string;
  problem: string;
  amount: number;
  score: number;
  recoveryScore?: number;
  recommendedAction?: string;
  risk: RiskLevel;
  type: CaseType;
  paymentState: PaymentState;
  possibleDebit: boolean;
  retryCount: number;
  maxRetries: number;
  aiRecommendation: AIRecommendation;
  policyDecision: PolicyDecision;
  status: CaseStatus;
  verificationResult?: string;
  amountRecovered?: number;
  approvalStatus?: string;
  outcome?: CaseOutcome;
  scheduledDelayMinutes: number;
  isMandate?: boolean;
  mandatePlan?: {
    targetBatchCycle: string;
    salaryWindowAligned: boolean;
    bounceFeeProtectionApplied: boolean;
    mandateRetryReason: string;
    recommendedDelayMinutes: number;
  };
  p2pStatus?: "PROMISED" | "P2P_KEPT" | "P2P_BROKEN" | "NONE";
  p2pRecord?: {
    id: string;
    promisedAmount: number;
    promisedDate: string;
    status: "PROMISED" | "P2P_KEPT" | "P2P_BROKEN" | "EXPIRED";
    notes?: string;
  };
  voiceCallResult?: {
    voice_mode: "REAL" | "MOCK" | "BLOCKED";
    provider: string;
    script: string;
    audio_url?: string;
    status: string;
  };
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
  totalCases?: number;
  safetyActionsPrevented: number;
  decisionDistribution: {
    auto: number;
    human: number;
    blocked: number;
  };
  recoveryTrend?: Array<{ day: string; recovered: number; attempted: number }>;
}

export interface ModifyActionInput {
  action?: string;
  delayMinutes?: number;
  maxRetries?: number;
  notes?: string;
}
