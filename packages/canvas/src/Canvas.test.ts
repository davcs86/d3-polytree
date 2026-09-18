import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from './Canvas';
import type { DiagramEventMap } from './events';

function makeCanvas(): { canvas: Canvas; bus: EventEmitter<DiagramEventMap> } {
  const bus = new EventEmitter<DiagramEventMap>();
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

  it('falls back to identity when the transform cannot be consolidated', () => {
    const { canvas } = makeCanvas();
    // With a transform attribute set but no SVG layout engine (jsdom), the
    // matrix cannot be consolidated; getTransform must not throw.
    canvas.getDrawingLayer().attr('transform', 'translate(5, 7) scale(2)');
    expect(() => canvas.getTransform()).not.toThrow();
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

describe('DiagramEventMap (compile-time contract)', () => {
  // These assertions are checked by `tsc --noEmit` (tsconfig include: ["src"]).
  // Each @ts-expect-error fails the typecheck BEFORE the bus is typed (the
  // wrong emit produced no error, so the directive would be unused) and passes
  // AFTER — a real fail-before/pass-after test for a type-only change.
  it('enforces event names and payload shapes at emit sites', () => {
    const bus = new EventEmitter<DiagramEventMap>();

    // correct usages compile
    bus.emit('canvas.resized');
    bus.emit('document.changed', { dirty: true });
    bus.emit('selection.changed', [], []);

    // @ts-expect-error 'canvas.resized' carries no payload
    bus.emit('canvas.resized', 1);
    // @ts-expect-error unknown event names are rejected
    bus.emit('totally.not.an.event');
    // @ts-expect-error 'document.changed' requires { dirty: boolean }
    bus.emit('document.changed', { dirty: 'nope' });

    expect(bus).toBeInstanceOf(EventEmitter);
  });
});
