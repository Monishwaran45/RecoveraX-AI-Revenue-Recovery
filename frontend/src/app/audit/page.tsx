"use client";

import { useEffect, useState } from "react";
import { Terminal, Search } from "lucide-react";
import { getCases } from "@/lib/api/cases";
import { getAllAuditLogs, AuditRecord } from "@/lib/api/audit";
import { store } from "@/lib/store";
import { RecoveryCase } from "@/lib/types";

interface FormattedAuditItem {
  id: string;
  timestamp: string;
  caseId: string;
  category: "AI" | "POLICY" | "ACTION" | "HUMAN" | "SYSTEM";
  event: string;
  details: string;
  policy: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<FormattedAuditItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditData = async () => {
    try {
      const [cases, dbLogs] = await Promise.all([
        getCases({ limit: 100 } as any),
        getAllAuditLogs(200),
      ]);

      const formatted: FormattedAuditItem[] = [];

      // 1. Map database audit log records
      if (dbLogs && dbLogs.length > 0) {
        dbLogs.forEach((dbItem: AuditRecord) => {
          let cat: FormattedAuditItem["category"] = "ACTION";
          const evt = (dbItem.event_type || "").toUpperCase();
          if (evt.includes("DIAGNO") || evt.includes("SCORE")) cat = "AI";
          else if (evt.includes("POLICY") || evt.includes("RULE") || evt.includes("GUARD")) cat = "POLICY";
          else if (evt.includes("APPROV") || evt.includes("REJECT") || evt.includes("HUMAN")) cat = "HUMAN";
          else if (evt.includes("SYSTEM")) cat = "SYSTEM";

          const ts = dbItem.timestamp ? new Date(dbItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString();

          formatted.push({
            id: dbItem.id || `db-${Math.random()}`,
            timestamp: ts,
            caseId: dbItem.case_id || "SYSTEM",
            category: cat,
            event: dbItem.event_type || "AUDIT_EVENT",
            details: dbItem.reason || (dbItem.metadata_json ? JSON.stringify(dbItem.metadata_json) : "Audit log recorded"),
            policy: (dbItem.metadata_json?.policy || "AUTO").toUpperCase(),
          });
        });
      }

      // 2. Map case audit timelines
      cases.forEach((c: RecoveryCase) => {
        (c.auditTimeline || []).forEach((tItem, idx) => {
          formatted.push({
            id: `case-${c.id}-${idx}`,
            timestamp: tItem.timestamp,
            caseId: c.id,
            category: (tItem.category as any) || "ACTION",
            event: tItem.title,
            details: tItem.description,
            policy: c.policyDecision?.type || "AUTO",
          });
        });
      });

      // Deduplicate by caseId + event + timestamp
      const seen = new Set<string>();
      const uniqueLogs = formatted.filter((item) => {
        const key = `${item.caseId}-${item.event}-${item.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setLogs(uniqueLogs);
    } catch (e) {
      console.error("Audit log error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
    return store.subscribe(loadAuditData);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.caseId.toLowerCase().includes(search.toLowerCase()) ||
      log.event.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 text-white rounded shrink-0">
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Policy & Execution Audit Ledger
              </h1>
              <span className="px-2 py-0.2 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {filteredLogs.length} Events
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Sequenced audit record of all diagnostic decisions, rule checks, authorizations, and settlements.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case ID, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-400"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {["ALL", "AI", "POLICY", "ACTION", "HUMAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${categoryFilter === cat
                  ? "bg-gray-900 text-white font-semibold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {cat === "AI" ? "DIAGNOSTICS" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-gray-400 text-xs gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
            <span>Fetching live audit ledger from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Case ID</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 font-sans">Event</th>
                  <th className="py-2.5 px-4 font-sans">Details</th>
                  <th className="py-2.5 px-4">Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-sans text-xs">
                      No audit log records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={`${log.id}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-400 tabular-nums">{log.timestamp}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{log.caseId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-semibold rounded ${log.category === "AI"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : log.category === "POLICY"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : log.category === "HUMAN"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                          {log.category === "AI" ? "DIAG" : log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 font-sans">{log.event}</td>
                      <td className="py-3 px-4 text-gray-600 font-sans max-w-md truncate font-normal">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span
                          className={
                            log.policy === "AUTO"
                              ? "text-emerald-700"
                              : log.policy === "BLOCK"
                                ? "text-rose-700"
                                : "text-amber-700"
                          }
                        >
                          {log.policy || "AUTO"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
