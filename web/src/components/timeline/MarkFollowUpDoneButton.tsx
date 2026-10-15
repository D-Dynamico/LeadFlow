"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMarkFollowUpDone } from "@/hooks/useLeadMutations";

export function MarkFollowUpDoneButton({ leadId }: { leadId: string }) {
  const markDone = useMarkFollowUpDone(leadId);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 bg-card/80 text-foreground"
      disabled={markDone.isPending}
      onClick={() => markDone.mutate()}
    >
      <Check data-icon="inline-start" />
      Mark done
    </Button>
  );
}
