import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from './Canvas';

function makeCanvas(): { canvas: Canvas; bus: EventEmitter } {
  const bus = new EventEmitter();
  const canvas = new Canvas({ container: document.body, width: 400, height: 300 }, bus);
  return { canvas, bus };
}

describe('Canvas', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a wrapped svg with a root group layer', () => {
    const { canvas } = makeCanvas();
    expect(canvas.getContainer().classList.contains('pfdjs-container')).toBe(true);
    expect(canvas.getSVG().node()?.tagName.toLowerCase()).toBe('svg');
    expect(canvas.getRootLayer().attr('class')).toBe('full-group');
  });

  it('emits canvas.init in response to d3canvas.init', () => {
    const { canvas, bus } = makeCanvas();
    let payload: { svg: unknown } | undefined;
    bus.on('canvas.init', (e: { svg: unknown }) => {
      payload = e;
    });
    bus.emit('d3canvas.init');
    expect(payload?.svg).toBe(canvas.getSVG());
  });

  it('returns an identity transform when none is set', () => {
    const { canvas } = makeCanvas();
    expect(canvas.getTransform()).toEqual({ a: 1, d: 1, e: 0, f: 0 });
  });

  it('removes its container on d3canvas.destroy', () => {
    const { canvas, bus } = makeCanvas();
    const container = canvas.getContainer();
    expect(container.parentNode).toBe(document.body);
    bus.emit('d3canvas.destroy');
    expect(container.parentNode).toBeNull();
  });
});
