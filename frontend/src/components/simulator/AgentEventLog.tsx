"use client";

import { Activity, Terminal } from "lucide-react";

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
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-white text-xs font-sans tracking-tight">Live Agent Activity Log</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
          Stream Connected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-6 text-center text-[11px]">
            Waiting for simulation initiation...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
              <span className="text-slate-500 shrink-0 font-semibold">{log.time}</span>
              <span
                className={`font-extrabold px-1.5 py-0.2 text-[9px] rounded shrink-0 ${
                  log.category === "AI"
                    ? "bg-blue-900/80 text-blue-300 border border-blue-700"
                    : log.category === "POLICY"
                    ? "bg-purple-900/80 text-purple-300 border border-purple-700"
                    : log.category === "HUMAN"
                    ? "bg-amber-900/80 text-amber-300 border border-amber-700"
                    : log.category === "ACTION"
                    ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {log.category}
              </span>
              <span className="text-slate-200">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
