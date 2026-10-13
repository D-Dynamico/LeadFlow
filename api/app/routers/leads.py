from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import LeadCreate, LeadListOut, LeadOut, LeadUpdate
from app.services import leads as service
from app.timeutil import resolve_tz, utcnow

router = APIRouter(prefix="/leads", tags=["leads"])

UTC_ZONE = "UTC"


@router.get("", response_model=LeadListOut)
def list_leads(
    status: str | None = None,
    q: str | None = None,
    tz: str | None = None,
    db: Session = Depends(get_db),
    now: datetime = Depends(utcnow),
) -> LeadListOut:
    zone = resolve_tz(tz)
    return service.list_leads(db, now, zone, service.parse_status_filter(status), q)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(
    data: LeadCreate,
    response: Response,
    db: Session = Depends(get_db),
    now: datetime = Depends(utcnow),
) -> LeadOut:
    lead = service.create_lead(db, data, now)
    response.headers["Location"] = f"/api/v1/leads/{lead.id}"
    return service.to_out(lead, now, resolve_tz(UTC_ZONE))


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: str,
    tz: str | None = None,
    db: Session = Depends(get_db),
    now: datetime = Depends(utcnow),
) -> LeadOut:
    zone = resolve_tz(tz if tz is not None else UTC_ZONE)
    return service.to_out(service.get_lead(db, lead_id), now, zone)


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: str,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    now: datetime = Depends(utcnow),
) -> LeadOut:
    lead = service.update_lead(db, lead_id, data, now)
    return service.to_out(lead, now, resolve_tz(UTC_ZONE))
