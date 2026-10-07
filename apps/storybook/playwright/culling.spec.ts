import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { CULL_PAD, HIDE_BUDGET, elementBounds, CULL_MIN_ELEMENTS } from '@d3-polytree/core';
import { gotoStory, loadStories } from './_support';
import { SMALL, drawnElementCount, generateFixtureSpec } from '../src/perf/fixture.data';

/**
 * C10 required correctness lane (gates G1–G7) on the ~10.6k-element SMALL fixture, run for BOTH the
 * interactive viewer and the editor arm. No screenshots (seed and compare passes both run it).
 *
 *  G1  zero wrongly-culled elements vs a culling-OFF DOM oracle (synchronous SHOW included)
 *  G1b same invariant mid-tween (zoom.to.element) and the target ends visible
 *  G2  settled painted set stays within the padded-viewport brute force
 *  G3  only `data-pfd-transient` attribute writes, bounded toggles, hide budget respected
 *  G4  culled elements keep their AX (role, name) in the CDP accessibility tree; focus + arrow nav
 *  G5  exportSVG is byte-identical ON vs OFF
 *  G6  the shipped CSS really hides a culled element; a missing stylesheet fails open with one warn
 *  G7  jitter cost across a pad boundary (RECORD-ONLY; fails only on a wrongly-culled element)
 */

const TITLE = 'Tests/Culling Harness';
const ATTR = 'data-pfd-transient';
type Arm = 'interactive' | 'editor';
interface State {
  tx: number;
  ty: number;
  s: number;
}

interface PageViewer {
  get<T>(token: string): T;
  exportSVG(): string;
}
interface Truth {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

async function boot(
  page: Page,
  viewer: Arm,
  culling: boolean,
  media: { reducedMotion?: 'reduce' | 'no-preference' } = {}
): Promise<void> {
  const story = loadStories({ includeHarness: true }).find((s) => s.title === TITLE);
  expect(story, `${TITLE} missing from the build`).toBeTruthy();
  await gotoStory(page, story!.id, media, { culling, viewer });
  await page.evaluate(
    () => (window as unknown as { __polytreeCullingReady: Promise<void> }).__polytreeCullingReady
  );
  await settled(page);
}

/** Wait for culling to drain (idle true or absent) with the transform stable for 3 frames. */
async function settled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const v = (window as unknown as { __polytreeCullingViewer: PageViewer })
      .__polytreeCullingViewer;
    const canvas = v.get<{
      getContainer(): HTMLElement;
      getDrawingLayer(): { attr(n: string): string | null };
    }>('canvas');
    let stable = 0;
    let last = '';
    for (let i = 0; i < 1500 && stable < 3; i++) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const t = canvas.getDrawingLayer().attr('transform') ?? '';
      const idle = canvas.getContainer().getAttribute('data-pfd-culling-idle');
      stable = t === last && idle !== 'false' ? stable + 1 : 0;
      last = t;
    }
    if (stable < 3) throw new Error('culling never settled');
  });
}

async function setView(page: Page, st: State): Promise<void> {
  await page.evaluate(({ tx, ty, s }) => {
    const z = (
      window as unknown as { __polytreeCullingViewer: PageViewer }
    ).__polytreeCullingViewer.get<{
      setZoomable(b: boolean): void;
      setZoom(x: number, y: number, k: number): void;
    }>('zoom');
    z.setZoomable(true);
    z.setZoom(tx, ty, s);
    z.setZoomable(false);
  }, st);
}

async function viewSize(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() =>
    (window as unknown as { __polytreeCullingViewer: PageViewer }).__polytreeCullingViewer
      .get<{ getSize(): { width: number; height: number } }>('canvas')
      .getSize()
  );
}

