"""Request and response models, see API.md."""

import re
import uuid
from datetime import UTC, datetime
from typing import Annotated

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    PlainSerializer,
    ValidationInfo,
    field_validator,
)

from app.models import DiscussionKind, LeadStatus

PHONE_RE = re.compile(r"^[0-9+\-\s()]{6,32}$")


def _to_utc_z(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


UtcDatetime = Annotated[datetime, PlainSerializer(_to_utc_z, return_type=str)]
FollowUpState = Annotated[str, Field(pattern="^(overdue|today|upcoming|none)$")]


def _clean_name(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Name is required")
    if len(value) > 120:
        raise ValueError("Name must be at most 120 characters")
    return value


def _clean_company(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    value = value.strip()
    if len(value) > 120:
        raise ValueError("Company must be at most 120 characters")
    return value


def _clean_phone(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    value = value.strip()
    if not PHONE_RE.fullmatch(value):
        raise ValueError("Phone must be 6 to 32 digits, spaces, or + - ( )")
    return value


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    company: str | None = None
    phone: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return _clean_name(v)

    @field_validator("company")
    @classmethod
    def _company(cls, v: str | None) -> str | None:
        return _clean_company(v)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return _clean_phone(v)


class LeadUpdate(BaseModel):
    """PATCH body. Omitted fields stay unchanged; company and phone accept null to clear."""

    model_config = ConfigDict(extra="forbid")

    status: LeadStatus | None = None
    name: str | None = None
    company: str | None = None
    phone: str | None = None

    @field_validator("status", "name", mode="before")
    @classmethod
    def _not_null(cls, v: object, info: ValidationInfo) -> object:
        # Validators only run for fields that were sent, so None here is an explicit null.
        if v is None:
            raise ValueError(f"{info.field_name.capitalize()} cannot be null")
        return v

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return _clean_name(v)

    @field_validator("company")
    @classmethod
    def _company(cls, v: str | None) -> str | None:
        return _clean_company(v)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return _clean_phone(v)


class LeadOut(BaseModel):
    id: uuid.UUID
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    next_follow_up_at: UtcDatetime | None
    follow_up_state: FollowUpState
    last_note_preview: str | None
    last_discussion_at: UtcDatetime | None
    created_at: UtcDatetime
    updated_at: UtcDatetime


class LeadCounts(BaseModel):
    all: int
    new: int
    contacted: int
    qualified: int
    proposal_sent: int
    won: int
    lost: int


class LeadListOut(BaseModel):
    pinned: list[LeadOut]
    others: list[LeadOut]
    counts: LeadCounts


class DiscussionCreate(BaseModel):
    """Add a note. `follow_up_at` needs an offset; "after now" is checked in the service (R-4)."""

    model_config = ConfigDict(extra="forbid")

    body: str
    follow_up_at: AwareDatetime | None = None

    @field_validator("body")
    @classmethod
    def _body(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Note is required")
        if len(v) > 5000:
            raise ValueError("Note must be at most 5000 characters")
        return v


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lead_id: uuid.UUID
    kind: DiscussionKind
    body: str
    follow_up_at: UtcDatetime | None
    created_at: UtcDatetime


class AddDiscussionOut(BaseModel):
    discussion: DiscussionOut
    lead: LeadOut
