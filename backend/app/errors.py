"""Manejadores de errores de la API."""

from flask import Flask, Response, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from app.extensions import jwt


def _register_jwt_error_handlers() -> None:
    """Registra respuestas JSON consistentes para errores de JWT."""

    @jwt.unauthorized_loader
    def handle_missing_token(reason: str) -> tuple[Response, int]:
        return jsonify({"error": "authorization required"}), 401

    @jwt.invalid_token_loader
    def handle_invalid_token(reason: str) -> tuple[Response, int]:
        return jsonify({"error": "invalid token"}), 401

    @jwt.expired_token_loader
    def handle_expired_token(
        jwt_header: dict,
        jwt_payload: dict,
    ) -> tuple[Response, int]:
        return jsonify({"error": "token has expired"}), 401

    @jwt.revoked_token_loader
    def handle_revoked_token(
        jwt_header: dict,
        jwt_payload: dict,
    ) -> tuple[Response, int]:
        return jsonify({"error": "token has been revoked"}), 401

    @jwt.needs_fresh_token_loader
    def handle_fresh_token_required(
        jwt_header: dict,
        jwt_payload: dict,
    ) -> tuple[Response, int]:
        return jsonify({"error": "fresh token required"}), 401


def register_error_handlers(app: Flask) -> None:
    """Registra los handlers de error de la aplicación."""

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError) -> tuple[Response, int]:
        return jsonify({"errors": error.messages}), 422

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException) -> tuple[Response, int]:
        messages = {
            404: "resource not found",
            405: "method not allowed",
        }
        message = messages.get(error.code or 500, error.description or "request failed")
        return jsonify({"error": message}), error.code or 500

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error: SQLAlchemyError) -> tuple[Response, int]:
        app.logger.exception("database error", exc_info=error)
        return jsonify({"error": "internal server error"}), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception) -> tuple[Response, int]:
        if isinstance(error, HTTPException):
            return handle_http_error(error)
        app.logger.exception("unhandled error", exc_info=error)
        return jsonify({"error": "internal server error"}), 500

    _register_jwt_error_handlers()
