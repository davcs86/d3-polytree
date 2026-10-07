import { describe, expect, it, vi } from 'vitest';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingRegistry } from '../../draw';
import type { Modelling } from '../../modelling';
import type { CommandStack } from '../../command';
import type { Selection } from '../selection';
import { BaseAddHandler } from './BaseAddHandler';

class TestHandler extends BaseAddHandler {
  constructor(canvas: Canvas, registry: DrawingRegistry) {
    super('node', registry, {} as Selection, canvas, {} as Modelling, {} as CommandStack);
  }
  position() {
    return this._calculatePosition();
  }
}

function build(size: [number, number], t: { a: number; e: number; f: number }, registry?: unknown) {
  const canvas = {
    getSize: vi.fn(() => ({ width: size[0], height: size[1] })),
    getTransform: vi.fn(() => t)
  } as unknown as Canvas;
  return new TestHandler(canvas, (registry ?? { getAll: () => [] }) as DrawingRegistry);
}

describe('BaseAddHandler._calculatePosition', () => {
  it.each([
    [0.5, 0, 0],
    [1, 100, -40],
    [2, -300, 250]
  ])('is the viewport centre in world units at scale %s, pan (%s, %s)', (a, e, f) => {
    const p = build([800, 600], { a, e, f }).position();
    expect(p).toEqual({ x: (400 - e) / a, y: (300 - f) / a });
  });

  it('does not depend on any drawn element (a culled element has an empty rect)', () => {
    const zeroRect = {
      node: () => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) })
    };
    const t = { a: 2, e: -300, f: 250 };
    const empty = build([800, 600], t).position();
    const withCulled = build([800, 600], t, { getAll: () => [zeroRect] }).position();
    expect(withCulled).toEqual(empty);
  });

  it('stays within 4 world px of the old element-relative formula', () => {
    const a = 1.5;
    const e = 120;
    const f = -60;
    const container = { left: 10, top: 20, width: 800, height: 600 };
    // An element whose model origin is (30, 40): its on-screen rect starts ~3 world px inside.
    const elemWorld = { x: 30, y: 40 };
    const localOffset = 3;
    const refRect = {
      left: container.left + e + (elemWorld.x + localOffset) * a,
      top: container.top + f + (elemWorld.y + localOffset) * a
    };
    const oldPos = {
      x: (-1 * (refRect.left - 0 * a - (container.left + container.width / 2))) / a,
      y: (-1 * (refRect.top - 0 * a - (container.top + container.height / 2))) / a
    };
    const newPos = build([800, 600], { a, e, f }).position();
    // old formula measures from the reference element's origin; compare after re-adding it
    expect(Math.abs(newPos.x - (oldPos.x + elemWorld.x + localOffset))).toBeLessThanOrEqual(4);
    expect(Math.abs(newPos.y - (oldPos.y + elemWorld.y + localOffset))).toBeLessThanOrEqual(4);
  });
});
