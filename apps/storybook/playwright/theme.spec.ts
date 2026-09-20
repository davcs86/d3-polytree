import { test, expect } from '@playwright/test';
import { gotoStory, loadStories } from './_support';

/**
 * C13 theming VR: the highest-chrome story (the Editor — palette, panels,
 * selection) captured in dark mode and in forced-colors, exercising both dark
 * paths. These are NEW baselines (auto-seeded on first container run); the
 * existing light baselines are unaffected because the default `auto` theme +
 * omitted `colorScheme` leave rendering in light (see vr.spec.ts / _support).
 */
const editor = loadStories().find((s) => s.title === 'Components/Editor');

test.describe('theming', () => {
  test.skip(!editor, 'Editor story not found');

  // Dark via the OS media path (prefers-color-scheme).
  test('editor · dark (media)', async ({ page }) => {
    await gotoStory(page, editor!.id, { colorScheme: 'dark' });
    await expect(page).toHaveScreenshot('theme-editor-dark-media.png', { fullPage: true });
  });

  // Dark via the explicit [data-pfd-theme] attribute path (proves the override
  // wins the cascade independently of the OS scheme).
  test('editor · dark (attribute)', async ({ page }) => {
    await gotoStory(page, editor!.id);
    await page.evaluate(() => document.documentElement.setAttribute('data-pfd-theme', 'dark'));
    await expect(page).toHaveScreenshot('theme-editor-dark-attr.png', { fullPage: true });
  });

  // Forced-colors (high contrast): selection/focus map to system colours.
  test('editor · forced-colors', async ({ page }) => {
    await gotoStory(page, editor!.id, { forcedColors: 'active' });
    await expect(page).toHaveScreenshot('theme-editor-forced-colors.png', { fullPage: true });
  });
});
