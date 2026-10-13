import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { discussionsKey, leadKey } from "@/hooks/useLeads";
import { api } from "@/lib/api";
import type { Discussion, DiscussionCreateInput, Lead, LeadList } from "@/lib/types";

/** Replace a lead's row in every cached list, so the list updates without a refetch. */
function patchLeadInLists(queryClient: QueryClient, lead: Lead) {
  queryClient.setQueriesData<LeadList>({ queryKey: ["leads"] }, (list) => {
    if (!list) return list;
    const swap = (rows: Lead[]) => rows.map((row) => (row.id === lead.id ? lead : row));
    return { ...list, pinned: swap(list.pinned), others: swap(list.others) };
  });
}

/**
 * Add a note (ARCHITECTURE.md, Cache updates): prepend it to the timeline, write the returned
 * lead into the lead and list caches, then invalidate the lists so pinning re-sorts (D-11).
 */
export function useAddDiscussion(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DiscussionCreateInput) => api.addDiscussion(leadId, input),
    onSuccess: ({ discussion, lead }) => {
      queryClient.setQueryData<Discussion[]>(discussionsKey(leadId), (old) => [
        discussion,
        ...(old ?? []),
      ]);
      queryClient.setQueryData(leadKey(leadId), lead);
      patchLeadInLists(queryClient, lead);
      // The response's follow_up_state is computed in UTC; refetch both in the viewer's tz.
      void queryClient.invalidateQueries({ queryKey: leadKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
