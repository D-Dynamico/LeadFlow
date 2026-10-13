"use client";

import { useState } from "react";

import { useLeads } from "@/hooks/useLeads";
import { browserTimeZone } from "@/lib/dates";

import { LeadList } from "./LeadList";

export function LeadsScreen() {
  const [tz] = useState(browserTimeZone);
  const leads = useLeads({ status: null, q: "", tz });

  return (
    <LeadList
      data={leads.data}
      isPending={leads.isPending}
      error={leads.error}
      onRetry={() => void leads.refetch()}
      tz={tz}
      filtered={false}
    />
  );
}
