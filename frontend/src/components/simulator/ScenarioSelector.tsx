"use client";

import { AlertTriangle, CreditCard, RefreshCw, ShoppingCart, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

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

export const SCENARIOS: Scenario[] = [
  {
    id: "sc-1",
    caseId: "CASE-1021",
    title: "Failed Payment",
    amount: "₹2,000",
    amountVal: 2000,
    type: "Temporary Bank Error",
    badge: "AUTO",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "🟢 AUTO APPROVED",
    description: "Low-risk temporary gateway error with high recovery probability.",
    reason: "Low risk, score 87 >= 80, amount <= ₹50,000",
    icon: CreditCard,
  },
  {
    id: "sc-2",
    caseId: "CASE-1088",
    title: "Subscription Failure",
    amount: "₹2,000/mo",
    amountVal: 2000,
    type: "Card Expired / Retry Loop",
    badge: "HUMAN",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "🟡 RETRY RE-EVALUATION",
    description: "Recurring payment retry attempt #1 failed. Requires re-evaluation.",
    reason: "Retry attempt #1 executed. AI re-evaluates next step.",
    icon: RefreshCw,
  },
  {
    id: "sc-3",
    caseId: "CASE-1032",
    title: "Checkout Abandonment",
    amount: "₹8,500",
    amountVal: 8500,
    type: "Session Timeout",
    badge: "HUMAN",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "🟡 HUMAN APPROVAL",
    description: "Cart abandoned during checkout. Reminder email recommended.",
    reason: "Score 75 < 80 threshold. Escalated for sign-off.",
    icon: ShoppingCart,
  },
  {
    id: "sc-4",
    caseId: "CASE-1102",
    title: "B2B High Value Invoice",
    amount: "₹75,000",
    amountVal: 75000,
    type: "10 Days Overdue",
    badge: "HUMAN",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "🟡 HUMAN APPROVAL",
    description: "High value B2B invoice exceeds automatic limit. Needs sign-off.",
    reason: "Amount ₹75,000 > ₹50,000 limit. Policy enforces HITL.",
    icon: FileText,
  },
  {
    id: "sc-5",
    caseId: "CASE-1048",
    title: "Ambiguous Payment",
    amount: "₹25,000",
    amountVal: 25000,
    type: "Possible Customer Debit",
    badge: "BLOCK",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    badgeText: "🔴 POLICY BLOCKED",
    description: "Unclear debit signal. Policy Engine blocks retry to avoid double charge.",
    reason: "Ambiguous payment state. Potential duplicate charge risk.",
    icon: ShieldAlert,
  },
];

interface ScenarioSelectorProps {
  activeScenarioId: string;
  onSelectScenario: (scenario: Scenario) => void;
  disabled?: boolean;
}

export default function ScenarioSelector({
  activeScenarioId,
  onSelectScenario,
  disabled = false,
}: ScenarioSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Agent Test Scenario
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          Click any card to inspect & run scenario
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isSelected = sc.id === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => !disabled && onSelectScenario(sc)}
              disabled={disabled}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-900/10 border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      sc.badge === "AUTO"
                        ? "bg-emerald-50 text-emerald-600"
                        : sc.badge === "BLOCK"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sc.badgeBg}`}
                  >
                    {sc.badge}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-xs">{sc.title}</h4>
                <p className="text-lg font-bold text-slate-950 font-mono tracking-tight mt-0.5">
                  {sc.amount}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                  {sc.type}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>{sc.caseId}</span>
                {isSelected && <span className="text-blue-600 font-sans">Active</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
