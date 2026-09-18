import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { SearchPanel, type SideTabRegistration, type SideTabsRegistrar } from './SearchPanel';

/** A side-tabs registrar double that captures the tab and drives its content. */
class FakeRegistrar implements SideTabsRegistrar {
  tab: SideTabRegistration | null = null;
  index: number | undefined;
  registerSideTab(tab: SideTabRegistration, index?: number): void {
    this.tab = tab;
    this.index = index;
  }
  /** Simulate the side-tabs component creating the tab's content area. */
  open(): HTMLElement {
    const content = document.createElement('div');
    document.body.appendChild(content);
    this.tab?.action.created?.(content);
    return content;
  }
}

function node(id: string, name: string, type = 'default') {
  return {
    id,
    type,
    label: { text: name },
    $descriptor: { ns: { localName: 'Node' } }
  };
}

describe('@d3-polytree/search-panel', () => {
  let bus: EventEmitter<DiagramEventMap>;
  let registrar: FakeRegistrar;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter<DiagramEventMap>();
    registrar = new FakeRegistrar();
  });

  it('registers a search side tab at index 0', () => {
    new SearchPanel(registrar, bus);
    expect(registrar.tab?.title).toBe('Search element');
    expect(registrar.index).toBe(0);
  });

  it('indexes created nodes/links and drops deleted ones', () => {
    new SearchPanel(registrar, bus);
    const content = registrar.open();

    bus.emit('node.created', {}, node('N1', 'Alpha'));
    bus.emit('node.created', {}, node('N2', 'Beta'));
    expect(content.querySelectorAll('li').length).toBe(2);

    bus.emit('node.deleted', {}, node('N1', 'Alpha'));
    expect(content.querySelectorAll('li').length).toBe(1);
    expect(content.querySelector('li .name')?.textContent).toBe('Beta');
  });

  it('filters the list by the search box (case-insensitive)', () => {
    new SearchPanel(registrar, bus);
    const content = registrar.open();
    bus.emit('node.created', {}, node('N1', 'Alpha'));
    bus.emit('node.created', {}, node('N2', 'Beta'));

    const input = content.querySelector('input.search') as HTMLInputElement;
    input.value = 'alp';
    input.dispatchEvent(new Event('input'));

    const names = [...content.querySelectorAll('li .name')].map((n) => n.textContent);
    expect(names).toEqual(['Alpha']);
  });

  it('zooms to and selects the element when a row is clicked', () => {
    new SearchPanel(registrar, bus);
    const content = registrar.open();
    const def = node('N1', 'Alpha');
    bus.emit('node.created', { drawn: true }, def);

    const zoom = vi.fn();
    const click = vi.fn();
    bus.on('zoom.to.element', zoom);
    bus.on('node.click', click);

    (content.querySelector('li[data-id="N1"]') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );

    expect(zoom).toHaveBeenCalledWith({ drawn: true }, def);
    expect(click).toHaveBeenCalledWith({ drawn: true }, def, null);
  });
});

describe('DiagramEventMap (compile-time contract, interactive-viewer surface)', () => {
  it('enforces interactive-viewer event names at emit sites', () => {
    const typed = new EventEmitter<DiagramEventMap>();

    typed.emit('sidetab.registered', {});
    typed.emit('zoom.to.element', {}, {});

    // @ts-expect-error event-name typo is rejected
    typed.emit('sidetab.registerd', {});
    // @ts-expect-error 'zoom.to.element' takes (selection, model), not zero args
    typed.emit('zoom.to.element');

    expect(typed).toBeInstanceOf(EventEmitter);
  });
});
