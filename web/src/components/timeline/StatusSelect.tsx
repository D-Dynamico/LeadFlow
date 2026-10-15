"use client";

import { STATUS_LABELS, StatusDot } from "@/components/leads/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStatus } from "@/hooks/useLeadMutations";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

/** Any status can move to any other (R-5, D-10); the API logs the change in the timeline. */
export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const updateStatus = useUpdateStatus(leadId);

  return (
    <Select
      items={STATUS_LABELS}
      value={status}
      onValueChange={(value) => {
        if (value && value !== status) updateStatus.mutate(value);
      }}
    >
      <SelectTrigger size="sm" aria-label="Lead status" className="min-w-40 gap-2 bg-card">
        <StatusDot status={status} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            <StatusDot status={value} />
            {STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
