"""Validation schemas for tickets and comments."""

from marshmallow import EXCLUDE, Schema, fields, validate

from app.constants import TICKET_PRIORITIES, TICKET_STATUSES


class TicketCreateSchema(Schema):
    """Validate ticket creation."""

    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
    )
    description = fields.String(
        required=True,
        validate=validate.Length(min=1, max=10000),
    )
    priority = fields.String(
        load_default="medium",
        validate=validate.OneOf(TICKET_PRIORITIES),
    )

    class Meta:
        unknown = EXCLUDE


class TicketUpdateSchema(Schema):
    """Validate partial ticket updates; a null assignee clears the assignment."""

    status = fields.String(validate=validate.OneOf(TICKET_STATUSES))
    priority = fields.String(validate=validate.OneOf(TICKET_PRIORITIES))
    assignee_id = fields.Integer(
        validate=validate.Range(min=1),
        allow_none=True,
    )

    class Meta:
        unknown = EXCLUDE


class TicketListQuerySchema(Schema):
    """Validate listing and pagination parameters."""

    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(
        load_default=10,
        validate=validate.Range(min=1, max=100),
    )
    status = fields.String(validate=validate.OneOf(TICKET_STATUSES))

    class Meta:
        unknown = EXCLUDE


class CommentCreateSchema(Schema):
    """Validate comment creation."""

    body = fields.String(
        required=True,
        validate=validate.Length(min=1, max=5000),
    )

    class Meta:
        unknown = EXCLUDE
