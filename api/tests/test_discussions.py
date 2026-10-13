"""Discussions and follow-ups, see R-4, D-7, D-8, and ARCHITECTURE.md Write rules."""

from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models import Discussion, DiscussionKind, Lead, LeadStatus

UNKNOWN_ID = "00000000-0000-4000-8000-000000000000"


def url(lead: Lead) -> str:
    return f"/api/v1/leads/{lead.id}/discussions"


def test_note_with_follow_up_updates_the_lead(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead()

    response = client.post(
        url(lead), json={"body": "  Wants pricing  ", "follow_up_at": "2026-10-13T21:00:00+05:30"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["discussion"]["kind"] == "note"
    assert body["discussion"]["body"] == "Wants pricing"
    assert body["discussion"]["follow_up_at"] == "2026-10-13T15:30:00Z"
    assert body["lead"]["next_follow_up_at"] == "2026-10-13T15:30:00Z"
    assert body["lead"]["follow_up_state"] == "today"
    assert body["lead"]["last_note_preview"] == "Wants pricing"
    assert body["lead"]["last_discussion_at"] == "2026-10-13T10:00:00Z"
    assert body["lead"]["updated_at"] == "2026-10-13T10:00:00Z"
    pinned = client.get("/api/v1/leads?tz=UTC").json()["pinned"]
    assert [p["id"] for p in pinned] == [str(lead.id)]


def test_note_without_follow_up_clears_it(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead(next_follow_up_at=fixed_now + timedelta(hours=2))

    response = client.post(url(lead), json={"body": "Called, done for now"})

    assert response.status_code == 201
    assert response.json()["lead"]["next_follow_up_at"] is None
    assert response.json()["lead"]["follow_up_state"] == "none"


def test_long_note_is_previewed_but_stored_in_full(
    client: TestClient, make_lead: Callable[..., Lead]
) -> None:
    lead = make_lead()
    text = "Line one\n" + "x" * 400

    response = client.post(url(lead), json={"body": text})

    assert response.json()["lead"]["last_note_preview"] == text[:200]
    assert client.get(url(lead)).json()[0]["body"] == text


@pytest.mark.parametrize("offset", [timedelta(minutes=-5), timedelta(0)])
def test_follow_up_not_after_now_is_rejected_and_writes_nothing(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime, offset: timedelta
) -> None:
    follow_up = fixed_now + timedelta(days=1)
    lead = make_lead(next_follow_up_at=follow_up)
    before = client.get(f"/api/v1/leads/{lead.id}").json()

    payload = {"body": "Typo in the date", "follow_up_at": (fixed_now + offset).isoformat()}

    response = client.post(url(lead), json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "FOLLOW_UP_IN_PAST"
    assert client.get(url(lead)).json() == []
    assert client.get(f"/api/v1/leads/{lead.id}").json() == before


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({"body": "   "}, "body"),
        ({"body": "x" * 5001}, "body"),
        ({"body": "Naive time", "follow_up_at": "2026-10-14T10:00:00"}, "follow_up_at"),
    ],
)
def test_invalid_note_is_rejected(
    client: TestClient, make_lead: Callable[..., Lead], payload: dict[str, str], field: str
) -> None:
    lead = make_lead()

    response = client.post(url(lead), json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["details"][0]["field"] == field


def test_timeline_is_newest_first(
    client: TestClient,
    make_lead: Callable[..., Lead],
    make_discussion: Callable[..., Discussion],
    fixed_now: datetime,
) -> None:
    lead = make_lead()
    make_discussion(lead, body="First call", created_at=fixed_now - timedelta(days=3))
    make_discussion(
        lead,
        kind=DiscussionKind.STATUS_CHANGE,
        body="New \u2192 Contacted",
        created_at=fixed_now - timedelta(days=2),
    )
    make_discussion(lead, body="Sent brochure", created_at=fixed_now - timedelta(hours=1))

    response = client.get(url(lead))

    assert response.status_code == 200
    assert [d["body"] for d in response.json()] == [
        "Sent brochure",
        "New \u2192 Contacted",
        "First call",
    ]


def test_mark_follow_up_done_clears_it_without_a_note(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead(
        status=LeadStatus.QUALIFIED,
        next_follow_up_at=fixed_now - timedelta(hours=1),
        last_note_preview="Call back after lunch",
    )

    response = client.delete(f"/api/v1/leads/{lead.id}/follow-up")

    assert response.status_code == 204
    assert response.content == b""
    fetched = client.get(f"/api/v1/leads/{lead.id}").json()
    assert fetched["next_follow_up_at"] is None
    assert fetched["follow_up_state"] == "none"
    assert fetched["last_note_preview"] == "Call back after lunch"
    assert client.get(url(lead)).json() == []
    assert client.delete(f"/api/v1/leads/{lead.id}/follow-up").status_code == 204


@pytest.mark.parametrize("lead_id", [UNKNOWN_ID, "not-a-uuid"])
@pytest.mark.parametrize(
    ("method", "suffix"), [("GET", "discussions"), ("POST", "discussions"), ("DELETE", "follow-up")]
)
def test_unknown_lead_is_404(client: TestClient, method: str, suffix: str, lead_id: str) -> None:
    response = client.request(method, f"/api/v1/leads/{lead_id}/{suffix}", json={"body": "Hello"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "LEAD_NOT_FOUND"
