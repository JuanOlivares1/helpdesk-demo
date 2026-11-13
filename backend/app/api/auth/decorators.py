"""Decoradores de autorización."""

from functools import wraps

from app.api.dependencies import current_user
from app.exceptions import PermissionDeniedError


def role_required(*roles: str):
    """Restringe el acceso a los roles indicados."""

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = current_user()

            if user.role not in roles:
                raise PermissionDeniedError("insufficient permissions")

            return f(*args, **kwargs)

        return wrapper

    return decorator
