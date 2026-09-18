import { test, expect } from '@playwright/test';
import { gotoStory, loadStories } from './_support';

/**
 * Visual-regression net (C8): one screenshot per story, compared against the
 * container-pinned baseline. Tolerance-based (config `maxDiffPixelRatio`), per
 * roadmap O5. Baselines live under `playwright/__screenshots__/` and are only
 * ever generated inside the CI Playwright container — see the workflow.
 */
const stories = loadStories();

test.describe('visual regression', () => {
  for (const story of stories) {
    test(story.id, async ({ page }) => {
      await gotoStory(page, story.id);
      await expect(page).toHaveScreenshot(`${story.id}.png`, { fullPage: true });
    });
  }
});
