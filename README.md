# HelpDesk

Sistema multiusuario de tickets con backend Flask + SQLite/JWT y frontend React 19 + TypeScript + Vite.

## Estructura

- `backend/`: API Flask, autenticación JWT, modelos y tests con pytest.
- `frontend/`: SPA React + Vite que consume la API.
- `AGENTS.md`: instrucciones para asistentes y agentes del repositorio.

## Backend

```bash
source backend/venv/bin/activate
pytest
cd backend && flask --app app run --debug --port 5000
```

Copia `backend/.env.example` a `backend/.env` antes de arrancar. La base de datos de desarrollo se crea automáticamente en `backend/instance/helpdesk.db`.

Endpoints principales: `/api/auth` (registro, login, usuario actual) y `/api/tickets` (CRUD, filtros y comentarios). Roles disponibles: `admin`, `agent` y `client`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

La URL de la API se configura con `VITE_API_URL` en `frontend/.env` (por defecto `http://localhost:5000/api`).

## Verificación

```bash
pytest
cd frontend && npm run lint && npm run build
```
