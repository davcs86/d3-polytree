import type { Selection } from 'd3-selection';
import type { DefsSelection, DrawingRegistry, DrawingSelection } from '../draw';
import type { NotificationService, NotificationType } from './notifications';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The four alert kinds. */
export type AlertType = 'error' | 'info' | 'success' | 'warning';

const ALERT_TYPES: Record<string, AlertType> = {
  error: 'error',
  info: 'info',
  success: 'success',
  warning: 'warning'
};

/** Inline alert icon sources (were separate SVG assets in the source engine). */
const ALERT_ICONS: Record<AlertType, string> = {
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#D8000C">' +
    '<circle cx="100" cy="100" r="100" fill="#fff"/><circle cx="100" cy="100" r="95"/>' +
    '<circle cx="100" cy="100" r="90" fill="#fff"/><circle cx="100" cy="100" r="87"/></g>' +
    '<path fill="#fff" d="M153.663 134.653l-35.265-32.672 35.265-32.67-16.566-15.345-35.265 32.67-35.265-32.67L50 69.31l35.265 32.67L50 134.654 66.567 150l35.265-32.67L137.097 150"/></svg>',
  info:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#1F75FE">' +
    '<circle cx="100" cy="100" r="100" fill="#fff"/><circle cx="100" cy="100" r="95"/>' +
    '<circle cx="100" cy="100" r="90" fill="#fff"/><circle cx="100" cy="100" r="87"/></g>' +
    '<path fill="#fff" d="M114.605 39.133c-5.14 0-9.307 4.167-9.307 9.307 0 5.14 4.167 9.307 9.307 9.307 5.14 0 9.307-4.167 9.307-9.307 0-5.14-4.167-9.307-9.307-9.307zM103.22 63.106c-6.1.304-12.586 3.594-18.03 8.227l-.583 7.063c5.145-2.234 10.427-2.245 12.008 3.075 3.848 12.943-9.362 35.627-12.963 47.49-9.77 32.19 13.684 35.91 30.413 22.645l.665-7.644c-9.102 3.16-15.607-.716-10.346-17.533 2.535-8.112 23.754-48.99 9.1-60.245-3.07-2.356-6.603-3.256-10.263-3.074z"/></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#4BB543">' +
    '<circle cx="100" cy="100" r="100" fill="#fff"/><circle cx="100" cy="100" r="95"/>' +
    '<circle cx="100" cy="100" r="90" fill="#fff"/><circle cx="100" cy="100" r="87"/></g>' +
    '<path fill="#fff" d="M150.003 52.712c-1.95-1.952-5.15-1.952-7.102 0l-62.994 63c-1.952 1.952-5.15 1.952-7.103 0l-15.516-15.515c-1.952-1.952-5.15-1.952-7.102 0l-9.516 9.52c-1.953 1.953-1.953 5.152 0 7.104l32.133 32.13c1.952 1.95 5.15 1.95 7.103 0l79.614-79.62c1.952-1.952 1.952-5.15 0-7.102z"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#F8CA00">' +
    '<circle cx="100" cy="100" r="100" fill="#fff"/><circle cx="100" cy="100" r="95"/>' +
    '<circle cx="100" cy="100" r="90" fill="#fff"/><circle cx="100" cy="100" r="87"/></g>' +
    '<path fill="#fff" d="M102.506 40.44c-7.136 0-12.922 5.786-12.922 12.923l2.585 51.687c0 5.71 4.626 10.338 10.335 10.338 5.71 0 10.338-4.63 10.338-10.338l2.584-51.687c0-7.137-5.785-12.922-12.922-12.922zm0 87.87c-8.564 0-15.506 6.94-15.506 15.505 0 8.563 6.942 15.506 15.506 15.506s15.507-6.942 15.507-15.505c0-8.564-6.943-15.507-15.507-15.507z"/></svg>'
};

interface Alert {
  element: DrawingSelection;
  selection: Selection<SVGSVGElement, unknown, null, undefined>;
  message: string;
  type: AlertType;
}

