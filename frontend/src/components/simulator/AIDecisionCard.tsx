"use client";

import { Brain, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { AIRecommendation } from "@/lib/types";

interface AIDecisionCardProps {
  recommendation?: AIRecommendation;
  isLoading?: boolean;
}

export default function AIDecisionCard({ recommendation, isLoading }: AIDecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-center h-48 text-slate-400 text-xs font-mono font-medium animate-pulse">
        <Brain className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
        AI Diagnostic Engine evaluating transaction history...
      </div>
    );
  }

  const score = recommendation?.score || 87;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Diagnostic Engine</h3>
              <p className="text-xs text-slate-500">Probabilistic pattern evaluation</p>
            </div>
          </div>
          <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {score}/100 Score
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Diagnosis</span>
              <span className="font-bold text-slate-900">{recommendation?.diagnosis || "TEMPORARY_BANK_ERROR"}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Recovery Probability</span>
              <span className="font-bold text-emerald-600 font-mono">{score}% Confidence</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-blue-950">Recommended Action</span>
              <span className="font-mono font-extrabold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">
                {recommendation?.badgeText || "RETRY"}
              </span>
            </div>
            <p className="text-blue-900 text-[11px] font-medium leading-relaxed">
              {recommendation?.recommendation || "Temporary failure with strong customer payment history. Retry recommended."}
            </p>
          </div>

          {recommendation?.evidence && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Evidence Signals Evaluated
              </span>
              {recommendation.evidence.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  {e.isPositive ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{e.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
