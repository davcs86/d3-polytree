import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';
import { emptyModel } from '../model/model';
import type { ModellingModelElement } from '../modelling/types';
import { BackgroundColor } from './backgroundColor';

function setup() {
  const bus = new EventEmitter();
  const { definitions } = emptyModel();
  const canvas = new Canvas({ container: document.body }, bus);
  const settings = definitions.settings as ModellingModelElement;
  return { bus, canvas, settings };
}

describe('@d3-polytree/core BackgroundColor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('paints a full-size background rect from the settings colour', () => {
    const { bus, canvas, settings } = setup();
    new BackgroundColor(canvas, settings, bus);

    const rect = canvas.getRootLayer().select('rect');
    expect(rect.empty()).toBe(false);
    expect(rect.attr('width')).toBe('100%');
    expect(rect.attr('height')).toBe('100%');
    expect(rect.attr('fill')).toBe('#ffffff');
  });

  it('setColor updates the model and the rect fill', () => {
    const { bus, canvas, settings } = setup();
    const bg = new BackgroundColor(canvas, settings, bus);

    bg.setColor('#123456');

    expect((settings as { backgroundColor?: string }).backgroundColor).toBe('#123456');
    expect(canvas.getRootLayer().select('rect').attr('fill')).toBe('#123456');
  });

  it('re-applies the fill on canvas.resized', () => {
    const { bus, canvas, settings } = setup();
    new BackgroundColor(canvas, settings, bus);
    (settings as { backgroundColor?: string }).backgroundColor = '#abcdef';

    bus.emit('canvas.resized');
    expect(canvas.getRootLayer().select('rect').attr('fill')).toBe('#abcdef');
  });
});
