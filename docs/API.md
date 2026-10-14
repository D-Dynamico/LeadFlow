# LeadFlow API

## Conventions

- Base path `/api/v1`. JSON only. All datetimes are ISO 8601 with offset, returned in UTC (`Z`).
- Enum values are snake_case: `new, contacted, qualified, proposal_sent, won, lost`.
- IDs are UUIDs. A malformed UUID returns 404 `LEAD_NOT_FOUND`, not 422.

## Endpoints

| Method and path | Purpose | Success | Errors |
| --- | --- | --- | --- |
| `GET /leads?status=&q=&tz=` | List, split into pinned and others, with counts | 200 | 422 `INVALID_STATUS`, `INVALID_TIMEZONE` |
| `POST /leads` | Create a lead | 201 + `Location` | 422 `VALIDATION_ERROR` |
| `GET /leads/{id}?tz=` | One lead | 200 | 404 `LEAD_NOT_FOUND` |
| `PATCH /leads/{id}` | Update status (and name, company, phone) | 200, updated lead | 404, 422 |
| `GET /leads/{id}/discussions` | Timeline, newest first | 200 | 404 |
| `POST /leads/{id}/discussions` | Add a note, optional follow-up | 201, `{ discussion, lead }` | 404, 422 `VALIDATION_ERROR`, `FOLLOW_UP_IN_PAST` |
| `DELETE /leads/{id}/follow-up` | Mark follow-up done | 204 | 404 |
| `GET /health` | Liveness for Docker | 200 `{ "status": "ok" }` | |

Validation:

- `name`: required, trimmed, 1 to 120 chars
- `company`: optional, up to 120 chars, empty string becomes null
- `phone`: optional, matches `^[0-9+\-\s()]{6,32}$`, empty string becomes null
- `status`: one of the enum values
- `PATCH /leads/{id}`: send only the fields to change. `name` cannot be null or blank; `company` and
  `phone` accept `null` or a blank string to clear. Unchanged values are a no-op, with no
  `updated_at` bump. Only a status change writes a timeline entry (R-5); editing details does not.
- `body` (note): required, trimmed, 1 to 5000 chars
- `follow_up_at`: optional, timezone-aware datetime, must be after now (R-4)
- `q`: optional, trimmed, case-insensitive substring of `name`
- `tz`: required on list, an IANA zone name (`Asia/Kolkata`)

## Error envelope

Every non-2xx response (D-12):

```json
{ "error": { "code": "LEAD_NOT_FOUND", "message": "Lead not found", "details": null } }
```

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | body or query fails validation; `details` is a list of `{ field, message }` |
| `INVALID_STATUS` | 422 | unknown `status` filter |
| `INVALID_TIMEZONE` | 422 | missing or unknown `tz` |
| `FOLLOW_UP_IN_PAST` | 422 | `follow_up_at` is not after now |
| `LEAD_NOT_FOUND` | 404 | id does not exist or is not a UUID |
| `INTERNAL_ERROR` | 500 | anything unexpected; details logged, never returned |

## Response shapes

Lead:

```json
{
  "id": "6f1c2c1e-3a0b-4d6e-9b1a-1f2e3d4c5b6a",
  "name": "Ravi Sharma",
  "company": "Acme Logistics",
  "phone": "+91 98765 43210",
  "status": "qualified",
  "next_follow_up_at": "2026-10-14T04:30:00Z",
  "follow_up_state": "today",
  "last_note_preview": "Wants a demo for the ops team next week",
  "last_discussion_at": "2026-10-13T09:12:00Z",
  "created_at": "2026-10-10T06:00:00Z",
  "updated_at": "2026-10-13T09:12:00Z"
}
```

`follow_up_state` is one of `overdue`, `today`, `upcoming`, `none`, computed for the request's `tz`
(R-2). On endpoints without `tz`, it is computed in UTC and the web should prefer the list's value.

List:

```json
{
  "pinned": [ /* leads, R-3 order */ ],
  "others": [ /* leads, R-3 order */ ],
  "counts": { "all": 9, "new": 2, "contacted": 2, "qualified": 2, "proposal_sent": 1, "won": 1, "lost": 1 }
}
```

Discussion:

```json
{
  "id": "…",
  "lead_id": "…",
  "kind": "note",
  "body": "Called, asked for pricing sheet",
  "follow_up_at": "2026-10-15T05:30:00Z",
  "created_at": "2026-10-13T09:12:00Z"
}
```

Add discussion response (201): `{ "discussion": Discussion, "lead": Lead }` (D-11).
