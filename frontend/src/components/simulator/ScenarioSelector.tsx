"use client";

import { CreditCard, RefreshCw, ShoppingCart, FileText, ShieldAlert } from "lucide-react";

export interface Scenario {
  id: string;
  caseId: string;
  title: string;
  amount: string;
  amountVal: number;
  type: string;
  badge: "AUTO" | "HUMAN" | "BLOCK";
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

  const policyVal = String(c.policyDecision?.type || c.policyDecision?.value || c.policyDecision || c.status || "HUMAN").toUpperCase();
  const badge: "AUTO" | "HUMAN" | "BLOCK" = (policyVal.includes("AUTO") || c.status === "SCHEDULED")
    ? "AUTO"
    : ((policyVal.includes("BLOCK") || c.status === "BLOCKED" || c.status === "STOPPED") ? "BLOCK" : "HUMAN");

  const badgeBg = badge === "AUTO" 
    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
    : (badge === "BLOCK" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200");
  const badgeText = badge === "AUTO" ? "🟢 AUTO APPROVED" : (badge === "BLOCK" ? "🔴 POLICY BLOCKED" : "🟡 HUMAN APPROVAL");

  const title = c.problem || c.title || (c.type ? String(c.type).replace(/_/g, " ") : "") || `Case ${c.id}`;

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
    description: c.aiRecommendation?.recommendation || `DB Case for ₹${(c.amount || 0).toLocaleString("en-IN")}`,
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
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs font-mono text-slate-500 font-semibold animate-pulse">
        Loading test scenarios from backend database...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span>Select Agent Test Scenario</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200">
            Live DB Cases
          </span>
        </h3>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Click card to switch test scenario
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {displayScenarios.slice(0, 6).map((sc) => {
          const Icon = sc.icon || CreditCard;
          const isSelected = sc.id === activeScenarioId || sc.caseId === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => !disabled && onSelectScenario(sc)}
              disabled={disabled}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-b from-blue-50/60 to-indigo-50/30 border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/60"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-1.5 rounded-xl shadow-2xs ${
                      sc.badge === "AUTO"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : sc.badge === "BLOCK"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${sc.badgeBg}`}
                  >
                    {sc.badge}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 text-xs truncate tracking-tight">{sc.title}</h4>
                <p className="text-base font-black text-slate-950 font-mono tracking-tight mt-0.5">
                  {sc.amount}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                  {sc.type}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>{sc.caseId}</span>
                {isSelected ? (
                  <span className="text-blue-600 font-sans font-black flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    Active
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
