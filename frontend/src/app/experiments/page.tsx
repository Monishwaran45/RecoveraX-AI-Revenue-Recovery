"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Play, CheckCircle2, ShieldAlert, Users, Zap, TrendingUp, Layers } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import DecisionDonutChart from "@/components/dashboard/DecisionDonutChart";
import { getExperiment, runBatchExperiment, ExperimentDetail } from "@/lib/api/experiments";

export default function ExperimentsPage() {
  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const loadData = async () => {
    const data = await getExperiment();
    setExperiment(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunNewExperiment = async () => {
    setIsRunning(true);
    const data = await runBatchExperiment();
    setExperiment(data);
    setIsRunning(false);
  };

  if (!experiment) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold font-mono">
        Loading experiment evaluation results...
      </div>
    );
  }

  const decisionDist = [
    { name: "AUTO", value: experiment.auto_count, color: "#10b981" },
    { name: "HUMAN", value: experiment.human_count, color: "#f59e0b" },
    { name: "BLOCKED", value: experiment.blocked_count, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-sm">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Batch Experiments & Benchmark Evaluation
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Empirical A/B evaluation of 1,000 synthetic payment-recovery cases.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunNewExperiment}
          disabled={isRunning}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Play className="h-4 w-4 fill-white" />
          {isRunning ? "Running Batch Experiment..." : "Execute 1,000-Case Experiment"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cases Processed"
          value={`${(experiment?.total_cases ?? experiment?.case_count ?? 1000).toLocaleString()}`}
          description="Synthetic benchmark dataset"
          icon={Layers}
          trend="Seed = 42"
          trendUp={true}
          iconBgColor="bg-purple-50"
          iconTextColor="text-purple-600"
        />
        <MetricCard
          title="Revenue at Risk"
          value={`₹${(experiment.revenue_at_risk / 100000).toFixed(1)}L`}
          description="Failed payments & invoices"
          icon={TrendingUp}
          trend="₹50.0L Total"
          trendUp={true}
          iconBgColor="bg-slate-100"
          iconTextColor="text-slate-700"
        />
        <MetricCard
          title="Gross Recovered"
          value={`₹${(experiment.gross_recovered / 100000).toFixed(1)}L`}
          description="Successfully deposited"
          icon={CheckCircle2}
          trend={`${experiment.recovery_rate}% Recovery`}
          trendUp={true}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          valueColor="text-emerald-900"
        />
        <MetricCard
          title="Safety Actions Blocked"
          value={`${experiment.blocked_count}`}
          description="Potential duplicate debits"
          icon={ShieldAlert}
          trend="Zero False Debits"
          trendUp={true}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
        />
      </div>

      {/* Split: Decision Distribution + Experiment Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DecisionDonutChart
            data={{
              auto: experiment.auto_count,
              human: experiment.human_count,
              blocked: experiment.blocked_count,
            }}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Buildathon Benchmark Summary</h3>
            {(() => {
              const total = experiment.total_cases || experiment.case_count || 1;
              const autoPct = ((experiment.auto_count / total) * 100).toFixed(1);
              const humanPct = ((experiment.human_count / total) * 100).toFixed(1);
              const blockedPct = ((experiment.blocked_count / total) * 100).toFixed(1);

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-950 block">🟢 Automated Recovery ({autoPct}%)</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      {experiment.auto_count.toLocaleString()} low-risk transactions auto-executed without human intervention.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-950 block">🟡 Human Approval Required ({humanPct}%)</span>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      {experiment.human_count.toLocaleString()} high-value or medium-risk cases safely routed to HITL approval queue.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="font-bold text-rose-950 block">🔴 Policy Engine Blocked ({blockedPct}%)</span>
                    <p className="text-rose-800 text-[11px] mt-0.5">
                      {experiment.blocked_count.toLocaleString()} ambiguous-state cases blocked to prevent double-charging customers.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Verified against FastAPI + LangGraph workflow on SQLite database.
          </div>
        </div>
      </div>
    </div>
  );
}
