import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { select } from 'd3-selection';
import { Canvas } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import { DrawingRegistry, type DefsSelection, type DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { AlertIcons } from './alertIcons';
import { Tooltip, type TooltipFn } from './tooltip';
import type { NotificationService } from './notifications';

function notifications(): NotificationService & { notify: ReturnType<typeof vi.fn> } {
  return { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn(), notify: vi.fn() };
}

describe('@d3-polytree/core AlertIcons', () => {
  let defs: DefsSelection;
  let registry: DrawingRegistry;
  let notes: ReturnType<typeof notifications>;

  beforeEach(() => {
    document.body.innerHTML = '';
    defs = select(document.body).append('svg').append('defs') as unknown as DefsSelection;
    registry = new DrawingRegistry();
    notes = notifications();
  });

  function drawNode(id: string): DrawingSelection {
    const g = select(document.body).append('svg').append('g');
    g.append('g').attr('class', 'innerElement');
    const sel = g as unknown as DrawingSelection;
    registry.set(id, sel);
    return sel;
  }

  it('builds the four alert symbols into the shared defs', () => {
    new AlertIcons(defs, notes, registry);
    for (const type of ['error', 'info', 'success', 'warning']) {
      expect(defs.select(`#${type}_alerticon_def`).empty()).toBe(false);
    }
  });

  it('shows an alert badge on a node and notifies on click', () => {
    const alerts = new AlertIcons(defs, notes, registry);
    const el = drawNode('N1');

    alerts.showAlert('N1', 'boom <b>tag</b>', 'error');

    const icon = el.select('.alertIcon');
    expect(icon.empty()).toBe(false);
    expect(icon.select('use').attr('href')).toBe('#error_alerticon_def');
    expect(el.select('.innerElement').classed('blink')).toBe(true);

    (icon.node() as SVGElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(notes.notify).toHaveBeenCalledWith(
      { title: 'error', text: 'boom tag' }, // HTML stripped
      'error'
    );
  });

  it('falls back to info for an unknown type and removes cleanly', () => {
    const alerts = new AlertIcons(defs, notes, registry);
    const el = drawNode('N1');

    alerts.showAlert('N1', 'hi', 'mystery');
    expect(el.select('.alertIcon').select('use').attr('href')).toBe('#info_alerticon_def');

    alerts.removeAlert('N1');
    expect(el.select('.alertIcon').empty()).toBe(true);
    expect(el.select('.innerElement').classed('blink')).toBe(false);
  });
});

describe('@d3-polytree/core Tooltip', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let canvas: Canvas;
  let moddle: ReturnType<typeof createPfdnModdle>;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter<DiagramEventMap>();
    canvas = new Canvas({ container: document.body }, bus);
    moddle = createPfdnModdle();
  });

  it('creates a tip element only when a tooltip function is supplied', () => {
    new Tooltip(undefined, canvas, bus);
    expect(document.querySelector('.d3-tip')).toBeNull();

    const fn: TooltipFn = () => 'hi';
    new Tooltip(fn, canvas, bus);
    expect(document.querySelector('.d3-tip')).not.toBeNull();
  });

  it('respects the zoom threshold (no tooltip at default scale) and hides safely', () => {
    const fn = vi.fn<TooltipFn>(() => 'hi');
    new Tooltip(fn, canvas, bus);
    const node = moddle.create('pfdn:Node', { id: 'N1' }) as unknown as ModellingModelElement;

    // default transform scale is 1 (>= 0.8), so the tooltip stays hidden
    bus.emit('node.mouseover', {}, node, new MouseEvent('mouseover'));
    expect(fn).not.toHaveBeenCalled();

    expect(() => bus.emit('node.mouseout', {}, node, new MouseEvent('mouseout'))).not.toThrow();
  });
});
