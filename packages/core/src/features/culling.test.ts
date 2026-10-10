import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { select } from 'd3-selection';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { Canvas, DiagramEventMap } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { Culling } from './culling';
import { Outline } from './outline';

// Tiny fixtures: shrink the activation threshold and the per-frame hide budget.
vi.mock('../spatial/types', async (orig) => ({
  ...(await orig<typeof import('../spatial/types')>()),
  CULL_MIN_ELEMENTS: 20,
  HIDE_BUDGET: 5,
  LOD_EXEMPT_CAP: 3
}));

const BUDGET = 5;
const ATTR = 'data-pfd-transient';

interface Zoom {
  scale?: number;
  offset?: { x?: number; y?: number };
}

let rafQueue: Array<() => void>;
let rafId: number;
let cancelled: number[];
let displayOf: string;

function flushFrame(): boolean {
  const q = rafQueue;
  rafQueue = [];
  q.forEach((cb) => cb && cb());
  return q.length > 0;
}
function flushAll(max = 200): void {
  for (let i = 0; i < max && flushFrame(); i++);
}

function setup(
  opts: { culling?: boolean; lod?: boolean; zoom?: Zoom | undefined; size?: [number, number] } = {}
) {
  const bus = new EventEmitter<DiagramEventMap>();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const [w, h] = opts.size ?? [800, 600];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  container.appendChild(svg);
  const rootClasses = new Set<string>();
  const canvas = {
    getContainer: () => container,
    getSize: vi.fn(() => ({ width: w, height: h })),
    getSVG: () => ({ node: () => svg }),
    getRootLayer: () => ({ classed: (name: string) => rootClasses.has(name) })
  } as unknown as Canvas;
  const zoom: Zoom | undefined = 'zoom' in opts ? opts.zoom : { scale: 1, offset: { x: 0, y: 0 } };
  const culling = new Culling(
    canvas,
    bus,
    {
      options: {
        ...(opts.culling === undefined ? {} : { culling: opts.culling }),
        ...(opts.lod === undefined ? {} : { lod: opts.lod })
      }
    },
    zoom as never
  );
  return { bus, container, canvas, svg, rootClasses, zoom: zoom as Zoom, culling };
}

type Bus = EventEmitter<DiagramEventMap>;

function addNode(bus: Bus, id: string, x: number, y = 0): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'element');
  g.append(
    document.createElementNS('http://www.w3.org/2000/svg', 'title'),
    document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  );
  document.body.appendChild(g);
  const def = { id, position: { x, y }, size: 25 } as unknown as ModellingModelElement;
  bus.emit('node.created', { node: () => g } as unknown as DrawingSelection, def);
  return g;
}

/** Row of `n` nodes 100 apart: with an 800×600 viewport at scale 1, indices 0..8 are in view. */
function addRow(bus: Bus, n: number): SVGGElement[] {
  return Array.from({ length: n }, (_, i) => addNode(bus, `n${i}`, i * 100));
}

function culledIds(c: Culling): string[] {
  return c
    .inspect()
    .slots.filter((s) => s.culled)
    .map((s) => s.id);
}

function pan(zoom: Zoom, bus: Bus, tx: number): void {
  zoom.offset!.x = tx;
  bus.emit('canvas.zoomed');
}

beforeEach(() => {
  document.body.innerHTML = '';
  rafQueue = [];
  rafId = 0;
  cancelled = [];
  displayOf = 'none';
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    rafQueue.push(cb);
    return ++rafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    cancelled.push(id);
    rafQueue[id - 1 - (rafId - rafQueue.length)] = () => {};
  });
  vi.stubGlobal('getComputedStyle', () => ({ display: displayOf }));
  vi.stubGlobal('ResizeObserver', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Culling — element lifecycle (slice A)', () => {
  it('binds a slot to the new <g> on created and resets a stale attribute', () => {
    const { bus, culling } = setup();
    const g = addNode(bus, 'a', 0);
    const [slot] = culling.inspect().slots;
    expect(slot.id).toBe('a');
    expect(slot.node).toBe(g);
    expect(slot.culled).toBe(false);
  });

  it('re-created id (undo/redo) resets to visible and rebinds the NEW node', () => {
    const { bus, culling } = setup();
    addRow(bus, 30);
    flushAll();
    expect(culledIds(culling)).toContain('n20');
    const fresh = addNode(bus, 'n20', 2000);
    const slot = culling.inspect().slots.find((s) => s.id === 'n20')!;
    expect(slot.node).toBe(fresh);
    expect(slot.culled).toBe(false);
    expect(fresh.hasAttribute(ATTR)).toBe(false);
  });

  it('removed with a bare { id } does not throw and frees the slot', () => {
    const { bus, culling } = setup();
    addNode(bus, 'a', 0);
    expect(() => bus.emit('node.removed', {} as never, { id: 'a' } as never)).not.toThrow();
    expect(culling.inspect().slots).toHaveLength(0);
    expect(() => bus.emit('node.removed', {} as never, { id: 'ghost' } as never)).not.toThrow();
  });

  it('updated/moving change the stored bounds', () => {
    const { bus, culling } = setup();
    const g = addNode(bus, 'a', 0);
    const sel = { node: () => g } as unknown as DrawingSelection;
    const moved = {
      id: 'a',
      position: { x: 500, y: 40 },
      size: 25
    } as unknown as ModellingModelElement;
    bus.emit('node.updated', sel, moved);
    expect(culling.inspect().slots[0].bounds.x0).toBe(497);
    bus.emit('node.moving', sel, { ...moved, position: { x: 600, y: 40 } } as never);
    expect(culling.inspect().slots[0].bounds.x0).toBe(597);
  });

  it('options.culling === false is inactive and never hides', () => {
    const { bus, culling } = setup({ culling: false });
    addRow(bus, 40);
    flushAll();
    expect(culling.inspect().active).toBe(false);
    expect(culledIds(culling)).toHaveLength(0);
  });
});

