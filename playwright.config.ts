import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const authFile = process.env.AUTH_FILE ?? 'tests/.auth/user.json';

export default defineConfig({
  testDir: './tests',

  /* Run global setup before tests */
  globalSetup: require.resolve('./tests/global.setup.ts'),

  /* Shared settings */
  use: {
    baseURL: 'https://qa-assignment-ric.betty.app',

    // Use authenticated session
    storageState: authFile,

    // Better stability for UI apps
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },

  /* Test runner behavior */
  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  retries: process.env.CI ? 2 : 0,

  /* Parallel execution */
  fullyParallel: true,

  workers: process.env.CI ? 2 : undefined,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  /* Browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});