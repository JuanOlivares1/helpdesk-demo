/// <reference types="vite/client" />
// Desactivar warning de variables de entorno
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
