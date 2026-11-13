"""Rutas de autenticación."""

from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models import User
from app.schemas.auth import LoginSchema, RegisterSchema

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = RegisterSchema().load(request.get_json(silent=True) or {})

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(email=data["email"], role="client")
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify(
        {
            "message": "User created successfully",
            "user": user.to_dict(),
        }
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = LoginSchema().load(request.get_json(silent=True) or {})

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
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
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "user not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


def role_required(*roles: str):
    """Restringe el acceso a los roles indicados."""

    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))

            if not user:
                return jsonify({"error": "user not found"}), 404

            if user.role not in roles:
                return jsonify({"error": "insufficient permissions"}), 403

            return f(*args, **kwargs)

        return wrapper

    return decorator
