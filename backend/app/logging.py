"""Configuración de logging y trazabilidad por petición."""

import json
import logging
import sys
import time
from contextvars import ContextVar
from datetime import datetime, timezone
from uuid import uuid4

from flask import Flask, Response, g, request

_request_id: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    """Devuelve el identificador de la petición actual."""
    return _request_id.get()


class RequestIdFilter(logging.Filter):
    """Inyecta el request_id actual en cada registro de log."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True


class JsonFormatter(logging.Formatter):
    """Formatea los registros como JSON para producción."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def _build_handler(app: Flask) -> logging.Handler:
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdFilter())
    if app.config.get("LOG_JSON"):
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"
            )
        )
    return handler


def configure_logging(app: Flask) -> None:
    """Configura el logger de la aplicación según el entorno."""
    logger = app.logger
    logger.handlers.clear()
    logger.addHandler(_build_handler(app))
    logger.setLevel(app.config.get("LOG_LEVEL", "INFO"))
    logger.propagate = False


def register_request_logging(app: Flask) -> None:
    """Registra hooks para generar request_id y loggear cada petición."""

    @app.before_request
    def _start_request() -> None:
        request_id = (request.headers.get("X-Request-ID") or uuid4().hex)[:128]
        token = _request_id.set(request_id)
        g.request_id = request_id
        g.request_id_token = token
        g.request_started_at = time.perf_counter()

    @app.after_request
    def _log_request(response: Response) -> Response:
        started_at = getattr(g, "request_started_at", None)
        duration_ms = (time.perf_counter() - started_at) * 1000 if started_at else 0
        app.logger.info(
            "%s %s -> %s (%.2f ms)",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = get_request_id()
        return response

    @app.teardown_request
    def _clear_request_id(exception: BaseException | None = None) -> None:
        token = g.pop("request_id_token", None)
        if token is not None:
            _request_id.reset(token)
