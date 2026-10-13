"""Status changes, see R-5, D-9, D-10."""

from collections.abc import Callable
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Discussion, DiscussionKind, Lead, LeadStatus


def status_changes(db: Session, lead: Lead) -> list[Discussion]:
    stmt = select(Discussion).where(
        Discussion.lead_id == lead.id, Discussion.kind == DiscussionKind.STATUS_CHANGE
    )
    return list(db.scalars(stmt))


def test_status_change_persists_and_is_logged_once(
    client: TestClient, db: Session, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead(status=LeadStatus.CONTACTED)

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "proposal_sent"})

    assert response.status_code == 200
    assert client.get(f"/api/v1/leads/{lead.id}").json()["status"] == "proposal_sent"
    [entry] = status_changes(db, lead)
    assert entry.body == "Contacted \u2192 Proposal Sent"
    assert entry.created_at == fixed_now
    assert entry.follow_up_at is None


def test_moving_back_to_an_earlier_status_is_allowed(
    client: TestClient, db: Session, make_lead: Callable[..., Lead]
) -> None:
    lead = make_lead(status=LeadStatus.LOST)

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "qualified"})

    assert response.status_code == 200
    assert [d.body for d in status_changes(db, lead)] == ["Lost \u2192 Qualified"]


def test_same_status_again_is_a_noop(
    client: TestClient, db: Session, make_lead: Callable[..., Lead]
) -> None:
    lead = make_lead(status=LeadStatus.WON)
    before = client.get(f"/api/v1/leads/{lead.id}").json()["updated_at"]

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "won"})

    assert response.status_code == 200
    assert response.json()["updated_at"] == before
    assert status_changes(db, lead) == []


def test_status_change_keeps_note_fields_and_follow_up(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead(
        status=LeadStatus.NEW,
        next_follow_up_at=fixed_now + timedelta(days=2),
        last_note_preview="Asked for a demo",
        last_discussion_at=fixed_now - timedelta(hours=3),
    )

    body = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "contacted"}).json()

    assert body["next_follow_up_at"] == "2026-10-15T10:00:00Z"
    assert body["last_note_preview"] == "Asked for a demo"
    assert body["last_discussion_at"] == "2026-10-13T07:00:00Z"