describe('Culling — viewport and hide/show passes (slice B)', () => {
  it('far elements get the attribute after the rAF; near elements do not', () => {
    const { bus, culling } = setup();
    const gs = addRow(bus, 40);
    expect(gs.some((g) => g.hasAttribute(ATTR))).toBe(false); // deferred to a frame
    flushAll();
    gs.forEach((g, i) => expect(g.hasAttribute(ATTR)).toBe(i > 8));
    expect(culling.inspect().active).toBe(true);
  });

  it('a pan brings a culled element back synchronously, before any rAF', () => {
    const { bus, zoom } = setup();
    const gs = addRow(bus, 40);
    flushAll();
    expect(gs[12].hasAttribute(ATTR)).toBe(true);
    pan(zoom, bus, -1100); // world x 1100.. now in view
    expect(gs[12].hasAttribute(ATTR)).toBe(false);
  });

  it('pan out → pan back → drain: nothing in view stays hidden, ≤ 2 toggles per cycle', () => {
    const { bus, zoom } = setup();
    const gs = addRow(bus, 40);
    const writes: number[] = new Array(gs.length).fill(0);
    gs.forEach((g, i) => {
      for (const m of ['setAttribute', 'removeAttribute'] as const) {
        const orig = g[m].bind(g) as (...a: string[]) => void;
        (g as unknown as Record<string, unknown>)[m] = (...a: string[]) => {
          if (a[0] === ATTR) writes[i]++;
          orig(...a);
        };
      }
    });
    flushAll();
    pan(zoom, bus, -2000);
    flushAll();
    pan(zoom, bus, 0);
    flushAll();
    gs.forEach((g, i) => expect(g.hasAttribute(ATTR)).toBe(i > 8));
    expect(Math.max(...writes)).toBeLessThanOrEqual(4);
  });

  it('an unchanged second flush performs zero attribute writes', () => {
    const { bus, container } = setup();
    const gs = addRow(bus, 40);
    flushAll();
    const spies = gs.flatMap((g) => [vi.spyOn(g, 'setAttribute'), vi.spyOn(g, 'removeAttribute')]);
    bus.emit('canvas.zoomed');
    flushAll();
    expect(spies.every((s) => s.mock.calls.length === 0)).toBe(true);
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('true');
  });

  it('missing offset or scale fails open: nothing hidden', () => {
    for (const zoom of [{ scale: 1 }, { offset: { x: 0, y: 0 } }, undefined] as Array<
      Zoom | undefined
    >) {
      document.body.innerHTML = '';
      const { bus, culling } = setup({ zoom });
      addRow(bus, 40);
      flushAll();
      expect(culledIds(culling)).toHaveLength(0);
    }
  });

  it('hide drain is budgeted: exactly HIDE_BUDGET per frame, ascending slot order', () => {
    const { bus, culling } = setup();
    const n = 3 * BUDGET + 7;
    addRow(bus, 9 + n);
    flushFrame();
    expect(culledIds(culling)).toEqual(Array.from({ length: BUDGET }, (_, i) => `n${9 + i}`));
    expect(culling.inspect().stats.maxHides).toBe(BUDGET);
    let frames = 1;
    while (flushFrame()) frames++;
    expect(culledIds(culling)).toHaveLength(n);
    expect(frames).toBe(Math.ceil(n / BUDGET) + 0); // last frame is the draining one with no backlog
    expect(culling.inspect().stats.maxHides).toBeLessThanOrEqual(BUDGET);
  });

  it('a pan-back mid-drain never hides an in-view element', () => {
    const { bus, zoom, culling } = setup();
    const gs = addRow(bus, 60);
    flushFrame(); // BUDGET hides
    pan(zoom, bus, -3000); // in view now: x 3000..3800 → indices 30..38
    flushAll();
    for (const [i, g] of gs.entries()) {
      const inView = i >= 30 && i <= 38;
      if (inView) expect(g.hasAttribute(ATTR)).toBe(false);
    }
    expect(culling.inspect().stats.maxHides).toBeLessThanOrEqual(BUDGET);
  });

  it('shows are unbounded: a pan revealing more than HIDE_BUDGET elements shows them all at once', () => {
    const { bus, zoom } = setup();
    const gs = addRow(bus, 60);
    flushAll();
    pan(zoom, bus, -2000);
    flushAll();
    pan(zoom, bus, 0); // everything near x<800 returns synchronously
    const shown = gs.filter((g, i) => i <= 8 && !g.hasAttribute(ATTR)).length;
    expect(shown).toBe(9);
    expect(9).toBeGreaterThan(BUDGET);
  });

  it('SHOW and hide use the same padded rect (no flip within one state)', () => {
    const { bus, zoom, culling } = setup();
    addRow(bus, 40);
    flushAll();
    const before = culledIds(culling);
    zoom.offset!.x = 0;
    bus.emit('canvas.zoomed');
    flushAll();
    expect(culledIds(culling)).toEqual(before);
  });
});

