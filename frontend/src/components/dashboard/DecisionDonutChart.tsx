"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DecisionDonutProps {
  data: {
    auto: number;
    human: number;
    blocked: number;
  };
}

export default function DecisionDonutChart({ data }: DecisionDonutProps) {
  const chartData = [
    { name: "Auto",    value: data.auto,    color: "#059669", bg: "bg-emerald-600" },
    { name: "Review",  value: data.human,   color: "#d97706", bg: "bg-amber-600" },
    { name: "Blocked", value: data.blocked, color: "#dc2626", bg: "bg-rose-600" },
  ];

  const total = data.auto + data.human + data.blocked;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5">
        <div>
          <h3 className="font-semibold text-gray-900 text-xs">Authorization Breakdown</h3>
          <p className="text-[11px] text-gray-500 font-normal">Policy distribution</p>
        </div>
        <span className="text-[11px] font-mono text-gray-600 bg-gray-50 px-2 py-0.2 rounded border border-gray-200">
          {total} Actions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center">
        <div className="h-32 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} Cases`, "Volume"]}
                contentStyle={{ backgroundColor: "#111827", borderRadius: "6px", borderColor: "#374151", color: "#f9fafb", fontSize: "11px", fontWeight: "500" }}
                itemStyle={{ color: "#f9fafb" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold font-mono text-gray-900 tabular-nums">{total}</span>
            <span className="text-[9px] uppercase font-medium text-gray-400">Total</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {chartData.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-gray-50 border border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.bg}`} />
                  <span className="font-medium text-gray-800 text-[11px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-semibold text-gray-900 tabular-nums">{item.value}</span>
                  <span className="text-gray-400 text-[10px] tabular-nums">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
