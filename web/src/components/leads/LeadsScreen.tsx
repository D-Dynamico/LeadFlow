"use client";

import { useState } from "react";

import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeads } from "@/hooks/useLeads";
import { browserTimeZone } from "@/lib/dates";

import { LeadList } from "./LeadList";
import { LeadToolbar } from "./LeadToolbar";

export function LeadsScreen() {
  const [tz] = useState(browserTimeZone);
  const { status, q, setStatus, setQuery } = useLeadFilters();
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
      />
    </div>
  );
}
