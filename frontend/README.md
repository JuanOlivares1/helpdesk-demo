# Frontend

SPA de HelpDesk construida con React 19, TypeScript y Vite.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run build` ejecuta `tsc -b && vite build`. No hay runner de tests configurado.

## Configuración

El cliente HTTP está en `src/api.ts` y usa `VITE_API_URL` desde `.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

El token JWT se guarda en `localStorage` bajo la clave `token`.
