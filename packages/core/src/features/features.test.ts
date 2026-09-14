import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { MouseEvents } from './mouseEvents';
import { Selection } from './selection';

/** A d3-selection double recording event listeners and class toggles. */
class FakeSelection {
  readonly handlers = new Map<string, (event: Event) => void>();
  readonly classes = new Set<string>();
  on(kind: string, fn: (event: Event) => void): this {
    this.handlers.set(kind, fn);
    return this;
  }
  classed(name: string, value: boolean): this {
    if (value) this.classes.add(name);
    else this.classes.delete(name);
    return this;
  }
  fire(kind: string, event: Event): void {
    this.handlers.get(kind)?.(event);
  }
}

function sel(): FakeSelection {
  return new FakeSelection();
}

describe('@d3-polytree/core MouseEvents', () => {
  let bus: EventEmitter;
  let moddle: ReturnType<typeof createPfdnModdle>;

  beforeEach(() => {
    bus = new EventEmitter();
    moddle = createPfdnModdle();
    new MouseEvents(bus);
  });

  it('re-emits DOM events on created elements as <localName>.<kind>', () => {
    const el = sel();
    const def = moddle.create('pfdn:Node', { id: 'N1' }) as unknown as ModellingModelElement;
    const clickSpy = vi.fn();
    bus.on('node.click', clickSpy);

    bus.emit('node.created', el as unknown as DrawingSelection, def);
    expect(el.handlers.size).toBe(9);

    const event = { type: 'click' } as unknown as Event;
    el.fire('click', event);
    expect(clickSpy).toHaveBeenCalledWith(el, def, event);
  });
});

describe('@d3-polytree/core Selection', () => {
  let bus: EventEmitter;
  let moddle: ReturnType<typeof createPfdnModdle>;
  let selection: Selection;

  beforeEach(() => {
    bus = new EventEmitter();
    moddle = createPfdnModdle();
    selection = new Selection(bus);
  });

  function node(id: string): ModellingModelElement {
    return moddle.create('pfdn:Node', { id }) as unknown as ModellingModelElement;
  }

  it('selects a clicked element and marks it selected', () => {
    const el = sel();
    const def = node('N1');
    const changed = vi.fn();
    bus.on('selection.changed', changed);

    bus.emit('node.click', el as unknown as DrawingSelection, def, {});

    expect(el.classes.has('selected')).toBe(true);
    expect(selection.getSelectedElements().map((e) => e.definition)).toEqual([def]);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('ctrl-click extends the selection; a plain click replaces it', () => {
    const a = sel();
    const b = sel();
    const c = sel();
    const defA = node('A');
    const defB = node('B');
    const defC = node('C');

    bus.emit('node.click', a as unknown as DrawingSelection, defA, {});
    bus.emit('node.click', b as unknown as DrawingSelection, defB, { ctrlKey: true });
    expect(selection.getSelectedElements()).toHaveLength(2);

    bus.emit('node.click', c as unknown as DrawingSelection, defC, {});
    expect(selection.getSelectedElements().map((e) => e.definition)).toEqual([defC]);
    expect(a.classes.has('selected')).toBe(false);
    expect(b.classes.has('selected')).toBe(false);
  });

  it('clears the selection on background.click', () => {
    bus.emit('node.click', sel() as unknown as DrawingSelection, node('N1'), {});
    bus.emit('background.click');
    expect(selection.getSelectedElements()).toHaveLength(0);
  });

  it('deleteSelected emits <localName>.deleted for each and clears', () => {
    const el = sel();
    const def = node('N1');
    bus.emit('node.click', el as unknown as DrawingSelection, def, {});

    const deleted = vi.fn();
    bus.on('node.deleted', deleted);

    selection.deleteSelected();

    expect(deleted).toHaveBeenCalledWith(el, def);
    expect(el.classes.has('selected')).toBe(false);
    expect(selection.getSelectedElements()).toHaveLength(0);
  });
});
