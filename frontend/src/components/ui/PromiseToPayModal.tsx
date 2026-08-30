"use client";

/**
 * ==============================================================================
 * RecoveraX — Autonomous AI Revenue Recovery Engine
 * Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
 * Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
 * All Rights Reserved.
 * ==============================================================================
 */

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, FileText, Loader2, CheckCircle2 } from "lucide-react";

import { PromiseToPayRecord } from "@/lib/api/promises";

interface PromiseToPayModalProps {
  caseId: string;
  defaultAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promisedAmount: number, promisedDate: string, notes?: string) => Promise<void>;
  initialRecord?: PromiseToPayRecord | null;
}

export default function PromiseToPayModal({
  caseId,
  defaultAmount,
  isOpen,
  onClose,
  onSubmit,
  initialRecord,
}: PromiseToPayModalProps) {
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        setAmount(initialRecord.promised_amount || defaultAmount || 0);
        setDate(initialRecord.promised_date ? initialRecord.promised_date.split("T")[0] : new Date().toISOString().split("T")[0]);
        setNotes(initialRecord.notes || "");
      } else {
        setAmount(defaultAmount || 0);
        const d = new Date();
        d.setDate(d.getDate() + 3);
        setDate(d.toISOString().split("T")[0]);
        setNotes("");
      }
      setErrorMsg(null);
    }
  }, [isOpen, defaultAmount, initialRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg("Promised amount must be greater than zero.");
      return;
    }
    if (!date) {
      setErrorMsg("Please select a valid promised date.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onSubmit(amount, new Date(date).toISOString(), notes);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Failed to record promise-to-pay commitment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="font-semibold text-sm">
              {initialRecord ? "Edit Promise-to-Pay (P2P) Commitment" : "Log Promise-to-Pay (P2P) Commitment"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-gray-500 font-normal">
            Record customer&apos;s explicit promise to settle payment on a agreed date for Case <span className="font-mono font-semibold text-gray-900">{caseId}</span>.
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Promised Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 block">Promised Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                placeholder="15000"
                min="1"
                required
              />
            </div>
          </div>

          {/* Promised Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 block">Promised Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
              required
            />
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 block">Commitment Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={512}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
              placeholder="e.g. Customer promised salary will credit on 30th Aug and will clear payment link."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {initialRecord ? "Update P2P Commitment" : "Save P2P Commitment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
