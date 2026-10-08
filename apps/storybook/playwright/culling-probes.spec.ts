import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { gotoStory, loadStories } from './_support';
import { SMALL, generateFixtureSpec } from '../src/perf/fixture.data';

/**
 * C10 PR1 probes on the SMALL fixture (required lane: ~10.6k elements, explicit timeout,
 * no screenshots). They verify the assumptions the culling design rests on and record the
 * measurements that feed later steps (`measurements.md`):
 *
 *  - P1  a culled `<g>` (all children but <title>/<desc> `display:none`) keeps its AX role+name
 *        in Chromium's REAL accessibility tree (CDP) — `locator.ariaSnapshot()` is NOT used as the
 *        oracle: it reports `- img` visible vs `""` hidden for the same `<g>`.
 *  - P2  `getBoundingClientRect` does NOT include stroke (so G1's oracle inflates explicitly).
 *  - P3  `focus()` works on a culled `<g>`.
 *  - P4  (record only) live resize + wheel-zoom mid-gesture.
 *  - per-class painted-extent overhang over raw model geometry → the culling pad input.
 *  - `@d3-polytree/core` imports from a Playwright spec (G2 imports `elementBounds` directly).
 *
 * The temporary rule below is the production selector the culling CSS will ship.
 */

const CULL_RULE =
  '.pfdjs-container .element[data-pfd-transient] > :not(title):not(desc){display:none}';
const TRANSIENT = 'data-pfd-transient';

interface AxNode {
  role: string | undefined;
  name: string | undefined;
}

async function axOf(cdp: CDPSession, selector: string): Promise<AxNode> {
  const { root } = (await cdp.send('DOM.getDocument', { depth: 0 })) as {
    root: { nodeId: number };
  };
  const { nodeId } = (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })) as {
    nodeId: number;
  };
  expect(nodeId, `no DOM node for ${selector}`).toBeGreaterThan(0);
  const { nodes } = (await cdp.send('Accessibility.getPartialAXTree', {
    nodeId,
    fetchRelatives: false
  })) as { nodes: { role?: { value: string }; name?: { value: string } }[] };
  return { role: nodes[0]?.role?.value, name: nodes[0]?.name?.value };
}

/**
 * Total AX nodes and the number of `group` nodes. Hiding a `<g>`'s painted children legitimately
 * removes a few decorative descendants (img / static text) from the tree, so the invariant is that
 * every element's own `group` node survives — not that the total is unchanged.
 */
async function axCounts(cdp: CDPSession): Promise<{ total: number; groups: number }> {
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
    nodes: { role?: { value: string } }[];
  };
  return { total: nodes.length, groups: nodes.filter((n) => n.role?.value === 'group').length };
}

async function boot(page: Page): Promise<void> {
  const story = loadStories({ includeHarness: true }).find(
    (s) => s.title === 'Tests/Culling Harness'
  );
  expect(story, 'Tests/Culling Harness missing from the build').toBeTruthy();
  await gotoStory(page, story!.id, {}, { culling: false, viewer: 'editor' });
  await page.evaluate(
    () => (window as unknown as { __polytreeCullingReady: Promise<void> }).__polytreeCullingReady
  );
}

