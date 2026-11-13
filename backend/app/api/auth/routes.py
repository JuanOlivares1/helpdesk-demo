"""Rutas de autenticación."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required

from app.api.auth import service
from app.api.auth.schemas import LoginSchema, RegisterSchema
from app.api.dependencies import current_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = RegisterSchema().load(request.get_json(silent=True) or {})
    user = service.register_user(**data)

    return jsonify(
        {
            "message": "User created successfully",
            "user": user.to_dict(),
        }
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = LoginSchema().load(request.get_json(silent=True) or {})
    user = service.authenticate_user(**data)

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "access_token": access_token,
            "user": user.to_dict(),
        }
    ), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user = current_user()

    return jsonify({"user": user.to_dict()}), 200
