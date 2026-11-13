# AGENTS.md

Helpdesk multiusuario con backend Flask + SQLite/JWT (`backend/`) y frontend React 19 + TypeScript + Vite (`frontend/`). No hay build unificado en la raíz: cada subproyecto se ejecuta por separado.

## Comandos

Backend (venv incluido en `backend/venv/`):

```bash
source backend/venv/bin/activate      # desde la raíz
pytest                                # pytest.ini define pythonpath=backend; 7 tests pasan
pytest backend/tests/test_auth.py::test_register_and_login   # un solo test
cd backend && flask --app app run --debug --port 5000        # no existe run.py/wsgi.py
```

Migraciones: Flask-Migrate está configurado en `backend/migrations/`, pero `migrations/versions/` está vacío y `create_app()` ejecuta `db.create_all()` al arrancar. No asumas que los cambios de modelo se migran solos; genera una revisión explícita si tocas el esquema.

Frontend (desde `frontend/`):

```bash
npm run dev
npm run lint
npm run build     # equivale a: tsc -b && vite build
```

No hay runner de tests en el frontend. Verificación completa: `npm run lint && npm run build`.

## Arquitectura y wiring

- `backend/app/__init__.py`: app factory `create_app`; registra `auth_bp` en `/api/auth` y `tickets_bp` en `/api/tickets`. Extensiones en `extensions.py`, modelos en `models.py`.
- Roles: `admin`, `agent`, `client`. Los `client` solo ven/comentan sus propios tickets (`user_id`); admin/agent ven todos. No existe columna de tenant/organización: el aislamiento actual es por `user_id`, no asumas multitenancy por organización.
- El JWT guarda la identidad como string (`str(user.id)`); al consultar usuarios hay que convertirla con `int()`.
- Frontend: el cliente HTTP está en `frontend/src/api.ts`, con base `VITE_API_URL` (default `http://localhost:5000/api`). El token vive en `localStorage` como `token`; axios lo inyecta y redirige a `/login` ante 401.
- Rutas en `src/App.tsx`; `PrivateRoute` solo verifica presencia de token, no rol.
- El registro (`POST /api/auth/register`) acepta `role` desde el body, incluido `admin`. No lo uses como control de autorización.

## Setup y convenciones

- Copia `backend/.env.example` a `backend/.env`; `frontend/.env` ya apunta al backend local. Ambos `.env` están gitignoreados: no los commitees.
- La BD de desarrollo es `backend/instance/helpdesk.db` (ignorada). Los tests usan SQLite en memoria y crean sus propios usuarios.
- No hay Dockerfile ni workflows de CI (se eliminaron los placeholders): no existe build de contenedor ni verificación automática.
- UI y mensajes de error en inglés; comentarios/docstrings del código en español. Mantén cada convención donde corresponde.
- El frontend usa estilos inline, sin librería de UI ni CSS modules. Sigue ese patrón salvo que el cambio sea un refactor de estilos deliberado.
- No hay hooks de pre-commit: ejecuta lint/tests manualmente antes de cerrar un cambio.
