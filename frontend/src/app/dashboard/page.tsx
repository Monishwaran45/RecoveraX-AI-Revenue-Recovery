"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/components/ui/MetricCard";
import RecoveryFunnel from "@/components/dashboard/RecoveryFunnel";
import DecisionDonutChart from "@/components/dashboard/DecisionDonutChart";
import SimulatorPanel from "@/components/simulator/SimulatorPanel";
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
  Zap,
  Play,
  Layers,
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
    <div className="space-y-8 pb-12">
      {/* 1. Product Headline & Value Proposition Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            RECOVERAX
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Recover revenue automatically. Keep financial risk under control.
          </p>
        </div>

        {/* Safety Pipeline Philosophy Callout */}
        <div className="bg-slate-900 text-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm border border-slate-800">
          <Layers className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="text-xs font-medium">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Pipeline of Control
            </span>
            <span className="font-bold text-white">
              AI Recommends → Policy Authorizes → Human Controls Risk
            </span>
          </div>
        </div>
      </div>

      {/* 2. Business Impact KPIs (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue at Risk"
          value={`₹${(metrics.revenueAtRisk / 100000).toFixed(1)}L`}
          description="Failed payments & risk events"
          icon={DollarSign}
          trend={`${metrics.totalCases} Cases`}
          trendUp={true}
          iconBgColor="bg-slate-100"
          iconTextColor="text-slate-700"
        />
        <MetricCard
          title="Revenue Recovered"
          value={`₹${(metrics.grossRecovered / 100000).toFixed(1)}L`}
          description="Successfully retried & deposited"
          icon={CheckCircle2}
          trend={`+₹${(metrics.grossRecovered / 100000).toFixed(1)}L Gross`}
          trendUp={true}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          valueColor="text-emerald-900"
          subtextClass="text-emerald-700"
        />
        <MetricCard
          title="Recovery Rate"
          value={`${(metrics.recoveryRate || 0).toFixed(1)}%`}
          description="Gross recovery rate"
          icon={TrendingUp}
          trend={`${(metrics.recoveryRate || 0).toFixed(1)}% Rate`}
          trendUp={true}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
          valueColor="text-blue-900"
        />
        <MetricCard
          title="Active Cases"
          value={`${metrics.totalCases}`}
          description="Monitored in DB"
          icon={ShieldCheck}
          trend={`${metrics.safetyActionsPrevented} Blocked`}
          trendUp={true}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
        />
      </div>

      {/* 3. RECOVERY SIMULATOR — PRIMARY FEATURE ON OVERVIEW */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Play className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Live Agent Recovery Simulator
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Run a real recovery scenario and watch the AI agent make and execute decisions.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/simulator")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            Open Full Simulator
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <SimulatorPanel isCompact={true} />
      </div>

      {/* 4. RECOVERY PIPELINE FUNNEL */}
      <RecoveryFunnel metrics={metrics} />

      {/* 5. AI DECISION DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DecisionDonutChart data={metrics.decisionDistribution} />
        </div>

        {/* Safety Guardrail Callout Card */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-rose-950 text-base">
                ⚠️ {metrics.safetyActionsPrevented} Unsafe Actions Prevented
              </h3>
            </div>
            <p className="text-xs text-rose-900 font-medium leading-relaxed bg-white/90 p-3.5 rounded-lg border border-rose-200">
              &ldquo;Ambiguous payment states, duplicate-charge risks, and policy limit violations were blocked by the Policy Engine or escalated to human approval.&rdquo;
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-200/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800">Zero False Executions</span>
            <button
              onClick={() => router.push("/cases?status=Blocked")}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              View Blocked Cases
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Recent Recovery Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Recovery Cases</h3>
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
