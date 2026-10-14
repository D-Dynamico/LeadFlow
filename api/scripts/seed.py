"""Demo data relative to now, see TEST_PLAN.md Fixtures and seed data.

Usage: python -m scripts.seed [--reset | --if-stale] [--tz Asia/Kolkata]

Without --reset it does nothing when leads already exist, so it is safe on every
container start. --if-stale resets only when the last seed is older than
RESEED_AFTER_HOURS (D-16), so a deployed demo keeps correct follow-up states. "Later today" and "earlier today" are placed inside the local day
of --tz, so every follow-up state (R-2) shows up for a viewer in that zone.
"""

import argparse
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionLocal
from app.models import AppMeta, Discussion, DiscussionKind, Lead, LeadStatus
from app.services.discussions import PREVIEW_LENGTH
from app.services.leads import status_change_body
from app.timeutil import local_day_bounds, resolve_tz, utcnow

DEFAULT_TZ = "Asia/Kolkata"


@dataclass
class Note:
    at: datetime
    body: str
    follow_up_at: datetime | None = None


@dataclass
class StatusChange:
    at: datetime
    old: LeadStatus
    new: LeadStatus


@dataclass
class SeedLead:
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    created_at: datetime
    next_follow_up_at: datetime | None = None
    history: list[Note | StatusChange] = field(default_factory=list)


def build_leads(now: datetime, tz: ZoneInfo) -> list[SeedLead]:
    """The eight leads from the seed table, one per row, all times relative to `now`."""
    d0, d1 = local_day_bounds(now, tz)

    def ago(days: float = 0, hours: float = 0) -> datetime:
        return now - timedelta(days=days, hours=hours)

    def ahead(days: float = 0, hours: float = 0) -> datetime:
        return now + timedelta(days=days, hours=hours)

    earlier_today = now - max((now - d0) / 2, timedelta(minutes=1))
    later_today_a = now + (d1 - now) / 3
    later_today_b = now + (d1 - now) * 2 / 3
    S = LeadStatus

    return [
        SeedLead(
            "Ravi Sharma", "Acme Logistics", "+91 98765 43210", S.CONTACTED, ago(12),
            next_follow_up_at=ago(2),
            history=[
                Note(ago(11), "Inbound enquiry from the website form. Runs a 40-truck fleet "
                     "in Pune and wants route tracking.", ago(9)),
                Note(ago(9), "Called, spoke to Ravi for 10 minutes. Interested, but the ops "
                     "head decides. Asked for a short deck.", ago(5)),
                Note(ago(5), "Sent the deck. He will loop in Kavita (ops head) and reply "
                     "by the weekend.", ago(2)),
            ],
        ),
        SeedLead(
            "Priya Raman", "Northwind Foods", "+91 99001 23456", S.PROPOSAL_SENT, ago(20),
            next_follow_up_at=earlier_today,
            history=[
                Note(ago(19), "Met at the Bengaluru retail expo. Three warehouses, "
                     "currently on spreadsheets.", ago(17)),
                StatusChange(ago(17), S.NEW, S.CONTACTED),
                Note(ago(17), "Discovery call. Pain points: stock mismatch between "
                     "warehouses and slow month-end reconciliation.", ago(12)),
                StatusChange(ago(12), S.CONTACTED, S.QUALIFIED),
                Note(ago(12), "Demo with Priya and her finance lead. Budget confirmed "
                     "for this quarter.", ago(6)),
                StatusChange(ago(6), S.QUALIFIED, S.PROPOSAL_SENT),
                Note(ago(6), "Proposal sent: annual plan, 3 sites, onboarding included. "
                     "She will review with the CFO and call back.", earlier_today),
            ],
        ),
        SeedLead(
            "Arjun Mehta", "Brightline Fintech", "+91 98200 11223", S.QUALIFIED, ago(30),
            next_follow_up_at=later_today_a,
            history=[
                Note(ago(29), "Referral from Sameer at Lagoon Retail. Series A fintech, "
                     "growing sales team of 12."),
                Note(ago(26), "Intro call. They track leads in Notion and lose follow-ups "
                     "every week. Wants a demo.", ago(22)),
                Note(ago(22), "Demo went well. Asked about CSV import and API access.", ago(18)),
                Note(ago(18), "Shared API docs. Their engineer has questions on rate limits.",
                     ago(14)),
                Note(ago(14), "Call with their engineer, Neha. Rate limits are fine for "
                     "their volume. Security questionnaire next.", ago(8)),
                Note(ago(8), "Security questionnaire returned. Pending sign-off from "
                     "their compliance team.", ago(3)),
                Note(ago(3), "Compliance approved. Arjun wants to discuss pricing for "
                     "15 seats; call booked for today.", later_today_a),
            ],
        ),
        SeedLead(
            "Sarah Collins", "Harbor & Co", "+44 20 7946 0958", S.NEW, ago(1),
            next_follow_up_at=later_today_b,
            history=[
                Note(ago(hours=20), "Signed up for the newsletter and asked for a call. "
                     "UK-based consultancy, 8 people.", later_today_b),
            ],
        ),
        SeedLead(
            "Vikram Iyer", "Sahyadri Agro", "+91 94220 33445", S.CONTACTED, ago(6),
            next_follow_up_at=ahead(3),
            history=[
                Note(ago(5), "Cold call. Agri-exports, seasonal sales team. Not a fit "
                     "until the harvest season ends.", ago(1)),
                Note(ago(1), "Followed up. Asked to call back after the board meeting "
                     "later this week.", ahead(3)),
            ],
        ),
        SeedLead("Ananya Gupta", "Pixelcraft Studio", None, S.NEW, ago(hours=5)),
        SeedLead(
            "Daniel Okafor", "Lagoon Retail", "+234 803 555 0142", S.WON, ago(45),
            history=[
                Note(ago(44), "Inbound from a LinkedIn post. 20 stores across Lagos "
                     "and Abuja.", ago(40)),
                StatusChange(ago(40), S.NEW, S.CONTACTED),
                Note(ago(40), "Discovery call with Daniel and the regional managers.",
                     ago(33)),
                StatusChange(ago(33), S.CONTACTED, S.QUALIFIED),
                Note(ago(33), "Pilot agreed for two stores, 30 days.", ago(25)),
                StatusChange(ago(25), S.QUALIFIED, S.PROPOSAL_SENT),
                Note(ago(25), "Pilot results strong: follow-ups up 40%. Sent the "
                     "full rollout proposal.", ago(18)),
                StatusChange(ago(18), S.PROPOSAL_SENT, S.WON),
                Note(ago(18), "Signed! Rollout to all 20 stores next month. Handed "
                     "over to onboarding."),
            ],
        ),
        SeedLead(
            "Meera Nair", "Coastal Pharma", "+91 98470 66778", S.LOST, ago(25),
            history=[
                Note(ago(24), "Enquiry about compliance tracking for field reps.", ago(15)),
                Note(ago(15), "They chose an in-house tool built by their IT team. "
                     "Closing for now; revisit next year."),
            ],
        ),
    ]


