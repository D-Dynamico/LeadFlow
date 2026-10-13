# Session state

Updated: Wed 14 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 Scaffold, S2 API core.
- S3 Follow-up rules, discussions, seed: exit criteria pass. Pinning (R-3), status_change
  entries (R-5), add note in one transaction (R-4, D-7, D-8), timeline, mark follow-up done,
  `scripts/seed.py`, seed on container start. 65 API tests green; all 7 mutation checks
  in TEST_PLAN.md fail their named tests.
- The API is complete for every endpoint in API.md.

## Now
- Stage S4 Frontend list (WORKFLOWS.md, Build stages). Not started.

## Next
1. S4: `lib/types.ts` mirroring API.md shapes, `lib/api.ts` (parses the error envelope),
   `lib/dates.ts`, `hooks/useLeads.ts`; `LeadList` with Pinned and All sections, `LeadRow`,
   `StatusBadge`, `FollowUpChip`, search (300 ms debounce), status chips with counts,
   URL state `?status=&q=`. Needs TanStack Query, date-fns, date-fns-tz installed in `web/`.
2. S5: timeline dialog, add-discussion form, status select, add-lead dialog, cache updates.

## Notes
- List response: render `pinned` and `others` exactly as returned (D-4); always send `tz`.
- `POST /leads/{id}/discussions` and `PATCH` return `follow_up_state` in UTC (no `tz`);
  invalidate the list after writing the returned lead into caches (ARCHITECTURE.md, Cache updates).
- `POST /leads/{id}/discussions` has no `Location` header: API.md lists one only for `POST /leads`,
  and there is no single-discussion resource.
- Seed: `python -m scripts.seed --reset [--tz Asia/Kolkata]`. "Today" leads are placed in the
  `--tz` local day (default IST); in Docker, `docker compose exec api python -m scripts.seed --reset`.
- Docker db is on host port 5433 (D-15). Unknown routes return `NOT_FOUND`, 405 `METHOD_NOT_ALLOWED`.

## Open questions
- Deploy target (DECISIONS.md, Open), decide Day 3.
