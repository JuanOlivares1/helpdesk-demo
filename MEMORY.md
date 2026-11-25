# MEMORY.md — helpdesk-demo

Memory between sessions. Keep it under ~50 lines; summarize or remove what no longer helps.

## Estado actual

- Task 1 done: `AGENTS.md` rewritten from `AGENTS_TEMPLATE.md`; `MEMORY.md` seeded.
- Task 2 done: UI audit applied and frontend redesigned (tokens, responsive auth, accessible forms, URL filters/pagination/dialog, progress rail, role-aware editing).
- Task 3 done: `GET /api/users/assignees` (admin/agent only) plus assignee selector in ticket detail; README/AGENTS updated.
- The `ui-design-audit` branch/worktree was removed at the user's request; all changes were copied into the original directory and remain uncommitted. The user handles git/PR.
- Verification passed: `pytest` (40 tests) and `npm run lint && npm run build`.

## Aprendizajes y errores a evitar

- Attached files can be empty: verify with `read`/`wc -c` before relying on them.
- `create_all()` does not update an existing schema; use migrations or `flask db stamp head` first.
- A worktree has no `node_modules`; never commit the local symlink used to share them.
- The JWT test secret is too short and `datetime.utcnow()` is deprecated; both are known warnings, not regressions.

## Decisiones (y por qué)

- Keep Spanish headings in `AGENTS.md` because the template is Spanish; application code, UI and comments stay English for a portfolio-quality project.
- Filters, pagination and the new-ticket dialog live in URL search params to support deep links and back/forward navigation.
- IBM Plex Sans/Mono is loaded from Google Fonts with `preconnect`; no npm dependency was added.
- The assignee selector is limited to admin/agent and cannot clear an assignment: the backend schema rejects `null` and the service ignores falsy `assignee_id`. Ask before changing that contract.

## Próximos pasos

1. User commits and opens the PR; address review feedback only after that.
2. Full-stack manual check: `/health`, login, ticket list/detail, assignee change, mobile viewport and keyboard focus order.
3. If requested, add unassign support or an admin endpoint to create/promote admin/agent users.

Backlog from the previous session:

- Replace `datetime.utcnow()` with `datetime.now(UTC)` in models and service.
- Lengthen the JWT secret used by the legacy test.
- Add frontend tests (for example, Vitest + Testing Library).
- Test `docker-compose.yml` in an environment with Docker.
- Review the unused `bcrypt` dependency in `requirements.txt`.
- Add CI for tests, lint and build.
- Consider refresh tokens, rate limiting and a database check in `/health`.
- Decide whether development should keep `create_all()` or move fully to migrations.

In short: the project has clear layers, consistent errors, declarative validation, a typed and accessible frontend, a versioned schema and a realistic PostgreSQL/Gunicorn deployment path.
