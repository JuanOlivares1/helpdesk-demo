"""Tests for permissions, pagination and edge cases."""

import pytest

from app import create_app
from app.extensions import db
from app.models import User

PASSWORD = "password123"


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

        users = [
            User(email="admin@test.com", role="admin"),
            User(email="agent@test.com", role="agent"),
            User(email="client@test.com", role="client"),
            User(email="other@test.com", role="client"),
        ]

        for user in users:
            user.set_password(PASSWORD)

        db.session.add_all(users)
        db.session.commit()

        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def login(client, email: str) -> tuple[str, dict]:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    data = response.get_json()
    return data["access_token"], data["user"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_ticket(
    client,
    token: str,
    title: str = "Ticket",
    description: str = "Description",
) -> dict:
    response = client.post(
        "/api/tickets/",
        json={"title": title, "description": description},
        headers=auth(token),
    )
    assert response.status_code == 201
    return response.get_json()["ticket"]


def test_agent_cannot_create_ticket(client):
    agent_token, _ = login(client, "agent@test.com")

    response = client.post(
        "/api/tickets/",
        json={"title": "Ticket", "description": "Description"},
        headers=auth(agent_token),
    )

    assert response.status_code == 403


def test_admin_sees_all_tickets(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, _ = login(client, "client@test.com")

    create_ticket(client, client_token, title="Client ticket")
    create_ticket(client, admin_token, title="Admin ticket")

    response = client.get("/api/tickets/", headers=auth(admin_token))
    data = response.get_json()

    assert response.status_code == 200
    assert data["total"] == 2
    assert {ticket["title"] for ticket in data["tickets"]} == {
        "Client ticket",
        "Admin ticket",
    }


def test_client_can_close_own_ticket(client):
    client_token, _ = login(client, "client@test.com")
    ticket = create_ticket(client, client_token)

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"status": "closed"},
        headers=auth(client_token),
    )

    assert response.status_code == 200
    assert response.get_json()["ticket"]["status"] == "closed"


def test_client_cannot_reopen_ticket(client):
    client_token, _ = login(client, "client@test.com")
    ticket = create_ticket(client, client_token)

    for status in ("open", "in_progress"):
        response = client.patch(
            f"/api/tickets/{ticket['id']}",
            json={"status": status},
            headers=auth(client_token),
        )

        assert response.status_code == 400
        assert response.get_json() == {
            "error": "clients can only change status to resolved or closed"
        }


def test_client_cannot_update_other_ticket(client):
    owner_token, _ = login(client, "client@test.com")
    other_token, _ = login(client, "other@test.com")
    ticket = create_ticket(client, owner_token)

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"status": "resolved"},
        headers=auth(other_token),
    )

    assert response.status_code == 403


def test_client_cannot_comment_on_other_ticket(client):
    owner_token, _ = login(client, "client@test.com")
    other_token, _ = login(client, "other@test.com")
    ticket = create_ticket(client, owner_token)

    response = client.post(
        f"/api/tickets/{ticket['id']}/comments",
        json={"body": "No debería poder"},
        headers=auth(other_token),
    )

    assert response.status_code == 403


def test_admin_can_assign_agent(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, _ = login(client, "client@test.com")
    _, agent = login(client, "agent@test.com")
    ticket = create_ticket(client, client_token)

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agent["id"]},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.get_json()["ticket"]["assignee_id"] == agent["id"]


def test_cannot_assign_client(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, client_user = login(client, "client@test.com")
    ticket = create_ticket(client, client_token)

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": client_user["id"]},
        headers=auth(admin_token),
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "assignee must be admin or agent"
    }


def test_admin_can_unassign_ticket(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, _ = login(client, "client@test.com")
    _, agent = login(client, "agent@test.com")
    ticket = create_ticket(client, client_token)

    assigned = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agent["id"]},
        headers=auth(admin_token),
    )
    assert assigned.status_code == 200

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": None},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.get_json()["ticket"]["assignee_id"] is None


