"use client";

import { useState } from "react";

import { LeadTimelineDialog } from "@/components/timeline/LeadTimelineDialog";
import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeads } from "@/hooks/useLeads";
import { browserTimeZone } from "@/lib/dates";

import { LeadList } from "./LeadList";
import { LeadToolbar } from "./LeadToolbar";

export function LeadsScreen() {
  const [tz] = useState(browserTimeZone);
  const { status, q, leadId, setStatus, setQuery, openLead, closeLead } =
    useLeadFilters();
  const leads = useLeads({ status, q, tz });

  return (
    <div className="flex flex-col gap-6">
      <LeadToolbar
        status={status}
        q={q}
        counts={leads.data?.counts}
        onStatusChange={setStatus}
        onQueryChange={setQuery}
      />
      <LeadList
        data={leads.data}
        isPending={leads.isPending}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        tz={tz}
        filtered={status !== null || q !== ""}
        onSelect={openLead}
      />
      <LeadTimelineDialog leadId={leadId} tz={tz} onClose={closeLead} />
    </div>
  );
}
