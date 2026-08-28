"use client";

import { Brain, CheckCircle2, AlertCircle, Sparkles, Activity } from "lucide-react";
import { AIRecommendation } from "@/lib/types";

interface AIDecisionCardProps {
  recommendation?: AIRecommendation;
  isLoading?: boolean;
}

export default function AIDecisionCard({ recommendation, isLoading }: AIDecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center min-h-[360px] text-slate-400 text-xs font-mono font-medium animate-pulse">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3 shadow-2xs">
          <Brain className="h-6 w-6 animate-spin text-blue-600" />
        </div>
        <span>AI Diagnostic Engine evaluating patterns...</span>
      </div>
    );
  }

  const score = recommendation?.score || 85;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[360px]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-xs">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">AI Diagnostic Engine</h3>
              <p className="text-[11px] font-semibold text-slate-400">Probabilistic pattern evaluation</p>
            </div>
          </div>
          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/80 shadow-2xs">
            {score}/100 Score
          </span>
        </div>

        {/* Diagnosis & Probability Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-0.5">Diagnosis</span>
            <span className="font-extrabold text-slate-900 text-xs font-mono truncate block">
              {recommendation?.diagnosis || "INSUFFICIENT_FUNDS"}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-0.5">Recovery Probability</span>
            <span className="font-extrabold text-emerald-700 text-xs font-mono block">{score}% Confidence</span>
          </div>
        </div>

        {/* Recommended Strategy Box */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border border-blue-100 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-950 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Recommended Action
            </span>
            <span className="font-mono font-black px-2.5 py-0.5 bg-blue-600 text-white rounded-md text-[10px] tracking-wider shadow-2xs">
              {recommendation?.badgeText || "RETRY"}
            </span>
          </div>
          <p className="text-blue-900 text-[11px] font-medium leading-relaxed">
            {recommendation?.recommendation || "High recovery score indicates payer may resolve funds; retry recommended."}
          </p>
        </div>

        {/* Evidence Signals Evaluated */}
        {recommendation?.evidence && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Evidence Signals Evaluated
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {recommendation.evidence.map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                  {e.isPositive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight text-slate-800 text-[11px] font-semibold">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
