# LeadFlow architecture

## Brief and rubric

A single-screen lead management tool. A sales rep tracks leads, logs every discussion, and sets
follow-up reminders. One screen; login optional (skipped, D-13).

| Rubric item | Where it is satisfied |
| --- | --- |
| List shows name, status, last note, time ago | [Data model](#data-model) denormalized fields, [Components](#components) `LeadRow` |
| Today's follow-ups pinned correctly | R-2, R-3, [tests](TEST_PLAN.md#follow-up-state-and-time) |
| Timeline loads discussions in order | [`GET /leads/{id}/discussions`](API.md#endpoints), newest first |
| Adding a discussion updates the list immediately | [Add a discussion](#add-a-discussion), [Cache updates](#cache-updates) |
| Add new lead works | [Add a lead](#add-a-lead) |
| Status update from dialog persists | [Change status](#change-status) |
| Clean frontend structure | [Module map](#module-map), [Frontend structure](#frontend-structure) |
| Correct status codes, clean error handling | [Endpoints](API.md#endpoints), [Error envelope](API.md#error-envelope) |
| README with setup, meaningful commits | [Setup](WORKFLOWS.md#setup), `.claude/rules/git.md` |
| Bonus: search, overdue red, Docker, seed, filters | [Load the list](#load-the-list), R-2, [Setup](WORKFLOWS.md#setup), [Seed data](TEST_PLAN.md#fixtures-and-seed-data) |

Submission also needs: public repo, `.env.example`, README, video or screenshots
([Definition of done](WORKFLOWS.md#definition-of-done)).

## Scope and non-goals

In scope: everything above, plus status change entries in the timeline, mark follow-up done,
URL-synced filters, quick-pick follow-up buttons, a pytest suite, optional live deploy.

Not in scope: authentication, multi-user ownership, pagination, editing or deleting discussions,
deleting leads, email or calendar integration, AI features in the product. Each goes in the README's
"Next steps".

## Module map

```
api/app/
  main.py              app factory, CORS (FRONTEND_ORIGIN), exception handlers, routers
  config.py            pydantic-settings; reads the env vars listed in .env.example
  db.py                engine, SessionLocal, get_db dependency
  models.py            Lead, Discussion, LeadStatus and DiscussionKind enums
  schemas.py           request and response models (API.md)
  errors.py            AppError, handlers, error envelope
  timeutil.py          local-day bounds from a tz name (R-1)
  services/leads.py    list with pinning, create, update status, mark follow-up done (R-2 to R-5)
  services/discussions.py  add discussion and update lead in one transaction (Write rules)
  routers/leads.py
  routers/discussions.py
api/scripts/seed.py    seed relative to now, --reset
api/tests/
api/alembic/           migrations

web/src/
  app/page.tsx         composes the screen
  lib/api.ts           typed fetch client, parses the error envelope
  lib/dates.ts         timeAgo, formatFollowUp, browser tz
  lib/types.ts         mirrors API schemas
  hooks/useLeads.ts
  hooks/useLeadMutations.ts
  components/leads/    toolbar, list, row, badges, add-lead dialog
  components/timeline/ timeline dialog, discussion item, add-discussion form
```

## Data model

### leads

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | server generated |
| name | varchar(120) not null | trimmed, 1 to 120 chars |
| company | varchar(120) null | |
| phone | varchar(32) null | loose validation (API.md) |
| status | enum lead_status, default `new` | `new, contacted, qualified, proposal_sent, won, lost` |
| next_follow_up_at | timestamptz null | drives pinning and overdue (R-2, R-3) |
| last_note_preview | varchar(200) null | first 200 chars of the latest `note` discussion |
| last_discussion_at | timestamptz null | time of the latest `note` discussion |
| created_at | timestamptz not null | server default now() |
| updated_at | timestamptz not null | updated on every change |

### discussions

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| lead_id | UUID FK leads.id, on delete cascade | |
| kind | enum discussion_kind | `note` or `status_change` |
| body | text not null | for status_change: `Contacted → Qualified` style text built by the service |
| follow_up_at | timestamptz null | only for `note` |
| created_at | timestamptz not null | server default now() |

### Write rules

- Adding a `note` discussion, in one transaction: insert the discussion, then set the lead's
  `last_note_preview`, `last_discussion_at`, `next_follow_up_at` (per R-4) and `updated_at`.
- Changing status, in one transaction: update `leads.status`, insert a `status_change` discussion.
  Status changes do not touch `last_note_preview` or `last_discussion_at`.
- If any step fails, nothing is written.

### Indexes

- `leads(next_follow_up_at)` for pinning
- `leads(last_discussion_at)` for ordering
- `leads(status)` for filter counts
- `discussions(lead_id, created_at DESC)` for the timeline
- Name search uses `ILIKE`; no trigram index at this size (D-14).

## Core flows

### Load the list
Web sends `GET /leads?status=&q=&tz=`. Service computes local-day bounds from `tz`, filters by status
and name, splits into `pinned` and `others` (R-3), and returns both plus `counts` per status (counts
ignore the status filter but respect search).

### Open the timeline
Clicking a row sets `?lead=<id>` in the URL and opens the dialog. Dialog fetches
`GET /leads/{id}` and `GET /leads/{id}/discussions` (newest first).

### Add a discussion
Form posts `{ body, follow_up_at? }` to `POST /leads/{id}/discussions`. API applies the write rules and
R-4, and returns `{ discussion, lead }`. Web prepends the discussion to the timeline cache, writes `lead`
into the list cache, and invalidates the list so pinning re-sorts ([Cache updates](#cache-updates)).

### Change status
Status select sends `PATCH /leads/{id}` with `{ status }`. Optimistic update in the list and dialog;
rollback and toast on error. API writes the status_change entry (R-5) and returns the lead.

### Add a lead
Dialog posts `{ name, company?, phone? }` to `POST /leads`. 201 with the lead. Web invalidates the list.

### Mark follow-up done
`DELETE /leads/{id}/follow-up` clears `next_follow_up_at`. 204. Web invalidates the list and lead.

## Frontend structure

One route, feature folders under `components/`, one API client, hooks per resource
([Module map](#module-map)).

### Components
- `LeadToolbar`: search (debounced 300 ms), status chips with counts, Add Lead button
- `LeadList`: Pinned section then All section; skeletons and empty states
- `LeadRow`: name, company, `StatusBadge`, last note preview, time ago, `FollowUpChip`
- `FollowUpChip`: overdue red, today amber, upcoming neutral (state comes from the API, R-2)
- `LeadTimelineDialog`: header with name and `StatusSelect`, `DiscussionItem` list, `AddDiscussionForm`
- `AddDiscussionForm`: textarea, separate date and time inputs (a date alone defaults to 10:00),
  quick picks at 10:00 local (Tomorrow, In 3 days, Next Monday; on a Monday that is a week later,
  D-17), Cmd/Ctrl+Enter submits. Date math lives in `lib/dates.ts`, not in components.
- `AddLeadDialog`

### URL state
`?status=<value>&q=<text>&lead=<id>`. Refresh or a shared link restores the same view.

### Cache updates
- Query keys: `["leads", { status, q, tz }]`, `["lead", id]`, `["discussions", id]`.
- Add discussion: on success, prepend to `["discussions", id]`, set `["lead", id]`, update the matching
  row in every `["leads", …]` cache, then invalidate `["leads"]`.
- Status change: optimistic on `["lead", id]` and list caches, rollback on error.

### UX details
Mobile: rows stack, dialog becomes full height. Keyboard: `N` opens Add Lead. Toasts for errors only.

## Edge cases

- Lead with no discussions: last note shows "No notes yet", time ago uses `created_at`.
- Timeline always ends with a "Lead created" line built from the lead's `created_at` on the client;
  it is not a stored discussion, so a new lead's timeline is never empty.
- Long note: list shows the 200-char preview with ellipsis; timeline shows full text with line breaks.
- Invalid or missing `tz`: 422 `INVALID_TIMEZONE`. Web always sends it.
- Follow-up exactly at the current minute: treated as today, not overdue, until it passes (R-2).
- Two tabs editing the same lead: last write wins; acceptable for a single-user demo.
- Unknown lead id (deleted or mistyped in URL): 404, dialog closes and `lead` param is cleared.
- Search with only spaces: treated as empty.
