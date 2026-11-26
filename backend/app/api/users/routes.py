"""Routes for the user directory."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.api.auth.decorators import role_required
from app.api.dependencies import current_user
from app.api.users import service
from app.api.users.schemas import UserCreateSchema, UserRoleUpdateSchema

users_bp = Blueprint("users", __name__)


@users_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    users = service.list_users()
    return jsonify({"users": [user.to_dict() for user in users]}), 200


@users_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_user():
    data = UserCreateSchema().load(request.get_json(silent=True) or {})
    user = service.create_user(**data)

    return jsonify(
        {
            "message": "User created",
            "user": user.to_dict(),
        }
    ), 201


@users_bp.route("/<int:user_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_user(user_id: int):
    data = UserRoleUpdateSchema().load(request.get_json(silent=True) or {})
    user = service.update_user_role(user_id, data["role"], current_user())

    return jsonify(
        {
            "message": "User updated",
            "user": user.to_dict(),
        }
    ), 200


@users_bp.route("/assignees", methods=["GET"])
@jwt_required()
@role_required("admin", "agent")
def list_assignees():
    assignees = service.list_assignees()
    return jsonify({
        "assignees": [
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            }
            for user in assignees
        ]
    }), 200
