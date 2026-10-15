"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, SendHorizontal, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    <form onSubmit={submit} className="flex flex-col gap-2.5" noValidate>
      {/* Composer card: the note on top, the follow-up controls along its bottom edge. */}
      <div
        className={cn(
          "rounded-xl border bg-card shadow-xs transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
          errors.body && "border-destructive",
        )}
      >
        <Label htmlFor="note-body" className="sr-only">
          Note
        </Label>
        <Textarea
          id="note-body"
          placeholder="What was discussed?"
          rows={2}
          className="min-h-14 resize-none border-0 bg-transparent px-3.5 py-3 shadow-none focus-visible:ring-0"
          aria-invalid={Boolean(errors.body)}
          {...form.register("body")}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5 rounded-b-xl border-t bg-muted/40 px-3 py-2">
          <Label
            htmlFor="note-follow-up"
            className="mr-1 inline-flex items-center gap-1.5 text-xs whitespace-nowrap font-medium text-muted-foreground"
          >
            <CalendarClock className="size-3.5" aria-hidden />
            Next follow-up
          </Label>
          <Input
            id="note-follow-up"
            type="date"
            className="h-7 w-auto bg-card px-2 text-xs"
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
            className="h-7 w-auto bg-card px-2 text-xs"
            aria-invalid={Boolean(errors.followUpTime)}
            {...form.register("followUpTime")}
          />
          {quickPicks().map(({ label, date }) => {
            const inputs = toDateAndTimeInputs(date);
            const selected = inputs.date === followUpDate && inputs.time === followUpTime;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                title={`${inputs.date} ${inputs.time}`}
                onClick={() => pickFollowUp(inputs.date, inputs.time)}
                className={cn(
                  "h-7 rounded-full border px-2 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary/30 bg-accent text-accent-foreground"
                    : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
          {(followUpDate || followUpTime) && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Clear follow-up"
              title="Clear follow-up"
              onClick={() => pickFollowUp("", "")}
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      {/* Errors or the follow-up hint share the row with the submit button to keep the form short. */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-xs">
          {errors.body && <p className="text-destructive">{errors.body.message}</p>}
          {followUpError ? (
            <p className="text-destructive">{followUpError.message}</p>
          ) : (
            !errors.body && (
              <p className="text-muted-foreground">Leaving this empty clears the current follow-up.</p>
            )
          )}
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          <kbd className="rounded border bg-muted px-1 font-sans text-[10px]">Ctrl/⌘</kbd>{" "}
          <kbd className="rounded border bg-muted px-1 font-sans text-[10px]">Enter</kbd>
        </span>
        <Button type="submit" disabled={addDiscussion.isPending}>
          <SendHorizontal data-icon="inline-start" />
          {addDiscussion.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
