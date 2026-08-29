"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCases } from "@/lib/api/cases";
import { store } from "@/lib/store";
import { RecoveryCase } from "@/lib/types";
import { RiskBadge, StatusBadge, PolicyBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import { Search, FolderKanban, RotateCcw } from "lucide-react";

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [riskFilter, setRiskFilter] = useState(searchParams.get("risk") || "All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [casesList, setCasesList] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await getCases({
        search,
        status: statusFilter,
        risk: riskFilter,
        type: typeFilter,
      });
      setCasesList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    return store.subscribe(fetchCases);
  }, [search, statusFilter, riskFilter, typeFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setRiskFilter("All");
    setTypeFilter("All");
  };

  const statuses = ["All", "Open", "Scheduled", "Human Approval", "Recovered", "Blocked"];
  const risks = ["All", "Low", "Medium", "High"];
  const types = ["All", "Failed Payment", "Subscription", "Checkout", "Invoice"];

  return (
    <div className="space-y-5 pb-10">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 text-white rounded shrink-0">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Payment Recovery Cases</h1>
              <span className="px-2 py-0.2 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {casesList.length} Total Cases
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Inspect payment failure events, diagnostic classifications, and policy routing records.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-400"
            />
          </div>

          {(search || statusFilter !== "All" || riskFilter !== "All" || typeFilter !== "All") && (
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div>
            <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Status:
            </span>
            <div className="flex flex-wrap gap-1">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    statusFilter.toLowerCase() === st.toLowerCase()
                      ? "bg-gray-900 text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Risk Tier:
            </span>
            <div className="flex flex-wrap gap-1">
              {risks.map((rk) => (
                <button
                  key={rk}
                  onClick={() => setRiskFilter(rk)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    riskFilter.toLowerCase() === rk.toLowerCase()
                      ? "bg-gray-900 text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {rk}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Event Type:
            </span>
            <div className="flex flex-wrap gap-1">
              {types.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    typeFilter === tp
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-subtle overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-xs font-semibold text-gray-900">
            {casesList.length} Recovery Incidents
          </span>
          <span className="text-xs text-gray-400 font-normal hidden sm:inline">
            Click row for incident details
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-xs font-mono">Loading cases...</div>
        ) : casesList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-1">
            <p className="font-semibold text-gray-900 text-xs">No matching recovery cases found</p>
            <p className="text-xs text-gray-400 font-normal">Adjust search query or filters.</p>
            <button
              onClick={resetFilters}
              className="mt-2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-4">Case ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Problem</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Score</th>
                  <th className="py-2.5 px-4">Risk</th>
                  <th className="py-2.5 px-4">Strategy</th>
                  <th className="py-2.5 px-4">Policy</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {casesList.map((c) => {
                  const initials = c.customerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600 hover:underline">
                        {c.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-[9px] flex items-center justify-center shrink-0">
                            {initials}
                          </span>
                          <span className="truncate max-w-[140px]">{c.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-normal max-w-xs truncate">{c.problem}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{c.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <RecoveryScoreBadge score={c.score} />
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge risk={c.risk} />
                      </td>
                      <td className="py-3 px-4 font-normal text-gray-700 max-w-xs truncate">
                        {c.aiRecommendation?.recommendation || "Retry"}
                      </td>
                      <td className="py-3 px-4">
                        <PolicyBadge type={c.policyDecision?.type} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-xs font-mono">Loading cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
