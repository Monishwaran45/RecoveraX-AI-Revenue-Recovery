"use client";

import SimulatorPanel from "@/components/simulator/SimulatorPanel";
import { Play } from "lucide-react";

export default function SimulatorPage() {
  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 text-white rounded shrink-0">
            <Play className="h-4 w-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Recovery Agent Simulator
              </h1>
              <span className="px-2 py-0.2 text-[10px] font-mono font-medium uppercase bg-gray-100 text-gray-700 rounded border border-gray-200">
                12-Stage Graph
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Simulate recovery workflows, trace diagnostic signals, and test deterministic guardrails.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Simulator Panel */}
      <SimulatorPanel />
    </div>
  );
}
