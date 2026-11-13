# HelpDesk

Sistema multiusuario de tickets con backend **Flask + SQLAlchemy + JWT** y frontend **React 19 + TypeScript + Vite + Tailwind CSS**.

## Funcionalidad

- Registro y login con JWT; el registro público siempre crea usuarios `client`.
- Roles `admin`, `agent` y `client` con permisos diferenciados.
- Tickets con estado, prioridad, filtros y paginación.
- Comentarios por ticket.
- Frontend SPA con contexto de autenticación, errores de validación y ruta 404.
- Migraciones con Flask-Migrate y despliegue con Docker Compose + PostgreSQL + Gunicorn.

## Estructura

```text
backend/            API Flask, modelos, servicios, migraciones y tests
frontend/           SPA React + Vite + Tailwind
docker-compose.yml  PostgreSQL + backend con Gunicorn
AGENTS.md           Instrucciones para asistentes y agentes del repositorio
```

## Requisitos

- Python 3.12
- Node.js 20+ (probado con Node 22)
- Docker Compose (opcional, para el despliegue con PostgreSQL)

## Backend local

```bash
source backend/venv/bin/activate
cp backend/.env.example backend/.env
pytest
cd backend && flask --app app run --debug --port 5000
```

La configuración de desarrollo crea las tablas automáticamente en `backend/instance/helpdesk.db`. Para generar o aplicar migraciones de esquema usa los comandos de la sección [Migraciones](#migraciones).

## Frontend local

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

El cliente HTTP usa `VITE_API_URL` (por defecto `http://localhost:5000/api`).

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

El compose levanta PostgreSQL 16 y el backend con Gunicorn en `http://localhost:5000`. Antes de arrancar Gunicorn aplica `flask db upgrade` automáticamente. El frontend puede ejecutarse en local con `npm run dev`; `CORS_ORIGINS` permite `http://localhost:5173` por defecto.

## Migraciones

El esquema versionado vive en `backend/migrations/versions/` y la revisión inicial es `ea26a6ef442b`.

```bash
cd backend
flask --app app db upgrade
flask --app app db migrate -m "descripción del cambio"
flask --app app db downgrade
```

En desarrollo y tests `CREATE_TABLES=True` ejecuta `db.create_all()`. En producción (`APP_ENV=production`) no se crean tablas automáticamente: aplica `flask db upgrade`. Si una base de desarrollo ya tenía tablas creadas por `create_all()`, ejecuta antes `flask db stamp head`.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Registro (siempre rol `client`) |
| POST | `/api/auth/login` | Login y obtención del JWT |
| GET | `/api/auth/me` | Usuario autenticado |
| GET/POST | `/api/tickets/` | Listado paginado / creación |
| GET/PATCH | `/api/tickets/<id>` | Detalle / actualización |
| GET/POST | `/api/tickets/<id>/comments` | Listado / creación de comentarios |
| GET | `/health` | Healthcheck |

Los errores de validación devuelven `422` con `{"errors": {...}}`; el resto de errores usan `{"error": "..."}` (`400`, `401`, `403`, `404`, `409`, `500`).

## Tests y verificación

```bash
source backend/venv/bin/activate
pytest
pytest --cov=app --cov-report=term-missing

cd frontend
npm run lint
npm run build
```

Actualmente pasan **36 tests** con ~97 % de cobertura en el backend. El frontend no tiene runner de tests; su verificación es lint + build.
