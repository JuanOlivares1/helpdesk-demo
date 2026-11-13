"""Rutas de tickets y comentarios."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.api.auth.decorators import role_required
from app.api.dependencies import current_user
from app.api.tickets import service
from app.api.tickets.schemas import (
    CommentCreateSchema,
    TicketCreateSchema,
    TicketListQuerySchema,
    TicketUpdateSchema,
)

tickets_bp = Blueprint("tickets", __name__)


@tickets_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin", "client")
def create_ticket():
    user = current_user()
    data = TicketCreateSchema().load(request.get_json(silent=True) or {})
    ticket = service.create_ticket(user, data)

    return jsonify(
        {
            "message": "Ticket created",
            "ticket": ticket.to_dict(),
        }
    ), 201


@tickets_bp.route("/", methods=["GET"])
@jwt_required()
def get_tickets():
    user = current_user()
    params = TicketListQuerySchema().load(request.args)
    pagination = service.list_tickets(user, params)

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
    user = current_user()
    ticket = service.get_ticket(user, ticket_id)

    return jsonify({"ticket": ticket.to_dict()}), 200


@tickets_bp.route("/<int:ticket_id>", methods=["PATCH"])
@jwt_required()
def update_ticket(ticket_id: int):
    user = current_user()
    data = TicketUpdateSchema().load(request.get_json(silent=True) or {})
    ticket = service.update_ticket(user, ticket_id, data)

    return jsonify(
        {
            "message": "Ticket updated",
            "ticket": ticket.to_dict(),
        }
    ), 200


@tickets_bp.route("/<int:ticket_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(ticket_id: int):
    user = current_user()
    data = CommentCreateSchema().load(request.get_json(silent=True) or {})
    comment = service.add_comment(user, ticket_id, data["body"])

    return jsonify(
        {
            "message": "Comment added",
            "comment": comment.to_dict(),
        }
    ), 201


@tickets_bp.route("/<int:ticket_id>/comments", methods=["GET"])
@jwt_required()
def get_comments(ticket_id: int):
    user = current_user()
    comments = service.list_comments(user, ticket_id)

    return jsonify({"comments": [comment.to_dict() for comment in comments]}), 200
