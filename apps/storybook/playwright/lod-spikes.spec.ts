import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { gotoStory, loadStories } from './_support';

/**
 * C10 LOD step-0 spikes (plan Step 1; S0-1…S0-7). PERF project only (see `playwright.config.ts`),
 * RECORD-ONLY: every spike logs `[lod-spike] <id> <json>` for the pinned `perf.yml` summary and
 * attaches the same JSON; the only assertions are deterministic trace facts (S0-1, S0-2).
 * LOD is simulated with CSS injected at runtime (container attribute `data-lod-sim`), because the
 * real mechanism does not exist yet (plan Steps 3–6). Numbers are decision inputs, not budgets.
 */

type Viewerish = { get<T>(name: string): T };
declare global {
  interface Window {
    __lod?: unknown;
  }
}

const SIM_CSS = `
.pfdjs-container[data-lod-sim="hide"] :is(.node-group,.link-group) .element:not(.selected) > :not(title):not(desc){display:none}
.pfdjs-container[data-lod-sim="cv"] :is(.node-group,.link-group) .element{content-visibility:hidden}
`;

const log = (id: string, data: unknown): void =>
  console.log(`[lod-spike] ${id} ${JSON.stringify(data)}`);

async function boot(
  page: Page,
  kind: 'perf' | 'culling',
  args: { culling: boolean; viewer: 'interactive' | 'editor'; nodes?: number },
  media: { reducedMotion?: 'reduce' | 'no-preference' } = {}
): Promise<void> {
  const title = kind === 'perf' ? 'Tests/Perf Harness' : 'Tests/Culling Harness';
  const story = loadStories({ includeHarness: true }).find((s) => s.title === title);
  expect(story, `${title} missing from the build`).toBeTruthy();
  await gotoStory(page, story!.id, media, args);
  await page.evaluate(
    (k) =>
      k === 'perf'
        ? (window as unknown as { __polytreePerfReady: Promise<void> }).__polytreePerfReady
        : (window as unknown as { __polytreeCullingReady: Promise<void> }).__polytreeCullingReady,
    kind
  );
  await page.addStyleTag({ content: SIM_CSS });
  await idle(page);
}

const idle = (page: Page) =>
  page.waitForFunction(
    () =>
      document.querySelector('.pfdjs-container')?.getAttribute('data-pfd-culling-idle') !== 'false',
    undefined,
    { timeout: 120_000 }
  );

