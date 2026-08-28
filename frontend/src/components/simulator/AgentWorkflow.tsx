"use client";

import { CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight, Activity, Zap } from "lucide-react";

export type StepState = "waiting" | "processing" | "completed" | "failed" | "blocked";

export interface WorkflowStep {
  id: string;
  label: string;
  sublabel: string;
  state: StepState;
  nodeType?: "ai" | "policy" | "human" | "system" | "action";
}

interface AgentWorkflowProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
}

export default function AgentWorkflow({ steps, currentStepIndex }: AgentWorkflowProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">
              Live Agent Workflow Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              13-Stage Bounded AI Execution Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-600"></span> Waiting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span> Processing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span> Blocked
          </span>
        </div>
      </div>

      {/* Horizontal Step Flow */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-max gap-2 px-1 py-2">
          {steps.map((step, idx) => {
            const isCompleted = step.state === "completed";
            const isProcessing = step.state === "processing";
            const isBlocked = step.state === "blocked";
            const isFailed = step.state === "failed";

            return (
              <div key={step.id} className="flex items-center">
                {/* Step Box */}
                <div
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between w-36 h-24 ${
                    isCompleted
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : isProcessing
                      ? "bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30 text-blue-200 animate-pulse"
                      : isBlocked
                      ? "bg-rose-950/40 border-rose-500/60 text-rose-300"
                      : isFailed
                      ? "bg-rose-950/40 border-rose-500/60 text-rose-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      STEP {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>

                    {/* Status Icon */}
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    {isProcessing && <Activity className="h-4 w-4 text-blue-400 animate-spin shrink-0" />}
                    {isBlocked && <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />}
                    {isFailed && <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
                    {step.state === "waiting" && <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs leading-snug tracking-tight text-white truncate">
                      {step.label}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                      {step.sublabel}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < steps.length - 1 && (
                  <ArrowRight
                    className={`h-4 w-4 mx-1 shrink-0 ${
                      isCompleted ? "text-emerald-500" : isProcessing ? "text-blue-400" : "text-slate-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