def insert_lead(db: Session, seed: SeedLead) -> Lead:
    """Insert a lead and its history, with denormalized fields matching the latest note."""
    notes = [h for h in seed.history if isinstance(h, Note)]
    latest = max(notes, key=lambda n: n.at) if notes else None
    lead = Lead(
        name=seed.name,
        company=seed.company,
        phone=seed.phone,
        status=seed.status,
        next_follow_up_at=seed.next_follow_up_at,
        last_note_preview=latest.body[:PREVIEW_LENGTH] if latest else None,
        last_discussion_at=latest.at if latest else None,
        created_at=seed.created_at,
        updated_at=max([seed.created_at, *(h.at for h in seed.history)]),
    )
    db.add(lead)
    db.flush()
    for item in seed.history:
        if isinstance(item, Note):
            db.add(
                Discussion(
                    lead_id=lead.id,
                    kind=DiscussionKind.NOTE,
                    body=item.body,
                    follow_up_at=item.follow_up_at,
                    created_at=item.at,
                )
            )
        else:
            db.add(
                Discussion(
                    lead_id=lead.id,
                    kind=DiscussionKind.STATUS_CHANGE,
                    body=status_change_body(item.old, item.new),
                    # The change happened just before the note logged with it.
                    created_at=item.at - timedelta(minutes=1),
                )
            )
    return lead


def seed(db: Session, now: datetime, tz: ZoneInfo, reset: bool) -> int:
    """Insert the demo leads and return how many were added (0 if skipped)."""
    if reset:
        db.execute(delete(Lead))
    elif db.scalar(select(func.count()).select_from(Lead)):
        return 0
    leads = [insert_lead(db, s) for s in build_leads(now.replace(microsecond=0), tz)]
    db.merge(AppMeta(id=1, seeded_at=now))
    db.commit()
    return len(leads)


def is_stale(seeded_at: datetime | None, now: datetime, max_age: timedelta) -> bool:
    """A missing or old seed needs a reset, see D-16."""
    return seeded_at is None or now - seeded_at > max_age


def reseed_if_stale(db: Session, now: datetime, tz: ZoneInfo, max_age: timedelta) -> int:
    """Reset the demo data only when the last seed is older than `max_age` (D-16)."""
    meta = db.get(AppMeta, 1)
    if not is_stale(meta.seeded_at if meta else None, now, max_age):
        return 0
    return seed(db, now, tz, reset=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LeadFlow with demo leads.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--reset", action="store_true", help="delete all leads first")
    mode.add_argument(
        "--if-stale", action="store_true", help="reset only if the last seed is RESEED_AFTER_HOURS old"
    )
    parser.add_argument("--tz", default=DEFAULT_TZ, help=f"viewer timezone (default {DEFAULT_TZ})")
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.if_stale:
            max_age = timedelta(hours=get_settings().reseed_after_hours)
            added = reseed_if_stale(db, utcnow(), resolve_tz(args.tz), max_age)
            skipped = "Seed is fresh; skipped."
        else:
            added = seed(db, utcnow(), resolve_tz(args.tz), args.reset)
            skipped = "Leads already exist; skipped (use --reset)."
    print(f"Seeded {added} leads." if added else skipped)


if __name__ == "__main__":
    main()
