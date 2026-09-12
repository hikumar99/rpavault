"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Tag,
  Repeat,
  Link as LinkIcon,
  Trash2,
  CheckSquare,
  Plus,
  Loader2,
  ExternalLink,
  Users,
  FileText,
  Clock,
  ChevronDown,
  Search,
  MessageSquare,
  Image as ImageIcon,
  AtSign,
  Send,
  Check,
  Maximize2,
} from "lucide-react";
import { Task, RecurUnit, Weekday, AssigneeDetail, TaskComment } from "@/lib/types";
import { computeNextDue } from "@/lib/recurrence";
import { formatDistanceToNow, parseISO } from "date-fns";
import { apiPath } from "@/lib/config";
import { DescriptionModal } from "./DescriptionModal";

interface TaskDetailPanelProps {
  task: Task | null;
  allTasks: Task[];
  users: AssigneeDetail[];
  allTags: string[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateSubtask: (parentId: string, title: string) => Promise<void>;
  panelWidth: number;
  setPanelWidth: (w: number) => void;
  currentUser?: string;
}

const RECUR_UNITS: RecurUnit[] = [
  "Day(s)",
  "Week(s)",
  "Month(s)",
  "Month(s) on the First Weekday",
  "Month(s) on the Last Weekday",
  "Month(s) on the Last Day",
  "Year(s)",
  "Nth Weekday of Month",
];

const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  allTasks,
  users,
  allTags,
  onClose,
  onUpdate,
  onDelete,
  onCreateSubtask,
  panelWidth,
  setPanelWidth,
  currentUser = "Kumar",
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [status, setStatus] = useState<Task["status"]>("To Do");
  const [assignee, setAssignee] = useState<string[]>([]);
  const [recurInt, setRecurInt] = useState<number | "">("");
  const [recurUnit, setRecurUnit] = useState<RecurUnit | "">("");
  const [days, setDays] = useState<Weekday[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);

  // Tag Dropdown state
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagDropdownSearch, setTagDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [selectedTaggedUsers, setSelectedTaggedUsers] = useState<string[]>([]);

  function adjustTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`;
    }
  }

  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setDescription(task.description || "");
      setDue(task.due || "");
      setStatus(task.status || "To Do");
      setAssignee(task.assignee || []);
      setRecurInt(task.recurInt ?? "");
      setRecurUnit(task.recurUnit ?? "");
      setDays(task.days || []);
      setTags(task.tags || []);
      setUrl(task.url || "");
      setTimeout(adjustTextareaHeight, 10);
      if (task.id && !task.id.startsWith("draft-")) {
        loadComments(task.id);
      } else {
        setComments([]);
      }

      // If description not loaded yet, fetch it
      if (task.description === undefined && task.id && !task.id.startsWith("draft-")) {
        fetch(apiPath(`/api/tasks/${task.id}`))
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.task && data.task.description !== undefined) {
              setDescription(data.task.description || "");
              task.description = data.task.description || "";
              setTimeout(adjustTextareaHeight, 10);
            }
          })
          .catch(() => {});
      }
    }
  }, [task]);

  async function loadComments(taskId: string) {
    setCommentsLoading(true);
    try {
      const res = await fetch(apiPath(`/api/tasks/${taskId}/comments`));
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.comments || []);
      }
    } catch {
      // silent catch for comments
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!task) return null;

  const subtasks = allTasks.filter((t) => t.parentId === task.id);

  const nextDueDate = (recurInt && recurUnit)
    ? computeNextDue({
        due: due || undefined,
        recurInt: typeof recurInt === "number" ? recurInt : undefined,
        recurUnit: (recurUnit as RecurUnit) || undefined,
        days,
      })
    : null;

  function startResizing(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    function onMouseMove(moveEvent: MouseEvent) {
      const newWidth = Math.max(300, Math.min(720, startWidth - (moveEvent.clientX - startX)));
      setPanelWidth(newWidth);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  async function handleAutoSave(fieldUpdates: Partial<Task>) {
    if (!task) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setSyncStatus("saving");
    try {
      await onUpdate(task.id, fieldUpdates);
      setSyncStatus("saved");
      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2500);
    } catch {
      setSyncStatus("idle");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiPath("/api/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        const fullUrl = data.url.startsWith("http://") || data.url.startsWith("https://")
          ? data.url
          : `${window.location.origin}${apiPath(data.url)}`;
        const cleanName = data.name || "Image";
        const markdownImg = `\n![${cleanName}](${fullUrl})\n`;
        const updatedDesc = (description || "") + markdownImg;
        setDescription(updatedDesc);
        await handleAutoSave({ description: updatedDesc });
      }
    } catch {
      console.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentInput.trim() || !task) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(apiPath(`/api/tasks/${task.id}/comments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentInput.trim(),
          taggedUserIds: selectedTaggedUsers,
          authorName: currentUser || "Kumar",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentInput("");
        setSelectedTaggedUsers([]);
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  function tagUserInComment(u: AssigneeDetail) {
    if (!selectedTaggedUsers.includes(u.id)) {
      setSelectedTaggedUsers((prev) => [...prev, u.id]);
    }
    setCommentInput((prev) => `${prev} @${u.name} `);
    setShowMentionDropdown(false);
  }

