import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/core';
import type { EntryFactory, EntryResource } from './EntryFactory';
import { is, startCase, type Definition } from './utils';

/** A group of entries within a tab. */
export interface PropertiesGroup {
  id: string;
  label: string;
  entries: EntryResource[];
}

/** A properties-panel tab. */
export interface PropertiesTab {
  id: string;
  label: string;
  groups: PropertiesGroup[];
}

/** Icon registry token: icon type → SVG source. */
export type IconMap = Record<string, string>;

/** A properties provider: supplies the tabs for a selected element. */
export interface PropertiesProvider {
  getTabs(element: Definition): PropertiesTab[];
  updateDrawing(definition: Definition): void;
}

// --- pfdn property parts (ported from provider/pfdn/tabs/parts/*) ------------

function nameProps(group: PropertiesGroup, element: Definition, factory: EntryFactory): void {
  if (is(element, 'pfdn:Node')) {
    group.entries.push(factory.textField({ id: 'name', label: 'Name', modelProperty: 'name' }));
    group.entries.push(factory.textField({ id: 'tag', label: 'Tag', modelProperty: 'tag' }));
    group.entries.push(
      factory.textField({ id: 'label.text', label: 'Diagram label', modelProperty: 'label.text' })
    );
  } else if (is(element, 'pfdn:Settings')) {
    group.entries.push(factory.textField({ id: 'name', label: 'Diagram name', modelProperty: 'name' }));
    group.entries.push(factory.textField({ id: 'author', label: "Author's name", modelProperty: 'author' }));
  } else if (is(element, 'pfdn:Link')) {
    group.entries.push(
      factory.textField({ id: 'label.text', label: 'Diagram label', modelProperty: 'label.text' })
    );
  } else if (is(element, 'pfdn:Label')) {
    group.entries.push(factory.textField({ id: 'text', label: 'Label', modelProperty: 'text' }));
  }
}

function nodeFormatProps(
  group: PropertiesGroup,
  element: Definition,
  factory: EntryFactory,
  icons: IconMap
): void {
  if (!is(element, 'pfdn:Node')) {
    return;
  }
  const selectOptions = Object.keys(icons).map((key) => ({ value: key, name: startCase(key) }));
  group.entries.push(
    factory.selectBox({
      id: 'type',
      label: 'Icon',
      modelProperty: 'type',
      allowEmpty: false,
      selectOptions
    })
  );
  group.entries.push(
    factory.textField({ id: 'size', label: 'Size', modelProperty: 'size', type: 'number' })
  );
}

function linkFormatProps(group: PropertiesGroup, element: Definition, factory: EntryFactory): void {
  if (!is(element, 'pfdn:Link')) {
    return;
  }
  group.entries.push(
    factory.textField({ id: 'lineWidth', label: 'Line width', modelProperty: 'lineWidth', type: 'number' })
  );
  group.entries.push(
    factory.colorPicker({ id: 'lineColor', label: 'Line color', modelProperty: 'lineColor' })
  );
}

function labelFormatProps(group: PropertiesGroup, element: Definition, factory: EntryFactory): void {
  if (is(element, 'pfdn:Node') || is(element, 'pfdn:Link')) {
    group.entries.push(
      factory.textField({
        id: 'label.fontSize',
        label: 'Font size',
        modelProperty: 'label.fontSize',
        type: 'number'
      })
    );
    group.entries.push(
      factory.colorPicker({ id: 'label.color', label: 'Color', modelProperty: 'label.color' })
    );
  } else if (is(element, 'pfdn:Label')) {
    group.entries.push(
      factory.textField({ id: 'fontSize', label: 'Font size', modelProperty: 'fontSize', type: 'number' })
    );
    group.entries.push(factory.colorPicker({ id: 'color', label: 'Color', modelProperty: 'color' }));
  }
}

function gridFormatProps(group: PropertiesGroup, element: Definition, factory: EntryFactory): void {
  if (!is(element, 'pfdn:Settings')) {
    return;
  }
  group.entries.push(
    factory.colorPicker({ id: 'backgroundColor', label: 'Background color', modelProperty: 'backgroundColor' })
  );
  group.entries.push(
    factory.colorPicker({ id: 'grid.lineColor', label: 'Line color', modelProperty: 'grid.lineColor' })
  );
  group.entries.push(
    factory.textField({ id: 'grid.size', label: 'Square size', modelProperty: 'grid.size', type: 'number' })
  );
  group.entries.push(
    factory.textField({ id: 'grid.lineWidth', label: 'Line width', modelProperty: 'grid.lineWidth', type: 'number' })
  );
}

/**
 * The PFDN properties provider: builds the Properties + Format tabs for the
 * selected element, and applies edits back to the drawing. Ported from
 * `provider/pfdn/*`.
 */
export class PfdnPropertiesProvider implements PropertiesProvider {
  static readonly $inject = ['icons', 'entryFactory', 'eventBus'];

  private readonly _icons: IconMap;
  private readonly _entryFactory: EntryFactory;
  private readonly _eventBus: EventEmitter<DiagramEventMap>;

  constructor(icons: IconMap, entryFactory: EntryFactory, eventBus: EventEmitter<DiagramEventMap>) {
    this._icons = icons;
    this._entryFactory = entryFactory;
    this._eventBus = eventBus;
  }

  updateDrawing(definition: Definition): void {
    if (is(definition, 'pfdn:Settings')) {
      this._eventBus.emit('canvas.resized');
      return;
    }
    this._eventBus.emit('element.updated', definition.id!, definition);
    if (is(definition, 'pfdn:Link') || is(definition, 'pfdn:Node')) {
      const label = definition.label;
      if (label) {
        this._eventBus.emit('element.updated', label.id!, label);
      }
    }
  }

  getTabs(element: Definition): PropertiesTab[] {
    const factory = this._entryFactory;
    return [this._propertiesTab(element, factory), this._formatTab(element, factory)];
  }

  private _propertiesTab(element: Definition, factory: EntryFactory): PropertiesTab {
    const general: PropertiesGroup = { id: 'general', label: 'General', entries: [] };
    nameProps(general, element, factory);
    return { id: 'properties', label: 'Properties', groups: [general] };
  }

  private _formatTab(element: Definition, factory: EntryFactory): PropertiesTab {
    const elementFormat: PropertiesGroup = { id: 'elementFormat', label: 'Element format', entries: [] };
    const labelFormat: PropertiesGroup = { id: 'labelFormat', label: 'Label format', entries: [] };
    const gridFormat: PropertiesGroup = { id: 'gridFormat', label: 'Grid format', entries: [] };

    nodeFormatProps(elementFormat, element, factory, this._icons);
    linkFormatProps(elementFormat, element, factory);
    labelFormatProps(labelFormat, element, factory);
    gridFormatProps(gridFormat, element, factory);

    return { id: 'format', label: 'Format', groups: [elementFormat, labelFormat, gridFormat] };
  }
}

/** didi module contributing the PFDN properties provider. */
export const pfdnPropertiesProviderModule = {
  __init__: ['propertiesProvider'],
  propertiesProvider: ['type', PfdnPropertiesProvider]
};
