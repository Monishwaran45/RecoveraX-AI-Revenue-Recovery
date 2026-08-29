"use client";

import { CheckCircle2, ShieldAlert, ArrowRight, RefreshCw, Send, Check } from "lucide-react";
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
      className={`border rounded-lg p-5 transition-colors ${
        isRecovered
          ? "bg-emerald-900 text-white border-emerald-800"
          : (isBlocked || isStopped || isFailed)
          ? "bg-gray-900 text-white border-gray-800"
          : "bg-amber-950 text-white border-amber-900"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded text-white shrink-0 ${
              isRecovered
                ? "bg-emerald-600"
                : (isBlocked || isStopped || isFailed)
                ? "bg-rose-600"
                : "bg-amber-600"
            }`}
          >
            {isRecovered ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (isBlocked || isStopped || isFailed) ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </div>

          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Resolution Outcome
            </span>
            <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
              {isRecovered
                ? "Payment Recovered & Deposited"
                : isBlocked
                ? "Execution Blocked by Guardrail Policy"
                : isStopped
                ? "Recovery Process Stopped"
                : isFailed
                ? "Recovery Retry Unsuccessful"
                : "Manual Sign-off Required"}
            </h3>
            <p className="text-xs text-gray-300 mt-0.5 font-normal max-w-xl leading-relaxed">
              {isRecovered
                ? `Revenue of ₹${caseData.amount.toLocaleString("en-IN")} verified with bank gateway and reconciled in ledger.`
                : isBlocked
                ? `Execution of ₹${caseData.amount.toLocaleString("en-IN")} blocked to enforce zero duplicate charge guarantee.`
                : isStopped
                ? `Recovery process stopped. No charge dispatched.`
                : isFailed
                ? `Recovery retry failed. Gateway response unverified.`
                : isReminderAction
                ? `Transaction ₹${caseData.amount.toLocaleString("en-IN")} routed to approval queue. Click below to send payment link.`
                : `Transaction ₹${caseData.amount.toLocaleString("en-IN")} exceeds auto-limit. Requires operator authorization.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-5 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
              Recovered
            </span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {isRecovered ? `₹${(caseData.amountRecovered || caseData.amount).toLocaleString("en-IN")}` : "₹0"}
            </span>
          </div>

          {isHuman && onApproveAndExecute && (
            <button
              onClick={onApproveAndExecute}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isReminderAction ? <Send className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {isReminderAction ? "Send Link & Recover" : "Authorize & Execute"}
            </button>
          )}

          {onRunAgain && (
            <button
              onClick={onRunAgain}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Next Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
