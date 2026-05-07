import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  /* Global timeout for tests - 3 minutes to accommodate Gemini API RAG latency */
  timeout: 180 * 1000,
  
  expect: {
    /* Timeout for individual assertions - 30 seconds */
    timeout: 30 * 1000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'on',
    video: 'off',
    /* Maximum time each action (e.g. click, fill) can take */
    actionTimeout: 30 * 1000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