test.describe('C10 culling probes (small fixture)', () => {
  test.setTimeout(90_000);

  test('@d3-polytree/core imports from a spec (dynamic import and require)', async () => {
    const viaImport = (await import('@d3-polytree/core')) as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const viaRequire = require('@d3-polytree/core') as Record<string, unknown>;
    expect(typeof viaImport.emptyModel).toBe('function');
    expect(typeof viaRequire.emptyModel).toBe('function');
  });

  test('P1/P2/P3: a culled <g> keeps its AX name, focus works, stroke is excluded from bbox', async ({
    page,
    context
  }, testInfo) => {
    await boot(page);
    const spec = generateFixtureSpec(SMALL);
    const nodeId = spec.nodes[0].id;
    const labelId = spec.labels[0].id;
    const sel = (id: string) => `g[element-id="${id}"]`;

    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('Accessibility.enable');

    const nodeBefore = await axOf(cdp, sel(nodeId));
    const labelBefore = await axOf(cdp, sel(labelId));
    const countsBefore = await axCounts(cdp);
    expect(nodeBefore.name, 'node <g> should have an accessible name').toBeTruthy();
    expect(labelBefore.name).toContain('label: ');

    await page.addStyleTag({ content: CULL_RULE });
    await page.evaluate(
      ([a, b, attr]) => {
        document.querySelector(a)!.setAttribute(attr, 'culled');
        document.querySelector(b)!.setAttribute(attr, 'culled');
      },
      [sel(nodeId), sel(labelId), TRANSIENT]
    );

    // the production rule really hides every child except title/desc
    const kids = await page.evaluate((s) => {
      const g = document.querySelector(s)!;
      return Array.from(g.children).map((c) => `${c.localName}:${getComputedStyle(c).display}`);
    }, sel(nodeId));
    for (const k of kids) {
      const [name, display] = k.split(':');
      expect(
        display,
        `${name} should be ${name === 'title' || name === 'desc' ? 'shown' : 'hidden'}`
      ).toBe(name === 'title' || name === 'desc' ? 'inline' : 'none');
    }

    // P1 — the real AX tree is unchanged for the culled elements
    expect(await axOf(cdp, sel(nodeId))).toEqual(nodeBefore);
    expect(await axOf(cdp, sel(labelId))).toEqual(labelBefore);
    const countsAfter = await axCounts(cdp);
    expect(countsAfter.groups, 'every element <g> keeps its AX group node').toBe(
      countsBefore.groups
    );
    expect(countsAfter.total).toBeLessThanOrEqual(countsBefore.total);

    // P3 — focus lands on the culled <g>
    const focused = await page.evaluate((s) => {
      const g = document.querySelector(s) as SVGGElement;
      g.focus();
      return document.activeElement === g;
    }, sel(nodeId));
    expect(focused, 'focus() on a culled <g> must succeed').toBe(true);

    // P2 — getBoundingClientRect ignores stroke (G1's oracle must add it explicitly)
    const p2 = await page.evaluate(() => {
      const p = document.querySelector('g.linkItem path.line-path') as SVGPathElement;
      const before = p.getBoundingClientRect();
      p.setAttribute('stroke-width', '40');
      const after = p.getBoundingClientRect();
      return { before: [before.width, before.height], after: [after.width, after.height] };
    });
    expect(p2.after).toEqual(p2.before);

    await testInfo.attach('probes-p1-p3.json', {
      body: JSON.stringify(
        { nodeBefore, labelBefore, countsBefore, countsAfter, kids, focused, p2 },
        null,
        2
      ),
      contentType: 'application/json'
    });
  });

  test('per-class painted-extent overhang over raw model geometry (the culling pad input)', async ({
    page
  }, testInfo) => {
    await boot(page);
    const spec = generateFixtureSpec(SMALL);
    // a spread sample of each class
    const pick = <T>(xs: T[], n: number): T[] =>
      xs.filter((_, i) => i % Math.max(1, Math.floor(xs.length / n)) === 0).slice(0, n);
    const sample = {
      nodes: pick(spec.nodes, 20),
      links: pick(spec.links, 20),
      labels: pick(spec.labels, 20),
      zones: pick(spec.zones, spec.zones.length)
    };

    const result = await page.evaluate((s) => {
      // client → world: undo the svg origin and the drawing layer's translate(tx, ty) scale(k)
      const canvas = (
        window as unknown as { __polytreeCullingViewer: { get<T>(n: string): T } }
      ).__polytreeCullingViewer.get<{
        getContainer(): HTMLElement;
        getDrawingLayer(): { attr(n: string): string | null };
      }>('canvas');
      // The canvas container is the world origin (the svg fills it). Do NOT query the first
      // `.pfdjs-container svg`: that matches a 20x20 chrome icon in the side tabs.
      const o = canvas.getContainer().getBoundingClientRect();
      const m = /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(\s*([-\d.e]+)/.exec(
        canvas.getDrawingLayer().attr('transform') ?? ''
      );
      const tx = m ? parseFloat(m[1]) : 0;
      const ty = m ? parseFloat(m[2]) : 0;
      const k = m ? parseFloat(m[3]) : 1;
      const world = (r: DOMRect) => ({
        l: (r.left - o.left - tx) / k,
        t: (r.top - o.top - ty) / k,
        r: (r.right - o.left - tx) / k,
        b: (r.bottom - o.top - ty) / k
      });
      const q = (id: string) => document.querySelector(`g[element-id="${id}"]`) as SVGGElement;
      const max = (xs: number[]) => (xs.length ? Math.max(...xs) : 0);
      const out: Record<string, unknown> = {};

      // painted = the whole <g> (outline + ring + paint), and the paint target alone
      const rows = (
        items: { id: string; model: { l: number; t: number; r: number; b: number } }[],
        paint: (g: SVGGElement) => Element | null
      ) => {
        const g = { l: [] as number[], t: [] as number[], r: [] as number[], b: [] as number[] };
        const p = { l: [] as number[], t: [] as number[], r: [] as number[], b: [] as number[] };
        for (const it of items) {
          const el = q(it.id);
          if (!el) continue;
          const wg = world(el.getBoundingClientRect());
          g.l.push(it.model.l - wg.l);
          g.t.push(it.model.t - wg.t);
          g.r.push(wg.r - it.model.r);
          g.b.push(wg.b - it.model.b);
          const pe = paint(el);
          if (pe) {
            const wp = world(pe.getBoundingClientRect());
            p.l.push(it.model.l - wp.l);
            p.t.push(it.model.t - wp.t);
            p.r.push(wp.r - it.model.r);
            p.b.push(wp.b - it.model.b);
          }
        }
        const m = (a: typeof g) => ({
          left: max(a.l),
          top: max(a.t),
          right: max(a.r),
          bottom: max(a.b)
        });
        return { wholeG: m(g), paintTarget: m(p), count: g.l.length };
      };

      out.node = rows(
        s.nodes.map((n) => ({
          id: n.id,
          model: { l: n.x, t: n.y, r: n.x + n.size, b: n.y + n.size }
        })),
        (g) => g.querySelector(':scope > .innerElement')
      );
      out.link = rows(
        s.links.map((l) => {
          const xs = l.waypoints.map((w) => w.x),
            ys = l.waypoints.map((w) => w.y);
          return {
            id: l.id,
            model: {
              l: Math.min(...xs),
              t: Math.min(...ys),
              r: Math.max(...xs),
              b: Math.max(...ys)
            }
          };
        }),
        (g) => g.querySelector(':scope > .innerElement')
      );
      out.zone = rows(
        s.zones.map((z) => ({
          id: z.id,
          model: { l: z.x, t: z.y, r: z.x + z.width, b: z.y + z.height }
        })),
        (g) => g.querySelector(':scope > rect:not(.element-outline):not(.element-focus-ring)')
      );

      // labels have no model size: calibrate the width/height estimator and the origin offset
      const lab = {
        wPerChar: [] as number[],
        hPerFont: [] as number[],
        offL: [] as number[],
        offT: [] as number[]
      };
      for (const l of s.labels) {
        const el = q(l.id)?.querySelector(':scope > .innerElement');
        if (!el) continue;
        const w = world(el.getBoundingClientRect());
        lab.wPerChar.push((w.r - w.l) / (Math.max(1, l.text.length) * l.fontSize));
        lab.hPerFont.push((w.b - w.t) / l.fontSize);
        lab.offL.push(w.l - l.x);
        lab.offT.push(w.t - l.y);
      }
      out.label = {
        count: lab.wPerChar.length,
        maxWidthPerCharPerFontSize: max(lab.wPerChar),
        maxHeightPerFontSize: max(lab.hPerFont),
        maxOriginOffsetLeft: max(lab.offL),
        maxOriginOffsetTop: max(lab.offT)
      };
      // link strokes (not in getBoundingClientRect): the lineWidth the bounds pad must cover
      out.drawingTransform = { tx, ty, k };
      out.linkStroke = {
        lineWidth: parseFloat(
          getComputedStyle(document.querySelector('g.linkItem path.line-path')!).strokeWidth
        )
      };
      return out;
    }, sample);

    await testInfo.attach('overhang.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json'
    });
    console.log('[probe] overhang', JSON.stringify(result));
    expect((result.node as { count: number }).count).toBeGreaterThan(0);
    expect((result.label as { count: number }).count).toBeGreaterThan(0);
  });

  test('P4 (record only): wheel-zoom mid-resize', async ({ page }, testInfo) => {
    await boot(page);
    const outcome = await (async () => {
      try {
        // node_5 sits at x=650: clear of the Editor palette overlay that covers the top-left
        const id = generateFixtureSpec(SMALL).nodes[5].id;
        const g = `g[element-id="${id}"]`;
        // select with a real pointer click, as interactions.spec.ts does
        await page.click(g, { position: { x: 12, y: 12 }, timeout: 5000 });
        const state = await page.evaluate((s) => {
          const el = document.querySelector(s)!;
          const h = el.querySelector('.resize-container .resize-drag-se');
          const r = h?.getBoundingClientRect();
          return {
            selected: el.classList.contains('selected'),
            handleCount: el.querySelectorAll('.resize-container rect').length,
            handleDisplay: h ? getComputedStyle(h).display : null,
            handleRect: r ? [r.x, r.y, r.width, r.height] : null,
            size: Number((el as unknown as { __data__?: { size?: number } }).__data__?.size ?? NaN)
          };
        }, g);
        if (!state.handleRect || state.handleRect[2] === 0) {
          return {
            ...state,
            note: 'resize handle has no box (handles hidden / not selectable here)'
          };
        }
        const [hx, hy, hw, hh] = state.handleRect;
        await page.mouse.move(hx + hw / 2, hy + hh / 2);
        await page.mouse.down();
        await page.mouse.move(hx + 30, hy + 30, { steps: 5 });
        const selectedDuring = await page.evaluate(
          (s) => document.querySelector(s)!.classList.contains('selected'),
          g
        );
        await page.mouse.wheel(0, -300);
        await page.mouse.move(hx + 40, hy + 40, { steps: 3 });
        await page.mouse.up();
        return { ...state, selectedDuring, note: 'resize + wheel completed' };
      } catch (e) {
        return { error: String(e) };
      }
    })();
    await testInfo.attach('probe-p4.json', {
      body: JSON.stringify(outcome, null, 2),
      contentType: 'application/json'
    });
    console.log('[probe] P4', JSON.stringify(outcome));
  });
});
