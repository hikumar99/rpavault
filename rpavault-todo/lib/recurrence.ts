import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  lastDayOfMonth,
  startOfMonth,
  getDay,
  format,
  parseISO,
  isBefore,
  startOfDay,
} from "date-fns";
import { Task, RecurUnit, Weekday } from "./types";

const WEEKDAY_INDEX_MAP: Record<Weekday, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const INDEX_TO_WEEKDAY: Record<number, Weekday> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/**
 * Pure function implementing recurrence math:
 * - Day(s): add Recur Int days to Due (or to today if Due is in the past)
 * - Week(s): add Recur Int * 7 days
 * - Month(s): add Recur Int months, same day-of-month
 * - Month(s) on the First/Last Weekday: land on the first/last Mon–Fri of target month
 * - Month(s) on the Last Day: land on the last calendar day of the target month
 * - Year(s): add Recur Int years
 * - Nth Weekday of Month: single Days value + Recur Int as nth occurrence (1 -> 1st, 5 -> last)
 * - Special Day(s) rule: if Recur Unit = "Day(s)", Recur Int = 1, and Days has multiple values selected,
 *   return the next selected weekday after Due.
 */
export function computeNextDue(task: Pick<Task, "due" | "recurInt" | "recurUnit" | "days">, baseNow: Date = new Date()): string | null {
  if (!task.recurInt || !task.recurUnit) {
    return null;
  }

  const originalDue = task.due ? parseISO(task.due) : baseNow;
  const hasTime = task.due ? task.due.includes("T") : false;
  const timeStr = hasTime && task.due ? task.due.split("T")[1] : null;

  let nextDate: Date;

  // Special Day(s) condition: Recur Unit = "Day(s)", Recur Int = 1, and multiple Days values selected
  if (
    task.recurUnit === "Day(s)" &&
    task.recurInt === 1 &&
    task.days &&
    task.days.length > 1
  ) {
    const targetDayIndices = new Set(task.days.map((d) => WEEKDAY_INDEX_MAP[d]));
    let cursor = addDays(originalDue, 1);
    for (let i = 0; i < 7; i++) {
      if (targetDayIndices.has(getDay(cursor))) {
        nextDate = cursor;
        break;
      }
      cursor = addDays(cursor, 1);
    }
    nextDate = nextDate! || addDays(originalDue, 1);
  } else {
    switch (task.recurUnit) {
      case "Day(s)": {
        // add Recur Int days to Due (or to today if Due is in the past)
        const reference = isBefore(startOfDay(originalDue), startOfDay(baseNow))
          ? baseNow
          : originalDue;
        nextDate = addDays(reference, task.recurInt);
        break;
      }

      case "Week(s)": {
        nextDate = addWeeks(originalDue, task.recurInt);
        break;
      }

      case "Month(s)": {
        nextDate = addMonths(originalDue, task.recurInt);
        break;
      }

      case "Month(s) on the First Weekday": {
        const targetMonthDate = addMonths(originalDue, task.recurInt);
        let cursor = startOfMonth(targetMonthDate);
        while (getDay(cursor) === 0 || getDay(cursor) === 6) {
          cursor = addDays(cursor, 1);
        }
        nextDate = cursor;
        break;
      }

      case "Month(s) on the Last Weekday": {
        const targetMonthDate = addMonths(originalDue, task.recurInt);
        let cursor = lastDayOfMonth(targetMonthDate);
        while (getDay(cursor) === 0 || getDay(cursor) === 6) {
          cursor = addDays(cursor, -1);
        }
        nextDate = cursor;
        break;
      }

      case "Month(s) on the Last Day": {
        const targetMonthDate = addMonths(originalDue, task.recurInt);
        nextDate = lastDayOfMonth(targetMonthDate);
        break;
      }

      case "Year(s)": {
        nextDate = addYears(originalDue, task.recurInt);
        break;
      }

      case "Nth Weekday of Month": {
        const targetMonthDate = addMonths(originalDue, 1);
        const targetWeekday = task.days && task.days.length === 1 ? task.days[0] : null;
        if (!targetWeekday) {
          nextDate = addMonths(originalDue, 1);
          break;
        }

        const targetDayOfWeek = WEEKDAY_INDEX_MAP[targetWeekday];
        const nth = task.recurInt; // 1 = first, 5 = last occurrence

        if (nth === 5) {
          // Last occurrence of weekday in target month
          let cursor = lastDayOfMonth(targetMonthDate);
          while (getDay(cursor) !== targetDayOfWeek) {
            cursor = addDays(cursor, -1);
          }
          nextDate = cursor;
        } else {
          // 1st, 2nd, 3rd, 4th occurrence
          let cursor = startOfMonth(targetMonthDate);
          let count = 0;
          while (count < nth && cursor.getMonth() === targetMonthDate.getMonth()) {
            if (getDay(cursor) === targetDayOfWeek) {
              count++;
              if (count === nth) break;
            }
            cursor = addDays(cursor, 1);
          }
          nextDate = cursor;
        }
        break;
      }

      default:
        nextDate = addDays(originalDue, task.recurInt);
    }
  }

  // Preserve time portion if original due date had time
  const yyyyMMdd = format(nextDate, "yyyy-MM-dd");
  if (hasTime && timeStr) {
    return `${yyyyMMdd}T${timeStr}`;
  }
  return yyyyMMdd;
}
