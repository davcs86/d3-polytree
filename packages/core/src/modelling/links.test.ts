import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { DrawingRegistry, type BaseElement, type DiagramElement, type DrawingSelection } from '../draw';
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
  let bus: EventEmitter;
  let labels: ModellingLabels;
  let linksDrawer: FakeLinksDrawer;
  let links: ModellingLinks;

  beforeEach(() => {
    moddle = createPfdnModdle();
    definitions = moddle.create('pfdn:Diagram', {}) as unknown as ModellingModelElement;
    registry = new DrawingRegistry();
    bus = new EventEmitter();
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

  it('re-routes attached links when a node moves', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 200, 0);
    drawNode(a);
    drawNode(b);

    const link = links.create(a, b);
    const before = link.waypoint as Array<{ x: number; y: number }>;
    const lastBefore = before[before.length - 1].x;

    // move the target further right and fire the movement event
    (b.position as { x: number; y: number }).x = 320;
    bus.emit('node.moved', undefined, b);

    const after = link.waypoint as Array<{ x: number; y: number }>;
    const lastAfter = after[after.length - 1].x;
    expect(lastAfter).toBeGreaterThan(lastBefore);
  });

  it('skips routing for a link with a missing endpoint', () => {
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 100, 100);
    drawNode(a);
    drawNode(b);
    const link = links.create(a, b);

    // detach the target reference and re-route: must not throw
    link.target = undefined;
    expect(() => links.updateNodeLinks(undefined, a)).not.toThrow();
  });
});
