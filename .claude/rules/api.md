---
paths:
  - "api/**"
---

# API rules (FastAPI)

- Layering: `routers/` parse and respond, `services/` hold business logic, `models.py` is the database.
  Routers never contain business rules; services never return HTTP responses.
- Every error goes through `errors.py` as an `AppError(code, message, status, details)` and is rendered
  in the envelope from `docs/API.md#error-envelope`. Override FastAPI's default 422 handler so
  validation errors use it too (D-12).
- Status codes per `docs/API.md#endpoints`: 201 + `Location` on create, 200 on read/update, 204 on
  delete, 404 for a missing lead, 422 for invalid input. Never return 200 with an error body. Never leak
  stack traces.
- Store and compare datetimes as timezone-aware UTC (`timestamptz`, `datetime.now(timezone.utc)`).
  Never use naive datetimes. Local-day logic takes an explicit `ZoneInfo` (R-1).
- Adding a discussion and updating the lead's denormalized fields happen in one transaction
  (`docs/ARCHITECTURE.md#write-rules`).
- Mutations return the updated lead so the frontend can patch its cache (D-11).
- Pydantic v2 models in `schemas.py`; request and response models are separate classes.
- Every new rule or endpoint gets a test in the same commit (`docs/TEST_PLAN.md`).
