# AGENTS.md

Helpdesk multiusuario con backend Flask + SQLAlchemy/JWT (`backend/`) y frontend React 19 + TypeScript + Vite + Tailwind CSS v4 (`frontend/`). No hay build unificado en la raíz: cada subproyecto se ejecuta por separado.

## Comandos

Backend (venv incluido en `backend/venv/`):

```bash
source backend/venv/bin/activate      # desde la raíz
pytest                                # pytest.ini define pythonpath=backend; 36 tests pasan
pytest backend/tests/test_auth.py::test_register_and_login   # un solo test
cd backend && flask --app app run --debug --port 5000
cd backend && gunicorn --bind 0.0.0.0:5000 wsgi:app          # producción (wsgi.py)
```

Migraciones (Flask-Migrate configurado en `backend/migrations/`; revisión inicial `ea26a6ef442b`):

```bash
cd backend
flask --app app db upgrade
flask --app app db migrate -m "descripción del cambio"
flask --app app db downgrade
```

`DevelopmentConfig` y `TestingConfig` tienen `CREATE_TABLES=True` y ejecutan `db.create_all()` al crear la app. `ProductionConfig` (`APP_ENV=production`) no crea tablas: requiere `flask db upgrade`. Si una base de desarrollo ya tenía tablas creadas por `create_all()`, usa `flask db stamp head` antes de aplicar migraciones. No asumas que los cambios de modelo se migran solos.

Frontend (desde `frontend/`):

```bash
npm run dev
npm run lint
npm run build     # equivale a: tsc -b && vite build
```

No hay runner de tests en el frontend. Verificación completa: `npm run lint && npm run build`.

Docker:

```bash
cp .env.example .env
docker compose up --build
```

`docker-compose.yml` levanta PostgreSQL 16 y el backend con Gunicorn; el comando aplica `flask db upgrade` antes de arrancar. El frontend se ejecuta aparte con `npm run dev`.

## Arquitectura y wiring

- `backend/app/__init__.py`: app factory `create_app`; elige configuración, inicializa logging, extensiones, manejadores de error y registra `auth_bp` en `/api/auth` y `tickets_bp` en `/api/tickets`.
- `backend/app/config.py`: `BaseConfig`, `DevelopmentConfig`, `TestingConfig`, `ProductionConfig` y `get_config`; lee `FLASK_ENV`/`APP_ENV`, `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `LOG_LEVEL`, `LOG_JSON` y `CORS_ORIGINS`.
- `backend/app/logging.py`: logging JSON o legible con `request_id` y header `X-Request-ID`.
- `backend/app/errors.py`: handlers globales para `ValidationError` (422), `ApiError` (400/403/404/409), `HTTPException`, `SQLAlchemyError` y errores JWT (401).
- `backend/app/exceptions.py`: `ApiError`, `BadRequestError`, `PermissionDeniedError`, `NotFoundError`, `ConflictError`.
- `backend/app/api/auth/`: `routes.py`, `schemas.py` (Marshmallow), `service.py` y `decorators.py` (`role_required`).
- `backend/app/api/tickets/`: `routes.py`, `schemas.py` y `service.py`; permisos y paginación viven en el servicio.
- `backend/app/api/dependencies.py`: `current_user()` a partir del JWT.
- `backend/app/models.py`: `User`, `Ticket` y `Comment`; extensiones en `extensions.py`; constantes de dominio en `constants.py`.
- Roles: `admin`, `agent`, `client`. Los `client` solo ven/comentan sus propios tickets (`user_id`) y solo pueden cambiar el estado a `resolved`/`closed`. `admin` y `agent` ven todos los tickets y pueden cambiar estado, prioridad y asignar a otro `admin`/`agent`. Crear tickets está permitido a `admin` y `client`, no a `agent`. No existe columna de tenant/organización: el aislamiento actual es por `user_id`.
- El JWT guarda la identidad como string (`str(user.id)`); al consultar usuarios hay que convertirla con `int()`.
- El registro (`POST /api/auth/register`) **ignora `role`** y fuerza `client`; los schemas usan `unknown=EXCLUDE`. No existe endpoint para crear/promover admins o agents.
- Validación con Marshmallow: los errores devuelven `422 {"errors": {...}}`; el resto de errores usan `{"error": "..."}`.
- Frontend: `src/api.ts` es el cliente axios tipado con base `VITE_API_URL` (default `http://localhost:5000/api`). El token vive en `localStorage` como `token`; axios lo inyecta y redirige a `/login` ante 401 (excepto login/registro). `getApiError` formatea también errores 422.
- `src/auth/`: `AuthProvider` valida el token con `/auth/me`, expone `user`, `token`, `loading`, `login`, `logout` y `refreshUser`; `useAuth` es el hook de acceso.
- Rutas en `src/App.tsx`: `/login`, `/register`, `/`, `/ticket/:id` y comodín 404. `PrivateRoute` y `PublicOnlyRoute` esperan a que `loading` termine.
- `src/types.ts` centraliza los tipos de la API; `src/ticket-meta.ts` las opciones y clases Tailwind de estado/prioridad.

## Setup y convenciones

- Copia `backend/.env.example` a `backend/.env` y `frontend/.env.example` a `frontend/.env`. Para Docker, copia `.env.example` de la raíz a `.env`. Todos los `.env` están gitignoreados: no los commitees.
- La BD de desarrollo es `backend/instance/helpdesk.db` (ignorada). Los tests usan SQLite en memoria y crean sus propios usuarios. Docker usa PostgreSQL 16 con `psycopg`.
- El frontend usa Tailwind CSS v4 con clases semánticas definidas en `src/index.css`; no añadas estilos inline salvo que sea un cambio deliberado. El plugin `@tailwindcss/vite` está configurado en `vite.config.ts`.
- UI y mensajes de error en inglés; comentarios/docstrings del código en español. Mantén cada convención donde corresponde.
- No hay workflows de CI ni hooks de pre-commit: ejecuta lint/tests manualmente antes de cerrar un cambio.
- No hay runner de tests en el frontend; verifica con `npm run lint && npm run build`.
