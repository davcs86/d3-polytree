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
  HIDE_BUDGET: 5
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

function setup(opts: { culling?: boolean; zoom?: Zoom | undefined; size?: [number, number] } = {}) {
  const bus = new EventEmitter<DiagramEventMap>();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const [w, h] = opts.size ?? [800, 600];
  const canvas = {
    getContainer: () => container,
    getSize: vi.fn(() => ({ width: w, height: h }))
  } as unknown as Canvas;
  const zoom: Zoom | undefined = 'zoom' in opts ? opts.zoom : { scale: 1, offset: { x: 0, y: 0 } };
  const culling = new Culling(
    canvas,
    bus,
    { options: opts.culling === undefined ? {} : { culling: opts.culling } },
    zoom as never
  );
  return { bus, container, canvas, zoom: zoom as Zoom, culling };
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
