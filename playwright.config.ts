import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}-snapshots/{arg}{-projectName}{ext}',
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173/vite-first/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/vite-first/',
    reuseExistingServer: !process.env.CI,
  },
});
