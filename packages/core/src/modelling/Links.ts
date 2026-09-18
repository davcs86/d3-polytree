import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { BaseElement, DrawingRegistry, Point } from '../draw';
import type { NotificationService } from '../features/notifications';
import type { PfdnModdle } from '@d3-polytree/pfdn-moddle';
import { ModellingElement } from './ModellingElement';
import type { ModellingLabels } from './Labels';
import type { ModellingModelElement } from './types';

/** A node position registered on one of the four sides of a node. */
interface SideEntry {
  obj: string;
  pos: Point;
}

/**
 * Transient link-routing state for a node, recomputed on each update.
 *
 * The source engine bolted these fields directly onto the node's d3 selection
 * in the drawing registry; the TS port keeps them in a handler-owned map keyed
 * by node id — behaviourally identical, but without polluting the draw layer.
 */
interface RoutingState {
  predecessors: ModellingModelElement[];
  successors: ModellingModelElement[];
  sides: SideEntry[][];
}

/** A mutable {x, y} the routing math nudges in place. */
interface MutablePoint {
  x: number;
  y: number;
}

/** Side index carrier (which of the four node sides a waypoint attaches to). */
interface SideIndex {
  idx: number;
}

/** Beyond this axis distance a target connector flips to an orthogonal side. */
const SIDE_FLIP_THRESHOLD = 80;
/** Minimum axis gap before a straight run bends into a bezier. */
const CURVE_MIN_GAP = 20;