/** The page's viewer (either harness). */
const V = '(window.__polytreePerfViewer || window.__polytreeCullingViewer)';

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __f: number[]; __on: boolean };
    w.__f = [];
    w.__on = true;
    let last = performance.now();
    const tick = (n: number): void => {
      w.__f.push(n - last);
      last = n;
      if (w.__on) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
async function framesStop(page: Page): Promise<number> {
  const f = await page.evaluate(() => {
    const w = window as unknown as { __f: number[]; __on: boolean };
    w.__on = false;
    return w.__f.slice(1);
  });
  f.sort((a, b) => a - b);
  return f.length ? +f[Math.floor(0.95 * f.length)].toFixed(1) : 0;
}

async function panP95(page: Page, runs = 3): Promise<number[]> {
  const box = (await page.locator('[data-testid="harness-host"]').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const out: number[] = [];
  for (let r = 0; r < runs; r++) {
    await frames(page);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 60; i++) await page.mouse.move(cx - i * 3, cy - i, { steps: 1 });
    await page.mouse.up();
    out.push(await framesStop(page));
  }
  return out;
}

const setSim = (page: Page, mode: string | null) =>
  page.evaluate((m) => {
    const c = document.querySelector('.pfdjs-container')!;
    if (m) c.setAttribute('data-lod-sim', m);
    else c.removeAttribute('data-lod-sim');
    document.body.getBoundingClientRect();
  }, mode);

const park = (page: Page, tx: number, ty: number, k: number) =>
  page.evaluate(
    ([x, y, s]) => {
      (window as unknown as { __v: Viewerish }).__v = (window.__polytreePerfViewer ||
        window.__polytreeCullingViewer)!;
      (
        (window as unknown as { __v: Viewerish }).__v.get('zoom') as {
          setInitialZoom(a: number, b: number, c: number): void;
        }
      ).setInitialZoom(x, y, s);
    },
    [tx, ty, k]
  );

async function taskMs(cdp: CDPSession): Promise<number> {
  const { metrics } = (await cdp.send('Performance.getMetrics')) as {
    metrics: { name: string; value: number }[];
  };
  return (metrics.find((m) => m.name === 'TaskDuration')?.value ?? 0) * 1000;
}

test.describe('C10 LOD spikes (record-only)', () => {
  test.setTimeout(420_000);

  test('S0-1 zoom event trace per zoom path', async ({ page }) => {
    await boot(
      page,
      'perf',
      { culling: true, viewer: 'interactive' },
      { reducedMotion: 'no-preference' }
    );
    await page.evaluate(`(() => {
      const v = ${V};
      const bus = v.get('eventBus');
      window.__lod = { start: 0, zoomed: 0, end: 0 };
      bus.on('zoom.start', () => (window.__lod.start++));
      bus.on('canvas.zoomed', () => (window.__lod.zoomed++));
      bus.on('zoom.end', () => (window.__lod.end++));
    })()`);
    const reset = () => page.evaluate(() => (window.__lod = { start: 0, zoomed: 0, end: 0 }));
    const read = () => page.evaluate(() => ({ ...(window.__lod as Record<string, number>) }));
    const out: Record<string, unknown> = {};

    await reset();
    await page.evaluate(`${V}.get('zoom').setInitialZoom(-50, -30, 0.2)`);
    out.setInitialZoom_sync = await read();
    expect(out.setInitialZoom_sync).toEqual({ start: 1, zoomed: 1, end: 1 });

    await reset();
    await page.evaluate(`${V}.get('zoom').setInitialZoom(-60, -40, 0.5, 400)`);
    await page.waitForTimeout(900);
    out.setInitialZoom_tween = await read();

    await reset();
    await page.evaluate(
      `(() => { const z = ${V}.get('zoom'); z.setZoomable(true); z.setZoom(-70, -50, 0.3); z.setZoomable(false); })()`
    );
    out.setZoom_programmatic = await read();

    for (const zoomable of [false, true]) {
      await reset();
      await page.evaluate(`(() => {
        const v = ${V}; const z = v.get('zoom'); z.setZoomable(${zoomable});
        const def = v.get('nodes').getAll()[0];
        v.get('eventBus').emit('zoom.to.element', null, def);
      })()`);
      await page.waitForTimeout(2300);
      out[`zoomToElement_zoomable_${zoomable}`] = await read();
      await page.evaluate(`${V}.get('zoom').setZoomable(false)`);
    }

    const box = (await page.locator('[data-testid="harness-host"]').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await reset();
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -120);
    await page.waitForTimeout(700);
    out.wheel_x3 = await read();

    await reset();
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(100);
    out.bare_click = await read();

    log('S0-1', out);
    await test
      .info()
      .attach('s0-1.json', { body: JSON.stringify(out), contentType: 'application/json' });
  });

  test('S0-2 listener order: container capture vs d3-drag click suppression and dblclick zoom', async ({
    page
  }) => {
    await boot(page, 'perf', { culling: true, viewer: 'interactive' });
    await page.evaluate(`(() => {
      const v = ${V};
      const c = v.get('canvas').getContainer();
      window.__lod = { click: 0, dblclick: 0, stop: false };
      c.addEventListener('click', () => window.__lod.click++, true);
      c.addEventListener('dblclick', (e) => { window.__lod.dblclick++; if (window.__lod.stop) e.stopPropagation(); }, true);
    })()`);
    const tf = () => page.evaluate(`${V}.get('canvas').getDrawingLayer().attr('transform')`);
    const box = (await page.locator('[data-testid="harness-host"]').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const out: Record<string, unknown> = {};

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 1, cy, { steps: 1 });
    await page.mouse.up();
    out.after_1px_drag = await page.evaluate(() => ({ ...(window.__lod as object) }));
    expect(
      (out.after_1px_drag as { click: number }).click,
      'a 1 px drag-release must not reach the container capture'
    ).toBe(0);

    const t0 = await tf();
    await page.mouse.dblclick(cx, cy);
    await page.waitForTimeout(600);
    out.dblclick_no_stop = { changed: (await tf()) !== t0 };

    await page.evaluate(() => ((window.__lod as { stop: boolean }).stop = true));
    const t1 = await tf();
    await page.mouse.dblclick(cx, cy);
    await page.waitForTimeout(600);
    out.dblclick_stopPropagation = { changed: (await tf()) !== t1 };

    log('S0-2', out);
    await test
      .info()
      .attach('s0-2.json', { body: JSON.stringify(out), contentType: 'application/json' });
  });

  test('S0-3 pointer vs synthesised click discriminators (Chromium only)', async ({ page }) => {
    await boot(page, 'culling', { culling: true, viewer: 'interactive' });
    await page.evaluate(`(() => {
      const c = ${V}.get('canvas').getContainer();
      window.__lod = [];
      for (const t of ['click', 'dblclick']) c.addEventListener(t, (e) => window.__lod.push({ type: t, detail: e.detail, pointerType: e.pointerType ?? null, isPointerEvent: e instanceof PointerEvent, isTrusted: e.isTrusted, x: e.clientX, y: e.clientY }), true);
    })()`);
    const g = page.locator('g.nodeItem.element').first();
    const bb = (await g.boundingBox())!;
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.dblclick(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await g.evaluate((el) => (el as unknown as SVGGElement).focus());
    await page.keyboard.press('Enter');
    await g.evaluate((el) =>
      (el as unknown as HTMLElement & SVGElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    );
    await g.evaluate((el) => (el as unknown as { click?: () => void }).click?.());
    const events = await page.evaluate(() => window.__lod);
    log('S0-3', events);
    await test
      .info()
      .attach('s0-3.json', { body: JSON.stringify(events), contentType: 'application/json' });
  });

  test('S0-4 observed E, CSS-simulated enter drain and sync-exit task', async ({
    page,
    context
  }) => {
    await boot(page, 'perf', { culling: true, viewer: 'interactive' });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const out: Record<string, unknown> = {};
    const painted = () =>
      page.evaluate(
        `document.querySelectorAll('g.nodeItem.element:not([data-pfd-transient]), g.linkItem.element:not([data-pfd-transient])').length`
      );

    for (const [label, w, h] of [
      ['1000x700', 1000, 700],
      ['3000x1800', 3000, 1800]
    ] as const) {
      await page.evaluate(
        ([ww, hh]) => {
          const host = document.querySelector('[data-testid="harness-host"]') as HTMLElement;
          host.style.width = `${ww}px`;
          host.style.height = `${hh}px`;
        },
        [w, h]
      );
      await page.waitForTimeout(300);
      for (const k of [0.1, 0.16, 0.2, 0.25]) {
        await park(page, -50, -30, k);
        await idle(page);
        await page.waitForTimeout(300);
        const E = await painted();
        // enter drain emulation: 300 attribute writes per frame over the in-view painted node/link groups
        const drain = await page.evaluate(async () => {
          const els = Array.from(
            document.querySelectorAll(
              'g.nodeItem.element:not([data-pfd-transient]), g.linkItem.element:not([data-pfd-transient])'
            )
          );
          const deltas: number[] = [];
          const t0 = performance.now();
          let last = t0;
          for (let i = 0; i < els.length; i += 300) {
            els.slice(i, i + 300).forEach((e) => e.setAttribute('data-pfd-transient', 'lod-sim'));
            await new Promise((r) => requestAnimationFrame(r));
            const n = performance.now();
            deltas.push(n - last);
            last = n;
          }
          deltas.sort((a, b) => a - b);
          return {
            frames: deltas.length,
            totalMs: Math.round(last - t0),
            medianFrame: Math.round(deltas[deltas.length >> 1] ?? 0),
            maxFrame: Math.round(deltas[deltas.length - 1] ?? 0)
          };
        });
        // sync-exit emulation: reveal everything at once, measured as one task
        const t0 = await taskMs(cdp);
        const exitWall = await page.evaluate(() => {
          const t = performance.now();
          document
            .querySelectorAll('[data-pfd-transient="lod-sim"]')
            .forEach((e) => e.removeAttribute('data-pfd-transient'));
          document.body.getBoundingClientRect();
          return Math.round(performance.now() - t);
        });
        const exitTask = Math.round((await taskMs(cdp)) - t0);
        out[`${label}@${k}`] = { E, drain, exitWall, exitTask };
      }
    }

    out.note = 'pan/thrash in S0-5';
    log('S0-4', out);
    await test
      .info()
      .attach('s0-4.json', { body: JSON.stringify(out), contentType: 'application/json' });
    await test
      .info()
      .attach('lod-sim-0.16.png', { body: await page.screenshot(), contentType: 'image/png' });
  });

  test('S0-5 scale sensitivity: pan p95 sim vs none at 0.16/0.20/0.25 + thrash', async ({
    page
  }) => {
    test.setTimeout(480_000);
    await boot(page, 'perf', { culling: true, viewer: 'interactive' });
    const out: Record<string, unknown> = {};
    // pan p95 with the CSS-simulated hide-all vs none, at the S0-5 scales (default viewport)
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="harness-host"]') as HTMLElement;
      host.style.width = '1000px';
      host.style.height = '700px';
    });
    const pan: Record<string, unknown> = {};
    for (const k of [0.16, 0.2, 0.25]) {
      await park(page, -50, -30, k);
      await idle(page);
      await setSim(page, null);
      const none = await panP95(page, 3);
      await setSim(page, 'hide');
      await page.waitForTimeout(800);
      const hide = await panP95(page, 3);
      await setSim(page, null);
      pan[String(k)] = { none, hide };
    }
    out.pan = pan;

    // thrash: oscillate 0.17 <-> 0.21 for 20 gestures with the simulated LOD toggled per crossing
    await page.evaluate(() => {
      const w = window as unknown as { __long: number[] };
      w.__long = [];
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => w.__long.push(Math.round(e.duration)))
      ).observe({ entryTypes: ['longtask'] });
    });
    for (let i = 0; i < 20; i++) {
      const k = i % 2 ? 0.21 : 0.17;
      await park(page, -50, -30, k);
      await setSim(page, k < 0.2 ? 'hide' : null);
      await page.waitForTimeout(150);
    }
    out.thrashLongTasks = await page.evaluate(
      () => (window as unknown as { __long: number[] }).__long
    );

    log('S0-5', out);
    await test
      .info()
      .attach('s0-5.json', { body: JSON.stringify(out), contentType: 'application/json' });
    await test
      .info()
      .attach('lod-sim-0.16.png', { body: await page.screenshot(), contentType: 'image/png' });
  });

  test('S0-6 resolver ambiguity at 4 px (bounds-based upper bound)', async ({ page }) => {
    await boot(page, 'perf', { culling: true, viewer: 'interactive' });
    const out: Record<string, unknown> = {};
    for (const k of [0.1, 0.16]) {
      await park(page, -50, -30, k);
      await idle(page);
      out[String(k)] = await page.evaluate(
        ([scale]) => {
          const v = (window.__polytreePerfViewer || window.__polytreeCullingViewer)!;
          const slots = v
            .get<{
              inspect(): {
                slots: { id: string; bounds: { x0: number; y0: number; x1: number; y1: number } }[];
              };
            }>('culling')
            .inspect()
            .slots.filter((s) => /^(node|link)_/.test(s.id));
          const canvas = v
            .get<{ getSize(): { width: number; height: number } }>('canvas')
            .getSize();
          let seed = 12345;
          const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
          const tol = 4 / (scale as number);
          let multi = 0,
            none = 0,
            single = 0;
          const N = 500;
          for (let i = 0; i < N; i++) {
            const x = (rnd() * canvas.width - 50) / (scale as number);
            const y = (rnd() * canvas.height - 30) / (scale as number);
            let c = 0;
            for (const s of slots) {
              const b = s.bounds;
              if (b.x0 <= x + tol && b.x1 >= x - tol && b.y0 <= y + tol && b.y1 >= y - tol) c++;
            }
            if (c === 0) none++;
            else if (c === 1) single++;
            else multi++;
          }
          return {
            N,
            none,
            single,
            multi,
            note: 'AABB bounds (links over-count); upper bound on ambiguity'
          };
        },
        [k]
      );
    }
    log('S0-6', out);
    await test
      .info()
      .attach('s0-6.json', { body: JSON.stringify(out), contentType: 'application/json' });
  });

  test('S0-7 content-visibility on SVG <g>: applies? AX name kept? zoom-tick p95', async ({
    page,
    context
  }) => {
    await boot(page, 'perf', { culling: true, viewer: 'interactive' });
    await park(page, -50, -30, 0.1);
    await idle(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('Accessibility.enable');
    const ax = async (): Promise<{ role?: string; name?: string }> => {
      const { root } = (await cdp.send('DOM.getDocument', { depth: 0 })) as {
        root: { nodeId: number };
      };
      const { nodeId } = (await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: 'g.nodeItem.element[element-id]:not([data-pfd-transient])'
      })) as { nodeId: number };
      if (!nodeId) return {};
      const { nodes } = (await cdp.send('Accessibility.getPartialAXTree', {
        nodeId,
        fetchRelatives: false
      })) as { nodes: { role?: { value: string }; name?: { value: string } }[] };
      return { role: nodes[0]?.role?.value, name: nodes[0]?.name?.value };
    };
    const out: Record<string, unknown> = {};
    const zoomTicks = async (): Promise<number> => {
      await frames(page);
      await page.evaluate(async () => {
        const z = (window.__polytreePerfViewer || window.__polytreeCullingViewer)!.get<{
          setZoomable(b: boolean): void;
          setZoom(x: number, y: number, k: number): void;
        }>('zoom');
        z.setZoomable(true);
        for (let i = 0; i < 40; i++) {
          z.setZoom(-50, -30, 0.1 + (i % 20) * 0.003);
          await new Promise((r) => requestAnimationFrame(r));
        }
        z.setZoomable(false);
      });
      return framesStop(page);
    };
    for (const [name, mode] of [
      ['none', null],
      ['hide', 'hide'],
      ['content-visibility', 'cv']
    ] as const) {
      await setSim(page, mode);
      if (mode === 'cv') {
        out.cvComputed = await page.evaluate(
          () => getComputedStyle(document.querySelector('g.nodeItem.element')!).contentVisibility
        );
      }
      await page.waitForTimeout(600);
      const ticks: number[] = [];
      for (let i = 0; i < 5; i++) ticks.push(await zoomTicks());
      out[name] = {
        ax: name === 'none' || name === 'content-visibility' ? await ax() : 'n/a',
        zoomTickP95: ticks
      };
    }
    await setSim(page, null);
    log('S0-7', out);
    await test
      .info()
      .attach('s0-7.json', { body: JSON.stringify(out), contentType: 'application/json' });
  });
});
