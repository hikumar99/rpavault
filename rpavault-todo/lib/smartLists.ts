import { isToday, isTomorrow, isPast, addDays, parseISO, startOfDay } from "date-fns";
import { Task } from "./types";

export type SmartListType =
  | "today"
  | "tomorrow"
  | "next7"
  | "overdue"
  | "nodate"
  | "completed_today"
  | "all";

export function getTaskSmartLists(task: Task, now: Date = new Date()): SmartListType[] {
  const lists: SmartListType[] = ["all"];

  // Check if last edited today for "Today Updates"
  if (task.lastEditedTime) {
    try {
      if (isToday(parseISO(task.lastEditedTime))) {
        lists.push("completed_today");
      }
    } catch {}
  } else if (task.status === "Done" && task.due) {
    try {
      if (isToday(parseISO(task.due))) {
        lists.push("completed_today");
      }
    } catch {}
  }

  if (!task.due) {
    lists.push("nodate");
    return lists;
  }

  const dueDate = parseISO(task.due);
  const todayStart = startOfDay(now);
  const dueStart = startOfDay(dueDate);

  // Overdue if due is strictly before today and not done
  if (dueStart < todayStart && task.status !== "Done") {
    lists.push("overdue");
  }

  if (isToday(dueDate)) {
    lists.push("today");
  }

  if (isTomorrow(dueDate)) {
    lists.push("tomorrow");
  }

  const sevenDaysFromNow = addDays(todayStart, 7);
  if (dueStart >= todayStart && dueStart <= sevenDaysFromNow) {
    lists.push("next7");
  }

  return lists;
}

export function filterTasks(
  tasks: Task[],
  activeSmartList: SmartListType,
  selectedTag: string | null,
  selectedAssignee: string | null,
  now: Date = new Date()
): Task[] {
  return tasks.filter((task) => {
    // Tag filter
    if (selectedTag && (!task.tags || !task.tags.includes(selectedTag))) {
      return false;
    }

    // Assignee filter
    if (selectedAssignee && (!task.assignee || !task.assignee.includes(selectedAssignee))) {
      return false;
    }

    // Smart list filter
    const taskLists = getTaskSmartLists(task, now);
    return taskLists.includes(activeSmartList);
  });
}
