"""Business logic for the user directory."""

from app.models import User

ASSIGNEE_ROLES = ("admin", "agent")


def list_assignees() -> list[User]:
    """Return users who are allowed to own a ticket."""
    return (
        User.query.filter(User.role.in_(ASSIGNEE_ROLES))
        .order_by(User.email.asc())
        .all()
    )
