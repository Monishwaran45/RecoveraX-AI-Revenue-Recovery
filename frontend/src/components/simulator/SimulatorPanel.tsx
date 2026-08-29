"use client";

import { useState, useEffect } from "react";
import ScenarioSelector, { SCENARIOS, Scenario, mapCaseToScenario } from "./ScenarioSelector";
import AgentWorkflow, { WorkflowStep } from "./AgentWorkflow";
import AIDecisionCard from "./AIDecisionCard";
import PolicyDecisionCard from "./PolicyDecisionCard";
import SafetyAlert from "./SafetyAlert";
import AgentEventLog, { LogEntry } from "./AgentEventLog";
import RecoveryResultCard from "./RecoveryResultCard";
import { getCase, getCases, analyzeCase, recheckCase, executeCaseAction, resetCase } from "@/lib/api/cases";
import { approveCase } from "@/lib/api/approvals";
import { RecoveryCase, PolicyDecisionType } from "@/lib/types";
import { store } from "@/lib/store";
import { Play, RotateCcw } from "lucide-react";

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "s1", label: "load_context", sublabel: "Context Ingestion", state: "waiting" },
  { id: "s2", label: "diagnose", sublabel: "Groq LLM Engine", state: "waiting" },
  { id: "s3", label: "calculate_score", sublabel: "Recovery Scorer", state: "waiting" },
  { id: "s4", label: "recommend_action", sublabel: "Strategy Engine", state: "waiting" },
  { id: "s5", label: "policy_check", sublabel: "Policy Guardrails", state: "waiting" },
  { id: "s6", label: "human_approval", sublabel: "HITL Approval Gate", state: "waiting" },
  { id: "s7", label: "schedule", sublabel: "Celery Dispatch", state: "waiting" },
  { id: "s8", label: "recheck", sublabel: "Gateway Pre-Check", state: "waiting" },
  { id: "s9", label: "execute", sublabel: "Gateway Dispatch", state: "waiting" },
  { id: "s10", label: "verify", sublabel: "Bank Verification", state: "waiting" },
  { id: "s11", label: "reevaluate", sublabel: "Loop Controller", state: "waiting" },
  { id: "s12", label: "stop", sublabel: "Audit & Terminal", state: "waiting" },
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
      const cData = await resetCase(sc.caseId);
      if (cData) {
        setCurrentCase(cData);
      }
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const scoreVal = cData?.score ?? cData?.recoveryScore ?? 80;
      setLogs([
        { id: "l1", time: now, category: "SYSTEM", text: `Loaded transaction ${sc.caseId} (${sc.title}) — ₹${sc.amountVal.toLocaleString("en-IN")}` },
        { id: "l2", time: now, category: "SYSTEM", text: `Ready for recovery evaluation. Click 'Run Recovery' to start.` },
      ]);
    } catch (err: any) {
      setBackendError(`Failed to fetch transaction ${sc.caseId}: ${err.message || 'Backend unreachable'}`);
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
        setBackendError(`Backend server offline. Please verify FastAPI service.`);
      }
    };
    initSimulator();
  }, []);

  const addLog = (category: "SYSTEM" | "AI" | "POLICY" | "ACTION" | "HUMAN", text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { id: `log-${Date.now()}-${Math.random()}`, time, category, text }]);
    if (activeScenario?.caseId) {
      store.addAuditLog(activeScenario.caseId, text, `Simulator step executed for case ${activeScenario.caseId}`, category);
    }
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

    // Step 1: Ingestion
    setCurrentStepIdx(0);
    updateStepState(0, "processing");
    addLog("SYSTEM", `Decline incident ingested for ${activeScenario.caseId}`);
    await new Promise((r) => setTimeout(r, 200));

    // Invoke backend recovery engine
    let analyzedCase: RecoveryCase;
    try {
      analyzedCase = await analyzeCase(activeScenario.caseId);
      setCurrentCase(analyzedCase);
      updateStepState(0, "completed");
    } catch (err: any) {
      const msg = err.message || "Failed to communicate with backend engine.";
      addLog("SYSTEM", `DISPATCH ERROR: ${msg}`);
      updateStepState(0, "failed");
      setBackendError(`Execution failed: ${msg}.`);
      setIsRunning(false);
      setIsCompleted(false);
      return;
    }

    const c = analyzedCase;
    const diag = c?.aiRecommendation?.diagnosis || "TEMPORARY_FAILURE";
    const score = c?.score ?? c?.recoveryScore ?? 80;
    const recAction = c?.aiRecommendation?.badgeText || c?.recommendedAction || "RETRY";
    const rawPol = String(c?.policyDecision?.type || c?.policyDecision || "").toUpperCase();
    const polDecision: PolicyDecisionType = rawPol.includes("BLOCK") ? "BLOCK" : (rawPol.includes("AUTO") ? "AUTO" : "HUMAN");
    const isHumanRequired = polDecision === "HUMAN" || c?.status === "HUMAN_APPROVAL" || c?.approvalStatus === "PENDING";
    const isBlocked = polDecision === "BLOCK" || c?.status === "BLOCKED";

    // Step 2: Diagnostics
    setCurrentStepIdx(1);
    updateStepState(1, "processing");
    addLog("AI", `Classified failure pattern: ${diag.replace(/_/g, " ")}`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(1, "completed");

    // Step 3: Scoring
    setCurrentStepIdx(2);
    updateStepState(2, "processing");
    addLog("AI", `Calculated recovery index: ${score}/100`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(2, "completed");

    // Step 4: Strategy
    setCurrentStepIdx(3);
    updateStepState(3, "processing");
    addLog("AI", `Determined recovery strategy: ${recAction}`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(3, "completed");

    // Step 5: Policy Check
    setCurrentStepIdx(4);
    updateStepState(4, "processing");
    addLog("POLICY", `Validated merchant rules: ${c?.policyDecision?.explanation || "Passed safety policy guardrails."}`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(4, "completed");

    // Step 6: Routing
    setCurrentStepIdx(5);
    updateStepState(5, "processing");
    addLog("POLICY", `Routing authorization: ${c?.policyDecision?.decisionLabel || polDecision}`);
    await new Promise((r) => setTimeout(r, 200));

    if (isBlocked) {
      updateStepState(5, "blocked");
      for (let i = 6; i <= 11; i++) updateStepState(i, "blocked");
      addLog("POLICY", `POLICY BLOCKED: ${c?.policyDecision?.reason || "Execution stopped to prevent duplicate debit."}`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    if (isHumanRequired) {
      updateStepState(5, "completed");
      for (let i = 6; i <= 11; i++) updateStepState(i, "waiting");
      addLog("HUMAN", `APPROVAL REQUIRED: ${c?.policyDecision?.reason || "High value transaction requires sign-off."}`);
      addLog("ACTION", `Dispatched to manual review queue for sign-off.`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    updateStepState(5, "completed");

    // Step 7: Schedule
    setCurrentStepIdx(6);
    updateStepState(6, "processing");
    addLog("ACTION", `Retry scheduled with ${c?.scheduledDelayMinutes || 30} min delay timer`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(6, "completed");

    // Step 8: Pre-Check
    setCurrentStepIdx(7);
    updateStepState(7, "processing");
    addLog("ACTION", `Executing pre-retry bank settlement verification...`);
    const rechecked = await recheckCase(activeScenario.caseId);
    if (rechecked) setCurrentCase(rechecked);
    await new Promise((r) => setTimeout(r, 200));

    if (rechecked?.status === "BLOCKED" || rechecked?.status === "RECOVERED") {
      addLog("POLICY", `Pre-check returned state: ${rechecked.status}. Execution halted.`);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    addLog("ACTION", `Pre-retry check confirmed safe. Dispatching retry.`);
    updateStepState(7, "completed");

    // Step 9: Dispatch
    setCurrentStepIdx(8);
    updateStepState(8, "processing");
    addLog("ACTION", `Dispatching payment retry payload to payment gateway...`);
    const execRes = await executeCaseAction(activeScenario.caseId);
    if (execRes) setCurrentCase(execRes);
    await new Promise((r) => setTimeout(r, 280));
    updateStepState(8, "completed");

    // Step 10: Settlement
    setCurrentStepIdx(9);
    updateStepState(9, "processing");
    addLog("SYSTEM", `Verifying gateway settlement confirmation...`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(9, "completed");

    // Step 11: Reconcile
    setCurrentStepIdx(10);
    updateStepState(10, "processing");
    addLog("AI", `Reconciling transaction ledger...`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(10, "completed");

    // Step 12: Settled
    setCurrentStepIdx(11);
    const isVerifiedRecovered = execRes?.status === "RECOVERED" && (execRes?.verificationResult === "VERIFIED_SUCCESS" || (execRes?.amountRecovered || 0) > 0);
    if (isVerifiedRecovered) {
      updateStepState(11, "completed");
      const finalAmount = execRes?.amountRecovered || execRes?.amount || c?.amount || activeScenario.amountVal;
      addLog("SYSTEM", `SETTLEMENT COMPLETE: ₹${finalAmount.toLocaleString("en-IN")} deposited.`);
    } else {
      updateStepState(11, "failed");
      addLog("SYSTEM", `RECOVERY UNVERIFIED: Status = ${execRes?.status || "FAILED"}`);
    }
    setIsRunning(false);
    setIsCompleted(true);
  };

  const handleHumanApproveAndExecute = async () => {
    if (!activeScenario || isRunning) return;
    setIsRunning(true);

    addLog("HUMAN", `Operator authorized ${activeScenario.caseId}. Executing recovery dispatch...`);
    const approved = await approveCase(activeScenario.caseId);
    if (approved) setCurrentCase(approved);

    // Step 7: Schedule
    setCurrentStepIdx(6);
    updateStepState(6, "processing");
    addLog("ACTION", `Retry scheduled following authorization...`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(6, "completed");

    // Step 8: Pre-Check
    setCurrentStepIdx(7);
    updateStepState(7, "processing");
    addLog("ACTION", `Executing pre-retry verification...`);
    const rechecked = await recheckCase(activeScenario.caseId);
    if (rechecked) setCurrentCase(rechecked);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(7, "completed");

    // Step 9: Dispatch
    setCurrentStepIdx(8);
    updateStepState(8, "processing");
    addLog("ACTION", `Dispatching authorized retry to gateway...`);
    const execRes = await executeCaseAction(activeScenario.caseId);
    if (execRes) setCurrentCase(execRes);
    await new Promise((r) => setTimeout(r, 280));
    updateStepState(8, "completed");

    // Step 10: Settlement
    setCurrentStepIdx(9);
    updateStepState(9, "processing");
    addLog("SYSTEM", `Verifying gateway settlement...`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(9, "completed");

    // Step 11: Reconcile
    setCurrentStepIdx(10);
    updateStepState(10, "processing");
    addLog("AI", `Reconciling transaction ledger...`);
    await new Promise((r) => setTimeout(r, 200));
    updateStepState(10, "completed");

    // Step 12: Settled
    setCurrentStepIdx(11);
    const isApprovedVerifiedRecovered = execRes?.status === "RECOVERED" && (execRes?.verificationResult === "VERIFIED_SUCCESS" || (execRes?.amountRecovered || 0) > 0);
    if (isApprovedVerifiedRecovered) {
      updateStepState(11, "completed");
      const finalAmt = execRes?.amountRecovered || execRes?.amount || currentCase?.amount || activeScenario.amountVal;
      addLog("SYSTEM", `SETTLEMENT COMPLETE: ₹${finalAmt.toLocaleString("en-IN")} deposited.`);
    } else {
      updateStepState(11, "failed");
      addLog("SYSTEM", `RECOVERY UNVERIFIED: Status = ${execRes?.status || "FAILED"}`);
    }
    setIsRunning(false);
    setIsCompleted(true);
  };

  if (!activeScenario) {
    return (
      <div className="space-y-3">
        {backendError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium flex items-center justify-between">
            <span>{backendError}</span>
            <button
              onClick={() => setBackendError(null)}
              className="text-xs font-semibold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="p-8 bg-white border border-gray-200 rounded-lg text-center font-mono text-xs text-gray-500">
          Loading sample payment transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {backendError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium flex items-center justify-between">
          <span>{backendError}</span>
          <button
            onClick={() => setBackendError(null)}
            className="text-xs font-semibold underline ml-4 cursor-pointer"
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

      {/* 2. Controls & Active Incident Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 sm:p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="px-2 py-1 bg-gray-100 text-gray-900 border border-gray-200 rounded font-mono font-semibold text-xs shrink-0">
            {activeScenario.caseId}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{activeScenario.title}</h3>
              <span className="font-mono font-semibold text-gray-900 bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200 text-xs tabular-nums">
                {activeScenario.amount}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-normal mt-0.5">
              {activeScenario.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => loadScenarioCase(activeScenario)}
            disabled={isRunning}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded border border-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3 w-3 fill-white" />
            {isRunning ? "Running Recovery..." : "Run Recovery"}
          </button>
        </div>
      </div>

      {/* 3. 12-Stage Recovery Workflow Visualizer */}
      <AgentWorkflow steps={workflowSteps} currentStepIndex={currentStepIdx} />

      {/* 4. Policy Guardrail Callout if Blocked */}
      {(isCompleted || currentStepIdx >= 4) && (activeScenario.badge === "BLOCK" || activeScenario.caseId === "CASE-1003") && (
        <SafetyAlert amount={activeScenario.amount} caseId={activeScenario.caseId} />
      )}

      {/* 5. Telemetry & Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AIDecisionCard
          recommendation={(currentStepIdx >= 1 || isCompleted) ? currentCase?.aiRecommendation : undefined}
          isLoading={isRunning && currentStepIdx < 1}
        />
        <PolicyDecisionCard
          decision={(currentStepIdx >= 4 || isCompleted) ? currentCase?.policyDecision : undefined}
          isLoading={isRunning && currentStepIdx >= 1 && currentStepIdx < 4}
        />
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
