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
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[320px] text-gray-400 text-xs">
        <ShieldCheck className="h-4 w-4 animate-spin text-gray-600 mb-2" />
        <span className="text-gray-500 font-medium">Validating policy safety limits...</span>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between min-h-[320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900 text-xs">Policy Guardrails</h3>
                <p className="text-[11px] text-gray-500 font-normal">Authorization limits</p>
              </div>
            </div>
            <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              PENDING
            </span>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[210px] text-center p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            <ShieldCheck className="h-6 w-6 text-gray-300 mb-2" />
            <p className="font-medium text-xs text-gray-700">Awaiting Policy Evaluation</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              Click &quot;Run Recovery&quot; to evaluate deterministic policy guardrails and limits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const type = decision.type || "AUTO";
  const isAuto = type === "AUTO";
  const isBlock = type === "BLOCK";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between min-h-[320px]">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isBlock ? (
              <ShieldAlert className="h-4 w-4 text-rose-700" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Policy Guardrails</h3>
              <p className="text-[11px] text-gray-500 font-normal">Authorization limits</p>
            </div>
          </div>

          <span
            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
              isAuto
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isBlock
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isAuto ? "AUTO APPROVED" : isBlock ? "POLICY BLOCKED" : "REVIEW REQUIRED"}
          </span>
        </div>

        {/* Status Box */}
        <div
          className={`p-2.5 rounded border text-xs ${
            isAuto
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
              : isBlock
              ? "bg-rose-50/50 border-rose-200 text-rose-950"
              : "bg-amber-50/50 border-amber-200 text-amber-950"
          }`}
        >
          <span className="font-semibold uppercase text-[9px] tracking-wider block mb-0.5">
            Authorization Reason
          </span>
          <p className="text-[11px] font-normal leading-relaxed">
            {decision?.reason || "Automated recovery authorized within active exposure limits."}
          </p>
        </div>

        {/* Rules Evaluated */}
        <div className="space-y-1 pt-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Evaluated Policy Rules
          </span>
          <div className="space-y-1.5">
            {(decision?.rules || [
              { id: "r1", text: "Amount Policy: <= ₹50,000 Auto Limit", passed: true },
              { id: "r2", text: "Confidence Threshold: Score >= 80", passed: true },
              { id: "r3", text: "Retry Limit: Duplicate risk clear", passed: true },
            ]).map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-800"
              >
                {rule.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                )}
                <span className={rule.passed ? "text-gray-800 text-[11px]" : "text-rose-900 font-medium text-[11px]"}>
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
