"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  Zap,
  ChevronRight
} from "lucide-react";
import { store } from "@/lib/store";

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setPendingApprovals(store.getApprovalQueue().length);
    };
    updateCount();
    return store.subscribe(updateCount);
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Recovery Cases",
      href: "/cases",
      icon: FolderKanban,
    },
    {
      label: "Approval Queue",
      href: "/approvals",
      icon: ShieldCheck,
      badge: pendingApprovals > 0 ? pendingApprovals : null,
    },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-100 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0 select-none">
      {/* Logo Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20 shrink-0">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">
              AI Revenue Recovery
            </h1>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5"></p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-400 text-slate-950 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Merchant Profile */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-950 border border-blue-800/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              AC
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Acme Commerce</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-medium">Sandbox Connected</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
