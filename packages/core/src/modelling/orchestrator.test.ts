import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { Modelling, type ElementClass, type MutatingAction } from './Modelling';
import type { ModellingElement } from './ModellingElement';
import type { ModellingModelElement } from './types';
import type { CommandStack } from '../command';

interface SpyHandler {
  saveToModel: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  reconcile: ReturnType<typeof vi.fn>;
}

function spyHandler(): SpyHandler {
  return { saveToModel: vi.fn(), delete: vi.fn(), reconcile: vi.fn() };
}

/** A command-stack double capturing registrations and dispatches. */
function fakeCommandStack(): CommandStack {
  return { registerHandler: vi.fn(), execute: vi.fn() } as unknown as CommandStack;
}

describe('@d3-polytree/core modelling orchestrator', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let moddle: ReturnType<typeof createPfdnModdle>;
  let definitions: ModellingModelElement;
  let handlers: Record<ElementClass, SpyHandler>;
  let commandStack: CommandStack;
  let modelling: Modelling;

  beforeEach(() => {
    bus = new EventEmitter<DiagramEventMap>();
    moddle = createPfdnModdle();
    definitions = moddle.create('pfdn:Diagram', {}) as unknown as ModellingModelElement;
    handlers = { node: spyHandler(), label: spyHandler(), zone: spyHandler(), link: spyHandler() };
    commandStack = fakeCommandStack();
    modelling = new Modelling(
      bus,
      definitions,
      handlers.node as unknown as ModellingElement,
      handlers.label as unknown as ModellingElement,
      handlers.zone as unknown as ModellingElement,
      handlers.link as unknown as ModellingElement,
      commandStack
    );
  });

  it('registers the modelling commands on the stack at construction', () => {
    const registered = (
      commandStack.registerHandler as unknown as { mock: { calls: string[][] } }
    ).mock.calls.map((c) => c[0]);
    expect(registered).toEqual(
      expect.arrayContaining([
        'element.create',
        'element.delete',
        'elements.delete',
        'element.resize',
        'element.move'
      ])
    );
  });

  it('no longer mutates the model on draw-layer .created / .deleted (they are notifications)', () => {
    // Post-O11 the events stay for observers, but model mutation rides commands.
    bus.emit('node.created', {}, {});
    bus.emit('node.deleted', {}, {});
    expect(handlers.node.saveToModel).not.toHaveBeenCalled();
    expect(handlers.node.delete).not.toHaveBeenCalled();
  });

  it('routes element.updated to the handler for the element local name', () => {
    const node = moddle.create('pfdn:Node', { id: 'N1' }) as unknown as ModellingModelElement;
    bus.emit('element.updated', 'N1', node);
    expect(handlers.node.reconcile).toHaveBeenCalledWith('N1', node);
    expect(handlers.label.reconcile).not.toHaveBeenCalled();
  });

  it('turns a selection-delete intent into one composite elements.delete command', () => {
    const a = moddle.create('pfdn:Node', { id: 'A' }) as unknown as ModellingModelElement;
    const b = moddle.create('pfdn:Node', { id: 'B' }) as unknown as ModellingModelElement;
    bus.emit('elements.delete', [{ definition: a }, { definition: b }]);

    expect(commandStack.execute).toHaveBeenCalledTimes(1);
    const [command, ctx] = (commandStack.execute as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0] as [
      string,
      { items: Array<{ def: ModellingModelElement; className: string }> }
    ];
    expect(command).toBe('elements.delete');
    expect(ctx.items).toEqual([
      { def: a, className: 'node' },
      { def: b, className: 'node' }
    ]);
  });

  it('doAction (deprecated shim) still delegates and returns null for an unknown class', () => {
    expect(modelling.doAction('mystery', 'saveToModel' as MutatingAction, [])).toBeNull();
  });
});
