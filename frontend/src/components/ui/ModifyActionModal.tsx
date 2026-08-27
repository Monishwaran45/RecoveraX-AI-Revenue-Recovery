"use client";

import { useState } from "react";
import { X, Clock, Edit3, ShieldAlert } from "lucide-react";
import { RecoveryCase } from "@/lib/types";

interface ModifyActionModalProps {
  recoveryCase: RecoveryCase;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (delayMinutes: number, notes?: string) => void;
}

export default function ModifyActionModal({
  recoveryCase,
  isOpen,
  onClose,
  onSubmit,
}: ModifyActionModalProps) {
  const [delay, setDelay] = useState(60);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(delay, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Modify Recovery Action</h3>
              <p className="text-[11px] text-slate-500">{recoveryCase.id} — {recoveryCase.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs">
            <p className="font-bold text-blue-900 mb-0.5">AI Original Recommendation:</p>
            <p className="text-blue-800">{recoveryCase.aiRecommendation.recommendation}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Human Operator Delay Setting (Minutes):
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1440"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                mins
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Override Rationale / Notes (Optional):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer requested custom window extension due to holiday..."
              className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
            >
              Approve Modified Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
