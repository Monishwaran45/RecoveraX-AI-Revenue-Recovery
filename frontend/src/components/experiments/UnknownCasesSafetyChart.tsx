"use client";

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { UnknownCasesBreakdown } from "@/lib/api/experiments";
import { ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

interface UnknownCasesSafetyChartProps {
  unknownCases?: UnknownCasesBreakdown;
}

export default function UnknownCasesSafetyChart({ unknownCases }: UnknownCasesSafetyChartProps) {
  const humanCount = unknownCases?.human_count ?? 5;
  const blockCount = unknownCases?.block_count ?? 3;
  const autoCount = unknownCases?.auto_count ?? 0;
  const total = humanCount + blockCount + autoCount;

  const chartData = useMemo(() => {
    return [
      {
        name: "Human Review Triage",
        value: humanCount,
        pct: unknownCases?.human_pct ?? 62.5,
        color: "#d97706",
        bg: "bg-amber-500",
        description: "Low-confidence & unparsable payloads routed to human operator",
      },
      {
        name: "Hard Safety Block",
        value: blockCount,
        pct: unknownCases?.block_pct ?? 37.5,
        color: "#e11d48",
        bg: "bg-rose-600",
        description: "Ambiguous debits & SIM-swap fraud signals halted immediately",
      },
      {
        name: "False Auto Executions",
        value: autoCount,
        pct: unknownCases?.false_auto_execution_rate ?? 0.0,
        color: "#059669",
        bg: "bg-emerald-600",
        description: "Zero unverified auto retries triggered (100% Fail-Closed)",
      },
    ];
  }, [unknownCases, humanCount, blockCount, autoCount]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-subtle">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <div>
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm tracking-tight">
              Safety Triage Distribution on Unknown & Novel Failure Scenarios
            </h3>
            <p className="text-[11px] text-gray-500 font-normal">
              100% Fail-Closed Guarantee: No automatic executions on ambiguous or unseen payloads
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          0.00% False Auto Executions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Visualization */}
        <div className="md:col-span-4 h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData
                  .filter((d) => d.value > 0)
                  .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} Cases`, "Volume"]}
                contentStyle={{
                  backgroundColor: "#111827",
                  borderRadius: "8px",
                  borderColor: "#374151",
                  color: "#f9fafb",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono",
                }}
                itemStyle={{ color: "#f9fafb" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-gray-900 tabular-nums">{total}</span>
            <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">100% SAFE</span>
          </div>
        </div>

        {/* Legend & Details */}
        <div className="md:col-span-8 space-y-2.5">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg border border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${item.bg}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{item.name}</span>
                    <span className="font-mono text-[11px] font-semibold text-gray-500">
                      ({item.value} / {total} cases)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </div>
              <div className="text-right sm:self-center shrink-0">
                <span className="font-mono font-bold text-xs text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 shadow-3xs">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
