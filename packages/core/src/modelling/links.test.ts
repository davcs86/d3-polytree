import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import {
  DrawingRegistry,
  type BaseElement,
  type DiagramElement,
  type DrawingSelection
} from '../draw';
import type { NotificationService } from '../features/notifications';
import { ModellingLabels } from './Labels';
import { ModellingLinks } from './Links';
import type { ModellingModelElement } from './types';

/**
 * A drawer double that mirrors the real draw layer's contract the handler
 * relies on: it mints an id for a def that lacks one (the real
 * `appendElement`/`claimId` does this), records it, and reflects it into the
 * drawing registry.
 */
class FakeLinksDrawer {
  readonly defs = new Map<string, ModellingModelElement>();
  private _seq = 0;
  constructor(private readonly registry: DrawingRegistry) {}
  reconcile(_id: string, definition: ModellingModelElement | undefined): void {
    if (!definition) {
      return;
    }
    if (!definition.id) {
      definition.id = `link_${++this._seq}`;
    }
    this.defs.set(definition.id, definition);
    this.registry.set(definition.id, {} as unknown as DrawingSelection);
  }
  updateElement(definition: ModellingModelElement): void {
    if (!definition.id) {
      return;
    }
    this.defs.set(definition.id, definition);
    this.registry.set(definition.id, {} as unknown as DrawingSelection);
  }
  getAll(): DiagramElement[] {
    return [...this.defs.values()] as unknown as DiagramElement[];
  }
}

class NoopNotifications implements NotificationService {
  info(): void {}
  success(): void {}
  warning(): void {}
  error(): void {}
  notify(): void {}
}

function node(
  moddle: ReturnType<typeof createPfdnModdle>,
  id: string,
  x: number,
  y: number
): ModellingModelElement {
  const position = moddle.create('pfdn:Coordinates', { x, y });
  return moddle.create('pfdn:Node', {
    id,
    position,
    status: 1
  }) as unknown as ModellingModelElement;
}

describe('@d3-polytree/core modelling link handler', () => {
  let moddle: ReturnType<typeof createPfdnModdle>;
  let definitions: ModellingModelElement;
  let registry: DrawingRegistry;
  let bus: EventEmitter<DiagramEventMap>;
  let labels: ModellingLabels;
  let linksDrawer: FakeLinksDrawer;
  let links: ModellingLinks;

  beforeEach(() => {
    moddle = createPfdnModdle();
    definitions = moddle.create('pfdn:Diagram', {}) as unknown as ModellingModelElement;
    registry = new DrawingRegistry();
    bus = new EventEmitter<DiagramEventMap>();
    const notes = new NoopNotifications();
    const labelDrawer = {
      reconcile: () => {}
    } as unknown as BaseElement;
    labels = new ModellingLabels(definitions, moddle, registry, notes, bus, labelDrawer);
    linksDrawer = new FakeLinksDrawer(registry);
    links = new ModellingLinks(
      definitions,
      moddle,
      linksDrawer as unknown as BaseElement,
      bus,
      registry,
      notes,
      labels
    );
  });

  function drawNode(n: ModellingModelElement): void {
    registry.set(n.id as string, {} as unknown as DrawingSelection);
  }

  it('creates a link with an orthogonally-routed path and a read-only label', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 200, 0);
    drawNode(a);
    drawNode(b);

    const link = links.create(a, b);

    expect(link.$type).toBe('pfdn:Link');
    expect(link.source).toBe(a);
    expect(link.target).toBe(b);
    expect(linksDrawer.defs.get(link.id as string)).toBe(link);

    const waypoints = link.waypoint as Array<{ x: number; y: number }>;
    expect(waypoints.length).toBeGreaterThanOrEqual(2);
    expect(waypoints.length).toBeLessThanOrEqual(4);

    const label = link.label as ModellingModelElement;
    expect(label.$type).toBe('pfdn:Label');
    expect(label.isReadOnly).toBe(true);
    expect(label.text).toBe(link.id);
  });

  it('re-routes every link once per committed transaction (commandStack.changed)', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 200, 0);
    drawNode(a);
    drawNode(b);

    const link = links.create(a, b);
    const before = link.waypoint as Array<{ x: number; y: number }>;
    const lastBefore = before[before.length - 1].x;

    // move the target further right and commit — the single reroute writer runs
    // on commandStack.changed, not on any per-node event.
    (b.position as { x: number; y: number }).x = 320;
    bus.emit('commandStack.changed', { canUndo: true, canRedo: false });

    const after = link.waypoint as Array<{ x: number; y: number }>;
    const lastAfter = after[after.length - 1].x;
    expect(lastAfter).toBeGreaterThan(lastBefore);
  });

  it('leaves a pinned link untouched on reroute (degrade to stored polyline)', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 200, 0);
    drawNode(a);
    drawNode(b);

    const link = links.create(a, b);
    bus.emit('commandStack.changed', { canUndo: true, canRedo: false }); // initial route
    link.set('pinned', true);
    const pinnedWaypoints = link.waypoint as Array<{ x: number; y: number }>;
    const snapshot = pinnedWaypoints.map((p) => ({ x: p.x, y: p.y }));

    // move the target and commit again — a pinned link must NOT be recomputed.
    (b.position as { x: number; y: number }).x = 500;
    bus.emit('commandStack.changed', { canUndo: true, canRedo: false });

    const now = link.waypoint as Array<{ x: number; y: number }>;
    expect(now.map((p) => ({ x: p.x, y: p.y }))).toEqual(snapshot);
  });

  it('does not reroute on a bare off-stack node event (architecture guard for O11)', () => {
    // C4's reroute completeness depends on every routing-input mutation flowing
    // through the command stack (O11). A bare node.updated NOT wrapped in a
    // command must therefore NOT reroute — this guard fails loudly if a future
    // change re-introduces an off-stack reroute trigger.
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 200, 0);
    drawNode(a);
    drawNode(b);
    const link = links.create(a, b);
    bus.emit('commandStack.changed', { canUndo: true, canRedo: false });
    const snapshot = (link.waypoint as Array<{ x: number; y: number }>).map((p) => ({
      x: p.x,
      y: p.y
    }));

    (b.position as { x: number; y: number }).x = 900;
    bus.emit('node.updated', {} as unknown as DrawingSelection, b);

    expect(
      (link.waypoint as Array<{ x: number; y: number }>).map((p) => ({ x: p.x, y: p.y }))
    ).toEqual(snapshot);
  });

  it('skips routing for a link with a missing endpoint without throwing', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 100, 100);
    drawNode(a);
    drawNode(b);
    const link = links.create(a, b);

    // detach the target reference and re-route: must not throw
    link.target = undefined;
    expect(() => links.rerouteAll()).not.toThrow();
  });
});
