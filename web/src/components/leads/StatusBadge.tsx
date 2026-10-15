import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Labels from R-5.
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

/** Dot colour per status; shared by the badge, the filter tabs and the status select. */
export const STATUS_DOTS: Record<LeadStatus, string> = {
  new: "bg-sky-500",
  contacted: "bg-violet-500",
  qualified: "bg-indigo-500",
  proposal_sent: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-zinc-400",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-600/15",
  contacted: "bg-violet-50 text-violet-700 ring-violet-600/15",
  qualified: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  proposal_sent: "bg-orange-50 text-orange-700 ring-orange-600/20",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  lost: "bg-zinc-100 text-zinc-600 ring-zinc-500/15",
};

export function StatusDot({ status }: { status: LeadStatus }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOTS[status])} />;
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge className={cn("gap-1.5 ring-1 ring-inset", STATUS_STYLES[status])}>
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
