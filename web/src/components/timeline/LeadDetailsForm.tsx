"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LeadField as Field } from "@/components/leads/LeadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateLeadDetails } from "@/hooks/useLeadMutations";
import { ApiError } from "@/lib/api";
import {
  leadFormField,
  leadFormSchema,
  leadToFormValues,
  toLeadUpdate,
  type LeadFormValues,
} from "@/lib/leadForm";
import type { Lead } from "@/lib/types";

type Props = { lead: Lead; onDone: () => void };

/** Inline edit of name, company and phone in the dialog header (D-18). */
export function LeadDetailsForm({ lead, onDone }: Props) {
  const updateDetails = useUpdateLeadDetails(lead.id);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: leadToFormValues(lead),
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await updateDetails.mutateAsync(toLeadUpdate(values));
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        for (const { field, message } of error.details) {
          form.setError(leadFormField(field), { message });
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Could not save the lead");
      }
    }
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Edit lead details"
      className="flex flex-col gap-3"
      onKeyDown={(event) => {
        // Escape cancels the edit instead of closing the whole dialog.
        if (event.key === "Escape") {
          event.stopPropagation();
          onDone();
        }
      }}
    >
      <Field id="edit-lead-name" label="Name" error={errors.name?.message}>
        <Input
          id="edit-lead-name"
          autoFocus
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...form.register("name")}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="edit-lead-company" label="Company (optional)" error={errors.company?.message}>
          <Input
            id="edit-lead-company"
            placeholder="e.g. Acme Logistics"
            autoComplete="off"
            aria-invalid={Boolean(errors.company)}
            {...form.register("company")}
          />
        </Field>
        <Field id="edit-lead-phone" label="Phone (optional)" error={errors.phone?.message}>
          <Input
            id="edit-lead-phone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            autoComplete="off"
            aria-invalid={Boolean(errors.phone)}
            {...form.register("phone")}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={updateDetails.isPending}>
          {updateDetails.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
