"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Play, CheckCircle2, ShieldAlert, Layers, TrendingUp } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import DecisionDonutChart from "@/components/dashboard/DecisionDonutChart";
import { getExperiment, runBatchExperiment, ExperimentDetail } from "@/lib/api/experiments";

export default function ExperimentsPage() {
  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const loadData = async () => {
    try {
      const data = await getExperiment();
      setExperiment(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunNewExperiment = async () => {
    setIsRunning(true);
    try {
      const data = await runBatchExperiment();
      setExperiment(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-400 space-y-2">
        <div className="h-6 w-6 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-gray-500">
          Loading benchmark cohort...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 text-white rounded shrink-0">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Batch Experiments & Benchmark
              </h1>
              <span className="px-2 py-0.2 rounded text-[11px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {(experiment?.total_cases ?? experiment?.case_count ?? 1000).toLocaleString()} Cases Cohort
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Empirical simulation comparing naive retries against RecoveraX deterministic policy guardrails.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunNewExperiment}
          disabled={isRunning}
          className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          {isRunning ? "Executing Cohort..." : "Run 1,000-Case Evaluation"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Cases Processed"
          value={`${(experiment?.total_cases ?? experiment?.case_count ?? 1000).toLocaleString()}`}
          description="Synthesized transactions"
          icon={Layers}
          trend="Seed = 42"
          trendUp={true}
          iconBgColor="bg-gray-50 border-gray-200"
          iconTextColor="text-gray-700"
        />
        <MetricCard
          title="Revenue at Risk"
          value={`₹${(experiment.revenue_at_risk / 100000).toFixed(1)}L`}
          description="Failed payment volume"
          icon={TrendingUp}
          trend={`₹${(experiment.revenue_at_risk / 100000).toFixed(1)}L Total`}
          trendUp={true}
          iconBgColor="bg-gray-50 border-gray-200"
          iconTextColor="text-gray-700"
        />
        <MetricCard
          title="Gross Recovered"
          value={`₹${(experiment.gross_recovered / 100000).toFixed(1)}L`}
          description="Successfully deposited"
          icon={CheckCircle2}
          trend={`${experiment.recovery_rate}% Rate`}
          trendUp={true}
          iconBgColor="bg-emerald-50 border-emerald-200"
          iconTextColor="text-emerald-700"
        />
        <MetricCard
          title="Safety Blocks"
          value={`${experiment.blocked_count}`}
          description="Prevented duplicate debits"
          icon={ShieldAlert}
          trend="Zero Double Debits"
          trendUp={true}
          iconBgColor="bg-rose-50 border-rose-200"
          iconTextColor="text-rose-700"
        />
      </div>

      {/* Split: Decision Distribution + Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DecisionDonutChart
            data={{
              auto: experiment.auto_count,
              human: experiment.human_count,
              blocked: experiment.blocked_count,
            }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-3">Cohort Benchmark Breakdown</h3>
            {(() => {
              const total = experiment.total_cases || experiment.case_count || 1;
              const autoPct = ((experiment.auto_count / total) * 100).toFixed(1);
              const humanPct = ((experiment.human_count / total) * 100).toFixed(1);
              const blockedPct = ((experiment.blocked_count / total) * 100).toFixed(1);

              return (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-200">
                    <span className="font-semibold text-emerald-950 block">Automated Recovery ({autoPct}%)</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5 font-normal leading-relaxed">
                      {experiment.auto_count.toLocaleString()} low-risk transactions auto-executed and settled safely.
                    </p>
                  </div>

                  <div className="p-2.5 bg-amber-50/50 rounded border border-amber-200">
                    <span className="font-semibold text-amber-950 block">Operator Review ({humanPct}%)</span>
                    <p className="text-amber-800 text-[11px] mt-0.5 font-normal leading-relaxed">
                      {experiment.human_count.toLocaleString()} high-value cases routed to review queue for authorization.
                    </p>
                  </div>

                  <div className="p-2.5 bg-rose-50/50 rounded border border-rose-200">
                    <span className="font-semibold text-rose-950 block">Policy Blocked ({blockedPct}%)</span>
                    <p className="text-rose-800 text-[11px] mt-0.5 font-normal leading-relaxed">
                      {experiment.blocked_count.toLocaleString()} ambiguous-state cases blocked to prevent customer double-charge.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
            Deterministic Decision Engine · FastAPI Backend
          </div>
        </div>
      </div>
    </div>
  );
}