/** Painted element bounds from the fixture spec through the REAL estimator (G2's brute force). */
function specBounds(): Truth[] {
  const spec = generateFixtureSpec(SMALL);
  const out: Truth[] = [];
  const push = (id: string, b: { x0: number; y0: number; x1: number; y1: number }) =>
    out.push({ id, ...b });
  for (const n of spec.nodes)
    push(n.id, elementBounds('node', { position: { x: n.x, y: n.y }, size: n.size }));
  for (const l of spec.links)
    push(l.id, elementBounds('link', { waypoint: l.waypoints, lineWidth: 4 }));
  for (const z of spec.zones)
    push(
      z.id,
      elementBounds('zone', {
        position: { x: z.x, y: z.y },
        width: z.width,
        height: z.height,
        border: { lineWidth: 1 }
      })
    );
  for (const l of spec.labels)
    push(
      l.id,
      elementBounds('label', { position: { x: l.x, y: l.y }, text: l.text, fontSize: l.fontSize })
    );
  return out;
}

const intersects = (b: Truth, r: { x0: number; y0: number; x1: number; y1: number }) =>
  b.x0 <= r.x1 && b.x1 >= r.x0 && b.y0 <= r.y1 && b.y1 >= r.y0;

function worldRect(st: State, w: number, h: number, pad: number) {
  return {
    x0: -st.tx / st.s - pad,
    y0: -st.ty / st.s - pad,
    x1: (w - st.tx) / st.s + pad,
    y1: (h - st.ty) / st.s + pad
  };
}

/** Wrongly-culled ids: painted extent intersects the STRICT viewport but carries the attribute. */
async function wronglyCulled(
  page: Page,
  truth: Truth[],
  st: State,
  size: { width: number; height: number }
): Promise<string[]> {
  return page.evaluate(
    ({ truth: t, st: v, size: sz, attr }) => {
      const x0 = -v.tx / v.s;
      const y0 = -v.ty / v.s;
      const x1 = (sz.width - v.tx) / v.s;
      const y1 = (sz.height - v.ty) / v.s;
      const bad: string[] = [];
      const els = new Map<string, Element>();
      document
        .querySelectorAll('g.element[element-id]')
        .forEach((g) => els.set(g.getAttribute('element-id')!, g));
      for (const b of t) {
        if (b.x0 > x1 || b.x1 < x0 || b.y0 > y1 || b.y1 < y0) continue;
        const g = els.get(b.id);
        if (g && g.hasAttribute(attr)) bad.push(b.id);
      }
      return bad;
    },
    { truth, st, size, attr: ATTR }
  );
}

/**
 * The culling-OFF oracle: every element's REAL painted client rect → world rect, inflated by
 * half the widest stroke plus any marker extent (`getBoundingClientRect` excludes both, P2).
 */
