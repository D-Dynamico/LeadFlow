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
