"""Lógica de negocio de tickets y comentarios."""

from datetime import datetime

from app.constants import CLIENT_ALLOWED_STATUSES
from app.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.extensions import db
from app.models import Comment, Ticket, User


def _get_accessible_ticket(user: User, ticket_id: int) -> Ticket:
    """Busca un ticket y valida que el usuario pueda acceder a él."""
    ticket = db.session.get(Ticket, ticket_id)

    if not ticket:
        raise NotFoundError("ticket not found")

    if user.role == "client" and ticket.user_id != user.id:
        raise PermissionDeniedError("insufficient permissions")

    return ticket


def create_ticket(user: User, data: dict) -> Ticket:
    """Crea un ticket para el usuario autenticado."""
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
    """Lista tickets visibles con filtros y paginación."""
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
    """Devuelve un ticket accesible para el usuario."""
    return _get_accessible_ticket(user, ticket_id)


def update_ticket(user: User, ticket_id: int, data: dict) -> Ticket:
    """Actualiza un ticket respetando los permisos por rol."""
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

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return ticket


def add_comment(user: User, ticket_id: int, body: str) -> Comment:
    """Añade un comentario a un ticket accesible."""
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
    """Lista los comentarios de un ticket accesible."""
    _get_accessible_ticket(user, ticket_id)

    return (
        Comment.query.filter_by(ticket_id=ticket_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
