"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/components/ui/MetricCard";
import RecoveryFunnel from "@/components/dashboard/RecoveryFunnel";
import DecisionDonutChart from "@/components/dashboard/DecisionDonutChart";
import RecoveryTrendChart from "@/components/dashboard/RecoveryTrendChart";
import { RiskBadge, StatusBadge, PolicyBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getCases } from "@/lib/api/cases";
import { store } from "@/lib/store";
import { DashboardMetrics, RecoveryCase } from "@/lib/types";
import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Layers
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<RecoveryCase[]>([]);

  const loadData = async () => {
    const m = await getDashboardMetrics();
    const c = await getCases();
    setMetrics(m);
    setCases(c.slice(0, 7));
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold font-mono">
        Loading live database metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Revenue Recovery</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Recovery Engine Active
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Recover more revenue. Take fewer risks.
          </p>
        </div>

        {/* Safety Architecture Summary */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-xs">
          <Layers className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Safety Philosophy</span>
            <span className="font-semibold text-slate-800">
              AI Recommends → Policy Authorizes → Human Controls Risk
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards (4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue at Risk"
          value={`₹${(metrics.revenueAtRisk / 100000).toFixed(1)}L`}
          description="Failed payments & risk events in DB"
          icon={DollarSign}
          trend={`${metrics.totalCases} Cases`}
          trendUp={true}
          iconBgColor="bg-slate-100"
          iconTextColor="text-slate-700"
        />
        <MetricCard
          title="Recoverable Revenue"
          value={`₹${(metrics.recoverableRevenue / 100000).toFixed(1)}L`}
          description="Qualified AI score (>= 70)"
          icon={TrendingUp}
          trend={`${metrics.recoveryRate || 0}% Score`}
          trendUp={true}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
        />
        <MetricCard
          title="Gross Recovered"
          value={`₹${(metrics.grossRecovered / 100000).toFixed(1)}L`}
          description="Successfully retried & deposited"
          icon={CheckCircle2}
          trend="Live Gateway"
          trendUp={true}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          valueColor="text-emerald-900"
          subtextClass="text-emerald-700"
        />
        <MetricCard
          title="Incremental Recovered"
          value={`₹${(metrics.incrementalRecovered / 100000).toFixed(1)}L`}
          description="Saved from permanent churn"
          icon={ShieldCheck}
          trend="100% Verified"
          trendUp={true}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          valueColor="text-blue-900"
        />
      </div>

      {/* Recovery Funnel Pipeline */}
      <RecoveryFunnel metrics={metrics} />

      {/* Split section: 7-Day Recovery Trend Chart & Decision Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecoveryTrendChart trendData={metrics.recoveryTrend} />
        </div>
        <div className="lg:col-span-1">
          <DecisionDonutChart data={metrics.decisionDistribution} />
        </div>
      </div>

      {/* Recent Recovery Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Recent Recovery Cases</h3>
            <p className="text-xs text-slate-500">Live operational stream of revenue-risk events from database</p>
          </div>
          <button
            onClick={() => router.push("/cases")}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
          >
            View All Cases ({metrics.totalCases})
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Risk</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
                <th className="py-3.5 px-4">Policy</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {cases.map((c) => {
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
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{c.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                          {initials}
                        </span>
                        <span>{c.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono tabular-nums">
                      ₹{c.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <RecoveryScoreBadge score={c.score} />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge risk={c.risk} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium">
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
      </div>
    </div>
  );
}
