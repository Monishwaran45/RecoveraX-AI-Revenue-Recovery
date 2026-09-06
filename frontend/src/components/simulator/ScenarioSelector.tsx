"use client";

import { useState } from "react";
import {
  CreditCard,
  RefreshCw,
  ShoppingCart,
  FileText,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatDynamicTitle } from "../../lib/api/cases";

export interface Scenario {
  id: string;
  caseId: string;
  title: string;
  amount: string;
  amountVal: number;
  type: string;
  badge: "AUTO" | "HUMAN" | "BLOCK" | "ESCALATE";
  badgeBg: string;
  badgeText: string;
  description: string;
  reason: string;
  icon: any;
  isMandate?: boolean;
}

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: "sc-CASE-1001",
    caseId: "CASE-1001",
    title: "Temporary Bank Error",
    amount: "₹15,000.00",
    amountVal: 15000,
    type: "Rahul Enterprises (LOW Risk)",
    badge: "AUTO",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeText: "AUTO",
    description: "Low-risk temporary gateway decline with high probability of auto-recovery.",
    reason: "Score 87/100 • Low risk",
    icon: CreditCard,
  },
  {
    id: "sc-CASE-1002",
    caseId: "CASE-1002",
    title: "High Value Retry Limit",
    amount: "₹75,000.00",
    amountVal: 75000,
    type: "Sharma Logistics (HIGH Risk)",
    badge: "HUMAN",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "REVIEW",
    description: "Exceeds ₹50,000 auto-retry limit. Requires operator approval before dispatch.",
    reason: "Exceeds max auto threshold ₹50,000",
    icon: CreditCard,
  },
  {
    id: "sc-CASE-1006",
    caseId: "CASE-1006",
    title: "Overdue B2B Invoice",
    amount: "₹1,20,000.00",
    amountVal: 120000,
    type: "Global Trade Corp (HIGH Risk)",
    badge: "ESCALATE",
    badgeBg: "bg-purple-50 text-purple-800 border-purple-200 font-bold",
    badgeText: "ESCALATE",
    description: "B2B invoice 15+ days overdue. Requires account manager manual outreach.",
    reason: "Past due invoice receivable",
    icon: FileText,
  },
  {
    id: "sc-CASE-1003",
    caseId: "CASE-1003",
    title: "Possible Customer Debit",
    amount: "₹25,000.00",
    amountVal: 25000,
    type: "Aarav Tech Solutions (HIGH Risk)",
    badge: "BLOCK",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    badgeText: "BLOCK",
    description: "Ambiguous bank response with possible debit. Retry blocked to prevent duplicate debit.",
    reason: "Ambiguous payment state",
    icon: ShieldAlert,
  },
  {
    id: "sc-CASE-1004",
    caseId: "CASE-1004",
    title: "NACH Subscription Mandate",
    amount: "₹2,499.00",
    amountVal: 2499,
    type: "Priya SaaS Services • NACH Mandate",
    badge: "AUTO",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    badgeText: "NPCI",
    description: "Automated NACH presentation window aligned with 48h bounce fee protection.",
    reason: "48h NPCI Cool-off Active",
    icon: RefreshCw,
    isMandate: true,
  },
];

export const SCENARIOS = DEFAULT_SCENARIOS;

export function mapCaseToScenario(c: any, index: number): Scenario {
  const isMandate = c.id === "CASE-1004" || c.type === "SUBSCRIPTION" || c.problemType === "SUBSCRIPTION_FAILURE" || c.isMandate || (c.paymentMethod && ["NACH", "E_MANDATE", "UPI_AUTOPAY"].includes(c.paymentMethod));
  
  const iconMap: Record<string, any> = {
    FAILED_PAYMENT: CreditCard,
    SUBSCRIPTION: RefreshCw,
    CHECKOUT: ShoppingCart,
    INVOICE: FileText,
  };
  const icon = isMandate ? RefreshCw : (iconMap[c.type] || (c.status === "BLOCKED" ? ShieldAlert : CreditCard));

  const policyVal = String(c.policyDecision?.type || c.policyDecision?.value || c.policyDecision || "").toUpperCase();
  const actionVal = String(c.recommendedAction || c.aiRecommendation?.badgeText || c.aiRecommendation?.recommendation || "").toUpperCase();

  let badge: "AUTO" | "HUMAN" | "BLOCK" | "ESCALATE" = "HUMAN";
  if (actionVal.includes("ESCALAT") || c.status === "ESCALATED" || c.id === "CASE-1006") {
    badge = "ESCALATE";
  } else if (policyVal.includes("BLOCK") || c.status === "BLOCKED" || c.status === "STOPPED" || c.id === "CASE-1003") {
    badge = "BLOCK";
  } else if (policyVal.includes("HUMAN") || c.status === "HUMAN_APPROVAL" || c.status === "AWAITING_APPROVAL" || c.id === "CASE-1002") {
    badge = "HUMAN";
  } else if (policyVal.includes("AUTO") || c.status === "SCHEDULED" || c.status === "RECOVERED" || c.id === "CASE-1001" || c.id === "CASE-1004") {
    badge = "AUTO";
  }

  const badgeBg = isMandate
    ? "bg-blue-50 text-blue-800 border-blue-200 font-bold"
    : (badge === "AUTO"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : (badge === "BLOCK"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : (badge === "ESCALATE"
          ? "bg-purple-50 text-purple-800 border-purple-200 font-bold"
          : "bg-amber-50 text-amber-800 border-amber-200")));

  const badgeText = isMandate
    ? "NPCI"
    : (badge === "AUTO" ? "AUTO" : (badge === "BLOCK" ? "BLOCK" : (badge === "ESCALATE" ? "ESCALATE" : "REVIEW")));

  const title = c.title || formatDynamicTitle(c.problem || c.type || c.problemType) || `Case ${c.id}`;

  return {
    id: `sc-${c.id}`,
    caseId: c.id,
    title,
    amount: `₹${(c.amount || c.amountAtRisk || 0).toLocaleString("en-IN")}`,
    amountVal: c.amount || c.amountAtRisk || 0,
    type: `${c.customerName || c.customer?.name || "Customer"}${isMandate ? " • NACH Mandate" : ""} (${c.risk || c.riskLevel || "MEDIUM"} Risk)`,
    badge,
    badgeBg,
    badgeText,
    description: c.aiRecommendation?.recommendation || `Transaction for ₹${(c.amount || c.amountAtRisk || 0).toLocaleString("en-IN")}`,
    reason: c.policyDecision?.reason || `Score ${c.score || c.recoveryScore || 50}/100`,
    icon,
    isMandate,
  };
}

