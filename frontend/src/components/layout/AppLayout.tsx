"use client";

import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 flex flex-col font-sans antialiased selection:bg-gray-200">
      {/* Navigation Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">RecoveraX</span>
            <span className="text-gray-300">·</span>
            <span>Revenue Recovery & Risk Operations Console</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>PCI-DSS Level 1</span>
            <span className="text-gray-300">·</span>
            <span>Deterministic Policy Guardrails</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
