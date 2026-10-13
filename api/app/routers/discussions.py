from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import AddDiscussionOut, DiscussionCreate, DiscussionOut
from app.services import discussions as service
from app.services.leads import to_out
from app.timeutil import resolve_tz, utcnow

router = APIRouter(prefix="/leads/{lead_id}/discussions", tags=["discussions"])


@router.get("", response_model=list[DiscussionOut])
def list_discussions(lead_id: str, db: Session = Depends(get_db)) -> list[DiscussionOut]:
    return [DiscussionOut.model_validate(d) for d in service.list_discussions(db, lead_id)]


@router.post("", response_model=AddDiscussionOut, status_code=status.HTTP_201_CREATED)
def add_discussion(
    lead_id: str,
    data: DiscussionCreate,
    db: Session = Depends(get_db),
    now: datetime = Depends(utcnow),
) -> AddDiscussionOut:
    discussion, lead = service.add_note(db, lead_id, data, now)
    return AddDiscussionOut(
        discussion=DiscussionOut.model_validate(discussion),
        lead=to_out(lead, now, resolve_tz("UTC")),
    )
