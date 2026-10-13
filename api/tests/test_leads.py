"""Leads endpoints, see API.md Endpoints and Error envelope."""

from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models import Lead, LeadStatus

UNKNOWN_ID = "00000000-0000-4000-8000-000000000000"


def test_create_lead_returns_201_with_location(client: TestClient) -> None:
    response = client.post(
        "/api/v1/leads", json={"name": "  Ravi Sharma ", "company": "", "phone": "+91 98765 43210"}
    )

    assert response.status_code == 201
    body = response.json()
    assert response.headers["Location"] == f"/api/v1/leads/{body['id']}"
    assert body["name"] == "Ravi Sharma"
    assert body["company"] is None
    assert body["status"] == "new"
    assert body["follow_up_state"] == "none"
    assert body["created_at"] == "2026-10-13T10:00:00Z"


@pytest.mark.parametrize("name", ["", "   "])
def test_blank_name_returns_validation_envelope(client: TestClient, name: str) -> None:
    response = client.post("/api/v1/leads", json={"name": name})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["details"][0]["field"] == "name"


def test_invalid_phone_is_rejected(client: TestClient) -> None:
    response = client.post("/api/v1/leads", json={"name": "Asha", "phone": "call me"})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "phone"


@pytest.mark.parametrize("lead_id", [UNKNOWN_ID, "not-a-uuid"])
@pytest.mark.parametrize("method", ["GET", "PATCH"])
def test_unknown_or_malformed_id_is_404(client: TestClient, method: str, lead_id: str) -> None:
    response = client.request(method, f"/api/v1/leads/{lead_id}", json={"status": "won"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "LEAD_NOT_FOUND"


@pytest.mark.parametrize(
    ("query", "code"),
    [
        ("?tz=UTC&status=archived", "INVALID_STATUS"),
        ("", "INVALID_TIMEZONE"),
        ("?tz=Mars/Olympus", "INVALID_TIMEZONE"),
    ],
)
def test_list_rejects_bad_filters(client: TestClient, query: str, code: str) -> None:
    response = client.get(f"/api/v1/leads{query}")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == code


def test_search_is_case_insensitive_and_literal(
    client: TestClient, make_lead: Callable[..., Lead]
) -> None:
    make_lead(name="Ravi Sharma")
    make_lead(name="Priya Raman")
    make_lead(name="John 100% Doe")
    make_lead(name="Asha Nair")

    names = lambda q: {  # noqa: E731
        lead["name"] for lead in client.get(f"/api/v1/leads?tz=UTC&q={q}").json()["others"]
    }

    assert names("RA") == {"Ravi Sharma", "Priya Raman"}
    assert names("%25") == {"John 100% Doe"}
    assert len(names("%20%20")) == 4  # only spaces counts as no search


def test_status_filter_and_counts(client: TestClient, make_lead: Callable[..., Lead]) -> None:
    make_lead(name="Ravi", status=LeadStatus.QUALIFIED)
    make_lead(name="Rahul", status=LeadStatus.NEW)
    make_lead(name="Asha", status=LeadStatus.QUALIFIED)

    body = client.get("/api/v1/leads?tz=UTC&status=qualified&q=ra").json()

    assert [lead["name"] for lead in body["others"]] == ["Ravi"]
    # Counts ignore the status filter but respect search (R-3).
    assert body["counts"]["all"] == 2
    assert body["counts"]["qualified"] == 1
    assert body["counts"]["new"] == 1
    assert body["counts"]["won"] == 0


def test_list_state_uses_request_timezone(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    make_lead(next_follow_up_at=fixed_now.replace(hour=18, minute=45))

    def section_and_state(tz: str) -> tuple[str, str]:
        body = client.get(f"/api/v1/leads?tz={tz}").json()
        section = "pinned" if body["pinned"] else "others"
        return section, body[section][0]["follow_up_state"]

    assert section_and_state("Asia/Kolkata") == ("others", "upcoming")
    assert section_and_state("UTC") == ("pinned", "today")


def test_patch_status_persists_and_keeps_follow_up(
    client: TestClient, make_lead: Callable[..., Lead], fixed_now: datetime
) -> None:
    follow_up = fixed_now + timedelta(days=2)
    lead = make_lead(next_follow_up_at=follow_up, status=LeadStatus.CONTACTED)

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "proposal_sent"})

    assert response.status_code == 200
    assert response.json()["updated_at"] == "2026-10-13T10:00:00Z"
    fetched = client.get(f"/api/v1/leads/{lead.id}").json()
    assert fetched["status"] == "proposal_sent"
    assert fetched["next_follow_up_at"] == "2026-10-15T10:00:00Z"


def test_patch_same_status_is_noop(client: TestClient, make_lead: Callable[..., Lead]) -> None:
    lead = make_lead(status=LeadStatus.WON)
    before = client.get(f"/api/v1/leads/{lead.id}").json()["updated_at"]

    response = client.patch(f"/api/v1/leads/{lead.id}", json={"status": "won"})

    assert response.status_code == 200
    assert response.json()["updated_at"] == before


@pytest.mark.parametrize(
    "payload", [{"status": "archived"}, {"name": None}, {"name": " "}, {"rating": 5}]
)
def test_patch_rejects_invalid_fields(
    client: TestClient, make_lead: Callable[..., Lead], payload: dict[str, object]
) -> None:
    lead = make_lead()

    response = client.patch(f"/api/v1/leads/{lead.id}", json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
