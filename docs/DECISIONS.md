# LeadFlow decisions

Append-only log. Each entry gets the next D-number. Never edit a past entry; supersede it with a new
one that says "Supersedes D-x". Format: decision, alternatives considered, why.

### D-1 Monorepo with `api/` and `web/`
Alternatives: two repos. Why: one link to submit, one compose file, one history to review.

### D-2 Postgres 16, also for tests
Alternatives: SQLite everywhere; SQLite for tests only. Why: real `timestamptz` and timezone behaviour.
Testing on SQLite would hide exactly the bugs RULES.md is about. Tests use a separate `leadflow_test` database.

### D-3 Store UTC, client sends `tz`
Alternatives: store local time; compute "today" in UTC; compute everything on the client.
Why: "today" is a property of the viewer, not the data. UTC storage plus a request `tz` is correct for
any user and stays testable on the server.

### D-4 Pinning computed on the server
Alternatives: return a flat list and sort on the client. Why: one tested place for the rule; the
frontend just renders `pinned` and `others`.

### D-5 Overdue follow-ups are pinned with today's
Alternatives: pin only today's, show overdue inline. Why: an overdue follow-up is more urgent than one
due later today; hiding it in the main list defeats the purpose of pinning. Called out in the README
because the brief says "today's".

### D-6 Denormalized fields on `leads`
Alternatives: join to the latest discussion on every list request. Why: the list is the hot path; the
three fields are written in the same transaction as the discussion (ARCHITECTURE.md, Write rules), so
they cannot drift.

### D-7 A new note without a follow-up clears the follow-up
Alternatives: keep the old follow-up until marked done. Why: logging a discussion means the follow-up
happened. Keeping it would leave stale reminders pinned. "Mark done" covers clearing without a note.

### D-8 Follow-ups in the past are rejected
Alternatives: accept and show as overdue immediately. Why: a reminder in the past is almost always a
typo in the date picker.

### D-9 Status changes are logged in the timeline
Alternatives: no history, or a separate audit table. Why: real CRMs show it, it is cheap, and one
`kind` column keeps a single ordered timeline.

### D-10 Any status transition is allowed
Alternatives: enforce a forward-only pipeline. Why: reps fix mistakes and deals reopen; the timeline
records every change anyway.

### D-11 Mutations return the updated lead
Alternatives: return only the created resource and refetch. Why: the frontend patches its cache from
the response, so the list updates instantly without a visible refetch.

### D-12 One error envelope, overriding FastAPI's default 422
Alternatives: FastAPI defaults. Why: the frontend parses a single shape; consistent codes are part of
the rubric.

### D-13 No authentication
Alternatives: single-user JWT login. Why: marked optional in the brief; time goes to correctness and
polish instead. Revisit only if every other stage is done early.

### D-14 No pagination, no search index
Alternatives: cursor pagination, pg_trgm. Why: demo scale (tens of leads). Listed as next steps.

### D-15 Docker db published on host port 5433, configurable
Alternatives: keep 5432; ask developers to stop their native Postgres. Why: a native Postgres on
5432 is common and breaks a fresh clone, because host tools such as pytest reach it instead of the
Docker db. `POSTGRES_HOST_PORT` (default 5433) moves only the host side; containers still use
`db:5432`.

### D-16 Deploy on Vercel + Render + Neon; reseed demo data only when stale
Alternatives: skip the live link; Render's own Postgres (free tier expires after 30 days); seed
once and let data drift; reset on every cold start. Why: free tiers that last past grading. The
seed is relative to when it runs, so a seed left alone shows every pinned lead as overdue within a
day, which looks like a pinning bug. Resetting on every cold start wipes a reviewer's edits after
15 idle minutes. Instead the Render start command runs `python -m scripts.seed --if-stale`, which
resets only when `app_meta.seeded_at` is missing or older than `RESEED_AFTER_HOURS` (default 6).
Local Docker keeps `SEED_ON_START` (seed once, never reset).

### D-17 Vitest and Testing Library for web unit tests
Alternatives: no web tests, manual checks only; Vitest 5, which needs `@types/node` 22+ (the
project has 20); `@vitejs/plugin-react`, whose Babel peer dependency conflicts. Why: the follow-up
quick picks and date inputs run in the browser's own time zone, which pytest never sees, so they
need real tests. Vitest 4 with jsdom, `@testing-library/react`, `user-event` and `jest-dom`; the
runner pins `TZ=America/New_York` so results are the same on every machine and DST can be tested.
Scope stays small: `lib/dates.ts` plus one Add Lead form test. End-to-end flows are covered
separately. From here on, web-only logic changes need a Vitest test; purely visual changes note
the manual check in the commit body. "Next Monday 10 AM" always means the coming week's Monday,
also on a Monday: 10 AM today is often past, and "Tomorrow 10 AM" covers the short term.

### D-18 Edit lead details inline in the dialog header, saved without optimism
Alternatives: a separate Edit Lead dialog; optimistic save like the status select; sending only
changed fields; leaving a blank company or phone out of the PATCH. Why: an Edit button in the
header keeps the timeline in view and needs no second dialog. Save waits for the response so
validation errors land on the fields; status stays optimistic because it cannot fail validation.
The form sends name, company and phone together, with a blank company or phone as `null` so it
clears; the API ignores unchanged values. Editing details writes no timeline entry: only status
changes are logged (R-5). The form reuses the Add Lead schema (`lib/leadForm.ts`).

## Open

- None. The deploy target was decided in D-16.
