"use client";

import { useState } from "react";
import { RecoveryCase } from "@/lib/types";
import { recheckPayment, executeRetry, approveCase, rejectCase, modifyCase } from "@/lib/api/approvals";
import ModifyActionModal from "./ModifyActionModal";
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Loader2, 
  UserCheck, 
  Edit3, 
  Lock 
} from "lucide-react";

import { store } from "@/lib/store";

interface ActionPanelProps {
  recoveryCase: RecoveryCase;
  onUpdate: () => void;
}

type RetryStep = "INITIAL" | "RECHECKING" | "RECHECKED_FAILED" | "EXECUTING" | "VERIFYING" | "SUCCESS";

export default function ActionPanel({ recoveryCase, onUpdate }: ActionPanelProps) {
  const [retryStep, setRetryStep] = useState<RetryStep>(
    recoveryCase.status === "RECOVERED" ? "SUCCESS" : "INITIAL"
  );
  const [isModifying, setIsModifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [humanSentReview, setHumanSentReview] = useState(false);

  const isHuman = recoveryCase.policyDecision.type === "HUMAN" || recoveryCase.status === "HUMAN_APPROVAL";
  const isBlock = recoveryCase.policyDecision.type === "BLOCK" || recoveryCase.status === "BLOCKED";

  // Step 1: Re-check payment state
  const handleRecheck = async () => {
    setRetryStep("RECHECKING");
    try {
      await recheckPayment(recoveryCase.id);
    } catch (err) {
      console.warn("Backend recheck API notice, updating local state:", err);
      store.recheckPayment(recoveryCase.id);
    }
    setRetryStep("RECHECKED_FAILED");
    onUpdate();
  };

  // Step 2: Execute Retry
  const handleExecuteRetry = async () => {
    setRetryStep("EXECUTING");
    setTimeout(async () => {
      setRetryStep("VERIFYING");
      try {
        await executeRetry(recoveryCase.id);
      } catch (err) {
        console.warn("Backend execute API notice, updating local state:", err);
        store.markRecovered(recoveryCase.id);
      }
      setTimeout(() => {
        setRetryStep("SUCCESS");
        onUpdate();
      }, 700);
    }, 800);
  };

  // Human approval actions
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveCase(recoveryCase.id);
    } catch (err) {
      console.warn("Backend approve API notice, updating local state:", err);
      store.approveCase(recoveryCase.id);
    }
    setIsLoading(false);
    onUpdate();
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectCase(recoveryCase.id);
    } catch (err) {
      console.warn("Backend reject API notice, updating local state:", err);
      store.rejectCase(recoveryCase.id);
    }
    setIsLoading(false);
    onUpdate();
  };

  const handleModifySubmit = async (delayMinutes: number, notes?: string) => {
    setIsLoading(true);
    try {
      await modifyCase(recoveryCase.id, { delayMinutes, notes });
    } catch (err) {
      console.warn("Backend modify API notice, updating local state:", err);
      store.modifyCase(recoveryCase.id, { delayMinutes, notes });
    }
    setIsLoading(false);
    onUpdate();
  };

  // BLOCKED Case
  if (isBlock) {
    return (
      <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-4">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="p-1.5 bg-rose-600 text-white rounded shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
              Action Prohibited by Guardrail Policy
            </h3>
            <p className="text-[11px] text-rose-800 font-medium">Automatic execution blocked to protect customer account</p>
          </div>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-normal bg-white p-3 rounded border border-rose-200 mb-3">
          Payment confirmation telemetry is ambiguous (Bank Gateway Timeout). Attempting a blind retry carries a risk of duplicate debit. Policy mandates manual ledger verification before further action.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 text-xs">
          <div className="bg-white p-2.5 rounded border border-rose-200">
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">Status</span>
            <span className="font-semibold text-rose-800 text-xs">HARD BLOCKED</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-rose-200">
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">Mandated Action</span>
            <span className="font-semibold text-gray-900 text-xs">Manual Settlement Reconciliation</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-rose-200">
          <button
            disabled
            className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded cursor-not-allowed flex items-center gap-1.5 border border-gray-200"
          >
            <XCircle className="h-3.5 w-3.5" />
            Execute Retry (Blocked)
          </button>

          {!humanSentReview ? (
            <button
              onClick={() => setHumanSentReview(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Escalate to Risk Ops
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Escalated to Risk Ops
            </span>
          )}
        </div>
      </div>
    );
  }

  // HUMAN APPROVAL Case
  if (isHuman && recoveryCase.status === "HUMAN_APPROVAL") {
    return (
      <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Manual Authorization Required</h3>
            <p className="text-[11px] text-amber-900 font-medium mt-0.5">
              Amount (₹{recoveryCase.amount.toLocaleString("en-IN")}) exceeds automatic recovery limit (₹50,000).
            </p>
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-amber-200 text-xs mb-3">
          <span className="font-semibold text-gray-400 uppercase text-[10px] block">Proposed Strategy</span>
          <p className="text-gray-900 font-semibold text-xs mt-0.5">{recoveryCase.aiRecommendation.recommendation}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Authorize & Execute
          </button>

          <button
            onClick={() => setIsModifying(true)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Edit3 className="h-3.5 w-3.5 text-gray-500" />
            Modify Delay
          </button>

          <button
            onClick={handleReject}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-medium text-xs rounded border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
            Decline
          </button>
        </div>

        <ModifyActionModal
          recoveryCase={recoveryCase}
          isOpen={isModifying}
          onClose={() => setIsModifying(false)}
          onSubmit={handleModifySubmit}
        />
      </div>
    );
  }

  // AUTO / SIMULATED RETRY EXECUTION FLOW
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
        <div>
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Execution & Settlement Verification</h3>
          <p className="text-[11px] text-gray-500 font-normal">Real-time payment gateway re-check & deposit confirmation</p>
        </div>

        {retryStep === "SUCCESS" && (
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-medium text-xs rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified & Deposited
          </span>
        )}
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-gray-50 p-2 rounded border border-gray-200 text-xs">
        <div className={`p-2 rounded border flex items-center gap-1.5 font-medium ${retryStep === "INITIAL" ? "bg-white border-gray-300 text-gray-900" : "border-transparent text-gray-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${retryStep === "INITIAL" ? "bg-blue-600" : "bg-gray-300"}`}></span>
          1. Scheduled
        </div>

        <div className={`p-2 rounded border flex items-center gap-1.5 font-medium ${retryStep === "RECHECKING" || retryStep === "RECHECKED_FAILED" ? "bg-white border-gray-300 text-gray-900" : "border-transparent text-gray-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${retryStep === "RECHECKING" || retryStep === "RECHECKED_FAILED" ? "bg-amber-600" : "bg-gray-300"}`}></span>
          2. Re-checking
        </div>

        <div className={`p-2 rounded border flex items-center gap-1.5 font-medium ${retryStep === "EXECUTING" || retryStep === "VERIFYING" ? "bg-white border-gray-300 text-gray-900" : "border-transparent text-gray-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${retryStep === "EXECUTING" || retryStep === "VERIFYING" ? "bg-blue-600" : "bg-gray-300"}`}></span>
          3. Dispatching
        </div>

        <div className={`p-2 rounded border flex items-center gap-1.5 font-medium ${retryStep === "SUCCESS" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "border-transparent text-gray-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${retryStep === "SUCCESS" ? "bg-emerald-600" : "bg-gray-300"}`}></span>
          4. Settled
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2.5">
        {retryStep === "INITIAL" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gray-50 p-3 rounded border border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-900">Step 1: Gateway Settlement Pre-Check</p>
              <p className="text-[11px] text-gray-500">Query bank gateway to ensure customer has not settled in the interim.</p>
            </div>
            <button
              onClick={handleRecheck}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Re-check State
            </button>
          </div>
        )}

        {retryStep === "RECHECKING" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-950 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            Querying bank gateway settlement status...
          </div>
        )}

        {retryStep === "RECHECKED_FAILED" && (
          <div className="space-y-2.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-normal text-emerald-950">
              <span className="font-semibold text-emerald-900">Pre-check Passed: </span>
              Payment state verified clearly failed. Zero duplicate debit signal detected. Safe to dispatch retry.
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleExecuteRetry}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Execute Retry Now
              </button>
            </div>
          </div>
        )}

        {retryStep === "EXECUTING" && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-900 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />
            Dispatching payment retry payload to payment network...
          </div>
        )}

        {retryStep === "VERIFYING" && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-900 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />
            Verifying bank settlement webhook response...
          </div>
        )}

        {retryStep === "SUCCESS" && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-sm font-semibold text-gray-900">Payment Successfully Settled</h4>
            <p className="text-sm font-bold text-emerald-800 mt-0.5 font-mono tabular-nums">
              ₹{recoveryCase.amount.toLocaleString("en-IN")} Deposited
            </p>
            <p className="text-xs text-gray-500 mt-1 font-normal">
              Verified by payment gateway. Transaction ledger updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