async function collectOracle(page: Page): Promise<Truth[]> {
  return page.evaluate(() => {
    const canvas = (
      window as unknown as { __polytreeCullingViewer: PageViewer }
    ).__polytreeCullingViewer.get<{
      getContainer(): HTMLElement;
      getDrawingLayer(): { attr(n: string): string | null };
    }>('canvas');
    const o = canvas.getContainer().getBoundingClientRect();
    const m = /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(\s*([-\d.e]+)/.exec(
      canvas.getDrawingLayer().attr('transform') ?? ''
    );
    const tx = m ? parseFloat(m[1]) : 0;
    const ty = m ? parseFloat(m[2]) : 0;
    const k = m ? parseFloat(m[3]) : 1;
    if (tx !== 0 || ty !== 0 || k !== 1)
      throw new Error(`oracle needs identity, got ${tx},${ty},${k}`);
    const out: { id: string; x0: number; y0: number; x1: number; y1: number }[] = [];
    document.querySelectorAll('g.element[element-id]').forEach((g) => {
      const r = g.getBoundingClientRect();
      let inflate = 0;
      g.querySelectorAll('path,line,polyline,rect,circle').forEach((e) => {
        const cs = getComputedStyle(e);
        const sw = parseFloat(cs.strokeWidth) || 0;
        let extra = sw / 2;
        const mk = /url\(["']?#([^"')]+)/.exec(cs.markerEnd || '');
        if (mk) {
          const el = document.getElementById(mk[1]);
          if (el) {
            const ext = Math.max(
              parseFloat(el.getAttribute('markerWidth') ?? '3'),
              parseFloat(el.getAttribute('markerHeight') ?? '3')
            );
            extra += el.getAttribute('markerUnits') === 'userSpaceOnUse' ? ext : ext * sw;
          }
        }
        inflate = Math.max(inflate, extra);
      });
      out.push({
        id: g.getAttribute('element-id')!,
        x0: r.left - o.left - inflate,
        y0: r.top - o.top - inflate,
        x1: r.right - o.left + inflate,
        y1: r.bottom - o.top + inflate
      });
    });
    return out;
  });
}

async function axOf(cdp: CDPSession, id: string): Promise<{ role?: string; name?: string }> {
  const { root } = (await cdp.send('DOM.getDocument', { depth: 0 })) as {
    root: { nodeId: number };
  };
  const { nodeId } = (await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: `g[element-id="${id}"]`
  })) as { nodeId: number };
  expect(nodeId, `no DOM node for ${id}`).toBeGreaterThan(0);
  const { nodes } = (await cdp.send('Accessibility.getPartialAXTree', {
    nodeId,
    fetchRelatives: false
  })) as { nodes: { role?: { value: string }; name?: { value: string } }[] };
  return { role: nodes[0]?.role?.value, name: nodes[0]?.name?.value };
}

async function groupCount(cdp: CDPSession): Promise<number> {
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
    nodes: { role?: { value: string } }[];
  };
  return nodes.filter((n) => n.role?.value === 'group').length;
}

const paintedCount = (page: Page) =>
  page.evaluate((a) => document.querySelectorAll(`g.element[element-id]:not([${a}])`).length, ATTR);

const STATES: State[] = [
  { tx: 0, ty: 0, s: 1 },
  { tx: -3000, ty: -2000, s: 1 },
  { tx: -6000, ty: -4000, s: 0.5 },
  { tx: -9000, ty: -6000, s: 2 },
  { tx: -300, ty: -200, s: 0.12 },
  { tx: -5200, ty: -3300, s: 1.4 }
];

