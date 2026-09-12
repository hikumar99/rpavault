"use client";

import React, { useState } from "react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { Repeat, Calendar, Check, ExternalLink } from "lucide-react";
import { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onSelect: (task: Task) => void;
  onComplete: (task: Task) => Promise<void>;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  isSelected,
  onSelect,
  onComplete,
}) => {
  const [completing, setCompleting] = useState(false);
  const isDone = task.status === "Done";

  async function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (completing) return;
    setCompleting(true);
    try {
      await onComplete(task);
    } finally {
      setCompleting(false);
    }
  }

  let dateBadgeClass = "text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-500/10 border-slate-200 dark:border-gray-500/20";
  let formattedDate = "";

  if (task.due) {
    try {
      const parsedDate = parseISO(task.due);
      const hasTime = task.due.includes("T");
      const timeStr = hasTime ? format(parsedDate, "h:mm a") : "";

      if (isPast(parsedDate) && !isToday(parsedDate) && !isDone) {
        dateBadgeClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30";
      } else if (isToday(parsedDate)) {
        dateBadgeClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
      } else if (isTomorrow(parsedDate)) {
        dateBadgeClass = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30";
      } else {
        dateBadgeClass = "text-[#4772fa] bg-[#4772fa]/10 border-[#4772fa]/30";
      }

      if (isToday(parsedDate)) {
        formattedDate = timeStr ? `Today, ${timeStr}` : "Today";
      } else if (isTomorrow(parsedDate)) {
        formattedDate = timeStr ? `Tomorrow, ${timeStr}` : "Tomorrow";
      } else {
        formattedDate = format(parsedDate, hasTime ? "MMM d, h:mm a" : "MMM d");
      }
    } catch {
      formattedDate = task.due;
    }
  }


  return (
    <div
      onClick={() => onSelect(task)}
      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition cursor-pointer select-none ${
        isSelected
          ? "bg-[#4772fa]/10 dark:bg-[#252a37] border-[#4772fa]/60 shadow-sm"
          : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-[#2b303c] hover:border-slate-300 dark:hover:border-[#3a4152] hover:bg-slate-50 dark:hover:bg-[#1e222b]"
      } ${completing ? "opacity-40 transition-opacity duration-300" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Circular Checkbox */}
        <button
          onClick={handleCheckboxClick}
          disabled={completing}
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
            isDone
              ? "bg-[#4772fa] border-[#4772fa] text-white"
              : "border-slate-400 dark:border-gray-500 hover:border-[#4772fa] hover:bg-[#4772fa]/10 text-transparent hover:text-white"
          }`}
          title={task.recurInt ? "Complete & Reschedule" : "Mark as completed"}
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </button>

        {/* Task Name & Recurrence */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`text-sm truncate font-medium ${
              isDone
                ? "line-through text-slate-400 dark:text-gray-500"
                : "text-slate-800 dark:text-gray-200 group-hover:text-slate-950 dark:group-hover:text-white"
            }`}
          >
            {task.name}
          </span>

          {task.recurInt && (
            <span
              className="text-[11px] text-[#4772fa] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#4772fa]/10 shrink-0"
              title={`Recurs every ${task.recurInt} ${task.recurUnit || "days"}`}
            >
              <Repeat className="w-2.5 h-2.5" />
            </span>
          )}

          {task.url && (
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 dark:text-gray-500 hover:text-[#4772fa] transition shrink-0"
              title="Open linked URL"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2a3040] text-slate-600 dark:text-gray-300 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Due Date Badge */}
        {task.due && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium ${dateBadgeClass}`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Assignee Avatar(s) */}
        {task.assignee && task.assignee.length > 0 && (
          <div className="flex -space-x-1 overflow-hidden">
            {task.assignee.slice(0, 2).map((person, i) => (
              <div
                key={i}
                title={person}
                className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-[#1a1d24]"
              >
                {person.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
