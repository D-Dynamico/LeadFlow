import { AlarmClock, CalendarClock, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatFollowUp } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_STYLES = {
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  today: "bg-amber-50 text-amber-800 ring-amber-600/25",
  upcoming: "bg-background text-muted-foreground ring-border",
} as const;

const STATE_ICONS = { overdue: CircleAlert, today: AlarmClock, upcoming: CalendarClock } as const;

/** Overdue red, today amber, upcoming neutral. The state comes from the API (R-2). */
export function FollowUpChip({ lead, tz }: { lead: Lead; tz: string }) {
  if (lead.follow_up_state === "none" || !lead.next_follow_up_at) return null;
  const when = formatFollowUp(lead.next_follow_up_at, tz);
  const Icon = STATE_ICONS[lead.follow_up_state];
  return (
    <Badge className={cn("ring-1 ring-inset", STATE_STYLES[lead.follow_up_state])}>
      <Icon data-icon="inline-start" />
      {lead.follow_up_state === "overdue" ? `Overdue · ${when}` : when}
    </Badge>
  );
}
