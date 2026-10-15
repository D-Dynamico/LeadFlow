import { timeAgo } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

import { FollowUpChip } from "./FollowUpChip";
import { LeadAvatar } from "./LeadAvatar";
import { StatusBadge } from "./StatusBadge";

type Props = { lead: Lead; tz: string; onSelect: (id: string) => void };

/** Grid columns shared with the column header in LeadList, so both line up. */
export const LEAD_ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_13rem_7.5rem] md:items-center md:gap-6";

export function LeadRow({ lead, tz, onSelect }: Props) {
  // A lead with no notes falls back to its creation time (ARCHITECTURE.md, Edge cases).
  const lastActivity = lead.last_discussion_at ?? lead.created_at;
  const closed = lead.status === "won" || lead.status === "lost";
  return (
    <li className="relative">
      {lead.follow_up_state === "overdue" && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-red-500" aria-hidden />
      )}
      <button
        type="button"
        onClick={() => onSelect(lead.id)}
        className={cn(
          "flex w-full flex-col gap-3 px-4 py-3.5 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset sm:px-5",
          LEAD_ROW_GRID,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <LeadAvatar id={lead.id} name={lead.name} />
          <div className="min-w-0">
            <p className={cn("truncate font-medium", closed && "text-muted-foreground")}>
              {lead.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{lead.company ?? "No company"}</p>
          </div>
        </div>

        <div className="min-w-0 pl-12 md:pl-0">
          <p
            className={cn(
              "truncate text-sm",
              lead.last_note_preview && !closed ? "text-foreground/85" : "text-muted-foreground",
              !lead.last_note_preview && "italic",
            )}
          >
            {lead.last_note_preview ?? "No notes yet"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(lastActivity)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-12 md:contents">
          <div className="max-md:empty:hidden md:flex">
            <FollowUpChip lead={lead} tz={tz} />
          </div>
          <div className="md:flex">
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </button>
    </li>
  );
}
