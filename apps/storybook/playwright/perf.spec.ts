import { expect, test, type BrowserContext, type CDPSession, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/** Boot an arm of the Perf Harness and return the CDP session + drawn-element count. */
async function bootArm(
  page: Page,
  args: { culling: boolean; lod?: boolean; viewer: 'interactive' | 'editor'; nodes?: number }
): Promise<{ drawn: number; bootMs: number }> {
  const story = loadStories({ includeHarness: true }).find((s) => s.title === 'Tests/Perf Harness');
  expect(story, 'Tests/Perf Harness missing from the build').toBeTruthy();
  const t0 = Date.now();
  await gotoStory(page, story!.id, {}, args);
  await page.evaluate(
    () => (window as unknown as { __polytreePerfReady: Promise<void> }).__polytreePerfReady
  );
  const bootMs = Date.now() - t0;
  const drawn = await page.locator('g[element-id]').count();
  return { drawn, bootMs };
}

async function parkViewport(page: Page): Promise<void> {
  await page.evaluate(() => {
    const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
    v.get<Zoomish>('zoom').setInitialZoom(-5000, -3000, 1);
  });
  await page.waitForTimeout(250);
  // With culling on, parking triggers a hide drain; measure only once it has settled.
  await page.waitForFunction(
    () =>
      document.querySelector('.pfdjs-container')?.getAttribute('data-pfd-culling-idle') !== 'false',
    undefined,
    { timeout: 120_000 }
  );
}

/** Median-of-runs summary of `panOnce` for the arm currently loaded. */
async function measurePans(page: Page, context: BrowserContext, runs: number) {
  await parkViewport(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const start = await panStartPoint(page);
  const out: RunResult[] = [];
  for (let i = 0; i < runs; i++) {
    out.push(await panOnce(page, cdp, start));
    await parkViewport(page);
  }
  const p95s = out.map((r) => r.frameMs.p95);
  return {
    runs: out,
    frameP95Median: q(p95s, 0.5),
    frameP95Spread: Math.max(...p95s) - Math.min(...p95s),
    taskMsMedian: q(
      out.map((r) => r.metricsMs.TaskDuration),
      0.5
    )
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

/**
 * The culling-ON arm over the same fixture and gesture (C10 PR2). The pan p95 is asserted against
 * `perf-budget.json` (blocking). Separation safeguard (design §7: off median p95 − on max p95 ≥
 * 2 × on-arm spread) held on the pinned run: 66.7 − 16.8 = 49.9 ≫ 2 × 0.1.
 */
test.describe('C10 perf (culling on)', () => {
  test('pan across the 23k-element fixture', async ({ page, context }, testInfo) => {
    const { drawn, bootMs } = await bootArm(page, { culling: true, viewer: 'interactive' });
    expect(drawn, 'fixture failed to boot').toBeGreaterThanOrEqual(20_000);
    const m = await measurePans(page, context, 5);
    const p95s = m.runs.map((r) => r.frameMs.p95);
    const stats = await page.evaluate(() =>
      (
        window as unknown as {
          __polytreePerfViewer: {
            get<T>(n: string): T;
          };
        }
      ).__polytreePerfViewer
        .get<{ inspect(): { stats: { passes: number; maxHides: number }; active: boolean } }>(
          'culling'
        )
        .inspect()
    );
    await testInfo.attach('perf-on.json', {
      body: JSON.stringify(
        { arm: { culling: true, viewer: 'interactive' }, drawn, bootMs, runs: m.runs, stats },
        null,
        2
      ),
      contentType: 'application/json'
    });
    console.log(
      `[perf] arm=on drawn=${drawn} boot=${bootMs}ms frame p95 median=${m.frameP95Median.toFixed(1)}ms ` +
        `(min ${Math.min(...p95s).toFixed(1)} / max ${Math.max(...p95s).toFixed(1)}, spread ${m.frameP95Spread.toFixed(1)}); ` +
        `task/pan=${m.taskMsMedian.toFixed(0)}ms; culling active=${stats.active} passes=${stats.stats.passes} maxHides=${stats.stats.maxHides}`
    );
    expect(stats.active).toBe(true);
    for (const r of m.runs) expect(r.frames).toBeGreaterThanOrEqual(10);

    // BLOCKING ceiling (user decision: blocking from day one). Derived in perf-budget.json with
    // provenance; the culling-OFF arm's p95 (≈ 67–117 ms) is far above it by construction.
    // Note: TaskDuration/frames are main-thread only — raster/compositor time is not included.
    const { budgetMs } = JSON.parse(readFileSync(join(__dirname, 'perf-budget.json'), 'utf8')) as {
      budgetMs: number;
    };
    expect(Math.max(...p95s), `ON-arm pan p95 over budget (${budgetMs} ms)`).toBeLessThanOrEqual(
      budgetMs
    );
  });
});

/** Optional budgets for the LOD arms; `null` = record-only until a pinned derivation sets them. */
interface LodBudgets {
  fitAllPan: { budgetMs: number | null };
  lodCrossing: { budgetMs: number | null };
}
const lodBudgets = (): LodBudgets =>
  JSON.parse(readFileSync(join(__dirname, 'perf-budget.json'), 'utf8')) as LodBudgets;

/** Park at fit-all (scale 0.1) and wait until the arm has settled (LOD `on` when enabled). */
async function parkFitAll(page: Page, lod: boolean): Promise<void> {
  await page.evaluate(() => {
    const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
    v.get<Zoomish>('zoom').setInitialZoom(-50, -30, 0.1);
  });
  await page.waitForTimeout(250);
  await page.waitForFunction(
    (wantLod) => {
      const c = document.querySelector('.pfdjs-container');
      if (c?.getAttribute('data-pfd-culling-idle') === 'false') return false;
      return wantLod ? c?.getAttribute('data-pfd-lod') === 'on' : true;
    },
    lod,
    { timeout: 120_000 }
  );
}

async function measureFitAll(page: Page, context: BrowserContext, lod: boolean, runs: number) {
  await parkFitAll(page, lod);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const start = await panStartPoint(page);
  const out: RunResult[] = [];
  for (let i = 0; i < runs; i++) {
    out.push(await panOnce(page, cdp, start));
    await parkFitAll(page, lod);
  }
  const p95s = out.map((r) => r.frameMs.p95);
  return {
    runs: out,
    median: q(p95s, 0.5),
    min: Math.min(...p95s),
    max: Math.max(...p95s),
    spread: Math.max(...p95s) - Math.min(...p95s)
  };
}

/**
 * Zoom-out LOD (C10 amendment A2): settled fit-all pan, LOD ON vs the same-build `lod:false`
 * baseline, and the enter/exit crossing cost. Budgets live in `perf-budget.json` (`fitAllPan`,
 * `lodCrossing`) and are `null` (record-only) until set from ≥ 5 pinned runs.
 */
test.describe('C10 perf (zoom-out LOD)', () => {
  test.setTimeout(480_000);

  test('fit-all pan: LOD on vs LOD off', async ({ page, context }, testInfo) => {
    const on = await bootArm(page, { culling: true, lod: true, viewer: 'interactive' });
    expect(on.drawn, 'fixture failed to boot').toBeGreaterThanOrEqual(20_000);
    const lodArm = await measureFitAll(page, context, true, 5);
    const state = await page.evaluate(() => {
      const c = document.querySelector('.pfdjs-container')!;
      return { lod: c.getAttribute('data-pfd-lod') };
    });
    expect(state.lod, 'LOD is on at fit-all').toBe('on');

    await bootArm(page, { culling: true, lod: false, viewer: 'interactive' });
    const base = await measureFitAll(page, context, false, 5);

    const separation = base.median - lodArm.max;
    console.log(
      `[perf] arm=lod fit-all p95 median=${lodArm.median.toFixed(1)}ms (min ${lodArm.min.toFixed(1)} / max ${lodArm.max.toFixed(1)}, spread ${lodArm.spread.toFixed(1)}); ` +
        `task/pan=${q(
          lodArm.runs.map((r) => r.metricsMs.TaskDuration),
          0.5
        ).toFixed(0)}ms`
    );
    console.log(
      `[perf] arm=nolod fit-all p95 median=${base.median.toFixed(1)}ms (min ${base.min.toFixed(1)} / max ${base.max.toFixed(1)}, spread ${base.spread.toFixed(1)}); ` +
        `task/pan=${q(
          base.runs.map((r) => r.metricsMs.TaskDuration),
          0.5
        ).toFixed(0)}ms`
    );
    console.log(
      `[perf] fit-all separation=${separation.toFixed(1)}ms safeguard=${(2 * lodArm.spread).toFixed(1)}ms ratio=${(base.median / Math.max(lodArm.median, 1)).toFixed(2)}x`
    );
    await testInfo.attach('perf-fitall.json', {
      body: JSON.stringify({ lod: lodArm, nolod: base, separation }, null, 2),
      contentType: 'application/json'
    });
    for (const r of [...lodArm.runs, ...base.runs]) expect(r.frames).toBeGreaterThanOrEqual(10);

    const { budgetMs } = lodBudgets().fitAllPan;
    if (budgetMs !== null) {
      expect(lodArm.max, `LOD fit-all pan p95 over budget (${budgetMs} ms)`).toBeLessThanOrEqual(
        budgetMs
      );
      expect(separation, 'LOD vs no-LOD separation safeguard').toBeGreaterThanOrEqual(
        2 * lodArm.spread
      );
    }
  });

  test('crossing: enter drain and synchronous exit (record, then ceiling)', async ({
    page
  }, testInfo) => {
    await bootArm(page, { culling: true, lod: true, viewer: 'interactive' });
    await parkViewport(page);
    const observe = () =>
      page.evaluate(() => {
        const w = window as unknown as {
          __long: number[];
          __frames: number[];
          __poll: boolean;
        };
        w.__long = [];
        w.__frames = [];
        w.__poll = true;
        new PerformanceObserver((l) =>
          l.getEntries().forEach((e) => w.__long.push(e.duration))
        ).observe({ entryTypes: ['longtask'] });
        let last = performance.now();
        const tick = (t: number): void => {
          w.__frames.push(t - last);
          last = t;
          if (w.__poll) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    const phase = async (tx: number, ty: number, k: number, wantLod: boolean) => {
      await page.evaluate(() => {
        const w = window as unknown as { __long: number[]; __frames: number[] };
        w.__long.length = 0;
        w.__frames.length = 0;
      });
      const callMs = await page.evaluate(
        ([x, y, s]) => {
          const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
          const t0 = performance.now();
          v.get<Zoomish>('zoom').setInitialZoom(x, y, s);
          return performance.now() - t0;
        },
        [tx, ty, k] as const
      );
      await page.waitForFunction(
        (want) => {
          const c = document.querySelector('.pfdjs-container');
          if (c?.getAttribute('data-pfd-culling-idle') === 'false') return false;
          return want
            ? c?.getAttribute('data-pfd-lod') === 'on'
            : c?.getAttribute('data-pfd-lod') === 'off';
        },
        wantLod,
        { timeout: 120_000 }
      );
      await page.waitForTimeout(300);
      return page.evaluate((call) => {
        const w = window as unknown as { __long: number[]; __frames: number[] };
        return {
          callMs: call,
          maxLongTaskMs: Math.max(0, ...w.__long),
          maxFrameMs: Math.max(0, ...w.__frames.slice(1))
        };
      }, callMs);
    };
    await observe();
    const enter = await phase(-50, -30, 0.1, true);
    const exit = await phase(-5000, -3000, 1, false);
    console.log(
      `[perf] crossing enter longtask=${enter.maxLongTaskMs.toFixed(0)}ms maxFrame=${enter.maxFrameMs.toFixed(0)}ms call=${enter.callMs.toFixed(0)}ms; ` +
        `exit longtask=${exit.maxLongTaskMs.toFixed(0)}ms maxFrame=${exit.maxFrameMs.toFixed(0)}ms call=${exit.callMs.toFixed(0)}ms`
    );
    await testInfo.attach('perf-crossing.json', {
      body: JSON.stringify({ enter, exit }, null, 2),
      contentType: 'application/json'
    });
    const { budgetMs } = lodBudgets().lodCrossing;
    if (budgetMs !== null) {
      expect(
        Math.max(enter.maxFrameMs, exit.maxFrameMs),
        `LOD crossing worst frame over budget (${budgetMs} ms)`
      ).toBeLessThanOrEqual(budgetMs);
    }
  });
});

/**
 * Trigger measurements for design §9 (what gets promoted beyond the default build) and the
 * `CULL_MIN_ELEMENTS` sweep. Numbers are attached as JSON and summarized in `measurements.md`;
 * nothing here asserts a threshold in PR1.
 */
test.describe('C10 trigger measurements (PR1)', () => {
  test('in-page microbenchmarks: scan, churn, jitter (no DOM)', async ({ page }, testInfo) => {
    await page.goto('about:blank');
    const result = await page.evaluate(() => {
      const mulberry = (seed: number) => () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const quant = (xs: number[], p: number) => {
        const s = [...xs].sort((a, b) => a - b);
        return s[Math.min(s.length - 1, Math.floor(p * s.length))];
      };

      // A flat structure-of-arrays index with the shipping seam's shape: scan(rect, visit).
      class Flat {
        n = 0;
        x0 = new Float64Array(1024);
        y0 = new Float64Array(1024);
        x1 = new Float64Array(1024);
        y1 = new Float64Array(1024);
        live = new Uint8Array(1024);
        culled = new Uint8Array(1024);
        ids = new Map<string, number>();
        free: number[] = [];
        grow(): void {
          const cap = this.x0.length * 2;
          for (const k of ['x0', 'y0', 'x1', 'y1'] as const) {
            const a = new Float64Array(cap);
            a.set(this[k]);
            this[k] = a;
          }
          for (const k of ['live', 'culled'] as const) {
            const a = new Uint8Array(cap);
            a.set(this[k]);
            this[k] = a;
          }
        }
        upsert(id: string, a: number, b: number, c: number, d: number, reuse: boolean): number {
          let slot = this.ids.get(id);
          if (slot === undefined) {
            slot = reuse && this.free.length ? this.free.pop()! : this.n++;
            if (slot >= this.x0.length) this.grow();
            this.ids.set(id, slot);
          }
          this.x0[slot] = a;
          this.y0[slot] = b;
          this.x1[slot] = c;
          this.y1[slot] = d;
          this.live[slot] = 1;
          return slot;
        }
        remove(id: string, reuse: boolean): void {
          const slot = this.ids.get(id);
          if (slot === undefined) return;
          this.live[slot] = 0;
          this.ids.delete(id);
          if (reuse) this.free.push(slot);
        }
        scan(
          rx0: number,
          ry0: number,
          rx1: number,
          ry1: number,
          visit: (slot: number, inside: boolean) => void
        ): void {
          for (let i = 0; i < this.n; i++) {
            if (!this.live[i]) continue;
            visit(
              i,
              !(this.x1[i] < rx0 || this.x0[i] > rx1 || this.y1[i] < ry0 || this.y0[i] > ry1)
            );
          }
        }
      }

      const timeScan = (idx: Flat, batches = 40, per = 25) => {
        const samples: number[] = [];
        let sink = 0;
        for (let b = 0; b < batches; b++) {
          const t0 = performance.now();
          for (let k = 0; k < per; k++) {
            // a two-sided classification pass like the shipping rAF pass
            idx.scan(5000 + k, 3000, 6000 + k, 3700, (slot, inside) => {
              if (inside && idx.culled[slot]) sink++;
              else if (!inside && !idx.culled[slot]) sink--;
            });
          }
          samples.push((performance.now() - t0) / per);
        }
        return { p50: quant(samples, 0.5), p95: quant(samples, 0.95), sink };
      };

      // (1) scan over 23k slots
      const rnd = mulberry(1);
      const big = new Flat();
      for (let i = 0; i < 23_000; i++) {
        const x = rnd() * 16500;
        const y = rnd() * 10400;
        big.upsert('e' + i, x, y, x + 56 + rnd() * 200, y + 56 + rnd() * 200, false);
      }
      const scan23k = timeScan(big);

      // (3) churn: 10 cycles of "create 5k new distinct ids, delete the previous 5k"
      const churn = (reuse: boolean) => {
        const idx = new Flat();
        const r = mulberry(2);
        let prev: string[] = [];
        for (let cycle = 0; cycle < 10; cycle++) {
          const cur: string[] = [];
          for (let i = 0; i < 5000; i++) {
            const id = `c${cycle}_${i}`;
            const x = r() * 16500;
            const y = r() * 10400;
            idx.upsert(id, x, y, x + 100, y + 100, reuse);
            cur.push(id);
          }
          for (const id of prev) idx.remove(id, reuse);
          prev = cur;
        }
        const baseline = new Flat();
        const rb = mulberry(3);
        for (let i = 0; i < 5000; i++) {
          const x = rb() * 16500;
          const y = rb() * 10400;
          baseline.upsert('b' + i, x, y, x + 100, y + 100, false);
        }
        const a = timeScan(idx, 30, 25).p50;
        const b = timeScan(baseline, 30, 25).p50;
        return {
          slotsAllocated: idx.n,
          live: 5000,
          scanP50Ms: a,
          baselineScanP50Ms: b,
          ratio: a / b
        };
      };

      // (4) single-pad classifier jitter: viewport edge oscillating ±1px around an element boundary
      const jitter = () => {
        const toggles: number[] = [];
        const pad = 7;
        for (let e = 0; e < 200; e++) {
          const edge = 1000 + e * 3; // element left edge, world px
          let state = false; // culled(false=visible)
          let t = 0;
          for (let frame = 0; frame < 100; frame++) {
            const vx = frame % 2 === 0 ? -1 : 1; // jitter
            const viewportRight = edge - pad + vx; // jitters ±1px around the padded boundary
            const inside = edge <= viewportRight + pad; // visible iff within the padded viewport
            const hidden = !inside;
            if (hidden !== state) {
              t++;
              state = hidden;
            }
          }
          toggles.push(t);
        }
        return {
          maxToggles: Math.max(...toggles),
          meanToggles: toggles.reduce((a, b) => a + b, 0) / toggles.length
        };
      };

      return {
        scan23k,
        churnTombstone: churn(false),
        churnFreeList: churn(true),
        jitterSinglePad: jitter()
      };
    });
    await testInfo.attach('triggers-micro.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json'
    });
    console.log('[triggers] micro', JSON.stringify(result));
    expect(result.scan23k.p50).toBeGreaterThan(0);
  });

  test('bulk attribute write on the real 23k DOM (hide-all / show-all)', async ({
    page,
    context
  }, testInfo) => {
    const { drawn } = await bootArm(page, { culling: false, viewer: 'interactive' });
    expect(drawn).toBeGreaterThanOrEqual(20_000);
    await page.addStyleTag({
      content: '.pfdjs-container .element[data-pfd-transient] > :not(title):not(desc){display:none}'
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const frame = () =>
      page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      );
    const step = async (label: string, fn: () => Promise<void>) => {
      const a = await metrics(cdp);
      const t0 = Date.now();
      await fn();
      await frame();
      const b = await metrics(cdp);
      return {
        label,
        wallMs: Date.now() - t0,
        ...Object.fromEntries(METRICS.map((m) => [m, ((b[m] ?? 0) - (a[m] ?? 0)) * 1000]))
      };
    };
    const hideAll = await step('hide-all', () =>
      page.evaluate(() =>
        document
          .querySelectorAll('g.element')
          .forEach((g) => g.setAttribute('data-pfd-transient', 'culled'))
      )
    );
    const showAll = await step('show-all', () =>
      page.evaluate(() =>
        document
          .querySelectorAll('g.element')
          .forEach((g) => g.removeAttribute('data-pfd-transient'))
      )
    );
    const hideAgain = await step('hide-all (warm)', () =>
      page.evaluate(() =>
        document
          .querySelectorAll('g.element')
          .forEach((g) => g.setAttribute('data-pfd-transient', 'culled'))
      )
    );
    const result = { drawn, hideAll, showAll, hideAgain };
    await testInfo.attach('triggers-bulk-write.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json'
    });
    console.log('[triggers] bulk', JSON.stringify(result));
  });

  test('CULL_MIN_ELEMENTS sweep: unculled pan cost vs drawn-element count', async ({
    page,
    context
  }, testInfo) => {
    test.setTimeout(420_000);
    const rows: Record<string, unknown>[] = [];
    for (const nodes of [250, 500, 1000, 2000, 4000]) {
      const { drawn, bootMs } = await bootArm(page, {
        culling: false,
        viewer: 'interactive',
        nodes
      });
      // each preset keeps the viewport over populated world: re-park for the smaller worlds
      await page.evaluate(() => {
        const v = (window as unknown as { __polytreePerfViewer: Viewerish }).__polytreePerfViewer;
        v.get<Zoomish>('zoom').setInitialZoom(-500, -300, 1);
      });
      await page.waitForTimeout(250);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      const start = await panStartPoint(page);
      const runs: RunResult[] = [];
      for (let i = 0; i < 3; i++) runs.push(await panOnce(page, cdp, start));
      const p95s = runs.map((r) => r.frameMs.p95);
      rows.push({
        nodes,
        drawn,
        bootMs,
        frameP95Median: q(p95s, 0.5),
        taskMsMedian: q(
          runs.map((r) => r.metricsMs.TaskDuration),
          0.5
        )
      });
    }
    await testInfo.attach('triggers-cull-min-sweep.json', {
      body: JSON.stringify(rows, null, 2),
      contentType: 'application/json'
    });
    console.log('[triggers] sweep', JSON.stringify(rows));
    expect(rows.length).toBe(5);
  });

  test('Editor vs interactive arm: per-element overhead of a pan', async ({
    page,
    context
  }, testInfo) => {
    test.setTimeout(420_000);
    const out: Record<string, unknown> = {};
    for (const viewer of ['interactive', 'editor'] as const) {
      try {
        const { drawn, bootMs } = await bootArm(page, { culling: false, viewer, nodes: 4000 });
        const m = await measurePans(page, context, 3);
        out[viewer] = {
          drawn,
          bootMs,
          frameP95Median: m.frameP95Median,
          taskMsMedian: m.taskMsMedian
        };
      } catch (e) {
        out[viewer] = { error: String(e).slice(0, 300) };
      }
    }
    const a = out.interactive as { taskMsMedian?: number } | undefined;
    const b = out.editor as { taskMsMedian?: number } | undefined;
    if (a?.taskMsMedian && b?.taskMsMedian) {
      out.editorOverheadPct = ((b.taskMsMedian - a.taskMsMedian) / a.taskMsMedian) * 100;
    }
    await testInfo.attach('triggers-editor-vs-interactive.json', {
      body: JSON.stringify(out, null, 2),
      contentType: 'application/json'
    });
    console.log('[triggers] editor-vs-interactive', JSON.stringify(out));
  });
  test('hide-mechanism variants: bulk hide/show cost on the real 23k DOM', async ({
    page,
    context
  }, testInfo) => {
    test.setTimeout(300_000);
    const { drawn } = await bootArm(page, { culling: false, viewer: 'interactive' });
    expect(drawn).toBeGreaterThanOrEqual(20_000);
    await page.addStyleTag({
      content: [
        // V1 (the designed rule): attribute on the <g>, descendant-combinator rule
        '.pfdjs-container .element[data-pfd-transient] > :not(title):not(desc){display:none}',
        // V2: class instead of attribute
        '.pfdjs-container .element.pfd-culled > :not(title):not(desc){display:none}',
        // V6: shorter selector, still structural
        'g[data-pfd-v6] > :not(title):not(desc){display:none}',
        // V5 (REFERENCE ONLY — drops the <g> from the AX tree, violating the non-waived a11y decision)
        '.pfdjs-container .element.pfd-gnone{display:none}'
      ].join('\n')
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const frame = () =>
      page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      );

    const run = (variant: string, on: boolean) =>
      page.evaluate(
        ([v, enable]) => {
          const gs = document.querySelectorAll('g.element');
          const kids = (g: Element) =>
            Array.from(g.children).filter((c) => c.localName !== 'title' && c.localName !== 'desc');
          gs.forEach((g) => {
            switch (v) {
              case 'V1 attr on g + descendant rule':
                if (enable) g.setAttribute('data-pfd-transient', 'culled');
                else g.removeAttribute('data-pfd-transient');
                break;
              case 'V2 class on g + descendant rule':
                g.classList.toggle('pfd-culled', enable as boolean);
                break;
              case 'V3 display attribute on each child':
                kids(g).forEach((c) => {
                  if (enable) c.setAttribute('display', 'none');
                  else c.removeAttribute('display');
                });
                break;
              case 'V4 inline style on each child':
                kids(g).forEach((c) => ((c as SVGElement).style.display = enable ? 'none' : ''));
                break;
              case 'V5 display:none on the whole <g> (REFERENCE ONLY, violates a11y)':
                g.classList.toggle('pfd-gnone', enable as boolean);
                break;
              case 'V6 short selector, attr on g':
                if (enable) g.setAttribute('data-pfd-v6', '');
                else g.removeAttribute('data-pfd-v6');
                break;
            }
          });
        },
        [variant, on] as [string, boolean]
      );

    const variants = [
      'V1 attr on g + descendant rule',
      'V2 class on g + descendant rule',
      'V3 display attribute on each child',
      'V4 inline style on each child',
      'V6 short selector, attr on g',
      'V5 display:none on the whole <g> (REFERENCE ONLY, violates a11y)'
    ];
    const results: Record<string, unknown>[] = [];
    for (const v of variants) {
      const cost = async (on: boolean) => {
        const a = await metrics(cdp);
        const t0 = Date.now();
        await run(v, on);
        await frame();
        const b = await metrics(cdp);
        return {
          wallMs: Date.now() - t0,
          taskMs: ((b.TaskDuration ?? 0) - (a.TaskDuration ?? 0)) * 1000,
          recalcMs: ((b.RecalcStyleDuration ?? 0) - (a.RecalcStyleDuration ?? 0)) * 1000,
          layoutMs: ((b.LayoutDuration ?? 0) - (a.LayoutDuration ?? 0)) * 1000
        };
      };
      const hideCold = await cost(true);
      const show = await cost(false);
      const hideWarm = await cost(true);
      await cost(false); // leave the DOM clean for the next variant
      results.push({ variant: v, hideCold, show, hideWarm });
    }
    await testInfo.attach('triggers-hide-variants.json', {
      body: JSON.stringify({ drawn, results }, null, 2),
      contentType: 'application/json'
    });
    console.log('[triggers] variants', JSON.stringify({ drawn, results }));
  });
});
