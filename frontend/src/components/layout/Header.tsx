"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  FolderKanban,
  ShieldCheck,
  BarChart3,
  FileText,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { store } from "@/lib/store";
import { getCases } from "@/lib/api/cases";
import { getApprovalCases } from "@/lib/api/approvals";
import { RecoveryCase } from "@/lib/types";
import Logo from "@/components/ui/Logo";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [alerts, setAlerts] = useState<RecoveryCase[]>([]);

  // Focus search with `/`
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateApprovals = async () => {
    try {
      const q = await getApprovalCases();
      setPendingApprovals(q.length);
    } catch {
      setPendingApprovals(store.getApprovalQueue().length);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getCases({ limit: 5 } as any);
      setAlerts(data.slice(0, 5));
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    updateApprovals();
    fetchAlerts();
    const unsub = store.subscribe(() => {
      updateApprovals();
      fetchAlerts();
    });
    return unsub;
  }, []);

  const navItems = [
    { label: "Overview",           href: "/dashboard",   icon: LayoutDashboard },
    { label: "Simulator",          href: "/simulator",   icon: Play            },
    { label: "Payment Cases",      href: "/cases",       icon: FolderKanban    },
    { label: "Approval Queue",     href: "/approvals",   icon: ShieldCheck, badge: pendingApprovals > 0 ? pendingApprovals : null },
    { label: "Benchmarks",         href: "/experiments",  icon: BarChart3       },
    { label: "Audit Logs",         href: "/audit",       icon: FileText        },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand + Nav */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <Logo className="h-7 w-7 shrink-0" />
              <span className="text-sm font-bold tracking-tight text-gray-900">
                Recovera<span className="text-blue-600">X</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "text-gray-900 bg-gray-100 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                    {item.badge != null && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search + Status + Alerts */}
          <div className="hidden md:flex items-center gap-3">
            {/* Clean Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-48 xl:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-400 transition-colors"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-white px-1 rounded border border-gray-200 pointer-events-none">
                /
              </kbd>
            </form>


            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-modal p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs font-semibold text-gray-900">
                      <span>Recent Alerts</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {alerts.length} Total
                      </span>
                    </div>
                    <div className="space-y-1 mt-2 max-h-60 overflow-y-auto">
                      {alerts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => { setShowNotifications(false); router.push(`/cases/${c.id}`); }}
                          className="p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors text-xs border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center justify-between text-gray-900 font-medium">
                            <span className="font-mono text-blue-600">{c.id}</span>
                            <span className="font-mono tabular-nums">₹{c.amount?.toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{c.customerName} · {c.problem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-4 space-y-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </form>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-2 p-2 rounded-md text-xs font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100 bg-gray-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
