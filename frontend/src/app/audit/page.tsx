"use client";

import { useEffect, useState } from "react";
import { Terminal, ShieldCheck, Search, Filter } from "lucide-react";
import { getCases } from "@/lib/api/cases";
import { RecoveryCase } from "@/lib/types";

export default function AuditPage() {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    const loadAudit = async () => {
      const data = await getCases({ limit: 100 } as any);
      setCases(data);
    };
    loadAudit();
  }, []);

  const allAuditLogs = cases.flatMap((c) =>
    (c.auditTimeline || []).map((log) => ({
      ...log,
      caseId: c.id,
      customerName: c.customerName,
      amount: c.amount,
      policy: c.policyDecision.type,
    }))
  );

  const filteredLogs = allAuditLogs.filter((log) => {
    const matchesSearch =
      !search ||
      log.caseId.toLowerCase().includes(search.toLowerCase()) ||
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
            <Terminal className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              System & Agent Audit Trail
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Immutable event trail of AI recommendations, policy checks, HITL sign-offs, and gateway actions.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {filteredLogs.length} Verified Events Logged
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Case ID, event, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "AI", "POLICY", "ACTION", "HUMAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Reason / Description</th>
                <th className="py-3.5 px-4">Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">{log.caseId}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                        log.category === "AI"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : log.category === "POLICY"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : log.category === "HUMAN"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.title}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-sans max-w-md truncate">
                    {log.description}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={
                        log.policy === "AUTO"
                          ? "text-emerald-600"
                          : log.policy === "BLOCK"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }
                    >
                      {log.policy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
