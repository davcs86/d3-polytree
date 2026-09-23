import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/core';
import { deepGet, deepSet, isHexColor, type Definition } from './utils';

/** A `{name,value}` option for a select entry. */
export interface SelectOption {
  name: string;
  value: string;
}

/** Options accepted when building an entry. */
export interface EntryOptions {
  id: string;
  modelProperty: string;
  label?: string;
  description?: string;
  type?: string;
  allowEmpty?: boolean;
  selectOptions?: SelectOption[];
}

/** A rendered property entry: its markup plus get/set behaviour. */
export interface EntryResource extends EntryOptions {
  html: string;
  get: (element: Definition, formNode: HTMLElement) => void;
  set: (element: Definition, values: Record<string, unknown>) => boolean;
  validate: () => Record<string, unknown>;
  triggerUpdate: (propertyId: string, element: Definition) => void;
}

function ensureNotNull(prop: string | undefined): string {
  if (!prop) {
    throw new Error(`${prop} must be set.`);
  }
  return prop;
}

/**
 * Builds property-panel entries (text / select / colour / spreadsheet). Ported
 * from `@d3-polytree/properties-panel`'s `entryFactory/*`, de-jQuery-ed onto
 * native DOM; the colour entry uses a native `<input type="color">` in place of
 * spectrum-colorpicker.
 */
export class EntryFactory {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter<DiagramEventMap>;

  constructor(eventBus: EventEmitter<DiagramEventMap>) {
    this._eventBus = eventBus;
  }

  setDefaultParameters(options: EntryOptions): EntryResource {
    const eventBus = this._eventBus;

    const defaultGet = (element: Definition, formNode: HTMLElement): void => {
      const prop = ensureNotNull(options.modelProperty);
      const value = deepGet(element, prop);
      const input = formNode.querySelector('input');
      if (input) {
        (input as HTMLInputElement).value = value == null ? '' : String(value);
      }
    };

    const defaultSet = (element: Definition, values: Record<string, unknown>): boolean => {
      const prop = ensureNotNull(options.modelProperty);
      deepSet(element as unknown as Record<string, unknown>, prop, deepGet(values, prop));
      return true;
    };

    const triggerUpdate = (propertyId: string, element: Definition): void => {
      eventBus.emit('PropertiesPanel.propertyChanged', propertyId, element);
    };

    return {
      html: '',
      description: '',
      get: defaultGet,
      set: defaultSet,
      validate: () => ({}),
      ...options,
      triggerUpdate
    };
  }

  textField(options: EntryOptions): EntryResource {
    return textInputField(this.setDefaultParameters(options));
  }

  selectBox(options: EntryOptions): EntryResource {
    return selectBoxField(this.setDefaultParameters(options));
  }

  colorPicker(options: EntryOptions): EntryResource {
    return colorPickerField(this.setDefaultParameters(options));
  }

  spreadsheet(options: EntryOptions): EntryResource {
    // Placeholder in the source engine; kept as an API-compatible no-op.
    return this.setDefaultParameters(options);
  }
}

function fieldWrapper(resource: EntryResource, inner: string): string {
  const label = resource.label ?? resource.id;
  return (
    `<div class="pfdjs-pp-field-wrapper">` +
    `<label for="pfdjs-${resource.id}">${label}</label>${inner}</div>`
  );
}

function textInputField(resource: EntryResource): EntryResource {
  const type = resource.type ?? 'text';
  resource.html = fieldWrapper(
    resource,
    `<input id="pfdjs-${resource.id}" type="${type}" name="${resource.modelProperty}" />`
  );
  return resource;
}

function selectBoxField(resource: EntryResource): EntryResource {
  const allowEmpty = resource.allowEmpty ?? true;
  const options = Array.isArray(resource.selectOptions)
    ? resource.selectOptions.concat(allowEmpty ? [{ name: '', value: '' }] : [])
    : [{ name: '', value: '' }];

  const optionsHtml = options.map((o) => `<option value="${o.value}">${o.name}</option>`).join('');
  resource.html = fieldWrapper(
    resource,
    `<select id="pfdjs-${resource.id}" name="${resource.modelProperty}">${optionsHtml}</select>`
  );

  resource.get = (element, formNode) => {
    const value = element.get(resource.modelProperty) ?? 'default';
    formNode
      .querySelectorAll<HTMLOptionElement>(`select#pfdjs-${resource.id} > option`)
      .forEach((option) => {
        option.selected = option.value === value;
      });
  };

  return resource;
}

function colorPickerField(resource: EntryResource): EntryResource {
  resource.html = fieldWrapper(
    resource,
    `<input id="pfdjs-${resource.id}" type="color" name="${resource.modelProperty}" />`
  );
  resource.get = (element, formNode) => {
    const input = formNode.querySelector<HTMLInputElement>('input[type=color]');
    const value = deepGet(element, resource.modelProperty);
    if (input && isHexColor(value)) {
      input.value = value;
    }
  };
  return resource;
}

/** didi module contributing the entry factory. */
export const entryFactoryModule = {
  __init__: ['entryFactory'],
  entryFactory: ['type', EntryFactory]
};
