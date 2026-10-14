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
import {
  DEFAULT_FOLLOW_UP_TIME,
  fromDateAndTimeInputs,
  isFutureDateAndTime,
  quickPicks,
  toDateAndTimeInputs,
} from "@/lib/dates";

// Mirrors POST /leads/{id}/discussions validation (API.md); the API stays the authority.
// The follow-up is entered as a local date and time and sent as one `follow_up_at`.
const schema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, "Write a note first")
      .max(5000, "Notes are limited to 5000 characters"),
    followUpDate: z.string(),
    followUpTime: z.string(),
  })
  .superRefine(({ followUpDate, followUpTime }, ctx) => {
    if (!followUpDate && !followUpTime) return;
    if (!followUpDate) {
      ctx.addIssue({ code: "custom", path: ["followUpDate"], message: "Pick a date" });
    } else if (!followUpTime) {
      ctx.addIssue({ code: "custom", path: ["followUpTime"], message: "Pick a time" });
    } else if (!isFutureDateAndTime(followUpDate, followUpTime)) {
      ctx.addIssue({ code: "custom", path: ["followUpTime"], message: "Pick a time in the future" });
    }
  });

type Values = z.infer<typeof schema>;

export function AddDiscussionForm({ leadId }: { leadId: string }) {
  const addDiscussion = useAddDiscussion(leadId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { body: "", followUpDate: "", followUpTime: "" },
  });
  const { errors } = form.formState;
  const [followUpDate, followUpTime] = useWatch({
    control: form.control,
    name: ["followUpDate", "followUpTime"],
  });
  const followUpError = errors.followUpDate ?? errors.followUpTime;

  const submit = form.handleSubmit(async ({ body, followUpDate, followUpTime }) => {
    try {
      await addDiscussion.mutateAsync({
        body,
        ...(followUpDate && { follow_up_at: fromDateAndTimeInputs(followUpDate, followUpTime) }),
      });
      form.reset();
    } catch (error) {
      if (error instanceof ApiError && error.code === "FOLLOW_UP_IN_PAST") {
        form.setError("followUpTime", { message: error.message });
      } else if (error instanceof ApiError && error.details?.length) {
        for (const { field, message } of error.details) {
          form.setError(field === "follow_up_at" ? "followUpTime" : "body", { message });
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Could not save the note");
      }
    }
  });

  const pickFollowUp = (date: string, time: string) => {
    const options = { shouldDirty: true };
    form.setValue("followUpDate", date, options);
    form.setValue("followUpTime", time, options);
    void form.trigger(["followUpDate", "followUpTime"]);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-body" className="sr-only">
          Note
        </Label>
        <Textarea
          id="note-body"
          placeholder="What was discussed?"
          rows={2}
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
            type="date"
            className="w-auto"
            aria-invalid={Boolean(errors.followUpDate)}
            {...form.register("followUpDate", {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.value && !form.getValues("followUpTime")) {
                  form.setValue("followUpTime", DEFAULT_FOLLOW_UP_TIME);
                }
              },
            })}
          />
          <Input
            type="time"
            aria-label="Follow-up time"
            className="w-auto"
            aria-invalid={Boolean(errors.followUpTime)}
            {...form.register("followUpTime")}
          />
          {quickPicks().map(({ label, date }) => {
            const inputs = toDateAndTimeInputs(date);
            return (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                title={`${inputs.date} ${inputs.time}`}
                onClick={() => pickFollowUp(inputs.date, inputs.time)}
              >
                {label}
              </Button>
            );
          })}
          {(followUpDate || followUpTime) && (
            <Button type="button" variant="ghost" size="sm" onClick={() => pickFollowUp("", "")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Follow-up hint or error shares the row with the submit button to keep the form short. */}
      <div className="flex items-center gap-3">
        {followUpError ? (
          <p className="flex-1 text-xs text-destructive">{followUpError.message}</p>
        ) : (
          <p className="flex-1 text-xs text-muted-foreground">
            Leaving this empty clears the current follow-up.
          </p>
        )}
        <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl/⌘ + Enter</span>
        <Button type="submit" disabled={addDiscussion.isPending}>
          {addDiscussion.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
