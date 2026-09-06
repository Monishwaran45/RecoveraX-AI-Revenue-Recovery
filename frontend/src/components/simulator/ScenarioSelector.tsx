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
  if (actionVal.includes("ESCALAT") || c.status === "ESCALATED") {
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
  const isMandate = c.type === "SUBSCRIPTION" || c.isMandate || (c.paymentMethod && ["NACH", "E_MANDATE", "UPI_AUTOPAY"].includes(c.paymentMethod));

  return {
    id: `sc-${c.id}`,
    caseId: c.id,
    title,
    amount: `₹${(c.amount || 0).toLocaleString("en-IN")}`,
    amountVal: c.amount || 0,
    type: `${c.customerName || "Customer"}${isMandate ? " • NACH Mandate" : ""} (${c.risk || "MEDIUM"} Risk)`,
    badge,
    badgeBg,
    badgeText,
    description: c.aiRecommendation?.recommendation || `Transaction for ₹${(c.amount || 0).toLocaleString("en-IN")}`,
    reason: c.policyDecision?.reason || `Score ${c.score || 50}/100`,
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
  const [page, setPage] = useState<number>(0);
  const pageSize = 6;

  const displayScenarios = scenarios && scenarios.length > 0 ? scenarios : DEFAULT_SCENARIOS;

  if (displayScenarios.length === 0) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg text-center text-xs text-gray-500 font-medium">
        Loading test payment transactions...
      </div>
    );
  }

  // Filtering
  const filtered = displayScenarios.filter((sc) => {
    if (filter === "ALL") return true;
    if (filter === "MANDATE") return sc.isMandate;
    return sc.badge === filter;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages - 1);
  const pagedScenarios = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Counts for pills
  const countAll = displayScenarios.length;
  const countAuto = displayScenarios.filter((s) => s.badge === "AUTO").length;
  const countReview = displayScenarios.filter((s) => s.badge === "HUMAN").length;
  const countBlock = displayScenarios.filter((s) => s.badge === "BLOCK").length;
  const countEscalate = displayScenarios.filter((s) => s.badge === "ESCALATE").length;
  const countMandates = displayScenarios.filter((s) => s.isMandate).length;

  return (
    <div className="space-y-3">
      {/* Top Header with Filter Badges & Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <span>Test Payment Scenarios</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200 font-bold">
              {filtered.length} of {countAll} Cases
            </span>
          </h3>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0 || disabled}
            className="p-1 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] text-gray-500 font-medium">
            Page {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1 || disabled}
            className="p-1 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => { setFilter("ALL"); setPage(0); }}
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
            onClick={() => { setFilter("AUTO"); setPage(0); }}
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
            onClick={() => { setFilter("HUMAN"); setPage(0); }}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "HUMAN"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            Operator Review ({countReview})
          </button>
        )}

        {countBlock > 0 && (
          <button
            onClick={() => { setFilter("BLOCK"); setPage(0); }}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "BLOCK"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            Safety Blocked ({countBlock})
          </button>
        )}

        {countEscalate > 0 && (
          <button
            onClick={() => { setFilter("ESCALATE"); setPage(0); }}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "ESCALATE"
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
            }`}
          >
            Escalated ({countEscalate})
          </button>
        )}

        {countMandates > 0 && (
          <button
            onClick={() => { setFilter("MANDATE"); setPage(0); }}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filter === "MANDATE"
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
            }`}
          >
            NACH Mandates ({countMandates})
          </button>
        )}
      </div>

      {/* 6-Grid Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {pagedScenarios.map((sc) => {
          const Icon = sc.icon || CreditCard;
          const isSelected = sc.id === activeScenarioId || sc.caseId === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => !disabled && onSelectScenario(sc)}
              disabled={disabled}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-gray-950 ring-2 ring-gray-950 shadow-md transform -translate-y-0.5"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs"
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
                {isSelected ? (
                  <span className="text-gray-950 font-sans font-bold bg-gray-100 px-1.5 py-0.2 rounded text-[9px]">
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
