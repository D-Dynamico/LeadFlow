import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { LeadListParams } from "@/lib/types";

export const leadsKey = (params: LeadListParams) => ["leads", params] as const;

/** Pinned and other leads, exactly as the API orders them (D-4). */
export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: leadsKey(params),
    queryFn: () => api.listLeads(params),
    // Keep showing the current list while a new filter or search loads.
    placeholderData: keepPreviousData,
  });
}
