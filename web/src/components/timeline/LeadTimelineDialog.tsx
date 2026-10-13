"use client";

import { useEffect } from "react";
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
import { DiscussionItem } from "./DiscussionItem";
import { StatusSelect } from "./StatusSelect";

type Props = { leadId: string | null; tz: string; onClose: () => void };

/** Lead header and timeline, opened by `?lead=<id>` (ARCHITECTURE.md, Open the timeline). */
export function LeadTimelineDialog({ leadId, tz, onClose }: Props) {
  const lead = useLead(leadId, tz);
  const discussions = useDiscussions(leadId);

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

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {leadId && (
            <div className="border-b py-4">
              <AddDiscussionForm key={leadId} leadId={leadId} />
            </div>
          )}
          {discussions.data ? (
            discussions.data.length > 0 ? (
              <ol className="divide-y" aria-label="Timeline">
                {discussions.data.map((discussion) => (
                  <DiscussionItem key={discussion.id} discussion={discussion} tz={tz} />
                ))}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No discussions yet.
              </p>
            )
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
      </DialogContent>
    </Dialog>
  );
}
