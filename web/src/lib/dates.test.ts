import { describe, expect, it } from "vitest";

import {
  formatFollowUp,
  formatTimestamp,
  fromDateAndTimeInputs,
  isFutureDateAndTime,
  quickPicks,
  timeAgo,
  toDateAndTimeInputs,
} from "./dates";

// vitest.config.ts pins the process to America/New_York; local-time helpers depend on it.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const pick = (now: Date, label: string) =>
  quickPicks(now).find((p) => p.label === label)!.date.toISOString();

describe("test environment", () => {
  it("runs in America/New_York", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/New_York");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-13T10:00:00Z");

  it("says just now inside a minute, either side of now", () => {
    expect(timeAgo("2026-10-13T09:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-13T10:00:30Z", now)).toBe("just now");
  });

  it("measures from the given now, not the real clock", () => {
    expect(timeAgo("2026-10-13T09:55:00Z", now)).toBe("5 minutes ago");
    expect(timeAgo("2026-10-10T10:00:00Z", now)).toBe("3 days ago");
    expect(timeAgo("2026-10-13T12:00:00Z", now)).toBe("in 2 hours");
  });
});

describe("formatFollowUp", () => {
  const now = new Date("2026-10-13T10:00:00Z"); // 15:30 IST, 06:00 New York

  it("names today, tomorrow and yesterday in the given zone", () => {
    expect(formatFollowUp("2026-10-13T12:30:00Z", "Asia/Kolkata", now)).toBe("Today, 6:00 PM");
    expect(formatFollowUp("2026-10-14T04:30:00Z", "Asia/Kolkata", now)).toBe("Tomorrow, 10:00 AM");
    expect(formatFollowUp("2026-10-12T04:30:00Z", "Asia/Kolkata", now)).toBe(
      "Yesterday, 10:00 AM",
    );
  });

  it("uses the viewer's zone near midnight, not UTC", () => {
    // 18:45Z is 00:15 tomorrow in Kolkata but still today in UTC (R-1).
    expect(formatFollowUp("2026-10-13T18:45:00Z", "Asia/Kolkata", now)).toBe("Tomorrow, 12:15 AM");
    expect(formatFollowUp("2026-10-13T18:45:00Z", "UTC", now)).toBe("Today, 6:45 PM");
  });

  it("falls back to a date, with the year only when it differs", () => {
    expect(formatFollowUp("2026-10-16T04:30:00Z", "Asia/Kolkata", now)).toBe("Fri 16 Oct, 10:00 AM");
    expect(formatFollowUp("2027-01-04T04:30:00Z", "Asia/Kolkata", now)).toBe("4 Jan 2027, 10:00 AM");
  });

  it("keeps wall-clock time across the New York DST change", () => {
    // DST ends Sun 1 Nov 2026 at 02:00; 10:00 that day is 15:00Z, not 14:00Z.
    const sunday = new Date("2026-11-01T12:00:00Z");
    expect(formatFollowUp("2026-11-01T15:00:00Z", "America/New_York", sunday)).toBe(
      "Today, 10:00 AM",
    );
  });
});

describe("formatTimestamp", () => {
  const now = new Date("2026-10-13T10:00:00Z");

  it("shows month, day and time, adding the year only when it differs", () => {
    expect(formatTimestamp("2026-10-09T05:00:00Z", "Asia/Kolkata", now)).toBe("Oct 9, 10:30 AM");
    expect(formatTimestamp("2025-12-30T05:00:00Z", "Asia/Kolkata", now)).toBe(
      "Dec 30 2025, 10:30 AM",
    );
    // 18:30Z on 31 Dec is already 1 Jan 2026 in Kolkata, so no year.
    expect(formatTimestamp("2025-12-31T18:30:00Z", "Asia/Kolkata", now)).toBe("Jan 1, 12:00 AM");
  });
});

describe("quickPicks", () => {
  it("offers tomorrow, in three days and next Monday, all at 10:00 local", () => {
    expect(quickPicks(local(2026, 10, 13, 9)).map((p) => p.label)).toEqual([
      "Tomorrow 10 AM",
      "In 3 days",
      "Next Monday 10 AM",
    ]);
  });

  it("picks tomorrow's date from 23:30, not a day later", () => {
    const lateTuesday = local(2026, 10, 13, 23, 30);
    expect(pick(lateTuesday, "Tomorrow 10 AM")).toBe(local(2026, 10, 14, 10).toISOString());
    expect(pick(lateTuesday, "In 3 days")).toBe(local(2026, 10, 16, 10).toISOString());
  });

  it("means the coming week's Monday when today is Monday (D-17)", () => {
    const mondayMorning = local(2026, 10, 19, 8);
    expect(pick(mondayMorning, "Next Monday 10 AM")).toBe(local(2026, 10, 26, 10).toISOString());
  });

  it("keeps 10:00 local across the DST change", () => {
    // From 23:30 EDT on Sat 31 Oct, tomorrow 10:00 is EST: 15:00Z.
    expect(pick(local(2026, 10, 31, 23, 30), "Tomorrow 10 AM")).toBe("2026-11-01T15:00:00.000Z");
  });
});

describe("date and time inputs", () => {
  it("round-trips a local date and time", () => {
    expect(toDateAndTimeInputs(local(2026, 11, 1, 10))).toEqual({ date: "2026-11-01", time: "10:00" });
  });

  it("converts local input values to UTC with the right offset", () => {
    expect(fromDateAndTimeInputs("2026-10-31", "10:00")).toBe("2026-10-31T14:00:00.000Z");
    expect(fromDateAndTimeInputs("2026-11-01", "10:00")).toBe("2026-11-01T15:00:00.000Z");
  });

  it("treats only later times as in the future", () => {
    const now = local(2026, 10, 13, 10);
    expect(isFutureDateAndTime("2026-10-13", "10:01", now)).toBe(true);
    expect(isFutureDateAndTime("2026-10-13", "10:00", now)).toBe(false);
    expect(isFutureDateAndTime("2026-10-12", "23:59", now)).toBe(false);
  });
});
