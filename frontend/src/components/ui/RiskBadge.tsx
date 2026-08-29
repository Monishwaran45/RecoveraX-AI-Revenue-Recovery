import { RiskLevel, CaseStatus, PolicyDecisionType } from "@/lib/types";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === "LOW") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0"></span>
        Low Risk
      </span>
    );
  }
  if (risk === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0"></span>
        Medium Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0"></span>
      High Risk
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, { bg: string; text: string; border: string; label: string; dot: string }> = {
    OPEN: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "Open", dot: "bg-gray-400" },
    SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Scheduled", dot: "bg-blue-600" },
    HUMAN_APPROVAL: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Awaiting Review", dot: "bg-amber-600" },
    RECOVERED: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", label: "Recovered", dot: "bg-emerald-600" },
    BLOCKED: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", label: "Policy Blocked", dot: "bg-rose-600" },
    REJECTED: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", label: "Declined", dot: "bg-gray-400" },
    MODIFIED: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200", label: "Modified Delay", dot: "bg-indigo-600" },
    STOPPED: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "Halted", dot: "bg-gray-400" },
    FAILED: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", label: "Unresolved", dot: "bg-rose-600" },
  };

  const style = styles[status] || styles.OPEN;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`}></span>
      {style.label}
    </span>
  );
}

export function PolicyBadge({ type }: { type?: PolicyDecisionType | string }) {
  const normType = String(type || "").toUpperCase();
  if (normType === "AUTO") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
        AUTO
      </span>
    );
  }
  if (normType === "HUMAN") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200">
        REVIEW
      </span>
    );
  }
  if (normType === "STOP") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-gray-100 text-gray-700 border border-gray-200">
        STOP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-rose-50 text-rose-800 border border-rose-200">
      BLOCK
    </span>
  );
}
