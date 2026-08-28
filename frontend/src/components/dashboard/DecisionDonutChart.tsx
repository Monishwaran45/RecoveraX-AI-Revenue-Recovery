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
    { name: "AUTO", value: data.auto, color: "#10b981", bg: "bg-emerald-500" },
    { name: "HUMAN", value: data.human, color: "#f59e0b", bg: "bg-amber-500" },
    { name: "BLOCKED", value: data.blocked, color: "#ef4444", bg: "bg-rose-500" },
  ];

  const total = data.auto + data.human + data.blocked;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h3 className="font-extrabold text-[#0b1426] text-sm">Decision Distribution</h3>
          <p className="text-xs text-slate-500">AI and Safety Engine decision split</p>
        </div>
        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {total} Total Actions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Chart container */}
        <div className="h-44 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} Cases`, "Volume"]}
                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "10px", borderColor: "#e2e8f0", fontSize: "12px", fontWeight: "700" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-[#0b1426]">{total}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Decisions</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5">
          {chartData.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`h-3 w-3 rounded-full ${item.bg}`}></span>
                  <span className="font-extrabold text-[#0b1426]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#0b1426]">{item.value}</span>
                  <span className="text-slate-400 font-bold text-[11px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
