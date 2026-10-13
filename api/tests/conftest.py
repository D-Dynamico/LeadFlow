"""Shared fixtures, see TEST_PLAN.md Fixtures and seed data."""

from collections.abc import Callable, Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, make_url, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.main import app
from app.models import Discussion, DiscussionKind, Lead
from app.timeutil import utcnow

API_DIR = Path(__file__).resolve().parents[1]
FIXED_NOW = datetime(2026, 10, 13, 10, 0, tzinfo=UTC)  # 15:30 IST


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    url = get_settings().test_database_url
    if not make_url(url).database.endswith("_test"):
        raise RuntimeError(f"Refusing to run tests against a non-test database: {url}")
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    config = Config(str(API_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(API_DIR / "alembic"))
    config.attributes["database_url"] = url
    command.upgrade(config, "head")
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    """A session inside a transaction that is rolled back after each test."""
    connection = engine.connect()
    outer = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        outer.rollback()
        connection.close()


@pytest.fixture
def fixed_now() -> datetime:
    return FIXED_NOW


@pytest.fixture
def client(db: Session, fixed_now: datetime) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[utcnow] = lambda: fixed_now
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def make_lead(db: Session, fixed_now: datetime) -> Callable[..., Lead]:
    def make(**overrides: Any) -> Lead:
        values: dict[str, Any] = {
            "name": "Test Lead",
            "created_at": fixed_now - timedelta(days=1),
            "updated_at": fixed_now - timedelta(days=1),
        }
        values.update(overrides)
        lead = Lead(**values)
        db.add(lead)
        db.flush()
        return lead

    return make


@pytest.fixture
def make_discussion(db: Session, fixed_now: datetime) -> Callable[..., Discussion]:
    def make(lead: Lead, **overrides: Any) -> Discussion:
        values: dict[str, Any] = {
            "lead_id": lead.id,
            "kind": DiscussionKind.NOTE,
            "body": "Called, left a message",
            "created_at": fixed_now - timedelta(hours=1),
        }
        values.update(overrides)
        discussion = Discussion(**values)
        db.add(discussion)
        db.flush()
        return discussion

    return make
