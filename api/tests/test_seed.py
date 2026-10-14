"""Seed data covers every follow-up state, see TEST_PLAN.md Fixtures and seed data."""

from collections import Counter
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AppMeta, Discussion, DiscussionKind, Lead
from scripts.seed import reseed_if_stale, seed

KOLKATA = ZoneInfo("Asia/Kolkata")
SIX_HOURS = timedelta(hours=6)


def test_seed_shows_every_follow_up_state(
    client: TestClient, db: Session, fixed_now: datetime
) -> None:
    assert seed(db, fixed_now, KOLKATA, reset=True) == 8

    body = client.get("/api/v1/leads?tz=Asia/Kolkata").json()

    states = Counter(lead["follow_up_state"] for lead in body["pinned"] + body["others"])
    assert states == {"overdue": 2, "today": 2, "upcoming": 1, "none": 3}
    assert [lead["name"] for lead in body["pinned"]] == [
        "Ravi Sharma",
        "Priya Raman",
        "Arjun Mehta",
        "Sarah Collins",
    ]
    # Latest activity first, closed leads without a follow-up last (R-3).
    assert [lead["name"] for lead in body["others"]] == [
        "Ananya Gupta",
        "Vikram Iyer",
        "Meera Nair",
        "Daniel Okafor",
    ]
    assert body["counts"]["all"] == 8


def test_seed_lead_fields_match_their_latest_note(db: Session, fixed_now: datetime) -> None:
    seed(db, fixed_now, KOLKATA, reset=True)

    for lead in db.scalars(select(Lead)):
        notes = sorted(
            (d for d in lead.discussions if d.kind == DiscussionKind.NOTE),
            key=lambda d: d.created_at,
        )
        if not notes:
            assert lead.last_note_preview is None and lead.next_follow_up_at is None
            continue
        assert lead.last_note_preview == notes[-1].body[:200]
        assert lead.last_discussion_at == notes[-1].created_at
        assert lead.next_follow_up_at == notes[-1].follow_up_at  # R-4


def test_seed_skips_existing_data_unless_reset(db: Session, fixed_now: datetime) -> None:
    seed(db, fixed_now, KOLKATA, reset=True)

    assert seed(db, fixed_now, KOLKATA, reset=False) == 0
    assert seed(db, fixed_now, KOLKATA, reset=True) == 8
    assert db.scalar(select(func.count()).select_from(Lead)) == 8
    assert db.scalar(select(func.count()).select_from(Discussion)) == 31


def test_reseed_skips_a_fresh_seed(db: Session, fixed_now: datetime) -> None:
    """D-16: a seed younger than RESEED_AFTER_HOURS keeps the reviewer's edits."""
    seed(db, fixed_now, KOLKATA, reset=True)
    db.add(Lead(name="Reviewer's lead"))
    db.commit()

    assert reseed_if_stale(db, fixed_now + timedelta(hours=5), KOLKATA, SIX_HOURS) == 0
    assert db.scalar(select(func.count()).select_from(Lead)) == 9
    assert db.get(AppMeta, 1).seeded_at == fixed_now


def test_reseed_resets_a_stale_seed(db: Session, fixed_now: datetime) -> None:
    """D-16: an old seed is replaced and follow-ups are placed relative to the new now."""
    seed(db, fixed_now, KOLKATA, reset=True)
    db.add(Lead(name="Reviewer's lead"))
    db.commit()
    later = fixed_now + timedelta(hours=7)

    assert reseed_if_stale(db, later, KOLKATA, SIX_HOURS) == 8
    assert db.scalar(select(func.count()).select_from(Lead)) == 8
    assert db.get(AppMeta, 1).seeded_at == later


def test_reseed_seeds_when_never_seeded(db: Session, fixed_now: datetime) -> None:
    assert reseed_if_stale(db, fixed_now, KOLKATA, SIX_HOURS) == 8