describe('Culling — inert rules, size, lifecycle (slice C)', () => {
  it('size 0 ⇒ nothing is hidden', () => {
    const { bus, culling, container } = setup({ size: [0, 0] });
    addRow(bus, 40);
    flushAll();
    expect(culledIds(culling)).toHaveLength(0);
    expect(container.hasAttribute('data-pfd-culling-idle')).toBe(false);
  });

  it('requests a frame at most once per dirty burst', () => {
    const { bus } = setup();
    const spy = vi.fn((cb: () => void) => {
      rafQueue.push(cb);
      return ++rafId;
    });
    vi.stubGlobal('requestAnimationFrame', spy);
    addRow(bus, 40);
    bus.emit('canvas.zoomed');
    bus.emit('canvas.zoomed');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('below the threshold nothing is hidden; dropping below it reveals everything', () => {
    const { bus, culling } = setup();
    addRow(bus, 40);
    flushAll();
    expect(culledIds(culling).length).toBeGreaterThan(0);
    for (let i = 39; i >= 15; i--) bus.emit('node.removed', {} as never, { id: `n${i}` } as never);
    flushAll();
    expect(culledIds(culling)).toHaveLength(0);
    expect(culling.inspect().active).toBe(false);
  });

  it('with a ResizeObserver, activation waits for a size and re-evaluates on resize', () => {
    let cb: (e: unknown[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(c: (e: unknown[]) => void) {
          cb = c;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
    const { bus, culling } = setup();
    const gs = addRow(bus, 40);
    flushAll();
    expect(culling.inspect().active).toBe(false);
    expect(gs.some((g) => g.hasAttribute(ATTR))).toBe(false);
    cb([{ contentRect: { width: 800, height: 600 } }]);
    flushAll();
    expect(culling.inspect().active).toBe(true);
    expect(gs[20].hasAttribute(ATTR)).toBe(true);
    cb([{ contentRect: { width: 0, height: 0 } }]);
    flushAll();
    expect(culledIds(culling)).toHaveLength(0);
  });

  it('jsdom without ResizeObserver still works through the getSize fallback', () => {
    const { bus, canvas } = setup();
    addRow(bus, 40);
    expect(canvas.getSize).not.toHaveBeenCalled(); // never read in a created handler
    flushAll();
    expect(canvas.getSize).toHaveBeenCalled();
  });

  it('destroy cancels the pending rAF, disconnects the RO, and a late callback is a no-op', () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(public c: (e: unknown[]) => void) {}
        observe() {
          this.c([{ contentRect: { width: 800, height: 600 } }]);
        }
        disconnect = disconnect;
      }
    );
    const { bus, culling, container } = setup();
    const gs = addRow(bus, 40);
    expect(rafQueue.length).toBe(1);
    bus.emit('d3canvas.destroy');
    expect(cancelled.length).toBe(1);
    expect(disconnect).toHaveBeenCalled();
    expect(container.hasAttribute('data-pfd-culling-idle')).toBe(false);
    rafQueue.forEach((cb) => cb()); // a late frame
    expect(gs.some((g) => g.hasAttribute(ATTR))).toBe(false);
    expect(culling.inspect().stats.passes).toBe(0);
  });

  it('d3canvas.clear changes nothing', () => {
    const { bus, culling } = setup();
    addRow(bus, 40);
    flushAll();
    const before = culledIds(culling);
    bus.emit('d3canvas.clear');
    flushAll();
    expect(culledIds(culling)).toEqual(before);
  });

  it('idle attribute: "false" synchronously on marking, "true" after drain, absent when inert', () => {
    const { bus, container, zoom } = setup();
    addRow(bus, 40);
    const idle = () => container.getAttribute('data-pfd-culling-idle');
    expect(idle()).toBe('false');
    flushAll();
    expect(idle()).toBe('true');
    pan(zoom, bus, -50);
    expect(idle()).toBe('false');
    flushAll();
    expect(idle()).toBe('true');
    const inert = setup({ culling: false });
    addRow(inert.bus, 40);
    expect(inert.container.hasAttribute('data-pfd-culling-idle')).toBe(false);
  });

  it('idle stays "false" while a backlog drains and flips on the last frame', () => {
    const { bus, container } = setup();
    addRow(bus, 9 + 3 * BUDGET + 2);
    flushFrame();
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('false');
    flushFrame();
    flushFrame();
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('false');
    flushAll();
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('true');
  });

  it('inspect().stats counts passes and the largest hide batch', () => {
    const { bus, culling } = setup();
    addRow(bus, 40);
    flushAll();
    const { passes, maxHides } = culling.inspect().stats;
    expect(passes).toBeGreaterThan(1);
    expect(maxHides).toBe(BUDGET);
  });
});

describe('Culling — label reveal-before-measure and CSS self-check (slice D)', () => {
  it('reveals a culled label before Outline measures it, then re-hides it off-screen', () => {
    const { bus, culling } = setup();
    addRow(bus, 40); // plain defs: Outline (moddle-only) is registered afterwards
    new Outline(bus); // registered AFTER Culling, as in the interactive modules
    const svg = select(document.body).append('svg');
    const sel = svg.append('g').attr('class', 'element');
    sel.append('title');
    const inner = sel.append('g').attr('class', 'innerElement').node() as SVGGElement;
    const g = sel.node() as SVGGElement;
    let attrAtMeasure = 'unset';
    (inner as unknown as { getBBox: () => unknown }).getBBox = () => {
      attrAtMeasure = g.closest('[data-pfd-transient]') ? 'hidden' : 'visible';
      return { width: 10, height: 10, x: 0, y: 0 };
    };
    const moddle = createPfdnModdle();
    const def = moddle.create('pfdn:Label', {
      id: 'L',
      position: moddle.create('pfdn:Coordinates', { x: 5000, y: 0 }),
      text: 'T',
      fontSize: 12
    }) as unknown as ModellingModelElement;
    bus.emit('label.created', sel as unknown as DrawingSelection, def);
    flushAll();
    expect(g.hasAttribute(ATTR)).toBe(true);

    bus.emit('label.updated', sel as unknown as DrawingSelection, def);
    expect(attrAtMeasure).toBe('visible');
    flushAll();
    expect(g.hasAttribute(ATTR)).toBe(true); // re-hidden: still off-screen
    expect(culling.inspect().slots.find((s) => s.id === 'L')!.culled).toBe(true);
  });

  it('node/zone updated do not remove the attribute', () => {
    const { bus } = setup();
    const gs = addRow(bus, 40);
    flushAll();
    const sel = { node: () => gs[30] } as unknown as DrawingSelection;
    bus.emit('node.updated', sel, { id: 'n30', position: { x: 3000, y: 0 }, size: 25 } as never);
    expect(gs[30].hasAttribute(ATTR)).toBe(true);
  });

  it('CSS missing after load: all attributes removed, culling off, exactly one warn', () => {
    displayOf = 'inline';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { bus, culling } = setup();
    const gs = addRow(bus, 40);
    flushAll();
    expect(gs.some((g) => g.hasAttribute(ATTR))).toBe(false);
    expect(culling.inspect().active).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('culling CSS not loaded; culling disabled');
  });

  it('CSS present: nothing changes and no warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { bus, culling } = setup();
    addRow(bus, 40);
    flushAll();
    expect(culledIds(culling).length).toBeGreaterThan(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('a failure before load keeps the attributes and re-checks on load', () => {
    displayOf = 'inline';
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { bus, culling } = setup();
    addRow(bus, 40);
    flushAll();
    expect(culledIds(culling).length).toBeGreaterThan(0);
    expect(warn).not.toHaveBeenCalled();
    displayOf = 'none';
    window.dispatchEvent(new Event('load'));
    flushAll();
    expect(culledIds(culling).length).toBeGreaterThan(0);
    expect(warn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------------------------
// Zoom-out LOD (plan Steps 4–6)
// ---------------------------------------------------------------------------------------------

const LOD = 'data-pfd-lod';
const CAP = 3;

/** One real zoom gesture: start → scale change → end (what d3-zoom emits). */
function gesture(zoom: Zoom, bus: Bus, scale: number): void {
  bus.emit('zoom.start');
  zoom.scale = scale;
  bus.emit('canvas.zoomed');
  bus.emit('zoom.end');
}

function addLink(bus: Bus, id: string, x: number, y = 0): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'element');
  g.append(
    document.createElementNS('http://www.w3.org/2000/svg', 'title'),
    document.createElementNS('http://www.w3.org/2000/svg', 'path')
  );
  document.body.appendChild(g);
  const def = {
    id,
    waypoint: [
      { x, y },
      { x: x + 50, y }
    ],
    lineWidth: 1
  } as unknown as ModellingModelElement;
  bus.emit('link.created', { node: () => g } as unknown as DrawingSelection, def);
  return g;
}

function addOther(bus: Bus, cls: 'label' | 'zone', id: string, x: number): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'element');
  g.append(document.createElementNS('http://www.w3.org/2000/svg', 'title'));
  document.body.appendChild(g);
  const def =
    cls === 'label'
      ? { id, position: { x, y: 0 }, text: 'T', fontSize: 12 }
      : { id, position: { x, y: 0 }, width: 40, height: 40 };
  bus.emit(`${cls}.created`, { node: () => g } as unknown as DrawingSelection, def as never);
  return g;
}

function select_(bus: Bus, culling: Culling, ids: string[]): void {
  void culling;
  const snap = ids.map((id) => ({ element: {} as never, definition: { id } as never }));
  bus.emit('selection.changed', [], snap);
}

function info(c: Culling, id: string) {
  return c.inspect().slots.find((s) => s.id === id)!;
}

describe('Culling — LOD slot state (Step 4)', () => {
  it('records the element class per slot and exposes exempt/hold', () => {
    const { bus, culling } = setup();
    addNode(bus, 'n', 0);
    addLink(bus, 'l', 0);
    addOther(bus, 'label', 'lb', 0);
    addOther(bus, 'zone', 'z', 0);
    const kinds = Object.fromEntries(culling.inspect().slots.map((x) => [x.id, x.kind]));
    expect(kinds).toEqual({ n: 'node', l: 'link', lb: 'label', z: 'zone' });
    expect(culling.inspect().slots.every((x) => !x.exempt && !x.hold)).toBe(true);
  });

  it('a removed id’s slot is reused with the NEW kind and clean flags', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    select_(bus, culling, ['n0']);
    expect(info(culling, 'n0').exempt).toBe(true);
    bus.emit('node.removed', {} as never, { id: 'n0' } as never);
    addOther(bus, 'label', 'fresh', 0); // takes n0's slot (LIFO)
    const s = info(culling, 'fresh');
    expect(s.kind).toBe('label');
    expect(s.exempt).toBe(false);
    expect(s.hold).toBe(false);
  });

  it('removed with a bare { id } clears LOD state without throwing', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    select_(bus, culling, ['n1']);
    expect(() => bus.emit('node.removed', {} as never, { id: 'n1' } as never)).not.toThrow();
    expect(culling.inspect().slots.find((x) => x.id === 'n1')).toBeUndefined();
  });
});

describe('Culling — LOD trigger, drain and synchronous exit (Step 5)', () => {
  it('turns ON only after the gesture ends, never mid-gesture', () => {
    const { bus, culling, zoom, container } = setup();
    addRow(bus, 30);
    flushAll();
    bus.emit('zoom.start');
    zoom.scale = 0.1;
    bus.emit('canvas.zoomed');
    flushAll();
    expect(container.getAttribute(LOD)).toBe('off');
    expect(culling.inspect().slots.some((x) => x.hold)).toBe(false);
    bus.emit('zoom.end');
    flushAll();
    expect(container.getAttribute(LOD)).toBe('on');
  });

  it('a programmatic zoom (canvas.zoomed only, no start/end) also arms LOD', () => {
    const { bus, zoom, container } = setup();
    addRow(bus, 30);
    zoom.scale = 0.1;
    bus.emit('canvas.zoomed');
    flushAll();
    expect(container.getAttribute(LOD)).toBe('on');
  });

  it('holds in-view nodes and links in ≤ HIDE_BUDGET batches, entering → on', () => {
    const { bus, culling, zoom, container } = setup();
    addRow(bus, 30);
    for (let i = 0; i < 6; i++) addLink(bus, `l${i}`, i * 100);
    flushAll();
    gesture(zoom, bus, 0.1);
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('false');
    flushFrame();
    expect(container.getAttribute(LOD)).toBe('entering');
    expect(culledIds(culling).length).toBeLessThanOrEqual(BUDGET * 2);
    flushAll();
    expect(container.getAttribute(LOD)).toBe('on');
    expect(container.getAttribute('data-pfd-culling-idle')).toBe('true');
    expect(culling.inspect().stats.maxHides).toBeLessThanOrEqual(BUDGET);
    const held = culling.inspect().slots.filter((x) => x.hold);
    expect(held).toHaveLength(36);
    expect(held.every((x) => x.culled)).toBe(true);
  });

  it('labels and zones are never held', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    addOther(bus, 'label', 'lb', 100);
    addOther(bus, 'zone', 'z', 100);
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(info(culling, 'lb').culled).toBe(false);
    expect(info(culling, 'z').culled).toBe(false);
    expect(info(culling, 'n3').culled).toBe(true);
  });

  it('a pan while ON does not reveal a held in-view node', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    pan(zoom, bus, -100);
    flushAll();
    expect(info(culling, 'n3').culled).toBe(true);
  });

  it('exit is synchronous: crossing above S_OFF reveals every in-view node with no flush', () => {
    const { bus, culling, zoom, container } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    zoom.scale = 0.5;
    bus.emit('canvas.zoomed'); // programmatic: no flush after this
    // scale 0.5 → viewport 1600 wide → n0..n15 in view
    for (let i = 0; i <= 15; i++) expect(info(culling, `n${i}`).culled).toBe(false);
    expect(container.getAttribute(LOD)).toBe('off');
  });

  it('exit is synchronous in the inert window too (below the activation threshold)', () => {
    const { bus, culling, zoom, container } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(culledIds(culling).length).toBe(30);
    for (let i = 0; i < 12; i++) bus.emit('node.removed', {} as never, { id: `n${i}` } as never);
    // 18 < CULL_MIN_ELEMENTS(20): inert
    zoom.scale = 0.5;
    bus.emit('canvas.zoomed');
    expect(culledIds(culling)).toEqual([]);
    expect(container.hasAttribute(LOD)).toBe(false);
  });

  it('hysteresis: between S_ON and S_OFF the state is sticky both ways', () => {
    const { bus, zoom, container } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.18); // never entered: stays off
    flushAll();
    expect(container.getAttribute(LOD)).toBe('off');
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(container.getAttribute(LOD)).toBe('on');
    gesture(zoom, bus, 0.18); // inside the band: stays on
    flushAll();
    expect(container.getAttribute(LOD)).toBe('on');
    gesture(zoom, bus, 0.21);
    expect(container.getAttribute(LOD)).toBe('off');
  });

  it('options.lod === false and culling === false keep LOD off', () => {
    const a = setup({ lod: false });
    addRow(a.bus, 30);
    gesture(a.zoom, a.bus, 0.1);
    flushAll();
    expect(a.container.getAttribute(LOD)).toBe('off');
    expect(culledIds(a.culling)).toEqual([]);
    const b = setup({ culling: false });
    addRow(b.bus, 30);
    gesture(b.zoom, b.bus, 0.1);
    flushAll();
    expect(b.container.hasAttribute(LOD)).toBe(false);
  });

  it('destroy removes the attributes and the listeners', () => {
    const { bus, container, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(container.hasAttribute(LOD)).toBe(true);
    bus.emit('d3canvas.destroy');
    expect(container.hasAttribute(LOD)).toBe(false);
    expect(container.hasAttribute('data-pfd-culling-idle')).toBe(false);
  });
});

describe('Culling — LOD exemptions (Step 6)', () => {
  it('a selected in-view node stays painted under LOD; deselecting re-holds it next frame', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(info(culling, 'n2').culled).toBe(true);
    select_(bus, culling, ['n2']); // synchronous reveal, no flush
    expect(info(culling, 'n2').culled).toBe(false);
    flushAll();
    expect(info(culling, 'n2').culled).toBe(false);
    select_(bus, culling, []);
    flushAll();
    expect(info(culling, 'n2').culled).toBe(true);
  });

  it('unknown / bare snapshot entries are ignored', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    expect(() =>
      bus.emit('selection.changed', [], [
        undefined,
        { definition: {} },
        { definition: { id: 'zz' } }
      ] as never)
    ).not.toThrow();
    expect(culling.inspect().slots.some((x) => x.exempt)).toBe(false);
  });

  it('first-N sticky admission in ascending slot order; newcomers do not evict', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    select_(bus, culling, ['n5', 'n3', 'n1', 'n2', 'n4']); // 5 wanted, cap 3 → n1,n2,n3
    flushAll();
    const exempt = () =>
      culling
        .inspect()
        .slots.filter((x) => x.exempt)
        .map((x) => x.id);
    expect(exempt()).toEqual(['n1', 'n2', 'n3']);
    select_(bus, culling, ['n0', 'n1', 'n2', 'n3']); // n0 is lower but n1..n3 are sticky
    expect(exempt()).toEqual(['n1', 'n2', 'n3']);
    select_(bus, culling, ['n0', 'n1', 'n2']); // n3 released → room → n0 promoted
    expect(exempt()).toEqual(['n0', 'n1', 'n2']);
  });

  it('select-all over the cap leaves exactly cap painted and LOD stays on', () => {
    const { bus, culling, zoom, container } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    select_(
      bus,
      culling,
      Array.from({ length: 30 }, (_, i) => `n${i}`)
    );
    flushAll();
    expect(culling.inspect().slots.filter((x) => !x.culled)).toHaveLength(CAP);
    expect(container.getAttribute(LOD)).toBe('on');
  });

  it('focus exempts the focused element and releases it on focusout', () => {
    const { bus, culling, zoom, container } = setup();
    const gs = addRow(bus, 30);
    gs.forEach((g, i) => {
      g.setAttribute('element-id', `n${i}`);
      container.append(g); // focus events bubble to the container listener
    });
    gesture(zoom, bus, 0.1);
    flushAll();
    gs[4].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(info(culling, 'n4').culled).toBe(false);
    expect(info(culling, 'n4').exempt).toBe(true);
    gs[6].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(info(culling, 'n4').exempt).toBe(false);
    expect(info(culling, 'n6').exempt).toBe(true);
    gs[6].dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flushAll();
    expect(info(culling, 'n6').exempt).toBe(false);
    expect(info(culling, 'n6').culled).toBe(true);
  });

  it('an element created while ON stays painted until the viewport changes', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    addNode(bus, 'new', 300);
    flushAll();
    expect(info(culling, 'new').culled).toBe(false);
    expect(info(culling, 'new').exempt).toBe(true);
    pan(zoom, bus, -10);
    flushAll();
    expect(info(culling, 'new').exempt).toBe(false);
    expect(info(culling, 'new').culled).toBe(true);
  });

  it('a reused slot never inherits SEL/FOCUS/FRESH from its previous element', () => {
    const { bus, culling, zoom } = setup();
    addRow(bus, 30);
    gesture(zoom, bus, 0.1);
    flushAll();
    addNode(bus, 'f', 300); // fresh
    select_(bus, culling, ['f']);
    expect(info(culling, 'f').exempt).toBe(true);
    bus.emit('node.removed', {} as never, { id: 'f' } as never);
    addNode(bus, 'g', 500); // reuses f's slot; created while ON ⇒ fresh, but NOT selected
    select_(bus, culling, []);
    pan(zoom, bus, -5);
    flushAll();
    expect(info(culling, 'g').exempt).toBe(false);
    expect(info(culling, 'g').culled).toBe(true);
  });
});

