import { describe, it, expect, beforeEach } from 'vitest';
import { Zones } from './Zones';
import { makeDef, makeServices } from './drawerTestUtils';
import type { ZoneDefinition } from './definitions';

describe('Zones', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a background rect sized from the definition', () => {
    const s = makeServices();
    const def = makeDef('z1', {
      position: { x: 5, y: 6 },
      width: 100,
      height: 50,
      fillColor: '#eef',
      opacity: 0.3,
      border: { lineColor: '#00f', lineWidth: 2 }
    }) as unknown as ZoneDefinition;
    const zones = new Zones(
      [def],
      s.canvas,
      s.bus,
      s.elementBuilder,
      s.elementRegistry,
      s.drawingRegistry
    );

    const rect = zones.getContainer()!.select('.zoneItem').select('rect');
    expect(rect.attr('width')).toBe('100');
    expect(rect.attr('height')).toBe('50');
    expect(rect.style('stroke')).toBe('#00f');
  });

  it('inserts its container behind other drawing-layer children', () => {
    const s = makeServices();
    // pre-existing child on the drawing layer
    s.canvas.getDrawingLayer().append('g').attr('class', 'pre-existing');
    const def = makeDef('z1', {
      position: { x: 0, y: 0 },
      border: {}
    }) as unknown as ZoneDefinition;
    new Zones([def], s.canvas, s.bus, s.elementBuilder, s.elementRegistry, s.drawingRegistry);

    const first = s.canvas.getDrawingLayer().node()!.firstElementChild;
    expect(first?.getAttribute('class')).toBe('zone-group');
  });
});
