import { AlarmClock, CalendarClock, CircleAlert } from "lucide-react";

import { formatFollowUp } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

import { MarkFollowUpDoneButton } from "./MarkFollowUpDoneButton";

const STATES = {
  overdue: { label: "Follow-up overdue", icon: CircleAlert, style: "bg-red-50 text-red-800 border-red-100" },
  today: { label: "Follow-up due today", icon: AlarmClock, style: "bg-amber-50 text-amber-900 border-amber-100" },
  upcoming: { label: "Next follow-up", icon: CalendarClock, style: "bg-accent/60 text-accent-foreground border-accent" },
} as const;

/** The lead's pending follow-up with Mark done; colour follows the API's state (R-2, R-4). */
export function FollowUpBanner({ lead, tz }: { lead: Lead; tz: string }) {
  if (lead.follow_up_state === "none" || !lead.next_follow_up_at) return null;
  const { label, icon: Icon, style } = STATES[lead.follow_up_state];
  return (
    <div className={cn("flex items-center gap-3 border-b px-4 py-2 sm:px-6", style)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{label}</span>
        <span className="opacity-75"> · {formatFollowUp(lead.next_follow_up_at, tz)}</span>
      </p>
      <MarkFollowUpDoneButton leadId={lead.id} />
    </div>
  );
}
