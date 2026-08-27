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
  CreditCard, 
  User, 
  FileText,
  ShieldCheck,
  Zap,
  Building2,
  Lock
} from "lucide-react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [recoveryCase, setRecoveryCase] = useState<RecoveryCase | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = async () => {
    setLoading(true);
    const data = await getCase(unwrappedParams.id);
    setRecoveryCase(data ? { ...data } : null);
    setLoading(false);
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
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
        Loading case details for {unwrappedParams.id}...
      </div>
    );
  }

  if (!recoveryCase) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-4 shadow-xs">
        <h2 className="text-xl font-black text-[#0b1426]">Case Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">Case {unwrappedParams.id} could not be located in the system.</p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#106cf6] text-white text-xs font-extrabold rounded-xl shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Recovery Cases
        </Link>
      </div>
    );
  }

  // Get initial letters for customer avatar
  const customerInitials = recoveryCase.customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-[#106cf6] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recovery Cases
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono font-bold">Case ID: {recoveryCase.id}</span>
          <StatusBadge status={recoveryCase.status} />
        </div>
      </div>

      {/* Main Case Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#106cf6] border border-blue-200 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {customerInitials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#0b1426] font-mono tracking-tight">
                {recoveryCase.id}
              </h1>
              <RiskBadge risk={recoveryCase.risk} />
              <PolicyBadge type={recoveryCase.policyDecision.type} />
            </div>
            <div className="flex flex-wrap items-center gap-3.5 mt-2 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5 text-[#0b1426] font-bold">
                <Building2 className="h-4 w-4 text-slate-400" />
                {recoveryCase.customerName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <FileText className="h-4 w-4 text-slate-400" />
                {recoveryCase.type.replace("_", " ")}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">{recoveryCase.customerEmail}</span>
            </div>
          </div>
        </div>

        <div className="text-left md:text-right bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-48">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">At-Risk Amount</span>
          <span className="text-2xl font-black text-[#0b1426]">
            ₹{recoveryCase.amount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Summary Row (4 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Recovery Confidence Score
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#0b1426]">{recoveryCase.score}</span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Algorithmic likelihood</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Risk Classification
          </span>
          <div className="mt-2">
            <RiskBadge risk={recoveryCase.risk} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">Evaluated risk tier</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Retry Sequence
          </span>
          <div className="mt-1">
            <span className="text-2xl font-black text-[#0b1426]">
              {recoveryCase.retryCount}
            </span>
            <span className="text-xs text-slate-400 font-bold"> / {recoveryCase.maxRetries} Max</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Attempt threshold</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Gateway Payment State
          </span>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
              recoveryCase.paymentState === "CLEARLY_FAILED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : recoveryCase.paymentState === "BANK_TIMEOUT"
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              {recoveryCase.paymentState.replace("_", " ")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">Bank signal status</p>
        </div>
      </div>

      {/* Grid: AI Analysis vs Policy Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIRecommendationCard data={recoveryCase.aiRecommendation} />
        <PolicyDecisionCard data={recoveryCase.policyDecision} />
      </div>

      {/* Interactive Action Simulation Panel */}
      <ActionPanel recoveryCase={recoveryCase} onUpdate={loadCase} />

      {/* Audit Timeline */}
      <AuditTimeline events={recoveryCase.auditTimeline} />
    </div>
  );
}
