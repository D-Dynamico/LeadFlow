"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Label } from "@/components/ui/label";
import { useCreateLead } from "@/hooks/useLeadMutations";
import { ApiError } from "@/lib/api";

// Mirrors POST /leads validation (API.md); the API stays the authority.
const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "At most 120 characters"),
  company: z.string().trim().max(120, "At most 120 characters"),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^[0-9+\-\s()]{6,32}$/.test(value),
      "6 to 32 digits, spaces, or + - ( )",
    ),
});

type Values = z.infer<typeof schema>;
const FIELDS = ["name", "company", "phone"] as const;

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function AddLeadDialog({ open, onOpenChange }: Props) {
  const createLead = useCreateLead();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
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
          const name = FIELDS.find((f) => f === field) ?? "name";
          form.setError(name, { message });
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

type FieldProps = { id: string; label: string; error?: string; children: ReactNode };

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
