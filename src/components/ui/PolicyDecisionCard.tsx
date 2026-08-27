import { PolicyDecision } from "@/lib/types";
import { ShieldCheck, ShieldAlert, AlertTriangle, Check, X, Shield, Lock } from "lucide-react";

export default function PolicyDecisionCard({ data }: { data: PolicyDecision }) {
  const isAuto = data.type === "AUTO";
  const isHuman = data.type === "HUMAN";
  const isBlock = data.type === "BLOCK";

  let headerBg = "bg-emerald-50 text-emerald-900 border-emerald-200";
  let Icon = ShieldCheck;

  if (isHuman) {
    headerBg = "bg-amber-50 text-amber-950 border-amber-200";
    Icon = ShieldAlert;
  } else if (isBlock) {
    headerBg = "bg-rose-50 text-rose-950 border-rose-200";
    Icon = Lock;
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAuto ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : isHuman ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100" : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0b1426] text-sm leading-tight">
                Policy & Safety Control Engine
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mandatory Financial Guardrails</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-black rounded-full border shadow-2xs ${headerBg}`}>
            {data.decisionLabel}
          </span>
        </div>

        {/* Core Distinction Banner */}
        <div className="my-3.5 p-3.5 rounded-xl bg-[#02042b] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-black px-2.5 py-1 bg-blue-600/30 text-[#00d2ff] border border-blue-400/30 rounded-lg text-[10px] uppercase tracking-wider">
              AI Recommendation ≠ Authorization
            </span>
          </div>
          <span className="text-slate-300 text-xs font-bold">
            {isAuto
              ? "Policy approved automatic action."
              : isHuman
              ? "Policy mandated human approval."
              : "Policy blocked execution."}
          </span>
        </div>

        {/* Decision Summary */}
        <div className="mb-4">
          <p className="text-xs font-extrabold text-slate-800 mb-1.5">Policy Engine Rationale:</p>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            {data.reason}
          </p>
        </div>

        {/* Safety Rules Checklist */}
        <div>
          <p className="text-xs font-extrabold text-slate-800 mb-2">Evaluated Compliance Rules:</p>
          <div className="space-y-1.5">
            {data.rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border ${
                  rule.passed
                    ? "bg-emerald-50/40 border-emerald-100 text-emerald-950"
                    : "bg-rose-50/40 border-rose-100 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  {rule.passed ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{rule.text}</span>
                </div>
                <span className={`font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ${rule.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
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
