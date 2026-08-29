"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface RecoveryTrendChartProps {
  trendData?: Array<{ day: string; recovered: number; attempted: number }>;
}

const fallbackTrend = [
  { day: "Mon", recovered: 120000, attempted: 150000 },
  { day: "Tue", recovered: 180000, attempted: 210000 },
  { day: "Wed", recovered: 150000, attempted: 190000 },
  { day: "Thu", recovered: 240000, attempted: 280000 },
  { day: "Fri", recovered: 310000, attempted: 350000 },
  { day: "Sat", recovered: 280000, attempted: 320000 },
  { day: "Sun", recovered: 350000, attempted: 390000 },
];

export default function RecoveryTrendChart({ trendData }: RecoveryTrendChartProps) {
  const data = trendData && trendData.length > 0 ? trendData : fallbackTrend;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-700" />
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Money Recovered Trend</h3>
            <p className="text-[11px] text-gray-500 font-normal">7-Day cumulative verified bank settlements</p>
          </div>
        </div>
      </div>

      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="classicGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Volume"]}
              contentStyle={{
                backgroundColor: "#111827",
                borderRadius: "6px",
                borderColor: "#374151",
                color: "#f9fafb",
                fontSize: "11px",
                fontFamily: "JetBrains Mono",
              }}
              itemStyle={{ color: "#f9fafb" }}
            />

            <Area
              type="monotone"
              dataKey="recovered"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#classicGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
