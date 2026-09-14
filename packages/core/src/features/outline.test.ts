import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { select, type Selection } from 'd3-selection';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { Outline } from './outline';

/** Build a real `<g>` drawing element with an `.innerElement` child. */
function drawing(): Selection<SVGGElement, unknown, null, undefined> {
  const svg = select(document.body).append('svg');
  const g = svg.append('g');
  g.append('g').attr('class', 'innerElement');
  return g as unknown as Selection<SVGGElement, unknown, null, undefined>;
}

describe('@d3-polytree/core Outline', () => {
  let bus: EventEmitter;
  let moddle: ReturnType<typeof createPfdnModdle>;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter();
    moddle = createPfdnModdle();
    new Outline(bus);
  });

  it('outlines a node sized from its size property', () => {
    const el = drawing();
    const def = moddle.create('pfdn:Node', { id: 'N1', size: 25 }) as unknown as ModellingModelElement;
    const created = vi.fn();
    bus.on('outline.created', created);

    bus.emit('node.created', el as unknown as DrawingSelection, def);

    const outline = el.select('.element-outline');
    expect(outline.empty()).toBe(false);
    expect(outline.attr('width')).toBe('31'); // 25 + 6 padding
    expect(outline.attr('stroke')).toBe('red');
    expect(created).toHaveBeenCalled();
  });

  it('outlines a link from its waypoint bounds', () => {
    const el = drawing();
    const def = moddle.create('pfdn:Link', {
      id: 'L1',
      waypoint: [
        moddle.create('pfdn:Coordinates', { x: 10, y: 20 }),
        moddle.create('pfdn:Coordinates', { x: 110, y: 60 })
      ]
    }) as unknown as ModellingModelElement;

    bus.emit('link.created', el as unknown as DrawingSelection, def);

    const outline = el.select('.element-outline');
    expect(outline.attr('x')).toBe('10');
    expect(outline.attr('y')).toBe('20');
    expect(outline.attr('width')).toBe('106'); // |110-10| + 6
    expect(outline.attr('height')).toBe('46'); // |60-20| + 6
  });

  it('updates an existing outline in place', () => {
    const el = drawing();
    const def = moddle.create('pfdn:Node', { id: 'N1', size: 25 }) as unknown as ModellingModelElement;
    bus.emit('node.created', el as unknown as DrawingSelection, def);

    const updated = vi.fn();
    bus.on('outline.updated', updated);
    def.size = 40;
    bus.emit('node.updated', el as unknown as DrawingSelection, def);

    expect(el.select('.element-outline').attr('width')).toBe('46'); // 40 + 6
    expect(el.selectAll('.element-outline').size()).toBe(1); // no duplicate
    expect(updated).toHaveBeenCalled();
  });
});
