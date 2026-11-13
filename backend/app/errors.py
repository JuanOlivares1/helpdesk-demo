"""Manejadores de errores de la API."""

from flask import Flask, Response, jsonify
from marshmallow import ValidationError


def register_error_handlers(app: Flask) -> None:
    """Registra los handlers de error de la aplicación."""

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError) -> tuple[Response, int]:
        return jsonify({"errors": error.messages}), 422
