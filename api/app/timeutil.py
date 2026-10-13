"""Time helpers, see R-1 and R-6."""

from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.errors import AppError


def utcnow() -> datetime:
    """Request-scoped "now" (R-1). Routers read it once via Depends; tests override it."""
    return datetime.now(UTC)


def resolve_tz(name: str | None) -> ZoneInfo:
    """Resolve an IANA zone name, or raise 422 INVALID_TIMEZONE (API.md)."""
    if not name or not name.strip():
        raise AppError("INVALID_TIMEZONE", "Timezone is required", 422)
    try:
        return ZoneInfo(name.strip())
    except (ZoneInfoNotFoundError, ValueError):
        raise AppError("INVALID_TIMEZONE", f"Unknown timezone: {name}", 422) from None


def local_day_bounds(now: datetime, tz: ZoneInfo) -> tuple[datetime, datetime]:
    """UTC bounds [d0, d1) of the local calendar day containing `now` in `tz` (R-1).

    Both ends come from local midnight through ZoneInfo, never from adding 24 hours,
    so DST days are 23 or 25 hours long (R-6).
    """
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    local_date = now.astimezone(tz).date()
    start = datetime.combine(local_date, time.min, tzinfo=tz)
    end = datetime.combine(local_date + timedelta(days=1), time.min, tzinfo=tz)
    return start.astimezone(UTC), end.astimezone(UTC)
