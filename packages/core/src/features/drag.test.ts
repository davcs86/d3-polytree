import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { select, type Selection as D3Selection } from 'd3-selection';
import { Canvas } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { DrawingRegistry, type DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { Selection } from './selection';
import { Drag } from './drag';
import type { CommandStack } from '../command';
import type { MoveContext } from '../modelling/commands';

/** A real `<g>` element positioned at (x, y). */
function drawing(x: number, y: number): D3Selection<SVGGElement, unknown, null, undefined> {
  const g = select(document.body).append('svg').append('g');
  g.attr('x', x).attr('y', y);
  return g as unknown as D3Selection<SVGGElement, unknown, null, undefined>;
}

function setup() {
  const bus = new EventEmitter();
  const canvas = new Canvas({ container: document.body }, bus);
  const registry = new DrawingRegistry();
  const selection = new Selection(bus);
  const commandStack = { execute: vi.fn() } as unknown as CommandStack;
  const drag = new Drag(canvas, bus, registry, selection, commandStack);
  const moddle = createPfdnModdle();
  return { bus, canvas, registry, selection, drag, moddle, commandStack };
}

function node(
  moddle: ReturnType<typeof createPfdnModdle>,
  id: string,
  x: number,
  y: number
): ModellingModelElement {
  return moddle.create('pfdn:Node', {
    id,
    position: moddle.create('pfdn:Coordinates', { x, y })
  }) as unknown as ModellingModelElement;
}

describe('@d3-polytree/core Drag', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('moves a selected node and updates its model position', () => {
    const { bus, selection, drag, moddle } = setup();
    const el = drawing(10, 20);
    const def = node(moddle, 'N1', 10, 20);
    selection.select(el as unknown as DrawingSelection, def);

    const moving = vi.fn();
    bus.on('node.moving', moving);
    drag.applyOffsetToSelected(5, 7);

    expect(el.attr('x')).toBe('15');
    expect(el.attr('transform')).toBe('translate(15,27)');
    expect((def.position as { x: number; y: number }).x).toBe(15);
    expect((def.position as { x: number; y: number }).y).toBe(27);
    expect(def.get('status')).toBe(2);
    expect(moving).toHaveBeenCalled();
  });

  it('drags the associated label along with its node', () => {
    const { registry, selection, drag, moddle } = setup();
    const nodeEl = drawing(0, 0);
    const labelEl = drawing(0, 0);
    const def = node(moddle, 'N1', 0, 0);
    const label = moddle.create('pfdn:Label', {
      id: 'L1',
      position: moddle.create('pfdn:Coordinates', { x: 0, y: 0 })
    }) as unknown as ModellingModelElement;
    def.label = label;
    registry.set('L1', labelEl as unknown as DrawingSelection);
    selection.select(nodeEl as unknown as DrawingSelection, def);

    drag.applyOffsetToSelected(3, 4);

    expect((label.position as { x: number; y: number }).x).toBe(3);
    expect(labelEl.attr('x')).toBe('3');
  });

  it('commits one element.move for the moved nodes, skipping links', () => {
    const { selection, drag, moddle, commandStack } = setup();
    const nodeEl = drawing(0, 0);
    const nodeDef = node(moddle, 'N1', 0, 0);
    const linkEl = drawing(0, 0);
    const linkDef = moddle.create('pfdn:Link', { id: 'L1' }) as unknown as ModellingModelElement;
    selection.select(nodeEl as unknown as DrawingSelection, nodeDef);
    selection.select(linkEl as unknown as DrawingSelection, linkDef, { ctrlKey: true });

    drag.captureMoveOrigin(); // as the d3-drag 'start' handler does
    drag.applyOffsetToSelected(2, 2);
    drag.notifyMovedSelected();

    expect(commandStack.execute).toHaveBeenCalledTimes(1);
    const [command, ctx] = (commandStack.execute as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0] as [string, MoveContext];
    expect(command).toBe('element.move');
    // the link was filtered out at capture; only the node is in the batch
    expect(ctx.items.map((i) => i.def)).toEqual([nodeDef]);
    expect(ctx.items[0].to.position).toEqual({ x: 2, y: 2 });
    expect(ctx.items[0].from.position).toEqual({ x: 0, y: 0 });
  });
});
