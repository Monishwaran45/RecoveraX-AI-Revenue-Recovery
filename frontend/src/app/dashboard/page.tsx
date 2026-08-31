"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/components/ui/MetricCard";
import RecoveryFunnel from "@/components/dashboard/RecoveryFunnel";
import DecisionDonutChart from "@/components/dashboard/DecisionDonutChart";
import RecoveryTrendChart from "@/components/dashboard/RecoveryTrendChart";
import SimulatorPanel from "@/components/simulator/SimulatorPanel";
import { RiskBadge, StatusBadge, PolicyBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import { getDashboardMetrics } from "@/lib/api/dashboard";
import { getCases } from "@/lib/api/cases";
import { store } from "@/lib/store";
import { DashboardMetrics, RecoveryCase } from "@/lib/types";
import {
  ShieldAlert,
  TrendingUp,
  CreditCard,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Play,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<RecoveryCase[]>([]);

  const loadData = async () => {
    try {
      const m = await getDashboardMetrics();
      const c = await getCases();
      setMetrics(m);
      setCases(c.slice(0, 7));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, []);

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-400 space-y-2">
        <div className="h-6 w-6 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-gray-500">Loading portfolio metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Recovery Simulator Sandbox ── */}
      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gray-900 text-white rounded shrink-0">
              <Play className="h-3.5 w-3.5 fill-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-semibold text-gray-900">
                Recovery Agent Simulator
              </h1>
              <p className="text-[11px] text-gray-500 font-normal">
                Test failure diagnostics, policy routing, and multi-step recovery workflows
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/simulator")}
            className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Full Simulator</span>
            <ArrowUpRight className="h-3 w-3 text-gray-400" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <SimulatorPanel isCompact={false} />
        </div>
      </section>

      {/* ── 2. Metric Cards ── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Portfolio Health
          </h2>
          <span className="text-[11px] text-gray-400 font-mono">Live Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="Revenue at Risk"
            value={`₹${(metrics.revenueAtRisk / 100000).toFixed(1)}L`}
            description="Total failed payment volume"
            icon={DollarSign}
            trend={`${metrics.totalCases} Incidents`}
            trendUp={true}
            iconBgColor="bg-gray-50 border-gray-200"
            iconTextColor="text-gray-700"
          />
          <MetricCard
            title="Gross Recovered"
            value={`₹${(metrics.grossRecovered / 100000).toFixed(1)}L`}
            description="Verified bank settlements"
            icon={CheckCircle2}
            trend={`+₹${(metrics.grossRecovered / 100000).toFixed(1)}L`}
            trendUp={true}
            iconBgColor="bg-emerald-50 border-emerald-200"
            iconTextColor="text-emerald-700"
          />
          <MetricCard
            title="Recovery Rate"
            value={`${(metrics.recoveryRate || 0).toFixed(1)}%`}
            description="Successful resolution rate"
            icon={TrendingUp}
            trend={`${(metrics.recoveryRate || 0).toFixed(1)}%`}
            trendUp={true}
            iconBgColor="bg-blue-50 border-blue-200"
            iconTextColor="text-blue-700"
          />
          <MetricCard
            title="Safety Blocks"
            value={`${metrics.safetyActionsPrevented}`}
            description="Zero false duplicate debits"
            icon={CreditCard}
            trend={`${metrics.safetyActionsPrevented} Blocked`}
            trendUp={true}
            iconBgColor="bg-rose-50 border-rose-200"
            iconTextColor="text-rose-700"
          />
        </div>
      </section>

      {/* ── 3. Pipeline Conversion, Money Recovered Trend & Policy Breakdown ── */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecoveryTrendChart trendData={metrics.recoveryTrend} />
          </div>
          <div>
            <DecisionDonutChart data={metrics.decisionDistribution} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecoveryFunnel metrics={metrics} />
          </div>

          <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 bg-rose-600 text-white rounded">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs">
                    {metrics.safetyActionsPrevented} Duplicate Debits Prevented
                  </h3>
                  <span className="text-[10px] text-rose-800 font-medium">
                    Zero customer double-charge guarantee
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-2.5 rounded border border-rose-200/60 mt-2">
                Ambiguous payment states, timeouts, and unverified bank responses were safely blocked by deterministic guardrails.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between">
              <span className="text-[10px] font-mono font-medium text-rose-800">Policy Active</span>
              <button
                onClick={() => router.push("/cases?status=Blocked")}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Blocked</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Recent Payment Incidents Table ── */}
      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Recent Recovery Cases</h3>
            <p className="text-[11px] text-gray-500 font-normal">Latest payment failure incident feed</p>
          </div>
          <button
            onClick={() => router.push("/cases")}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All ({metrics.totalCases})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-4">Case ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Score</th>
                <th className="py-2.5 px-4">Risk Tier</th>
                <th className="py-2.5 px-4">Strategy</th>
                <th className="py-2.5 px-4">Policy</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
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
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600 hover:underline">
                      {c.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-gray-100 text-gray-700 font-semibold text-[9px] flex items-center justify-center border border-gray-200 shrink-0">
                          {initials}
                        </span>
                        <span className="truncate max-w-[140px]">{c.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 font-mono tabular-nums">
                      ₹{c.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <RecoveryScoreBadge score={c.score} />
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge risk={c.risk} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate font-normal">
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
      </section>
    </div>
  );
}
