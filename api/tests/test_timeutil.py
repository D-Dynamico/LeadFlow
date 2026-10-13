"""Local-day bounds and timezone resolution, see R-1 and R-6."""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.errors import AppError
from app.timeutil import local_day_bounds, resolve_tz

NEW_YORK = ZoneInfo("America/New_York")


def test_day_bounds_are_local_midnights_in_utc() -> None:
    now = datetime(2026, 10, 13, 10, 0, tzinfo=UTC)  # 15:30 IST

    assert local_day_bounds(now, ZoneInfo("Asia/Kolkata")) == (
        datetime(2026, 10, 12, 18, 30, tzinfo=UTC),
        datetime(2026, 10, 13, 18, 30, tzinfo=UTC),
    )


@pytest.mark.parametrize(
    ("now", "hours"),
    [
        (datetime(2026, 3, 8, 17, 0, tzinfo=UTC), 23),  # DST starts in New York
        (datetime(2026, 11, 1, 17, 0, tzinfo=UTC), 25),  # DST ends in New York
    ],
)
def test_dst_day_bounds_follow_local_midnight(now: datetime, hours: int) -> None:
    d0, d1 = local_day_bounds(now, NEW_YORK)

    assert d1 - d0 == timedelta(hours=hours)
    assert d0.astimezone(NEW_YORK).hour == 0
    assert d1.astimezone(NEW_YORK).hour == 0


@pytest.mark.parametrize("name", [None, "", "   ", "Mars/Olympus", "../etc/passwd"])
def test_invalid_timezone_is_rejected(name: str | None) -> None:
    with pytest.raises(AppError) as exc:
        resolve_tz(name)

    assert exc.value.code == "INVALID_TIMEZONE"
    assert exc.value.status == 422
