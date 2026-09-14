import type { Canvas } from '@d3-polytree/canvas';

/** The `d3polytree` host surface upload needs (provided by the viewer). */
export interface UploadHost {
  importDiagram(xml: string): Promise<void>;
}

/**
 * Opens a `.pfdn` document from the user's disk via a hidden file input.
 *
 * Ported from `core-v2beta`'s `features/upload/Upload.js`, modernised off
 * `min-dom` / `lodash` onto native DOM and the `FileReader` API.
 */
export class Upload {
  static readonly $inject = ['canvas', 'd3polytree'];

  private readonly _host: UploadHost;
  private readonly _fileInput: HTMLInputElement;

  constructor(canvas: Canvas, host: UploadHost) {
    this._host = host;
    this._fileInput = this._createInput(canvas);
  }

  /** Prompt the user to choose a file. */
  openDialog(): void {
    this._fileInput.click();
  }

  private _createInput(canvas: Canvas): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    Object.assign(input.style, {
      width: '1px',
      height: '1px',
      display: 'none',
      overflow: 'hidden'
    });
    const container = canvas.getContainer();
    container.insertBefore(input, container.firstChild);

    input.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      void this._openFile(file);
    });
    return input;
  }

  private _openFile(file: File | undefined): void {
    if (typeof FileReader === 'undefined') {
      window.alert('Your browser does not support file upload. Try a modern browser.');
      return;
    }
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result;
      if (typeof xml === 'string') {
        void this._host.importDiagram(xml);
      }
    };
    reader.readAsText(file);
  }
}
