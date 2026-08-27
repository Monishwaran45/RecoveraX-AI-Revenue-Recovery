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
  iconBgColor = "bg-blue-50",
  iconTextColor = "text-blue-600",
  valueColor = "text-slate-900",
  subtextClass = "text-slate-500",
}: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconTextColor}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
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

      <p className={`text-xs mt-1 font-medium ${subtextClass}`}>{description}</p>
    </div>
  );
}
