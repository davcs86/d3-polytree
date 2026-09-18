import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas } from '@d3-polytree/canvas';
import { SideTabs } from './SideTabs';
import { SideTabsProvider } from './SideTabsProvider';

function setup() {
  const bus = new EventEmitter<DiagramEventMap>();
  const canvas = new Canvas({ container: document.body }, bus);
  const provider = new SideTabsProvider(bus);
  return { bus, canvas, provider };
}

describe('@d3-polytree/side-tabs SideTabsProvider', () => {
  it('registers tabs in order and at an index, emitting on each', () => {
    const bus = new EventEmitter<DiagramEventMap>();
    const provider = new SideTabsProvider(bus);
    const registered = vi.fn();
    bus.on('sidetab.registered', registered);

    const a = { title: 'A', action: () => {} };
    const b = { title: 'B', action: () => {} };
    const c = { title: 'C', action: () => {} };
    provider.registerSideTab(a);
    provider.registerSideTab(b);
    provider.registerSideTab(c, 1);

    expect(provider.getSideTabsEntries().map((t) => t.title)).toEqual(['A', 'C', 'B']);
    expect(registered).toHaveBeenCalledTimes(3);
  });
});

describe('@d3-polytree/side-tabs SideTabs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a tab + content per registered entry and re-renders on registration', () => {
    const { canvas, provider } = setup();
    provider.registerSideTab({ title: 'Props', iconClassName: 'icon-cog', action: vi.fn() });
    new SideTabs(canvas, provider, provider['_eventBus'] as never);

    const container = canvas.getContainer();
    expect(container.querySelector('.pfdjs-st-container')).not.toBeNull();
    expect(container.querySelectorAll('.pfdjs-st-tab').length).toBe(1);
    expect(container.querySelector('.pfdjs-st-tab .icon-cog')).not.toBeNull();

    // a late registration triggers a re-render
    provider.registerSideTab({ title: 'Search', action: vi.fn() });
    expect(container.querySelectorAll('.pfdjs-st-tab').length).toBe(2);
  });

  it('opens a tab on click (passing its content body) and closes it', () => {
    const { canvas, bus, provider } = setup();
    const onClick = vi.fn();
    provider.registerSideTab({ title: 'Props', action: onClick });
    new SideTabs(canvas, provider, bus);
    const container = canvas.getContainer();

    const tab = container.querySelector('.pfdjs-st-tab') as HTMLElement;
    tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(container.querySelector('.pfdjs-st-container')?.classList.contains('open')).toBe(true);
    expect(tab.classList.contains('active')).toBe(true);
    expect(container.querySelector('.pfdjs-st-content')?.classList.contains('hidden')).toBe(false);
    expect(onClick).toHaveBeenCalledWith(container.querySelector('.content-body'));

    const cancel = container.querySelector('.icon-cancel') as HTMLElement;
    cancel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container.querySelector('.pfdjs-st-container')?.classList.contains('open')).toBe(false);
  });
});
