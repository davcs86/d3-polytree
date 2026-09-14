import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { Modelling, type ElementClass, type MutatingAction } from './Modelling';
import type { ModellingElement } from './ModellingElement';
import type { ModellingModelElement } from './types';

interface SpyHandler {
  saveToModel: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  reconcile: ReturnType<typeof vi.fn>;
}

function spyHandler(): SpyHandler {
  return { saveToModel: vi.fn(), delete: vi.fn(), reconcile: vi.fn() };
}

describe('@d3-polytree/core modelling orchestrator', () => {
  let bus: EventEmitter;
  let moddle: ReturnType<typeof createPfdnModdle>;
  let definitions: ModellingModelElement;
  let handlers: Record<ElementClass, SpyHandler>;
  let modelling: Modelling;

  beforeEach(() => {
    bus = new EventEmitter();
    moddle = createPfdnModdle();
    definitions = moddle.create('pfdn:Diagram', {}) as unknown as ModellingModelElement;
    handlers = { node: spyHandler(), label: spyHandler(), zone: spyHandler(), link: spyHandler() };
    modelling = new Modelling(
      bus,
      definitions,
      handlers.node as unknown as ModellingElement,
      handlers.label as unknown as ModellingElement,
      handlers.zone as unknown as ModellingElement,
      handlers.link as unknown as ModellingElement
    );
  });

  const created: Array<[string, ElementClass]> = [
    ['label.created', 'label'],
    ['link.created', 'link'],
    ['node.created', 'node'],
    ['zone.created', 'zone']
  ];
  const deleted: Array<[string, ElementClass]> = [
    ['label.deleted', 'label'],
    ['link.deleted', 'link'],
    ['node.deleted', 'node'],
    ['zone.deleted', 'zone']
  ];

  it.each(created)('routes %s to the %s handler saveToModel', (event, cls) => {
    const element = {};
    const definition = {};
    bus.emit(event, element, definition);
    expect(handlers[cls].saveToModel).toHaveBeenCalledWith(element, definition);
    expect(handlers[cls].delete).not.toHaveBeenCalled();
  });

  it.each(deleted)('routes %s to the %s handler delete', (event, cls) => {
    const element = {};
    const definition = {};
    bus.emit(event, element, definition);
    expect(handlers[cls].delete).toHaveBeenCalledWith(element, definition);
    expect(handlers[cls].saveToModel).not.toHaveBeenCalled();
  });

  it('routes element.updated to the handler for the element local name', () => {
    const node = moddle.create('pfdn:Node', { id: 'N1' }) as unknown as ModellingModelElement;
    bus.emit('element.updated', 'N1', node);
    expect(handlers.node.reconcile).toHaveBeenCalledWith('N1', node);
    expect(handlers.label.reconcile).not.toHaveBeenCalled();
  });

  it('doAction returns null for an unknown element class', () => {
    expect(modelling.doAction('mystery', 'saveToModel' as MutatingAction, [])).toBeNull();
  });

  it('drives a real handler: node.created persists into the definition list', () => {
    const realBus = new EventEmitter();
    const added: ModellingModelElement[] = [];
    // a minimal real-shaped handler exercising the base saveToModel path
    const nodeHandler = {
      saveToModel(_el: unknown, def: ModellingModelElement) {
        (definitions.get('node') as ModellingModelElement[]).push(def);
        added.push(def);
      },
      delete: vi.fn(),
      reconcile: vi.fn()
    } as unknown as ModellingElement;

    new Modelling(
      realBus,
      definitions,
      nodeHandler,
      handlers.label as unknown as ModellingElement,
      handlers.zone as unknown as ModellingElement,
      handlers.link as unknown as ModellingElement
    );

    const node = moddle.create('pfdn:Node', { id: 'N9' }) as unknown as ModellingModelElement;
    realBus.emit('node.created', {}, node);

    expect(added).toContain(node);
    expect(definitions.get('node')).toContain(node);
  });
});
