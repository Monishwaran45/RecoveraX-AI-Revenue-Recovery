"use client";

import { ShieldAlert, AlertTriangle, ArrowRight, Lock } from "lucide-react";

interface SafetyAlertProps {
  amount: string;
  caseId: string;
  onExploreBlocked?: () => void;
}

export default function SafetyAlert({ amount, caseId, onExploreBlocked }: SafetyAlertProps) {
  return (
    <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-4 text-rose-950">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600 text-white rounded shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded border border-rose-200">
                {caseId}
              </span>
              <span className="text-[11px] font-medium text-rose-800 bg-rose-100/80 px-2 py-0.2 rounded border border-rose-200">
                Policy Block Enforced
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">
              Safety Guardrail Active — Duplicate Charge Prevention
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] text-gray-500 block">Protected Volume</span>
          <span className="text-lg font-bold font-mono text-gray-900 tabular-nums">{amount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-rose-200/60 text-xs">
        <div className="p-2.5 bg-white rounded border border-rose-200/60">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Telemetry State
          </span>
          <span className="font-mono font-medium text-amber-800 text-xs mt-0.5 block">
            BANK_TIMEOUT
          </span>
          <p className="text-[11px] text-gray-600 mt-0.5">Possible unconfirmed customer debit</p>
        </div>

        <div className="p-2.5 bg-white rounded border border-rose-200/60">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Algorithmic Suggestion
          </span>
          <span className="font-mono font-medium text-blue-800 text-xs mt-0.5 block">
            RETRY TRANSACTION
          </span>
          <p className="text-[11px] text-gray-600 mt-0.5">65% calculated probability</p>
        </div>

        <div className="p-2.5 bg-white rounded border border-rose-300">
          <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
            Deterministic Override
          </span>
          <span className="font-mono font-medium text-rose-800 text-xs mt-0.5 block">
            EXECUTION BLOCKED
          </span>
          <p className="text-[11px] text-gray-600 mt-0.5">Strict zero double-debit rule enforced</p>
        </div>
      </div>

      <div className="mt-3 p-2.5 bg-white rounded border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-gray-700">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
          <span>
            <strong>Bounded Autonomy:</strong> Machine learning recommendations are strictly overridden by deterministic financial safety policies.
          </span>
        </div>

        {onExploreBlocked && (
          <button
            onClick={onExploreBlocked}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect Ledger</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
