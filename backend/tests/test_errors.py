"""Tests del manejo global de errores."""

from datetime import timedelta

import pytest
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import SQLAlchemyError

from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-jwt-secret-32chars-long-key",
            "PROPAGATE_EXCEPTIONS": False,
        }
    )

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/unknown")

    assert response.status_code == 404
    assert response.get_json() == {"error": "resource not found"}


def test_method_not_allowed_returns_json_405(client):
    response = client.get("/api/auth/login")

    assert response.status_code == 405
    assert response.get_json() == {"error": "method not allowed"}


def test_missing_token_returns_401(client):
    response = client.get("/api/tickets/")

    assert response.status_code == 401
    assert response.get_json() == {"error": "authorization required"}


def test_invalid_token_returns_401(client):
    response = client.get(
        "/api/tickets/",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "invalid token"}


def test_expired_token_returns_401(app, client):
    with app.app_context():
        token = create_access_token(
            identity="1",
            expires_delta=timedelta(seconds=-1),
        )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "token has expired"}


def test_unhandled_error_returns_json_500(app, client):
    @app.get("/__test/boom")
    def boom():
        raise RuntimeError("boom")

    response = client.get("/__test/boom")

    assert response.status_code == 500
    assert response.get_json() == {"error": "internal server error"}


def test_database_error_returns_json_500(app, client):
    @app.get("/__test/db-boom")
    def db_boom():
        raise SQLAlchemyError("boom")

    response = client.get("/__test/db-boom")

    assert response.status_code == 500
    assert response.get_json() == {"error": "internal server error"}
