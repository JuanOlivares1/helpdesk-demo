# MEMORY.md — helpdesk-demo

Memory between sessions. Keep it under ~50 lines; summarize or remove what no longer helps.

## Estado actual

- Task 1 done: `AGENTS.md` rewritten from `AGENTS_TEMPLATE.md`; `MEMORY.md` seeded.
- Task 2 done: UI audit applied and frontend redesigned (tokens, responsive auth, accessible forms, URL filters/pagination/dialog, progress rail, role-aware editing).
- Task 3 done: `GET /api/users/assignees` (admin/agent only) plus assignee selector in ticket detail; README/AGENTS updated.
- Committed on `main`: `877f5c3` (docs + UI redesign) and `442051f` (assignee endpoint). The user pushes; no PR was opened by the agent.
- The `ui-design-audit` branch/worktree was removed; all changes were copied into the original directory.
- Dev DB seeded additively: one demo user per role and 30 generic tickets with no comments; the pre-existing tickets/comments were preserved.
- Task 4 done: deprecated `datetime.utcnow()` replaced with timezone-aware UTC and the short test JWT secret replaced.
- Task 5 done: full-stack HTTP check (`/health`, login, list/detail/comments, assignees, 401/403/422, assignee patch) plus static mobile/focus/motion review.
- Verification passed: `pytest` (40 tests, no warnings), `npm run lint && npm run build`, and Vite module transforms. No browser automation is available, so visual mobile/focus testing is still manual.

## Aprendizajes y errores a evitar

- Attached files can be empty: verify with `read`/`wc -c` before relying on them.
- `create_all()` does not update an existing schema; use migrations or `flask db stamp head` first.
- A worktree has no `node_modules`; never commit the local symlink used to share them.
- `utc_now()` is a callable helper, not a value evaluated at import; using `datetime.now(UTC)` directly as a column default would freeze the timestamp.
- Ports 5000 and 5173 are usually occupied by the user's own dev servers; use 5001/5174 for isolated checks and stop only the processes you started.

## Decisiones (y por qué)

- Keep Spanish headings in `AGENTS.md` because the template is Spanish; application code, UI and comments stay English for a portfolio-quality project.
- Filters, pagination and the new-ticket dialog live in URL search params to support deep links and back/forward navigation.
- IBM Plex Sans/Mono is loaded from Google Fonts with `preconnect`; no npm dependency was added.
- The assignee selector is limited to admin/agent and cannot clear an assignment: the backend schema rejects `null` and the service ignores falsy `assignee_id`. Ask before changing that contract.
- Existing rows keep naive timestamps; new rows are aware UTC. No migration was needed because column types did not change.

## Próximos pasos

1. User pushes the commits and opens the PR if needed; address review feedback only after that.
2. Normalize mixed timestamp formats in the API (legacy naive rows vs new aware UTC); requires a data migration decision.
3. If requested, add unassign support or an admin endpoint to create/promote admin/agent users.

Backlog from the previous session:

- Add frontend tests (for example, Vitest + Testing Library).
- Test `docker-compose.yml` in an environment with Docker.
- Review the unused `bcrypt` dependency in `requirements.txt`.
- Add CI for tests, lint and build.
- Consider refresh tokens, rate limiting and a database check in `/health`.
- Decide whether development should keep `create_all()` or move fully to migrations.

In short: the project has clear layers, consistent errors, declarative validation, a typed and accessible frontend, a versioned schema and a realistic PostgreSQL/Gunicorn deployment path.
