"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { FollowUpChip } from "@/components/leads/FollowUpChip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscussions, useLead } from "@/hooks/useLeads";
import { ApiError } from "@/lib/api";

import { AddDiscussionForm } from "./AddDiscussionForm";
import { DiscussionItem, LeadCreatedItem } from "./DiscussionItem";
import { MarkFollowUpDoneButton } from "./MarkFollowUpDoneButton";
import { StatusSelect } from "./StatusSelect";

type Props = { leadId: string | null; tz: string; onClose: () => void };

/** Lead header and timeline, opened by `?lead=<id>` (ARCHITECTURE.md, Open the timeline). */
export function LeadTimelineDialog({ leadId, tz, onClose }: Props) {
  const lead = useLead(leadId, tz);
  const discussions = useDiscussions(leadId);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Newest is first, so jump to the top when an entry is added (or another lead opens).
  const entryCount = discussions.data?.length;
  useEffect(() => {
    timelineRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [entryCount, leadId]);

  // Unknown or deleted lead in the URL: close and clear the param (ARCHITECTURE.md, Edge cases).
  const notFound = [lead.error, discussions.error].some(
    (error) => error instanceof ApiError && error.status === 404,
  );
  useEffect(() => {
    if (notFound) {
      toast.error("Lead not found");
      onClose();
    }
  }, [notFound, onClose]);

  return (
    <Dialog
      open={leadId !== null && !notFound}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="flex h-dvh max-w-full flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-xl">
        <DialogHeader className="gap-3 border-b p-4 pr-12">
          {lead.data ? (
            <>
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-lg">{lead.data.name}</DialogTitle>
                <DialogDescription>
                  {[lead.data.company, lead.data.phone]
                    .filter(Boolean)
                    .join(" · ") || "No company or phone"}
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusSelect leadId={lead.data.id} status={lead.data.status} />
                <FollowUpChip lead={lead.data} tz={tz} />
                {lead.data.follow_up_state !== "none" && (
                  <MarkFollowUpDoneButton leadId={lead.data.id} />
                )}
              </div>
            </>
          ) : lead.error && !notFound ? (
            <>
              <DialogTitle>Could not load this lead</DialogTitle>
              <DialogDescription>{lead.error.message}</DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="sr-only">Loading lead</DialogTitle>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </DialogHeader>

        {/* Timeline scrolls between the header and the pinned note form; the minimum height
            keeps short timelines from collapsing the dialog. */}
        <div
          ref={timelineRef}
          className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 sm:min-h-60"
        >
          {discussions.data ? (
            <ol className="py-5" aria-label="Timeline">
              {discussions.data.map((discussion, index) => (
                <DiscussionItem
                  key={discussion.id}
                  discussion={discussion}
                  tz={tz}
                  latest={index === 0}
                />
              ))}
              {lead.data && <LeadCreatedItem createdAt={lead.data.created_at} tz={tz} />}
            </ol>
          ) : discussions.error && !notFound ? (
            // Shown only when nothing is cached; a failed refetch keeps the timeline.
            <div className="py-6 text-center text-sm">
              <p>Could not load the timeline.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => discussions.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
        </div>

        {leadId && (
          <div className="shrink-0 border-t bg-background p-4">
            <AddDiscussionForm key={leadId} leadId={leadId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
