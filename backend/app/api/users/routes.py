"""Routes for the user directory."""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.api.auth.decorators import role_required
from app.api.users import service

users_bp = Blueprint("users", __name__)


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
