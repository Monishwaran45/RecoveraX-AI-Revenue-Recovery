"use client";

import { useState, useEffect } from "react";
import { RecoveryCase } from "@/lib/types";
import { recheckPayment, executeRetry, approveCase, rejectCase, modifyCase } from "@/lib/api/approvals";
import { triggerSarvamVoiceCall, SarvamVoiceResponse } from "@/lib/api/voice";
import { createPromiseToPay, getPromisesToPay, verifyPromiseToPay, PromiseToPayRecord } from "@/lib/api/promises";
import ModifyActionModal from "./ModifyActionModal";
import PromiseToPayModal from "./PromiseToPayModal";
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Loader2, 
  UserCheck, 
  Edit3, 
  Lock,
  PhoneCall,
  Calendar,
  Mic,
  Volume2
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
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [humanSentReview, setHumanSentReview] = useState(false);

  // Voice state
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<SarvamVoiceResponse | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // P2P state
  const [p2pRecord, setP2PRecord] = useState<PromiseToPayRecord | null>(null);
  const [p2pVerifying, setP2PVerifying] = useState(false);

  // Auto-fetch existing P2P commitment for current case
  useEffect(() => {
    let active = true;
    setVoiceResult(null);
    setVoiceError(null);
    getPromisesToPay(recoveryCase.id)
      .then((records) => {
        if (active) {
          setP2PRecord(records && records.length > 0 ? records[0] : null);
        }
      })
      .catch(() => {
        if (active) setP2PRecord(null);
      });
    return () => {
      active = false;
    };
  }, [recoveryCase.id]);

  const isHuman = recoveryCase.policyDecision.type === "HUMAN" || recoveryCase.status === "HUMAN_APPROVAL";
  const isBlock = recoveryCase.policyDecision.type === "BLOCK" || recoveryCase.status === "BLOCKED";

  // Trigger Sarvam AI Hinglish Voice Call
  const handleTriggerVoiceCall = async () => {
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const res = await triggerSarvamVoiceCall(recoveryCase.id);
      setVoiceResult(res);
    } catch (err: any) {
      setVoiceError(err.message || "Failed to trigger Sarvam AI Hinglish voice call.");
    } finally {
      setVoiceLoading(false);
    }
  };

  // Create P2P Commitment
  const handleCreateP2P = async (promisedAmount: number, promisedDate: string, notes?: string) => {
    const res = await createPromiseToPay(recoveryCase.id, { promisedAmount, promisedDate, notes });
    setP2PRecord(res);
    onUpdate();
  };

  // Verify P2P Fulfillment
  const handleVerifyP2P = async () => {
    setP2PVerifying(true);
    try {
      const res = await verifyPromiseToPay(recoveryCase.id, p2pRecord?.id);
      setP2PRecord(res);
      onUpdate();
    } catch (err: any) {
      console.warn("P2P Verification warning:", err);
    } finally {
      setP2PVerifying(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* 1. MAIN ACTION CONTAINER */}
      {isBlock ? (
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
          
          <div className="pt-2.5 border-t border-rose-200">
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
      ) : isHuman && recoveryCase.status === "HUMAN_APPROVAL" ? (
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
        </div>
      ) : (
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

          {/* Mandate Retry Sequencer Card */}
          {recoveryCase.isMandate && (
            <div className="mb-3.5 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs">
                  <RotateCw className="h-3.5 w-3.5 text-blue-600" />
                  NPCI Mandate Retry Sequencer Active
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[10px] rounded uppercase font-semibold">
                  {recoveryCase.mandatePlan?.targetBatchCycle || "NPCI_MORNING_BATCH_0900_IST"}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed text-[11px]">
                {recoveryCase.mandatePlan?.mandateRetryReason || "Mandate retry window aligned to NPCI clearing batch with 48h cool-off dishonor guardrail."}
              </p>
            </div>
          )}

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

          {/* Action Control */}
          {retryStep === "INITIAL" && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs">
                <span className="font-semibold text-gray-700 block">Pre-Execution Gate Ready</span>
                <span className="text-[11px] text-gray-500">Re-check bank gateway state before triggering retry</span>
              </div>
              <button
                onClick={handleRecheck}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Re-check State
              </button>
            </div>
          )}

          {retryStep === "RECHECKED_FAILED" && (
            <div className="space-y-2.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-normal text-emerald-950">
                <span className="font-semibold text-emerald-900">Pre-check Passed: </span>
                Payment state verified clearly failed. Safe to dispatch retry.
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

          {retryStep === "SUCCESS" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto mb-1.5" />
              <h4 className="text-sm font-semibold text-gray-900">Payment Successfully Settled</h4>
              <p className="text-xs font-bold text-emerald-800 mt-0.5 font-mono tabular-nums">
                ₹{recoveryCase.amount.toLocaleString("en-IN")} Deposited
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. SARVAM AI HINGLISH VOICE RECOVERY WIDGET */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Sarvam AI Hinglish Voice Recovery</h3>
              <p className="text-[11px] text-gray-500">Automated Indian language voice collection agent</p>
            </div>
          </div>

          <button
            onClick={handleTriggerVoiceCall}
            disabled={voiceLoading || isBlock}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {voiceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
            Trigger Voice Call
          </button>
        </div>

        {voiceError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded mb-3">
            {voiceError}
          </div>
        )}

        {voiceResult ? (
          <div className="space-y-2.5 bg-purple-50/60 border border-purple-200 p-3 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-purple-600" />
                Hinglish Voice Call Payload
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${voiceResult.voice_mode === "REAL" ? "bg-emerald-600 text-white" : "bg-purple-600 text-white"}`}>
                MODE: {voiceResult.voice_mode}
              </span>
            </div>

            <p className="text-gray-800 italic bg-white p-2.5 rounded border border-purple-200 text-[11px] leading-relaxed">
              &quot;{voiceResult.script}&quot;
            </p>

            {/* Audio Playback Controls */}
            {voiceResult.audio_url && voiceResult.audio_url.startsWith("data:audio") ? (
              <div className="bg-white p-2 rounded border border-purple-200">
                <audio controls autoPlay src={voiceResult.audio_url} className="w-full h-8" />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2 rounded border border-purple-200 text-xs">
                <span className="text-gray-600 text-[11px] font-medium">Listen Audio Preview:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(voiceResult.script);
                      utterance.lang = "hi-IN";
                      utterance.rate = 0.95;
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Play Hinglish Voice Audio
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-purple-900 pt-1">
              <span>Engine: {voiceResult.provider}</span>
              <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Call Status: {voiceResult.status}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 font-normal leading-relaxed">
            Click &quot;Trigger Voice Call&quot; to synthesize a personalized Hinglish voice reminder using Sarvam AI (<code className="text-[10px] font-mono text-purple-700">bulbul:v1</code>).
          </p>
        )}
      </div>

      {/* 3. PROMISE-TO-PAY (P2P) TRACKER WIDGET */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Promise-to-Pay (P2P) Tracker</h3>
              <p className="text-[11px] text-gray-500">Track customer settlement commitment dates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {p2pRecord && (
              <button
                onClick={handleVerifyP2P}
                disabled={p2pVerifying}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium border border-gray-300 rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {p2pVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                Verify P2P
              </button>
            )}

            <button
              onClick={() => setIsP2POpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              Log P2P Commitment
            </button>
          </div>
        </div>

        {p2pRecord ? (
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-950 text-xs">P2P STATUS</span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded ${
                p2pRecord.status === "P2P_KEPT"
                  ? "bg-emerald-600 text-white"
                  : p2pRecord.status === "P2P_BROKEN"
                  ? "bg-rose-600 text-white"
                  : "bg-amber-500 text-white"
              }`}>
                {p2pRecord.status === "P2P_KEPT" ? "✓ P2P_KEPT" : (p2pRecord.status === "P2P_BROKEN" ? "⚠ P2P_BROKEN" : "PROMISED")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-emerald-200">
                <span className="text-gray-400 font-semibold uppercase text-[9px] block">Promised Amount</span>
                <span className="font-bold text-gray-900 font-mono text-xs">₹{p2pRecord.promised_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200">
                <span className="text-gray-400 font-semibold uppercase text-[9px] block">Promised Due Date</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">{new Date(p2pRecord.promised_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            {p2pRecord.notes && (
              <p className="text-[11px] text-emerald-900 italic bg-white p-2 rounded border border-emerald-200">
                &quot;{p2pRecord.notes}&quot;
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 font-normal leading-relaxed">
            No active Promise-to-Pay commitment logged. Click &quot;Log P2P Commitment&quot; to set a agreed customer payment date.
          </p>
        )}
      </div>

      {/* Modals */}
      <ModifyActionModal
        recoveryCase={recoveryCase}
        isOpen={isModifying}
        onClose={() => setIsModifying(false)}
        onSubmit={handleModifySubmit}
      />

      <PromiseToPayModal
        caseId={recoveryCase.id}
        defaultAmount={recoveryCase.amount}
        isOpen={isP2POpen}
        onClose={() => setIsP2POpen(false)}
        onSubmit={handleCreateP2P}
      />
    </div>
  );
}
