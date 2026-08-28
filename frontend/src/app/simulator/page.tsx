"use client";

import SimulatorPanel from "@/components/simulator/SimulatorPanel";
import { Play } from "lucide-react";

export default function SimulatorPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <Play className="h-5 w-5 fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Recovery Agent Simulator
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Run a real recovery scenario and watch the AI agent make and execute the decision.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Simulator Panel */}
      <SimulatorPanel />
    </div>
  );
}
