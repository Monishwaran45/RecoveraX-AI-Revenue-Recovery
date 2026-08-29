"use client";

import { CheckCircle2, Clock, ShieldAlert, AlertTriangle, ChevronRight, Activity, Layers } from "lucide-react";

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-700" />
          <div>
            <h3 className="font-semibold text-gray-900 text-xs tracking-tight font-mono">
              LangGraph Execution Graph
            </h3>
            <p className="text-[11px] text-gray-500 font-normal">
              12-Node Cyclic State Machine Pipeline
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span> Queued
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Verified
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span> Blocked
          </span>
        </div>
      </div>

      {/* Horizontal Linear Step Flow */}
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
        <div className="flex items-center min-w-max gap-1.5 py-0.5">
          {steps.map((step, idx) => {
            const isCompleted = step.state === "completed";
            const isProcessing = step.state === "processing";
            const isBlocked = step.state === "blocked";
            const isFailed = step.state === "failed";

            return (
              <div key={step.id} className="flex items-center">
                {/* Step Box */}
                <div
                  className={`p-2.5 rounded-md border transition-colors flex flex-col justify-between w-28 h-18 ${isCompleted
                      ? "bg-emerald-50/50 border-emerald-300 text-emerald-950"
                      : isProcessing
                        ? "bg-blue-50/70 border-blue-500 text-blue-950"
                        : isBlocked
                          ? "bg-rose-50/60 border-rose-300 text-rose-950"
                          : isFailed
                            ? "bg-rose-50/60 border-rose-300 text-rose-950"
                            : "bg-gray-50/70 border-gray-200 text-gray-400"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-gray-400">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>

                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />}
                    {isProcessing && <Activity className="h-3 w-3 text-blue-600 animate-spin shrink-0" />}
                    {isBlocked && <ShieldAlert className="h-3 w-3 text-rose-600 shrink-0" />}
                    {isFailed && <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />}
                    {step.state === "waiting" && <Clock className="h-3 w-3 text-gray-300 shrink-0" />}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[11px] leading-tight text-gray-900 truncate">
                      {step.label}
                    </h4>
                    <p className="text-[9px] text-gray-500 mt-0.5 truncate font-normal">
                      {step.sublabel}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < steps.length - 1 && (
                  <ChevronRight
                    className={`h-3 w-3 mx-0.5 shrink-0 ${isCompleted ? "text-emerald-500" : isProcessing ? "text-blue-500" : "text-gray-300"
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
