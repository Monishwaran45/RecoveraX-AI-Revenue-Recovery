"use client";

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
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[360px] font-mono text-xs">
      <div className="space-y-3.5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-white text-xs font-sans tracking-tight">Live Agent Activity Log</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 text-[10px] font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <span>Stream Connected</span>
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-12 text-center text-xs font-sans">
              Waiting for simulation initiation...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed group">
                <span className="text-slate-500 shrink-0 font-semibold text-[10px] font-mono pt-0.5">{log.time}</span>
                <span
                  className={`font-black px-2 py-0.5 text-[9px] rounded-md shrink-0 uppercase tracking-wider ${
                    log.category === "AI"
                      ? "bg-blue-950 text-blue-300 border border-blue-800"
                      : log.category === "POLICY"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : log.category === "HUMAN"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : log.category === "ACTION"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {log.category}
                </span>
                <span className="text-slate-200 font-sans font-medium text-[11px] pt-0.2 break-words">
                  {log.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
