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
 * Owns link creation and keeps link paths attached to node sides — and routed
 * around obstacle nodes (C4) — as the model changes. The orthogonal, edge-docked,
 * obstacle-avoiding waypoint geometry lives in the draw-independent
 * {@link computeLinkWaypoints} (so the same routing runs at load time for every
 * component, editor or not — see `linkRouting.ts`).
 *
 * This handler is the interactive side of it and the **single writer** of solved
 * waypoints while editing: it reroutes every unpinned link once per top-level
 * transaction on `commandStack.changed`. That trigger is complete because every
 * routing-input mutation (move/resize/create/delete/property edit) flows through
 * the command stack (O11); a pinned link is left untouched (its authored
 * waypoints degrade to the polyline drawer). Ported from `core-v2beta`'s
 * `features/modelling/elements/links/Links.js`.
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

  /**
   * Reroute every unpinned link once per committed transaction. Subscribing to
   * `commandStack.changed` (not per-node events) makes this the single reroute
   * writer: it fires once after execute/undo/redo with all positions already
   * written, so obstacle-dependent routes stay correct even when a *non-incident*
   * node moves or a node is created/deleted — cases the old incident-only
   * `node.updated` subscription missed once routes depend on every node's box.
   */
  init(): void {
    this._eventBus.on('commandStack.changed', this.rerouteAll, this);
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

    // No incident reroute here: `create()` runs inside the `element.create`
    // command, whose `commandStack.changed` drives the single reroute pass
    // (which also routes this new link around obstacles).

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

  /** Reroute every unpinned link once, after a committed transaction. */
  rerouteAll(): void {
    const links = this._links.getAll() as ModellingModelElement[];
    const nodes = this._definitions.get('node') as ModellingModelElement[] | undefined;
    links.forEach((link) => {
      if (link.get('pinned') === true) {
        return; // a pinned route keeps its authored waypoints (degrade)
      }
      this._rerouteLink(link, links, nodes);
    });
  }

  private get _links(): BaseElement {
    return this._drawer;
  }

  private _createWaypoint(x: number, y: number): Point {
    return this._moddle.create('pfdn:Coordinates', { x, y }) as unknown as Point;
  }

  /**
   * Recompute a single link's obstacle-avoiding waypoints and re-render it —
   * but only when they actually changed, and via the status-neutral
   * {@link BaseElement.updateElement}, NOT `reconcile`. `reconcile` would flip a
   * `status:0` link to `2` (soft-dirty) and leave `status="2"` residue that undo
   * never restores, breaking the byte-identical `toXML` round-trip. The
   * value-based diff-skip also bounds the `link.updated` fan-out (outline,
   * search panel) to genuinely-moved links.
   */
  private _rerouteLink(
    link: ModellingModelElement,
    links: ModellingModelElement[],
    nodes: ModellingModelElement[] | undefined
  ): void {
    const waypoints = computeLinkWaypoints(link, links, nodes, this._moddle);
    if (!waypoints) {
      return; // torn link (missing endpoint) — skip silently
    }
    if (waypointsEqual(link.waypoint as Point[] | undefined, waypoints)) {
      return; // unchanged → no write, no re-render, no spurious link.updated
    }
    link.waypoint = waypoints;
    this._links.updateElement(link);
  }
}

/** Value-based waypoint comparison (never object identity — every recompute mints
 * fresh `pfdn:Coordinates`). Equal length and equal x/y at every index. */
function waypointsEqual(prev: Point[] | undefined, next: Point[]): boolean {
  if (!prev || prev.length !== next.length) {
    return false;
  }
  for (let i = 0; i < next.length; i++) {
    if (prev[i].x !== next[i].x || prev[i].y !== next[i].y) {
      return false;
    }
  }
  return true;
}
