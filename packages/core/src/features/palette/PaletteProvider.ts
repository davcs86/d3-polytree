import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { UiIconName } from '../../uiIcons';
import type { NotificationService } from '../notifications';
import type { Axes } from '../axes';
import type { Selection } from '../selection';
import type { Exporting } from '../exporting';
import type { LocalStorage } from '../localStorage';
import type { Upload } from '../upload';
import type { AutoLayout } from '../autoLayout';
import type { AddNodeHandler } from './AddNodeHandler';
import type { AddLabelHandler } from './AddLabelHandler';
import type { AddLinkTool } from './AddLinkTool';
import type { Tool } from './Tool';

/** A palette action: a click callback, or a map of gesture → callback. */
export type PaletteAction =
  | ((event?: Event) => void)
  | { click?: (event?: Event) => void; [gesture: string]: ((event?: Event) => void) | undefined };

/** A palette entry (a toolbar button). */
export interface PaletteEntry {
  title?: string;
  group?: string;
  icon?: UiIconName;
  className?: string;
  html?: string;
  action: PaletteAction;
}

/** The `d3polytree` host surface the palette provider needs. */
export interface PaletteHost {
  createDiagram(): void | Promise<void>;
}

/**
 * Supplies the palette's entries (toolbar buttons) and stateful tools. Ported
 * from `core-v2beta`'s `features/paletteProvider/PaletteProvider.js`.
 */
export class PaletteProvider {
  static readonly $inject = [
    'd3polytree',
    'eventBus',
    'localStorage',
    'upload',
    'exporting',
    'axes',
    'selection',
    'addNodeHandler',
    'addLabelHandler',
    'addLinkTool',
    'notifications',
    'autoLayout'
  ];

  private readonly _host: PaletteHost;
  private readonly _localStorage: LocalStorage;
  private readonly _upload: Upload;
  private readonly _exporting: Exporting;
  private readonly _axes: Axes;
  private readonly _selection: Selection;
  private readonly _addNodeHandler: AddNodeHandler;
  private readonly _addLabelHandler: AddLabelHandler;
  private readonly _notifications: NotificationService;
  private readonly _autoLayout: AutoLayout;
  private readonly _tools: Record<string, Tool>;

  constructor(
    host: PaletteHost,
    _eventBus: EventEmitter<DiagramEventMap>,
    localStorage: LocalStorage,
    upload: Upload,
    exporting: Exporting,
    axes: Axes,
    selection: Selection,
    addNodeHandler: AddNodeHandler,
    addLabelHandler: AddLabelHandler,
    addLinkTool: AddLinkTool,
    notifications: NotificationService,
    autoLayout: AutoLayout
  ) {
    this._host = host;
    this._localStorage = localStorage;
    this._upload = upload;
    this._exporting = exporting;
    this._axes = axes;
    this._selection = selection;
    this._addNodeHandler = addNodeHandler;
    this._addLabelHandler = addLabelHandler;
    this._notifications = notifications;
    this._autoLayout = autoLayout;
    this._tools = { addLinkTool };
  }

  getPaletteTools(): Record<string, Tool> {
    return this._tools;
  }

  getPaletteEntries(): Record<string, PaletteEntry> {
    return {
      new: {
        title: 'New diagram',
        group: 'file-ops',
        icon: 'new',
        action: {
          click: () => {
            this._notifications.warning(
              { title: 'Are you sure?', text: 'All current progress will be unrecoverable.' },
              (confirmed) => {
                if (confirmed) {
                  void this._host.createDiagram();
                }
              }
            );
          }
        }
      },
      save: {
        title: 'Save diagram',
        group: 'file-ops',
        icon: 'save',
        action: { click: () => this._localStorage.save() }
      },
      open: {
        title: 'Open diagram',
        group: 'file-ops',
        icon: 'open',
        action: { click: () => this._upload.openDialog() }
      },
      download: {
        title: 'Download diagram',
        group: 'file-ops',
        icon: 'download',
        action: { click: () => void this._exporting.trigger('pfdn') }
      },
      'export-svg': {
        title: 'Download as SVG image',
        group: 'file-export',
        icon: 'export-code',
        action: { click: () => void this._exporting.trigger('svg') }
      },
      'export-png': {
        title: 'Download as PNG image',
        group: 'file-export',
        icon: 'export-image',
        action: { click: () => void this._exporting.trigger('png') }
      },
      'new-connection': {
        title: 'New connection',
        group: 'drawing',
        icon: 'link',
        action: { click: () => this._tools.addLinkTool.activate() }
      },
      'new-label': {
        title: 'New label',
        group: 'drawing',
        icon: 'label',
        action: { click: () => this._addLabelHandler.append() }
      },
      'new-node': {
        title: 'New node',
        group: 'drawing',
        icon: 'node',
        action: { click: () => this._addNodeHandler.append() }
      },
      'delete-item': {
        title: 'Delete selected item(s)',
        group: 'utils',
        icon: 'delete',
        action: { click: () => this._selection.deleteSelected() }
      },
      'toggle-grid': {
        title: 'Show/hide grid',
        group: 'settings',
        icon: 'grid',
        action: { click: () => this._axes.toggleVisible() }
      },
      'auto-layout': {
        title: 'Auto-layout diagram',
        group: 'settings',
        icon: 'layout',
        action: { click: () => void this._autoLayout.apply() }
      }
    };
  }
}