describe('Culling — LOD click resolver (Step 11)', () => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  type Emitted = { type: string; el: unknown; def: { id: string }; event: MouseEvent };

  /** Scale-0.1 LOD ON with a held row: world = client × 10, so n_i spans client x 10i..10i+2.5. */
  function lodScene(opts: { links?: boolean } = {}) {
    const ctx = setup();
    const { bus, zoom } = ctx;
    // 25 nodes far below the click area keep the diagram active (>= CULL_MIN_ELEMENTS)
    for (let i = 0; i < 25; i++) addNode(bus, `f${i}`, i * 100, 5000);
    if (opts.links) {
      addLink(bus, 'l0', 1000, 1000); // (1000,1000) → (1050,1000)
      addLink(bus, 'l1', 1000, 1000); // coincident: tie → lowest slot
    } else {
      addNode(bus, 'a', 300, 0);
      addNode(bus, 'b', 300, 0); // coincident: tie → lowest slot
    }
    gesture(zoom, bus, 0.1);
    flushAll();
    const emitted: Emitted[] = [];
    for (const t of ['click', 'dblclick'] as const) {
      for (const cls of ['node', 'link', 'label', 'zone'] as const) {
        (bus as unknown as { on(e: string, fn: (...a: unknown[]) => void): void }).on(
          `${cls}.${t}`,
          (el, def, event) =>
            emitted.push({
              type: `${cls}.${t}`,
              el,
              def: def as { id: string },
              event: event as MouseEvent
            })
        );
      }
    }
    return { ...ctx, emitted };
  }

  function fire(
    target: Element,
    type: 'click' | 'dblclick',
    x: number,
    y: number,
    init: MouseEventInit = {}
  ): MouseEvent {
    const ev = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      detail: type === 'dblclick' ? 2 : 1,
      ...init
    });
    target.dispatchEvent(ev);
    return ev;
  }

  const group = (cls: string, parent: Element): SVGGElement => {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', `${cls} element`);
    parent.appendChild(g);
    return g;
  };

  it('a click on a hidden node is dispatched as node.click with the original event', () => {
    const { svg, emitted } = lodScene();
    const ev = fire(svg, 'click', 31, 1, { ctrlKey: true }); // world (310, 10) → inside a/b
    expect(emitted).toHaveLength(1);
    expect(emitted[0].type).toBe('node.click');
    expect(emitted[0].event).toBe(ev); // ctrl/meta modifiers survive for Selection
    expect(emitted[0].event.ctrlKey).toBe(true);
  });

  it('ties break on the lowest slot', () => {
    const { svg, emitted } = lodScene();
    fire(svg, 'click', 31, 1);
    expect(emitted[0].def.id).toBe('a');
  });

  it('ranks overlapping candidates by distance to the centre, not by slot', () => {
    const ctx = setup();
    for (let i = 0; i < 25; i++) addNode(ctx.bus, `f${i}`, i * 100, 5000);
    addNode(ctx.bus, 'near', 300, 0); // lower slot, centre (312.5, 12.5)
    addNode(ctx.bus, 'far', 320, 0); // higher slot, centre (332.5, 12.5)
    gesture(ctx.zoom, ctx.bus, 0.1);
    flushAll();
    const picked: string[] = [];
    ctx.bus.on('node.click', ((_el: unknown, def: { id: string }) => picked.push(def.id)) as never);
    fire(ctx.svg, 'click', 32.8, 1.2); // world (328, 12): 4.5 from 'far', 15.5 from 'near'
    expect(picked).toEqual(['far']);
  });

  it('dblclick emits node.dblclick and never stops propagation', () => {
    const { svg, emitted, container } = lodScene();
    const after = vi.fn();
    svg.addEventListener('dblclick', after); // a bubble listener below the capture resolver
    const stop = vi.spyOn(Event.prototype, 'stopPropagation');
    const stopImm = vi.spyOn(Event.prototype, 'stopImmediatePropagation');
    fire(svg, 'dblclick', 31, 1);
    expect(emitted.map((e) => e.type)).toEqual(['node.dblclick']);
    expect(after).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
    expect(stopImm).not.toHaveBeenCalled();
    void container;
  });

  it('a hidden link within tolerance is picked; a node beats a link', () => {
    const { svg, emitted } = lodScene({ links: true });
    // link at world y=1000 → client y=100; tolerance 4px = 40 world units: 1 px off the line
    fire(svg, 'click', 102, 101);
    expect(emitted.map((e) => e.type)).toEqual(['link.click']);
    expect(emitted[0].def.id).toBe('l0');
  });

  it('a miss is left to native dispatch (nothing emitted)', () => {
    const { svg, emitted } = lodScene();
    fire(svg, 'click', 500, 300);
    expect(emitted).toEqual([]);
  });

  it('synthesised clicks (detail 0) are left native', () => {
    const { svg, emitted } = lodScene();
    fire(svg, 'click', 31, 1, { detail: 0 });
    expect(emitted).toEqual([]);
  });

  it('a click whose target is a held <g> or a visible node/label stays native', () => {
    const { svg, emitted } = lodScene();
    fire(group('nodeItem', svg), 'click', 31, 1);
    fire(group('labelItem', svg), 'click', 31, 1);
    fire(group('linkItem', svg), 'click', 31, 1);
    expect(emitted).toEqual([]);
  });

  it('zones are transparent: a click on a zone resolves the hidden node under it', () => {
    const { svg, emitted } = lodScene();
    fire(group('zoneItem', svg), 'click', 31, 1);
    expect(emitted.map((e) => e.type)).toEqual(['node.click']);
  });

  it('ignores clicks while the link tool is active', () => {
    const { svg, emitted, rootClasses } = lodScene();
    rootClasses.add('cursor-add-link');
    fire(svg, 'click', 31, 1);
    expect(emitted).toEqual([]);
  });

  it('does nothing when LOD is off (scale above S_OFF) or culling is inert', () => {
    const a = lodScene();
    gesture(a.zoom, a.bus, 0.5);
    flushAll();
    fire(a.svg, 'click', 31, 1);
    expect(a.emitted).toEqual([]);

    const b = setup();
    addRow(b.bus, 10); // below the activation threshold: inert
    gesture(b.zoom, b.bus, 0.1);
    flushAll();
    const spy = vi.fn();
    b.bus.on('node.click', spy);
    fire(b.svg, 'click', 31, 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('destroy removes the resolver listeners', () => {
    const { svg, emitted, bus } = lodScene();
    bus.emit('d3canvas.destroy');
    fire(svg, 'click', 31, 1);
    expect(emitted).toEqual([]);
  });
});
