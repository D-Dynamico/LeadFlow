import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Lead, LeadList, LeadListParams } from "@/lib/types";

// Query keys from ARCHITECTURE.md, Cache updates.
export const leadsKey = (params: LeadListParams) => ["leads", params] as const;
export const leadKey = (id: string) => ["lead", id] as const;
export const discussionsKey = (id: string) => ["discussions", id] as const;

/** Pinned and other leads, exactly as the API orders them (D-4). */
export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: leadsKey(params),
    queryFn: () => api.listLeads(params),
    // Keep showing the current list while a new filter or search loads.
    placeholderData: keepPreviousData,
  });
}

/** One lead. Starts from the row already in a list cache, so the dialog opens instantly. */
export function useLead(id: string | null, tz: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: leadKey(id ?? ""),
    queryFn: () => api.getLead(id!, tz),
    enabled: id !== null,
    retry: false,
    placeholderData: () => {
      if (!id) return undefined;
      return findListedLead(queryClient.getQueriesData<LeadList>({ queryKey: ["leads"] }), id);
    },
  });
}

/** The lead's timeline, newest first. */
export function useDiscussions(id: string | null) {
  return useQuery({
    queryKey: discussionsKey(id ?? ""),
    queryFn: () => api.listDiscussions(id!),
    enabled: id !== null,
    retry: false,
  });
}

function findListedLead(lists: [unknown, LeadList | undefined][], id: string): Lead | undefined {
  for (const [, list] of lists) {
    const lead = list && [...list.pinned, ...list.others].find((l) => l.id === id);
    if (lead) return lead;
  }
  return undefined;
}
