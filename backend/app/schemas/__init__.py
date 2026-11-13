"""Exporta los schemas de validación de la aplicación."""

from app.schemas.auth import LoginSchema, RegisterSchema
from app.schemas.tickets import (
    CommentCreateSchema,
    TicketCreateSchema,
    TicketListQuerySchema,
    TicketUpdateSchema,
)

__all__ = [
    "LoginSchema",
    "RegisterSchema",
    "CommentCreateSchema",
    "TicketCreateSchema",
    "TicketListQuerySchema",
    "TicketUpdateSchema",
]
