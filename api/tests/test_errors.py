"""Error envelope, see API.md Error envelope and D-12."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.errors import AppError, register_error_handlers
from app.main import app


class Payload(BaseModel):
    name: str


def make_client() -> TestClient:
    sample = FastAPI()
    register_error_handlers(sample)

    @sample.post("/items")
    def create(payload: Payload) -> Payload:
        return payload

    @sample.get("/missing")
    def missing() -> None:
        raise AppError("LEAD_NOT_FOUND", "Lead not found", 404)

    @sample.get("/boom")
    def boom() -> None:
        raise RuntimeError("secret connection string")

    return TestClient(sample, raise_server_exceptions=False)


def test_app_error_uses_envelope() -> None:
    response = make_client().get("/missing")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "LEAD_NOT_FOUND", "message": "Lead not found", "details": None}
    }


def test_validation_error_lists_fields() -> None:
    response = make_client().post("/items", json={})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["details"] == [{"field": "name", "message": "Field required"}]


def test_malformed_json_points_at_body() -> None:
    response = make_client().post(
        "/items", content="{bad json", headers={"content-type": "application/json"}
    )

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "body"


def test_unknown_route_uses_envelope() -> None:
    response = TestClient(app).get("/api/v1/nope")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_unexpected_error_is_500_without_internals() -> None:
    response = make_client().get("/boom")

    assert response.status_code == 500
    assert response.json() == {
        "error": {"code": "INTERNAL_ERROR", "message": "Something went wrong", "details": None}
    }
