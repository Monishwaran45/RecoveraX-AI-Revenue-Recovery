"use client";

import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PolicyDecision } from "@/lib/types";

interface PolicyDecisionCardProps {
  decision?: PolicyDecision;
  isLoading?: boolean;
}

export default function PolicyDecisionCard({ decision, isLoading }: PolicyDecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-center h-48 text-slate-400 text-xs font-mono font-medium animate-pulse">
        <ShieldCheck className="h-5 w-5 mr-2 text-emerald-500 animate-spin" />
        Deterministic Policy Engine validating safety rules...
      </div>
    );
  }

  const type = decision?.type || "AUTO";
  const isAuto = type === "AUTO";
  const isBlock = type === "BLOCK";
  const isHuman = type === "HUMAN";

  return (
    <div
      className={`border rounded-xl p-5 shadow-xs flex flex-col justify-between ${
        isAuto
          ? "bg-emerald-50/40 border-emerald-200"
          : isBlock
          ? "bg-rose-50/40 border-rose-200"
          : "bg-amber-50/40 border-amber-200"
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isAuto
                  ? "bg-emerald-100 text-emerald-700"
                  : isBlock
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isBlock ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Policy Engine Guardrails</h3>
              <p className="text-xs text-slate-500">Deterministic Safety Authorizer</p>
            </div>
          </div>

          <span
            className={`font-mono text-xs font-extrabold px-3 py-1 rounded-full border ${
              isAuto
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : isBlock
                ? "bg-rose-100 text-rose-800 border-rose-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
          >
            {isAuto ? "🟢 AUTO APPROVED" : isBlock ? "🔴 POLICY BLOCKED" : "🟡 HUMAN APPROVAL"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
            <span className="font-bold text-slate-900 block mb-1">Authorization Status</span>
            <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
              {decision?.reason || "Automated recovery authorized by active risk policy limits."}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Policy Rules Evaluated
            </span>
            {(decision?.rules || [
              { id: "r1", text: "Amount Policy: <= ₹50,000 Auto Limit", passed: true },
              { id: "r2", text: "Confidence Threshold: Score >= 80", passed: true },
              { id: "r3", text: "Retry Limit: Attempt count < 2", passed: true },
            ]).map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 text-xs font-medium">
                {rule.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                )}
                <span className={rule.passed ? "text-slate-800" : "text-rose-900 font-semibold"}>
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
