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
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  UserCheck, 
  Edit3,
  Clock,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";

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
    await recheckPayment(recoveryCase.id);
    setRetryStep("RECHECKED_FAILED");
    onUpdate();
  };

  // Step 2: Execute Retry
  const handleExecuteRetry = async () => {
    setRetryStep("EXECUTING");
    setTimeout(async () => {
      setRetryStep("VERIFYING");
      await executeRetry(recoveryCase.id);
      setTimeout(() => {
        setRetryStep("SUCCESS");
        onUpdate();
      }, 700);
    }, 800);
  };

  // Human approval actions
  const handleApprove = async () => {
    setIsLoading(true);
    await approveCase(recoveryCase.id);
    setIsLoading(false);
    onUpdate();
  };

  const handleReject = async () => {
    setIsLoading(true);
    await rejectCase(recoveryCase.id);
    setIsLoading(false);
    onUpdate();
  };

  const handleModifySubmit = async (delayMinutes: number, notes?: string) => {
    setIsLoading(true);
    await modifyCase(recoveryCase.id, { delayMinutes, notes });
    setIsLoading(false);
    onUpdate();
  };

  // BLOCKED Case: Prohibited action banner & hard-disabled state
  if (isBlock) {
    return (
      <div className="bg-rose-50/80 border-2 border-rose-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-950 uppercase tracking-tight">
              ⚠️ DO NOT RETRY — ACTION PROHIBITED BY POLICY
            </h3>
            <p className="text-xs font-bold text-rose-800">Safety engine automatically blocked payment execution</p>
          </div>
        </div>

        <p className="text-xs text-rose-900 leading-relaxed font-semibold bg-white p-4 rounded-xl border border-rose-200/90 shadow-2xs mb-4">
          &ldquo;Payment confirmation is uncertain and the customer may already have been debited. Retrying could create a duplicate charge and violate card network rules.&rdquo;
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs font-semibold">
          <div className="bg-white p-3 rounded-xl border border-rose-200">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Enforcement Mode</span>
            <span className="font-black text-rose-800 text-sm">HARD BLOCKED</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-200">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Mandated Next Step</span>
            <span className="font-black text-slate-900 text-sm">Manual Bank Reconciliation</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rose-200">
          <button
            disabled
            className="px-4 py-2.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-2 border border-slate-300"
            title="Retry is permanently disabled for ambiguous risk transactions"
          >
            <XCircle className="h-4 w-4" />
            Execute Retry (Disabled)
          </button>

          {!humanSentReview ? (
            <button
              onClick={() => setHumanSentReview(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <ShieldAlert className="h-4 w-4" />
              Escalate to Fraud Team
            </button>
          ) : (
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Escalation Ticket Dispatched
            </span>
          )}
        </div>
      </div>
    );
  }

  // HUMAN APPROVAL Case
  if (isHuman && recoveryCase.status === "HUMAN_APPROVAL") {
    return (
      <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-amber-950 text-base">🟡 Human Approval Required</h3>
              <p className="text-xs text-amber-800 font-bold">
                Amount (₹{recoveryCase.amount.toLocaleString("en-IN")}) exceeds automatic recovery threshold (₹50,000).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs mb-4 shadow-2xs">
          <p className="font-bold text-slate-500 uppercase text-[10px]">AI Proposed Action:</p>
          <p className="text-slate-950 font-black text-sm mt-0.5">{recoveryCase.aiRecommendation.recommendation}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Approve Action
          </button>

          <button
            onClick={handleReject}
            disabled={isLoading}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-2"
          >
            <XCircle className="h-4 w-4 text-slate-500" />
            Reject Action
          </button>

          <button
            onClick={() => setIsModifying(true)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Modify Parameters
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div>
          <h3 className="font-extrabold text-[#0b1426] text-sm">Simulated Execution & Verification Pipeline</h3>
          <p className="text-xs text-slate-500">Live operational execution & gateway deposit check</p>
        </div>

        {retryStep === "SUCCESS" && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Payment Verified & Recovered
          </span>
        )}
      </div>

      {/* Stepper progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
        <div className={`p-2.5 rounded-lg border flex items-center gap-2 font-bold ${retryStep === "INITIAL" ? "bg-white border-blue-300 text-[#106cf6] shadow-2xs" : "border-transparent text-slate-400"}`}>
          <span className={`h-2 w-2 rounded-full ${retryStep === "INITIAL" ? "bg-[#106cf6] animate-pulse" : "bg-slate-300"}`}></span>
          1. Scheduled
        </div>

        <div className={`p-2.5 rounded-lg border flex items-center gap-2 font-bold ${retryStep === "RECHECKING" || retryStep === "RECHECKED_FAILED" ? "bg-white border-amber-300 text-amber-900 shadow-2xs" : "border-transparent text-slate-400"}`}>
          <span className={`h-2 w-2 rounded-full ${retryStep === "RECHECKING" ? "bg-amber-500 animate-pulse" : retryStep === "RECHECKED_FAILED" ? "bg-amber-600" : "bg-slate-300"}`}></span>
          2. Re-checking
        </div>

        <div className={`p-2.5 rounded-lg border flex items-center gap-2 font-bold ${retryStep === "EXECUTING" || retryStep === "VERIFYING" ? "bg-white border-indigo-300 text-indigo-900 shadow-2xs" : "border-transparent text-slate-400"}`}>
          <span className={`h-2 w-2 rounded-full ${retryStep === "EXECUTING" || retryStep === "VERIFYING" ? "bg-indigo-600 animate-pulse" : "bg-slate-300"}`}></span>
          3. Executing & Verifying
        </div>

        <div className={`p-2.5 rounded-lg border flex items-center gap-2 font-bold ${retryStep === "SUCCESS" ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs" : "border-transparent text-slate-400"}`}>
          <span className={`h-2 w-2 rounded-full ${retryStep === "SUCCESS" ? "bg-emerald-600" : "bg-slate-300"}`}></span>
          4. Recovered
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-3">
        {retryStep === "INITIAL" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-[#0b1426]">Step 1: Gateway Re-check</p>
              <p className="text-[11px] text-slate-500">Query bank portal to verify customer hasn&apos;t settled in the interim.</p>
            </div>
            <button
              onClick={handleRecheck}
              className="px-5 py-2.5 bg-[#106cf6] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Re-check Payment State
            </button>
          </div>
        )}

        {retryStep === "RECHECKING" && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            Re-checking settlement status with bank gateway...
          </div>
        )}

        {retryStep === "RECHECKED_FAILED" && (
          <div className="space-y-3">
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-950">
              <span className="text-amber-900">Re-check Result: </span>
              Payment state confirmed CLEARLY FAILED. Zero duplicate debit signal detected. Safe to execute retry.
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleExecuteRetry}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Play className="h-4 w-4 fill-white" />
                Execute Retry Now
              </button>
            </div>
          </div>
        )}

        {retryStep === "EXECUTING" && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            Dispatched payment retry payload to card network...
          </div>
        )}

        {retryStep === "VERIFYING" && (
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs font-bold text-blue-950 flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Verifying bank settlement webhook response...
          </div>
        )}

        {retryStep === "SUCCESS" && (
          <div className="p-6 bg-emerald-50/90 border-2 border-emerald-300/90 rounded-2xl text-center shadow-xs animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-xl font-black text-emerald-950">✓ Payment Successfully Recovered</h4>
            <p className="text-lg font-extrabold text-emerald-700 mt-1">
              ₹{recoveryCase.amount.toLocaleString("en-IN")} Deposited
            </p>
            <p className="text-xs text-emerald-700 mt-2 font-semibold">
              Verified by Payment Gateway. Audit trail updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
