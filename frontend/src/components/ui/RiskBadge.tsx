import { RiskLevel, CaseStatus, PolicyDecisionType } from "@/lib/types";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === "LOW") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        LOW RISK
      </span>
    );
  }
  if (risk === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        MED RISK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
      HIGH RISK
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, { bg: string; text: string; border: string; label: string; dot?: string }> = {
    OPEN: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", label: "Open", dot: "bg-slate-400" },
    SCHEDULED: { bg: "bg-blue-50", text: "text-[#106cf6]", border: "border-blue-200", label: "Scheduled", dot: "bg-[#106cf6]" },
    HUMAN_APPROVAL: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200", label: "Awaiting Approval", dot: "bg-amber-500" },
    RECOVERED: { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-200", label: "Recovered", dot: "bg-emerald-500" },
    BLOCKED: { bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-200", label: "Blocked", dot: "bg-rose-500" },
    REJECTED: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", label: "Rejected", dot: "bg-slate-400" },
    MODIFIED: { bg: "bg-indigo-50", text: "text-indigo-900", border: "border-indigo-200", label: "Modified by Human", dot: "bg-indigo-500" },
    STOPPED: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", label: "Stopped", dot: "bg-slate-400" },
    FAILED: { bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-200", label: "Failed", dot: "bg-rose-500" },
  };

  const style = styles[status] || styles.OPEN;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`}></span>
      {style.label}
    </span>
  );
}

export function PolicyBadge({ type }: { type: PolicyDecisionType }) {
  if (type === "AUTO") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-emerald-100/80 text-emerald-900 border border-emerald-300/80">
        AUTO
      </span>
    );
  }
  if (type === "HUMAN") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-amber-100/80 text-amber-950 border border-amber-300/80">
        HUMAN
      </span>
    );
  }
  if (type === "STOP") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-300">
        STOP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-rose-100/80 text-rose-950 border border-rose-300/80">
      BLOCK
    </span>
  );
}
