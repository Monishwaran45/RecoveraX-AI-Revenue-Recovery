"use client";

import { CreditCard, RefreshCw, ShoppingCart, FileText, ShieldAlert } from "lucide-react";
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
}

export const DEFAULT_SCENARIOS: Scenario[] = [];
export const SCENARIOS = DEFAULT_SCENARIOS;

export function mapCaseToScenario(c: any, index: number): Scenario {
  const iconMap: Record<string, any> = {
    FAILED_PAYMENT: CreditCard,
    SUBSCRIPTION: RefreshCw,
    CHECKOUT: ShoppingCart,
    INVOICE: FileText,
  };
  const icon = iconMap[c.type] || (c.status === "BLOCKED" ? ShieldAlert : CreditCard);

  const policyVal = String(c.policyDecision?.type || c.policyDecision?.value || c.policyDecision || "").toUpperCase();
  const actionVal = String(c.recommendedAction || c.aiRecommendation?.badgeText || c.aiRecommendation?.recommendation || "").toUpperCase();

  let badge: "AUTO" | "HUMAN" | "BLOCK" | "ESCALATE" = "HUMAN";
  if (actionVal.includes("ESCALAT") || c.status === "ESCALATED" || c.id === "CASE-1006") {
    badge = "ESCALATE";
  } else if (policyVal.includes("BLOCK") || c.status === "BLOCKED" || c.status === "STOPPED") {
    badge = "BLOCK";
  } else if (policyVal.includes("HUMAN") || c.status === "HUMAN_APPROVAL" || c.status === "AWAITING_APPROVAL") {
    badge = "HUMAN";
  } else if (policyVal.includes("AUTO") || c.status === "SCHEDULED" || c.status === "RECOVERED") {
    badge = "AUTO";
  }

  const badgeBg = badge === "AUTO" 
    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
    : (badge === "BLOCK" 
      ? "bg-rose-50 text-rose-800 border-rose-200" 
      : (badge === "ESCALATE"
        ? "bg-purple-50 text-purple-800 border-purple-200 font-bold"
        : "bg-amber-50 text-amber-800 border-amber-200"));
  const badgeText = badge === "AUTO" ? "AUTO" : (badge === "BLOCK" ? "BLOCK" : (badge === "ESCALATE" ? "ESCALATE" : "REVIEW"));

  const title = c.title || formatDynamicTitle(c.problem || c.type) || `Case ${c.id}`;

  return {
    id: `sc-${c.id}`,
    caseId: c.id,
    title,
    amount: `₹${(c.amount || 0).toLocaleString("en-IN")}`,
    amountVal: c.amount || 0,
    type: `${c.customerName || "Customer"} (${c.risk || "MEDIUM"} Risk)`,
    badge,
    badgeBg,
    badgeText,
    description: c.aiRecommendation?.recommendation || `Transaction for ₹${(c.amount || 0).toLocaleString("en-IN")}`,
    reason: c.policyDecision?.reason || `Score ${c.score || 50}/100`,
    icon,
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
  const displayScenarios = scenarios && scenarios.length > 0 ? scenarios : DEFAULT_SCENARIOS;

  if (displayScenarios.length === 0) {
    return (
      <div className="p-3 bg-white border border-gray-200 rounded-lg text-center text-xs text-gray-500 font-medium">
        Loading test payment transactions...
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <span>Test Payment Scenarios</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-gray-100 text-gray-600 border border-gray-200">
            {displayScenarios.length} Cases
          </span>
        </h3>
        <span className="text-[11px] text-gray-400 font-normal hidden sm:inline">
          Select a decline incident to trace recovery workflow
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {displayScenarios.slice(0, 6).map((sc) => {
          const Icon = sc.icon || CreditCard;
          const isSelected = sc.id === activeScenarioId || sc.caseId === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => !disabled && onSelectScenario(sc)}
              disabled={disabled}
              className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-gray-900 ring-1 ring-gray-900 shadow-subtle"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1 rounded bg-gray-50 text-gray-700 border border-gray-200">
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border font-mono ${sc.badgeBg}`}>
                    {sc.badgeText}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 text-xs truncate tracking-tight">{sc.title}</h4>
                <p className="text-xs font-bold text-gray-900 font-mono tabular-nums tracking-tight mt-0.5">
                  {sc.amount}
                </p>
                <p className="text-[10px] text-gray-500 font-normal mt-0.5 truncate">
                  {sc.type}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>{sc.caseId}</span>
                {isSelected && (
                  <span className="text-gray-900 font-sans font-semibold">Active</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
