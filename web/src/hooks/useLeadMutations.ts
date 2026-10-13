import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { discussionsKey, leadKey } from "@/hooks/useLeads";
import { api } from "@/lib/api";
import type {
  Discussion,
  DiscussionCreateInput,
  Lead,
  LeadCreateInput,
  LeadList,
  LeadStatus,
} from "@/lib/types";

/** Update a lead's row in every cached list, so the list changes without a refetch. */
function updateLeadInLists(
  queryClient: QueryClient,
  leadId: string,
  update: (lead: Lead) => Lead,
) {
  queryClient.setQueriesData<LeadList>({ queryKey: ["leads"] }, (list) => {
    if (!list) return list;
    const swap = (rows: Lead[]) => rows.map((row) => (row.id === leadId ? update(row) : row));
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
      updateLeadInLists(queryClient, leadId, () => lead);
      // The response's follow_up_state is computed in UTC; refetch both in the viewer's tz.
      void queryClient.invalidateQueries({ queryKey: leadKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

type StatusContext = {
  previousLead: Lead | undefined;
  previousLists: [QueryKey, LeadList | undefined][];
};

/**
 * Change status optimistically in the dialog and every list, roll back on error, then
 * invalidate so filters and counts catch up (ARCHITECTURE.md, Change status).
 */
export function useUpdateStatus(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, LeadStatus, StatusContext>({
    mutationFn: (status) => api.updateLead(leadId, { status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: leadKey(leadId) });
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLead = queryClient.getQueryData<Lead>(leadKey(leadId));
      const previousLists = queryClient.getQueriesData<LeadList>({ queryKey: ["leads"] });
      if (previousLead) {
        queryClient.setQueryData<Lead>(leadKey(leadId), { ...previousLead, status });
      }
      updateLeadInLists(queryClient, leadId, (lead) => ({ ...lead, status }));
      return { previousLead, previousLists };
    },
    onError: (error, _status, context) => {
      if (context?.previousLead) queryClient.setQueryData(leadKey(leadId), context.previousLead);
      for (const [key, list] of context?.previousLists ?? []) queryClient.setQueryData(key, list);
      toast.error(`Could not change status: ${error.message}`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leadKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

/** Clear the follow-up without a note (R-4), then refetch the lead and lists. */
export function useMarkFollowUpDone(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markFollowUpDone(leadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leadKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(`Could not mark the follow-up done: ${error.message}`),
  });
}

/** Create a lead, then refetch the lists so it lands in the right place (Add a lead). */
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadCreateInput) => api.createLead(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}
