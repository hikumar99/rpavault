"use client";

import React, { useState } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Tag as TagIcon,
  LogOut,
  Moon,
  Sun,
  Plus,
  Eye,
  EyeOff,
  UserCheck,
  History,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { SmartListType } from "@/lib/smartLists";
import { AssigneeDetail } from "@/lib/types";

interface SidebarProps {
  activeList: SmartListType;
  setActiveList: (list: SmartListType) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  selectedAssignee: string | null;
  setSelectedAssignee: (assignee: string | null) => void;
  taskCounts: Record<SmartListType, number>;
  allTags: string[];
  allAssignees: string[];
  users: AssigneeDetail[];
  onAddTag: (tag: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  hideCompleted: boolean;
  setHideCompleted: (hide: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
  currentUser: string;
  onLogout: () => void;
  onQuickAddFocus: () => void;
  onNewTask?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeList,
  setActiveList,
  selectedTag,
  setSelectedTag,
  selectedAssignee,
  setSelectedAssignee,
  taskCounts,
  allTags,
  allAssignees,
  users,
  onAddTag,
  isDark,
  setIsDark,
  hideCompleted,
  setHideCompleted,
  sidebarWidth,
  setSidebarWidth,
  currentUser,
  onLogout,
  onQuickAddFocus,
  onNewTask,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [usersExpanded, setUsersExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const smartLists: { id: SmartListType; label: string; icon: any; countKey: SmartListType; color: string }[] = [
    { id: "today", label: "Today", icon: Calendar, countKey: "today", color: "text-[#4772fa]" },
    { id: "tomorrow", label: "Tomorrow", icon: CalendarDays, countKey: "tomorrow", color: "text-amber-500" },
    { id: "next7", label: "Next 7 Days", icon: CalendarCheck, countKey: "next7", color: "text-purple-500" },
    { id: "overdue", label: "Overdue", icon: AlertCircle, countKey: "overdue", color: "text-rose-500" },
    { id: "nodate", label: "No Date", icon: Inbox, countKey: "nodate", color: "text-gray-400 dark:text-gray-400" },
    { id: "completed_today", label: "Today Updates", icon: History, countKey: "completed_today", color: "text-emerald-500" },
    { id: "all", label: "All Tasks", icon: CheckCircle2, countKey: "all", color: "text-blue-500" },
  ];

  function startResizing(e: React.MouseEvent) {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(moveEvent: MouseEvent) {
      const newWidth = Math.max(180, Math.min(480, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    }

    function onMouseUp() {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function handleCreateTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = newTagName.trim().replace(/^#/, "");
    if (!clean) return;
    onAddTag(clean);
    setNewTagName("");
    setShowAddTagModal(false);
  }

  // Filter out any raw UUID format string and replace with clean names
  const cleanAssigneeNames = Array.from(
    new Set([
      ...allAssignees.map((a) => (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a) ? "Guest Member" : a)),
      ...users.map((u) => u.name),
    ])
  ).filter(Boolean);

  const filteredTags = allTags.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex flex-col h-full select-none shrink-0 transition-none border-r border-slate-200 dark:border-[#262930] bg-slate-50 dark:bg-[#16181d] text-slate-800 dark:text-slate-200"
    >
      {/* Draggable Resizer on Right Edge */}
      <div
        onMouseDown={startResizing}
        className="hidden md:block absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#4772fa]/50 transition z-30"
        title="Drag to resize sidebar width freely"
      />

      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#262930] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4772fa] flex items-center justify-center text-white shadow-md shadow-[#4772fa]/30 font-bold text-sm">
            ✓
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm tracking-tight truncate text-slate-900 dark:text-white">RPAVault</h2>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">Team To-Do's</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#232731] transition"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Navigation & Lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Toggle hide completed */}
        <div className="px-1">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              hideCompleted
                ? "bg-[#4772fa]/10 border-[#4772fa]/30 text-[#4772fa]"
                : "border-slate-200 dark:border-[#2b303c] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#1a1d24]"
            }`}
          >
            <div className="flex items-center gap-2">
              {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Hide Completed</span>
            </div>
            <span className="text-[10px] font-semibold">{hideCompleted ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Smart Lists */}
        <div>
          <div className="px-2 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-gray-500">Smart Lists</span>
            <button
              onClick={() => {
                if (onNewTask) onNewTask();
                else onQuickAddFocus();
              }}
              className="p-1 rounded-md text-slate-400 dark:text-gray-400 hover:text-[#4772fa] hover:bg-slate-200 dark:hover:bg-[#232731] transition"
              title="Create new task with full details"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-0.5">
            {smartLists.map((item) => {
              const Icon = item.icon;
              const isActive = activeList === item.id && !selectedTag && !selectedAssignee;
              const count = taskCounts[item.countKey] || 0;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveList(item.id);
                    setSelectedTag(null);
                    setSelectedAssignee(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-[#4772fa]/10 dark:bg-[#232836] text-[#4772fa] dark:text-white font-semibold shadow-sm"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#1e222b] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {count > 0 && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full shrink-0 ${
                        item.id === "overdue"
                          ? "bg-rose-500/20 text-rose-500 dark:text-rose-400 font-bold"
                          : item.id === "completed_today"
                          ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold"
                          : isActive
                          ? "bg-[#4772fa]/20 text-[#4772fa]"
                          : "text-slate-400 dark:text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Assigned To Section with Toggle Collapse Button */}
        <div>
          <button
            onClick={() => setUsersExpanded(!usersExpanded)}
            className="w-full px-2 pb-1.5 flex items-center justify-between text-left group"
          >
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-gray-500 group-hover:text-slate-800 dark:group-hover:text-white transition flex items-center gap-1.5">
              {usersExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Assignee ({cleanAssigneeNames.length})
            </span>
          </button>

          {usersExpanded && (
            <div className="space-y-0.5 pl-1">
              <button
                onClick={() => {
                  if (selectedAssignee === "Kumar") {
                    setSelectedAssignee(null);
                  } else {
                    setSelectedAssignee("Kumar");
                    setSelectedTag(null);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                  selectedAssignee === "Kumar"
                    ? "bg-[#4772fa]/10 dark:bg-[#232836] text-[#4772fa] font-semibold"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#1e222b] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-3.5 h-3.5 text-[#4772fa]" />
                  <span className="truncate font-medium">My Tasks (Kumar)</span>
                </div>
              </button>

              {cleanAssigneeNames.map((assignee) => {
                const isSelected = selectedAssignee === assignee;
                return (
                  <button
                    key={assignee}
                    onClick={() => {
                      setSelectedAssignee(isSelected ? null : assignee);
                      setSelectedTag(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                      isSelected
                        ? "bg-[#4772fa]/10 dark:bg-[#232836] text-[#4772fa] font-semibold"
                        : "text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#1e222b] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-gray-600 text-slate-800 dark:text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {assignee.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{assignee}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Section with Toggle Collapse Button & Plus (+) Add Tag Button */}
        <div>
          <div className="px-2 pb-1.5 flex items-center justify-between">
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center gap-1.5 text-left group"
            >
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-gray-500 group-hover:text-slate-800 dark:group-hover:text-white transition flex items-center gap-1.5">
                {tagsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Tags ({allTags.length})
              </span>
            </button>

            <button
              onClick={() => setShowAddTagModal(true)}
              className="p-1 rounded-md text-slate-500 dark:text-gray-400 hover:text-[#4772fa] hover:bg-slate-200 dark:hover:bg-[#232731] transition"
              title="Create new tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {tagsExpanded && (
            <div className="space-y-1.5 pl-1">
              {allTags.length > 5 && (
                <div className="relative mb-1">
                  <Search className="w-3 h-3 text-slate-400 dark:text-gray-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2b303c] rounded-lg text-[11px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#4772fa]"
                  />
                </div>
              )}

              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(isSelected ? null : tag);
                        setSelectedAssignee(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                        isSelected
                          ? "bg-[#4772fa]/10 dark:bg-[#232836] text-[#4772fa] font-semibold"
                          : "text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#1e222b] hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TagIcon className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400 shrink-0" />
                        <span className="truncate">#{tag}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Tag Modal */}
      {showAddTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2e3340] rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Create New Tag</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">Add a tag to categorize team to-dos.</p>
            <form onSubmit={handleCreateTagSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Finance, Sprint1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddTagModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#232731]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="px-3 py-1.5 bg-[#4772fa] hover:bg-[#3861ea] disabled:opacity-40 text-white rounded-xl text-xs font-medium"
                >
                  Add Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-[#262930] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#4772fa] to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow shrink-0">
            {currentUser.charAt(0).toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{currentUser}</p>
            <p className="text-[10px] text-slate-500 dark:text-gray-500">
              {currentUser.toLowerCase() === "kumar" || currentUser.toLowerCase() === "admin" ? "Admin Role" : "Team Member"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-[#232731] rounded-lg transition shrink-0"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
