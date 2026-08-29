"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCase } from "@/lib/api/cases";
import { store } from "@/lib/store";
import { RecoveryCase } from "@/lib/types";
import { RiskBadge, StatusBadge, PolicyBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import AIRecommendationCard from "@/components/ui/AIRecommendationCard";
import PolicyDecisionCard from "@/components/ui/PolicyDecisionCard";
import ActionPanel from "@/components/ui/ActionPanel";
import AuditTimeline from "@/components/ui/AuditTimeline";
import { 
  ArrowLeft, 
  FileText,
  Building2,
  Mail
} from "lucide-react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [recoveryCase, setRecoveryCase] = useState<RecoveryCase | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await getCase(unwrappedParams.id);
      setRecoveryCase(data ? { ...data } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
    return store.subscribe(() => {
      getCase(unwrappedParams.id).then((data) => {
        if (data) setRecoveryCase({ ...data });
      });
    });
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-400 space-y-2">
        <div className="h-6 w-6 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-gray-500">
          Loading case {unwrappedParams.id}...
        </p>
      </div>
    );
  }

  if (!recoveryCase) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-3 shadow-subtle">
        <h2 className="text-sm font-semibold text-gray-900">Case Not Found</h2>
        <p className="text-xs text-gray-500 font-normal">Case {unwrappedParams.id} could not be located.</p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Cases
        </Link>
      </div>
    );
  }

  const customerInitials = recoveryCase.customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-5 pb-10">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cases
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">Case ID: {recoveryCase.id}</span>
          <StatusBadge status={recoveryCase.status} />
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-md bg-gray-100 text-gray-800 border border-gray-200 flex items-center justify-center font-bold text-xs shrink-0">
            {customerInitials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 font-mono tracking-tight">
                {recoveryCase.id}
              </h1>
              <RiskBadge risk={recoveryCase.risk} />
              <PolicyBadge type={recoveryCase.policyDecision?.type} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-600 font-medium">
              <span className="flex items-center gap-1 text-gray-900 font-medium">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                {recoveryCase.customerName}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                {recoveryCase.type?.replace("_", " ") || "Payment"}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 font-mono flex items-center gap-1">
                <Mail className="h-3 w-3 text-gray-400" />
                {recoveryCase.customerEmail}
              </span>
            </div>
          </div>
        </div>

        <div className="text-left md:text-right bg-gray-50 p-3 rounded border border-gray-200 min-w-44">
          <span className="text-[10px] font-semibold uppercase text-gray-400 block tracking-wider">Amount at Risk</span>
          <span className="text-xl font-bold text-gray-900 font-mono tabular-nums">
            ₹{recoveryCase.amount?.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-subtle">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Confidence Score
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900 font-mono tabular-nums">{recoveryCase.score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Recovery score</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-subtle">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Risk Tier
          </span>
          <div className="mt-1.5">
            <RiskBadge risk={recoveryCase.risk} />
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-normal">Account classification</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-subtle">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Retry Sequence
          </span>
          <div className="mt-1 font-mono">
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {recoveryCase.retryCount}
            </span>
            <span className="text-xs text-gray-400"> / {recoveryCase.maxRetries} Max</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 font-normal">Attempt limit</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-subtle">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
            Gateway Telemetry State
          </span>
          <div className="mt-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              recoveryCase.paymentState === "CLEARLY_FAILED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : recoveryCase.paymentState === "BANK_TIMEOUT"
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              {recoveryCase.paymentState?.replace("_", " ") || "CLEAR"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-normal">Bank response state</p>
        </div>
      </div>

      {/* Grid: AI Analysis vs Policy Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIRecommendationCard data={recoveryCase.aiRecommendation} />
        <PolicyDecisionCard data={recoveryCase.policyDecision} />
      </div>

      {/* Action Simulation Panel */}
      <ActionPanel recoveryCase={recoveryCase} onUpdate={loadCase} />

      {/* Audit Timeline */}
      <AuditTimeline events={recoveryCase.auditTimeline} />
    </div>
  );
}
