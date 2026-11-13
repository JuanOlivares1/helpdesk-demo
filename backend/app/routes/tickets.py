from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Ticket, Comment
from app.routes.auth import role_required
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)


def get_current_user():
    """Helper para obtener el usuario actual desde el token."""
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


@tickets_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('admin', 'client')
def create_ticket():
    user = get_current_user()
    data = request.get_json()

    if not data or not data.get('title') or not data.get('description'):
        return jsonify({'error': 'title and description are required'}), 400

    ticket = Ticket(
        title=data['title'],
        description=data['description'],
        priority=data.get('priority', 'medium'),
        user_id=user.id
    )

    db.session.add(ticket)
    db.session.commit()

    return jsonify({
        'message': 'Ticket created',
        'ticket': ticket.to_dict()
    }), 201


@tickets_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    user = get_current_user()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', None)

    query = Ticket.query

    # Client solo ve sus propios tickets
    if user.role == 'client':
        query = query.filter_by(user_id=user.id)

    # Filtro por status
    if status:
        query = query.filter_by(status=status)

    # Ordenar por fecha (más reciente primero)
    query = query.order_by(Ticket.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    tickets = pagination.items

    return jsonify({
        'tickets': [t.to_dict() for t in tickets],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    }), 200


@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({'error': 'ticket not found'}), 404

    # Client solo puede ver sus propios tickets
    if user.role == 'client' and ticket.user_id != user.id:
        return jsonify({'error': 'insufficient permissions'}), 403

    return jsonify({'ticket': ticket.to_dict()}), 200


@tickets_bp.route('/<int:ticket_id>', methods=['PATCH'])
@jwt_required()
def update_ticket(ticket_id):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({'error': 'ticket not found'}), 404

    # Client solo puede actualizar status si es su ticket
    if user.role == 'client' and ticket.user_id != user.id:
        return jsonify({'error': 'insufficient permissions'}), 403

    # Solo admin/agent pueden cambiar status y asignar
    if user.role in ['admin', 'agent']:
        data = request.get_json()
        if data.get('status') and data['status'] in ['open', 'in_progress', 'resolved']:
            ticket.status = data['status']
        if data.get('priority') and data['priority'] in ['low', 'medium', 'high']:
            ticket.priority = data['priority']
        if data.get('assignee_id'):
            assignee = User.query.get(data['assignee_id'])
            if assignee and assignee.role in ['admin', 'agent']:
                ticket.assignee_id = data['assignee_id']
            else:
                return jsonify({'error': 'assignee must be admin or agent'}), 400
    else:
        # Client solo puede cambiar status a 'resolved' o 'closed'
        data = request.get_json()
        if data.get('status') and data['status'] in ['resolved', 'closed']:
            ticket.status = data['status']
        else:
            return jsonify({'error': 'clients can only change status to resolved or closed'}), 400

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Ticket updated',
        'ticket': ticket.to_dict()
    }), 200


@tickets_bp.route('/<int:ticket_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(ticket_id):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({'error': 'ticket not found'}), 404

    # Client solo puede comentar en sus propios tickets
    if user.role == 'client' and ticket.user_id != user.id:
        return jsonify({'error': 'insufficient permissions'}), 403

    data = request.get_json()
    if not data or not data.get('body'):
        return jsonify({'error': 'body is required'}), 400

    comment = Comment(
        body=data['body'],
        ticket_id=ticket_id,
        author_id=user.id
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'message': 'Comment added',
        'comment': comment.to_dict()
    }), 201


@tickets_bp.route('/<int:ticket_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(ticket_id):
    user = get_current_user()
    ticket = Ticket.query.get(ticket_id)

    if not ticket:
        return jsonify({'error': 'ticket not found'}), 404

    if user.role == 'client' and ticket.user_id != user.id:
        return jsonify({'error': 'insufficient permissions'}), 403

    comments = Comment.query.filter_by(ticket_id=ticket_id).order_by(
        Comment.created_at.asc()
    ).all()

    return jsonify({
        'comments': [c.to_dict() for c in comments]
    }), 200
