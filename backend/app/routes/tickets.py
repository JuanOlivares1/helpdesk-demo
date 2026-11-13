"""Rutas de tickets y comentarios."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.constants import CLIENT_ALLOWED_STATUSES
from app.extensions import db
from app.models import Comment, Ticket, User
from app.routes.auth import role_required
from app.schemas.tickets import (
    CommentCreateSchema,
    TicketCreateSchema,
    TicketListQuerySchema,
    TicketUpdateSchema,
)

tickets_bp = Blueprint("tickets", __name__)


def get_current_user() -> User:
    """Obtiene el usuario autenticado desde el token."""
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


@tickets_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin", "client")
def create_ticket():
    user = get_current_user()
    data = TicketCreateSchema().load(request.get_json(silent=True) or {})

    ticket = Ticket(
        title=data["title"],
        description=data["description"],
        priority=data["priority"],
        user_id=user.id,
    )

    db.session.add(ticket)
    db.session.commit()

    return jsonify(
        {
            "message": "Ticket created",
            "ticket": ticket.to_dict(),
        }
    ), 201


@tickets_bp.route("/", methods=["GET"])
@jwt_required()
def get_tickets():
    user = get_current_user()
    params = TicketListQuerySchema().load(request.args)

    query = Ticket.query

    # Client solo ve sus propios tickets
    if user.role == "client":
        query = query.filter_by(user_id=user.id)

    # Filtro por status
    if params.get("status"):
        query = query.filter_by(status=params["status"])

    # Ordenar por fecha (más reciente primero)
    query = query.order_by(Ticket.created_at.desc())

    pagination = query.paginate(
        page=params["page"],
        per_page=params["per_page"],
        error_out=False,
    )

    return jsonify(
        {
            "tickets": [ticket.to_dict() for ticket in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }
    ), 200


@tickets_bp.route("/<int:ticket_id>", methods=["GET"])
@jwt_required()
def get_ticket(ticket_id: int):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"error": "ticket not found"}), 404

    # Client solo puede ver sus propios tickets
    if user.role == "client" and ticket.user_id != user.id:
        return jsonify({"error": "insufficient permissions"}), 403

    return jsonify({"ticket": ticket.to_dict()}), 200


@tickets_bp.route("/<int:ticket_id>", methods=["PATCH"])
@jwt_required()
def update_ticket(ticket_id: int):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"error": "ticket not found"}), 404

    # Client solo puede actualizar status si es su ticket
    if user.role == "client" and ticket.user_id != user.id:
        return jsonify({"error": "insufficient permissions"}), 403

    data = TicketUpdateSchema().load(request.get_json(silent=True) or {})

    # Solo admin/agent pueden cambiar status, prioridad y asignar
    if user.role in ("admin", "agent"):
        if data.get("status"):
            ticket.status = data["status"]
        if data.get("priority"):
            ticket.priority = data["priority"]
        if data.get("assignee_id"):
            assignee = User.query.get(data["assignee_id"])
            if assignee and assignee.role in ("admin", "agent"):
                ticket.assignee_id = data["assignee_id"]
            else:
                return jsonify({"error": "assignee must be admin or agent"}), 400
    else:
        # Client solo puede cambiar status a 'resolved' o 'closed'
        if data.get("status") in CLIENT_ALLOWED_STATUSES:
            ticket.status = data["status"]
        else:
            return jsonify(
                {"error": "clients can only change status to resolved or closed"}
            ), 400

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(
        {
            "message": "Ticket updated",
            "ticket": ticket.to_dict(),
        }
    ), 200


@tickets_bp.route("/<int:ticket_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(ticket_id: int):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"error": "ticket not found"}), 404

    # Client solo puede comentar en sus propios tickets
    if user.role == "client" and ticket.user_id != user.id:
        return jsonify({"error": "insufficient permissions"}), 403

    data = CommentCreateSchema().load(request.get_json(silent=True) or {})

    comment = Comment(
        body=data["body"],
        ticket_id=ticket_id,
        author_id=user.id,
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify(
        {
            "message": "Comment added",
            "comment": comment.to_dict(),
        }
    ), 201


@tickets_bp.route("/<int:ticket_id>/comments", methods=["GET"])
@jwt_required()
def get_comments(ticket_id: int):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({"error": "ticket not found"}), 404

    if user.role == "client" and ticket.user_id != user.id:
        return jsonify({"error": "insufficient permissions"}), 403

    comments = (
        Comment.query.filter_by(ticket_id=ticket_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    return jsonify({"comments": [comment.to_dict() for comment in comments]}), 200
