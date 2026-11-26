"""Business logic for the user directory."""

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.extensions import db
from app.models import User

ASSIGNEE_ROLES = ("admin", "agent")


def list_assignees() -> list[User]:
    """Return users who are allowed to own a ticket."""
    return (
        User.query.filter(User.role.in_(ASSIGNEE_ROLES))
        .order_by(User.email.asc())
        .all()
    )


def list_users() -> list[User]:
    """Return every user for administrative listing."""
    return User.query.order_by(User.email.asc()).all()


def create_user(email: str, password: str, role: str) -> User:
    """Create a user with an administrator-selected role."""
    if User.query.filter_by(email=email).first():
        raise ConflictError("email already registered")

    user = User(email=email, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return user


def update_user_role(user_id: int, role: str, actor: User) -> User:
    """Change a user's role without allowing an admin to demote themselves."""
    user = db.session.get(User, user_id)

    if not user:
        raise NotFoundError("user not found")

    if user.id == actor.id and role != "admin":
        raise BadRequestError("admins cannot demote themselves")

    user.role = role
    db.session.commit()

    return user

