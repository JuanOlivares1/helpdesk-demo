# MEMORY.md — helpdesk-demo

Memory between sessions. Keep it under ~50 lines; summarize or remove what no longer helps.

## Estado actual

- Tasks 1–13: `AGENTS.md`/`MEMORY.md`, UI audit, assignees, UTC + migration `c4f1a9b2d7e3`, HTTP smoke, Playwright (disposable DB, ports 5001/5174), admin users API + `/users` UI, unassignment, `bcrypt` removal, Vitest, Docker Compose verification with Windows Docker Desktop.
- Task 14 done: dark mode + deep-wine accent, three-state theme selector and AA contrast fixes across the SPA.
- Task 15 done: in `/users`, a pending role change highlights Save with `.btn-ready` (wine border + 5% tint); the E2E asserts the enabled/disabled transition.
- Task 16 done: centered modal dialogs with `m-auto` on `.dialog`; the ticket-dialog E2E checks the bounding box against the viewport center on desktop and mobile.
- Task 17 done: all 9 dev-only npm advisories cleared; `npm audit fix` bumped eslint 10.15, typescript-eslint 8.74 and minimatch 11.0.9 inside existing ranges, so only `package-lock.json` changed.
- Theme lives in `index.css`: semantic tokens overridden under `html.dark`, `@custom-variant dark (&:where(.dark, .dark *))`, pre-paint script in `index.html`, `theme-color` meta updated with the theme.
- Selector in `Navbar.tsx` cycles system → light → dark, stores the choice in `localStorage.theme`, and follows `matchMedia` only while `system` is selected.
- Palette: light accent `#7a1f2b`, dark accent `#b0475f`; auth aside uses `#7a1f2b` in both themes; `success` stays teal so state badges remain distinct from the accent.
- Solid `muted`/`faint` tokens replaced low-opacity `ink` text; Field hints, table headers, placeholders and secondary copy now meet 4.5:1.
- Installed `@ui-taste` under `.agents/skills/ui-taste/` (tracked in `skills-lock.json`) for research/verification playbooks.
- Verification after task 14: 12 Vitest, 38 Playwright (36 previous + 2 theme states), lint and build pass; 24 WCAG pairs pass in `/tmp/opencode/visual-evidence.json`.
- Baseline and final screenshots are in `/tmp/opencode/ui-baseline-*.png` and `/tmp/opencode/ui-final-*.png`.

## Aprendizajes y errores a evitar

- Attached files can be empty: verify with `read`/`wc -c` before relying on them.
- `create_all()` does not update an existing schema; use migrations or `flask db stamp head` first.
- A worktree has no `node_modules`; never commit the local symlink used to share them.
- `utc_now()` is a callable helper, not a value evaluated at import.
- Ports 5000 and 5173 belong to the user's servers; use 5001/5174 and stop only your own processes (Vite can leave a child alive after the shell is killed).
- A folded YAML `command: >` keeps embedded newlines; keep Compose shell commands on one line.
- Docker Desktop on Windows can be driven from WSL with an isolated Compose project and `down -v` afterwards.
- The theme button precedes Sign in/Register in DOM order; the focus-order E2E must expect that order.
- Tailwind v4 preflight resets `margin` on `<dialog>`; without `m-auto` a modal opened via `showModal()` sticks to the top-left instead of centering.
- `text-ink/45`, `/55` and `/60` fail 4.5:1 on light surfaces; use `text-muted`/`text-faint` tokens.
- White text at reduced opacity on dark `#b0475f` fails AA; the deeper aside wine keeps it legible.
- Image generation failed with `Invalid credential`; do not claim a visual match without inspecting pixels.
- OpenCode plugin fix: global deprecated `plugin: ["@warp-dot-dev/opencode-warp@0.1.7"]` loaded a V1-only build with no default export; both deprecated `plugin` blocks were removed and one global V2 `plugins` entry kept. `opencode plugin list` now shows only context7 and opencode-warp 0.2.0; no credentials involved.

## Decisiones (y por qué)

- Spanish headings stay in `AGENTS.md` (template); app code, UI and comments stay English.
- Filters, pagination and dialogs live in URL search params for deep links and back/forward support.
- IBM Plex fonts load from Google Fonts with `preconnect`; no font npm dependency.
- Vitest restricts collection to `src/**/*.test.{ts,tsx}` so it does not pick up Playwright specs.
- Password hashing uses `werkzeug.security`; no explicit `bcrypt` requirement.
- Theme tokens override CSS variables rather than using many `dark:` utility variants; one source of truth for each theme.
- Theme state is persisted explicitly so the system preference is only the default; `theme-color` follows it to avoid browser-chrome mismatch.

## Próximos pasos

1. User reviews the light/dark screenshots and handles pushes/PRs; address feedback after that.
2. If requested, review refresh tokens, rate limiting and a database check in `/health`.
3. Backlog: CI for tests/lint/build and `create_all()` vs full migrations.
4. Visual fidelity from the generated target remains unverified: no target image was produced and the inspecting model cannot view pixels.
