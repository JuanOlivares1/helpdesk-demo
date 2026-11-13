"""Schemas de validación para autenticación."""

from marshmallow import EXCLUDE, Schema, fields, validate


class RegisterSchema(Schema):
    """Valida el registro de un usuario."""

    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, max=128),
    )

    class Meta:
        unknown = EXCLUDE


class LoginSchema(Schema):
    """Valida el inicio de sesión."""

    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=1),
    )

    class Meta:
        unknown = EXCLUDE
