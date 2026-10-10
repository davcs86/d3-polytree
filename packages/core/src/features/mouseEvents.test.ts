import { describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { select } from 'd3-selection';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { MouseEvents } from './mouseEvents';
import { markResolved } from './resolvedEvents';

describe('MouseEvents', () => {
  function setup() {
    const bus = new EventEmitter<DiagramEventMap>();
    new MouseEvents(bus);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    document.body.appendChild(g);
    const element = select(g) as unknown as DrawingSelection;
    const def = createPfdnModdle().create('pfdn:Zone', {
      id: 'z1'
    }) as unknown as ModellingModelElement;
    bus.emit('zone.created', element, def);
    return { bus, g };
  }

  it('re-emits element clicks as <class>.click on the bus', () => {
    const { bus, g } = setup();
    const spy = vi.fn();
    bus.on('zone.click', spy);
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('skips an event the LOD click resolver already dispatched', () => {
    const { bus, g } = setup();
    const spy = vi.fn();
    bus.on('zone.click', spy);
    const ev = new MouseEvent('click', { bubbles: true });
    markResolved(ev);
    g.dispatchEvent(ev);
    expect(spy).not.toHaveBeenCalled();
  });
});
