import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';
import { Palette } from './Palette';
import { PaletteProvider, type PaletteProvider as PP } from './PaletteProvider';

describe('@d3-polytree/core Palette', () => {
  let canvas: Canvas;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = new Canvas({ container: document.body }, new EventEmitter());
  });

  it('renders grouped entry buttons and delegates clicks to their actions', () => {
    const clicked = vi.fn();
    const provider = {
      getPaletteEntries: () => ({
        'new-node': { title: 'New node', group: 'drawing', iconClassName: 'icon-x', action: { click: clicked } }
      }),
      getPaletteTools: () => ({})
    } as unknown as PP;

    new Palette(canvas, provider);

    const button = canvas.getContainer().querySelector('[data-action="new-node"]');
    expect(canvas.getContainer().querySelector('.pfdjs-palette')).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button?.getAttribute('title')).toBe('New node');
    expect(button?.querySelector('.icon-x')).not.toBeNull();

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).toHaveBeenCalled();
  });

  it('deactivates active tools when interacting with the palette', () => {
    const deactivate = vi.fn();
    const provider = {
      getPaletteEntries: () => ({}),
      getPaletteTools: () => ({ addLinkTool: { activate() {}, deactivate } })
    } as unknown as PP;
    new Palette(canvas, provider);

    canvas
      .getContainer()
      .querySelector('.pfdjs-palette')
      ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(deactivate).toHaveBeenCalled();
  });
});

describe('@d3-polytree/core PaletteProvider', () => {
  function build() {
    const bus = new EventEmitter();
    const host = { createDiagram: vi.fn() };
    const localStorage = { save: vi.fn() };
    const upload = { openDialog: vi.fn() };
    const exporting = { trigger: vi.fn() };
    const axes = { toggleVisible: vi.fn() };
    const selection = { deleteSelected: vi.fn() };
    const addNodeHandler = { append: vi.fn() };
    const addLabelHandler = { append: vi.fn() };
    const addLinkTool = { activate: vi.fn(), deactivate: vi.fn() };
    const notifications = { warning: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), notify: vi.fn() };
    const provider = new PaletteProvider(
      host as never,
      bus,
      localStorage as never,
      upload as never,
      exporting as never,
      axes as never,
      selection as never,
      addNodeHandler as never,
      addLabelHandler as never,
      addLinkTool as never,
      notifications as never
    );
    return { provider, addNodeHandler, addLabelHandler, addLinkTool, selection, axes, exporting, localStorage, upload };
  }

  const fire = (provider: PaletteProvider, id: string): void => {
    const entry = provider.getPaletteEntries()[id];
    const action = entry.action;
    if (typeof action !== 'function') {
      action.click?.();
    }
  };

  it('exposes the link tool among its tools', () => {
    const { provider, addLinkTool } = build();
    expect(provider.getPaletteTools().addLinkTool).toBe(addLinkTool);
  });

  it('wires each drawing/util entry to its collaborator', () => {
    const ctx = build();
    fire(ctx.provider, 'new-node');
    expect(ctx.addNodeHandler.append).toHaveBeenCalled();
    fire(ctx.provider, 'new-label');
    expect(ctx.addLabelHandler.append).toHaveBeenCalled();
    fire(ctx.provider, 'new-connection');
    expect(ctx.addLinkTool.activate).toHaveBeenCalled();
    fire(ctx.provider, 'delete-item');
    expect(ctx.selection.deleteSelected).toHaveBeenCalled();
    fire(ctx.provider, 'toggle-grid');
    expect(ctx.axes.toggleVisible).toHaveBeenCalled();
    fire(ctx.provider, 'save');
    expect(ctx.localStorage.save).toHaveBeenCalled();
    fire(ctx.provider, 'open');
    expect(ctx.upload.openDialog).toHaveBeenCalled();
    fire(ctx.provider, 'download');
    expect(ctx.exporting.trigger).toHaveBeenCalledWith('pfdn');
  });
});
