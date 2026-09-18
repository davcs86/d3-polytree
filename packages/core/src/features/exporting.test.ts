import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import { Canvas } from '@d3-polytree/canvas';
import { Exporting, type ExportHost } from './exporting';

function decodeDataUrl(url: string): string {
  const base64 = url.split(',')[1];
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

describe('@d3-polytree/core Exporting', () => {
  let canvas: Canvas;
  let host: ExportHost;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = new Canvas({ container: document.body }, new EventEmitter<DiagramEventMap>());
    host = {
      exportDiagram: () => '<pfdn:diagram/>',
      exportSVG: () => '<svg><g/></svg>'
    };
  });

  it('inserts a hidden download anchor into the container', () => {
    new Exporting(canvas, host);
    const anchor = canvas.getContainer().querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.style.display).toBe('none');
  });

  it('exports .pfdn as a base64 data URL and triggers the download', async () => {
    const exporting = new Exporting(canvas, host);
    const anchor = canvas.getContainer().querySelector('a') as HTMLAnchorElement;
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});

    await exporting.trigger('pfdn');

    const href = anchor.getAttribute('href') ?? '';
    expect(href.startsWith('data:application/xml;base64,')).toBe(true);
    expect(decodeDataUrl(href)).toBe('<pfdn:diagram/>');
    expect(anchor.getAttribute('download')).toBe('diagram.pfdn');
    expect(click).toHaveBeenCalled();
  });

  it('exports SVG source from the host', async () => {
    const exporting = new Exporting(canvas, host);
    const anchor = canvas.getContainer().querySelector('a') as HTMLAnchorElement;
    vi.spyOn(anchor, 'click').mockImplementation(() => {});

    await exporting.trigger('svg');

    expect(decodeDataUrl(anchor.getAttribute('href') ?? '')).toBe('<svg><g/></svg>');
    expect(anchor.getAttribute('download')).toBe('diagram.svg');
  });
});
