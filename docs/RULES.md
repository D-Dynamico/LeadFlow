# LeadFlow business rules

These rules are the correctness core. They live only in `api/app/services/` and `api/app/timeutil.py`,
and every rule has a test in [TEST_PLAN.md](TEST_PLAN.md). Cite them by ID (R-1 to R-6) in docstrings
and commit bodies. IDs are stable: add new rules at the end, never renumber.

## R-1 Time and timezone

- Store every timestamp as UTC `timestamptz`. Never store local time.
- The client sends its IANA timezone as `tz`. The API resolves it with `zoneinfo.ZoneInfo`.
- "Today" means the local calendar day in `tz`: `[start_of_day_local, start_of_next_day_local)`,
  converted to UTC for comparisons.
- "Now" is read once per request and passed down, so one request never sees two different nows.
  Services take `now` as a parameter so tests can fix it.

## R-2 Follow-up states

For a lead with `next_follow_up_at = f`, given `now` and today's local bounds `[d0, d1)`:

| State | Condition | UI |
| --- | --- | --- |
| `overdue` | `f < now` | red badge, red left border |
| `today` | `now <= f < d1` | amber badge |
| `upcoming` | `f >= d1` | neutral date chip |
| `none` | `f is null` | nothing |

A follow-up earlier today that has already passed is `overdue`, not `today`.

## R-3 Pinned section and list ordering

- `pinned` = leads whose state is `overdue` or `today` (overdue included on purpose, D-5).
- Pinned order: all `overdue` first, oldest `f` first; then `today`, earliest `f` first.
- `others` order: leads by `coalesce(last_discussion_at, created_at)` descending, except leads with
  status `won` or `lost` and no follow-up, which come last in the same descending order.
- Status filter and search apply to both sections. Counts ignore the status filter but respect search.

## R-4 Follow-up lifecycle

- Adding a note with `follow_up_at`: lead's `next_follow_up_at = follow_up_at`.
- Adding a note without `follow_up_at`: lead's `next_follow_up_at = null`. Logging a discussion means
  the follow-up happened (D-7).
- `follow_up_at` must be strictly after `now`; otherwise 422 `FOLLOW_UP_IN_PAST` (D-8).
- `DELETE /leads/{id}/follow-up` sets `next_follow_up_at = null` without adding a discussion.
- Status changes never touch `next_follow_up_at`.

## R-5 Status

- Values and labels: `new` New, `contacted` Contacted, `qualified` Qualified,
  `proposal_sent` Proposal Sent, `won` Won, `lost` Lost.
- New leads default to `new`.
- Any transition is allowed, including back to an earlier status (D-10).
- Setting the same status again is a no-op: 200, no status_change entry.
- Each real change writes a `status_change` discussion with body `<Old label> → <New label>` (D-9).

## R-6 Edge cases for the rules above

- Near midnight: with `tz=Asia/Kolkata`, a follow-up at `2026-10-13T18:45:00Z` is 00:15 IST on 14 Oct,
  so it is `upcoming` on 13 Oct IST even though it is still 13 Oct in UTC.
- DST zones (e.g. `America/New_York`): day bounds come from `ZoneInfo`, never from adding 24 hours.
- A follow-up equal to `now` is `today`, and becomes `overdue` the moment it passes.
