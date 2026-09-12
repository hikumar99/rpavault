"use client";

import React from "react";
import { Link, Repeat, CalendarDays, X, Filter } from "lucide-react";
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
  allTags,
  onSelectTag,
  totalFiltered,
}) => {
  const hasActiveFilters =
    filterState.hasLink ||
    filterState.isRecurring ||
    filterState.weekday !== null ||
    selectedTag !== null;

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
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2 px-1 text-xs select-none">
      <div className="flex items-center gap-1 text-slate-400 dark:text-gray-500 mr-1 shrink-0 font-medium">
        <Filter className="w-3.5 h-3.5 text-[#4772fa]" />
        <span className="text-[11px] uppercase tracking-wider font-semibold">Filters:</span>
      </div>

      {/* Has Link Filter Button */}
      <button
        type="button"
        onClick={toggleLink}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition shrink-0 ${
          filterState.hasLink
            ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] shadow-sm font-semibold"
            : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-[#2b303c] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-gray-600"
        }`}
        title="Filter tasks with external links or URLs"
      >
        <Link className="w-3.5 h-3.5" />
        <span>With Links</span>
        {filterState.hasLink && <span className="ml-0.5 text-[10px] font-bold">✓</span>}
      </button>

      {/* Recurring Filter Button */}
      <button
        type="button"
        onClick={toggleRecurring}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition shrink-0 ${
          filterState.isRecurring
            ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] shadow-sm font-semibold"
            : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-[#2b303c] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-gray-600"
        }`}
        title="Filter recurring tasks"
      >
        <Repeat className="w-3.5 h-3.5" />
        <span>Recurring</span>
        {filterState.isRecurring && <span className="ml-0.5 text-[10px] font-bold">✓</span>}
      </button>

      {/* Weekday Filter Dropdown */}
      <div className="relative inline-flex items-center shrink-0">
        <select
          value={filterState.weekday || ""}
          onChange={(e) => selectWeekday((e.target.value as Weekday) || null)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition appearance-none pr-6 ${
            filterState.weekday
              ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] shadow-sm font-semibold"
              : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-[#2b303c] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-gray-600"
          }`}
          title="Filter tasks scheduled on a specific day of week"
        >
          <option value="" className="dark:bg-[#1a1d24]">📅 By Recur Day...</option>
          {WEEKDAYS.map((day) => (
            <option key={day} value={day} className="dark:bg-[#1a1d24]">
              {day}
            </option>
          ))}
        </select>
        <CalendarDays className="w-3 h-3 text-slate-400 dark:text-gray-500 absolute right-2 pointer-events-none" />
      </div>

      {/* Active Tag pill if filtered */}
      {selectedTag && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold shrink-0">
          <span>#{selectedTag}</span>
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

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition text-xs font-medium ml-auto shrink-0"
          title="Reset all active filters"
        >
          <X className="w-3 h-3" />
          <span>Clear filters</span>
        </button>
      )}
    </div>
  );
};
