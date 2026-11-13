"""Excepciones de dominio de la API."""


class ApiError(Exception):
    """Error de negocio con código HTTP asociado."""

    status_code = 500
    default_message = "internal server error"

    def __init__(self, message: str | None = None):
        super().__init__(message or self.default_message)
        self.message = message or self.default_message


class BadRequestError(ApiError):
    """Solicitud inválida."""

    status_code = 400
    default_message = "bad request"


class PermissionDeniedError(ApiError):
    """El usuario no tiene permisos sobre el recurso."""

    status_code = 403
    default_message = "insufficient permissions"


class NotFoundError(ApiError):
    """El recurso solicitado no existe."""

    status_code = 404
    default_message = "resource not found"


class ConflictError(ApiError):
    """El recurso entra en conflicto con el estado actual."""

    status_code = 409
    default_message = "conflict"
