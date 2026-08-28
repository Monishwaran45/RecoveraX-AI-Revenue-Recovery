"use client";

import { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getCases } from "@/lib/api/cases";
import { RecoveryCase } from "@/lib/types";
import { store } from "@/lib/store";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<RecoveryCase[]>([]);

  const fetchAlerts = async () => {
    const data = await getCases({ limit: 5 } as any);
    setAlerts(data.slice(0, 5));
  };

  useEffect(() => {
    fetchAlerts();
    return store.subscribe(fetchAlerts);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview & Business Impact";
    if (pathname === "/simulator") return "Recovery Agent Simulator";
    if (pathname === "/cases") return "Recovery Cases Operations";
    if (pathname.startsWith("/cases/")) return "Case Detail & Verification";
    if (pathname === "/approvals") return "Human Approval Queue";
    if (pathname === "/experiments") return "Batch Experiments & Results";
    if (pathname === "/audit") return "System Audit Trail";
    return "RecoveraX";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-52 md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Case ID, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Risk Stream Alerts</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {alerts.length} Active
                </span>
              </div>
              <div className="space-y-2 mt-2.5 max-h-60 overflow-y-auto">
                {alerts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(`/cases/${c.id}`);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      c.policyDecision.type === "HUMAN"
                        ? "bg-amber-50/70 border-amber-200"
                        : c.policyDecision.type === "BLOCK"
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-emerald-50/70 border-emerald-200"
                    }`}
                  >
                    <p className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">{c.id}</span>
                      <span className="font-mono font-bold">₹{c.amount.toLocaleString("en-IN")}</span>
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5 truncate">
                      {c.customerName} — {c.policyDecision.decisionLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Merchant Dropdown */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
            AC
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">Acme Commerce</p>
          </div>
        </div>
      </div>
    </header>
  );
}
