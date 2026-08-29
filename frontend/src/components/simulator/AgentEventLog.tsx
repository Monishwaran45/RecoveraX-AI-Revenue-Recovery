"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";

export interface LogEntry {
  id: string;
  time: string;
  category: "SYSTEM" | "AI" | "POLICY" | "ACTION" | "HUMAN";
  text: string;
}

interface AgentEventLogProps {
  logs: LogEntry[];
}

export default function AgentEventLog({ logs }: AgentEventLogProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const filteredLogs = logs.filter(
    (log) => filterCategory === "ALL" || log.category === filterCategory
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between min-h-[320px] font-mono text-xs">
      <div className="space-y-2.5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-gray-700" />
            <span className="font-semibold text-gray-900 text-xs font-sans">
              Execution Event Ledger
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>Live Feed</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 font-sans text-[10px]">
          {["ALL", "AI", "POLICY", "ACTION", "HUMAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                filterCategory === cat
                  ? "bg-gray-900 text-white font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "AI" ? "DIAG" : cat}
            </button>
          ))}
        </div>

        {/* Log Entries Container */}
        <div className="flex-1 overflow-y-auto space-y-1 max-h-[200px] pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-400 py-8 text-center text-xs font-sans">
              Waiting for simulation execution...
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-1.5 text-[11px] leading-relaxed p-1 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-400 shrink-0 font-mono text-[10px] pt-0.5 tabular-nums">
                  {log.time}
                </span>
                <span
                  className={`font-semibold px-1 py-0.2 text-[9px] rounded shrink-0 uppercase tracking-wider font-mono ${
                    log.category === "AI"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : log.category === "POLICY"
                      ? "bg-purple-50 text-purple-800 border border-purple-200"
                      : log.category === "HUMAN"
                      ? "bg-amber-50 text-amber-900 border border-amber-200"
                      : log.category === "ACTION"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {log.category === "AI" ? "DIAG" : log.category}
                </span>
                <span className="text-gray-700 font-sans font-normal text-xs break-words">
                  {log.text.replace(/LangGraph/g, "Recovery Engine").replace(/LLM Diagnosed/g, "Diagnosed")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
