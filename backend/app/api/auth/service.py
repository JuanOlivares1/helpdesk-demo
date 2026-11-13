"""Lógica de negocio de autenticación."""

from app.exceptions import ConflictError, NotFoundError
from app.extensions import db
from app.models import User


def register_user(email: str, password: str) -> User:
    """Crea un usuario con rol client."""
    if User.query.filter_by(email=email).first():
        raise ConflictError("email already registered")

    user = User(email=email, role="client")
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return user


def authenticate_user(email: str, password: str) -> User | None:
    """Devuelve el usuario si las credenciales son válidas."""
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return None

    return user


def get_user(user_id: str | int) -> User:
    """Busca un usuario por id o lanza NotFoundError."""
    user = db.session.get(User, int(user_id))

    if not user:
        raise NotFoundError("user not found")

    return user
