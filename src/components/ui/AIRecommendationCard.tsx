import { AIRecommendation } from "@/lib/types";
import { Sparkles, CheckCircle2, AlertCircle, TrendingUp, Cpu } from "lucide-react";

export default function AIRecommendationCard({ data }: { data: AIRecommendation }) {
  return (
    <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(16,108,246,0.06)] relative overflow-hidden flex flex-col justify-between">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#106cf6] to-[#00d2ff]"></div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#106cf6] rounded-xl ring-1 ring-blue-100">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0b1426] text-sm leading-tight">
                {data.badgeText || "AI Recommendation Engine"}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Root-Cause Diagnosis & Scoring</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#106cf6] text-xs font-black rounded-full border border-blue-200 shadow-2xs">
            Score: {data.score}/100
          </span>
        </div>

        {/* Diagnosis & Action Split Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              AI Diagnosis
            </p>
            <p className="text-xs font-bold text-slate-900 leading-snug">{data.diagnosis}</p>
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100/80">
            <p className="text-[10px] font-black text-[#106cf6] uppercase tracking-widest mb-1">
              Optimal Strategy
            </p>
            <p className="text-xs font-black text-blue-950 leading-snug">{data.recommendation}</p>
          </div>
        </div>

        {/* Evidence Checklist */}
        <div className="mb-4">
          <p className="text-xs font-extrabold text-slate-800 mb-2.5 flex items-center gap-1.5">
            <span>Supporting Signals & Evidence:</span>
          </p>
          <div className="space-y-1.5">
            {data.evidence.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-100/80">
                {item.isPositive ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className="font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expected Recovery Value */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 -mx-5 -mb-5 px-5 py-3.5 mt-2 rounded-b-2xl">
        <div className="flex items-center gap-1.5 text-slate-600">
          <TrendingUp className="h-4 w-4 text-[#106cf6]" />
          <span className="text-xs font-bold">Expected Recovery Value:</span>
        </div>
        <span className="text-base font-black text-[#0b1426]">
          ₹{data.expectedValue.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
