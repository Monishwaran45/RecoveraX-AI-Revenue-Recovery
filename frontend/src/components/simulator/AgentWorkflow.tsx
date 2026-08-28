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
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-slate-100 shadow-md">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-2xs">
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm tracking-tight">
              LangGraph Agent Workflow Pipeline
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              12-Node Deterministic AI Execution Graph
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-700"></span> Waiting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span> Processing
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
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center min-w-max gap-2 px-1 py-1.5">
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
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : isProcessing
                      ? "bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30 text-blue-200 shadow-md"
                      : isBlocked
                      ? "bg-rose-950/40 border-rose-500/60 text-rose-300"
                      : isFailed
                      ? "bg-rose-950/40 border-rose-500/60 text-rose-300"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
                      NODE {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>

                    {/* Status Icon */}
                    {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    {isProcessing && <Activity className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />}
                    {isBlocked && <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                    {isFailed && <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                    {step.state === "waiting" && <Clock className="h-3 w-3 text-slate-600 shrink-0" />}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[11px] leading-tight tracking-tight text-white truncate">
                      {step.label}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                      {step.sublabel}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < steps.length - 1 && (
                  <ArrowRight
                    className={`h-3.5 w-3.5 mx-1 shrink-0 ${
                      isCompleted ? "text-emerald-500" : isProcessing ? "text-blue-400" : "text-slate-800"
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