/**
 * Shows blinking alert badges on nodes; clicking one raises a notification.
 *
 * Ported from `core-v2beta`'s `features/alertIcons/AlertIcons.js`, modernised
 * off `xml2js` onto `DOMParser` (the alert icon `<symbol>`s are built directly
 * into the shared `<defs>`, as {@link IconLoader} does for node icons) and off
 * the inlined SVG asset imports onto string constants.
 */
export class AlertIcons {
  static readonly $inject = ['defs', 'notifications', 'drawingRegistry'];

  private readonly _defs: DefsSelection;
  private readonly _notifications: NotificationService;
  private readonly _drawingRegistry: DrawingRegistry;
  private readonly _viewBoxes: Record<string, string> = {};
  private _alerts: Record<string, Alert> = {};

  constructor(
    defs: DefsSelection,
    notifications: NotificationService,
    drawingRegistry: DrawingRegistry
  ) {
    this._defs = defs;
    this._notifications = notifications;
    this._drawingRegistry = drawingRegistry;
    this._buildSymbols();
  }

  showAlert(nodeId: string, message: string, type: string): void {
    const element = this._drawingRegistry.get(nodeId);
    if (!element) {
      return;
    }
    const resolved = ALERT_TYPES[type] ?? 'info';
    const existing = this.getAlert(nodeId);
    this._alerts[nodeId] = existing
      ? this._updateAlert(existing, message, resolved)
      : this._createAlert(element, message, resolved);
  }

  getAlert(nodeId: string): Alert | undefined {
    return this._alerts[nodeId];
  }

  removeAlert(nodeId: string): void {
    const alert = this.getAlert(nodeId);
    if (alert) {
      this._clearAlert(alert);
      delete this._alerts[nodeId];
    }
  }

  clear(): void {
    Object.values(this._alerts).forEach((alert) => this._clearAlert(alert));
    this._alerts = {};
  }

  private _clearAlert(alert: Alert): void {
    alert.element.select('.innerElement').classed('blink', false);
    alert.selection.on('mousedown', null);
    alert.selection.remove();
  }

  private _createAlert(element: DrawingSelection, message: string, type: AlertType): Alert {
    const selection = element
      .select('.innerElement')
      .append('svg')
      .attr('class', 'alertIcon')
      .attr('x', -2)
      .attr('y', -2)
      .attr('width', 10)
      .attr('height', 10)
      .attr('preserveAspectRatio', 'xMaxYMax meet') as Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;
    selection.append('use');

    const alert: Alert = { element, selection, message, type };
    return this._updateAlert(alert, message, type);
  }

  private _updateAlert(alert: Alert, message: string, type: AlertType): Alert {
    alert.selection
      .attr('viewBox', this._viewBoxes[type] ?? '')
      .select('use')
      .attr('href', `#${type}_alerticon_def`);

    alert.message = message.replace(/(<([^>]+)>)/gi, '');
    alert.type = type;
    alert.selection.on('mousedown', () => {
      this._notifications.notify(
        { title: alert.type, text: alert.message },
        alert.type as NotificationType
      );
    });
    alert.element.select('.innerElement').classed('blink', true);
    return alert;
  }

  private _buildSymbols(): void {
    const defsNode = this._defs.node();
    if (!defsNode) {
      return;
    }
    (Object.entries(ALERT_ICONS) as [AlertType, string][]).forEach(([type, source]) => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') {
        return;
      }
      const viewBox = svg.getAttribute('viewBox') ?? '';
      const symbol = document.createElementNS(SVG_NS, 'symbol');
      symbol.setAttribute('id', `${type}_alerticon_def`);
      if (viewBox) {
        symbol.setAttribute('viewBox', viewBox);
      }
      Array.from(svg.childNodes).forEach((child) =>
        symbol.appendChild(document.importNode(child, true))
      );
      defsNode.appendChild(symbol);
      this._viewBoxes[type] = viewBox;
    });
  }
}
