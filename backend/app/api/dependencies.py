"""Dependencias compartidas de la API."""

from flask_jwt_extended import get_jwt_identity

from app.api.auth.service import get_user
from app.models import User


def current_user() -> User:
    """Obtiene el usuario autenticado a partir del JWT."""
    return get_user(get_jwt_identity())
