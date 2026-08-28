"use client";

import { useState, useEffect } from "react";
import ScenarioSelector, { SCENARIOS, Scenario, mapCaseToScenario } from "./ScenarioSelector";
import AgentWorkflow, { WorkflowStep } from "./AgentWorkflow";
import AIDecisionCard from "./AIDecisionCard";
import PolicyDecisionCard from "./PolicyDecisionCard";
import SafetyAlert from "./SafetyAlert";
import AgentEventLog, { LogEntry } from "./AgentEventLog";
import RecoveryResultCard from "./RecoveryResultCard";
import { getCase, getCases, analyzeCase, recheckCase, executeCaseAction } from "@/lib/api/cases";
import { approveCase } from "@/lib/api/approvals";
import { RecoveryCase } from "@/lib/types";
import { Play, RotateCcw, Search, Zap, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "s1", label: "DETECT", sublabel: "Risk Event Loaded", state: "waiting" },
  { id: "s2", label: "DIAGNOSE", sublabel: "Failure Pattern", state: "waiting" },
  { id: "s3", label: "RECOVERY SCORE", sublabel: "Confidence Score", state: "waiting" },
  { id: "s4", label: "RECOMMEND", sublabel: "AI Strategy", state: "waiting" },
  { id: "s5", label: "POLICY", sublabel: "Safety Evaluation", state: "waiting" },
  { id: "s6", label: "AUTHORIZATION", sublabel: "AUTO/HUMAN/BLOCK", state: "waiting" },
  { id: "s7", label: "SCHEDULE", sublabel: "Delay Timer", state: "waiting" },
  { id: "s8", label: "FRESH RE-CHECK", sublabel: "Payment State", state: "waiting" },
  { id: "s9", label: "EXECUTE", sublabel: "Gateway Retry", state: "waiting" },
  { id: "s10", label: "VERIFY", sublabel: "Settlement Check", state: "waiting" },
  { id: "s11", label: "RE-EVALUATE", sublabel: "Outcome Check", state: "waiting" },
  { id: "s12", label: "RECOVER / STOP", sublabel: "Final Status", state: "waiting" },
];

