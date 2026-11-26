# AGENTS.md — HelpDesk

Multi-user ticket helpdesk for clients and support teams. The backend is Flask + SQLAlchemy/JWT and the frontend is a React SPA; each subproject runs separately from the repository root.

## Stack y estructura

- Backend: Flask 3.1, Flask-SQLAlchemy 3.1, Flask-JWT-Extended 4.7, Flask-CORS 5.0, Flask-Migrate 4.1, Marshmallow 4.4, Gunicorn 23, psycopg 3.3. Python 3.12; the virtualenv is included in `backend/venv/`.
- Frontend: React 19.3, TypeScript 6, Vite 8, React Router 7.18, Axios 1.21, Tailwind CSS 4.3 with `@tailwindcss/vite`. Node 20+ (tested with 22).
- `backend/app/__init__.py`: `create_app` factory; selects config, initializes logging/extensions/error handlers, registers `auth_bp` at `/api/auth` and `tickets_bp` at `/api/tickets`, and exposes `/health` without auth.
- `backend/app/config.py`: `BaseConfig`, `DevelopmentConfig`, `TestingConfig`, `ProductionConfig`; reads `FLASK_ENV`/`APP_ENV`, `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `LOG_LEVEL`, `LOG_JSON`, `CORS_ORIGINS`.
- `backend/app/logging.py`, `errors.py`, `exceptions.py`: JSON or readable logs with `X-Request-ID`; global handlers for 422 validation, 400/403/404/409 API errors, 401 JWT errors and 500 SQLAlchemy errors.
- `backend/app/api/auth/`: `routes.py`, `schemas.py`, `service.py`, `decorators.py` (`role_required`). `backend/app/api/tickets/`: `routes.py`, `schemas.py`, `service.py`; permissions and pagination live in the service. `backend/app/api/users/`: `routes.py`, `schemas.py`, `service.py`; `users_bp` is registered at `/api/users` and exposes admin user management plus assignable admins/agents.
- `backend/app/api/dependencies.py`: `current_user()` from the JWT. `backend/app/models.py`: `User`, `Ticket`, `Comment`; extensions in `extensions.py`, domain constants in `constants.py`.
- `backend/migrations/`: Flask-Migrate; initial revision `ea26a6ef442b`. `backend/instance/helpdesk.db` is the ignored development database.
- `frontend/src/api.ts`: typed axios client, base `VITE_API_URL` (default `http://localhost:5000/api`), token in `localStorage` as `token`, 401 redirect except on login/register.
- `frontend/src/auth/`: `AuthProvider` validates the token with `/auth/me`; `useAuth` exposes `user`, `token`, `loading`, `login`, `logout`, `refreshUser`.
- `frontend/src/App.tsx`: `/login`, `/register`, `/`, `/ticket/:id`, `/users` (admins only) and a 404 route; `PrivateRoute`/`PublicOnlyRoute`/`AdminRoute` wait for `loading`.
- `frontend/src/types.ts`: API types. `frontend/src/ticket-meta.ts`: status/priority labels and badge classes. `frontend/src/index.css`: Tailwind v4 semantic component classes and theme tokens.
- `docker-compose.yml`: PostgreSQL 16 plus backend with Gunicorn; runs `flask db upgrade` before starting. The frontend runs separately with `npm run dev`.

## Comandos

Setup (all `.env` files are gitignored; never commit them):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`pytest.ini` sets `pythonpath=backend`; 36 tests pass today):

```bash
source backend/venv/bin/activate
pytest
pytest backend/tests/test_auth.py::test_register_and_login
cd backend && flask --app app run --debug --port 5000
cd backend && gunicorn --bind 0.0.0.0:5000 wsgi:app
```

Migrations:

```bash
cd backend
flask --app app db upgrade
flask --app app db migrate -m "describe the change"
flask --app app db downgrade
```

Frontend (Playwright E2E covers desktop and mobile; verification is lint + build + E2E):

```bash
cd frontend
npm run dev
npm run lint
npm run build
npx playwright install --with-deps chromium   # one-time browser setup
npm run test:e2e
```

Docker:

```bash
cp .env.example .env
docker compose up --build
```

## Convenciones

