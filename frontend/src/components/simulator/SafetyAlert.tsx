"use client";

import { ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";

interface SafetyAlertProps {
  amount: string;
  caseId: string;
  onExploreBlocked?: () => void;
}

export default function SafetyAlert({ amount, caseId, onExploreBlocked }: SafetyAlertProps) {
  return (
    <div className="bg-rose-950/30 border-2 border-rose-600/80 rounded-xl p-5 shadow-lg text-rose-100 animate-in fade-in duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50">
                {caseId}
              </span>
              <span className="text-xs font-bold text-rose-300 bg-rose-900/80 px-2.5 py-0.5 rounded-full border border-rose-600/40">
                🔴 POLICY BLOCKED
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1 tracking-tight">
              ⚠ PAYMENT SAFETY ALERT — DUPLICATE DEBIT PREVENTED
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-rose-400 block">Amount at Risk</span>
          <span className="text-2xl font-extrabold font-mono text-white">{amount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-rose-800/40">
        <div className="p-3 bg-slate-900/80 rounded-lg border border-rose-900/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Payment State
          </span>
          <span className="font-mono font-bold text-amber-400 text-xs mt-0.5 block">
            AMBIGUOUS (Bank Timeout)
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Possible Customer Debit = YES</p>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-lg border border-rose-900/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            AI Recommendation
          </span>
          <span className="font-mono font-bold text-blue-400 text-xs mt-0.5 block">
            RETRY PAYMENT
          </span>
          <p className="text-[11px] text-slate-400 mt-1">AI calculated 65% probability</p>
        </div>

        <div className="p-3 bg-rose-900/40 rounded-lg border border-rose-600/60">
          <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
            Policy Engine Override
          </span>
          <span className="font-mono font-bold text-rose-300 text-xs mt-0.5 block">
            🔴 HARD BLOCK EXECUTED
          </span>
          <p className="text-[11px] text-rose-200 mt-1">Retrying may cause double debit</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-rose-900/50 rounded-lg border border-rose-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-100 font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong>Bounded Autonomy Verified:</strong> AI recommended retry, but Policy Engine safely blocked execution. Zero false debits executed.
          </span>
        </div>

        {onExploreBlocked && (
          <button
            onClick={onExploreBlocked}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            Inspect Audit Trail
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
