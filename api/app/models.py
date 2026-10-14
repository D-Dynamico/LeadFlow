import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class LeadStatus(enum.StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    WON = "won"
    LOST = "lost"


class DiscussionKind(enum.StrEnum):
    NOTE = "note"
    STATUS_CHANGE = "status_change"


def _pg_enum(cls: type[enum.Enum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class Lead(Base):
    """Lead row, see ARCHITECTURE.md Data model. Denormalized fields per D-6."""

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[LeadStatus] = mapped_column(
        _pg_enum(LeadStatus, "lead_status"),
        default=LeadStatus.NEW,
        server_default=LeadStatus.NEW.value,
        index=True,
    )
    next_follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    last_note_preview: Mapped[str | None] = mapped_column(String(200))
    last_discussion_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    discussions: Mapped[list["Discussion"]] = relationship(
        back_populates="lead", cascade="all, delete-orphan", passive_deletes=True
    )


class Discussion(Base):
    __tablename__ = "discussions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE")
    )
    kind: Mapped[DiscussionKind] = mapped_column(_pg_enum(DiscussionKind, "discussion_kind"))
    body: Mapped[str] = mapped_column(Text)
    follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lead: Mapped[Lead] = relationship(back_populates="discussions")


Index("ix_discussions_lead_id_created_at", Discussion.lead_id, Discussion.created_at.desc())


class AppMeta(Base):
    """Single row of deployment state; `seeded_at` drives the demo reseed, see D-16."""

    __tablename__ = "app_meta"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    seeded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
