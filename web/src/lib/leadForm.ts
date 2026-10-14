import { z } from "zod";

import type { Lead, LeadUpdateInput } from "@/lib/types";

// Mirrors POST /leads and PATCH /leads/{id} validation (API.md); the API stays the authority.
export const leadFormSchema = z.object({
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

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const LEAD_FORM_FIELDS = ["name", "company", "phone"] as const;

/** Map an API error `field` onto a form field, falling back to name. */
export function leadFormField(field: string): (typeof LEAD_FORM_FIELDS)[number] {
  return LEAD_FORM_FIELDS.find((f) => f === field) ?? "name";
}

/** Form values for an existing lead; missing company or phone become empty inputs. */
export function leadToFormValues(lead: Pick<Lead, "name" | "company" | "phone">): LeadFormValues {
  return { name: lead.name, company: lead.company ?? "", phone: lead.phone ?? "" };
}

/** PATCH body for edited details: a blank company or phone is sent as null to clear it (D-18). */
export function toLeadUpdate(values: LeadFormValues): LeadUpdateInput {
  const orNull = (value: string) => value.trim() || null;
  return { name: values.name.trim(), company: orNull(values.company), phone: orNull(values.phone) };
}
