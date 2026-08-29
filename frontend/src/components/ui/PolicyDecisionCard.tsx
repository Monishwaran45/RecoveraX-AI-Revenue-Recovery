import { PolicyDecision } from "@/lib/types";
import { ShieldCheck, ShieldAlert, Check, X, Lock } from "lucide-react";

export default function PolicyDecisionCard({ data }: { data: PolicyDecision }) {
  const isAuto = data.type === "AUTO";
  const isHuman = data.type === "HUMAN";
  const isBlock = data.type === "BLOCK";

  let headerBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let Icon = ShieldCheck;

  if (isHuman) {
    headerBg = "bg-amber-50 text-amber-900 border-amber-200";
    Icon = ShieldAlert;
  } else if (isBlock) {
    headerBg = "bg-rose-50 text-rose-900 border-rose-200";
    Icon = Lock;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${isAuto ? "text-emerald-700" : isHuman ? "text-amber-700" : "text-rose-700"}`} />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">
                Policy Guardrails & Limits
              </h3>
              <p className="text-[11px] text-gray-500 font-normal">Mandatory risk rules</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${headerBg}`}>
            {data.decisionLabel}
          </span>
        </div>

        {/* Reason Summary */}
        <div className="my-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Policy Rationale:</p>
          <p className="text-xs text-gray-700 leading-relaxed font-normal bg-gray-50 p-2.5 rounded border border-gray-200">
            {data.reason}
          </p>
        </div>

        {/* Evaluated Rules */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Compliance Rules Evaluated:</p>
          <div className="space-y-1">
            {data.rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-2 rounded text-xs border ${
                  rule.passed
                    ? "bg-emerald-50/30 border-emerald-200 text-emerald-950"
                    : "bg-rose-50/30 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  {rule.passed ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-normal text-gray-800 text-[11px]">{rule.text}</span>
                </div>
                <span className={`font-mono font-medium text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider ${rule.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                  {rule.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
