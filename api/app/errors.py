"""Error envelope and handlers, see API.md Error envelope and D-12."""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: str, message: str, status: int, details: Any = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details


def lead_not_found() -> AppError:
    return AppError("LEAD_NOT_FOUND", "Lead not found", 404)


def _envelope(status: int, code: str, message: str, details: Any = None) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "details": details}}
    return JSONResponse(status_code=status, content=body)


def _field(loc: tuple[int | str, ...]) -> str:
    # Drop the source ("body", "query", "path"); the rest is the field path.
    parts = [str(p) for p in loc[1:]] if loc and loc[0] in ("body", "query", "path") else [str(p) for p in loc]
    return ".".join(parts) or "body"


def _message(error: dict[str, Any]) -> str:
    # Custom validators raise ValueError; Pydantic prefixes those with "Value error, ".
    return str(error["msg"]).removeprefix("Value error, ")


async def _app_error(_: Request, exc: AppError) -> JSONResponse:
    return _envelope(exc.status, exc.code, exc.message, exc.details)


async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        {
            "field": "body" if e["type"] == "json_invalid" else _field(tuple(e["loc"])),
            "message": _message(e),
        }
        for e in exc.errors()
    ]
    return _envelope(422, "VALIDATION_ERROR", "Request validation failed", details)


async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    codes = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
    return _envelope(exc.status_code, codes.get(exc.status_code, "HTTP_ERROR"), str(exc.detail))


async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return _envelope(500, "INTERNAL_ERROR", "Something went wrong")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _validation_error)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, _http_error)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _unhandled)
