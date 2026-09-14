import { describe, it, expect, beforeEach } from 'vitest';
import { IconLoader } from './IconLoader';
import { createIcons } from './Icons';
import { createDefs } from './Defs';
import { makeServices } from './drawerTestUtils';

describe('IconLoader', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a <symbol> for the default icon', () => {
    const s = makeServices();
    const loader = new IconLoader(createIcons(), createDefs(s.canvas));
    const symbol = s.canvas.getSVG().select('#default_icon_def');
    expect(symbol.empty()).toBe(false);
    expect(symbol.attr('viewBox')).toBe('0 0 100 100');
    expect(symbol.select('rect').empty()).toBe(false);
    expect(loader.getViewBox('default')).toBe('0 0 100 100');
    expect(loader.symbolHref('default')).toBe('#default_icon_def');
  });

  it('namespaces ids inside a custom icon and rewrites references', () => {
    const s = makeServices();
    const icons = {
      ...createIcons(),
      custom:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
        '<clipPath id="c1"><rect width="5" height="5"/></clipPath>' +
        '<rect clip-path="url(#c1)" width="10" height="10"/></svg>'
    };
    const loader = new IconLoader(icons, createDefs(s.canvas));
    const symbol = s.canvas.getSVG().select('#custom_icon_def');
    expect(symbol.empty()).toBe(false);
    // id prefixed, and the reference rewritten to match
    expect(symbol.select('clipPath').attr('id')).toBe('custom_c1');
    expect(symbol.select('rect[clip-path]').attr('clip-path')).toBe('url(#custom_c1)');
    expect(loader.getViewBox('custom')).toBe('0 0 10 10');
    expect(loader.symbolHref('custom')).toBe('#custom_icon_def');
  });

  it('falls back to the default icon for unknown types', () => {
    const s = makeServices();
    const loader = new IconLoader(createIcons(), createDefs(s.canvas));
    expect(loader.hasIcon('missing')).toBe(false);
    expect(loader.symbolHref('missing')).toBe('#default_icon_def');
    expect(loader.getViewBox('missing')).toBe('0 0 100 100');
  });
});
