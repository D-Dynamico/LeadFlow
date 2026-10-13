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

## Open

- Deploy target for the live link: Vercel + Render/Railway, or skip. Decide on Day 3.
