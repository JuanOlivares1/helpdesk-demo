import os
from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, jwt, migrate
from flask_cors import CORS

load_dotenv()


def create_app(test_config=None):
    app = Flask(__name__)

    # Config base
    default_config = {
        'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-secret-key'),
        'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///helpdesk.db'),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string'),
        'JWT_ACCESS_TOKEN_EXPIRES': 3600
    }

    if test_config:
        default_config.update(test_config)

    app.config.update(default_config)

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Routes
    from app.routes.auth import auth_bp
    from app.routes.tickets import tickets_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    with app.app_context():
        db.create_all()

    return app
