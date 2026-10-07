import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  CULL_MIN_ELEMENTS,
  CULL_PAD,
  HIDE_BUDGET,
  elementBounds,
  emptyModel,
  ElementStatus,
  type Culling,
  type CommandStack,
  type DiagramModule,
  type ModellingModelElement
} from '@d3-polytree/core';
import { searchPanelModule } from '@d3-polytree/interactive-viewer';
import { Editor } from './index';

/**
 * C10 index ⇄ model consistency: a seeded random sequence of every geometry writer (create,
 * move, resize, delete, undo/redo, label edit, pan/zoom) against ONE real `Editor` booted past
 * `CULL_MIN_ELEMENTS`, asserting after each op + frame flush that the spatial index still mirrors
 * the model and the DOM. A writer that emits no event `Culling` consumes shows up as bounds drift.
 */

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const OPS_PER_SEED = 25;
const VIEW = { width: 1280, height: 800 };

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The search panel rebuilds its whole list per element event — O(N² log N) at ~5k (not C10's job). */
class PropertyEditor extends Editor {
  override getModules(): readonly DiagramModule[] {
    return super.getModules().filter((m) => m !== (searchPanelModule as unknown));
  }
}

type Def = ModellingModelElement & { id: string };
type Kind = 'node' | 'link' | 'zone' | 'label';
interface Defs {
  node?: Def[];
  link?: Def[];
  zone?: Def[];
  label?: Def[];
}

/** ≥ CULL_MIN_ELEMENTS + 200 drawn elements: nodes + pinned links + a label per 10th node. */
function buildDiagram(): string {
  const { definitions, moddle } = emptyModel();
  const coord = (x: number, y: number) => moddle.create('pfdn:Coordinates', { x, y });
  const N = 2500;
  const cols = 64;
  const labels: unknown[] = [];
  const nodes: unknown[] = [];
  const pos = (i: number) => ({ x: (i % cols) * 130, y: Math.floor(i / cols) * 130 });
  for (let i = 0; i < N; i++) {
    const p = pos(i);
    let label: unknown;
    if (i % 10 === 0) {
      label = moddle.create('pfdn:Label', {
        id: `label_${i}`,
        status: 1,
        fontSize: 12,
        text: `N${i}`,
        position: coord(p.x, p.y + 56)
      });
      labels.push(label);
    }
    nodes.push(
      moddle.create('pfdn:Node', {
        id: `node_${i}`,
        status: 1,
        type: 'default',
        size: 50,
        position: coord(p.x, p.y),
        ...(label ? { label } : {})
      })
    );
  }
  const links: unknown[] = [];
  for (let i = 0; i < N; i++) {
    const a = pos(i);
    const b = pos((i + 1) % N);
    links.push(
      moddle.create('pfdn:Link', {
        id: `link_${i}`,
        status: 1,
        source: `node_${i}`,
        target: `node_${(i + 1) % N}`,
        pinned: true,
        waypoint: [coord(a.x + 25, a.y + 25), coord(b.x + 25, b.y + 25)]
      })
    );
  }
  definitions.label = labels as never;
  definitions.node = nodes as never;
  definitions.link = links as never;
  return moddle.toXML(definitions);
}

describe('culling index ⇄ model consistency (random sequences)', () => {
  let editor: Editor;
  let culling: Culling;
  let cs: CommandStack;
  let rafQueue: Array<() => void> = [];
  let roCallback: ((e: unknown[]) => void) | null = null;
  let observer: MutationObserver;
  let host: HTMLElement;

  const defs = (): Defs => editor.getHost()!.definitions as Defs;
  /** Drawn elements only: delete is soft (`status` Deleted), the def stays in the model. */
  const drawn = (list: Def[] | undefined): Def[] =>
    (list ?? []).filter((d) => d.get('status') !== ElementStatus.Deleted);
  const allDefs = (): Array<[Kind, Def]> =>
    (['node', 'link', 'zone', 'label'] as const).flatMap((k) =>
      drawn(defs()[k]).map((d): [Kind, Def] => [k, d])
    );

  function flush(): void {
    for (let i = 0; i < 400 && rafQueue.length; i++) {
      const q = rafQueue;
      rafQueue = [];
      q.forEach((cb) => cb());
    }
    expect(rafQueue).toHaveLength(0);
  }

  function viewport() {
    const z = (
      editor.getHost()!.definitions as {
        settings: { zoom: { scale: number; offset: { x: number; y: number } } };
      }
    ).settings.zoom;
    const s = z.scale;
    return {
      x0: -z.offset.x / s - CULL_PAD,
      y0: -z.offset.y / s - CULL_PAD,
      x1: (VIEW.width - z.offset.x) / s + CULL_PAD,
      y1: (VIEW.height - z.offset.y) / s + CULL_PAD
    };
  }

  function check(label: string): void {
    flush();
    const snap = culling.inspect();
    expect(snap.active, `${label}: active`).toBe(true);
    const model = new Map(allDefs().map(([k, d]) => [d.id, [k, d] as [Kind, Def]]));
    const inSlots = new Set(snap.slots.map((s) => s.id));
    const missing = [...model.keys()].filter((id) => !inSlots.has(id));
    const extra = [...inSlots].filter((id) => !model.has(id));
    expect({ missing, extra }, `${label}: model vs index`).toEqual({ missing: [], extra: [] });
    expect(snap.slots.length, `${label}: slot count`).toBe(model.size);
    const vp = viewport();
    for (const slot of snap.slots) {
      const entry = model.get(slot.id);
      expect(entry, `${label}: ${slot.id} not in model`).toBeDefined();
      // (1) index bounds == bounds of the current model def
      expect(slot.bounds, `${label}: bounds ${slot.id}`).toEqual(
        elementBounds(entry![0], entry![1])
      );
      // (5) no stale <g> reference
      expect(slot.node?.isConnected, `${label}: connected ${slot.id}`).toBe(true);
      // (2) slot flag == DOM attribute presence
      expect(slot.node!.hasAttribute('data-pfd-transient'), `${label}: attr ${slot.id}`).toBe(
        slot.culled
      );
      // (3) at idle, nothing culled intersects the padded viewport
      if (slot.culled) {
        const b = slot.bounds;
        const hit = b.x0 <= vp.x1 && b.x1 >= vp.x0 && b.y0 <= vp.y1 && b.y1 >= vp.y0;
        expect(hit, `${label}: culled-in-view ${slot.id}`).toBe(false);
      }
    }
    expect(snap.stats.maxHides, `${label}: hide budget`).toBeLessThanOrEqual(HIDE_BUDGET);
    // (4) no element toggled more than twice during the op
    const perEl = new Map<Node, number>();
    for (const r of observer.takeRecords()) perEl.set(r.target, (perEl.get(r.target) ?? 0) + 1);
    for (const [, n] of perEl) expect(n, `${label}: toggles`).toBeLessThanOrEqual(2);
  }

  beforeAll(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => rafQueue.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: (e: unknown[]) => void) {
          roCallback = cb;
        }
        observe() {}
        disconnect() {}
      }
    );
    // The stylesheet is not loaded in jsdom: stand in for the shipped `display:none` rule.
    vi.stubGlobal('getComputedStyle', () => ({ display: 'none' }));
    host = document.createElement('div');
    document.body.appendChild(host);
    editor = new PropertyEditor({ container: host });
  }, 240_000);

  afterAll(() => vi.unstubAllGlobals());

  it('boots past CULL_MIN_ELEMENTS and activates', async () => {
    const t0 = performance.now();
    await editor.importDiagram(buildDiagram());
    culling = editor.get<Culling>('culling');
    roCallback!([{ contentRect: { width: VIEW.width, height: VIEW.height } }]);
    cs = editor.get<CommandStack>('commandStack');
    const boot = performance.now() - t0;
    console.info(`[perf] property-test boot ${Math.round(boot)} ms, ${allDefs().length} elements`);
    expect(allDefs().length).toBeGreaterThanOrEqual(CULL_MIN_ELEMENTS + 200);
    expect(culling.inspect().active).toBe(true);
    observer = new MutationObserver(() => {});
    observer.observe(host, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pfd-transient']
    });
    check('boot');
    expect(culling.inspect().slots.some((s) => s.culled)).toBe(true);
  }, 240_000);

  for (const seed of SEEDS) {
    it(`seed ${seed}: ${OPS_PER_SEED} random ops keep the index consistent`, () => {
      const rnd = mulberry32(seed);
      const pick = <T>(a: T[]): T => a[Math.floor(rnd() * a.length)];
      const zoom = editor.get<{
        setZoomable(z: boolean): void;
        setZoom(x: number, y: number, s: number): void;
      }>('zoom');
      const add = editor.get<{ append(p?: { position?: { x: number; y: number } }): Def }>(
        'addNodeHandler'
      );
      for (let op = 0; op < OPS_PER_SEED; op++) {
        const roll = Math.floor(rnd() * 8);
        const nodes = drawn(defs().node);
        let name = '';
        switch (roll) {
          case 0: {
            name = 'create';
            add.append({ position: { x: rnd() * 8000, y: rnd() * 5000 } });
            break;
          }
          case 1: {
            name = 'move';
            const n = pick(nodes) as Def & { position: { x: number; y: number } };
            const from = { x: n.position.x, y: n.position.y };
            cs.execute('element.move', {
              items: [
                {
                  def: n,
                  className: 'node',
                  from: { position: from, status: Number(n.get('status') ?? 0) },
                  to: { position: { x: rnd() * 8000, y: rnd() * 5000 }, status: 2 }
                }
              ]
            });
            break;
          }
          case 2: {
            name = 'resize';
            const n = pick(nodes) as Def & { size: number; position: { x: number; y: number } };
            const from = { size: Number(n.size), position: { x: n.position.x, y: n.position.y } };
            const size = 30 + Math.floor(rnd() * 60);
            n.size = size;
            cs.execute('element.resize', {
              def: n,
              className: 'node',
              from,
              to: { size, position: { x: n.position.x, y: n.position.y } }
            });
            break;
          }
          case 3: {
            name = 'delete';
            const victim = pick(nodes);
            editor.select(victim);
            editor.deleteSelected();
            break;
          }
          case 4: {
            name = 'undo';
            if (cs.canUndo()) cs.undo();
            break;
          }
          case 5: {
            name = 'redo';
            if (cs.canRedo()) cs.redo();
            break;
          }
          case 6: {
            name = 'label edit';
            const label = pick(drawn(defs().label));
            if (label) {
              const scope = { set: (d: Def, p: Record<string, unknown>) => Object.assign(d, p) };
              const text = `T${Math.floor(rnd() * 1e6)}`;
              cs.execute('element.updateProperties', {
                scope,
                definition: label,
                before: { text: (label as unknown as { text?: string }).text },
                after: { text }
              });
            }
            break;
          }
          default: {
            name = 'pan/zoom';
            zoom.setZoomable(true);
            zoom.setZoom(-rnd() * 7000, -rnd() * 4000, 0.3 + rnd() * 1.7);
            zoom.setZoomable(false);
          }
        }
        check(`seed ${seed} op ${op} (${name})`);
      }
    }, 240_000);
  }

  it('destroy cancels pending work and removes the idle attribute', () => {
    editor.destroy();
    expect(host.querySelector('[data-pfd-culling-idle]')).toBeNull();
    expect(host.hasAttribute('data-pfd-culling-idle')).toBe(false);
  });
});
