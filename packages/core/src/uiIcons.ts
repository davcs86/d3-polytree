/**
 * UI icon set for the chrome (palette toolbar, side-tab strip, panel close) —
 * distinct from the diagram *node* icons handled by `draw/IconLoader`.
 *
 * Rendered as inline SVG rather than an icon font: the glyphs come from
 * [Lucide](https://lucide.dev) (ISC-licensed), the framework-agnostic icon set
 * behind shadcn/ui. Inline SVG is accessible (`aria-hidden` + `focusable`),
 * tree-shakeable, has no FOUT and needs no binary font asset shipped with the
 * CSS. The paths are vendored (a fixed, tiny set) so no runtime dependency is
 * added — consistent with the repo's slim/peer-dependency stance.
 *
 * Icons inherit their size from the host's `font-size` (`width`/`height` are
 * `1em`) and their colour from `currentColor` (`stroke`), so the existing panel
 * CSS controls them exactly as it controlled the former font glyphs.
 */

/** The set of chrome icons the components render. */
export type UiIconName =
  | 'search'
  | 'sliders'
  | 'close'
  | 'new'
  | 'save'
  | 'open'
  | 'download'
  | 'export-code'
  | 'export-image'
  | 'link'
  | 'label'
  | 'node'
  | 'delete'
  | 'grid'
  | 'layout';

/** Inner SVG markup (Lucide 24×24 stroke icons) keyed by {@link UiIconName}. */
const ICON_PATHS: Record<UiIconName, string> = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  new: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 18v-6"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  open: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'export-code':
    '<path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/>',
  'export-image':
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  link: '<path d="M13 5H19V11"/><path d="M19 5 5 19"/>',
  label:
    '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  node: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
  delete:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  grid: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  // Lucide "network" — a layered graph, apt for the auto-layout action.
  layout:
    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>'
};

/** The SVG string for an icon (empty for an unknown name). */
export function iconSvg(name: UiIconName, extraClass?: string): string {
  const inner = ICON_PATHS[name];
  if (!inner) {
    return '';
  }
  const cls = `pfdjs-icon pfdjs-icon-${name}${extraClass ? ` ${extraClass}` : ''}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" ` +
    `width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`
  );
}

/**
 * Build an inline SVG icon element for a chrome control. Returns `null` for an
 * unknown name so callers can render nothing gracefully.
 */
export function createIcon(name: UiIconName, extraClass?: string): SVGElement | null {
  const markup = iconSvg(name, extraClass);
  if (!markup) {
    return null;
  }
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild as SVGElement;
}
