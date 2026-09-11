"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RotateCw,
  Clock,
  Menu,
  X,
  Search,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Task, AssigneeDetail } from "@/lib/types";
import { SmartListType, getTaskSmartLists, filterTasks } from "@/lib/smartLists";
import { Sidebar } from "@/components/Sidebar";
import { QuickAddBar } from "@/components/QuickAddBar";
import { TaskRow } from "@/components/TaskRow";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { NotionSetupScreen } from "@/components/NotionSetupScreen";

export default function AppPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<AssigneeDetail[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeList, setActiveList] = useState<SmartListType>("today");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [panelWidth, setPanelWidth] = useState(384);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState("Kumar");

  const quickAddRef = useRef<HTMLInputElement>(null);
  const lastUserEditTimeRef = useRef<Record<string, number>>({});

  // Sync dark class to root HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Load Session User
  async function fetchSession() {
    try {
      const res = await fetch("/2do/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.displayName) {
        setCurrentUser(data.displayName);
      }
    } catch {}
  }

  // Load Notion users
  async function fetchUsers() {
    try {
      const res = await fetch("/2do/api/users");
      const data = await res.json();
      if (res.ok && data.success && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to load Notion users:", e);
    }
  }

  // 1. Fetch tasks from server
  async function fetchTasks(isBackground = false) {
    if (!isBackground) setSyncing(true);
    try {
      const res = await fetch("/2do/api/tasks");

      if (res.status === 401 || res.redirected || res.url.includes("/login")) {
        router.push("/login");
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        if (text.includes("<!DOCTYPE") || text.includes("/login")) {
          router.push("/login");
          return;
        }
        throw new Error("Server returned non-JSON response");
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isNotionError) {
          setNotionError(data.error);
        } else {
          toast.error(data.error || "Failed to load tasks");
        }
        return;
      }

      setNotionError(null);
      const incomingTasks: Task[] = data.tasks || [];

      // Safe merge strategy preserving local edits within 10s
      setTasks((prevTasks) => {
        const nowMs = Date.now();
        const merged = [...incomingTasks];

        for (let i = 0; i < merged.length; i++) {
          const incoming = merged[i];
          const lastTouch = lastUserEditTimeRef.current[incoming.id] || 0;
          if (nowMs - lastTouch < 10000) {
            const local = prevTasks.find((t) => t.id === incoming.id);
            if (local) {
              merged[i] = local;
            }
          }
        }
        return merged;
      });

      setLastSyncedAt(new Date());
      if (!isBackground) {
        toast.success("Tasks synced successfully");
      }
    } catch (err: any) {
      if (!isBackground) toast.error("Sync failed: " + err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    fetchSession();
    fetchTasks();
    fetchUsers();

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const pollInterval = setInterval(() => {
      fetchTasks(true);
    }, 120000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, []);

  // Keyboard Shortcuts: Q/N focuses quick-add and auto-closes right detail panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
          setSelectedTask(null);
        }
        return;
      }

      if (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        setSelectedTask(null);
        quickAddRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelectedTask(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute list counts
  const taskCounts = useMemo(() => {
    const counts: Record<SmartListType, number> = {
      today: 0,
      tomorrow: 0,
      next7: 0,
      overdue: 0,
      nodate: 0,
      completed_today: 0,
      all: 0,
    };

    tasks.forEach((t) => {
      if (hideCompleted && t.status === "Done" && activeList !== "completed_today") {
        return;
      }
      const lists = getTaskSmartLists(t, currentTime);
      lists.forEach((l) => counts[l]++);
    });

    return counts;
  }, [tasks, currentTime, hideCompleted, activeList]);

  // Distinct tags and assignees
  const allTags = useMemo(() => {
    const set = new Set<string>(["RPAVAULT", "Bookmark", "Email", "AI", ...customTags]);
    tasks.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks, customTags]);

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.assignee?.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [tasks]);

  function handleAddTag(tag: string) {
    if (!customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
      toast.success(`Tag #${tag} created`);
    }
  }

  // Filter and sort tasks
  const displayedTasks = useMemo(() => {
    let filtered = filterTasks(tasks, activeList, selectedTag, selectedAssignee, currentTime);

    if (hideCompleted && activeList !== "completed_today") {
      filtered = filtered.filter((t) => t.status !== "Done");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(query));
    }

    return filtered.sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });
  }, [tasks, activeList, selectedTag, selectedAssignee, currentTime, searchQuery, hideCompleted]);

  // Actions
  async function handleAddTask(title: string, dueDate: string | null) {
    try {
      const initialTags = selectedTag ? [selectedTag] : [];
      let initialAssignee: string[] = [];
      if (selectedAssignee) {
        const foundUser = users.find((u) => u.name.toLowerCase() === selectedAssignee.toLowerCase());
        initialAssignee = [foundUser ? foundUser.id : selectedAssignee];
      }

      const res = await fetch("/2do/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          status: "To Do",
          due: dueDate,
          tags: initialTags,
          assignee: initialAssignee,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) => [data.task, ...prev]);
        toast.success("Task created");
        // Auto-close detail panel and show fresh list
        setSelectedTask(null);
      } else {
        toast.error(data.error || "Could not create task");
      }
    } catch (err: any) {
      toast.error("Failed to create task: " + err.message);
    }
  }

  async function handleCompleteTask(task: Task) {
    try {
      if (task.status === "Done") {
        // Toggle back to To Do
        const res = await fetch(`/2do/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "To Do" }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const updated = data.task;
          lastUserEditTimeRef.current[task.id] = Date.now();
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
          if (selectedTask?.id === task.id) {
            setSelectedTask(updated);
          }
          toast.success("Task reopened as To Do");
        } else {
          toast.error(data.error || "Failed to reopen task");
        }
        return;
      }

      // If not Done, mark complete or reschedule
      const res = await fetch(`/2do/api/tasks/${task.id}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = data.task;
        lastUserEditTimeRef.current[task.id] = Date.now();

        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        if (selectedTask?.id === task.id) {
          setSelectedTask(updated);
        }

        if (task.recurInt) {
          toast.success(`Rescheduled to ${updated.due || "next interval"}`);
        } else {
          toast.success("Task marked as completed");
        }
      } else {
        toast.error(data.error || "Failed to update task");
      }
    } catch (err: any) {
      toast.error("Error updating task: " + err.message);
    }
  }

  function handleOpenNewTaskDraft() {
    const draftId = `draft-${Date.now()}`;
    const draftTask: Task = {
      id: draftId,
      name: "",
      status: "To Do",
      due: null,
      assignee: selectedAssignee
        ? [users.find((u) => u.name.toLowerCase() === selectedAssignee.toLowerCase())?.id || selectedAssignee]
        : [],
      tags: selectedTag ? [selectedTag] : [],
      description: "",
      subtaskIds: [],
    };
    setSelectedTask(draftTask);
  }

  async function handleUpdateTask(id: string, updates: Partial<Task>) {
    // If it is a draft task being created
    if (id.startsWith("draft-")) {
      const mergedDraft = { ...(selectedTask || {}), ...updates } as Task;
      setSelectedTask(mergedDraft);

      // If a task name has been provided, create it on the backend
      if (updates.name && updates.name.trim()) {
        try {
          const res = await fetch("/2do/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: mergedDraft.name,
              status: mergedDraft.status || "To Do",
              due: mergedDraft.due || null,
              assignee: mergedDraft.assignee || [],
              recurInt: mergedDraft.recurInt || null,
              recurUnit: mergedDraft.recurUnit || null,
              days: mergedDraft.days || [],
              tags: mergedDraft.tags || [],
              url: mergedDraft.url || null,
              description: mergedDraft.description || "",
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setTasks((prev) => [data.task, ...prev]);
            setSelectedTask(data.task);
            toast.success("Task created");
          }
        } catch {
          toast.error("Failed to create task");
        }
      }
      return;
    }

    lastUserEditTimeRef.current[id] = Date.now();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      const res = await fetch(`/2do/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      }
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function handleDeleteTask(id: string) {
    if (id.startsWith("draft-")) {
      setSelectedTask(null);
      return;
    }
    try {
      const res = await fetch(`/2do/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (selectedTask?.id === id) setSelectedTask(null);
        toast.success("Task deleted");
      }
    } catch {
      toast.error("Failed to delete task");
    }
  }

  async function handleCreateSubtask(parentId: string, title: string) {
    try {
      const res = await fetch("/2do/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          status: "To Do",
          parentId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) => [data.task, ...prev]);
        toast.success("Subtask added");
      }
    } catch {
      toast.error("Failed to add subtask");
    }
  }

  async function handleLogout() {
    await fetch("/2do/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (notionError) {
    return <NotionSetupScreen errorMessage={notionError} onRetry={() => fetchTasks(false)} />;
  }

  const listTitles: Record<SmartListType, string> = {
    today: "Today",
    tomorrow: "Tomorrow",
    next7: "Next 7 Days",
    overdue: "Overdue",
    nodate: "No Date",
    completed_today: "Today Updates",
    all: "All Tasks",
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-[#111317] text-slate-900 dark:text-white ${isDark ? "dark" : ""}`}>
      {/* Desktop Sidebar (Adjustable width) */}
      <div className="hidden md:flex h-full">
        <Sidebar
          activeList={activeList}
          setActiveList={(list) => {
            setActiveList(list);
            setSelectedTask(null); // auto close right panel when navigating
          }}
          selectedTag={selectedTag}
          setSelectedTag={(tag) => {
            setSelectedTag(tag);
            setSelectedTask(null);
          }}
          selectedAssignee={selectedAssignee}
          setSelectedAssignee={(assignee) => {
            setSelectedAssignee(assignee);
            setSelectedTask(null);
          }}
          taskCounts={taskCounts}
          allTags={allTags}
          allAssignees={allAssignees}
          users={users}
          onAddTag={handleAddTag}
          isDark={isDark}
          setIsDark={setIsDark}
          hideCompleted={hideCompleted}
          setHideCompleted={setHideCompleted}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          currentUser={currentUser}
          onLogout={handleLogout}
          onQuickAddFocus={() => {
            setSelectedTask(null);
            quickAddRef.current?.focus();
          }}
          onNewTask={handleOpenNewTaskDraft}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-72 h-full bg-white dark:bg-[#16181d] shadow-2xl relative">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3 p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              activeList={activeList}
              setActiveList={(l) => {
                setActiveList(l);
                setSelectedTask(null);
                setMobileMenuOpen(false);
              }}
              selectedTag={selectedTag}
              setSelectedTag={(t) => {
                setSelectedTag(t);
                setSelectedTask(null);
                setMobileMenuOpen(false);
              }}
              selectedAssignee={selectedAssignee}
              setSelectedAssignee={(a) => {
                setSelectedAssignee(a);
                setSelectedTask(null);
                setMobileMenuOpen(false);
              }}
              taskCounts={taskCounts}
              allTags={allTags}
              allAssignees={allAssignees}
              users={users}
              onAddTag={handleAddTag}
              isDark={isDark}
              setIsDark={setIsDark}
              hideCompleted={hideCompleted}
              setHideCompleted={setHideCompleted}
              sidebarWidth={288}
              setSidebarWidth={() => {}}
              currentUser={currentUser}
              onLogout={handleLogout}
              onQuickAddFocus={() => {
                setMobileMenuOpen(false);
                setSelectedTask(null);
                quickAddRef.current?.focus();
              }}
              onNewTask={() => {
                setMobileMenuOpen(false);
                handleOpenNewTaskDraft();
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#13151b] border-r border-slate-200 dark:border-transparent">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 dark:border-[#242833] px-4 md:px-6 flex items-center justify-between bg-slate-50/70 dark:bg-[#161820] backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#232731]"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {selectedTag
                ? `#${selectedTag}`
                : selectedAssignee
                ? `Assigned: ${selectedAssignee}`
                : listTitles[activeList]}
            </h1>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
              ({displayedTasks.length})
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white dark:bg-[#1e222b] border border-slate-300 dark:border-[#2e3340] rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#4772fa] w-36 md:w-48"
              />
            </div>

            {/* Hide completed button */}
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
                hideCompleted
                  ? "bg-[#4772fa]/10 border-[#4772fa]/30 text-[#4772fa]"
                  : "bg-white dark:bg-[#20242e] border-slate-300 dark:border-[#2f3544] text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Toggle hidden status for completed tasks"
            >
              {hideCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{hideCompleted ? "Completed hidden" : "Showing all"}</span>
            </button>

            {/* Sync Now button */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
              {lastSyncedAt && (
                <span className="hidden xl:inline text-[11px] text-slate-400 dark:text-gray-500">
                  Synced {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
                </span>
              )}
              <button
                onClick={() => fetchTasks(false)}
                disabled={syncing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#20242e] hover:bg-slate-100 dark:hover:bg-[#282e3b] border border-slate-300 dark:border-[#2f3544] text-slate-700 dark:text-gray-200 transition text-xs shadow-sm"
                title="Sync now"
              >
                <RotateCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#4772fa]" : ""}`} />
                <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync now"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl w-full mx-auto">
          <QuickAddBar
            inputRef={quickAddRef}
            onAddTask={handleAddTask}
            onOpenFullDetail={handleOpenNewTaskDraft}
          />

          {/* Loading Skeletons */}
          {loading ? (
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-[#262a34] animate-pulse"
                />
              ))}
            </div>
          ) : displayedTasks.length === 0 ? (
            <EmptyState listType={activeList} />
          ) : (
            <div className="space-y-1.5 mt-2">
              {displayedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onSelect={(t) => {
                    // Toggle selection: if already selected, close it
                    if (selectedTask?.id === t.id) {
                      setSelectedTask(null);
                    } else {
                      setSelectedTask(t);
                    }
                  }}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Right Task Detail Panel (freely adjustable width) */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          allTasks={tasks}
          users={users}
          allTags={allTags}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onCreateSubtask={handleCreateSubtask}
          panelWidth={panelWidth}
          setPanelWidth={setPanelWidth}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
