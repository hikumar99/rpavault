import { describe, it, expect } from "vitest";
import { computeNextDue } from "../recurrence";
import { RecurUnit, Weekday } from "../types";

describe("computeNextDue", () => {
  const baseDate = new Date("2026-04-10T12:00:00Z");

  describe("Day(s)", () => {
    it("adds Recur Int days to future Due date (example 1)", () => {
      const task = {
        due: "2026-05-10",
        recurInt: 3,
        recurUnit: "Day(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-13");
    });

    it("adds Recur Int days to today when Due date is in past (example 2)", () => {
      const task = {
        due: "2026-03-01",
        recurInt: 2,
        recurUnit: "Day(s)" as RecurUnit,
      };
      // baseDate is 2026-04-10, so baseDate + 2 days = 2026-04-12
      expect(computeNextDue(task, baseDate)).toBe("2026-04-12");
    });

    it("preserves time when datetime is provided", () => {
      const task = {
        due: "2026-05-10T15:30:00",
        recurInt: 1,
        recurUnit: "Day(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-11T15:30:00");
    });
  });

  describe("Week(s)", () => {
    it("adds 1 week (7 days) (example 1)", () => {
      const task = {
        due: "2026-05-01",
        recurInt: 1,
        recurUnit: "Week(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-08");
    });

    it("adds 3 weeks (21 days) (example 2)", () => {
      const task = {
        due: "2026-05-01",
        recurInt: 3,
        recurUnit: "Week(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-22");
    });
  });

  describe("Month(s)", () => {
    it("adds 1 month same day (example 1)", () => {
      const task = {
        due: "2026-01-15",
        recurInt: 1,
        recurUnit: "Month(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-02-15");
    });

    it("adds 2 months same day (example 2)", () => {
      const task = {
        due: "2026-03-10",
        recurInt: 2,
        recurUnit: "Month(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-10");
    });
  });

  describe("Month(s) on the First Weekday", () => {
    it("lands on Mon if 1st is weekend (Aug 1, 2026 is Saturday -> Aug 3 Monday) (example 1)", () => {
      const task = {
        due: "2026-07-15",
        recurInt: 1,
        recurUnit: "Month(s) on the First Weekday" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-08-03");
    });

    it("lands on 1st if 1st is weekday (Sep 1, 2026 is Tuesday) (example 2)", () => {
      const task = {
        due: "2026-08-15",
        recurInt: 1,
        recurUnit: "Month(s) on the First Weekday" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-09-01");
    });
  });

  describe("Month(s) on the Last Weekday", () => {
    it("lands on Fri if last day is Sunday (May 31, 2026 is Sunday -> May 29 Friday) (example 1)", () => {
      const task = {
        due: "2026-04-15",
        recurInt: 1,
        recurUnit: "Month(s) on the Last Weekday" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-29");
    });

    it("lands on Fri if last day is Saturday (Oct 31, 2026 is Saturday -> Oct 30 Friday) (example 2)", () => {
      const task = {
        due: "2026-09-15",
        recurInt: 1,
        recurUnit: "Month(s) on the Last Weekday" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-10-30");
    });
  });

  describe("Month(s) on the Last Day", () => {
    it("lands on last calendar day of target month (April -> May 31) (example 1)", () => {
      const task = {
        due: "2026-04-10",
        recurInt: 1,
        recurUnit: "Month(s) on the Last Day" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-31");
    });

    it("lands on last day of February in non-leap year (Jan -> Feb 28) (example 2)", () => {
      const task = {
        due: "2027-01-05",
        recurInt: 1,
        recurUnit: "Month(s) on the Last Day" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2027-02-28");
    });
  });

  describe("Year(s)", () => {
    it("adds 1 year (example 1)", () => {
      const task = {
        due: "2026-06-15",
        recurInt: 1,
        recurUnit: "Year(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2027-06-15");
    });

    it("adds 3 years (example 2)", () => {
      const task = {
        due: "2026-06-15",
        recurInt: 3,
        recurUnit: "Year(s)" as RecurUnit,
      };
      expect(computeNextDue(task, baseDate)).toBe("2029-06-15");
    });
  });

  describe("Nth Weekday of Month", () => {
    it("1st occurrence of weekday (1st Friday of May 2026 = May 1) (example 1)", () => {
      const task = {
        due: "2026-04-15",
        recurInt: 1,
        recurUnit: "Nth Weekday of Month" as RecurUnit,
        days: ["Friday" as Weekday],
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-01");
    });

    it("Last occurrence (5 = last) of Tuesday in May 2026 = May 26 (example 2)", () => {
      const task = {
        due: "2026-04-15",
        recurInt: 5,
        recurUnit: "Nth Weekday of Month" as RecurUnit,
        days: ["Tuesday" as Weekday],
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-26");
    });
  });

  describe("Day(s) with Recur Int = 1 and multiple Days selected", () => {
    it("returns next selected weekday after Due (Mon/Wed/Fri, Due is Mon -> Wed) (example 1)", () => {
      const task = {
        due: "2026-05-04", // Monday
        recurInt: 1,
        recurUnit: "Day(s)" as RecurUnit,
        days: ["Monday", "Wednesday", "Friday"] as Weekday[],
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-06"); // Wednesday
    });

    it("wraps around to the following week (Mon/Wed, Due is Wed -> Mon) (example 2)", () => {
      const task = {
        due: "2026-05-06", // Wednesday
        recurInt: 1,
        recurUnit: "Day(s)" as RecurUnit,
        days: ["Monday", "Wednesday"] as Weekday[],
      };
      expect(computeNextDue(task, baseDate)).toBe("2026-05-11"); // Next Monday
    });
  });
});
