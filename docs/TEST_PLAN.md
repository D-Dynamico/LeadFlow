# LeadFlow test plan

API tests run with pytest against the `leadflow_test` Postgres database (D-2). Each test runs in a
transaction that is rolled back. `now` is fixed through a fixture so time-based tests are deterministic.
About 20 focused tests is the target; quality over count.

## Fixtures and seed data

Test fixtures:

- `fixed_now`: `2026-10-13T10:00:00Z` (15:30 IST)
- `client`: httpx TestClient with the test DB session injected
- `make_lead(**overrides)` and `make_discussion(lead, **overrides)` factories

Seed script (`api/scripts/seed.py`), all times relative to the real current time, `--reset` wipes first.
Must cover every state:

| Lead | Status | Follow-up | History |
| --- | --- | --- | --- |
| 1 | contacted | 2 days ago (overdue) | 3 notes |
| 2 | proposal_sent | earlier today, passed (overdue) | 4 notes + status changes |
| 3 | qualified | later today (today) | 6+ notes (long history) |
| 4 | new | later today (today) | 1 note |
| 5 | contacted | in 3 days (upcoming) | 2 notes |
| 6 | new | none | no notes |
| 7 | won | none | 5 notes + status changes |
| 8 | lost | none | 2 notes |

Realistic Indian and international names and companies; notes read like real call logs.

## Tests per area

### Follow-up state and time
Covers R-1, R-2, R-6.
- overdue, today, upcoming, none for a lead in `UTC`
- near-midnight case: `2026-10-13T18:45:00Z` is `upcoming` in `Asia/Kolkata`, `today` in `UTC`
- follow-up equal to `now` is `today`
- DST day bounds in `America/New_York` on a transition day are 23 or 25 hours long, not 24

### Leads endpoints
Covers [Endpoints](API.md#endpoints) and [Error envelope](API.md#error-envelope).
- `POST /leads` returns 201, `Location` header, status `new`
- empty or whitespace name returns 422 `VALIDATION_ERROR` with `details[0].field == "name"`
- unknown id and malformed id both return 404 `LEAD_NOT_FOUND` on GET, PATCH, discussions, follow-up
- list with unknown `status` returns 422 `INVALID_STATUS`; missing `tz` returns 422 `INVALID_TIMEZONE`
- search is case-insensitive and applies to both sections

### Pinning and ordering
Covers R-3.
- overdue before today; within each, by follow-up time ascending
- won and lost without a follow-up sink to the end of `others`
- counts ignore the status filter but respect search

### Discussions and follow-ups
Covers R-4 and [Write rules](ARCHITECTURE.md#write-rules).
- adding a note with a follow-up sets `next_follow_up_at`, `last_note_preview`, `last_discussion_at`
- adding a note without a follow-up clears `next_follow_up_at`
- follow-up in the past returns 422 `FOLLOW_UP_IN_PAST` and writes nothing
- timeline returns newest first
- `DELETE /leads/{id}/follow-up` returns 204 and clears the follow-up

### Status
Covers R-5.
- PATCH status persists and creates one `status_change` entry with the right body
- same status again creates no entry
- status change does not touch `last_note_preview` or `next_follow_up_at`

### Lead details
Covers [Endpoints](API.md#endpoints) PATCH and D-18 (`test_lead_details.py`).
- PATCH saves trimmed name, company, phone; writes no timeline entry; follow-up and last note untouched
- `null`, empty or blank company and phone clear them
- unchanged details do not bump `updated_at`
- invalid phone returns 422 with `details[0].field == "phone"`

### Web unit tests
Vitest with jsdom (D-17), run with `cd web && npm test`. `TZ` is pinned to `America/New_York`.
- `timeAgo`: "just now" inside a minute either side; otherwise measured from the given `now`
- `formatFollowUp`: today, tomorrow, yesterday in the given zone; near midnight in `Asia/Kolkata`
  vs `UTC`; year shown only when it differs; 10:00 on the New York DST day is `15:00Z`
- `formatTimestamp`: month, day, time; year only when it differs in the viewer's zone
- `quickPicks`: Tomorrow 10 AM from 23:30 is the next day; Next Monday on a Monday is a week later;
  Tomorrow 10 AM from 23:30 EDT on Sat 31 Oct is `2026-11-01T15:00:00Z` (EST)
- date and time inputs: local values convert to UTC with the right offset; only later times count
  as future
- Add Lead form: submitting an empty name shows "Name is required", marks the field invalid, and
  sends no request
- `lib/leadForm.ts`: schema errors; blank company or phone become `null` in the PATCH body (D-18)
- Edit lead form: cleared name shows an error and sends nothing; a saved edit sends `PATCH` with
  `phone: null` and closes; Escape cancels without saving

Web-only logic changes need a test here; purely visual changes note the manual check in the commit.

### Web manual checklist
Run in S5 and S6.
- add note with follow-up for later today: row moves into Pinned without a page reload
- change status in dialog, close, refresh: status persists
- overdue row is red; today row is amber
- refresh with `?status=qualified&q=ra&lead=<id>` restores filter, search, and open dialog

## Mutation checks

Break the code on purpose; the named test must fail. Revert after each check. Run once in S3.

| Mutation | Must fail |
| --- | --- |
| Overdue check `f < now` changed to `f <= now` | Follow-up state: equal to now |
| Ignore `tz` and use UTC day bounds | Follow-up state: near midnight |
| Compute day end as `d0 + 24h` | Follow-up state: DST bounds |
| Swap pinned order (today before overdue) | Pinning: overdue before today |
| Skip clearing the follow-up on a note without one | Discussions: note without follow-up clears it |
| Commit the discussion before updating the lead, then raise | Discussions: past date writes nothing |
| Remove the custom 422 handler | Leads endpoints: empty name envelope |
| `timeAgo` measures from the real clock | Web: `timeAgo` measures from the given now |
| Next Monday returns today on a Monday | Web: `quickPicks` Next Monday on a Monday |
| 10 AM computed as midnight + 10 hours | Web: `quickPicks` across the DST change |
| Drop the required check on the lead name | Web: Add Lead form empty name |
| Log a status_change for every edited field | Lead details: no timeline entry |
| Keep a blank company as an empty string | Lead details: blank clears |
| Send a blank phone as `""` instead of `null` | Web: `toLeadUpdate`, edit form saves |
| Escape no longer cancels the edit | Web: edit form Escape |
