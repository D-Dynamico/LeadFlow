// Mirrors the API response shapes in docs/API.md.

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

export type Lead = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  next_follow_up_at: string | null;
  follow_up_state: FollowUpState;
  last_note_preview: string | null;
  last_discussion_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadCounts = Record<LeadStatus | "all", number>;

export type LeadList = {
  pinned: Lead[];
  others: Lead[];
  counts: LeadCounts;
};

export type LeadListParams = {
  status: LeadStatus | null;
  q: string;
  tz: string;
};

export type ErrorDetail = { field: string; message: string };

export type ErrorEnvelope = {
  error: { code: string; message: string; details: ErrorDetail[] | null };
};
