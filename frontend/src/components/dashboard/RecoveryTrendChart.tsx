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
    <div className="bg-[#161D20] border border-[#2A3338] rounded-xl p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3338] mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1D2528] text-[#45D8A4] rounded-lg border border-[#2A3338]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#E8EDEE] text-sm">7-Day Recovery Trend</h3>
            <p className="text-xs text-[#8DA0A6]">Daily auto-recovered payment volume vs attempted risk</p>
          </div>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#45D8A4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#45D8A4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              stroke="#8DA0A6"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#2A3338" }}
            />
            <YAxis
              stroke="#8DA0A6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Volume"]}
              contentStyle={{
                backgroundColor: "#0F1416",
                borderRadius: "8px",
                borderColor: "#2A3338",
                color: "#E8EDEE",
                fontSize: "12px",
                fontFamily: "IBM Plex Mono",
              }}
            />

            <Area
              type="monotone"
              dataKey="recovered"
              stroke="#45D8A4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#mintGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
