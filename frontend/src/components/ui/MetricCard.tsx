import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  iconBgColor?: string;
  iconTextColor?: string;
  valueColor?: string;
  subtextClass?: string;
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp = true,
  iconBgColor = "bg-gray-50 border-gray-200",
  iconTextColor = "text-gray-600",
  valueColor = "text-gray-900",
  subtextClass = "text-gray-500",
}: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-1.5 rounded border ${iconBgColor} ${iconTextColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <h3 className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${valueColor}`}>
            {value}
          </h3>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border shrink-0 font-mono ${
                trendUp
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
      </div>

      <p className={`text-xs mt-2 font-normal ${subtextClass}`}>{description}</p>
    </div>
  );
}