def test_agent_can_unassign_ticket(client):
    admin_token, _ = login(client, "admin@test.com")
    agent_token, _ = login(client, "agent@test.com")
    client_token, _ = login(client, "client@test.com")
    _, agent = login(client, "agent@test.com")
    ticket = create_ticket(client, client_token)

    assigned = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agent["id"]},
        headers=auth(admin_token),
    )
    assert assigned.status_code == 200

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": None},
        headers=auth(agent_token),
    )

    assert response.status_code == 200
    assert response.get_json()["ticket"]["assignee_id"] is None


def test_client_cannot_unassign_ticket(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, _ = login(client, "client@test.com")
    _, agent = login(client, "agent@test.com")
    ticket = create_ticket(client, client_token)

    assigned = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agent["id"]},
        headers=auth(admin_token),
    )
    assert assigned.status_code == 200

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": None},
        headers=auth(client_token),
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "clients cannot change assignees"}

    current = client.get(
        f"/api/tickets/{ticket['id']}",
        headers=auth(admin_token),
    )
    assert current.get_json()["ticket"]["assignee_id"] == agent["id"]


def test_unassigning_an_unassigned_ticket_succeeds(client):
    admin_token, _ = login(client, "admin@test.com")
    client_token, _ = login(client, "client@test.com")
    ticket = create_ticket(client, client_token)

    response = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": None},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.get_json()["ticket"]["assignee_id"] is None


def test_missing_ticket_returns_404(client):
    admin_token, _ = login(client, "admin@test.com")

    responses = [
        client.get("/api/tickets/9999", headers=auth(admin_token)),
        client.patch(
            "/api/tickets/9999",
            json={"status": "closed"},
            headers=auth(admin_token),
        ),
        client.post(
            "/api/tickets/9999/comments",
            json={"body": "Comentario"},
            headers=auth(admin_token),
        ),
    ]

    assert [response.status_code for response in responses] == [404, 404, 404]
    assert responses[0].get_json() == {"error": "ticket not found"}


def test_duplicate_registration_returns_409(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "client@test.com", "password": PASSWORD},
    )

    assert response.status_code == 409
    assert response.get_json() == {"error": "email already registered"}


def test_login_with_wrong_password_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "client@test.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "invalid credentials"}


def test_ticket_pagination(client):
    client_token, _ = login(client, "client@test.com")

    for index in range(3):
        create_ticket(client, client_token, title=f"Ticket {index}")

    first_page = client.get(
        "/api/tickets/?page=1&per_page=2",
        headers=auth(client_token),
    ).get_json()
    second_page = client.get(
        "/api/tickets/?page=2&per_page=2",
        headers=auth(client_token),
    ).get_json()

    assert first_page["total"] == 3
    assert first_page["pages"] == 2
    assert len(first_page["tickets"]) == 2
    assert len(second_page["tickets"]) == 1


def test_ticket_status_filter(client):
    client_token, _ = login(client, "client@test.com")
    agent_token, _ = login(client, "agent@test.com")

    open_ticket = create_ticket(client, client_token, title="Open ticket")
    resolved_ticket = create_ticket(client, client_token, title="Resolved ticket")

    response = client.patch(
        f"/api/tickets/{resolved_ticket['id']}",
        json={"status": "resolved"},
        headers=auth(agent_token),
    )
    assert response.status_code == 200

    open_tickets = client.get(
        "/api/tickets/?status=open",
        headers=auth(client_token),
    ).get_json()
    resolved_tickets = client.get(
        "/api/tickets/?status=resolved",
        headers=auth(client_token),
    ).get_json()

    assert [ticket["id"] for ticket in open_tickets["tickets"]] == [
        open_ticket["id"]
    ]
    assert [ticket["id"] for ticket in resolved_tickets["tickets"]] == [
        resolved_ticket["id"]
    ]
