"""Validation schemas for user administration."""

from marshmallow import EXCLUDE, Schema, fields, validate

from app.constants import ROLES


class UserCreateSchema(Schema):
    """Validate creation of a user by an administrator."""

    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, max=128),
    )
    role = fields.String(load_default="client", validate=validate.OneOf(ROLES))

    class Meta:
        unknown = EXCLUDE


class UserRoleUpdateSchema(Schema):
    """Validate a role change by an administrator."""

    role = fields.String(required=True, validate=validate.OneOf(ROLES))

    class Meta:
        unknown = EXCLUDE
