"use client";

import { useState } from "react";
import { X, Clock, Edit3, Check } from "lucide-react";
import { RecoveryCase } from "@/lib/types";

export interface ModifyActionModalProps {
  recoveryCase?: RecoveryCase;
  caseData?: RecoveryCase;
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (delayMinutes: number, notes?: string) => void;
}

export default function ModifyActionModal({
  recoveryCase,
  caseData,
  isOpen = true,
  onClose,
  onSubmit,
}: ModifyActionModalProps) {
  const activeCase = recoveryCase || caseData;
  const [delay, setDelay] = useState<number>(activeCase?.scheduledDelayMinutes || 60);
  const [notes, setNotes] = useState("");

  if (!isOpen || !activeCase) return null;

  const quickDelays = [
    { label: "15m", value: 15 },
    { label: "30m", value: 30 },
    { label: "1h", value: 60 },
    { label: "4h", value: 240 },
    { label: "24h", value: 1440 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(delay, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-modal max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-gray-700" />
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Modify Retry Schedule</h3>
              <p className="text-[11px] text-gray-500 font-normal">
                {activeCase.id} · {activeCase.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">
              Recommended Strategy
            </span>
            <p className="font-medium text-gray-900 leading-snug">
              {activeCase.aiRecommendation?.recommendation || "Scheduled retry following cooldown period."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Scheduled Delay Window
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {quickDelays.map((qd) => (
                <button
                  key={qd.value}
                  type="button"
                  onClick={() => setDelay(qd.value)}
                  className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                    delay === qd.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {qd.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1440"
                value={delay}
                onChange={(e) => setDelay(Math.max(1, Number(e.target.value)))}
                className="w-full pl-3 pr-12 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                mins
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Operator Note / Override Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extended delay per customer request..."
              className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
