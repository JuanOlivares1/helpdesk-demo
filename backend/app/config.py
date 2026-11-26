"""Configuration for each application environment."""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    """Read a boolean environment variable."""
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class BaseConfig:
    """Settings shared by every environment."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///helpdesk.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-string")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=3600)

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
    LOG_JSON = _env_bool("LOG_JSON", False)
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

    TESTING = False
    DEBUG = False
    CREATE_TABLES = False


class DevelopmentConfig(BaseConfig):
    """Settings for local development."""

    DEBUG = True
    CREATE_TABLES = True
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG").upper()


class TestingConfig(BaseConfig):
    """Isolated settings for the test suite."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret-32chars-long-key"
    CREATE_TABLES = True
    LOG_LEVEL = "WARNING"


class ProductionConfig(BaseConfig):
    """Settings for production."""

    CREATE_TABLES = False
    LOG_JSON = _env_bool("LOG_JSON", True)
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()


CONFIGS: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "dev": DevelopmentConfig,
    "testing": TestingConfig,
    "test": TestingConfig,
    "production": ProductionConfig,
    "prod": ProductionConfig,
}


def get_config(env: str | None = None) -> type[BaseConfig]:
    """Return the configuration class for the given environment.

    Args:
        env: Environment name. Falls back to ``FLASK_ENV`` or ``APP_ENV``
            and finally to ``development``.
    """
    name = (
        env
        or os.environ.get("FLASK_ENV")
        or os.environ.get("APP_ENV")
        or "development"
    ).lower()
    return CONFIGS.get(name, DevelopmentConfig)
