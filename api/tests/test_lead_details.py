"""Editing a lead's name, company and phone, see API.md Endpoints and D-18."""

from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Discussion, Lead


def test_patch_saves_trimmed_details_without_a_timeline_entry(
    client: TestClient,
    db: Session,
    make_lead: Callable[..., Lead],
    make_discussion: Callable[..., Discussion],
    fixed_now: datetime,
) -> None:
    follow_up = fixed_now + timedelta(days=2)
    lead = make_lead(
        name="Ravi Sharme",
        next_follow_up_at=follow_up,
        last_note_preview="Called",
        last_discussion_at=fixed_now - timedelta(hours=1),
    )
    make_discussion(lead)

    response = client.patch(
        f"/api/v1/leads/{lead.id}",
        json={"name": " Ravi Sharma ", "company": " Acme Logistics ", "phone": "+91 98765 43210"},
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["name"], body["company"], body["phone"]) == (
        "Ravi Sharma",
        "Acme Logistics",
        "+91 98765 43210",
    )
    # Details are not status: no status_change entry, follow-up and last note untouched (R-4, R-5).
    assert db.scalar(select(func.count()).select_from(Discussion)) == 1
    db.refresh(lead)
    assert lead.next_follow_up_at == follow_up
    assert lead.last_note_preview == "Called"
    assert lead.updated_at == fixed_now


@pytest.mark.parametrize("cleared", [None, "", "   "])
def test_patch_clears_company_and_phone(
    client: TestClient, make_lead: Callable[..., Lead], cleared: str | None
) -> None:
    lead = make_lead(company="Acme Logistics", phone="+91 98765 43210")

    response = client.patch(
        f"/api/v1/leads/{lead.id}", json={"company": cleared, "phone": cleared}
    )

    assert response.status_code == 200
    assert (response.json()["company"], response.json()["phone"]) == (None, None)


def test_patch_with_unchanged_details_does_not_bump_updated_at(
    client: TestClient, db: Session, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    lead = make_lead(name="Ravi Sharma", company=None, phone=None)
    before = lead.updated_at

    response = client.patch(
        f"/api/v1/leads/{lead.id}", json={"name": "Ravi Sharma", "company": "", "phone": None}
    )

    assert response.status_code == 200
    db.refresh(lead)
    assert lead.updated_at == before != fixed_now


def test_patch_rejects_an_invalid_phone(client: TestClient, make_lead: Callable[..., Lead]) -> None:
    lead = make_lead()

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"phone": "call me"})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "phone"
