import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      name: "API",
      command: "venv/bin/gunicorn --bind 127.0.0.1:5001 wsgi:app",
      cwd: "../backend",
      url: "http://127.0.0.1:5001/health",
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
      env: {
        APP_ENV: "development",
        DATABASE_URL: "sqlite:////tmp/opencode/helpdesk-e2e.db",
        SECRET_KEY: "e2e-flask-secret-key-longer-than-32-bytes",
        JWT_SECRET_KEY: "e2e-jwt-secret-key-longer-than-32-bytes",
        LOG_LEVEL: "WARNING",
      },
    },
    {
      name: "Frontend",
      command: "npm run dev -- --port 5174 --host 127.0.0.1",
      cwd: ".",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
      env: {
        VITE_API_URL: "http://127.0.0.1:5001/api",
      },
    },
  ],
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