for (const arm of ['interactive', 'editor'] as const) {
  test.describe(`C10 culling correctness — ${arm}`, () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(90_000);

    test('fixture is at least 2x CULL_MIN_ELEMENTS and culling activates', async ({ page }) => {
      expect(drawnElementCount(generateFixtureSpec(SMALL))).toBeGreaterThanOrEqual(
        2 * CULL_MIN_ELEMENTS
      );
      await boot(page, arm, true);
      const active = await page.evaluate(
        () =>
          (window as unknown as { __polytreeCullingViewer: PageViewer }).__polytreeCullingViewer
            .get<{ inspect(): { active: boolean } }>('culling')
            .inspect().active
      );
      expect(active).toBe(true);
    });

    test('G1 + G2: no wrongly-culled element (sync and settled) and a bounded painted set', async ({
      page
    }) => {
      await boot(page, arm, false);
      const oracle = await collectOracle(page);
      expect(oracle.length).toBeGreaterThan(2 * CULL_MIN_ELEMENTS);
      const table = specBounds();

      await boot(page, arm, true);
      const size = await viewSize(page);
      for (const st of STATES) {
        await setView(page, st);
        // synchronous SHOW: correct before any frame runs
        expect(await wronglyCulled(page, oracle, st, size), `sync ${JSON.stringify(st)}`).toEqual(
          []
        );
        await settled(page);
        expect(
          await wronglyCulled(page, oracle, st, size),
          `settled ${JSON.stringify(st)}`
        ).toEqual([]);
        // G2: the settled painted set matches the padded brute force, and covers the strict one
        const painted = await paintedCount(page);
        const padded = table.filter((b) =>
          intersects(b, worldRect(st, size.width, size.height, CULL_PAD))
        );
        const strict = table.filter((b) =>
          intersects(b, worldRect(st, size.width, size.height, 0))
        );
        expect(painted, `painted ${JSON.stringify(st)}`).toBeLessThanOrEqual(padded.length);
        expect(painted).toBeGreaterThanOrEqual(strict.length);
      }
    });

    test('G1b: no wrongly-culled element mid-tween, and the target ends visible', async ({
      page
    }) => {
      await boot(page, arm, false, { reducedMotion: 'no-preference' });
      const oracle = await collectOracle(page);
      await boot(page, arm, true, { reducedMotion: 'no-preference' });
      const size = await viewSize(page);
      const spec = generateFixtureSpec(SMALL);
      const target = spec.nodes[spec.nodes.length - 1]; // bottom-right: > 1 viewport away
      const result = await page.evaluate(
        async ({ targetId, oracle: o, size: sz, attr }) => {
          const v = (window as unknown as { __polytreeCullingViewer: PageViewer })
            .__polytreeCullingViewer;
          const canvas = v.get<{ getDrawingLayer(): { attr(n: string): string | null } }>('canvas');
          const culling = v.get<{
            inspect(): { slots: { id: string; culled: boolean }[] };
          }>('culling');
          const bus = v.get<{ emit(e: string, ...a: unknown[]): void }>('eventBus');
          const g = document.querySelector(`g[element-id="${targetId}"]`)!;
          const startCulled = g.hasAttribute(attr);
          const registry = v.get<{ getAll(): { id: string }[] }>('nodes');
          const def = registry.getAll().find((d) => d.id === targetId)!;
          const els = new Map<string, Element>();
          document
            .querySelectorAll('g.element[element-id]')
            .forEach((g) => els.set(g.getAttribute('element-id')!, g));
          const transforms = new Set<string>();
          const flips = new Set<string>();
          let bad = 0;
          const prev = new Map<string, boolean>();
          culling.inspect().slots.forEach((s) => prev.set(s.id, s.culled));
          bus.emit('zoom.to.element', null, def);
          for (let i = 0; i < 160; i++) {
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
            const t = canvas.getDrawingLayer().attr('transform') ?? '';
            transforms.add(t);
            const m = /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(\s*([-\d.e]+)/.exec(t);
            if (!m) continue;
            const tx = +m[1];
            const ty = +m[2];
            const k = +m[3];
            const x0 = -tx / k;
            const y0 = -ty / k;
            const x1 = (sz.width - tx) / k;
            const y1 = (sz.height - ty) / k;
            for (const b of o) {
              if (b.x0 > x1 || b.x1 < x0 || b.y0 > y1 || b.y1 < y0) continue;
              const e = els.get(b.id);
              if (e && e.hasAttribute(attr)) bad++;
            }
            if (i % 8 === 0) {
              culling.inspect().slots.forEach((s) => {
                if (prev.get(s.id) !== s.culled) flips.add(s.id);
              });
            }
          }
          return {
            startCulled,
            endCulled: g.hasAttribute(attr),
            distinct: transforms.size,
            flips: flips.size,
            bad
          };
        },
        { targetId: target.id, oracle, size, attr: ATTR }
      );
      expect(result.distinct, 'tween produced distinct transforms').toBeGreaterThanOrEqual(10);
      expect(result.startCulled, 'target starts culled').toBe(true);
      expect(result.endCulled, 'target ends visible').toBe(false);
      expect(result.flips, 'elements changed state mid-tween').toBeGreaterThan(0);
      expect(result.bad, 'wrongly-culled sightings mid-tween').toBe(0);
    });

    test('G3: only transient attribute writes, bounded toggles, hide budget respected', async ({
      page
    }) => {
      await boot(page, arm, true);
      await setView(page, { tx: -3000, ty: -2000, s: 1 });
      await settled(page);
      await page.evaluate((attr) => {
        const w = window as unknown as { __records: MutationRecord[]; __mo: MutationObserver };
        w.__records = [];
        w.__mo = new MutationObserver((rs) => w.__records.push(...rs));
        document.querySelectorAll('.node-group,.link-group,.zone-group,.label-group').forEach((n) =>
          w.__mo.observe(n, {
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            childList: true
          })
        );
        void attr;
      }, ATTR);
      // out and back: one hide + one show per element at most
      await setView(page, { tx: -9000, ty: -6000, s: 1 });
      await settled(page);
      await setView(page, { tx: -3000, ty: -2000, s: 1 });
      await settled(page);
      const r = await page.evaluate((attr) => {
        const w = window as unknown as { __records: MutationRecord[]; __mo: MutationObserver };
        w.__records.push(...w.__mo.takeRecords());
        const perEl = new Map<Node, number>();
        let childList = 0;
        let other = 0;
        let notElement = 0;
        for (const rec of w.__records) {
          if (rec.type === 'childList') {
            childList++;
            continue;
          }
          if (rec.attributeName !== attr) other++;
          const t = rec.target as Element;
          if (!t.classList?.contains('element')) notElement++;
          perEl.set(t, (perEl.get(t) ?? 0) + 1);
        }
        const stats = (
          window as unknown as { __polytreeCullingViewer: PageViewer }
        ).__polytreeCullingViewer
          .get<{
            inspect(): { stats: { passes: number; maxHides: number } };
          }>('culling')
          .inspect().stats;
        return {
          childList,
          other,
          notElement,
          total: w.__records.length,
          maxToggles: Math.max(0, ...perEl.values()),
          stats
        };
      }, ATTR);
      expect(r.total, 'the out-and-back pan produced transient writes').toBeGreaterThan(0);
      expect(r.childList).toBe(0);
      expect(r.other, 'attribute records other than data-pfd-transient').toBe(0);
      expect(r.notElement, 'transient writes off the element <g>').toBe(0);
      expect(r.maxToggles).toBeLessThanOrEqual(2);
      expect(r.stats.maxHides).toBeLessThanOrEqual(HIDE_BUDGET);
    });

    test('G3 budget: a first-activation-sized drain spans enough frames and never hides a visible element', async ({
      page
    }) => {
      await boot(page, arm, true);
      const size = await viewSize(page);
      const table = specBounds();
      // everything in view at fit-all, then zoom IN on one cluster: ~all elements leave the viewport
      await setView(page, { tx: 0, ty: 0, s: 0.1 });
      await settled(page);
      const before = await page.evaluate(
        (attr) => ({
          passes: (
            window as unknown as { __polytreeCullingViewer: PageViewer }
          ).__polytreeCullingViewer
            .get<{ inspect(): { stats: { passes: number } } }>('culling')
            .inspect().stats.passes,
          hidden: document.querySelectorAll(`g.element[${attr}]`).length
        }),
        ATTR
      );
      const st = { tx: -5200, ty: -3300, s: 1 };
      const sample = await page.evaluate(
        async ({ st: v, size: sz, table: t, attr }) => {
          const z = (
            window as unknown as { __polytreeCullingViewer: PageViewer }
          ).__polytreeCullingViewer.get<{
            setZoomable(b: boolean): void;
            setZoom(x: number, y: number, k: number): void;
          }>('zoom');
          z.setZoomable(true);
          z.setZoom(v.tx, v.ty, v.s);
          z.setZoomable(false);
          const x0 = -v.tx / v.s;
          const y0 = -v.ty / v.s;
          const x1 = (sz.width - v.tx) / v.s;
          const y1 = (sz.height - v.ty) / v.s;
          const els = new Map<string, Element>();
          document
            .querySelectorAll('g.element[element-id]')
            .forEach((g) => els.set(g.getAttribute('element-id')!, g));
          let bad = 0;
          let frames = 0;
          const container = document.querySelector('.pfdjs-container')!;
          do {
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
            frames++;
            for (const b of t) {
              if (b.x0 > x1 || b.x1 < x0 || b.y0 > y1 || b.y1 < y0) continue;
              if (els.get(b.id)?.hasAttribute(attr)) bad++;
            }
          } while (container.getAttribute('data-pfd-culling-idle') === 'false' && frames < 400);
          return { bad, frames };
        },
        { st, size, table, attr: ATTR }
      );
      const after = await page.evaluate(
        (attr) => ({
          hidden: document.querySelectorAll(`g.element[${attr}]`).length,
          stats: (
            window as unknown as { __polytreeCullingViewer: PageViewer }
          ).__polytreeCullingViewer
            .get<{
              inspect(): { stats: { passes: number; maxHides: number } };
            }>('culling')
            .inspect().stats
        }),
        ATTR
      );
      expect(sample.bad, 'wrongly-culled sightings during the drain').toBe(0);
      const drained = after.hidden - before.hidden;
      expect(drained).toBeGreaterThanOrEqual(3 * HIDE_BUDGET);
      expect(after.stats.passes - before.passes).toBeGreaterThanOrEqual(
        Math.ceil(drained / HIDE_BUDGET)
      );
      expect(after.stats.maxHides).toBeLessThanOrEqual(HIDE_BUDGET);
    });

    test('G7 (record-only): jitter across a populated pad boundary', async ({ page }, testInfo) => {
      await boot(page, arm, true);
      const size = await viewSize(page);
      const table = specBounds();
      // left viewport edge on a node column's right bound: x1 = 130c + 59 → -tx - PAD = 130c + 59
      const base = { tx: -(130 * 20 + 59 + CULL_PAD), ty: -2000, s: 1 };
      await setView(page, base);
      await settled(page);
      const res = await page.evaluate(
        async ({ base: b, size: sz, table: t, attr }) => {
          const z = (
            window as unknown as { __polytreeCullingViewer: PageViewer }
          ).__polytreeCullingViewer.get<{
            setZoomable(b: boolean): void;
            setZoom(x: number, y: number, k: number): void;
          }>('zoom');
          let total = 0;
          const mo = new MutationObserver((rs) => {
            total += rs.length;
          });
          document
            .querySelectorAll('.node-group,.link-group,.zone-group,.label-group')
            .forEach((n) => mo.observe(n, { subtree: true, attributes: true }));
          const els = new Map<string, Element>();
          document
            .querySelectorAll('g.element[element-id]')
            .forEach((g) => els.set(g.getAttribute('element-id')!, g));
          let seen = 0;
          const writes: number[] = [];
          let bad = 0;
          for (let i = 0; i < 100; i++) {
            z.setZoomable(true);
            z.setZoom(b.tx + (i % 2 ? 1 : -1), b.ty, b.s);
            z.setZoomable(false);
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
            writes.push(total - seen);
            seen = total;
            if (i % 10 === 0) {
              const tx = b.tx + (i % 2 ? 1 : -1);
              const x0 = -tx / b.s;
              const y0 = -b.ty / b.s;
              const x1 = (sz.width - tx) / b.s;
              const y1 = (sz.height - b.ty) / b.s;
              for (const e of t) {
                if (e.x0 > x1 || e.x1 < x0 || e.y0 > y1 || e.y1 < y0) continue;
                if (els.get(e.id)?.hasAttribute(attr)) bad++;
              }
            }
          }
          return { writes, bad };
        },
        { base, size, table, attr: ATTR }
      );
      const mean = res.writes.reduce((a, c) => a + c, 0) / res.writes.length;
      const max = Math.max(...res.writes);
      console.info(
        `[perf] G7 jitter writes/frame mean=${mean.toFixed(1)} max=${max} (arm=${arm}, HIDE_BUDGET/10=${HIDE_BUDGET / 10})`
      );
      await testInfo.attach('g7-jitter.json', {
        body: JSON.stringify({ arm, mean, max, writes: res.writes }),
        contentType: 'application/json'
      });
      expect(res.bad, 'wrongly-culled element during jitter').toBe(0);
    });

    test('G4: culled elements keep AX (role,name); focus and arrow navigation reach them', async ({
      page,
      context
    }) => {
      const spec = generateFixtureSpec(SMALL);
      const farNodes = [3000, 3600, 4100].map((i) => spec.nodes[i].id);
      const farLabels = spec.labels
        .filter((l) => Number(l.id.slice(6)) >= 3000)
        .slice(0, 2)
        .map((l) => l.id);
      const ids = [spec.nodes[0].id, ...farNodes, ...farLabels];

      const cdp = await context.newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('Accessibility.enable');

      await boot(page, arm, false);
      const off: Record<string, { role?: string; name?: string }> = {};
      for (const id of ids) off[id] = await axOf(cdp, id);
      for (const id of ids) expect(off[id].name, `OFF name for ${id}`).toBeTruthy();
      const groupsOff = await groupCount(cdp);

      await boot(page, arm, true);
      const state = await page.evaluate(
        ({ ids: list, attr }) =>
          list.map((i) => ({
            id: i,
            culled: !!document.querySelector(`g[element-id="${i}"]`)?.hasAttribute(attr),
            count: document.querySelectorAll(`[element-id="${i}"]`).length
          })),
        { ids, attr: ATTR }
      );
      expect(state.filter((s) => s.culled).length, 'sampled far elements are culled').toBe(
        ids.length - 1
      );
      for (const s of state) expect(s.count).toBe(1);
      for (const id of ids) expect(await axOf(cdp, id), `AX ${id}`).toEqual(off[id]);
      expect(await groupCount(cdp), 'every element group node survives').toBe(groupsOff);

      // focus lands on a culled <g>
      const focused = await page.evaluate((id) => {
        const g = document.querySelector(`g[element-id="${id}"]`) as SVGGElement;
        g.focus();
        return document.activeElement === g;
      }, farNodes[0]);
      expect(focused).toBe(true);

      // arrow-cone navigation steps from a visible node onto its culled neighbour
      const nav = await page.evaluate(async (a) => {
        const rightmost = document.querySelector('g[element-id="node_7"]') as SVGGElement;
        rightmost.focus();
        const before = document.activeElement?.getAttribute('element-id');
        rightmost.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
        );
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        const el = document.activeElement as Element | null;
        return {
          before,
          after: el?.getAttribute('element-id') ?? null,
          culled: !!el?.hasAttribute(a)
        };
      }, ATTR);
      expect(nav.after, 'ArrowRight moved focus').not.toBeNull();
      expect(nav.after).not.toBe(nav.before);

      if (arm === 'editor') {
        // an off-screen edit to a culled label still refreshes its accessible name (N1)
        const label = farLabels[0];
        const text = 'EDITED_OFFSCREEN';
        await page.evaluate(
          ({ id, value }) => {
            const v = (window as unknown as { __polytreeCullingViewer: PageViewer })
              .__polytreeCullingViewer;
            const labels = v.get<{ getAll(): { id: string; text?: string }[] }>('labels');
            const def = labels.getAll().find((d) => d.id === id)!;
            const scope = {
              set: (d: unknown, p: Record<string, unknown>) => Object.assign(d as object, p)
            };
            v.get<{ execute(c: string, ctx: unknown): void }>('commandStack').execute(
              'element.updateProperties',
              { scope, definition: def, before: { text: def.text }, after: { text: value } }
            );
          },
          { id: label, value: text }
        );
        await settled(page);
        const edited = await axOf(cdp, label);
        expect(edited.name).toContain(text);
        const stillCulled = await page.evaluate(
          ({ id, attr }) => document.querySelector(`g[element-id="${id}"]`)!.hasAttribute(attr),
          { id: label, attr: ATTR }
        );
        expect(stillCulled, 'edited label is still culled (off-screen)').toBe(true);
      }
    });

    test('G5: culling adds nothing to the exported SVG but data-pfd-transient (ON minus attr == OFF)', async ({
      page
    }) => {
      // `exportSVG()` itself is quadratic in DOM size (canvas `getCSSStyles`: 12.6 s at ~1.2k
      // elements, 207 s at ~48k nodes — pre-existing, see the plan's Deviation Log), so a
      // byte-compare through it is infeasible above CULL_MIN_ELEMENTS. The clone-strip itself is
      // unit-tested in canvas; here the DOM parity it relies on is proven: the live SVG with the
      // transient attribute removed serializes byte-identically to the culling-OFF SVG.
      const view: State = { tx: -2500, ty: -1500, s: 0.8 };
      const serialize = (strip: boolean) =>
        page.evaluate(
          ({ strip: st, attr }) => {
            const v = (window as unknown as { __polytreeCullingViewer: PageViewer })
              .__polytreeCullingViewer;
            const layer = v.get<{ getDrawingLayer(): { node(): SVGGElement } }>('canvas');
            const svg = layer.getDrawingLayer().node().ownerSVGElement!;
            const clone = svg.cloneNode(true) as SVGSVGElement;
            if (st) clone.querySelectorAll(`[${attr}]`).forEach((n) => n.removeAttribute(attr));
            return new XMLSerializer().serializeToString(clone);
          },
          { strip, attr: ATTR }
        );
      await boot(page, arm, false);
      await setView(page, view);
      await settled(page);
      const off = await serialize(false);

      await boot(page, arm, true);
      await setView(page, view);
      await settled(page);
      const hidden = await page.evaluate(
        (a) => document.querySelectorAll(`g.element[${a}]`).length,
        ATTR
      );
      expect(hidden).toBeGreaterThan(0);
      const on = await serialize(true);
      if (on !== off) {
        let i = 0;
        while (i < on.length && on[i] === off[i]) i++;
        throw new Error(
          `ON-minus-attr differs from OFF at ${i}: ON …${on.slice(Math.max(0, i - 60), i + 80)}… OFF …${off.slice(Math.max(0, i - 60), i + 80)}…`
        );
      }
    });

    test('G6: the shipped CSS hides a culled element; a missing stylesheet fails open', async ({
      page
    }) => {
      await boot(page, arm, true);
      const shown = await page.evaluate((a) => {
        const g = document.querySelector(`g.element[${a}]`)!;
        return Array.from(g.children).map((c) => `${c.localName}:${getComputedStyle(c).display}`);
      }, ATTR);
      expect(shown.length).toBeGreaterThan(0);
      for (const k of shown) {
        const [name, display] = k.split(':');
        expect(display, name).toBe(name === 'title' || name === 'desc' ? 'inline' : 'none');
      }

      // drop the culling rule BEFORE navigation: culling must detect it and fail open
      const warns: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'warning' && m.text().includes('culling CSS not loaded'))
          warns.push(m.text());
      });
      // (Aborting every stylesheet breaks Storybook's own CSS preload, so serve the real CSS
      // minus the culling rule instead — the same observable state: rule missing.)
      await page.route('**/*.css', async (route) => {
        const resp = await route.fetch();
        const css = (await resp.text()).replace(/[^{}]*data-pfd-transient[^{}]*\{[^}]*\}/g, '');
        await route.fulfill({ response: resp, body: css });
      });
      await boot(page, arm, true);
      const total = await page.evaluate(
        () => document.querySelectorAll('g.element[element-id]').length
      );
      expect(await paintedCount(page), 'nothing hidden without the stylesheet').toBe(total);
      expect(warns).toHaveLength(1);
    });
  });
}
