"use client";

import { Building2, Pencil, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LeadAvatar } from "@/components/leads/LeadAvatar";
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
import { LeadDetailsForm } from "./LeadDetailsForm";
import { FollowUpBanner } from "./FollowUpBanner";
import { StatusSelect } from "./StatusSelect";

type Props = { leadId: string | null; tz: string; onClose: () => void };

/** Lead header and timeline, opened by `?lead=<id>` (ARCHITECTURE.md, Open the timeline). */
export function LeadTimelineDialog({ leadId, tz, onClose }: Props) {
  const lead = useLead(leadId, tz);
  const discussions = useDiscussions(leadId);
  const timelineRef = useRef<HTMLDivElement>(null);
  // Keyed by lead id, so opening another lead always starts out of edit mode.
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = leadId !== null && editingId === leadId;

  // Newest is first, so jump to the top when an entry is added (or another lead opens).
  const entryCount = discussions.data?.length;
  useEffect(() => {
    timelineRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [entryCount, leadId]);

  // Unknown or deleted lead in the URL: close and clear the param (ARCHITECTURE.md, Edge cases).
  const notFound = [lead.error, discussions.error].some(
    (error) => error instanceof ApiError && error.status === 404,
  );
  // One retry for the whole dialog: a failed lead usually means a failed timeline too.
  const retry = () => {
    void lead.refetch();
    void discussions.refetch();
  };

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
      <DialogContent className="flex h-dvh max-w-full flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl overflow-hidden">
        <DialogHeader className="gap-4 border-b p-4 pr-12 sm:py-5 sm:pr-14 sm:pl-6">
          {lead.data ? (
            <>
              {editing ? (
                <>
                  <DialogTitle className="sr-only">Edit {lead.data.name}</DialogTitle>
                  <DialogDescription className="sr-only">
                    Change the name, company or phone.
                  </DialogDescription>
                  <LeadDetailsForm lead={lead.data} onDone={() => setEditingId(null)} />
                </>
              ) : (
                <div className="flex flex-wrap items-start gap-x-3.5 gap-y-3">
                  <LeadAvatar id={lead.data.id} name={lead.data.name} size="lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <DialogTitle className="text-lg leading-tight font-semibold break-words">
                        {lead.data.name}
                      </DialogTitle>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => setEditingId(lead.data.id)}
                      >
                        <Pencil data-icon="inline-start" />
                        Edit
                      </Button>
                    </div>
                    <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {lead.data.company && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-3.5" aria-hidden />
                          {lead.data.company}
                        </span>
                      )}
                      {lead.data.phone && (
                        <a
                          href={`tel:${lead.data.phone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
                        >
                          <Phone className="size-3.5" aria-hidden />
                          {lead.data.phone}
                        </a>
                      )}
                      {!lead.data.company && !lead.data.phone && "No company or phone"}
                    </DialogDescription>
                  </div>
                  {/* Beside the name on wider screens, on its own line under it on phones. */}
                  <div className="shrink-0 max-sm:basis-full max-sm:pl-[3.875rem] sm:self-center">
                    <StatusSelect leadId={lead.data.id} status={lead.data.status} />
                  </div>
                </div>
              )}
            </>
          ) : lead.error && !notFound ? (
            <>
              <DialogTitle>Could not load this lead</DialogTitle>
              <DialogDescription>{lead.error.message}</DialogDescription>
              <Button variant="outline" size="sm" className="self-start" onClick={retry}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <DialogTitle className="sr-only">Loading lead</DialogTitle>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </DialogHeader>
        {lead.data && <FollowUpBanner lead={lead.data} tz={tz} />}

        {/* Timeline scrolls between the header and the pinned note form; the minimum height
            keeps short timelines from collapsing the dialog. */}
        <div
          ref={timelineRef}
          className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-4 sm:min-h-60 sm:px-6"
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
          ) : lead.error && !lead.data ? null : discussions.error && !notFound ? (
            // Shown only when nothing is cached (a failed refetch keeps the timeline) and the lead
            // itself loaded; a failed lead has its own Try again in the header.
            <div className="py-6 text-center text-sm">
              <p>Could not load the timeline.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={retry}
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

        {/* No note form until the lead has loaded: there is nothing to attach a note to yet. */}
        {leadId && lead.data && (
          <div className="shrink-0 border-t bg-card p-4 sm:px-6">
            <AddDiscussionForm key={leadId} leadId={leadId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
