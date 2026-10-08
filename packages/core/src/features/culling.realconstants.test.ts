import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { Canvas, DiagramEventMap } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { CULL_MIN_ELEMENTS } from '../spatial/types';
import { Culling } from './culling';

// No constants mock here: this file pins the REAL activation threshold (5,000).

function build(count: number) {
  const bus = new EventEmitter<DiagramEventMap>();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const canvas = {
    getContainer: () => container,
    getSize: () => ({ width: 800, height: 600 })
  } as unknown as Canvas;
  const culling = new Culling(canvas, bus, { options: {} }, {
    scale: 1,
    offset: { x: 0, y: 0 }
  } as never);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  for (let i = 0; i < count; i++) {
    bus.emit(
      'node.created',
      { node: () => g } as unknown as DrawingSelection,
      { id: `n${i}`, position: { x: i * 100, y: 0 }, size: 25 } as unknown as ModellingModelElement
    );
  }
  return { culling, container };
}

describe('Culling — real constants', () => {
  let queue: Array<() => void>;
  beforeEach(() => {
    queue = [];
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => queue.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('ResizeObserver', undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is inactive at CULL_MIN_ELEMENTS - 1 and active at CULL_MIN_ELEMENTS', () => {
    expect(CULL_MIN_ELEMENTS).toBe(5000);
    expect(build(CULL_MIN_ELEMENTS - 1).culling.inspect().active).toBe(false);
    expect(build(CULL_MIN_ELEMENTS).culling.inspect().active).toBe(true);
  });

  it('stays idle="false" until the hide backlog is fully drained', () => {
    vi.stubGlobal('getComputedStyle', () => ({ display: 'none' }));
    const { culling, container } = build(CULL_MIN_ELEMENTS);
    const idle = () => container.getAttribute('data-pfd-culling-idle');
    expect(idle()).toBe('false');
    let frames = 0;
    while (queue.length && frames < 100) {
      queue.shift()!();
      frames++;
      if (queue.length) expect(idle()).toBe('false');
    }
    expect(idle()).toBe('true');
    // ~4,990 off-screen elements at 300 per frame
    expect(frames).toBeGreaterThanOrEqual(Math.ceil(4980 / 300));
    expect(culling.inspect().stats.maxHides).toBeLessThanOrEqual(300);
  });
});
