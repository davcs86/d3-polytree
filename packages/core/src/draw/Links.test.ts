import { describe, it, expect, beforeEach } from 'vitest';
import { Links } from './Links';
import { Markers } from './Markers';
import { createDefs } from './Defs';
import { makeDef, makeServices } from './drawerTestUtils';
import type { LinkDefinition } from './definitions';

describe('Links', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('draws a poly-line path through its waypoints with an arrow marker', () => {
    const s = makeServices();
    const markers = new Markers(createDefs(s.canvas));
    const def = makeDef('lk1', {
      waypoint: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      lineColor: '#123456',
      fillColor: '#ffffff',
      lineWidth: 4
    }) as unknown as LinkDefinition;

    const links = new Links(
      [def],
      s.canvas,
      s.bus,
      markers,
      s.elementBuilder,
      s.elementRegistry,
      s.drawingRegistry
    );

    const item = links.getContainer()!.select('.linkItem');
    const path = item.select('.line-path');
    expect(path.empty()).toBe(false);
    expect(path.attr('d')).toBe('M 0 0, L 10 10');
    expect(path.attr('marker-end')).toBe('url(#lk1_markerEnd)');
    expect(path.style('stroke')).toBe('#123456');
    expect(item.select('.line-subpath').empty()).toBe(false);
  });
});
