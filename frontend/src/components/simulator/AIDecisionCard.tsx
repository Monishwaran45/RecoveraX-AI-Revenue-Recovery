"use client";

import { Activity, CheckCircle2, AlertCircle, FileSearch } from "lucide-react";
import { AIRecommendation } from "@/lib/types";

interface AIDecisionCardProps {
  recommendation?: AIRecommendation;
  isLoading?: boolean;
}

export default function AIDecisionCard({ recommendation, isLoading }: AIDecisionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[320px] text-gray-400 text-xs">
        <Activity className="h-4 w-4 animate-spin text-gray-600 mb-2" />
        <span className="text-gray-500 font-medium">Evaluating failure telemetry...</span>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between min-h-[320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900 text-xs">Failure Diagnostics</h3>
                <p className="text-[11px] text-gray-500 font-normal">Root-cause classification</p>
              </div>
            </div>
            <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              --/100
            </span>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[210px] text-center p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            <FileSearch className="h-6 w-6 text-gray-300 mb-2" />
            <p className="font-medium text-xs text-gray-700">Awaiting AI Diagnosis</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
              Click &quot;Run Recovery&quot; to execute LLM failure analysis and calculate recovery index.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const score = recommendation.score ?? 85;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-subtle flex flex-col justify-between min-h-[320px]">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-gray-700" />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Failure Diagnostics</h3>
              <p className="text-[11px] text-gray-500 font-normal">Root-cause classification</p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            {score}/100 Score
          </span>
        </div>

        {/* Diagnosis & Likelihood */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            <span className="text-gray-500 uppercase text-[9px] font-semibold tracking-wider block mb-0.5">
              Classification
            </span>
            <span className="font-medium text-gray-900 text-xs font-mono truncate block">
              {recommendation?.diagnosis?.replace(/_/g, " ") || "INSUFFICIENT FUNDS"}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-200">
            <span className="text-emerald-800 uppercase text-[9px] font-semibold tracking-wider block mb-0.5">
              Estimated Likelihood
            </span>
            <span className="font-medium text-emerald-800 text-xs font-mono block">
              {score}% Confidence
            </span>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 text-xs">
              Recovery Action Plan
            </span>
            <span className="font-mono font-medium px-1.5 py-0.2 bg-gray-900 text-white rounded text-[10px]">
              {recommendation?.badgeText || "RETRY"}
            </span>
          </div>
          <p className="text-gray-600 text-[11px] font-normal leading-relaxed">
            {recommendation?.recommendation || "High recovery score indicates temporary decline; scheduled retry recommended."}
          </p>
        </div>

        {/* Diagnostic Signals */}
        {recommendation?.evidence && (
          <div className="space-y-1 pt-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
              Evaluated Telemetry Factors
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {recommendation.evidence.map((e) => (
                <div key={e.id} className="flex items-start gap-1.5 text-xs text-gray-700">
                  {e.isPositive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug text-gray-700 text-[11px] font-normal">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
