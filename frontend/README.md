# Frontend

SPA de HelpDesk construida con React 19, TypeScript, Vite y Tailwind CSS v4.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run build` ejecuta `tsc -b && vite build`. No hay runner de tests configurado.

## Configuración

Copia `.env.example` a `.env` y ajusta la API si es necesario:

```bash
VITE_API_URL=http://localhost:5000/api
```

El token JWT se guarda en `localStorage` bajo la clave `token` y `AuthProvider` lo valida contra `/api/auth/me` al arrancar.

## Estructura

- `src/api.ts`: cliente axios tipado y `getApiError` (incluye errores `422` por campo).
- `src/auth/`: `AuthContext`, `AuthProvider` y `useAuth`.
- `src/components/`: formularios, listado, detalle, navbar y 404.
- `src/types.ts`: tipos de usuario, ticket y comentario.
- `src/ticket-meta.ts`: opciones y clases de estado/prioridad.
- `src/index.css`: Tailwind v4 y clases semánticas (`card`, `input`, `btn`, `alert`, `badge`).

Rutas: `/login`, `/register`, `/`, `/ticket/:id` y comodín para 404. `PrivateRoute` y `PublicOnlyRoute` esperan a que termine la carga del usuario antes de redirigir.
