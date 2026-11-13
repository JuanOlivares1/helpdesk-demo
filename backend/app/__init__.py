"""Fábrica de la aplicación Flask."""

from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.errors import register_error_handlers
from app.extensions import db, jwt, migrate
from app.logging import configure_logging, register_request_logging


def _parse_cors_origins(value: str | list[str]) -> str | list[str]:
    """Normaliza los orígenes CORS configurados."""
    if isinstance(value, str):
        if value.strip() == "*":
            return "*"
        return [origin.strip() for origin in value.split(",") if origin.strip()]
    return value


def create_app(test_config: dict | None = None) -> Flask:
    """Crea y configura la aplicación Flask.

    Args:
        test_config: Configuración adicional para tests. Se aplica después de
            la configuración del entorno y tiene prioridad sobre ella.
    """
    app = Flask(__name__)

    config_name = "testing" if test_config and test_config.get("TESTING") else None
    app.config.from_object(get_config(config_name))
    if test_config:
        app.config.update(test_config)

    configure_logging(app)
    register_error_handlers(app)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=_parse_cors_origins(app.config["CORS_ORIGINS"]))

    from app.routes.auth import auth_bp
    from app.routes.tickets import tickets_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tickets_bp, url_prefix="/api/tickets")

    register_request_logging(app)

    @app.route("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    if app.config.get("CREATE_TABLES"):
        with app.app_context():
            db.create_all()

    return app
