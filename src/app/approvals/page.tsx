"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApprovalCases, approveCase, rejectCase, modifyCase } from "@/lib/api/approvals";
import { store } from "@/lib/store";
import { RecoveryCase } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import RecoveryScoreBadge from "@/components/ui/RecoveryScoreBadge";
import ModifyActionModal from "@/components/ui/ModifyActionModal";
import { 
  ShieldCheck, 
  UserCheck, 
  XCircle, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Building2
} from "lucide-react";

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvalList, setApprovalList] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modifyingCase, setModifyingCase] = useState<RecoveryCase | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    const data = await getApprovalCases();
    setApprovalList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
    return store.subscribe(fetchApprovals);
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    await approveCase(id);
    setActionLoadingId(null);
    fetchApprovals();
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    await rejectCase(id);
    setActionLoadingId(null);
    fetchApprovals();
  };

  const handleModifySubmit = async (delayMinutes: number, notes?: string) => {
    if (!modifyingCase) return;
    setActionLoadingId(modifyingCase.id);
    await modifyCase(modifyingCase.id, { delayMinutes, notes });
    setActionLoadingId(null);
    setModifyingCase(null);
    fetchApprovals();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-[#0b1426] tracking-tight">Human Approval Queue</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
              {approvalList.length} Pending Actions
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Financial operations requiring explicit merchant authorization.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl px-4 py-2.5 text-xs text-amber-950 flex items-center gap-2.5 shadow-2xs">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            <strong>Mandatory Safety Rule:</strong> High-value retries exceeding ₹50,000 auto-limit require merchant sign-off.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading approval queue...</div>
      ) : approvalList.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-[#0b1426]">Human Approval Queue Clear!</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
            All pending high-risk or threshold-exceeding recovery actions have been reviewed and resolved.
          </p>
          <button
            onClick={() => router.push("/cases")}
            className="mt-2 px-5 py-2.5 bg-[#106cf6] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-all inline-flex items-center gap-1.5"
          >
            Browse All Recovery Cases
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {approvalList.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#106cf6]"></div>

              {/* Card Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className="font-mono font-black text-[#106cf6] text-sm hover:underline cursor-pointer"
                  >
                    {c.id}
                  </span>
                  <h3 className="font-extrabold text-[#0b1426] text-base">{c.customerName}</h3>
                  <RiskBadge risk={c.risk} />
                </div>

                <div className="flex items-center gap-3">
                  <RecoveryScoreBadge score={c.score} />
                  <span className="text-xl font-black text-[#0b1426]">
                    ₹{c.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Grid: AI Analysis vs Policy Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* AI Rec */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100/90 space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-950 font-extrabold text-xs">
                    <Sparkles className="h-4 w-4 text-[#106cf6]" />
                    <span>AI Diagnosis & Strategy</span>
                  </div>
                  <p className="text-xs font-black text-blue-950">{c.aiRecommendation.recommendation}</p>

                  <div className="pt-2 border-t border-blue-100 text-[11px] space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Supporting Evidence:</span>
                    <ul className="space-y-1">
                      {c.aiRecommendation.evidence.slice(0, 4).map((ev) => (
                        <li key={ev.id} className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{ev.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Policy Reason */}
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs mb-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-700" />
                      <span>Policy Escalation Reason</span>
                    </div>
                    <p className="text-xs text-amber-950 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs">
                      {c.policyDecision.reason}
                    </p>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500 font-medium italic">
                    Requires merchant authorization before dispatching retry.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => router.push(`/cases/${c.id}`)}
                  className="text-xs font-extrabold text-[#106cf6] hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  Inspect Case Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(c.id)}
                    disabled={actionLoadingId === c.id}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="h-4 w-4" />
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(c.id)}
                    disabled={actionLoadingId === c.id}
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4 text-slate-500" />
                    Reject
                  </button>

                  <button
                    onClick={() => setModifyingCase(c)}
                    disabled={actionLoadingId === c.id}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="h-4 w-4" />
                    Modify
                  </button>
                </div>
              </div>
            </div>
          ))}

          {modifyingCase && (
            <ModifyActionModal
              recoveryCase={modifyingCase}
              isOpen={true}
              onClose={() => setModifyingCase(null)}
              onSubmit={handleModifySubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}
