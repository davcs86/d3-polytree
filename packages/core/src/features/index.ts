import { MouseEvents } from './mouseEvents';
import { Selection } from './selection';
import { Zoom } from './zoom';
import { ZoomScroll } from './zoomScroll';
import { BackgroundColor } from './backgroundColor';
import { Axes } from './axes';
import { Outline } from './outline';
import { Drag } from './drag';
import { Exporting } from './exporting';
import { LocalStorage } from './localStorage';
import { Upload } from './upload';
import { ResizeElement } from './resizeElement';
import { NoticePopup } from './noticePopup';
import { AddNodeHandler, AddLabelHandler, AddLinkTool, PaletteProvider, Palette } from './palette';
import { notificationsModule } from './notifications';
import { drawingRegistryModule } from '../draw';
import { modellingModule } from '../modelling';
import { calculateCenterModule } from '../utils/calculateCenter';

export * from './notifications';
export { MouseEvents } from './mouseEvents';
export { Selection } from './selection';
export type { SelectionEntry } from './selection';
export { Zoom } from './zoom';
export { ZoomScroll } from './zoomScroll';
export { BackgroundColor } from './backgroundColor';
export { Axes } from './axes';
export { Outline } from './outline';
export { Drag } from './drag';
export { Exporting } from './exporting';
export type { ExportFormat, ExportHost } from './exporting';
export { LocalStorage } from './localStorage';
export type { StorageHost } from './localStorage';
export { Upload } from './upload';
export type { UploadHost } from './upload';
export { ResizeElement } from './resizeElement';
export { NoticePopup } from './noticePopup';
export {
  BaseAddHandler,
  AddNodeHandler,
  AddLabelHandler,
  AddLinkTool,
  PaletteProvider,
  Palette
} from './palette';
export type { Tool, PaletteAction, PaletteEntry, PaletteHost } from './palette';

/**
 * didi module contributing the mouse-event bridge: re-emits DOM mouse events on
 * drawn elements as typed `<class>.<kind>` bus events.
 */
export const mouseEventsModule = {
  __init__: ['mouseEvents'],
  mouseEvents: ['type', MouseEvents]
};

/** didi module contributing element selection tracking. */
export const selectionModule = {
  __init__: ['selection'],
  selection: ['type', Selection],
  __depends__: [mouseEventsModule]
};

/** didi module contributing pan/zoom on the canvas drawing layer. */
export const zoomModule = {
  __init__: ['zoom'],
  zoom: ['type', Zoom],
  __depends__: [calculateCenterModule]
};

/** didi module enabling interactive scroll/drag zoom. */
export const zoomScrollModule = {
  __init__: ['zoomScroll'],
  zoomScroll: ['type', ZoomScroll],
  __depends__: [zoomModule]
};

/** didi module painting the canvas background from settings. */
export const backgroundColorModule = {
  __init__: ['backgroundColor'],
  backgroundColor: ['type', BackgroundColor]
};

/** didi module drawing the background grid, aligned to the zoom transform. */
export const axesModule = {
  __init__: ['axes'],
  axes: ['type', Axes],
  __depends__: [zoomModule]
};

/** didi module adding a selection outline to every drawn element. */
export const outlineModule = {
  __init__: ['outline'],
  outline: ['type', Outline]
};

/** didi module enabling dragging of outlined elements. */
export const dragModule = {
  __init__: ['drag'],
  drag: ['type', Drag],
  __depends__: [outlineModule, selectionModule, drawingRegistryModule]
};

/** didi module providing diagram export (.pfdn / SVG / PNG). */
export const exportingModule = {
  __init__: ['exporting'],
  exporting: ['type', Exporting]
};

/** didi module persisting the diagram to browser localStorage. */
export const localStorageModule = {
  __init__: ['localStorage'],
  localStorage: ['type', LocalStorage]
};

/** didi module opening a `.pfdn` document from disk. */
export const uploadModule = {
  __init__: ['upload'],
  upload: ['type', Upload]
};

/** didi module contributing the add-node palette handler. */
export const addNodeHandlerModule = {
  __init__: ['addNodeHandler'],
  addNodeHandler: ['type', AddNodeHandler],
  __depends__: [drawingRegistryModule, selectionModule, modellingModule]
};

/** didi module contributing the add-label palette handler. */
export const addLabelHandlerModule = {
  __init__: ['addLabelHandler'],
  addLabelHandler: ['type', AddLabelHandler],
  __depends__: [drawingRegistryModule, selectionModule, modellingModule]
};

/** didi module contributing the two-click link tool. */
export const addLinkToolModule = {
  __init__: ['addLinkTool'],
  addLinkTool: ['type', AddLinkTool],
  __depends__: [modellingModule]
};

/** didi module supplying the palette entries and tools. */
export const paletteProviderModule = {
  __init__: ['paletteProvider'],
  paletteProvider: ['type', PaletteProvider],
  __depends__: [
    addNodeHandlerModule,
    addLabelHandlerModule,
    addLinkToolModule,
    localStorageModule,
    uploadModule,
    exportingModule,
    axesModule,
    selectionModule,
    notificationsModule
  ]
};

/** didi module contributing the palette toolbar. */
export const paletteModule = {
  __init__: ['palette'],
  palette: ['type', Palette],
  __depends__: [paletteProviderModule]
};

/** didi module adding resize handles to node outlines. */
export const resizeElementModule = {
  __init__: ['resizeElement'],
  resizeElement: ['type', ResizeElement],
  __depends__: [outlineModule]
};

/** didi module adding the project notice popup button. */
export const noticePopupModule = {
  __init__: ['noticePopup'],
  noticePopup: ['type', NoticePopup],
  __depends__: [notificationsModule]
};
