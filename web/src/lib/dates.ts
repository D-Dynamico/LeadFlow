import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  nextMonday,
  setHours,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/** The viewer's IANA timezone, sent with every list request (R-1). */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** "just now", "5 minutes ago", "3 days ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Math.abs(now.getTime() - date.getTime()) < 60_000) return "just now";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

/**
 * Follow-up time in the viewer's zone: "Today, 3:30 PM", "Tomorrow, 10:00 AM",
 * "Fri 16 Oct, 10:00 AM". Formatting only; the state itself comes from the API (R-2).
 */
export function formatFollowUp(iso: string, tz: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = formatInTimeZone(date, tz, "h:mm a");
  const days = differenceInCalendarDays(toZonedTime(date, tz), toZonedTime(now, tz));
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  const sameYear = formatInTimeZone(date, tz, "yyyy") === formatInTimeZone(now, tz, "yyyy");
  return formatInTimeZone(date, tz, sameYear ? "EEE d MMM, h:mm a" : "d MMM yyyy, h:mm a");
}

const at10am = (day: Date) => setHours(startOfDay(day), 10);

/** Follow-up shortcuts in the viewer's local time (ARCHITECTURE.md, Components). */
export function quickPicks(now: Date = new Date()): { label: string; date: Date }[] {
  return [
    { label: "Tomorrow 10 AM", date: at10am(addDays(now, 1)) },
    { label: "In 3 days", date: at10am(addDays(now, 3)) },
    { label: "Next Monday 10 AM", date: at10am(nextMonday(now)) },
  ];
}

/** Value for an `<input type="datetime-local">`, in the browser's local time. */
export function toDateTimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** A `datetime-local` value to ISO 8601 UTC, which carries the offset the API requires. */
export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}
