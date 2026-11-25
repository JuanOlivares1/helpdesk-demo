# MEMORY.md — helpdesk-demo

Memory between sessions. Keep it under ~50 lines; summarize or remove what no longer helps.

## Estado actual

- Task 1 done: `AGENTS.md` rewritten from `AGENTS_TEMPLATE.md` and committed as `b4cc123`.
- Task 2 done on branch `ui-design-audit` (worktree `/home/juan_olivares/helpdesk-demo-ui-audit`): UI audit applied and redesign implemented.
- Frontend verification passed: `npm run lint && npm run build`. Backend untouched, so `pytest` was not needed.
- `main` was restored to its original UI and docs for side-by-side comparison; the user will review and open the PR.

## Aprendizajes y errores a evitar

- Attached files can be empty: verify with `read`/`wc -c` before relying on them.
- `create_all()` does not update an existing schema; use migrations or `flask db stamp head` first.
- The worktree has no `node_modules`; a local symlink to main was used and excluded via `.git/info/exclude` (never commit it).

## Decisiones (y por qué)

- Keep Spanish headings in `AGENTS.md` because the template is Spanish; application code, UI and comments stay English for a portfolio-quality project.
- Assignee is currently read-only in the detail view; the selector waits for `GET /api/users/assignees` so the branch stays frontend-only.
- Filters, pagination and the new-ticket dialog live in URL search params to support deep links and back/forward navigation.
- IBM Plex Sans/Mono is loaded from Google Fonts with `preconnect`; no npm dependency was added.

## Próximos pasos

1. User compares `main` against `ui-design-audit` locally and reviews the diff.
2. User opens the PR; address review feedback only after that.
3. Add `GET /api/users/assignees` with tests, wire the assignee selector, and update README/AGENTS.
4. Re-run `pytest`, `npm run lint`, `npm run build`, plus mobile/keyboard/reduced-motion review.

Backlog from the previous session:

- Replace `datetime.utcnow()` with `datetime.now(UTC)` in models and service.
- Lengthen the JWT secret used by the legacy test.
- Add frontend tests (for example, Vitest + Testing Library).
- Test `docker-compose.yml` in an environment with Docker.
- Add an admin endpoint to create/promote admin/agent users.
- Review the unused `bcrypt` dependency in `requirements.txt`.
- Add CI for tests, lint and build.
- Consider refresh tokens, rate limiting and a database check in `/health`.
- Decide whether development should keep `create_all()` or move fully to migrations.

In short: the project has clear layers, consistent errors, declarative validation, a typed and accessible frontend, a versioned schema and a realistic PostgreSQL/Gunicorn deployment path.
