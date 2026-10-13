import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
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
