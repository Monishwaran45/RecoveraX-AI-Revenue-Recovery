"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCases } from "@/lib/api/cases";
import { store } from "@/lib/store";
import { RecoveryCase } from "@/lib/types";
import { RiskBadge, StatusBadge, PolicyBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import { Search, FolderKanban, RotateCcw, Building2, ArrowRight } from "lucide-react";

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
    const data = await getCases({
      search,
      status: statusFilter,
      risk: riskFilter,
      type: typeFilter,
    });
    setCasesList(data);
    setLoading(false);
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#106cf6] rounded-xl border border-blue-100">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-[#0b1426] tracking-tight">Recovery Cases</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#106cf6] border border-blue-200">
              {casesList.length} Total Cases
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-500 mt-1">
            Review revenue-risk events and AI recovery decisions.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Case ID, customer, error problem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#106cf6]"
            />
          </div>

          {/* Reset Filters button */}
          {(search || statusFilter !== "All" || riskFilter !== "All" || typeFilter !== "All") && (
            <button
              onClick={resetFilters}
              className="text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <span className="font-black text-slate-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Status Filter:
            </span>
            <div className="flex flex-wrap gap-1">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                    statusFilter.toLowerCase() === st.toLowerCase()
                      ? "bg-[#106cf6] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Filter */}
          <div>
            <span className="font-black text-slate-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Risk Tier:
            </span>
            <div className="flex flex-wrap gap-1">
              {risks.map((rk) => (
                <button
                  key={rk}
                  onClick={() => setRiskFilter(rk)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                    riskFilter.toLowerCase() === rk.toLowerCase()
                      ? "bg-[#0b1426] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {rk}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <span className="font-black text-slate-400 uppercase text-[10px] block mb-1.5 tracking-wider">
              Event Type:
            </span>
            <div className="flex flex-wrap gap-1">
              {types.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                    typeFilter === tp
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-black text-[#0b1426]">
            Showing {casesList.length} Merchant Cases
          </span>
          <span className="text-[11px] text-slate-400 font-bold">Click any row to inspect decision & audit timeline</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading recovery cases...</div>
        ) : casesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="font-black text-[#0b1426] text-base">No matching recovery cases found</p>
            <p className="text-xs text-slate-400 font-medium">Try adjusting your search query or filter pills.</p>
            <button
              onClick={resetFilters}
              className="mt-3 px-4 py-2 bg-blue-50 text-[#106cf6] text-xs font-extrabold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="py-3.5 px-4">Case ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Problem</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Risk</th>
                  <th className="py-3.5 px-4">AI Action</th>
                  <th className="py-3.5 px-4">Policy</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#106cf6] group-hover:underline">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0b1426]">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] flex items-center justify-center">
                            {initials}
                          </span>
                          <span>{c.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">{c.problem}</td>
                      <td className="py-3.5 px-4 font-black text-[#0b1426]">
                        ₹{c.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <RecoveryScoreBadge score={c.score} />
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge risk={c.risk} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 max-w-xs truncate">
                        {c.aiRecommendation.recommendation}
                      </td>
                      <td className="py-3.5 px-4">
                        <PolicyBadge type={c.policyDecision.type} />
                      </td>
                      <td className="py-3.5 px-4">
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
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading recovery cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
