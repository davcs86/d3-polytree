import type { Canvas } from '@d3-polytree/canvas';

/** The `d3polytree` host surface the exporter needs (provided by the viewer). */
export interface ExportHost {
  exportDiagram(): string;
  exportSVG(): string;
}

/** Supported export formats. */
export type ExportFormat = 'pfdn' | 'svg' | 'png';

/** UTF-8-safe base64 (replaces the source's `btoa(unescape(encodeURIComponent()))`). */
function toBase64(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

/**
 * Exports the diagram as `.pfdn`, SVG or PNG via a hidden download anchor.
 *
 * Ported from `core-v2beta`'s `features/exporting/Exporting.js`, modernised off
 * `q`/`min-dom`/`lodash` onto native Promises and DOM. The model/SVG sources
 * come from the `d3polytree` host (the viewer).
 */
export class Exporting {
  static readonly $inject = ['canvas', 'd3polytree'];

  private readonly _canvas: Canvas;
  private readonly _host: ExportHost;
  private readonly _exporter: HTMLAnchorElement;

  constructor(canvas: Canvas, host: ExportHost) {
    this._canvas = canvas;
    this._host = host;
    this._exporter = this._createExporter();
  }

  async trigger(fileType: ExportFormat): Promise<void> {
    let exportStr: string;
    if (fileType === 'pfdn') {
      exportStr = this._encodeXml(this._host.exportDiagram());
    } else if (fileType === 'svg') {
      exportStr = this._encodeXml(this._host.exportSVG());
    } else if (fileType === 'png') {
      exportStr = await this._svgToImage(this._host.exportSVG());
    } else {
      console.error('Format not supported');
      return;
    }
    this._exporter.setAttribute('href', exportStr);
    this._exporter.setAttribute('download', `diagram.${fileType}`);
    this._exporter.click();
  }

  private _encodeXml(data: string): string {
    return `data:application/xml;base64,${toBase64(data)}`;
  }

  private _svgToImage(data: string): Promise<string> {
    return new Promise((resolve) => {
      const imgSrc = `data:image/svg+xml;base64,${toBase64(data)}`;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const host = this._canvas.getSVG().node()?.parentNode as HTMLElement | null;
      const width = host?.offsetWidth ?? 0;
      const height = host?.offsetHeight ?? 0;
      canvas.width = width;
      canvas.height = height;

      const image = new Image();
      image.onload = () => {
        context?.clearRect(0, 0, width, height);
        context?.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      image.src = imgSrc;
    });
  }

  private _createExporter(): HTMLAnchorElement {
    const exporter = document.createElement('a');
    Object.assign(exporter.style, {
      width: '1px',
      height: '1px',
      display: 'none',
      overflow: 'hidden'
    });
    const container = this._canvas.getContainer();
    container.insertBefore(exporter, container.firstChild);
    return exporter;
  }
}
