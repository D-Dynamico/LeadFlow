import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatFollowUp } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_STYLES = {
  overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  today:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  upcoming: "border-border text-muted-foreground",
} as const;

/** Overdue red, today amber, upcoming neutral. The state comes from the API (R-2). */
export function FollowUpChip({ lead, tz }: { lead: Lead; tz: string }) {
  if (lead.follow_up_state === "none" || !lead.next_follow_up_at) return null;
  const when = formatFollowUp(lead.next_follow_up_at, tz);
  return (
    <Badge variant="outline" className={cn(STATE_STYLES[lead.follow_up_state])}>
      <CalendarClock data-icon="inline-start" />
      {lead.follow_up_state === "overdue" ? `Overdue · ${when}` : when}
    </Badge>
  );
}
