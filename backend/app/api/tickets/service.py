"""Business logic for tickets and comments."""

from datetime import UTC, datetime

from app.constants import CLIENT_ALLOWED_STATUSES
from app.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.extensions import db
from app.models import Comment, Ticket, User


def _get_accessible_ticket(user: User, ticket_id: int) -> Ticket:
    """Find a ticket and verify that the user is allowed to access it."""
    ticket = db.session.get(Ticket, ticket_id)

    if not ticket:
        raise NotFoundError("ticket not found")

    if user.role == "client" and ticket.user_id != user.id:
        raise PermissionDeniedError("insufficient permissions")

    return ticket


def create_ticket(user: User, data: dict) -> Ticket:
    """Create a ticket owned by the authenticated user."""
    ticket = Ticket(
        title=data["title"],
        description=data["description"],
        priority=data["priority"],
        user_id=user.id,
    )

    db.session.add(ticket)
    db.session.commit()

    return ticket


def list_tickets(user: User, params: dict):
    """List visible tickets with filters and pagination."""
    query = Ticket.query

    if user.role == "client":
        query = query.filter_by(user_id=user.id)

    if params.get("status"):
        query = query.filter_by(status=params["status"])

    query = query.order_by(Ticket.created_at.desc())

    return query.paginate(
        page=params["page"],
        per_page=params["per_page"],
        error_out=False,
    )


def get_ticket(user: User, ticket_id: int) -> Ticket:
    """Return a ticket that the user is allowed to see."""
    return _get_accessible_ticket(user, ticket_id)


def update_ticket(user: User, ticket_id: int, data: dict) -> Ticket:
    """Update a ticket according to the permissions of the user's role."""
    ticket = _get_accessible_ticket(user, ticket_id)

    if user.role in ("admin", "agent"):
        if data.get("status"):
            ticket.status = data["status"]
        if data.get("priority"):
            ticket.priority = data["priority"]
        if data.get("assignee_id"):
            assignee = db.session.get(User, data["assignee_id"])
            if assignee and assignee.role in ("admin", "agent"):
                ticket.assignee_id = data["assignee_id"]
            else:
                raise BadRequestError("assignee must be admin or agent")
    else:
        if data.get("status") in CLIENT_ALLOWED_STATUSES:
            ticket.status = data["status"]
        else:
            raise BadRequestError(
                "clients can only change status to resolved or closed"
            )

    ticket.updated_at = datetime.now(UTC)
    db.session.commit()

    return ticket


def add_comment(user: User, ticket_id: int, body: str) -> Comment:
    """Add a comment to a ticket the user can access."""
    _get_accessible_ticket(user, ticket_id)

    comment = Comment(
        body=body,
        ticket_id=ticket_id,
        author_id=user.id,
    )

    db.session.add(comment)
    db.session.commit()

    return comment


def list_comments(user: User, ticket_id: int) -> list[Comment]:
    """List the comments of a ticket the user can access."""
    return (
        Comment.query.filter_by(ticket_id=ticket_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
