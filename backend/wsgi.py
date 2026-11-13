"""Punto de entrada WSGI para producción."""

from app import create_app

app = create_app()
