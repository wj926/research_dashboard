import { defineConfig } from '@playwright/test';

// Smoke tests use a dedicated port (not 3000) because pm2 typically serves
// the production build on port 3000 locally — the production build has no
// PLAYWRIGHT_TEST escape hatch compiled in, so tests would hit the auth wall.
const TEST_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  // Turbopack's first-hit compile time means 32+ parallel workers routinely
  // time out their initial navigation in dev. Cap the worker pool so specs
  // run reliably end-to-end without relying on a pre-warmed server.
  workers: 2,
  reporter: 'list',
  use: { baseURL: `http://localhost:${TEST_PORT}` },
  webServer: {
    command: `pnpm dev --port ${TEST_PORT}`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // Middleware & getCurrentUserLogin() bypass auth when this is set.
      PLAYWRIGHT_TEST: 'true',
    },
  },
});
