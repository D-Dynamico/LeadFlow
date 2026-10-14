"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LeadField as Field } from "@/components/leads/LeadField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateLead } from "@/hooks/useLeadMutations";
import { ApiError } from "@/lib/api";
import { leadFormField, leadFormSchema, type LeadFormValues } from "@/lib/leadForm";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function AddLeadDialog({ open, onOpenChange }: Props) {
  const createLead = useCreateLead();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", company: "", phone: "" },
  });
  const { errors } = form.formState;

  const close = () => {
    onOpenChange(false);
    form.reset();
  };

  const submit = form.handleSubmit(async ({ name, company, phone }) => {
    try {
      await createLead.mutateAsync({
        name,
        ...(company && { company }),
        ...(phone && { phone }),
      });
      close();
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        for (const { field, message } of error.details) {
          form.setError(leadFormField(field), { message });
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Could not add the lead");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Add lead</DialogTitle>
            <DialogDescription>New leads start with the status New.</DialogDescription>
          </DialogHeader>

          <Field id="lead-name" label="Name" error={errors.name?.message}>
            <Input
              id="lead-name"
              placeholder="e.g. Ravi Sharma"
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
          </Field>
          <Field id="lead-company" label="Company (optional)" error={errors.company?.message}>
            <Input
              id="lead-company"
              placeholder="e.g. Acme Logistics"
              autoComplete="off"
              aria-invalid={Boolean(errors.company)}
              {...form.register("company")}
            />
          </Field>
          <Field id="lead-phone" label="Phone (optional)" error={errors.phone?.message}>
            <Input
              id="lead-phone"
              placeholder="e.g. +91 98765 43210"
              type="tel"
              autoComplete="off"
              aria-invalid={Boolean(errors.phone)}
              {...form.register("phone")}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? "Adding…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
