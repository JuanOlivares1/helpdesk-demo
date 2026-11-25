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


def login(client, email: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    return response.get_json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_list_assignees(client):
    token = login(client, "admin@test.com")

    response = client.get("/api/users/assignees", headers=auth(token))

    assert response.status_code == 200
    assignees = response.get_json()["assignees"]
    assert [user["email"] for user in assignees] == [
        "admin@test.com",
        "agent@test.com",
    ]
    assert all(
        set(user) == {"id", "email", "role"} for user in assignees
    )


def test_agent_can_list_assignees(client):
    token = login(client, "agent@test.com")

    response = client.get("/api/users/assignees", headers=auth(token))

    assert response.status_code == 200
    roles = [user["role"] for user in response.get_json()["assignees"]]
    assert "client" not in roles


def test_client_cannot_list_assignees(client):
    token = login(client, "client@test.com")

    response = client.get("/api/users/assignees", headers=auth(token))

    assert response.status_code == 403
    assert "error" in response.get_json()


def test_assignees_require_authentication(client):
    response = client.get("/api/users/assignees")

    assert response.status_code == 401
