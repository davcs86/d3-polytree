import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { DrawingRegistry, type BaseElement } from '../draw';
import type { NotificationParams, NotificationService } from '../features/notifications';
import { ModellingLabels } from './Labels';
import { ModellingNodes } from './Nodes';
import { ModellingZones } from './Zones';
import type { ModellingModelElement } from './types';

/** A drawer double that records the definitions reconciled through it. */
class RecordingDrawer {
  readonly calls: Array<[string, ModellingModelElement | undefined]> = [];
  reconcile(id: string, definition: ModellingModelElement | undefined): void {
    this.calls.push([id, definition]);
  }
}

/** A notifications double that captures the last error raised. */
class CapturingNotifications implements NotificationService {
  lastError: NotificationParams | null = null;
  info(): void {}
  success(): void {}
  warning(): void {}
  error(params: NotificationParams): void {
    this.lastError = params;
  }
  notify(): void {}
}

function drawer(): { drawer: BaseElement; recorder: RecordingDrawer } {
  const recorder = new RecordingDrawer();
  return { drawer: recorder as unknown as BaseElement, recorder };
}

describe('@d3-polytree/core modelling handlers', () => {
  let moddle: ReturnType<typeof createPfdnModdle>;
  let definitions: ModellingModelElement;
  let registry: DrawingRegistry;
  let bus: EventEmitter;
  let notes: CapturingNotifications;

  beforeEach(() => {
    moddle = createPfdnModdle();
    definitions = moddle.create('pfdn:Diagram', {}) as unknown as ModellingModelElement;
    registry = new DrawingRegistry();
    bus = new EventEmitter();
    notes = new CapturingNotifications();
  });

  it('creates a label, naming it after its id and rendering it', () => {
    const { drawer: d, recorder } = drawer();
    const labels = new ModellingLabels(definitions, moddle, registry, notes, bus, d);

    const label = labels.create({ position: { x: 4, y: 8 } });

    expect(label.$type).toBe('pfdn:Label');
    expect(label.status).toBe(1);
    expect(label.text).toBe(label.id);
    // reconciled once to render, once after naming
    expect(recorder.calls).toHaveLength(2);
    expect(recorder.calls[1][0]).toBe(label.id);
  });

  it('creates a node together with a read-only associated label', () => {
    const labelDrawer = drawer();
    const nodeDrawer = drawer();
    const labels = new ModellingLabels(definitions, moddle, registry, notes, bus, labelDrawer.drawer);
    const nodes = new ModellingNodes(
      definitions,
      moddle,
      registry,
      notes,
      bus,
      nodeDrawer.drawer,
      labels
    );

    const node = nodes.create({ type: 'task', position: { x: 10, y: 20 } });

    expect(node.$type).toBe('pfdn:Node');
    expect(node.type).toBe('task');
    expect(node.size).toBe(25);

    const label = node.label as ModellingModelElement;
    expect(label.$type).toBe('pfdn:Label');
    expect(label.isReadOnly).toBe(true);
    expect(label.text).toBe(node.id);
    // label sits below the node: y + size + gap
    expect((label.position as { x: number; y: number }).y).toBe(20 + 25 + 15);
    expect(nodeDrawer.recorder.calls[0][0]).toBe(node.id);
  });

  it('persists created elements into the diagram definition list', () => {
    const { drawer: d } = drawer();
    const labels = new ModellingLabels(definitions, moddle, registry, notes, bus, d);
    const nodes = new ModellingNodes(definitions, moddle, registry, notes, bus, d, labels);

    const node = nodes.create({});
    nodes.saveToModel(null, node);

    expect(definitions.get('node')).toContain(node);
  });

  it('cascades label deletion when deleting a node that owns a label', () => {
    const { drawer: d, recorder } = drawer();
    const labels = new ModellingLabels(definitions, moddle, registry, notes, bus, d);
    const nodes = new ModellingNodes(definitions, moddle, registry, notes, bus, d, labels);

    const node = nodes.create({});
    let cascaded: ModellingModelElement | undefined;
    bus.on('label.deleted', (_el: unknown, def: ModellingModelElement) => {
      cascaded = def;
    });

    recorder.calls.length = 0;
    nodes.delete(null, node);

    expect(cascaded).toBe(node.label);
    expect((node.label as ModellingModelElement).isReadOnly).toBe(false);
    expect(node.status).toBe(3);
    // the node's drawing is removed (reconciled with no definition)
    expect(recorder.calls.at(-1)).toEqual([node.id, undefined]);
  });

  it('refuses to delete a read-only associated label directly', () => {
    const { drawer: d, recorder } = drawer();
    const labels = new ModellingLabels(definitions, moddle, registry, notes, bus, d);

    const label = labels.create({});
    label.isReadOnly = true;
    recorder.calls.length = 0;

    labels.delete(null, label);

    expect(notes.lastError).not.toBeNull();
    expect(notes.lastError?.title).toBe('Not allowed!');
    expect(recorder.calls).toHaveLength(0);
  });

  it('zone creation is a no-op placeholder (source parity)', () => {
    const { drawer: d } = drawer();
    const zones = new ModellingZones(definitions, registry, notes, bus, d);
    expect(zones.create()).toBeNull();
  });
});
