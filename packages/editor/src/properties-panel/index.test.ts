import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { CommandStack } from '@d3-polytree/core';
import { EntryFactory } from './EntryFactory';
import { PfdnPropertiesProvider } from './PfdnPropertiesProvider';
import { PropertiesPanel, type SideTabRegistration, type SideTabsRegistrar } from './PropertiesPanel';
import type { Definition } from './utils';

/** A moddle-element double: `$instanceOf`, `get`, and plain nested props. */
function def(type: string, props: Record<string, unknown> = {}): Definition {
  return {
    $instanceOf: (t: string) => t === type,
    get(this: Record<string, unknown>, p: string) {
      return this[p];
    },
    ...props
  } as unknown as Definition;
}

function nodeDef(): Definition {
  return def('pfdn:Node', {
    id: 'N1',
    name: 'Alpha',
    tag: '',
    type: 'default',
    size: 25,
    label: { id: 'L1', text: 'Alpha', fontSize: 12, color: '#303030' }
  });
}

function settingsDef(): Definition {
  return def('pfdn:Settings', {
    name: 'Diagram',
    author: 'Me',
    backgroundColor: '#ffffff',
    grid: { lineColor: '#dddddd', size: 25, lineWidth: 1 }
  });
}

describe('@d3-polytree/properties-panel EntryFactory', () => {
  let factory: EntryFactory;
  beforeEach(() => {
    factory = new EntryFactory(new EventEmitter());
  });

  const render = (html: string): HTMLElement => {
    const node = document.createElement('div');
    node.innerHTML = html;
    return node;
  };

  it('text field: renders an input, populates from and writes to the model', () => {
    const entry = factory.textField({ id: 'name', label: 'Name', modelProperty: 'name' });
    expect(entry.html).toContain('name="name"');
    const node = render(entry.html);
    const element = nodeDef();

    entry.get(element, node);
    expect((node.querySelector('input') as HTMLInputElement).value).toBe('Alpha');

    entry.set(element, { name: 'Beta' });
    expect(element.name).toBe('Beta');
  });

  it('colour field: renders a native colour input and seeds a hex value', () => {
    const entry = factory.colorPicker({ id: 'label.color', label: 'Color', modelProperty: 'label.color' });
    expect(entry.html).toContain('type="color"');
    const node = render(entry.html);
    entry.get(nodeDef(), node);
    expect((node.querySelector('input') as HTMLInputElement).value).toBe('#303030');
  });

  it('select field: renders options and marks the current one selected', () => {
    const entry = factory.selectBox({
      id: 'type',
      label: 'Icon',
      modelProperty: 'type',
      allowEmpty: false,
      selectOptions: [
        { name: 'Default', value: 'default' },
        { name: 'Task', value: 'task' }
      ]
    });
    const node = render(entry.html);
    entry.get(def('pfdn:Node', { type: 'task', get(this: Record<string, unknown>, p: string) { return this[p]; } }), node);
    const selected = node.querySelector('option[value="task"]') as HTMLOptionElement;
    expect(selected.selected).toBe(true);
  });
});

describe('@d3-polytree/properties-panel PfdnPropertiesProvider', () => {
  let provider: PfdnPropertiesProvider;
  let bus: EventEmitter;

  beforeEach(() => {
    bus = new EventEmitter();
    provider = new PfdnPropertiesProvider({ default: '', task: '' }, new EntryFactory(bus), bus);
  });

  it('builds Properties + Format tabs for a node', () => {
    const tabs = provider.getTabs(nodeDef());
    expect(tabs.map((t) => t.id)).toEqual(['properties', 'format']);
    const general = tabs[0].groups[0];
    expect(general.entries.map((e) => e.id)).toEqual(['name', 'tag', 'label.text']);
    const elementFormat = tabs[1].groups[0];
    expect(elementFormat.entries.map((e) => e.id)).toEqual(['type', 'size']);
    // the icon select got an option per icon
    expect(elementFormat.entries[0].selectOptions?.map((o) => o.value)).toEqual(['default', 'task']);
  });

  it('updateDrawing emits element.updated for a node and its label', () => {
    const updated = vi.fn();
    bus.on('element.updated', updated);
    const node = nodeDef();
    provider.updateDrawing(node);
    expect(updated).toHaveBeenCalledWith('N1', node);
    expect(updated).toHaveBeenCalledWith('L1', node.label);
  });

  it('updateDrawing redraws the grid for settings', () => {
    const resized = vi.fn();
    bus.on('canvas.resized', resized);
    provider.updateDrawing(settingsDef());
    expect(resized).toHaveBeenCalled();
  });
});

