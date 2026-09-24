import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas, ElementRegistry, ElementBuilder } from '@d3-polytree/canvas';
import { BaseElement } from './BaseElement';
import { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement, DrawingSelection } from './types';

// Minimal moddle-like definition with get/set backed by a Map.
function makeDef(id: string, attrs: Record<string, unknown> = {}): DiagramElement {
  const store = new Map<string, unknown>(Object.entries(attrs));
  return {
    id,
    get: (name: string) => store.get(name),
    set: (name: string, value: unknown) => {
      store.set(name, value);
    }
  } as DiagramElement;
}

class TestElement extends BaseElement {
  protected _createElement(elem: DrawingSelection): void {
    elem.append('rect');
  }
  protected _updateElement(elem: DrawingSelection): void {
    elem.select('rect').attr('data-updated', 'true');
  }
}

function build(items?: DiagramElement[]) {
  const bus = new EventEmitter<DiagramEventMap>();
  const canvas = new Canvas({ container: document.body }, bus);
  const elementRegistry = new ElementRegistry();
  const elementBuilder = new ElementBuilder(elementRegistry);
  const drawingRegistry = new DrawingRegistry();
  const el = new TestElement(
    'node',
    items,
    canvas,
    bus,
    elementBuilder,
    elementRegistry,
    drawingRegistry
  );
  return { el, bus, drawingRegistry };
}

describe('BaseElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders initial items into a container', () => {
    const { el, drawingRegistry } = build([makeDef('n1'), makeDef('n2')]);
    expect(el.getContainer()?.attr('class')).toBe('node-group');
    expect(el.getAll()).toHaveLength(2);
    expect(drawingRegistry.get('n1')).not.toBe(false);
    // the concrete subclass appended a <rect> inside the drawing
    expect((drawingRegistry.get('n1') as DrawingSelection).select('rect').empty()).toBe(false);
  });

  it('emits created / updated / removed on the event bus', () => {
    const { el, bus } = build();
    const events: string[] = [];
    bus.on('node.created', () => events.push('created'));
    bus.on('node.updated', () => events.push('updated'));
    bus.on('node.removed', () => events.push('removed'));

    const def = makeDef('n1');
    el.appendElement(def);
    el.updateElement(def);
    el.removeElementById('n1');

    expect(events).toEqual(['created', 'updated', 'removed']);
  });

  it('writes a <title>/<desc> accessible name into each element <g> (C2)', () => {
    const { drawingRegistry } = build([makeDef('n1', { name: 'Alpha' })]);
    const g = drawingRegistry.get('n1') as DrawingSelection;
    expect(g.select('title').text()).toBe('node: Alpha');
    expect(g.select('desc').text()).toBe('n1');
    // the concrete drawing (a <rect>) is still present and selectable
    expect(g.select('rect').empty()).toBe(false);
  });

  it('removeElementById detaches the drawing', () => {
    const { el, drawingRegistry } = build([makeDef('n1')]);
    el.removeElementById('n1');
    expect(drawingRegistry.get('n1')).toBe(false);
    expect(el.getAll()).toHaveLength(0);
  });
});
