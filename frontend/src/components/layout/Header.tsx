"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/cases") return "Recovery Cases";
    if (pathname.startsWith("/cases/")) return "Case Detail & Verification";
    if (pathname === "/approvals") return "Human Approval Queue";
    return "AI Revenue Recovery";
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
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {getPageTitle()}
        </h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Engine Active
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-60 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Case ID, Customer, Amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </span>
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Risk Stream Alerts</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">3 Active</span>
              </div>
              <div className="space-y-2 mt-2.5 max-h-60 overflow-y-auto">
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                  <p className="font-semibold text-amber-950">CASE-1032 requires human sign-off</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">Amount ₹75,000 exceeds auto limit.</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-xs">
                  <p className="font-semibold text-blue-950">CASE-1021 auto-retry scheduled</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">Cool-down timer set to 30 mins.</p>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100 text-xs">
                  <p className="font-semibold text-rose-950">CASE-1048 retry hard-blocked</p>
                  <p className="text-rose-800 text-[11px] mt-0.5">Ambiguous debit risk prevented.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Merchant Dropdown */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            AC
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">Acme Commerce</p>
            <p className="text-[10px] text-slate-500 font-medium">MID: MER-99218</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