class FakeRegistrar implements SideTabsRegistrar {
  tab: SideTabRegistration | null = null;
  index: number | undefined;
  registerSideTab(tab: SideTabRegistration, index?: number): void {
    this.tab = tab;
    this.index = index;
  }
  open(): HTMLElement {
    const content = document.createElement('div');
    document.body.appendChild(content);
    this.tab?.action.created?.(content);
    return content;
  }
}

describe('@d3-polytree/properties-panel PropertiesPanel', () => {
  let bus: EventEmitter;
  let registrar: FakeRegistrar;
  let provider: PfdnPropertiesProvider;

  beforeEach(() => {
    document.body.innerHTML = '';
    bus = new EventEmitter();
    registrar = new FakeRegistrar();
    provider = new PfdnPropertiesProvider({ default: '' }, new EntryFactory(bus), bus);
  });

  it('registers the Properties side tab at index 1 and renders the default (settings) tabs', () => {
    new PropertiesPanel(registrar, bus, provider, settingsDef(), new CommandStack(bus));
    const content = registrar.open();

    expect(registrar.tab?.title).toBe('Properties');
    expect(registrar.index).toBe(1);
    // properties + format tabs rendered, first selected
    const tabs = content.querySelectorAll('.tab-sheet');
    expect(tabs.length).toBe(2);
    expect(content.querySelector('.tab-sheet-active')?.getAttribute('data-tab-target')).toBe('properties');
  });

  it('re-renders for the selected element and edits its model on change', () => {
    new PropertiesPanel(registrar, bus, provider, settingsDef(), new CommandStack(bus));
    const content = registrar.open();
    const node = nodeDef();

    bus.emit('selection.changed', [], [{ definition: node }]);

    const nameInput = content.querySelector('input[name="name"]') as HTMLInputElement;
    expect(nameInput.value).toBe('Alpha');

    const updated = vi.fn();
    bus.on('element.updated', updated);
    nameInput.value = 'Renamed';
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(node.name).toBe('Renamed');
    expect(updated).toHaveBeenCalledWith('N1', node);
  });

  it('routes a property edit through the command stack so it is undoable', () => {
    const stack = new CommandStack(bus);
    bus.emit('d3canvas.init'); // enable recording
    new PropertiesPanel(registrar, bus, provider, settingsDef(), stack);
    const content = registrar.open();
    const node = nodeDef();
    bus.emit('selection.changed', [], [{ definition: node }]);

    const nameInput = content.querySelector('input[name="name"]') as HTMLInputElement;
    nameInput.value = 'Renamed';
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(node.name).toBe('Renamed');
    expect(stack.canUndo()).toBe(true);

    stack.undo();
    expect(node.name).toBe('Alpha'); // the prior value was captured and restored
  });

  it('switches tabs on click', () => {
    new PropertiesPanel(registrar, bus, provider, settingsDef(), new CommandStack(bus));
    const content = registrar.open();

    const formatTab = content.querySelector('.tab-sheet[data-tab-target="format"]') as HTMLElement;
    formatTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(formatTab.classList.contains('tab-sheet-active')).toBe(true);
    expect(
      content.querySelector('.pfdjs-pp-content[data-tab-target="format"]')?.classList.contains('open')
    ).toBe(true);
  });
});
