"""Lead business logic: follow-up state (R-2), list and pinning (R-3), create, update (R-5)."""

import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import AppError, lead_not_found
from app.models import Lead, LeadStatus
from app.schemas import LeadCounts, LeadCreate, LeadListOut, LeadOut, LeadUpdate
from app.timeutil import local_day_bounds


def follow_up_state(follow_up_at: datetime | None, now: datetime, day_end: datetime) -> str:
    """Follow-up state for one lead, see R-2. `day_end` is d1 of today in the viewer's tz."""
    if follow_up_at is None:
        return "none"
    if follow_up_at < now:
        return "overdue"
    if follow_up_at < day_end:
        return "today"
    return "upcoming"


def to_out(lead: Lead, now: datetime, tz: ZoneInfo) -> LeadOut:
    _, day_end = local_day_bounds(now, tz)
    return _to_out(lead, follow_up_state(lead.next_follow_up_at, now, day_end))


def _to_out(lead: Lead, state: str) -> LeadOut:
    return LeadOut.model_validate(
        {
            "id": lead.id,
            "name": lead.name,
            "company": lead.company,
            "phone": lead.phone,
            "status": lead.status,
            "next_follow_up_at": lead.next_follow_up_at,
            "follow_up_state": state,
            "last_note_preview": lead.last_note_preview,
            "last_discussion_at": lead.last_discussion_at,
            "created_at": lead.created_at,
            "updated_at": lead.updated_at,
        }
    )


def get_lead(db: Session, lead_id: str) -> Lead:
    """Load a lead or raise 404. A malformed id is also 404, not 422 (API.md Conventions)."""
    try:
        key = uuid.UUID(lead_id)
    except ValueError:
        raise lead_not_found() from None
    lead = db.get(Lead, key)
    if lead is None:
        raise lead_not_found()
    return lead


def parse_status_filter(value: str | None) -> LeadStatus | None:
    if value is None or not value.strip():
        return None
    try:
        return LeadStatus(value.strip())
    except ValueError:
        raise AppError("INVALID_STATUS", f"Unknown status: {value}", 422) from None


def _name_filter(q: str | None):  # noqa: ANN202
    if q is None or not q.strip():
        return None
    escaped = q.strip().replace("\\", r"\\").replace("%", r"\%").replace("_", r"\_")
    return Lead.name.ilike(f"%{escaped}%", escape="\\")


PINNED_STATES = ("overdue", "today")
CLOSED_STATUSES = (LeadStatus.WON, LeadStatus.LOST)


def list_leads(
    db: Session, now: datetime, tz: ZoneInfo, status: LeadStatus | None, q: str | None
) -> LeadListOut:
    """Filtered list split into pinned and others, with counts (R-3, D-4).

    Counts ignore the status filter but respect search.
    """
    name_filter = _name_filter(q)

    count_stmt = select(Lead.status, func.count()).group_by(Lead.status)
    if name_filter is not None:
        count_stmt = count_stmt.where(name_filter)
    per_status = {s.value: 0 for s in LeadStatus}
    for row_status, n in db.execute(count_stmt):
        per_status[row_status.value] = n
    counts = LeadCounts(all=sum(per_status.values()), **per_status)

    stmt = select(Lead)
    if name_filter is not None:
        stmt = stmt.where(name_filter)
    if status is not None:
        stmt = stmt.where(Lead.status == status)
    activity = func.coalesce(Lead.last_discussion_at, Lead.created_at)
    stmt = stmt.order_by(activity.desc(), Lead.id)

    _, day_end = local_day_bounds(now, tz)
    rows = [
        (lead, follow_up_state(lead.next_follow_up_at, now, day_end))
        for lead in db.scalars(stmt)
    ]
    pinned, others = order_for_list(rows)
    return LeadListOut(
        pinned=[_to_out(lead, state) for lead, state in pinned],
        others=[_to_out(lead, state) for lead, state in others],
        counts=counts,
    )


def order_for_list(
    rows: list[tuple[Lead, str]],
) -> tuple[list[tuple[Lead, str]], list[tuple[Lead, str]]]:
    """Split and order leads for the list, see R-3.

    `rows` arrive sorted by latest activity, newest first. Pinned holds overdue (D-5) and
    today: all overdue first, then today, each by follow-up time ascending. Others keep the
    activity order, with won and lost leads that have no follow-up moved to the end.
    """
    pinned = sorted(
        (row for row in rows if row[1] in PINNED_STATES),
        key=lambda row: (row[1] != "overdue", row[0].next_follow_up_at),
    )
    rest = [row for row in rows if row[1] not in PINNED_STATES]

    def sinks(row: tuple[Lead, str]) -> bool:
        lead = row[0]
        return lead.status in CLOSED_STATUSES and lead.next_follow_up_at is None

    others = [row for row in rest if not sinks(row)] + [row for row in rest if sinks(row)]
    return pinned, others


def create_lead(db: Session, data: LeadCreate, now: datetime) -> Lead:
    """New leads start as `new` (R-5)."""
    lead = Lead(
        name=data.name,
        company=data.company,
        phone=data.phone,
        status=LeadStatus.NEW,
        created_at=now,
        updated_at=now,
    )
    db.add(lead)
    db.commit()
    return lead


def update_lead(db: Session, lead_id: str, data: LeadUpdate, now: datetime) -> Lead:
    """Apply the sent fields. Any status transition is allowed (R-5, D-10).

    Setting the same value again is a no-op and does not bump `updated_at`.
    Never touches `next_follow_up_at` (R-4).
    """
    lead = get_lead(db, lead_id)
    changed = False
    for field, value in data.model_dump(exclude_unset=True).items():
        if getattr(lead, field) != value:
            setattr(lead, field, value)
            changed = True
    if changed:
        lead.updated_at = now
        db.commit()
    return lead
