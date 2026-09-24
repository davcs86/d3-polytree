import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import { AriaAnnouncer } from './ariaAnnouncer';
import type { ModellingModelElement } from '../modelling/types';

function makeDef(id: string, name?: string, type = 'pfdn:Node'): ModellingModelElement {
  return {
    id,
    $type: type,
    get: (k: string) => (k === 'name' ? name : undefined)
  } as unknown as ModellingModelElement;
}

describe('AriaAnnouncer (C2)', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let container: HTMLElement;
  let canvas: Canvas;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter<DiagramEventMap>();
    container = document.createElement('div');
    document.body.appendChild(container);
    canvas = { getContainer: () => container } as unknown as Canvas;
    new AriaAnnouncer(canvas, bus);
  });

  const region = () => container.querySelector<HTMLElement>('.pfd-a11y-live');

  it('creates no live region — and stays silent — before canvas.init (boot latch)', () => {
    bus.emit('selection.changed', [], [{ definition: makeDef('n1', 'Alpha') } as never]);
    bus.emit('node.created', null as never, makeDef('n1', 'Alpha'));
    expect(region()).toBeNull();
  });

  it('announces selection changes after boot', () => {
    bus.emit('canvas.init', { svg: null } as never);
    const live = region();
    expect(live).not.toBeNull();
    expect(live!.getAttribute('aria-live')).toBe('polite');

    bus.emit('selection.changed', [], [{ definition: makeDef('n1', 'Alpha') } as never]);
    expect(live!.textContent).toBe('Alpha selected');

    bus.emit(
      'selection.changed',
      [],
      [{ definition: makeDef('n1', 'A') } as never, { definition: makeDef('n2', 'B') } as never]
    );
    expect(live!.textContent).toBe('2 selected');

    bus.emit('selection.changed', [{ definition: makeDef('n1', 'A') } as never], []);
    expect(live!.textContent).toBe('selection cleared');
  });

  it('announces post-boot element additions/removals', () => {
    bus.emit('canvas.init', { svg: null } as never);
    bus.emit('node.created', null as never, makeDef('n1', 'Alpha'));
    expect(region()!.textContent).toBe('Alpha added');
    bus.emit('node.removed', null as never, makeDef('n1', 'Alpha'));
    expect(region()!.textContent).toBe('Alpha removed');
  });

  it('does not throw on a bare {id} removed def (undo-of-create reconcile path)', () => {
    bus.emit('canvas.init', { svg: null } as never);
    // removeElementById emits `.removed` with a bare { id } (no $type / .get) —
    // this must not crash the revert it fires inside (regression guard).
    expect(() =>
      bus.emit('node.removed', null as never, { id: 'n9' } as unknown as ModellingModelElement)
    ).not.toThrow();
    expect(region()!.textContent).toBe('n9 removed');
  });
});
