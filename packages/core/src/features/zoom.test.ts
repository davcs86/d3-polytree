import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas } from '@d3-polytree/canvas';
import { emptyModel } from '../model/model';
import { CalculateCenter } from '../utils/calculateCenter';
import type { ModellingModelElement } from '../modelling/types';
import { Zoom } from './zoom';
import { ZoomScroll } from './zoomScroll';

function setup() {
  const bus = new EventEmitter<DiagramEventMap>();
  const { definitions } = emptyModel();
  const canvas = new Canvas({ container: document.body }, bus);
  const calculateCenter = new CalculateCenter(canvas);
  const options = (definitions.settings as Record<string, unknown>).zoom as ModellingModelElement;
  return { bus, canvas, calculateCenter, options, definitions };
}

describe('@d3-polytree/core Zoom', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('nests a fresh drawing layer and announces itself on construction', () => {
    const { bus, canvas, calculateCenter, options } = setup();
    const init = vi.fn();
    bus.on('zoom.init', init);

    new Zoom(options, canvas, bus, calculateCenter);

    expect(init).toHaveBeenCalledTimes(1);
    // the drawing layer is now nested under the zoom-bound outer group
    const inner = canvas.getDrawingLayer().node();
    expect(inner?.parentNode).not.toBeNull();
    expect((inner?.parentNode as Element).tagName.toLowerCase()).toBe('g');
  });

  it('applies and persists the transform only while zoomable', () => {
    const { bus, canvas, calculateCenter, options } = setup();
    const zoom = new Zoom(options, canvas, bus, calculateCenter);
    const zoomed = vi.fn();
    bus.on('canvas.zoomed', zoomed);

    // not zoomable: no transform / persistence / event
    zoom.setZoomable(false);
    zoom.setZoom(99, 99, 9);
    expect(zoomed).not.toHaveBeenCalled();

    // zoomable: transform is written to the layer and back to the model
    zoom.setZoomable(true);
    zoom.setZoom(10, 20, 2);
    expect(canvas.getDrawingLayer().attr('transform')).toBe('translate(10, 20) scale(2)');
    expect(options.scale).toBe(2);
    expect((options.offset as { x: number; y: number }).x).toBe(10);
    expect((options.offset as { x: number; y: number }).y).toBe(20);
    expect(zoomed).toHaveBeenCalled();
  });

  it('emits background.click for a click on empty canvas', () => {
    const { bus, canvas, calculateCenter, options } = setup();
    new Zoom(options, canvas, bus, calculateCenter);
    const bg = vi.fn();
    bus.on('background.click', bg);

    const outer = canvas.getDrawingLayer().node()?.parentNode as SVGGElement;
    outer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(bg).toHaveBeenCalledTimes(1);
  });

  it('does not emit background.click when a drawn element is clicked', () => {
    const { bus, canvas, calculateCenter, options } = setup();
    new Zoom(options, canvas, bus, calculateCenter);
    const bg = vi.fn();
    bus.on('background.click', bg);

    // A drawn element (its `.element` group) with an inner child, as the drawers
    // render it. A click on the inner child bubbles up to the drawing-layer
    // handler; it must not be treated as a background click.
    const inner = canvas.getDrawingLayer().node() as SVGGElement;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'nodeItem element');
    const child = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    group.appendChild(child);
    inner.appendChild(group);

    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(bg).not.toHaveBeenCalled();
  });

  it('handles a zoom.to.element request for a node without throwing', () => {
    const { bus, canvas, calculateCenter, options, definitions } = setup();
    new Zoom(options, canvas, bus, calculateCenter);
    const moddle = emptyModel().moddle;
    const node = moddle.create('pfdn:Node', {
      id: 'N1',
      position: moddle.create('pfdn:Coordinates', { x: 40, y: 60 })
    }) as unknown as ModellingModelElement;
    void definitions;
    expect(() => bus.emit('zoom.to.element', undefined, node)).not.toThrow();
  });

  it('ZoomScroll enables interactive zoom', () => {
    const { bus, canvas, calculateCenter, options } = setup();
    const zoom = new Zoom(options, canvas, bus, calculateCenter);
    zoom.setZoomable(false);

    new ZoomScroll(zoom);

    const zoomed = vi.fn();
    bus.on('canvas.zoomed', zoomed);
    zoom.setZoom(5, 5, 1);
    expect(zoomed).toHaveBeenCalled();
  });
});
