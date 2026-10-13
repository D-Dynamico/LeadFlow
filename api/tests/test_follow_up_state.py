"""Follow-up state, see R-2 and R-6."""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.services.leads import follow_up_state
from app.timeutil import local_day_bounds

NOW = datetime(2026, 10, 13, 10, 0, tzinfo=UTC)
UTC_ZONE = ZoneInfo("UTC")
KOLKATA = ZoneInfo("Asia/Kolkata")


def state(follow_up_at: datetime | None, tz: ZoneInfo) -> str:
    _, day_end = local_day_bounds(NOW, tz)
    return follow_up_state(follow_up_at, NOW, day_end)


@pytest.mark.parametrize(
    ("follow_up_at", "expected"),
    [
        (NOW - timedelta(days=2), "overdue"),
        (NOW - timedelta(minutes=1), "overdue"),  # earlier today, already passed
        (NOW + timedelta(hours=3), "today"),
        (datetime(2026, 10, 14, 0, 0, tzinfo=UTC), "upcoming"),  # exactly d1
        (None, "none"),
    ],
)
def test_states_in_utc(follow_up_at: datetime | None, expected: str) -> None:
    assert state(follow_up_at, UTC_ZONE) == expected


def test_follow_up_equal_to_now_is_today() -> None:
    assert state(NOW, UTC_ZONE) == "today"


def test_near_midnight_depends_on_viewer_timezone() -> None:
    # 00:15 IST on 14 Oct, still 13 Oct in UTC (R-6).
    follow_up_at = datetime(2026, 10, 13, 18, 45, tzinfo=UTC)

    assert state(follow_up_at, KOLKATA) == "upcoming"
    assert state(follow_up_at, UTC_ZONE) == "today"
