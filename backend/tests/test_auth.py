import pytest
import json
from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-jwt-secret-32chars-long-key'
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_register_and_login(client):
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['user']['email'] == 'test@example.com'
    assert data['user']['role'] == 'client'

    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    token = data['access_token']

    response = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['user']['email'] == 'test@example.com'