  function removeTag(tagToRemove: string) {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    handleAutoSave({ tags: updated });
  }

  function addTag(tagToAdd: string) {
    if (tags.includes(tagToAdd)) return;
    const updated = [...tags, tagToAdd];
    setTags(updated);
    handleAutoSave({ tags: updated });
    setTagDropdownOpen(false);
  }

  function toggleDay(day: Weekday) {
    const updated = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    setDays(updated);
    handleAutoSave({ days: updated });
  }

  function toggleAssignee(userObj: AssigneeDetail) {
    const isAlreadyAssigned = assignee.some(
      (a) => a === userObj.id || a.toLowerCase() === userObj.name.toLowerCase()
    );

    let updated: string[];
    if (isAlreadyAssigned) {
      updated = assignee.filter(
        (a) => a !== userObj.id && a.toLowerCase() !== userObj.name.toLowerCase()
      );
    } else {
      updated = [...assignee, userObj.id];
    }
    setAssignee(updated);
    handleAutoSave({ assignee: updated });
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!subtaskTitle.trim() || !task) return;
    await onCreateSubtask(task.id, subtaskTitle.trim());
    setSubtaskTitle("");
  }

  async function handleDelete() {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task? It will be archived.")) {
      setDeleting(true);
      try {
        await onDelete(task.id);
        onClose();
      } finally {
        setDeleting(false);
      }
    }
  }

  const filteredDropdownTags = allTags.filter((t) =>
    t.toLowerCase().includes(tagDropdownSearch.toLowerCase())
  );

  const notionPageUrl = `https://notion.so/${task.id.replace(/-/g, "")}`;

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto border-l border-slate-200 dark:border-[#262930] bg-white dark:bg-[#16181d] text-slate-900 dark:text-slate-100 flex flex-col h-full overflow-y-auto select-none shadow-2xl md:shadow-none"
    >
      {/* Draggable Resizer on Left Edge of Right Panel */}
      <div
        onMouseDown={startResizing}
        className="hidden md:block absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#4772fa]/50 transition z-30"
        title="Drag left/right to adjust right panel width freely"
      />

      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-[#262930] flex items-center justify-between bg-slate-50/80 dark:bg-[#16181d]/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as Task["status"];
              setStatus(newStatus);
              handleAutoSave({ status: newStatus });
            }}
            className="bg-white dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
          >
            <option value="To Do">To Do</option>
            <option value="Doing">Doing</option>
            <option value="Done">Done</option>
          </select>

          {/* Sync indicator */}
          {syncStatus === "saving" && (
            <div className="flex items-center gap-1 text-[11px] text-[#4772fa]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          )}
          {syncStatus === "saved" && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-500 animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline font-medium">Saved</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[#232731] rounded-lg transition"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232731] rounded-lg transition"
            title="Close panel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Content */}
      <div className="p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Title Input (Auto-expanding, fully viewable for large titles) */}
        <div>
          <textarea
            ref={textareaRef}
            rows={1}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              adjustTextareaHeight();
            }}
            onBlur={() => handleAutoSave({ name })}
            placeholder="Task Name"
            className="w-full bg-transparent font-semibold text-lg text-slate-900 dark:text-white border-none focus:outline-none resize-none placeholder-slate-400 dark:placeholder-gray-500 leading-snug break-words overflow-hidden"
          />
        </div>

        {/* Allocate User / Assignee */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#4772fa]" />
              Assignee (Team / Guest)
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {users.map((u) => {
              const isSelected = assignee.some(
                (a) => a === u.id || a.toLowerCase() === u.name.toLowerCase()
              );
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition ${
                    isSelected
                      ? "bg-[#4772fa]/15 border-[#4772fa] text-[#4772fa] font-semibold"
                      : "bg-slate-100 dark:bg-[#20242e] border-slate-200 dark:border-[#2f3544] text-slate-700 dark:text-gray-300 hover:border-slate-400"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-gray-600 text-slate-800 dark:text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date with Quick Today shortcut */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#4772fa]" />
              Due Date & Time
            </label>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const day = String(now.getDate()).padStart(2, "0");
                const todayStr = `${year}-${month}-${day}T23:59`;
                setDue(todayStr);
                handleAutoSave({ due: todayStr });
              }}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#4772fa]/10 hover:bg-[#4772fa]/20 border border-[#4772fa]/30 text-[#4772fa] font-medium transition"
              title="Set due date to Today 11:59 PM"
            >
              Today
            </button>
          </div>
          <input
            type="datetime-local"
            value={due ? due.substring(0, 16) : ""}
            onChange={(e) => {
              const val = e.target.value;
              setDue(val);
              handleAutoSave({ due: val ? val : null });
            }}
            className="w-full bg-slate-50 dark:bg-[#20242e] border border-slate-300 dark:border-[#2f3544] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
          />
        </div>

        {/* Recurrence Rule */}
        <div className="border border-slate-200 dark:border-[#272c38] rounded-xl p-3 bg-slate-50 dark:bg-[#1a1e27] space-y-3">
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-[#4772fa]" />
              Recurrence
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Interval</span>
              <input
                type="number"
                min="1"
                placeholder="None"
                value={recurInt}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : "";
                  setRecurInt(val);
                  handleAutoSave({ recurInt: val === "" ? null : val });
                }}
                className="w-full bg-white dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
              />
            </div>

            <div className="col-span-2">
              <span className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Unit</span>
              <select
                value={recurUnit}
                onChange={(e) => {
                  const val = (e.target.value as RecurUnit) || "";
                  setRecurUnit(val);
                  handleAutoSave({ recurUnit: val === "" ? null : val });
                }}
                className="w-full bg-white dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
              >
                <option value="">No recurrence</option>
                {RECUR_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(recurUnit === "Day(s)" || recurUnit === "Nth Weekday of Month") && (
            <div>
              <span className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1.5">
                {recurUnit === "Nth Weekday of Month" ? "Select exactly one day:" : "Repeat on:"}
              </span>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => {
                  const active = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition ${
                        active
                          ? "bg-[#4772fa] border-[#4772fa] text-white font-medium"
                          : "bg-white dark:bg-[#232731] border-slate-300 dark:border-[#343a49] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {nextDueDate && (
            <div className="pt-2 border-t border-slate-200 dark:border-[#2f3544] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4772fa]" />
                Next upcoming:
              </span>
              <span className="font-semibold text-[#4772fa] bg-[#4772fa]/10 px-2 py-0.5 rounded-md border border-[#4772fa]/30">
                {nextDueDate.replace("T", " ")}
              </span>
            </div>
          )}
        </div>

        {/* Clean Tags Section */}
        <div ref={dropdownRef} className="relative">
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between mb-2">
            <span className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#4772fa]" />
              Tags ({tags.length})
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {tags.length > 0 ? (
              tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-[#4772fa]/15 border border-[#4772fa]/30 text-[#4772fa] font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-rose-500 ml-0.5"
                    title={`Remove #${t}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No tags attached</span>
            )}

            <button
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 dark:border-[#343a49] text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-[#4772fa] transition"
            >
              <Plus className="w-3 h-3" />
              <span>Select Tag</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          {tagDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-60 bg-white dark:bg-[#1f242e] border border-slate-200 dark:border-[#343a49] rounded-xl shadow-xl z-30 p-2 space-y-2">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  autoFocus
                  value={tagDropdownSearch}
                  onChange={(e) => setTagDropdownSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-6 pr-2 py-1 bg-slate-50 dark:bg-[#16181d] border border-slate-200 dark:border-[#2f3544] rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredDropdownTags.length > 0 ? (
                  filteredDropdownTags.map((t) => {
                    const isAlreadySelected = tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs text-left transition ${
                          isAlreadySelected
                            ? "bg-[#4772fa]/10 text-[#4772fa] font-semibold"
                            : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#2a3040]"
                        }`}
                      >
                        <span>#{t}</span>
                        {isAlreadySelected && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 p-2 text-center">No tags found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-[#4772fa]" />
            Subtasks ({subtasks.length})
          </label>

          <div className="space-y-1.5 mb-3">
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#20242e] border border-slate-200 dark:border-[#2f3544] text-xs text-slate-800 dark:text-gray-200"
              >
                <span className={sub.status === "Done" ? "line-through text-slate-400 dark:text-gray-500" : ""}>
                  {sub.name}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex gap-1.5">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              className="flex-1 bg-slate-50 dark:bg-[#20242e] border border-slate-300 dark:border-[#2f3544] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
            />
            <button
              type="submit"
              disabled={!subtaskTitle.trim()}
              className="px-2.5 py-1.5 bg-[#4772fa] hover:bg-[#3861ea] disabled:opacity-40 text-white rounded-lg text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Related URL */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
            <LinkIcon className="w-3.5 h-3.5 text-[#4772fa]" />
            Related URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => handleAutoSave({ url })}
              placeholder="https://..."
              className="flex-1 bg-slate-50 dark:bg-[#20242e] border border-slate-300 dark:border-[#2f3544] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa]"
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 dark:bg-[#232731] hover:bg-slate-200 dark:hover:bg-[#2b303c] border border-slate-300 dark:border-[#343a49] rounded-xl text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Description with Image Add/Upload Option */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#4772fa]" />
              Description
            </label>
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-1 text-[11px] text-[#4772fa] hover:text-[#3861ea] px-2 py-0.5 rounded-lg border border-[#4772fa]/30 bg-[#4772fa]/10 transition disabled:opacity-50"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3" />
                    <span>Attach Image</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDescModal(true)}
                className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded-lg border border-slate-300 dark:border-[#343a49] bg-slate-100 dark:bg-[#232731] hover:bg-slate-200 dark:hover:bg-[#2b303c] transition"
                title="Open expanded rich editor popup"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand Editor</span>
              </button>
            </div>
          </div>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleAutoSave({ description })}
            placeholder="Detailed notes or paste markdown images ![caption](url)... (Click Expand Editor for Notion-style blocks & rich tools)"
            className="w-full bg-slate-50 dark:bg-[#20242e] border border-slate-300 dark:border-[#2f3544] rounded-xl p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa] resize-y leading-relaxed"
          />

          {/* Expanded Rich Description Modal */}
          <DescriptionModal
            isOpen={showDescModal}
            onClose={() => {
              setShowDescModal(false);
              handleAutoSave({ description });
            }}
            description={description}
            onChange={(newDesc) => {
              setDescription(newDesc);
              handleAutoSave({ description: newDesc });
            }}
            taskTitle={name || "Task"}
          />

          {/* Embedded Image Previews */}
          {description && Array.from(description.matchAll(/!\[(.*?)\]\(((?:https?:\/\/|\/|data:image\/)[^\s)]+)\)/g)).length > 0 && (
            <div className="mt-2 space-y-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">Attached Images:</span>
              <div className="flex flex-wrap gap-2">
                {Array.from(description.matchAll(/!\[(.*?)\]\(((?:https?:\/\/|\/|data:image\/)[^\s)]+)\)/g)).map((match, idx) => (
                  <div key={idx} className="relative group border border-slate-200 dark:border-[#2f3544] rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                    <img
                      src={match[2]}
                      alt={match[1] || "Attachment"}
                      className="h-24 max-w-xs object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <a
                      href={match[2]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-medium transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Image
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Comments Section with User Tagging (@mention) */}
        <div className="border border-slate-200 dark:border-[#272c38] rounded-xl p-3.5 bg-slate-50 dark:bg-[#1a1e27] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#4772fa]" />
              Comments & Discussion ({comments.length})
            </label>
            {commentsLoading && <Loader2 className="w-3 h-3 animate-spin text-[#4772fa]" />}
          </div>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#20242e] border border-slate-200 dark:border-[#2f3544] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-gray-500">
                    <span className="font-semibold text-slate-800 dark:text-gray-200 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#4772fa]/20 text-[#4772fa] flex items-center justify-center text-[9px] font-bold">
                        {c.author.charAt(0).toUpperCase()}
                      </span>
                      {c.author}
                    </span>
                    {c.createdTime && (
                      <span>{formatDistanceToNow(parseISO(c.createdTime), { addSuffix: true })}</span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-gray-300 text-xs whitespace-pre-wrap">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-gray-500 italic py-1">No comments on this task yet.</p>
            )}
          </div>

          {/* Add Comment Form with @mention tag options */}
          <form onSubmit={handleAddComment} className="relative space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment... (use @ to tag team members)"
                className="w-full bg-white dark:bg-[#232731] border border-slate-300 dark:border-[#343a49] rounded-xl p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#4772fa] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              {/* @ tag trigger dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMentionDropdown(!showMentionDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#343a49] bg-white dark:bg-[#232731] text-[11px] text-slate-600 dark:text-gray-400 hover:text-[#4772fa] transition"
                  title="Tag team member"
                >
                  <AtSign className="w-3 h-3 text-[#4772fa]" />
                  <span>Tag user</span>
                </button>

                {showMentionDropdown && (
                  <div className="absolute left-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1f242e] border border-slate-200 dark:border-[#343a49] rounded-xl shadow-xl z-30 p-1.5 space-y-0.5">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => tagUserInComment(u)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-[#2a3040] text-slate-800 dark:text-white"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!commentInput.trim() || submittingComment}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#4772fa] hover:bg-[#3861ea] disabled:opacity-40 text-white rounded-lg text-xs font-medium transition shadow-sm"
              >
                {submittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Post</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* External Link at the Very End */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#262930] flex items-center justify-between text-xs text-slate-400 dark:text-gray-500">
          <span className="text-[11px]">Synced with cloud</span>
          <a
            href={notionPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20242e] hover:bg-slate-200 dark:hover:bg-[#2b303c] text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-[#2f3544] transition text-[11px] font-medium"
            title="Open original page"
          >
            <span>Open Original Page</span>
            <ExternalLink className="w-3 h-3 text-[#4772fa]" />
          </a>
        </div>
      </div>
    </div>
  );
};
