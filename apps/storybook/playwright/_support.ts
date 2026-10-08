import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

/** A single Storybook story entry from the static build's `index.json`. */
export interface StoryEntry {
  id: string;
  title: string;
  name: string;
  tags: string[];
}

interface StorybookIndex {
  v: number;
  entries: Record<
    string,
    { type: string; id: string; title: string; name: string; tags?: string[] }
  >;
}

/** Stories tagged with this are fixtures for dedicated specs, not VR/a11y subjects. */
export const HARNESS_TAG = 'harness-only';

/**
 * Enumerate every renderable story from the built `storybook-static/index.json`.
 *
 * Read synchronously at collection time so each story becomes its own test. The
 * static build must exist first (`pnpm build-storybook`); a missing index is a
 * hard error rather than an empty, silently-passing suite. Stories tagged
 * {@link HARNESS_TAG} are excluded unless `includeHarness` is set, so the VR and a11y
 * sweeps never screenshot or axe-scan the large perf/culling fixtures.
 */
export function loadStories(opts: { includeHarness?: boolean } = {}): StoryEntry[] {
  const indexPath = join(__dirname, '..', 'storybook-static', 'index.json');
  let raw: string;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch {
    throw new Error(
      `Storybook index not found at ${indexPath}. Run \`pnpm build-storybook\` before the e2e net.`
    );
  }
  const index = JSON.parse(raw) as StorybookIndex;
  return Object.values(index.entries)
    .filter((e) => e.type === 'story')
    .filter((e) => opts.includeHarness || !(e.tags ?? []).includes(HARNESS_TAG))
    .map((e) => ({ id: e.id, title: e.title, name: e.name, tags: e.tags ?? [] }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Story args selectable per load via the iframe URL (`&args=key:value;key:value`). */
export type StoryArgs = Record<string, string | number | boolean>;

/**
 * The URL of a story rendered in isolation (no Storybook chrome). `args` must be declared in
 * the story's `argTypes`; booleans use Storybook's `!true`/`!false` URL encoding.
 */
export function iframeUrl(id: string, args?: StoryArgs): string {
  const base = `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`;
  const entries = Object.entries(args ?? {});
  if (entries.length === 0) return base;
  const encoded = entries
    .map(([k, v]) => `${k}:${typeof v === 'boolean' ? (v ? '!true' : '!false') : String(v)}`)
    .join(';');
  return `${base}&args=${encoded}`;
}

/**
 * Navigate to a story and wait until it is visually settled and deterministic:
 * the root has rendered, web fonts are resolved, and every CSS transition /
 * animation is neutralised. Returns once the frame is safe to snapshot or audit.
 */
export async function gotoStory(
  page: Page,
  id: string,
  media: {
    colorScheme?: 'light' | 'dark';
    forcedColors?: 'none' | 'active';
    /** Defaults to 'reduce'; G1b needs 'no-preference' so zoom tweens actually run. */
    reducedMotion?: 'reduce' | 'no-preference';
  } = {},
  args?: StoryArgs
): Promise<void> {
  // Merge with the always-on reducedMotion; omitted keys are left unchanged, so
  // existing light baselines are unaffected when colorScheme/forcedColors are omitted.
  await page.emulateMedia({ reducedMotion: 'reduce', ...media });
  await page.goto(iframeUrl(id, args), { waitUntil: 'networkidle' });
  // Kill transitions/animations so a snapshot never catches an in-flight frame.
  await page.addStyleTag({
    content:
      '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}'
  });
  const root = page.locator('#storybook-root');
  await root.waitFor({ state: 'attached' });
  // The components mount a tick after render() returns (async importDiagram);
  // wait for actual content rather than a fixed sleep.
  await page.waitForFunction(() => {
    const el = document.querySelector('#storybook-root');
    return !!el && el.children.length > 0;
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  // A short, bounded settle for any remaining layout/raf work.
  await page.waitForTimeout(250);
}
