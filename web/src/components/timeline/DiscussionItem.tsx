import { ArrowRightLeft, CalendarClock } from "lucide-react";

import { formatFollowUp, timeAgo } from "@/lib/dates";
import type { Discussion } from "@/lib/types";

export function DiscussionItem({ discussion, tz }: { discussion: Discussion; tz: string }) {
  const when = (
    <time
      dateTime={discussion.created_at}
      title={formatFollowUp(discussion.created_at, tz)}
      className="text-xs text-muted-foreground"
    >
      {timeAgo(discussion.created_at)}
    </time>
  );

  if (discussion.kind === "status_change") {
    return (
      <li className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <ArrowRightLeft className="size-3.5 shrink-0" aria-hidden />
        <span>
          Status changed: <span className="text-foreground">{discussion.body}</span>
        </span>
        <span aria-hidden>·</span>
        {when}
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1.5 py-3">
      <p className="text-sm break-words whitespace-pre-wrap">{discussion.body}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {when}
        {discussion.follow_up_at && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden />
            Follow-up set for {formatFollowUp(discussion.follow_up_at, tz)}
          </span>
        )}
      </div>
    </li>
  );
}
