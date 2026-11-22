import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3147';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    channel: process.env.SALPA_E2E_CHANNEL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3147',
    url: baseURL,
    reuseExistingServer: false,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
});
