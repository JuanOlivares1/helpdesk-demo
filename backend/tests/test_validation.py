"""Tests de validación de payloads y parámetros."""

import pytest

from app import create_app
from app.extensions import db
from app.models import User


@pytest.fixture
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-jwt-secret-32chars-long-key",
        }
    )

    with app.app_context():
        db.create_all()

        user = User(email="client@test.com", role="client")
        user.set_password("client123")

        db.session.add(user)
        db.session.commit()

        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def get_token(client) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": "client@test.com", "password": "client123"},
    )
    return response.get_json()["access_token"]


def auth_headers(client) -> dict[str, str]:
    return {"Authorization": f"Bearer {get_token(client)}"}


def create_ticket(client) -> int:
    response = client.post(
        "/api/tickets/",
        json={"title": "Ticket de prueba", "description": "Descripción"},
        headers=auth_headers(client),
    )
    return response.get_json()["ticket"]["id"]


def assert_validation_error(response, field: str) -> None:
    assert response.status_code == 422
    body = response.get_json()
    assert "errors" in body
    assert field in body["errors"]


def test_register_rejects_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "password123"},
    )

    assert_validation_error(response, "email")


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "new@test.com", "password": "short"},
    )

    assert_validation_error(response, "password")


def test_register_ignores_role_from_body(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "new@test.com",
            "password": "password123",
            "role": "admin",
        },
    )

    assert response.status_code == 201
    assert response.get_json()["user"]["role"] == "client"


def test_create_ticket_requires_description(client):
    response = client.post(
        "/api/tickets/",
        json={"title": "Solo título"},
        headers=auth_headers(client),
    )

    assert_validation_error(response, "description")


def test_create_ticket_rejects_invalid_priority(client):
    response = client.post(
        "/api/tickets/",
        json={
            "title": "Ticket",
            "description": "Descripción",
            "priority": "urgent",
        },
        headers=auth_headers(client),
    )

    assert_validation_error(response, "priority")


def test_update_ticket_rejects_invalid_status(client):
    ticket_id = create_ticket(client)

    response = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "invalid"},
        headers=auth_headers(client),
    )

    assert_validation_error(response, "status")


def test_comment_requires_body(client):
    ticket_id = create_ticket(client)

    response = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={},
        headers=auth_headers(client),
    )

    assert_validation_error(response, "body")


def test_list_rejects_invalid_pagination(client):
    response = client.get(
        "/api/tickets/?page=0&per_page=101",
        headers=auth_headers(client),
    )

    assert_validation_error(response, "page")
    assert "per_page" in response.get_json()["errors"]


def test_invalid_json_returns_validation_error(client):
    response = client.post(
        "/api/tickets/",
        data="{invalid json",
        content_type="application/json",
        headers=auth_headers(client),
    )

    assert response.status_code == 422
    assert "errors" in response.get_json()
