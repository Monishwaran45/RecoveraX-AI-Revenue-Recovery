import { AIRecommendation } from "@/lib/types";
import { CheckCircle2, AlertCircle, TrendingUp, FileSearch } from "lucide-react";

export default function AIRecommendationCard({ data }: { data: AIRecommendation }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-gray-700" />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">
                {data.badgeText || "Failure Diagnostics"}
              </h3>
              <p className="text-[11px] text-gray-500 font-normal">Root-cause classification & telemetry</p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-gray-50 text-gray-800 text-xs font-mono font-medium rounded border border-gray-200">
            Score: {data.score}/100
          </span>
        </div>

        {/* Diagnosis & Strategy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Classification
            </p>
            <p className="text-xs font-semibold text-gray-900 leading-snug font-mono">{data.diagnosis}</p>
          </div>

          <div className="bg-blue-50/50 p-3 rounded border border-blue-200">
            <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider mb-0.5">
              Strategy
            </p>
            <p className="text-xs font-semibold text-gray-900 leading-snug">{data.recommendation}</p>
          </div>
        </div>

        {/* Evidence */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-1.5">
            Diagnostic Signals:
          </p>
          <div className="space-y-1">
            {data.evidence.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                {item.isPositive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="font-normal text-gray-700 text-[11px]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expected Value */}
      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between mt-1 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
          <span>Expected Recovery Value:</span>
        </div>
        <span className="text-xs font-bold font-mono text-gray-900 tabular-nums">
          ₹{data.expectedValue.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
