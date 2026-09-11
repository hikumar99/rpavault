"use client";

import React, { useState } from "react";
import { Plus, Calendar, Loader2 } from "lucide-react";
import { parseNaturalLanguageTask } from "@/lib/dateParser";

interface QuickAddBarProps {
  inputRef: React.RefObject<HTMLInputElement>;
  onAddTask: (title: string, dueDate: string | null) => Promise<void>;
  onOpenFullDetail?: () => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ inputRef, onAddTask, onOpenFullDetail }) => {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsed = value.trim() ? parseNaturalLanguageTask(value) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { cleanText, dueDate } = parseNaturalLanguageTask(value);
      await onAddTask(cleanText, dueDate);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="relative flex items-center bg-white dark:bg-[#1e222b] border border-slate-300 dark:border-[#2e3340] rounded-xl px-3 py-2.5 shadow-sm focus-within:border-[#4772fa] focus-within:ring-1 focus-within:ring-[#4772fa] transition">
        <div className="text-slate-400 dark:text-gray-400 mr-2.5">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#4772fa]" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Add task (e.g. "Prepare client demo tomorrow 4pm #RPAVAULT")'
          disabled={isSubmitting}
          className="bg-transparent flex-1 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none"
        />

        {/* Live Detected Date Badge */}
        {parsed?.dueDate && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#4772fa]/15 border border-[#4772fa]/30 text-[#4772fa] text-xs font-medium mr-2 shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{parsed.dueDate.replace("T", " ")}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="submit"
            disabled={!value.trim() || isSubmitting}
            className="px-3 py-1 bg-[#4772fa] hover:bg-[#3861ea] disabled:opacity-30 text-white rounded-lg text-xs font-medium transition"
          >
            Add
          </button>
          {onOpenFullDetail && (
            <button
              type="button"
              onClick={onOpenFullDetail}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#282d39] hover:bg-slate-200 dark:hover:bg-[#343b4a] text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-[#3a4253] rounded-lg text-xs font-medium transition"
              title="Open full task panel with recurrence, assignee & description"
            >
              + Full Details
            </button>
          )}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-gray-500 flex justify-between px-1">
        <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] rounded text-[10px] text-slate-600 dark:text-gray-300">Q</kbd> to quick-add</span>
        <span className="hidden sm:inline">Natural language dates detected</span>
      </div>
    </form>
  );
};
