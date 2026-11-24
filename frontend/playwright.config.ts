import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const apiURL = 'http://127.0.0.1:5180';
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 4 : 8,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run backend',
      url: `${apiURL}/swagger/v1/swagger.json`,
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'npm run vite',
      url: baseURL,
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});
