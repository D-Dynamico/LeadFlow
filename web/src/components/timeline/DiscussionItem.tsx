import { ArrowRightLeft, CalendarClock, MessageSquareText, UserPlus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { formatFollowUp, formatTimestamp, timeAgo } from "@/lib/dates";
import type { Discussion } from "@/lib/types";
import { cn } from "@/lib/utils";

type EntryProps = {
  at: string;
  tz: string;
  icon: LucideIcon;
  latest?: boolean;
  children: ReactNode;
};

/** One timeline row: an icon on the rail, the timestamp, then the content. */
function TimelineEntry({ at, tz, icon: Icon, latest = false, children }: EntryProps) {
  return (
    <li className="group relative pb-6 pl-10 last:pb-0">
      {/* Rail segment down to the next entry; the last entry has none. */}
      <span
        className="absolute top-7 bottom-0 left-[13px] w-px bg-border group-last:hidden"
        aria-hidden
      />
      <span
        className={cn(
          "absolute top-0 left-0 flex size-7 items-center justify-center rounded-full",
          latest
            ? "bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/15"
            : "bg-card text-muted-foreground ring-1 ring-border",
        )}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <time dateTime={at} className="block pt-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">{formatTimestamp(at, tz)}</span>
        <span className="opacity-75"> · {timeAgo(at)}</span>
      </time>
      <div className="mt-2">{children}</div>
    </li>
  );
}

type ItemProps = { discussion: Discussion; tz: string; latest?: boolean };

export function DiscussionItem({ discussion, tz, latest }: ItemProps) {
  if (discussion.kind === "status_change") {
    return (
      <TimelineEntry at={discussion.created_at} tz={tz} icon={ArrowRightLeft} latest={latest}>
        <p className="text-sm text-muted-foreground">
          Status changed: <span className="font-medium text-foreground">{discussion.body}</span>
        </p>
      </TimelineEntry>
    );
  }

  return (
    <TimelineEntry at={discussion.created_at} tz={tz} icon={MessageSquareText} latest={latest}>
      <div className="rounded-xl border bg-card px-4 py-3 shadow-xs">
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{discussion.body}</p>
        {discussion.follow_up_at && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
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
    <TimelineEntry at={createdAt} tz={tz} icon={UserPlus}>
      <p className="text-sm text-muted-foreground">Lead created</p>
    </TimelineEntry>
  );
}
