import { ArrowRightLeft, CalendarClock } from "lucide-react";
import type { ReactNode } from "react";

import { formatFollowUp, formatTimestamp, timeAgo } from "@/lib/dates";
import type { Discussion } from "@/lib/types";
import { cn } from "@/lib/utils";

type EntryProps = { at: string; tz: string; latest?: boolean; children: ReactNode };

/** One timeline row: a dot on the rail, the timestamp, then the content. */
function TimelineEntry({ at, tz, latest = false, children }: EntryProps) {
  return (
    <li className="group relative pb-5 pl-7 last:pb-0">
      {/* Rail segment down to the next entry; the last entry has none. */}
      <span
        className="absolute top-3 bottom-0 left-[5px] w-px bg-border group-last:hidden"
        aria-hidden
      />
      <span
        className={cn(
          "absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-background",
          latest ? "bg-blue-600 ring-2 ring-blue-600/20" : "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      <time dateTime={at} className="text-xs text-muted-foreground">
        {formatTimestamp(at, tz)} <span className="opacity-75">({timeAgo(at)})</span>
      </time>
      <div className="mt-1.5">{children}</div>
    </li>
  );
}

type ItemProps = { discussion: Discussion; tz: string; latest?: boolean };

export function DiscussionItem({ discussion, tz, latest }: ItemProps) {
  if (discussion.kind === "status_change") {
    return (
      <TimelineEntry at={discussion.created_at} tz={tz} latest={latest}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRightLeft className="size-3.5 shrink-0" aria-hidden />
          <span>
            Status changed: <span className="text-foreground">{discussion.body}</span>
          </span>
        </p>
      </TimelineEntry>
    );
  }

  return (
    <TimelineEntry at={discussion.created_at} tz={tz} latest={latest}>
      <div className="rounded-lg border bg-card px-3.5 py-3 shadow-xs">
        <p className="text-sm break-words whitespace-pre-wrap">{discussion.body}</p>
        {discussion.follow_up_at && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <CalendarClock className="size-3.5" aria-hidden />
            Follow-up set for {formatFollowUp(discussion.follow_up_at, tz)}
          </p>
        )}
      </div>
    </TimelineEntry>
  );
}

/** Last timeline entry, built from the lead's `created_at`; not a stored discussion. */
export function LeadCreatedItem({ createdAt, tz }: { createdAt: string; tz: string }) {
  return (
    <TimelineEntry at={createdAt} tz={tz}>
      <div className="rounded-lg border border-dashed px-3.5 py-2.5 text-sm text-muted-foreground italic">
        Lead created
      </div>
    </TimelineEntry>
  );
}
