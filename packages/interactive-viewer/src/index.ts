/**
 * @d3-polytree/interactive-viewer — the static viewer plus interaction.
 *
 * Extends the base {@link Viewer} with pan/zoom, the background grid, and
 * pointer-driven selection/outline. The interaction modules are ordered *before*
 * the draw modules on purpose: `Zoom` replaces the canvas drawing layer on boot,
 * and the event-driven features (mouse events, selection, outline) must be
 * subscribed before the drawers emit their initial `<class>.created` events.
 */
import { Viewer, type ViewerOptions } from '@d3-polytree/viewer';
import {
  backgroundColorModule,
  zoomModule,
  zoomScrollModule,
  axesModule,
  mouseEventsModule,
  selectionModule,
  outlineModule,
  type DiagramModule
} from '@d3-polytree/core';
// The side-tabs host and the search panel used to be their own packages; they
// are now folded in here (they have no consumer outside the components) and
// re-exported below so `sideTabsModule` / `searchPanelModule` stay importable.
import { sideTabsModule } from './side-tabs';
import { searchPanelModule } from './search-panel';
import { domNotificationsModule } from './notifications';

export * from './side-tabs';
export * from './search-panel';
export * from './notifications';

export type InteractiveViewerOptions = ViewerOptions;

export class InteractiveViewer extends Viewer {
  /** Interaction modules layered on top of the base draw modules. */
  static readonly interactionModules: readonly DiagramModule[] = [
    backgroundColorModule as DiagramModule,
    zoomModule as DiagramModule,
    zoomScrollModule as DiagramModule,
    axesModule as DiagramModule,
    mouseEventsModule as DiagramModule,
    selectionModule as DiagramModule,
    outlineModule as DiagramModule,
    // side panel host + the search panel (subscribes to <class>.created, so it
    // must boot before the drawers emit — hence it lives in interactionModules)
    sideTabsModule as DiagramModule,
    searchPanelModule as DiagramModule
  ];

  getModules(): readonly DiagramModule[] {
    // interaction first (zoom swaps the drawing layer, features subscribe),
    // then the drawers (which render into that layer and emit created events),
    // then the DOM notifications override *last* so it wins the `notifications`
    // token over the core console default (didi: last definition wins).
    return [
      ...InteractiveViewer.interactionModules,
      ...Viewer.modules,
      domNotificationsModule as DiagramModule
    ];
  }
}

export default InteractiveViewer;
