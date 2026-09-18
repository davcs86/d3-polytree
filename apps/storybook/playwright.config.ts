import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the C8 net: visual-regression + a11y + interaction over
 * the static Storybook build.
 *
 * Rendering is pinned to a single environment on purpose. Baselines are byte-
 * unstable across font stacks, so they are generated and compared *only* inside
 * the `mcr.microsoft.com/playwright:v1.56.1-noble` container (CI), never on a
 * developer's host — see `.github/workflows/visual-regression.yml`. The
 * `@playwright/test` version here is pinned to 1.56.1 to match that image tag.
 */

const PORT = Number(process.env.SB_PORT ?? 6008);
const HOST = '127.0.0.1';

export default defineConfig({
  testDir: './playwright',
  // One committed baseline tree, keyed by story id + platform + project.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }], ['list']] : [['list']],
  expect: {
    // Tolerance-based, per roadmap O5 — never byte-for-byte. A handful of
    // anti-aliased edge pixels must not fail the gate; a real regression will
    // move far more than 2% of the frame.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css'
    }
  },
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    // A fixed viewport so screenshots are reproducible regardless of runner.
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `http-server storybook-static --port ${PORT} -a ${HOST} --silent -c-1`,
    url: `http://${HOST}:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
