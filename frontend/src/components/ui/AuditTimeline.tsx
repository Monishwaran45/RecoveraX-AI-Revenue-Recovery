import { AuditEvent } from "@/lib/types";
import { History, Sparkles, Clock, Shield, UserCheck } from "lucide-react";

export default function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const getCategoryIcon = (category: AuditEvent["category"]) => {
    switch (category) {
      case "AI":
        return <Sparkles className="h-3 w-3 text-blue-600" />;
      case "POLICY":
        return <Shield className="h-3 w-3 text-purple-600" />;
      case "HUMAN":
        return <UserCheck className="h-3 w-3 text-amber-600" />;
      case "ACTION":
        return <Clock className="h-3 w-3 text-emerald-600" />;
      default:
        return <History className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-subtle">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-700" />
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Audit Trail</h3>
            <p className="text-[11px] text-gray-500 font-normal">Sequenced financial event ledger</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
          {events.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
        {events.map((evt, idx) => (
          <div key={evt.id || idx} className="relative">
            {/* Dot */}
            <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-white border border-gray-300 flex items-center justify-center">
              {getCategoryIcon(evt.category)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-gray-400 tabular-nums">{evt.timestamp}</span>
                <span className="text-xs font-semibold text-gray-900">{evt.title}</span>
                {evt.badgeText && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded border border-gray-200">
                    {evt.badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 font-normal leading-relaxed">{evt.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
