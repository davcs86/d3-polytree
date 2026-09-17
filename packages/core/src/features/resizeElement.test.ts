import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { select, type Selection } from 'd3-selection';
import { Canvas } from '@d3-polytree/canvas';
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import { ResizeElement } from './resizeElement';
import { NoticePopup } from './noticePopup';
import type { NotificationService } from './notifications';
import type { CommandStack } from '../command';

/** A command-stack double: ResizeElement only dispatches on drag-commit. */
function fakeCommandStack(): CommandStack {
  return { execute: vi.fn() } as unknown as CommandStack;
}

/** A node `<g>` with an inner svg, plus its outline rect. */
function nodeDrawing(size: number) {
  const g = select(document.body).append('svg').append('g');
  g.append('g').attr('class', 'innerElement').append('svg');
  const outline = g
    .append('rect')
    .attr('class', 'element-outline')
    .attr('width', size + 6)
    .attr('height', size + 6);
  return {
    element: g as unknown as DrawingSelection,
    outline: outline as unknown as Selection<SVGGraphicsElement, unknown, null, undefined>
  };
}

describe('@d3-polytree/core ResizeElement', () => {
  let bus: EventEmitter;
  let canvas: Canvas;
  let moddle: ReturnType<typeof createPfdnModdle>;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter();
    canvas = new Canvas({ container: document.body }, bus);
    moddle = createPfdnModdle();
    new ResizeElement(bus, canvas, fakeCommandStack());
  });

  function node(): ModellingModelElement {
    return moddle.create('pfdn:Node', {
      id: 'N1',
      size: 25,
      position: moddle.create('pfdn:Coordinates', { x: 0, y: 0 })
    }) as unknown as ModellingModelElement;
  }

  it('adds resize handles to a node outline', () => {
    const { element, outline } = nodeDrawing(25);
    bus.emit('outline.created', element, node(), outline);

    const container = element.select('.resize-container');
    expect(container.empty()).toBe(false);
    expect(container.select('.resize-drag-ne').empty()).toBe(false);
    expect(container.select('.resize-drag-sw').empty()).toBe(false);
    expect(container.select('.resize-drag-se').empty()).toBe(false);
  });

  it('does not add handles to non-node elements', () => {
    const { element, outline } = nodeDrawing(25);
    const label = moddle.create('pfdn:Label', { id: 'L1' }) as unknown as ModellingModelElement;
    bus.emit('outline.created', element, label, outline);
    expect(element.select('.resize-container').empty()).toBe(true);
  });

  it('resizes the outline and handles on outline.updated', () => {
    const def = node();
    const { element, outline } = nodeDrawing(25);
    bus.emit('outline.created', element, def, outline);

    def.size = 40;
    bus.emit('outline.updated', element, def, outline);

    expect(outline.attr('width')).toBe('46'); // 40 + 6
    expect(element.select('.resize-drag-se').attr('x')).toBe('43.5'); // 46 - 2.5
  });
});

describe('@d3-polytree/core NoticePopup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds a notice button that opens a notification', () => {
    const canvas = new Canvas({ container: document.body }, new EventEmitter());
    const notify = vi.fn();
    const notifications = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      notify
    } satisfies NotificationService;

    new NoticePopup(canvas, notifications);

    const button = canvas.getContainer().querySelector('.noticePopup');
    expect(button).not.toBeNull();
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(notify).toHaveBeenCalled();
  });
});
