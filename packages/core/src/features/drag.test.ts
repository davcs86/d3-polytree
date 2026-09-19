import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
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
  const bus = new EventEmitter<DiagramEventMap>();
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
    const [command, ctx] = (commandStack.execute as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0] as [string, MoveContext];
    expect(command).toBe('element.move');
    // the link was filtered out at capture; only the node is in the batch
    expect(ctx.items.map((i) => i.def)).toEqual([nodeDef]);
    expect(ctx.items[0].to.position).toEqual({ x: 2, y: 2 });
    expect(ctx.items[0].from.position).toEqual({ x: 0, y: 0 });
  });

  it('toggles the drag cursor on the root layer for the duration of the gesture', () => {
    const { canvas, selection, drag, moddle } = setup();
    const el = drawing(0, 0);
    const def = node(moddle, 'N1', 0, 0);
    selection.select(el as unknown as DrawingSelection, def);

    expect(canvas.getRootLayer().classed('cursor-grabbing')).toBe(false);
    drag.beginDrag(el as unknown as DrawingSelection, def);
    expect(canvas.getRootLayer().classed('cursor-grabbing')).toBe(true);
    drag.endDrag();
    expect(canvas.getRootLayer().classed('cursor-grabbing')).toBe(false);
  });

  it('grabbing a member of a multi-selection drags the whole group, not just it', () => {
    const { selection, drag, moddle } = setup();
    const aEl = drawing(0, 0);
    const bEl = drawing(50, 50);
    const a = node(moddle, 'A', 0, 0);
    const b = node(moddle, 'B', 50, 50);
    // build a two-element selection via ctrl-click semantics
    selection.select(aEl as unknown as DrawingSelection, a);
    selection.select(bEl as unknown as DrawingSelection, b, { ctrlKey: true });
    expect(selection.getSelectedElements()).toHaveLength(2);

    // press A to start dragging — d3-drag strips ctrlKey, so sourceEvent has none.
    // The group must survive rather than collapse to {A}.
    drag.beginDrag(aEl as unknown as DrawingSelection, a, { ctrlKey: false });
    expect(selection.getSelectedElements()).toHaveLength(2);

    drag.applyOffsetToSelected(10, 10);
    expect((a.position as { x: number; y: number }).x).toBe(10);
    expect((b.position as { x: number; y: number }).x).toBe(60);
  });

  it('grabbing an unselected element replaces the selection with it', () => {
    const { selection, drag, moddle } = setup();
    const aEl = drawing(0, 0);
    const cEl = drawing(90, 90);
    const a = node(moddle, 'A', 0, 0);
    const c = node(moddle, 'C', 90, 90);
    selection.select(aEl as unknown as DrawingSelection, a);
    expect(selection.getSelectedElements()).toHaveLength(1);

    // grabbing C (not selected, no ctrl) selects just C, then drags it
    drag.beginDrag(cEl as unknown as DrawingSelection, c, { ctrlKey: false });
    const sel = selection.getSelectedElements();
    expect(sel).toHaveLength(1);
    expect(sel[0].definition.id).toBe('C');
  });

  it('does not commit a zero-delta gesture (a plain click)', () => {
    const { selection, drag, moddle, commandStack } = setup();
    const nodeEl = drawing(0, 0);
    const nodeDef = node(moddle, 'N1', 0, 0);
    selection.select(nodeEl as unknown as DrawingSelection, nodeDef);

    // A click is d3-drag 'start' + 'end' with no 'drag' between — capture the
    // origin, then release without any applyOffsetToSelected in between.
    drag.captureMoveOrigin();
    drag.notifyMovedSelected();

    expect(commandStack.execute).not.toHaveBeenCalled();
  });
});
