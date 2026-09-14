import { describe, it, expect, beforeEach } from 'vitest';
import { Nodes } from './Nodes';
import { IconLoader } from './IconLoader';
import { createIcons } from './Icons';
import { createDefs } from './Defs';
import { makeDef, makeServices } from './drawerTestUtils';
import type { NodeDefinition } from './definitions';

describe('Nodes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an icon <use> at the node position', () => {
    const s = makeServices();
    const iconLoader = new IconLoader(createIcons(), createDefs(s.canvas));
    const def = makeDef('n1', {
      position: { x: 12, y: 34 },
      size: 50,
      type: 'default'
    }) as unknown as NodeDefinition;

    const nodes = new Nodes(
      [def],
      s.canvas,
      s.bus,
      iconLoader,
      s.elementBuilder,
      s.elementRegistry,
      s.drawingRegistry
    );

    const item = nodes.getContainer()!.select('.nodeItem');
    expect(item.attr('transform')).toBe('translate(12,34)');
    const svg = item.select('.innerElement').select('svg');
    expect(svg.attr('width')).toBe('50');
    expect(svg.attr('viewBox')).toBe('0 0 100 100');
    expect(svg.select('use').attr('href')).toBe('#default_icon_def');
  });
});
