import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { BaseElement, DrawingRegistry, Point } from '../draw';
import type { NotificationService } from '../features/notifications';
import type { PfdnModdle } from '@d3-polytree/pfdn-moddle';
import { ModellingElement } from './ModellingElement';
import type { ModellingLabels } from './Labels';
import { computeLinkWaypoints } from './linkRouting';
import type { ModellingModelElement } from './types';

/**
 * Modelling handler for links.
 *
 * Owns link creation and keeps link paths attached to node sides as nodes move.
 * The orthogonal, edge-docked waypoint geometry lives in the draw-independent
 * {@link computeLinkWaypoints} (so the same routing runs at load time for every
 * component, editor or not — see `linkRouting.ts`); this handler is the editing
 * side of it, re-routing on `node.moved` / `node.updated`. Ported from
 * `core-v2beta`'s `features/modelling/elements/links/Links.js`.
 */
export class ModellingLinks extends ModellingElement {
  static readonly $inject = [
    'd3polytree.definitions',
    'd3polytree.moddle',
    'links',
    'eventBus',
    'drawingRegistry',
    'notifications',
    'modellingLabels'
  ];

  private readonly _moddle: PfdnModdle;
  private readonly _modellingLabels: ModellingLabels;

  constructor(
    definitions: ModellingModelElement,
    moddle: PfdnModdle,
    links: BaseElement,
    eventBus: EventEmitter<DiagramEventMap>,
    drawingRegistry: DrawingRegistry,
    notifications: NotificationService,
    modellingLabels: ModellingLabels
  ) {
    super(definitions, links, drawingRegistry, notifications, eventBus);
    this._moddle = moddle;
    this._modellingLabels = modellingLabels;
    this.init();
  }

  /** Subscribe to node movement so attached links re-route. */
  init(): void {
    this._eventBus.on('node.moved', this.updateNodeLinks, this);
    this._eventBus.on('node.updated', this.updateNodeLinks, this);
  }

  create(nodeADef: ModellingModelElement, nodeBDef: ModellingModelElement): ModellingModelElement {
    const aPos = nodeADef.position as Point;
    const bPos = nodeBDef.position as Point;
    const aSize = nodeADef.size ?? 0;
    const bSize = nodeBDef.size ?? 0;

    const x = aPos.x + aSize / 2;
    const y = aPos.y + aSize / 2;
    const x1 = bPos.x + bSize / 2;
    const y1 = bPos.y + bSize / 2;

    const waypoint1 = this._createWaypoint(x, y);
    const waypoint2 = this._createWaypoint(x1, y1);
    const newLinkDef = this._moddle.create('pfdn:Link', {
      source: nodeADef,
      target: nodeBDef,
      waypoint: [waypoint1, waypoint2],
      status: 1
    }) as unknown as ModellingModelElement;

    this._drawer.reconcile(newLinkDef.id as string, newLinkDef);

    this.updateNodeLinks(undefined, newLinkDef.target as ModellingModelElement);
    this.updateNodeLinks(undefined, newLinkDef.source as ModellingModelElement);

    // create the associated label at the link midpoint
    const linkLabel = this._modellingLabels.create({
      position: {
        x: (waypoint1.x + waypoint2.x) / 2.0,
        y: (waypoint1.y + waypoint2.y) / 2.0
      }
    });
    linkLabel.text = newLinkDef.id;
    linkLabel.isReadOnly = true;
    newLinkDef.label = linkLabel;

    this._modellingLabels.reconcile(linkLabel.id as string, linkLabel);
    return newLinkDef;
  }

  /** Re-route every link attached to `definition` (a node). */
  updateNodeLinks(_element: unknown, definition: ModellingModelElement): void {
    (this._links.getAll() as ModellingModelElement[]).forEach((link) => {
      if (link.source === definition || link.target === definition) {
        this._updateLink(link);
      }
    });
  }

  private get _links(): BaseElement {
    return this._drawer;
  }

  private _createWaypoint(x: number, y: number): Point {
    return this._moddle.create('pfdn:Coordinates', { x, y }) as unknown as Point;
  }

  /** Recompute the orthogonal waypoints of a single link and re-render it. */
  private _updateLink(link: ModellingModelElement): void {
    const waypoints = computeLinkWaypoints(
      link,
      this._links.getAll() as ModellingModelElement[],
      this._moddle
    );
    if (!waypoints) {
      console.error(`Link #${link.id} should have valid source and target.`);
      return;
    }
    link.waypoint = waypoints;
    this._links.reconcile(link.id as string, link);
  }
}