- Write professional, portfolio-quality code: small functions, typed boundaries, explicit errors, no dead code.
- The application is fully in English: UI copy, identifiers, file names, code comments and docstrings. Legacy Spanish comments are translated only in files we touch; do not start a global rewrite without asking.
- Keep the UI clean, responsive and keyboard accessible; every new screen must work well on mobile.
- Comments and docstrings explain intent, not the obvious code. The Spanish headings in this document follow the template; they do not change the English rule for the application.
- UI and error copy uses active voice and sentence case; loading states end with `…`.
- Use Tailwind v4 tokens and semantic classes from `frontend/src/index.css`; avoid inline styles unless the change is deliberately about styling.

## Reglas de dominio / trampas conocidas

- PostgreSQL is used in Docker/production; SQLite is used for tests (in memory) and for the ignored development database `backend/instance/helpdesk.db`.
- Roles: `admin`, `agent`, `client`. Clients see and comment only their own tickets (`user_id`) and may only change status to `resolved`/`closed`. Admins and agents see all tickets, can change status/priority and assign or unassign tickets; assignees must be admin/agent. Creating tickets is allowed for admin and client, not agent.
- There is no tenant/organization column: isolation is based on `user_id` only.
- The JWT stores identity as `str(user.id)`; convert it with `int()` when querying users.
- Public registration ignores `role` and forces `client`; schemas use `unknown=EXCLUDE`. Only an admin can create users with a chosen role or change roles through `/api/users`, and self-demotion is rejected with `400`.
- `PATCH /api/tickets/<id>` accepts `assignee_id: null` to clear an assignment; omitting the field leaves it unchanged. Clients sending `assignee_id` get `400`.
- Validation errors return `422 {"errors": {...}}`; every other error uses `{"error": "..."}`.
- `DevelopmentConfig` and `TestingConfig` set `CREATE_TABLES=True` and call `db.create_all()`. `ProductionConfig` (`APP_ENV=production`) does not: run `flask db upgrade`. If a development database predates migrations, run `flask db stamp head` first. Model changes do not migrate themselves.
- There are no CI workflows or pre-commit hooks; run checks manually.

## Forma de trabajar

- Have in mind that we are working on windows with wsl, try to only use the ubuntu environment and only access windows programs or files when needed, always ask the user when trying to use something outside wsl.
- Do only what is asked; do not add features on your own without asking first.
- Spec-driven development: define the task, execute it, verify it, then move to the next one. One task at a time.
- Read `MEMORY.md` at the start of a session and update it when a task finishes.
- At the end, summarize what changed and list any decision that needs review.

## Memoria

- At the start, read `MEMORY.md` for project state and decisions already taken.
- After each task, update it: current state, important decisions with their reason, and mistakes to avoid.
- Keep it short (about 50 lines maximum): summarize or remove what no longer helps.
- If something becomes a permanent rule, propose moving it to `AGENTS.md` instead of leaving it in memory.
- Never store sensitive data (keys, tokens, personal data) in it.

## Límites

- ✅ Siempre: explain planned changes and suggestions one task at a time; update `MEMORY.md` after each task; run the verification commands below before closing a task.
- ⚠ Pregunta antes: new dependencies, new files, data-format changes, architecture changes, global refactors, or backend work when the task is frontend-only.
- 🚫 Nunca: commit `.env` files, secrets or personal data; assume model changes are migrated automatically; add Spanish text or comments to new code; modify files outside the agreed task.

## Verificación

Cómo comprobar que un cambio funciona antes de darlo por terminado:

- Backend: `pytest`; when models change, also apply `cd backend && flask --app app db upgrade` against a disposable database.
- Frontend: `cd frontend && npm run lint && npm run build && npm run test:e2e` (E2E needs Chromium installed once with `npx playwright install --with-deps chromium`).
- Full stack: the E2E suite already checks `/health` indirectly plus login, list/detail, triage, comments, user creation/role changes, mobile viewport and keyboard focus; the HTTP smoke check is still useful for API-only changes.
- Playwright uses a disposable database copy and isolated ports 5001/5174; never point it at the development database or stop the user's servers on 5000/5173.
- Manual only: no CI workflows or pre-commit hooks exist yet.
