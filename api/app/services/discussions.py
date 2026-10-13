"""Discussions: add a note and update the lead in one transaction (Write rules, R-4)."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import AppError
from app.models import Discussion, DiscussionKind, Lead
from app.schemas import DiscussionCreate
from app.services.leads import get_lead

PREVIEW_LENGTH = 200


def list_discussions(db: Session, lead_id: str) -> list[Discussion]:
    """Timeline for one lead, newest first."""
    lead = get_lead(db, lead_id)
    stmt = (
        select(Discussion)
        .where(Discussion.lead_id == lead.id)
        .order_by(Discussion.created_at.desc(), Discussion.id)
    )
    return list(db.scalars(stmt))


def add_note(
    db: Session, lead_id: str, data: DiscussionCreate, now: datetime
) -> tuple[Discussion, Lead]:
    """Insert a note and update the lead's denormalized fields, all or nothing.

    The note's `follow_up_at` replaces the lead's follow-up, and a note without one clears
    it, because logging a discussion means the follow-up happened (R-4, D-7). A follow-up
    that is not strictly after `now` is rejected before anything is written (D-8).
    """
    lead = get_lead(db, lead_id)
    if data.follow_up_at is not None and data.follow_up_at <= now:
        raise AppError("FOLLOW_UP_IN_PAST", "Follow-up must be in the future", 422)

    discussion = Discussion(
        lead_id=lead.id,
        kind=DiscussionKind.NOTE,
        body=data.body,
        follow_up_at=data.follow_up_at,
        created_at=now,
    )
    db.add(discussion)
    lead.last_note_preview = data.body[:PREVIEW_LENGTH]
    lead.last_discussion_at = now
    lead.next_follow_up_at = data.follow_up_at
    lead.updated_at = now
    db.commit()
    return discussion, lead
