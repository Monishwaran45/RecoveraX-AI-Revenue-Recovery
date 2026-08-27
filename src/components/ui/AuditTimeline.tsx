import { AuditEvent } from "@/lib/types";
import { History, CheckCircle2, Shield, Sparkles, Clock, AlertTriangle, UserCheck, Lock } from "lucide-react";

export default function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const getCategoryIcon = (category: AuditEvent["category"]) => {
    switch (category) {
      case "AI":
        return <Sparkles className="h-3.5 w-3.5 text-[#106cf6]" />;
      case "POLICY":
        return <Shield className="h-3.5 w-3.5 text-indigo-600" />;
      case "HUMAN":
        return <UserCheck className="h-3.5 w-3.5 text-amber-600" />;
      case "ACTION":
        return <Clock className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return <History className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0b1426] text-sm">Immutable Audit Timeline</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Financial Event Log</p>
          </div>
        </div>
        <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Cryptographically Verified Trail
        </span>
      </div>

      <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt, idx) => (
          <div key={evt.id || idx} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-7 top-0.5 h-6 w-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-[#106cf6] group-hover:scale-110 transition-all shadow-2xs">
              {getCategoryIcon(evt.category)}
            </div>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{evt.timestamp}</span>
                  <span className="text-xs font-black text-[#0b1426]">{evt.title}</span>
                  {evt.badgeText && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                      {evt.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{evt.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
