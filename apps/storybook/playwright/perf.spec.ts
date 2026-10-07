import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { gotoStory, loadStories } from './_support';

/**
 * C10 perf lane (PERF=1 only — see `playwright.config.ts`; the required `chromium` project
 * never collects this file). PR1 measures the baseline ("culling off") arm and asserts no
 * timing: there is no budget until PR2 derives one from these numbers (design §7/§11).
 *
 * Metrics: CDP `Performance.getMetrics` deltas (Task/Script/Layout/RecalcStyle duration) plus
 * in-page rAF frame deltas, over a scripted *real-mouse* pan that goes through the real
 * d3-zoom handler. NOTE: `TaskDuration` is main-thread only — raster/compositor time is NOT
 * included. Never use `toHaveScreenshot` here (the project name is part of the snapshot path).
 */

type Zoomish = { setInitialZoom(tx: number, ty: number, k: number, duration?: number): void };
type Viewerish = { get<T>(name: string): T };

declare global {
  interface Window {
    __perfFrames?: number[];
    __perfStop?: () => void;
  }
}

const METRICS = [
  'TaskDuration',
  'ScriptDuration',
  'LayoutDuration',
  'RecalcStyleDuration'
] as const;
type MetricName = (typeof METRICS)[number];

interface RunResult {
  frames: number;
  frameMs: { p50: number; p95: number; max: number };
  metricsMs: Record<MetricName, number>;
  longPanMs: number;
}

const q = (xs: number[], p: number): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};

async function metrics(cdp: CDPSession): Promise<Record<string, number>> {
  const { metrics: ms } = (await cdp.send('Performance.getMetrics')) as {
    metrics: { name: string; value: number }[];
  };
  return Object.fromEntries(ms.map((m) => [m.name, m.value]));
}

/**
 * Where to start the pan: the harness viewport centre. There is deliberately no "pure
 * background" requirement — with `pointer-events: all` on the svg, a long-range link's
 * outline rect (its first→last waypoint bbox) covers most of the canvas, so every point is an
 * element hit (measured: 100% link hits). d3-zoom still receives the bubbled mousedown, which
 * is exactly the case the culling work will improve; `drawingTransform` proves the pan engaged.
 */
async function panStartPoint(page: Page): Promise<{ x: number; y: number }> {
  const box = await page.locator('[data-testid="harness-host"]').boundingBox();
  expect(box, 'harness host not found').toBeTruthy();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

/** The drawing layer's `transform` attribute, as written by `Zoom.setZoom` (`translate(..) scale(..)`). */
async function drawingTransform(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
    const canvas = v.get<{ getDrawingLayer(): { attr(n: string): string | null } }>('canvas');
    return canvas.getDrawingLayer().attr('transform');
  });
}

async function panOnce(
  page: Page,
  cdp: CDPSession,
  start: { x: number; y: number }
): Promise<RunResult> {
  await page.evaluate(() => {
    window.__perfFrames = [];
    let last = performance.now();
    let on = true;
    const tick = (t: number): void => {
      window.__perfFrames!.push(t - last);
      last = t;
      if (on) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__perfStop = () => {
      on = false;
    };
  });
  const before = await metrics(cdp);
  const transformBefore = await drawingTransform(page);
  const t0 = Date.now();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let i = 1; i <= 60; i++) {
    await page.mouse.move(start.x - i * 8, start.y - i * 3, { steps: 1 });
  }
  await page.mouse.up();
  const longPanMs = Date.now() - t0;
  expect(await drawingTransform(page), 'the pan did not move the drawing layer').not.toBe(
    transformBefore
  );
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  );
  const after = await metrics(cdp);
  const frames = await page.evaluate(() => {
    window.__perfStop?.();
    return window.__perfFrames!.slice(1);
  });
  const metricsMs = Object.fromEntries(
    METRICS.map((n) => [n, ((after[n] ?? 0) - (before[n] ?? 0)) * 1000])
  ) as Record<MetricName, number>;
  return {
    frames: frames.length,
    frameMs: { p50: q(frames, 0.5), p95: q(frames, 0.95), max: Math.max(0, ...frames) },
    metricsMs,
    longPanMs
  };
}

test.describe('C10 perf baseline (culling off)', () => {
  test('pan across the 23k-element fixture', async ({ page, context }, testInfo) => {
    const story = loadStories({ includeHarness: true }).find(
      (s) => s.title === 'Tests/Perf Harness'
    );
    expect(story, 'Tests/Perf Harness missing from the build').toBeTruthy();

    const bootStart = Date.now();
    await gotoStory(page, story!.id, {}, { culling: false, viewer: 'interactive' });
    await page.evaluate(
      () => (window as unknown as { __polytreePerfReady: Promise<void> }).__polytreePerfReady
    );
    const bootMs = Date.now() - bootStart;

    const drawn = await page.locator('g[element-id]').count();
    expect(drawn, 'fixture failed to boot').toBeGreaterThanOrEqual(20_000);

    // Park the viewport mid-world at scale 1, through the real zoom handler.
    await page.evaluate(() => {
      const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
      v.get<Zoomish>('zoom').setInitialZoom(-5000, -3000, 1);
    });
    await page.waitForTimeout(300);

    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const start = await panStartPoint(page);

    const runs: RunResult[] = [];
    for (let i = 0; i < 5; i++) {
      runs.push(await panOnce(page, cdp, start));
      // re-park so every run covers the same world region
      await page.evaluate(() => {
        const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
        v.get<Zoomish>('zoom').setInitialZoom(-5000, -3000, 1);
      });
      await page.waitForTimeout(200);
    }

    const p95s = runs.map((r) => r.frameMs.p95);
    const summary = {
      arm: { culling: false, viewer: 'interactive' },
      drawnElements: drawn,
      bootMs,
      runs,
      frameP95: { median: q(p95s, 0.5), min: Math.min(...p95s), max: Math.max(...p95s) },
      note: 'TaskDuration is main-thread only; raster/compositor time is excluded.'
    };
    await testInfo.attach('perf.json', {
      body: JSON.stringify(summary, null, 2),
      contentType: 'application/json'
    });
    console.log(
      `[perf] drawn=${drawn} boot=${bootMs}ms frame p95 median=${summary.frameP95.median.toFixed(1)}ms ` +
        `(min ${summary.frameP95.min.toFixed(1)} / max ${summary.frameP95.max.toFixed(1)}); ` +
        `task/pan=${q(
          runs.map((r) => r.metricsMs.TaskDuration),
          0.5
        ).toFixed(0)}ms`
    );

    // Sanity only — no timing assertion in PR1 (no budget exists yet).
    for (const r of runs) {
      expect(r.frames).toBeGreaterThanOrEqual(10);
      expect(r.metricsMs.TaskDuration).toBeGreaterThan(0);
    }
  });
});
