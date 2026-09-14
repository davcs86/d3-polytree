import type { DefsSelection } from './Defs';
import { DEFAULT_ICON, type IconMap } from './Icons';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const REF_ATTRS = [
  'clip-path',
  'fill',
  'stroke',
  'mask',
  'filter',
  'marker-start',
  'marker-mid',
  'marker-end'
];

/** Prefix every id in `root` with `key_` and rewrite local `#id` references. */
function namespaceIds(root: Element, key: string): void {
  const idMap = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((el) => {
    const oldId = el.getAttribute('id') as string;
    const newId = `${key}_${oldId}`;
    idMap.set(oldId, newId);
    el.setAttribute('id', newId);
  });
  if (idMap.size === 0) {
    return;
  }
  const rewrite = (value: string): string =>
    value.replace(/#([^\s)'"]+)/g, (match, id: string) =>
      idMap.has(id) ? `#${idMap.get(id)}` : match
    );

  root.querySelectorAll('*').forEach((el) => {
    const xlink = el.getAttributeNS(XLINK_NS, 'href');
    if (xlink && xlink.includes('#')) {
      el.setAttributeNS(XLINK_NS, 'href', rewrite(xlink));
    }
    const href = el.getAttribute('href');
    if (href && href.includes('#')) {
      el.setAttribute('href', rewrite(href));
    }
    REF_ATTRS.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (value && value.includes('#')) {
        el.setAttribute(attr, rewrite(value));
      }
    });
  });
}

/**
 * Parses icon SVG sources into reusable `<symbol>` definitions in the shared
 * `<defs>` element. Uses the native DOMParser (the original used a bundled
 * Node XML parser, `xml2js` — dropped here).
 */
export class IconLoader {
  static readonly $inject = ['icons', 'defs'];

  private readonly _defs: DefsSelection;
  private readonly _icons: IconMap;
  private readonly _viewBoxes: Record<string, string> = {};

  constructor(icons: IconMap, defs: DefsSelection) {
    this._icons = { ...icons };
    this._defs = defs;
    this._init();
  }

  private _init(): void {
    if (!this._icons.default) {
      this._icons.default = DEFAULT_ICON;
    }
    const defsNode = this._defs.node();
    if (!defsNode) {
      return;
    }
    Object.entries(this._icons).forEach(([key, source]) => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') {
        return; // malformed icon source
      }
      const viewBox = svg.getAttribute('viewBox') ?? '';
      const symbol = document.createElementNS(SVG_NS, 'symbol');
      symbol.setAttribute('id', `${key}_icon_def`);
      if (viewBox) {
        symbol.setAttribute('viewBox', viewBox);
      }
      Array.from(svg.childNodes).forEach((child) =>
        symbol.appendChild(document.importNode(child, true))
      );
      namespaceIds(symbol, key);
      defsNode.appendChild(symbol);
      this._viewBoxes[key] = viewBox;
    });
  }

  hasIcon(type: string): boolean {
    return Object.prototype.hasOwnProperty.call(this._viewBoxes, type);
  }

  /** viewBox for `type`, falling back to the default icon's. */
  getViewBox(type: string): string {
    return this._viewBoxes[type] ?? this._viewBoxes.default ?? '';
  }

  /** `#…_icon_def` reference for a `<use>`, falling back to the default. */
  symbolHref(type: string): string {
    return `#${this.hasIcon(type) ? type : 'default'}_icon_def`;
  }
}
