export type TaskStatus = "To Do" | "Doing" | "Done";

export type RecurUnit =
  | "Day(s)"
  | "Week(s)"
  | "Month(s)"
  | "Month(s) on the First Weekday"
  | "Month(s) on the Last Weekday"
  | "Month(s) on the Last Day"
  | "Year(s)"
  | "Nth Weekday of Month";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TaskTag = "RPAVAULT" | "Bookmark" | "Email" | "AI";

export interface AssigneeDetail {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdTime: string;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  due?: string | null;       // ISO date or datetime string
  dueEnd?: string | null;    // ISO end date if range
  assignee?: string[] | null;
  assigneeDetails?: AssigneeDetail[] | null;
  recurInt?: number | null;
  recurUnit?: RecurUnit | null;
  days?: Weekday[] | null;
  tags?: string[] | null;
  parentId?: string | null;
  subtaskIds?: string[] | null;
  url?: string | null;
  description?: string | null;
  createdTime?: string;
  lastEditedTime?: string;
}

export interface CreateTaskInput {
  name: string;
  status?: TaskStatus;
  due?: string | null;
  dueEnd?: string | null;
  assignee?: string[] | null;
  recurInt?: number | null;
  recurUnit?: RecurUnit | null;
  days?: Weekday[] | null;
  tags?: string[] | null;
  parentId?: string | null;
  url?: string | null;
  description?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  status?: TaskStatus;
  due?: string | null;
  dueEnd?: string | null;
  assignee?: string[] | null;
  recurInt?: number | null;
  recurUnit?: RecurUnit | null;
  days?: Weekday[] | null;
  tags?: string[] | null;
  parentId?: string | null;
  url?: string | null;
  description?: string | null;
}
