"use client";

import { useState, useEffect } from "react";
import ScenarioSelector, { SCENARIOS, Scenario } from "./ScenarioSelector";
import AgentWorkflow, { WorkflowStep } from "./AgentWorkflow";
import AIDecisionCard from "./AIDecisionCard";
import PolicyDecisionCard from "./PolicyDecisionCard";
import SafetyAlert from "./SafetyAlert";
import AgentEventLog, { LogEntry } from "./AgentEventLog";
import RecoveryResultCard from "./RecoveryResultCard";
import { getCase, analyzeCase, recheckCase, executeCaseAction } from "@/lib/api/cases";
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
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [currentCase, setCurrentCase] = useState<RecoveryCase | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const loadScenarioCase = async (sc: Scenario) => {
    setActiveScenario(sc);
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStepIdx(-1);
    setWorkflowSteps(INITIAL_WORKFLOW_STEPS.map((s) => ({ ...s, state: "waiting" })));

    const cData = await getCase(sc.caseId);
    if (cData) {
      setCurrentCase(cData);
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs([
      { id: "l1", time: now, category: "SYSTEM", text: `Loaded ${sc.title} (${sc.caseId}) amount ₹${sc.amountVal.toLocaleString("en-IN")}` },
      { id: "l2", time: now, category: "SYSTEM", text: `Current Status: ${sc.type} | Baseline score: ${sc.amountVal > 50000 ? 82 : (sc.id === 'sc-5' ? 10 : 87)}/100` },
    ]);
  };

  useEffect(() => {
    loadScenarioCase(SCENARIOS[0]);
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
    if (isRunning) return;
    setIsRunning(true);
    setIsCompleted(false);

    // Step 1: Detect
    setCurrentStepIdx(0);
    updateStepState(0, "processing");
    addLog("SYSTEM", `Risk Event Detected for transaction ${activeScenario.caseId}`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(0, "completed");

    // Step 2: Diagnose
    setCurrentStepIdx(1);
    updateStepState(1, "processing");
    addLog("AI", `Evaluating failure pattern: ${activeScenario.type}`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(1, "completed");

    // Step 3: Recovery Score
    setCurrentStepIdx(2);
    updateStepState(2, "processing");
    const scoreVal = activeScenario.amountVal > 50000 ? 82 : (activeScenario.id === "sc-5" ? 10 : 87);
    addLog("AI", `Recovery Confidence Score calculated: ${scoreVal}/100`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(2, "completed");

    // Step 4: Recommend
    setCurrentStepIdx(3);
    updateStepState(3, "processing");
    addLog("AI", `AI Strategy Recommended: ${activeScenario.badge === "BLOCK" ? "STOP/BLOCK" : "RETRY PAYMENT"}`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(3, "completed");

    // Step 5: Policy
    setCurrentStepIdx(4);
    updateStepState(4, "processing");
    addLog("POLICY", `Evaluating deterministic guardrails...`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(4, "completed");

    // Step 6: Authorization
    setCurrentStepIdx(5);
    updateStepState(5, "processing");
    addLog("POLICY", `Authorization result: ${activeScenario.badgeText}`);
    await new Promise((r) => setTimeout(r, 400));

    if (activeScenario.badge === "BLOCK") {
      updateStepState(5, "blocked");
      updateStepState(6, "blocked");
      updateStepState(7, "blocked");
      updateStepState(8, "blocked");
      updateStepState(9, "blocked");
      updateStepState(10, "blocked");
      updateStepState(11, "blocked");
      addLog("POLICY", `🔴 HARD BLOCK EXECUTED: Ambiguous debit risk. Payment retry prevented.`);
      setIsRunning(false);
      setIsCompleted(true);
      if (currentCase) {
        setCurrentCase({ ...currentCase, status: "BLOCKED" });
      }
      return;
    }

    updateStepState(5, "completed");

    // Step 7: Schedule
    setCurrentStepIdx(6);
    updateStepState(6, "processing");
    addLog("ACTION", `Retry cool-down delay scheduled (5 mins)`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(6, "completed");

    // Step 8: Fresh Re-check
    setCurrentStepIdx(7);
    updateStepState(7, "processing");
    addLog("ACTION", `Performing pre-execution fresh payment re-check...`);
    await new Promise((r) => setTimeout(r, 400));
    addLog("ACTION", `Fresh re-check confirmed payment still unpaid & safe for retry.`);
    updateStepState(7, "completed");

    // Step 9: Execute
    setCurrentStepIdx(8);
    updateStepState(8, "processing");
    addLog("ACTION", `Executing payment recovery attempt #1 on gateway...`);
    const execRes = await executeCaseAction(activeScenario.caseId);
    if (execRes) setCurrentCase(execRes);
    await new Promise((r) => setTimeout(r, 500));
    updateStepState(8, "completed");

    // Step 10: Verify
    setCurrentStepIdx(9);
    updateStepState(9, "processing");
    addLog("SYSTEM", `Verifying gateway settlement...`);
    await new Promise((r) => setTimeout(r, 400));
    updateStepState(9, "completed");

    // Step 11: Re-evaluate
    setCurrentStepIdx(10);
    updateStepState(10, "processing");
    addLog("AI", `Re-evaluating outcome...`);
    await new Promise((r) => setTimeout(r, 300));
    updateStepState(10, "completed");

    // Step 12: Recover / Stop
    setCurrentStepIdx(11);
    updateStepState(11, "completed");
    addLog("SYSTEM", `✓ RECOVERY COMPLETE: ₹${activeScenario.amountVal.toLocaleString("en-IN")} deposited.`);
    setIsRunning(false);
    setIsCompleted(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Scenario Selector */}
      <ScenarioSelector
        activeScenarioId={activeScenario.id}
        onSelectScenario={loadScenarioCase}
        disabled={isRunning}
      />

      {/* 2. Simulator Controls & Transaction Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl font-mono font-bold text-xs shrink-0">
            {activeScenario.caseId}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{activeScenario.title}</h3>
              <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
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
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-white" />
            {isRunning ? "Running Agent Pipeline..." : "▶ Run Recovery"}
          </button>
        </div>
      </div>

      {/* 3. 13-Stage Workflow Visualization */}
      <AgentWorkflow steps={workflowSteps} currentStepIndex={currentStepIdx} />

      {/* 4. Ambiguous Safety Callout Alert if Scenario 5 */}
      {activeScenario.id === "sc-5" && (
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
        <RecoveryResultCard caseData={currentCase} onRunAgain={() => loadScenarioCase(SCENARIOS[(SCENARIOS.findIndex(s => s.id === activeScenario.id) + 1) % SCENARIOS.length])} />
      )}
    </div>
  );
}
