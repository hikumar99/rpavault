"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link, Repeat, CalendarDays, X, Filter, ChevronDown } from "lucide-react";
import { Weekday } from "@/lib/types";

export interface FilterState {
  hasLink: boolean;
  isRecurring: boolean;
  weekday: Weekday | null;
}

interface QuickFilterBarProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  selectedTag: string | null;
  onClearTag: () => void;
  allTags: string[];
  onSelectTag: (tag: string) => void;
  totalFiltered: number;
}

const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filterState,
  onFilterChange,
  selectedTag,
  onClearTag,
}) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeCount =
    (filterState.hasLink ? 1 : 0) +
    (filterState.isRecurring ? 1 : 0) +
    (filterState.weekday ? 1 : 0) +
    (selectedTag ? 1 : 0);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function toggleLink() {
    onFilterChange({ ...filterState, hasLink: !filterState.hasLink });
  }

  function toggleRecurring() {
    onFilterChange({ ...filterState, isRecurring: !filterState.isRecurring });
  }

  function selectWeekday(day: Weekday | null) {
    onFilterChange({ ...filterState, weekday: day });
  }

  function clearAll() {
    onFilterChange({ hasLink: false, isRecurring: false, weekday: null });
    if (selectedTag) onClearTag();
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Minimalist Header Icon Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition shadow-sm ${
          activeCount > 0
            ? "bg-[#4772fa]/10 border-[#4772fa]/40 text-[#4772fa] font-semibold"
            : "bg-white dark:bg-[#1e222b] border-slate-300 dark:border-[#2e3340] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
        }`}
        title="Filter tasks by links, recurrence, or day"
      >
        <Filter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#4772fa] text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c202a] border border-slate-200 dark:border-[#2d3342] rounded-xl shadow-xl z-50 p-3 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-[#282e3b]">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Filter Tasks</span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-rose-500 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Quick toggle options */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={toggleLink}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition border ${
                filterState.hasLink
                  ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] font-medium"
                  : "bg-slate-50 dark:bg-[#222733] border-transparent text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#282e3c]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Link className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400" />
                <span>With Links</span>
              </div>
              {filterState.hasLink && <span className="text-[11px] font-bold">✓</span>}
            </button>

            <button
              type="button"
              onClick={toggleRecurring}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition border ${
                filterState.isRecurring
                  ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] font-medium"
                  : "bg-slate-50 dark:bg-[#222733] border-transparent text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#282e3c]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400" />
                <span>Recurring Tasks</span>
              </div>
              {filterState.isRecurring && <span className="text-[11px] font-bold">✓</span>}
            </button>
          </div>

          {/* By Recur Day */}
          <div className="pt-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block mb-1">
              Recurring Day
            </label>
            <div className="relative">
              <select
                value={filterState.weekday || ""}
                onChange={(e) => selectWeekday((e.target.value as Weekday) || null)}
                className="w-full bg-slate-50 dark:bg-[#222733] border border-slate-200 dark:border-[#2d3342] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-gray-200 focus:outline-none focus:border-[#4772fa] cursor-pointer appearance-none pr-7"
              >
                <option value="">Any day</option>
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Active Tag pill if filtered */}
          {selectedTag && (
            <div className="flex items-center justify-between px-2 py-1 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
              <span>Tag: #{selectedTag}</span>
              <button
                type="button"
                onClick={onClearTag}
                className="hover:text-purple-800 dark:hover:text-purple-200 p-0.5"
                title="Clear tag filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
