import pytest
import json
from app import create_app
from app.extensions import db
from app.models import User, Ticket, Comment


@pytest.fixture
def app():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-jwt-secret-32chars-long-key'
    })

    with app.app_context():
        db.create_all()

        # Crear usuarios de prueba
        admin = User(email='admin@test.com', role='admin')
        admin.set_password('admin123')

        agent = User(email='agent@test.com', role='agent')
        agent.set_password('agent123')

        client = User(email='client@test.com', role='client')
        client.set_password('client123')

        db.session.add_all([admin, agent, client])
        db.session.commit()

        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def get_token(client, email, password):
    """Helper para obtener token de un usuario."""
    response = client.post('/api/auth/login', json={
        'email': email,
        'password': password
    })
    data = json.loads(response.data)
    return data['access_token']


def test_client_creates_ticket(client):
    token = get_token(client, 'client@test.com', 'client123')

    response = client.post('/api/tickets/', json={
        'title': 'Mi problema',
        'description': 'Necesito ayuda con X'
    }, headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['ticket']['title'] == 'Mi problema'
    assert data['ticket']['user_id'] == 3  # client@test.com


def test_client_sees_only_own_tickets(client):
    token = get_token(client, 'client@test.com', 'client123')

    # Crear ticket del admin
    admin_token = get_token(client, 'admin@test.com', 'admin123')
    client.post('/api/tickets/', json={
        'title': 'Ticket de admin',
        'description': 'Admin ticket'
    }, headers={'Authorization': f'Bearer {admin_token}'})

    # Client solo ve sus tickets
    response = client.get('/api/tickets/', headers={
        'Authorization': f'Bearer {token}'
    })

    data = json.loads(response.data)
    ticket_titles = [t['title'] for t in data['tickets']]
    assert 'Ticket de admin' not in ticket_titles
    assert len(data['tickets']) == 0  # client no tiene tickets


def test_agent_updates_ticket_status(client):
    # Crear ticket como client
    client_token = get_token(client, 'client@test.com', 'client123')
    response = client.post('/api/tickets/', json={
        'title': 'Problema urgente',
        'description': 'Urgente'
    }, headers={'Authorization': f'Bearer {client_token}'})
    ticket_id = json.loads(response.data)['ticket']['id']

    # Agente actualiza status
    agent_token = get_token(client, 'agent@test.com', 'agent123')
    response = client.patch(f'/api/tickets/{ticket_id}', json={
        'status': 'in_progress'
    }, headers={'Authorization': f'Bearer {agent_token}'})

    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['ticket']['status'] == 'in_progress'


def test_client_cannot_see_other_tickets(client):
    client_token = get_token(client, 'client@test.com', 'client123')

    # Crear otro ticket
    response = client.post('/api/tickets/', json={
        'title': 'Ticket 1',
        'description': 'Descripción'
    }, headers={'Authorization': f'Bearer {client_token}'})
    ticket_id = json.loads(response.data)['ticket']['id']

    # Crear otro usuario cliente
    response = client.post('/api/auth/register', json={
        'email': 'client2@test.com',
        'password': 'client123'
    })

    client2_token = get_token(client, 'client2@test.com', 'client123')

    # Client2 intenta ver el ticket de client1
    response = client.get(f'/api/tickets/{ticket_id}', headers={
        'Authorization': f'Bearer {client2_token}'
    })

    assert response.status_code == 403


def test_add_comment(client):
    # Crear ticket
    client_token = get_token(client, 'client@test.com', 'client123')
    response = client.post('/api/tickets/', json={
        'title': 'Ticket con comentarios',
        'description': 'Con comentarios'
    }, headers={'Authorization': f'Bearer {client_token}'})
    ticket_id = json.loads(response.data)['ticket']['id']

    # Agregar comentario
    response = client.post(f'/api/tickets/{ticket_id}/comments', json={
        'body': 'Este es un comentario de prueba'
    }, headers={'Authorization': f'Bearer {client_token}'})

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['comment']['body'] == 'Este es un comentario de prueba'
    assert data['comment']['ticket_id'] == ticket_id


def test_get_comments(client):
    # Crear ticket y 2 comentarios
    client_token = get_token(client, 'client@test.com', 'client123')
    response = client.post('/api/tickets/', json={
        'title': 'Ticket para comentarios',
        'description': 'Comentarios'
    }, headers={'Authorization': f'Bearer {client_token}'})
    ticket_id = json.loads(response.data)['ticket']['id']

    client.post(f'/api/tickets/{ticket_id}/comments', json={
        'body': 'Comentario 1'
    }, headers={'Authorization': f'Bearer {client_token}'})

    client.post(f'/api/tickets/{ticket_id}/comments', json={
        'body': 'Comentario 2'
    }, headers={'Authorization': f'Bearer {client_token}'})

    response = client.get(f'/api/tickets/{ticket_id}/comments', headers={
        'Authorization': f'Bearer {client_token}'
    })

    data = json.loads(response.data)
    assert len(data['comments']) == 2
    assert data['comments'][0]['body'] == 'Comentario 1'
    assert data['comments'][1]['body'] == 'Comentario 2'
