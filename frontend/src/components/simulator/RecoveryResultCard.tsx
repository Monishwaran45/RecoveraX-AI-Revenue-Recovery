"use client";

import { CheckCircle2, ShieldAlert, ArrowRight, RefreshCw, Zap, Send } from "lucide-react";
import { RecoveryCase } from "@/lib/types";

interface RecoveryResultCardProps {
  caseData: RecoveryCase;
  onRunAgain?: () => void;
  onApproveAndExecute?: () => void;
}

export default function RecoveryResultCard({ caseData, onRunAgain, onApproveAndExecute }: RecoveryResultCardProps) {
  const isRecovered = caseData.status === "RECOVERED" && (caseData.verificationResult === "VERIFIED_SUCCESS" || (caseData.amountRecovered || 0) > 0);
  const isBlocked = caseData.status === "BLOCKED";
  const isStopped = caseData.status === "STOPPED" || caseData.status === "REJECTED";
  const isFailed = caseData.status === "FAILED";
  const isHuman = (caseData.status === "HUMAN_APPROVAL" || caseData.approvalStatus === "PENDING" || caseData.policyDecision?.type === "HUMAN") && !isRecovered && !isBlocked && !isStopped && !isFailed;
  
  const isReminderAction = caseData.recommendedAction === "REMIND" || caseData.recommendedAction === "ESCALATE" || caseData.type === "CHECKOUT" || caseData.type === "INVOICE";

  return (
    <div
      className={`border rounded-xl p-6 shadow-md transition-all ${
        isRecovered
          ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-100"
          : (isBlocked || isStopped || isFailed)
          ? "bg-rose-950/40 border-rose-500/80 text-rose-100"
          : "bg-amber-950/40 border-amber-500/80 text-amber-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl shadow-md ${
              isRecovered
                ? "bg-emerald-600 text-white"
                : (isBlocked || isStopped || isFailed)
                ? "bg-rose-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {isRecovered ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (isBlocked || isStopped || isFailed) ? (
              <ShieldAlert className="h-7 w-7" />
            ) : (
              <Zap className="h-7 w-7" />
            )}
          </div>

          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-75">
              Simulation Result Outcome
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
              {isRecovered
                ? "✓ RECOVERY COMPLETE"
                : isBlocked
                ? "🛡 RECOVERY BLOCKED"
                : isStopped
                ? "⛔ RECOVERY STOPPED"
                : isFailed
                ? "🔴 RECOVERY FAILED"
                : "🟡 RECOVERY AWAITING APPROVAL"}
            </h3>
            <p className="text-xs opacity-90 mt-1 font-medium">
              {isRecovered
                ? `Revenue of ₹${caseData.amount.toLocaleString("en-IN")} successfully recovered and deposited.`
                : isBlocked
                ? `Execution of ₹${caseData.amount.toLocaleString("en-IN")} blocked by Policy Engine to prevent duplicate charge.`
                : isStopped
                ? `Recovery process stopped. No monetary recovery executed.`
                : isFailed
                ? `Recovery retry failed. Gateway response unverified.`
                : isReminderAction
                ? `Amount ₹${caseData.amount.toLocaleString("en-IN")} routed to merchant approval queue. Click 'Send Reminder Link & Recover' to dispatch 1-click payment link.`
                : `Amount ₹${caseData.amount.toLocaleString("en-IN")} routed to merchant approval queue. Click 'Approve & Execute Retry' to grant sign-off.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0 sm:pl-6">
          <div className="text-right mr-2">
            <span className="text-[11px] font-semibold opacity-75 block">Total Recovered</span>
            <span className="text-3xl font-extrabold font-mono text-white">
              {isRecovered ? `₹${(caseData.amountRecovered || caseData.amount).toLocaleString("en-IN")}` : "₹0"}
            </span>
          </div>

          {isHuman && onApproveAndExecute && (
            <button
              onClick={onApproveAndExecute}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0 animate-pulse"
            >
              {isReminderAction ? <Send className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {isReminderAction ? "Send Reminder Link & Recover" : "Approve & Execute Retry"}
            </button>
          )}

          {onRunAgain && (
            <button
              onClick={onRunAgain}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              Run Next Scenario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
