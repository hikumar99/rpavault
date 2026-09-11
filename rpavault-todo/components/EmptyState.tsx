"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { SmartListType } from "@/lib/smartLists";

interface EmptyStateProps {
  listType: SmartListType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ listType }) => {
  const messages: Record<SmartListType, { title: string; subtitle: string }> = {
    today: {
      title: "Nothing due today 🎉",
      subtitle: "Enjoy your free time or plan ahead for tomorrow.",
    },
    tomorrow: {
      title: "Nothing due tomorrow",
      subtitle: "You are all caught up for tomorrow's agenda.",
    },
    next7: {
      title: "Clear horizon for the next 7 days",
      subtitle: "No pending deadlines scheduled this week.",
    },
    overdue: {
      title: "No overdue tasks 🙌",
      subtitle: "You are right on track with all your deliverables.",
    },
    nodate: {
      title: "No inbox tasks without dates",
      subtitle: "All your tasks have assigned timelines.",
    },
    completed_today: {
      title: "No tasks updated today yet",
      subtitle: "Any tasks edited or completed today will appear here.",
    },
    all: {
      title: "No tasks found",
      subtitle: "Start by typing in the quick-add bar above.",
    },
  };

  const info = messages[listType] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none">
      <div className="w-14 h-14 rounded-2xl bg-[#4772fa]/10 border border-[#4772fa]/20 flex items-center justify-center text-[#4772fa] mb-3">
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-white">{info.title}</h3>
      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-xs">{info.subtitle}</p>
    </div>
  );
};
