import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3-selection';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import { KeyboardNav } from './keyboardNav';
import { Selection } from './selection';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

function gFor(id: string): DrawingSelection {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  el.setAttribute('element-id', id);
  el.setAttribute('class', 'nodeItem element');
  return select(el) as unknown as DrawingSelection;
}

function nodeDef(id: string, x: number, y: number): ModellingModelElement {
  return {
    id,
    $type: 'pfdn:Node',
    position: { x, y },
    get: (k: string) => (k === 'name' ? id : undefined)
  } as unknown as ModellingModelElement;
}

describe('KeyboardNav (C2)', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let svgEl: SVGSVGElement;
  let canvas: Canvas;
  let model: { definitions: { node: ModellingModelElement[]; link: ModellingModelElement[] } };

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter<DiagramEventMap>();
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgEl);
    const container = document.createElement('div');
    canvas = {
      getSVG: () => select(svgEl),
      getContainer: () => container
    } as unknown as Canvas;
    model = { definitions: { node: [], link: [] } };
    new KeyboardNav(canvas, bus, model, new Selection(bus));
  });

  it('marks the <svg> as an ARIA application with a labelled tab stop on canvas.init', () => {
    bus.emit('canvas.init', { svg: select(svgEl) } as never);
    expect(svgEl.getAttribute('role')).toBe('application');
    expect(svgEl.getAttribute('aria-label')).toBeTruthy();
    expect(svgEl.getAttribute('tabindex')).toBe('0');
  });

  it('appends a focus-ring rect and a roving tabindex to each created element', () => {
    const g = gFor('n1');
    bus.emit('node.created', g, nodeDef('n1', 0, 0));
    expect(g.select('.element-focus-ring').empty()).toBe(false);
    expect(g.attr('tabindex')).toBe('-1');
  });

  it('enters on the first arrow and then moves by direction cone, driving selection', () => {
    const gA = gFor('a');
    const gB = gFor('b');
    const a = nodeDef('a', 0, 0);
    const b = nodeDef('b', 100, 0);
    model.definitions.node = [a, b];
    bus.emit('node.created', gA, a);
    bus.emit('node.created', gB, b);
    bus.emit('canvas.init', { svg: select(svgEl) } as never);

    const arrowRight = () =>
      svgEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    arrowRight(); // enter at the first element in roving order
    expect(gA.classed('selected')).toBe(true);

    arrowRight(); // cone right → the element to the right
    expect(gB.classed('selected')).toBe(true);
    expect(gA.classed('selected')).toBe(false);
    expect(gB.classed('pfd-focus')).toBe(true);
  });

  it('Escape drops the roving focus and clears pfd-focus', () => {
    const g = gFor('n1');
    const n = nodeDef('n1', 0, 0);
    model.definitions.node = [n];
    bus.emit('node.created', g, n);
    bus.emit('canvas.init', { svg: select(svgEl) } as never);

    svgEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(g.classed('pfd-focus')).toBe(true);
    svgEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(g.classed('pfd-focus')).toBe(false);
  });
});
