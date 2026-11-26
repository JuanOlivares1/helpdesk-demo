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


def current_user(client, token: str) -> dict:
    response = client.get("/api/auth/me", headers=auth(token))
    return response.get_json()["user"]


def test_admin_can_list_users(client):
    token = login(client, "admin@test.com")

    response = client.get("/api/users/", headers=auth(token))

    assert response.status_code == 200
    users = response.get_json()["users"]
    assert [user["email"] for user in users] == [
        "admin@test.com",
        "agent@test.com",
        "client@test.com",
    ]
    assert all(
        set(user) == {"id", "email", "role", "created_at"} for user in users
    )


def test_non_admins_cannot_list_users(client):
    responses = [
        client.get("/api/users/", headers=auth(login(client, email)))
        for email in ("agent@test.com", "client@test.com")
    ]

    assert [response.status_code for response in responses] == [403, 403]


def test_user_admin_endpoints_require_authentication(client):
    responses = [
        client.get("/api/users/"),
        client.post("/api/users/", json={}),
        client.patch("/api/users/1", json={"role": "agent"}),
    ]

    assert [response.status_code for response in responses] == [401, 401, 401]


def test_admin_can_create_agent(client):
    token = login(client, "admin@test.com")

    response = client.post(
        "/api/users/",
        json={
            "email": "newagent@test.com",
            "password": PASSWORD,
            "role": "agent",
        },
        headers=auth(token),
    )

    assert response.status_code == 201
    user = response.get_json()["user"]
    assert user["email"] == "newagent@test.com"
    assert user["role"] == "agent"
    assert login(client, "newagent@test.com")


def test_created_user_defaults_to_client(client):
    token = login(client, "admin@test.com")

    response = client.post(
        "/api/users/",
        json={"email": "newclient@test.com", "password": PASSWORD},
        headers=auth(token),
    )

    assert response.status_code == 201
    assert response.get_json()["user"]["role"] == "client"


def test_duplicate_user_returns_409(client):
    token = login(client, "admin@test.com")

    response = client.post(
        "/api/users/",
        json={
            "email": "admin@test.com",
            "password": PASSWORD,
            "role": "agent",
        },
        headers=auth(token),
    )

    assert response.status_code == 409
    assert response.get_json() == {"error": "email already registered"}


def test_create_user_rejects_invalid_payload(client):
    token = login(client, "admin@test.com")
    payloads = [
        ({"email": "invalid", "password": PASSWORD}, "email"),
        ({"email": "new@test.com", "password": "short"}, "password"),
        (
            {
                "email": "new@test.com",
                "password": PASSWORD,
                "role": "superuser",
            },
            "role",
        ),
    ]

    for payload, field in payloads:
        response = client.post(
            "/api/users/", json=payload, headers=auth(token)
        )
        assert response.status_code == 422
        assert field in response.get_json()["errors"]


def test_non_admins_cannot_create_users(client):
    responses = []
    for email in ("agent@test.com", "client@test.com"):
        token = login(client, email)
        responses.append(
            client.post(
                "/api/users/",
                json={"email": "blocked@test.com", "password": PASSWORD},
                headers=auth(token),
            )
        )

    assert [response.status_code for response in responses] == [403, 403]


def test_admin_can_change_user_role(client):
    admin_token = login(client, "admin@test.com")
    client_token = login(client, "client@test.com")
    user_id = current_user(client, client_token)["id"]

    for role in ("agent", "admin", "client"):
        response = client.patch(
            f"/api/users/{user_id}",
            json={"role": role},
            headers=auth(admin_token),
        )
        assert response.status_code == 200
        assert response.get_json()["user"]["role"] == role
        assert current_user(client, client_token)["role"] == role


def test_admin_cannot_demote_self(client):
    token = login(client, "admin@test.com")
    user_id = current_user(client, token)["id"]

    response = client.patch(
        f"/api/users/{user_id}",
        json={"role": "agent"},
        headers=auth(token),
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "admins cannot demote themselves"}


def test_role_update_rejects_missing_user_and_invalid_role(client):
    token = login(client, "admin@test.com")

    missing = client.patch(
        "/api/users/9999", json={"role": "agent"}, headers=auth(token)
    )
    invalid = client.patch(
        "/api/users/1", json={"role": "superuser"}, headers=auth(token)
    )

    assert missing.status_code == 404
    assert missing.get_json() == {"error": "user not found"}
    assert invalid.status_code == 422
    assert "role" in invalid.get_json()["errors"]


def test_non_admins_cannot_change_roles(client):
    token = login(client, "agent@test.com")

    response = client.patch(
        "/api/users/1", json={"role": "admin"}, headers=auth(token)
    )

    assert response.status_code == 403
