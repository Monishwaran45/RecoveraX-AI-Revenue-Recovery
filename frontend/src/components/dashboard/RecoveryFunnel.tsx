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
    { step: "01", name: "Revenue at Risk",       amount: formatLakhs(atRisk),        conversion: conv1, subtext: "Total failed payments & disputes",      barWidth: "100%",                                                                     barColor: "bg-gray-300",    textColor: "text-gray-600" },
    { step: "02", name: "Recoverable Revenue",   amount: formatLakhs(recoverable),   conversion: conv2, subtext: "Qualified score ≥ 70",                   barWidth: `${Math.min(100, Math.round((recoverable / (atRisk || 1)) * 100))}%`,       barColor: "bg-blue-600",    textColor: "text-blue-600" },
    { step: "03", name: "Gross Recovered",        amount: formatLakhs(gross),          conversion: conv3, subtext: "Settled and deposited",                barWidth: `${Math.min(100, Math.round((gross / (atRisk || 1)) * 100))}%`,              barColor: "bg-emerald-600", textColor: "text-emerald-700" },
    { step: "04", name: "Incremental Saved",     amount: formatLakhs(incremental),    conversion: conv4, subtext: "Above baseline churn",                 barWidth: `${Math.min(100, Math.round((incremental / (atRisk || 1)) * 100))}%`,        barColor: "bg-teal-600",    textColor: "text-teal-700" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-700" />
          <div>
            <h3 className="font-semibold text-gray-900 text-xs">Recovery Pipeline</h3>
            <p className="text-[11px] text-gray-500 font-normal">Conversion breakdown</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono tabular-nums">
          {conv3} Net
        </span>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="p-3 bg-gray-50/70 border border-gray-200 rounded-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-[10px] font-semibold text-gray-400">STAGE {stage.step}</span>
                <span className={`font-mono font-semibold text-xs tabular-nums ${stage.textColor}`}>{stage.conversion}</span>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${stage.barColor}`} style={{ width: stage.barWidth }} />
              </div>
              <h4 className="text-xs font-medium text-gray-700">{stage.name}</h4>
              <p className="text-lg font-bold tracking-tight text-gray-900 mt-0.5 font-mono tabular-nums">{stage.amount}</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-200/60 pt-1.5 font-normal">
              {stage.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
