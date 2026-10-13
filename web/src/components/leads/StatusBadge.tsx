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

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  contacted: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  qualified: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  proposal_sent: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  won: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge className={cn(STATUS_STYLES[status])}>{STATUS_LABELS[status]}</Badge>;
}