interface ScenarioSelectorProps {
  activeScenarioId?: string;
  onSelectScenario: (scenario: Scenario) => void;
  disabled?: boolean;
  scenarios?: Scenario[];
}

export default function ScenarioSelector({
  activeScenarioId,
  onSelectScenario,
  disabled = false,
  scenarios = DEFAULT_SCENARIOS,
}: ScenarioSelectorProps) {
  const [filter, setFilter] = useState<"ALL" | "AUTO" | "HUMAN" | "BLOCK" | "ESCALATE" | "MANDATE">("ALL");

  const displayScenarios = scenarios && scenarios.length > 0 ? scenarios : DEFAULT_SCENARIOS;

  // Filtering
  const filtered = displayScenarios.filter((sc) => {
    if (filter === "ALL") return true;
    if (filter === "MANDATE") return sc.isMandate || sc.badgeText === "NPCI";
    return sc.badge === filter && !sc.isMandate;
  });

  // Counts for pills
  const countAll = displayScenarios.length;
  const countAuto = displayScenarios.filter((s) => s.badge === "AUTO" && !s.isMandate).length;
  const countReview = displayScenarios.filter((s) => s.badge === "HUMAN").length;
  const countEscalate = displayScenarios.filter((s) => s.badge === "ESCALATE").length;
  const countBlock = displayScenarios.filter((s) => s.badge === "BLOCK").length;
  const countMandates = displayScenarios.filter((s) => s.isMandate || s.badgeText === "NPCI").length;

  return (
    <div className="space-y-3">
      {/* Top Header with Filter Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <span>Test Payment Scenarios</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200 font-bold">
              {filtered.length} Scenarios
            </span>
          </h3>
        </div>
      </div>

      {/* Category Filter Pills: AUTO, REVIEW, ESCALATE, BLOCK, NPCI */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
            filter === "ALL"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          All ({countAll})
        </button>

        {countAuto > 0 && (
          <button
            onClick={() => setFilter("AUTO")}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "AUTO"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            Auto Retry ({countAuto})
          </button>
        )}

        {countReview > 0 && (
          <button
            onClick={() => setFilter("HUMAN")}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "HUMAN"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            Operator Review ({countReview})
          </button>
        )}

        {countEscalate > 0 && (
          <button
            onClick={() => setFilter("ESCALATE")}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "ESCALATE"
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
            }`}
          >
            Escalated ({countEscalate})
          </button>
        )}

        {countBlock > 0 && (
          <button
            onClick={() => setFilter("BLOCK")}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "BLOCK"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            Safety Blocked ({countBlock})
          </button>
        )}

        {countMandates > 0 && (
          <button
            onClick={() => setFilter("MANDATE")}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "MANDATE"
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
            }`}
          >
            NPCI Mandates ({countMandates})
          </button>
        )}
      </div>

      {/* 5-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {filtered.map((sc) => {
          const Icon = sc.icon || CreditCard;
          const isSelected = sc.id === activeScenarioId || sc.caseId === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => !disabled && onSelectScenario(sc)}
              disabled={disabled}
              className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-gray-950 ring-2 ring-gray-950 shadow-md transform -translate-y-0.5"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border font-mono ${sc.badgeBg}`}>
                    {sc.badgeText}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 text-xs truncate tracking-tight">{sc.title}</h4>
                <p className="text-sm font-bold text-gray-900 font-mono tabular-nums tracking-tight mt-0.5">
                  {sc.amount}
                </p>
                <p className="text-[10px] text-gray-500 font-normal mt-0.5 truncate">
                  {sc.type}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="font-semibold text-gray-600">{sc.caseId}</span>
                {isSelected ? (
                  <span className="text-gray-950 font-sans font-bold bg-gray-100 px-2 py-0.5 rounded text-[9px]">
                    Active
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-400 hover:text-gray-600">Select</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
