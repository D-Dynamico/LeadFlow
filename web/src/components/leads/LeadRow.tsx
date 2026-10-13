import { timeAgo } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

import { FollowUpChip } from "./FollowUpChip";
import { StatusBadge } from "./StatusBadge";

type Props = { lead: Lead; tz: string; onSelect: (id: string) => void };

export function LeadRow({ lead, tz, onSelect }: Props) {
  // A lead with no notes falls back to its creation time (ARCHITECTURE.md, Edge cases).
  const lastActivity = lead.last_discussion_at ?? lead.created_at;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(lead.id)}
        className={cn(
          "flex w-full flex-col gap-2 border-l-4 border-l-transparent px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4",
          lead.follow_up_state === "overdue" && "border-l-red-500",
        )}
      >
        <div className="min-w-0 sm:w-56 sm:shrink-0">
          <p className="truncate font-medium">{lead.name}</p>
          {lead.company && (
            <p className="truncate text-sm text-muted-foreground">
              {lead.company}
            </p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm",
              lead.last_note_preview
                ? "text-foreground"
                : "italic text-muted-foreground",
            )}
          >
            {lead.last_note_preview ?? "No notes yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(lastActivity)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <FollowUpChip lead={lead} tz={tz} />
          <StatusBadge status={lead.status} />
        </div>
      </button>
    </li>
  );
}