/**
 * Modelling handler for links.
 *
 * Owns link creation and the orthogonal waypoint routing that keeps link paths
 * attached to node sides as nodes move. Ported from `core-v2beta`'s
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
  private readonly _routing = new Map<string, RoutingState>();

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
    const state = this._fillPredAndSuc(definition);
    state.predecessors.forEach((link) => this._updateLink(link));
    state.successors.forEach((link) => this._updateLink(link));
  }

  private get _links(): BaseElement {
    return this._drawer;
  }

  private _createWaypoint(x: number, y: number): Point {
    return this._moddle.create('pfdn:Coordinates', { x, y }) as unknown as Point;
  }

  // --- routing geometry ------------------------------------------------------

  /** Angle (radians) between two vectors. */
  private _calculateAngle(a: Point, b: Point): number {
    const dotProduct = a.x * b.x + a.y * b.y;
    const moduleA = Math.sqrt(a.x ** 2 + a.y ** 2);
    const moduleB = Math.sqrt(b.x ** 2 + b.y ** 2);
    return Math.acos(dotProduct / (moduleA * moduleB));
  }

  /** Order the connectors on one node side by their angle to a reference. */
  private _sortSide(side: SideEntry[], sideIdx: number, s: Point): SideEntry[] {
    const vector: MutablePoint = { x: 1, y: 1 };
    let factor = 1.0;
    if (sideIdx === 0) {
      vector.x = -1.0;
    } else if (sideIdx === 1) {
      factor = -1.0;
    } else if (sideIdx === 2) {
      vector.y = -1.0;
      factor = -1.0;
    } else if (sideIdx === 3) {
      vector.x = -1.0;
      vector.y = -1.0;
    }
    return [...side].sort((o1, o2) => {
      const key = (o: SideEntry): number => {
        const vectorB: Point = { x: o.pos.x - s.x, y: o.pos.y - s.y };
        return factor * this._calculateAngle(vector, vectorB);
      };
      return key(o1) - key(o2);
    });
  }

  /** Assign a connector to a node side (quadrant) and re-sort that side. */
  private _setQuadrants(
    sides: SideEntry[][],
    s: Point,
    t: Point,
    toSave: string,
    isTarget: boolean
  ): void {
    let sideIdx: number | false = false;
    const dx = Math.abs(t.x - s.x);
    const dy = Math.abs(t.y - s.y);

    if (t.x >= s.x && t.y >= s.y) {
      if (dx >= dy) {
        sideIdx = 3;
        if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 0;
      } else {
        sideIdx = 0;
        if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 3;
      }
    } else if (t.x < s.x && t.y >= s.y) {
      if (dx >= dy) {
        sideIdx = 1;
        if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 0;
      } else {
        sideIdx = 0;
        if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 1;
      }
    } else if (t.x >= s.x && t.y < s.y) {
      if (dx >= dy) {
        sideIdx = 3;
        if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 2;
      } else {
        sideIdx = 2;
        if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 3;
      }
    } else if (t.x < s.x && t.y < s.y) {
      if (dx >= dy) {
        sideIdx = 1;
        if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 2;
      } else {
        sideIdx = 2;
        if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 1;
      }
    }

    if (sideIdx === false) {
      return;
    }
    sides[sideIdx].push({ obj: toSave, pos: s });
    sides[sideIdx] = this._sortSide(sides[sideIdx], sideIdx, t);
  }

  /** Compute the four side buckets for a node and store them in routing state. */
  private _setSideConnectors(definition: ModellingModelElement, isTarget: boolean): void {
    const sides: SideEntry[][] = [[], [], [], []];
    const element = this._drawingRegistry.get(definition.id as string);
    if (!element) {
      return;
    }
    const state = this._fillPredAndSuc(definition);
    const position = definition.position as Point;

    state.predecessors.forEach((link) => {
      const sourceData = link.source as ModellingModelElement | undefined;
      if (sourceData) {
        this._setQuadrants(
          sides,
          sourceData.position as Point,
          position,
          sourceData.id as string,
          isTarget
        );
      }
    });
    state.successors.forEach((link) => {
      const targetData = link.target as ModellingModelElement | undefined;
      if (targetData) {
        this._setQuadrants(
          sides,
          targetData.position as Point,
          position,
          targetData.id as string,
          false
        );
      }
    });
    state.sides = sides;
  }

  /** Recompute the orthogonal waypoints of a single link and re-render it. */
  private _updateLink(link: ModellingModelElement): void {
    const source = link.source as ModellingModelElement | undefined;
    const target = link.target as ModellingModelElement | undefined;
    if (!source || !target) {
      console.error(`Link #${link.id} should have valid source and target.`);
      return;
    }

    this._setSideConnectors(source, false);
    this._setSideConnectors(target, true);

    const sourceState = this._routing.get(source.id as string);
    const targetState = this._routing.get(target.id as string);
    if (!sourceState || !targetState) {
      // one endpoint is not drawn yet; nothing to route
      return;
    }

    const sPos = source.position as Point;
    const tPos = target.position as Point;
    const sourcePoint: MutablePoint = { x: sPos.x, y: sPos.y };
    const targetPoint: MutablePoint = { x: tPos.x, y: tPos.y };
    const sourceSide: SideIndex = { idx: 0 };
    const targetSide: SideIndex = { idx: 0 };
    const waypoints: Point[] = [];
    let curve1RefPoint: MutablePoint | false = false;
    let curve2RefPoint: MutablePoint | false = false;

    this._adjustSidePoint(
      sourcePoint,
      sourceState.sides,
      target.id as string,
      source.size ?? 0,
      sourceSide
    );
    this._adjustSidePoint(
      targetPoint,
      targetState.sides,
      source.id as string,
      target.size ?? 0,
      targetSide
    );

    waypoints.push(this._createWaypoint(sourcePoint.x, sourcePoint.y));

    if (sourceSide.idx === 1 || sourceSide.idx === 3) {
      // source leaves from left or right
      if (targetSide.idx === 0 || targetSide.idx === 2) {
        // target arrives top or bottom → single elbow
        curve1RefPoint = { x: targetPoint.x, y: sourcePoint.y };
      } else if (Math.abs(sourcePoint.y - targetPoint.y) > CURVE_MIN_GAP) {
        const midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1RefPoint = { x: midPoint.x, y: sourcePoint.y };
        curve2RefPoint = { x: midPoint.x, y: targetPoint.y };
      }
    } else {
      // source leaves from top or bottom
      if (targetSide.idx === 1 || targetSide.idx === 3) {
        // target arrives left or right → single elbow
        curve1RefPoint = { x: sourcePoint.x, y: targetPoint.y };
      } else if (Math.abs(sourcePoint.x - targetPoint.x) > CURVE_MIN_GAP) {
        const midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1RefPoint = { x: sourcePoint.x, y: midPoint.y };
        curve2RefPoint = { x: targetPoint.x, y: midPoint.y };
      }
    }

    if (curve1RefPoint !== false) {
      waypoints.push(this._createWaypoint(curve1RefPoint.x, curve1RefPoint.y));
    }
    if (curve2RefPoint !== false) {
      waypoints.push(this._createWaypoint(curve2RefPoint.x, curve2RefPoint.y));
    }
    waypoints.push(this._createWaypoint(targetPoint.x, targetPoint.y));

    link.waypoint = waypoints;
    this._links.reconcile(link.id as string, link);
  }

  /**
   * Nudge `point` from a node's centre out to the connector slot matching
   * `referencePoint` on its side, distributing multiple connectors evenly.
   */
  private _adjustSidePoint(
    point: MutablePoint,
    sides: SideEntry[][],
    referencePoint: string,
    elemSize: number,
    saveIndex: SideIndex
  ): void {
    let found = false;
    const size = elemSize * 1.0;
    sides.forEach((side, sideIdx) => {
      const sideLen = side.length;
      if (found || sideLen === 0) {
        return;
      }
      const distBtwArrows = (size * 0.8) / (sideLen + 1);
      let origin = size / 2.0 - (distBtwArrows * (sideLen + 1)) / 2;
      side.forEach((v) => {
        origin += distBtwArrows;
        if (v.obj === referencePoint) {
          saveIndex.idx = sideIdx;
          if (sideIdx === 0) {
            point.x += origin;
            point.y -= 5;
          } else if (sideIdx === 1) {
            point.x += size + 5;
            point.y += origin;
          } else if (sideIdx === 2) {
            point.x += origin;
            point.y += size + 5;
          } else if (sideIdx === 3) {
            point.x -= 5;
            point.y += origin;
          }
          found = true;
        }
      });
    });
  }

  /** Collect the links entering (predecessors) and leaving (successors) a node. */
  private _fillPredAndSuc(definition: ModellingModelElement): RoutingState {
    const predecessors: ModellingModelElement[] = [];
    const successors: ModellingModelElement[] = [];

    (this._links.getAll() as ModellingModelElement[]).forEach((link) => {
      if (link.target === definition) {
        predecessors.push(link);
      }
      if (link.source === definition) {
        successors.push(link);
      }
    });

    const existing = this._routing.get(definition.id as string);
    const state: RoutingState = {
      predecessors,
      successors,
      sides: existing ? existing.sides : [[], [], [], []]
    };
    this._routing.set(definition.id as string, state);
    return state;
  }
}
