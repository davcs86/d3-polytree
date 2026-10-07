import { expect, test } from '@playwright/test';
import { HARNESS_TAG, iframeUrl, loadStories } from './_support';

/**
 * Guards the `harness-only` story filter (C10): fixture stories for the culling and
 * perf specs must never reach the VR/a11y sweeps (`vr.spec.ts`, `a11y.spec.ts`), which
 * call `loadStories()` with no arguments. Deterministic and screenshot-free, so it is
 * safe in the seed-missing and compare passes alike.
 */
test.describe('loadStories harness filter', () => {
  test('the default list excludes harness-only stories', () => {
    const tagged = loadStories().filter((s) => s.tags.includes(HARNESS_TAG));
    expect(tagged).toEqual([]);
  });

  test('includeHarness is a superset of the default list', () => {
    const base = loadStories().map((s) => s.id);
    const all = loadStories({ includeHarness: true }).map((s) => s.id);
    expect(all.length).toBeGreaterThanOrEqual(base.length);
    for (const id of base) expect(all).toContain(id);
  });

  test('the existing interaction harness stays in the default list', () => {
    // It is NOT harness-only: it keeps its VR/a11y coverage.
    const titles = loadStories().map((s) => s.title);
    expect(titles).toContain('Tests/Interaction Harness');
  });

  test('the culling and perf harness stories are harness-only', () => {
    const all = loadStories({ includeHarness: true });
    const defaults = loadStories().map((s) => s.title);
    for (const title of ['Tests/Culling Harness', 'Tests/Perf Harness']) {
      const entry = all.find((s) => s.title === title);
      expect(entry, `${title} missing from the build`).toBeTruthy();
      expect(entry!.tags).toContain(HARNESS_TAG);
      expect(defaults).not.toContain(title);
    }
  });

  test('iframeUrl encodes story args (booleans as !true/!false)', () => {
    expect(iframeUrl('x--y')).toBe('/iframe.html?id=x--y&viewMode=story');
    expect(iframeUrl('x--y', { culling: false, viewer: 'editor' })).toBe(
      '/iframe.html?id=x--y&viewMode=story&args=culling:!false;viewer:editor'
    );
  });
});
