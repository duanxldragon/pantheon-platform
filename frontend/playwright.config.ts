import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.PLAYWRIGHT_PORT || process.env.PORT || 5173);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  webServer: {
    command: 'npm run build && node ./tests/static-server.cjs',
    port: frontendPort,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