export default function SimulatorPanel({ isCompact = false }: { isCompact?: boolean }) {
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentCase, setCurrentCase] = useState<RecoveryCase | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  const loadScenarioCase = async (sc: Scenario) => {
    if (!sc) return;
    setActiveScenario(sc);
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStepIdx(-1);
    setWorkflowSteps(INITIAL_WORKFLOW_STEPS.map((s) => ({ ...s, state: "waiting" })));

    try {
      const cData = await getCase(sc.caseId);
      if (cData) {
        setCurrentCase(cData);
      }
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const scoreVal = cData?.score ?? cData?.recoveryScore ?? 80;
      setLogs([
        { id: "l1", time: now, category: "SYSTEM", text: `Loaded ${sc.title} (${sc.caseId}) amount ₹${sc.amountVal.toLocaleString("en-IN")}` },
        { id: "l2", time: now, category: "SYSTEM", text: `Current Status: ${sc.type} | Baseline score: ${scoreVal}/100` },
      ]);
    } catch (err: any) {
      setBackendError(`Failed to fetch case ${sc.caseId}: ${err.message || 'Backend unreachable'}`);
    }
  };

  useEffect(() => {
    const initSimulator = async () => {
      try {
        const dbCases = await getCases();
        if (dbCases && dbCases.length > 0) {
          const mapped = dbCases.map((c, i) => mapCaseToScenario(c, i));
          setDynamicScenarios(mapped);
          loadScenarioCase(mapped[0]);
        }
      } catch (err: any) {
        setBackendError(`Backend server offline. Please start FastAPI backend at http://127.0.0.1:8000.`);
      }
    };
    initSimulator();
  }, []);

  const addLog = (category: "SYSTEM" | "AI" | "POLICY" | "ACTION" | "HUMAN", text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { id: `log-${Date.now()}-${Math.random()}`, time, category, text }]);
  };

  const updateStepState = (stepIndex: number, state: "waiting" | "processing" | "completed" | "failed" | "blocked") => {
    setWorkflowSteps((prev) =>
      prev.map((step, idx) => {
        if (idx === stepIndex) return { ...step, state };
        if (idx < stepIndex && step.state === "processing") return { ...step, state: "completed" };
        return step;
      })
    );
  };

  const handleRunSimulation = async () => {
    if (!activeScenario || isRunning) return;
    setIsRunning(true);
    setIsCompleted(false);
    setBackendError(null);

    // Step 1: Load & Detect
    setCurrentStepIdx(0);
    updateStepState(0, "processing");
    addLog("SYSTEM", `Risk Event Loaded into LangGraph pipeline for transaction ${activeScenario.caseId}`);
    await new Promise((r) => setTimeout(r, 300));

    // Invoke actual backend LangGraph agent execution!
    let analyzedCase: RecoveryCase;
    try {
      analyzedCase = await analyzeCase(activeScenario.caseId);
      setCurrentCase(analyzedCase);
      updateStepState(0, "completed");
    } catch (err: any) {
      const msg = err.message || "Failed to communicate with backend FastAPI engine.";
      addLog("SYSTEM", `🔴 BACKEND DISPATCH ERROR: ${msg}`);
      updateStepState(0, "failed");
      setBackendError(`Backend execution failed: ${msg}. Please start backend server on http://127.0.0.1:8000.`);
      setIsRunning(false);
      setIsCompleted(false);
      return;
    }

    const c = analyzedCase;
    const diag = c?.aiRecommendation?.diagnosis || "TEMPORARY_FAILURE";
    const score = c?.score ?? c?.recoveryScore ?? 80;
    const recAction = c?.aiRecommendation?.badgeText || c?.recommendedAction || "RETRY";
    const polDecision = String(c?.policyDecision?.type || c?.policyDecision?.value || c?.policyDecision || "HUMAN").toUpperCase();
    const isHumanRequired = polDecision === "HUMAN" || c?.status === "HUMAN_APPROVAL" || c?.approvalStatus === "PENDING";
    const isBlocked = polDecision === "BLOCK" || c?.status === "BLOCKED";

    // Step 2: Diagnose (Real LLM diagnosis returned from backend)
    setCurrentStepIdx(1);
    updateStepState(1, "processing");
    addLog("AI", `LLM Diagnosed Failure Pattern: ${diag}`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(1, "completed");

    // Step 3: Recovery Score (Real deterministic score calculated by backend engine)
    setCurrentStepIdx(2);
    updateStepState(2, "processing");
    addLog("AI", `Calculated Deterministic Recovery Score: ${score}/100`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(2, "completed");

    // Step 4: Recommend (Real LLM strategy recommendation)
    setCurrentStepIdx(3);
    updateStepState(3, "processing");
    addLog("AI", `AI Recommended Recovery Action: ${recAction}`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(3, "completed");

    // Step 5: Policy (Real deterministic safety policy evaluation)
    setCurrentStepIdx(4);
    updateStepState(4, "processing");
    addLog("POLICY", `Evaluated Policy Rules: ${c?.policyDecision?.explanation || "Passed safety policy guardrails."}`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(4, "completed");

    // Step 6: Authorization (Real decision returned from Policy Engine)
    setCurrentStepIdx(5);
    updateStepState(5, "processing");
    addLog("POLICY", `Policy Engine Decision: ${c?.policyDecision?.decisionLabel || polDecision}`);
    await new Promise((r) => setTimeout(r, 300));

    if (isBlocked) {
      updateStepState(5, "blocked");
      for (let i = 6; i <= 11; i++) updateStepState(i, "blocked");
      addLog("POLICY", `🔴 HARD BLOCK EXECUTED: ${c?.policyDecision?.reason || "Policy engine blocked execution to prevent double charge."}`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    if (isHumanRequired) {
      updateStepState(5, "completed");
      for (let i = 6; i <= 11; i++) updateStepState(i, "pending");
      addLog("HUMAN", `🟡 HUMAN APPROVAL REQUIRED: ${c?.policyDecision?.reason || "High risk / amount requires human sign-off."}`);
      addLog("ACTION", `⏸️ Waiting for merchant approval. Payment execution halted.`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    updateStepState(5, "completed");

    // Step 7: Schedule (Celery background worker queue)
    setCurrentStepIdx(6);
    updateStepState(6, "processing");
    addLog("ACTION", `Retry scheduled with delay timer (${c?.scheduledDelayMinutes || 30} mins)`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(6, "completed");

    // Step 8: Fresh Re-check (Real pre-execution gateway recheck)
    setCurrentStepIdx(7);
    updateStepState(7, "processing");
    addLog("ACTION", `Performing pre-execution fresh payment state re-check...`);
    const rechecked = await recheckCase(activeScenario.caseId);
    if (rechecked) setCurrentCase(rechecked);
    await new Promise((r) => setTimeout(r, 300));
    
    if (rechecked?.status === "BLOCKED" || rechecked?.status === "RECOVERED") {
      addLog("POLICY", `Re-check returned state: ${rechecked.status}. Halting execution.`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }
    
    addLog("ACTION", `Fresh re-check confirmed settlement clear & safe for retry.`);
    updateStepState(7, "completed");

    // Step 9: Execute (Real simulator retry payload dispatch)
    setCurrentStepIdx(8);
    updateStepState(8, "processing");
    addLog("ACTION", `Dispatching payment retry attempt payload to card network...`);
    const execRes = await executeCaseAction(activeScenario.caseId);
    if (execRes) setCurrentCase(execRes);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(8, "completed");

    // Step 10: Verify (Bank settlement verification)
    setCurrentStepIdx(9);
    updateStepState(9, "processing");
    addLog("SYSTEM", `Verifying bank gateway settlement response...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(9, "completed");

    // Step 11: Re-evaluate (Outcome evaluation)
    setCurrentStepIdx(10);
    updateStepState(10, "processing");
    addLog("AI", `Re-evaluating outcome against recovery target...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(10, "completed");

    // Step 12: Recover / Stop (Authoritative backend state check!)
    setCurrentStepIdx(11);
    const isVerifiedRecovered = execRes?.status === "RECOVERED" && (execRes?.verificationResult === "VERIFIED_SUCCESS" || (execRes?.amountRecovered || 0) > 0);
    if (isVerifiedRecovered) {
      updateStepState(11, "completed");
      const finalAmount = execRes?.amountRecovered || execRes?.amount || c?.amount || activeScenario.amountVal;
      addLog("SYSTEM", `✓ RECOVERY COMPLETE: ₹${finalAmount.toLocaleString("en-IN")} deposited.`);
    } else {
      updateStepState(11, "failed");
      addLog("SYSTEM", `🔴 RECOVERY UNVERIFIED / FAILED: Status = ${execRes?.status || "FAILED"}`);
    }
    setIsRunning(false);
    setIsCompleted(true);
  };

  const handleHumanApproveAndExecute = async () => {
    if (!activeScenario || isRunning) return;
    setIsRunning(true);

    addLog("HUMAN", `✓ Merchant approved Case ${activeScenario.caseId}. Invoking backend approve & execute pipeline...`);
    const approved = await approveCase(activeScenario.caseId);
    if (approved) setCurrentCase(approved);

    // Step 7: Schedule
    setCurrentStepIdx(6);
    updateStepState(6, "processing");
    addLog("ACTION", `Retry scheduled following human approval...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(6, "completed");

    // Step 8: Fresh Re-check
    setCurrentStepIdx(7);
    updateStepState(7, "processing");
    addLog("ACTION", `Performing fresh pre-execution re-check...`);
    const rechecked = await recheckCase(activeScenario.caseId);
    if (rechecked) setCurrentCase(rechecked);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(7, "completed");

    // Step 9: Execute
    setCurrentStepIdx(8);
    updateStepState(8, "processing");
    addLog("ACTION", `Executing authorized payment recovery attempt on gateway...`);
    const execRes = await executeCaseAction(activeScenario.caseId);
    if (execRes) setCurrentCase(execRes);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(8, "completed");

    // Step 10: Verify
    setCurrentStepIdx(9);
    updateStepState(9, "processing");
    addLog("SYSTEM", `Verifying gateway settlement confirmation...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(9, "completed");

    // Step 11: Re-evaluate
    setCurrentStepIdx(10);
    updateStepState(10, "processing");
    addLog("AI", `Re-evaluating recovery outcome...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(10, "completed");

    // Step 12: Recover
    setCurrentStepIdx(11);
    const isApprovedVerifiedRecovered = execRes?.status === "RECOVERED" && (execRes?.verificationResult === "VERIFIED_SUCCESS" || (execRes?.amountRecovered || 0) > 0);
    if (isApprovedVerifiedRecovered) {
      updateStepState(11, "completed");
      const finalAmt = execRes?.amountRecovered || execRes?.amount || currentCase?.amount || activeScenario.amountVal;
      addLog("SYSTEM", `✓ RECOVERY COMPLETE: ₹${finalAmt.toLocaleString("en-IN")} deposited.`);
    } else {
      updateStepState(11, "failed");
      addLog("SYSTEM", `🔴 RECOVERY UNVERIFIED / FAILED: Status = ${execRes?.status || "FAILED"}`);
    }
    setIsRunning(false);
    setIsCompleted(true);
  };

  if (!activeScenario) {
    return (
      <div className="space-y-6">
        {backendError && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>🔴 {backendError}</span>
            </div>
            <button
              onClick={() => setBackendError(null)}
              className="text-[11px] font-extrabold text-rose-700 hover:text-rose-950 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center font-mono text-xs font-bold text-slate-500 animate-pulse">
          Loading recovery agent scenarios from database...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backendError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>🔴 {backendError}</span>
          </div>
          <button
            onClick={() => setBackendError(null)}
            className="text-[11px] font-extrabold text-rose-700 hover:text-rose-950 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Scenario Selector */}
      <ScenarioSelector
        activeScenarioId={activeScenario.id}
        onSelectScenario={loadScenarioCase}
        disabled={isRunning}
        scenarios={dynamicScenarios}
      />

      {/* 2. Simulator Controls & Transaction Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl font-mono font-black text-xs shrink-0 shadow-2xs">
            {activeScenario.caseId}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{activeScenario.title}</h3>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80 text-xs">
                {activeScenario.amount}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeScenario.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadScenarioCase(activeScenario)}
            disabled={isRunning}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer tracking-wide"
          >
            <Play className="h-4 w-4 fill-white" />
            {isRunning ? "Running Agent Pipeline..." : "Run Recovery"}
          </button>
        </div>
      </div>

      {/* 3. 13-Stage Workflow Visualization */}
      <AgentWorkflow steps={workflowSteps} currentStepIndex={currentStepIdx} />

      {/* 4. Ambiguous Safety Callout Alert if BLOCKED case */}
      {(activeScenario.badge === "BLOCK" || activeScenario.caseId === "CASE-1003") && (
        <SafetyAlert amount={activeScenario.amount} caseId={activeScenario.caseId} />
      )}

      {/* 5. Split Section: AI Decision + Policy Decision + Live Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIDecisionCard recommendation={currentCase?.aiRecommendation} isLoading={isRunning && currentStepIdx < 3} />
        <PolicyDecisionCard decision={currentCase?.policyDecision} isLoading={isRunning && currentStepIdx >= 3 && currentStepIdx < 6} />
        <AgentEventLog logs={logs} />
      </div>

      {/* 6. Outcome Result Card */}
      {isCompleted && currentCase && (
        <RecoveryResultCard
          caseData={currentCase}
          onApproveAndExecute={handleHumanApproveAndExecute}
          onRunAgain={() => {
            if (dynamicScenarios.length > 0) {
              const idx = dynamicScenarios.findIndex(s => s.id === activeScenario.id || s.caseId === activeScenario.caseId);
              const nextSc = dynamicScenarios[(idx + 1) % dynamicScenarios.length];
              if (nextSc) loadScenarioCase(nextSc);
            }
          }}
        />
      )}
    </div>
  );
}
