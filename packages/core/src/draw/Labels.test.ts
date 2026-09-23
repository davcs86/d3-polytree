import { describe, it, expect, beforeEach } from 'vitest';
import { Labels } from './Labels';
import { makeDef, makeServices } from './drawerTestUtils';
import type { LabelDefinition } from './definitions';

describe('Labels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a text label at its position', () => {
    const s = makeServices();
    const def = makeDef<Omit<LabelDefinition, keyof object>>('l1', {
      position: { x: 10, y: 20 },
      color: '#f00',
      fontSize: 14,
      text: 'hello'
    }) as unknown as LabelDefinition;
    const labels = new Labels(
      [def],
      s.canvas,
      s.bus,
      s.elementBuilder,
      s.elementRegistry,
      s.drawingRegistry
    );

    const drawing = labels.getContainer()!.select('.labelItem');
    expect(drawing.attr('transform')).toBe('translate(10,20)');
    const text = drawing.select('text');
    expect(text.text()).toBe('hello');
    expect(text.attr('fill')).toBe('#f00');
  });

  it('updates the text on update', () => {
    const s = makeServices();
    const def = makeDef('l1', {
      position: { x: 0, y: 0 },
      text: 'a',
      fontSize: 10
    }) as unknown as LabelDefinition;
    const labels = new Labels(
      [def],
      s.canvas,
      s.bus,
      s.elementBuilder,
      s.elementRegistry,
      s.drawingRegistry
    );
    def.text = 'b';
    labels.updateElement(def);
    expect(labels.getContainer()!.select('.labelItem').select('text').text()).toBe('b');
  });
});
