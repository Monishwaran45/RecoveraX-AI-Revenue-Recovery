import { Layers } from "lucide-react";
import { DashboardMetrics } from "@/lib/types";

interface RecoveryFunnelProps {
  metrics?: DashboardMetrics | null;
}

export default function RecoveryFunnel({ metrics }: RecoveryFunnelProps) {
  const atRisk = metrics?.revenueAtRisk ?? 0;
  const recoverable = metrics?.recoverableRevenue ?? 0;
  const gross = metrics?.grossRecovered ?? 0;
  const incremental = metrics?.incrementalRecovered ?? 0;

  const conv1 = "100%";
  const conv2 = atRisk > 0 ? `${((recoverable / atRisk) * 100).toFixed(1)}%` : "0%";
  const conv3 = atRisk > 0 ? `${((gross / atRisk) * 100).toFixed(1)}%` : "0%";
  const conv4 = atRisk > 0 ? `${((incremental / atRisk) * 100).toFixed(1)}%` : "0%";

  const formatLakhs = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const stages = [
    {
      step: "01",
      name: "Revenue at Risk",
      amount: formatLakhs(atRisk),
      conversion: conv1,
      subtext: "Failed payments & risk events",
      barWidth: "w-full",
      barColor: "bg-slate-300",
      textColor: "text-slate-900",
    },
    {
      step: "02",
      name: "Recoverable Revenue",
      amount: formatLakhs(recoverable),
      conversion: conv2,
      subtext: "Qualified AI recovery score (>= 70)",
      barWidth: `w-[${Math.min(100, Math.round((recoverable / (atRisk || 1)) * 100))}%]`,
      barColor: "bg-blue-600",
      textColor: "text-blue-700",
    },
    {
      step: "03",
      name: "Gross Recovered",
      amount: formatLakhs(gross),
      conversion: conv3,
      subtext: "Successfully retried & deposited",
      barWidth: `w-[${Math.min(100, Math.round((gross / (atRisk || 1)) * 100))}%]`,
      barColor: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      step: "04",
      name: "Incremental Net Saved",
      amount: formatLakhs(incremental),
      conversion: conv4,
      subtext: "Saved above baseline churn",
      barWidth: `w-[${Math.min(100, Math.round((incremental / (atRisk || 1)) * 100))}%]`,
      barColor: "bg-emerald-700",
      textColor: "text-emerald-800",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recovery Pipeline Funnel</h3>
            <p className="text-xs text-slate-500">Stage-by-stage conversion from gross risk to net recovered revenue</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
          {conv3} Overall Net Conversion
        </span>
      </div>

      {/* Pipeline Stage Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl relative flex flex-col justify-between"
          >
            {/* Step header */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-[11px] font-bold text-slate-400">STAGE {stage.step}</span>
                <span className={`font-mono font-bold text-xs ${stage.textColor}`}>{stage.conversion}</span>
              </div>

              {/* Progress bar visual */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${stage.barColor} ${stage.barWidth}`}></div>
              </div>

              <h4 className="text-xs font-semibold text-slate-600">{stage.name}</h4>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5 font-mono tabular-nums">{stage.amount}</p>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 font-medium border-t border-slate-200/60 pt-2">
              {stage.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
