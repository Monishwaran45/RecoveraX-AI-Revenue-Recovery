"use client";

import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { PolicyDecision } from "@/lib/types";

interface PolicyDecisionCardProps {
  decision?: PolicyDecision;
  isLoading?: boolean;
}

export default function PolicyDecisionCard({ decision, isLoading }: PolicyDecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center min-h-[360px] text-slate-400 text-xs font-mono font-medium animate-pulse">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3 shadow-2xs">
          <ShieldCheck className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
        <span>Policy Engine validating safety guardrails...</span>
      </div>
    );
  }

  const type = decision?.type || "AUTO";
  const isAuto = type === "AUTO";
  const isBlock = type === "BLOCK";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[360px]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white shadow-xs ${
                isAuto
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : isBlock
                  ? "bg-gradient-to-br from-rose-500 to-red-600"
                  : "bg-gradient-to-br from-amber-500 to-orange-600"
              }`}
            >
              {isBlock ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Policy Engine Guardrails</h3>
              <p className="text-[11px] font-semibold text-slate-400">Deterministic Safety Authorizer</p>
            </div>
          </div>

          <span
            className={`font-mono text-xs font-black px-3 py-1 rounded-full border shadow-2xs ${
              isAuto
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isBlock
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isAuto ? "🟢 AUTO APPROVED" : isBlock ? "🔴 POLICY BLOCKED" : "🟡 HUMAN APPROVAL"}
          </span>
        </div>

        {/* Authorization Explanation Box */}
        <div
          className={`p-3.5 rounded-xl border text-xs ${
            isAuto
              ? "bg-emerald-50/60 border-emerald-100 text-emerald-950"
              : isBlock
              ? "bg-rose-50/60 border-rose-100 text-rose-950"
              : "bg-amber-50/60 border-amber-100 text-amber-950"
          }`}
        >
          <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Authorization Status</span>
          <p className="text-[11px] font-medium leading-relaxed">
            {decision?.reason || "Automated recovery authorized by active deterministic risk policy limits."}
          </p>
        </div>

        {/* Policy Rules Evaluated */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Policy Rules Evaluated
          </span>
          <div className="space-y-2">
            {(decision?.rules || [
              { id: "r1", text: "Amount Policy: <= ₹50,000 Auto Limit", passed: true },
              { id: "r2", text: "Confidence Threshold: Score >= 80", passed: true },
              { id: "r3", text: "Retry Limit: Attempt count < 2", passed: true },
            ]).map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2.5 p-2 bg-slate-50/80 rounded-lg border border-slate-100 text-xs font-semibold text-slate-800"
              >
                {rule.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span className={rule.passed ? "text-slate-800" : "text-rose-900 font-bold"}>
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
