"""Configuración de la aplicación por entorno."""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    """Lee una variable de entorno booleana."""
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class BaseConfig:
    """Configuración común a todos los entornos."""

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
    """Configuración para desarrollo local."""

    DEBUG = True
    CREATE_TABLES = True
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG").upper()


class TestingConfig(BaseConfig):
    """Configuración aislada para la suite de tests."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret"
    CREATE_TABLES = True
    LOG_LEVEL = "WARNING"


class ProductionConfig(BaseConfig):
    """Configuración para producción."""

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
    """Devuelve la clase de configuración correspondiente al entorno.

    Args:
        env: Nombre del entorno. Si no se indica, se usa ``FLASK_ENV`` o
            ``APP_ENV`` y, como último recurso, ``development``.
    """
    name = (
        env
        or os.environ.get("FLASK_ENV")
        or os.environ.get("APP_ENV")
        or "development"
    ).lower()
    return CONFIGS.get(name, DevelopmentConfig)
