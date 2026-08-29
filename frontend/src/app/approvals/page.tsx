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
  ArrowRight,
  ShieldAlert,
  Clock
} from "lucide-react";

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvalList, setApprovalList] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modifyingCase, setModifyingCase] = useState<RecoveryCase | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await getApprovalCases();
      setApprovalList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600 text-white rounded shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Manual Review Queue</h1>
              <span className="px-2 py-0.2 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {approvalList.length} Pending
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              High-exposure transactions requiring operator authorization prior to execution.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-xs text-amber-950 flex items-center gap-2 self-start sm:self-auto">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          <span className="font-normal text-[11px]">
            <strong>Policy Limit:</strong> Transactions &gt; ₹50,000 require manual sign-off.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400 text-xs font-mono">Loading review queue...</div>
      ) : approvalList.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-2 shadow-subtle">
          <div className="h-10 w-10 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Review Queue Cleared</h2>
          <p className="text-xs text-gray-500 font-normal max-w-sm mx-auto">
            All pending high-risk or threshold-exceeding transactions have been resolved.
          </p>
          <button
            onClick={() => router.push("/cases")}
            className="mt-2 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Browse All Cases</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {approvalList.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle hover:border-gray-300 transition-colors relative"
            >
              {/* Card Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className="font-mono font-semibold text-blue-600 text-xs hover:underline cursor-pointer"
                  >
                    {c.id}
                  </span>
                  <span className="text-gray-300">·</span>
                  <h3 className="font-semibold text-gray-900 text-xs">{c.customerName}</h3>
                  <RiskBadge risk={c.risk} />
                </div>

                <div className="flex items-center gap-2.5">
                  <RecoveryScoreBadge score={c.score} />
                  <span className="text-base font-bold text-gray-900 font-mono tabular-nums">
                    ₹{c.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Strategy & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-gray-500 block tracking-wider">
                    Recommended Recovery Plan
                  </span>
                  <p className="font-medium text-gray-900 text-xs">
                    {c.aiRecommendation?.recommendation || "Scheduled Retry"}
                  </p>
                  <p className="text-[11px] text-gray-600 font-normal leading-relaxed">
                    {c.aiRecommendation?.diagnosis || "Payment failure root cause evaluated."}
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-amber-900 block tracking-wider">
                    Policy Routing Reason
                  </span>
                  <p className="font-medium text-amber-950 text-xs leading-relaxed">
                    {c.policyDecision?.reason || "High exposure transaction requires manual operator sign-off."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[11px] text-gray-500 font-normal flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  Scheduled delay: <span className="font-mono text-gray-700">{c.scheduledDelayMinutes || 30} mins</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoadingId === c.id}
                    onClick={() => setModifyingCase(c)}
                    className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded border border-gray-300 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    Modify
                  </button>

                  <button
                    disabled={actionLoadingId === c.id}
                    onClick={() => handleReject(c.id)}
                    className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-medium text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="h-3 w-3" />
                    Decline
                  </button>

                  <button
                    disabled={actionLoadingId === c.id}
                    onClick={() => handleApprove(c.id)}
                    className="px-3.5 py-1 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <UserCheck className="h-3 w-3" />
                    {actionLoadingId === c.id ? "Authorizing..." : "Authorize"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modify Action Modal */}
      {modifyingCase && (
        <ModifyActionModal
          caseData={modifyingCase}
          onClose={() => setModifyingCase(null)}
          onSubmit={handleModifySubmit}
        />
      )}
    </div>
  );
}
