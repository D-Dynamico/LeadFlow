"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddDiscussion } from "@/hooks/useLeadMutations";
import { ApiError } from "@/lib/api";
import { fromDateTimeLocal, quickPicks, toDateTimeLocal } from "@/lib/dates";

// Mirrors POST /leads/{id}/discussions validation (API.md); the API stays the authority.
const schema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a note first")
    .max(5000, "Notes are limited to 5000 characters"),
  followUpAt: z
    .string()
    .refine((value) => !value || new Date(value) > new Date(), "Pick a time in the future"),
});

type Values = z.infer<typeof schema>;

export function AddDiscussionForm({ leadId }: { leadId: string }) {
  const addDiscussion = useAddDiscussion(leadId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { body: "", followUpAt: "" },
  });
  const { errors } = form.formState;
  const followUpAt = useWatch({ control: form.control, name: "followUpAt" });

  const submit = form.handleSubmit(async ({ body, followUpAt }) => {
    try {
      await addDiscussion.mutateAsync({
        body,
        ...(followUpAt && { follow_up_at: fromDateTimeLocal(followUpAt) }),
      });
      form.reset();
    } catch (error) {
      if (error instanceof ApiError && error.code === "FOLLOW_UP_IN_PAST") {
        form.setError("followUpAt", { message: error.message });
      } else if (error instanceof ApiError && error.details?.length) {
        for (const { field, message } of error.details) {
          form.setError(field === "follow_up_at" ? "followUpAt" : "body", { message });
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Could not save the note");
      }
    }
  });

  const pickFollowUp = (value: string) =>
    form.setValue("followUpAt", value, { shouldValidate: true, shouldDirty: true });

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-body" className="sr-only">
          Note
        </Label>
        <Textarea
          id="note-body"
          placeholder="What was discussed?"
          rows={3}
          aria-invalid={Boolean(errors.body)}
          {...form.register("body")}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-follow-up">Next follow-up</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="note-follow-up"
            type="datetime-local"
            className="w-auto"
            aria-invalid={Boolean(errors.followUpAt)}
            {...form.register("followUpAt")}
          />
          {quickPicks().map(({ label, date }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              size="sm"
              title={toDateTimeLocal(date).replace("T", " ")}
              onClick={() => pickFollowUp(toDateTimeLocal(date))}
            >
              {label}
            </Button>
          ))}
          {followUpAt && (
            <Button type="button" variant="ghost" size="sm" onClick={() => pickFollowUp("")}>
              Clear
            </Button>
          )}
        </div>
        {errors.followUpAt ? (
          <p className="text-xs text-destructive">{errors.followUpAt.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Leaving this empty clears the current follow-up.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl/⌘ + Enter</span>
        <Button type="submit" disabled={addDiscussion.isPending}>
          {addDiscussion.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
