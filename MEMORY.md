# MEMORY.md — helpdesk-demo

Memory between sessions. Keep it under ~50 lines; summarize or remove what no longer helps.

## Estado actual

- Task 1 done: `AGENTS.md` rewritten from `AGENTS_TEMPLATE.md`; `MEMORY.md` seeded.
- Task 2 done: UI audit applied and frontend redesigned (tokens, responsive auth, accessible forms, URL filters/pagination/dialog, progress rail, role-aware editing).
- Task 3 done: `GET /api/users/assignees` (admin/agent only) plus assignee selector in ticket detail; README/AGENTS updated.
- The `ui-design-audit` branch/worktree was removed; all changes were copied into the original directory.
- Dev DB seeded additively: one demo user per role and 30 generic tickets with no comments; the pre-existing tickets/comments were preserved.
- Task 4 done: deprecated `datetime.utcnow()` replaced with timezone-aware UTC and the short test JWT secret replaced.
- Task 5 done: full-stack HTTP check (`/health`, login, list/detail/comments, assignees, 401/403/422, assignee patch).
- Task 6 done: Playwright E2E suite with a disposable DB copy and isolated ports 5001/5174; fixed a `TicketForm` focus race.
- Task 7 done: UTC timestamp normalization via `iso_utc()` plus migration `c4f1a9b2d7e3` (aware columns and legacy rows interpreted as UTC); dev DB stamped and upgraded with a backup in `/tmp/opencode/helpdesk-before-utc-migration.db`.
- Project-local chrome-devtools MCP verified via `opencode run --standalone`: `chrome-devtools-mcp@latest --headless=true` uses Ubuntu Chrome; Windows Chrome over WSL cannot expose CDP. Restart OpenCode if MCP tools vanish after config edits.
- Task 8 done: admin-only user management (`GET/POST /api/users`, `PATCH /api/users/<id>`) with role validation, duplicate check, self-demotion guard, and 12 new tests (56 total).
- Task 9 done: admin-only `/users` UI (`UserAdmin`, `NewUserDialog`) with inline role changes, self row locked, `AdminRoute`, navbar link and 5 new E2E tests (34 total).
- Task 10 done: ticket unassignment via `assignee_id: null` on PATCH; admin/agent only, `Unassigned` option in the detail selector, 4 backend tests (60 total) and 1 E2E test (36 total).
- Task 11 done: removed unused `bcrypt==4.2.1` from `backend/requirements.txt`; hashing stays in `werkzeug.security`.
- Task 12 done: Vitest 5 + RTL + jest-dom + jsdom unit tests (12 tests) for api helpers, `Alert`, `Field` and `Pagination`; `npm test` added and full frontend verification passes.
- Task 13 done: Docker Compose verified with Windows Docker Desktop from WSL; fixed the folded `command` that broke Gunicorn. `/health` 200, migration head, register/login/tickets and role check pass; isolated stack removed.

## Aprendizajes y errores a evitar

- Attached files can be empty: verify with `read`/`wc -c` before relying on them.
- `create_all()` does not update an existing schema; use migrations or `flask db stamp head` first.
- A worktree has no `node_modules`; never commit the local symlink used to share them.
- `utc_now()` is a callable helper, not a value evaluated at import; using `datetime.now(UTC)` directly as a column default would freeze the timestamp.
- Ports 5000 and 5173 are usually occupied by the user's own dev servers; use 5001/5174 for isolated checks and stop only the processes you started.
- `sudo npx` fails (`npx: command not found`); install Playwright system deps with `npx playwright install --with-deps chromium` (with a password prompt) or `sudo apt-get install libnspr4 libnss3 libasound2t64`.
- SQLite drops timezone offsets from ORM writes even with `DateTime(timezone=True)`; `iso_utc()` is the API contract, while the migration normalizes stored legacy rows.
- A folded YAML `command: >` keeps embedded newlines when later lines are indented further; `sh -c` then ran only the first line. Keep shell commands on one Compose line (or use a list).
- Docker Desktop on Windows can be driven from WSL via `/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe`; use an isolated Compose project name and `down -v` afterwards.

## Decisiones (y por qué)

- Keep Spanish headings in `AGENTS.md` because the template is Spanish; application code, UI and comments stay English for a portfolio-quality project.
- Filters, pagination and the new-ticket dialog live in URL search params to support deep links and back/forward navigation.
- IBM Plex Sans/Mono is loaded from Google Fonts with `preconnect`; font files are not an npm dependency.
- Vitest only includes `src/**/*.test.{ts,tsx}`: without that filter it collects Playwright specs and fails because both frameworks define `test()`.
- Password hashing relies on `werkzeug.security` defaults; the explicit `bcrypt` requirement was dead weight and was removed.
- The assignee selector is limited to admin/agent and can clear an assignment with `assignee_id: null`; an omitted field leaves it unchanged. Clients sending `assignee_id` get `400` instead of being silently ignored.
- All API timestamps are UTC ISO 8601 with `+00:00`; naive legacy values are interpreted as UTC because they were written with `datetime.utcnow()`. Migration `c4f1a9b2d7e3` updates columns and existing rows; PostgreSQL uses `AT TIME ZONE 'UTC'` and SQLite uses a batch alter plus a raw value rewrite.

## Próximos pasos

1. User handles pushes and PRs; address review feedback only after that.
2. If requested, review refresh tokens, rate limiting and a database check in `/health`.

Backlog from the previous session:

- Add CI for tests, lint and build.
- Review the 9 moderate dev-only npm advisories (`minimatch` via ESLint toolchain); production audit is clean.
- Decide whether development should keep `create_all()` or move fully to migrations.

In short: the project has clear layers, consistent errors, declarative validation, a typed and accessible frontend, a versioned schema and a realistic PostgreSQL/Gunicorn deployment path.
