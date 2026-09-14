import { describe, it, expect, beforeEach } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';
import { emptyModel } from '../model/model';
import { CalculateCenter } from '../utils/calculateCenter';
import type { ModellingModelElement } from '../modelling/types';
import { Zoom } from './zoom';
import { Axes } from './axes';

function setup() {
  const bus = new EventEmitter();
  const { definitions } = emptyModel();
  const canvas = new Canvas({ container: document.body }, bus);
  const settings = definitions.settings as Record<string, ModellingModelElement>;
  const zoom = new Zoom(settings.zoom, canvas, bus, new CalculateCenter(canvas));
  return { bus, canvas, zoom, grid: settings.grid };
}

describe('@d3-polytree/core Axes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('draws a background axis group with two crossed axes', () => {
    const { bus, canvas, zoom, grid } = setup();
    new Axes(grid, canvas, bus, zoom);

    const axis = canvas.getRootLayer().select('g.axis');
    expect(axis.empty()).toBe(false);
    expect(axis.selectAll('g').size()).toBe(2);
  });

  it('setVisible / toggleVisible drive the display style', () => {
    const { bus, canvas, zoom, grid } = setup();
    const axes = new Axes(grid, canvas, bus, zoom);
    const axis = canvas.getRootLayer().select('g.axis');

    // grid.show defaults to true
    expect(axis.style('display')).toBe('inline');
    axes.setVisible(false);
    expect(axis.style('display')).toBe('none');
    axes.toggleVisible();
    expect(axis.style('display')).toBe('inline');
  });

  it('hides during an interactive zoom and restores on zoom end', () => {
    const { bus, canvas, zoom, grid } = setup();
    new Axes(grid, canvas, bus, zoom);
    const axis = canvas.getRootLayer().select('g.axis');

    zoom.setZoomable(true);
    bus.emit('zoom.start');
    expect(axis.style('display')).toBe('none');

    bus.emit('zoom.end');
    expect(axis.style('display')).toBe('inline');
  });

  it('ignores zoom.start when zoom is not interactive', () => {
    const { bus, canvas, zoom, grid } = setup();
    new Axes(grid, canvas, bus, zoom);
    const axis = canvas.getRootLayer().select('g.axis');

    zoom.setZoomable(false);
    bus.emit('zoom.start');
    expect(axis.style('display')).toBe('inline');
  });
});
