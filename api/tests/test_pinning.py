"""Pinned section and list ordering, see R-3, D-4, D-5."""

from collections.abc import Callable
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.models import Lead, LeadStatus


def names(section: list[dict[str, object]]) -> list[object]:
    return [lead["name"] for lead in section]


def test_overdue_before_today_each_by_follow_up_time(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    make_lead(name="Today late", next_follow_up_at=fixed_now + timedelta(hours=5))
    make_lead(name="Overdue recent", next_follow_up_at=fixed_now - timedelta(hours=1))
    make_lead(name="Today soon", next_follow_up_at=fixed_now + timedelta(minutes=30))
    make_lead(name="Overdue old", next_follow_up_at=fixed_now - timedelta(days=3))
    make_lead(name="Upcoming", next_follow_up_at=fixed_now + timedelta(days=2))
    make_lead(name="No follow-up")

    body = client.get("/api/v1/leads?tz=UTC").json()

    assert names(body["pinned"]) == ["Overdue old", "Overdue recent", "Today soon", "Today late"]
    assert [lead["follow_up_state"] for lead in body["pinned"]] == [
        "overdue",
        "overdue",
        "today",
        "today",
    ]
    assert set(names(body["others"])) == {"Upcoming", "No follow-up"}


def test_others_by_latest_activity_with_closed_leads_last(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    def ago(hours: int) -> datetime:
        return fixed_now - timedelta(hours=hours)

    make_lead(name="Won, recent", status=LeadStatus.WON, last_discussion_at=ago(1))
    make_lead(name="Contacted, older", status=LeadStatus.CONTACTED, last_discussion_at=ago(5))
    make_lead(name="New, no notes", created_at=ago(3))  # falls back to created_at
    make_lead(name="Lost, old", status=LeadStatus.LOST, last_discussion_at=ago(10))
    make_lead(
        name="Won with follow-up",
        status=LeadStatus.WON,
        last_discussion_at=ago(8),
        next_follow_up_at=fixed_now + timedelta(days=4),
    )

    body = client.get("/api/v1/leads?tz=UTC").json()

    assert body["pinned"] == []
    assert names(body["others"]) == [
        "New, no notes",
        "Contacted, older",
        "Won with follow-up",
        "Won, recent",
        "Lost, old",
    ]


def test_status_filter_and_search_apply_to_both_sections(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    overdue = fixed_now - timedelta(hours=2)
    make_lead(name="Ravi", status=LeadStatus.QUALIFIED, next_follow_up_at=overdue)
    make_lead(name="Rahul", status=LeadStatus.NEW, next_follow_up_at=overdue)
    make_lead(name="Raj", status=LeadStatus.QUALIFIED)
    make_lead(name="Asha", status=LeadStatus.QUALIFIED, next_follow_up_at=overdue)

    body = client.get("/api/v1/leads?tz=UTC&status=qualified&q=ra").json()

    assert names(body["pinned"]) == ["Ravi"]
    assert names(body["others"]) == ["Raj"]
