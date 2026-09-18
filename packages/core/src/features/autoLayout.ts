import {
  createSyncLayoutRunner,
  type LayoutGraph,
  type LayoutOptions,
  type LayoutRunner
} from '@d3-polytree/layout';
import type { CommandStack } from '../command';
import type { DrawingRegistry, Point } from '../draw';
import type { ElementClass } from '../modelling';
import type { MoveItem, Placement } from '../modelling/commands';
import type { ModellingModelElement } from '../modelling/types';

/** The `d3polytree` model host surface auto-layout reads. */
interface ModelHostLike {
  definitions: { node?: unknown; link?: unknown };
}

/**
 * Auto-layout: re-position every live node with the layered ({@link layout})
 * solver and commit the result as **one** `element.move` command — so a whole
 * re-layout is a single undo, labels move with their nodes, and links re-route
 * for free (the move handler reconciles nodes, whose `node.updated` re-drives the
 * router). The solver runs behind an injectable {@link LayoutRunner} (the sync
 * in-thread runner by default; swap in a `WorkerLayoutRunner` to offload).
 *
 * H4/H5 (roadmap): coordinates were previously hand-authored into the `.pfdn`;
 * this is the first engine-side solver. Gated on C1 — it emits a command, never
 * a direct model write.
 */
export class AutoLayout {
  static readonly $inject = ['d3polytree', 'drawingRegistry', 'commandStack', 'layoutRunner'];

  private readonly _model: ModelHostLike;
  private readonly _drawingRegistry: DrawingRegistry;
  private readonly _commandStack: CommandStack;
  private readonly _runner: LayoutRunner;

  constructor(
    model: ModelHostLike,
    drawingRegistry: DrawingRegistry,
    commandStack: CommandStack,
    runner: LayoutRunner
  ) {
    this._model = model;
    this._drawingRegistry = drawingRegistry;
    this._commandStack = commandStack;
    this._runner = runner;
  }

  /** Re-layout the diagram and commit it as one undoable move. No-op when there
   *  is nothing to place or nothing actually moves. */
  async apply(options?: LayoutOptions): Promise<void> {
    const nodes = this._liveNodes();
    if (nodes.length === 0) {
      return;
    }
    const result = await this._runner.run(this._buildGraph(nodes), options);
    const items = this._buildMoveItems(nodes, result.positions);
    if (items.length > 0) {
      this._commandStack.execute('element.move', { items });
    }
  }

  /** Nodes currently rendered (a drawing exists), i.e. not deleted. */
  private _liveNodes(): ModellingModelElement[] {
    const all = (this._model.definitions.node ?? []) as ModellingModelElement[];
    return all.filter((n) => n.id != null && this._drawingRegistry.get(n.id) !== false);
  }

  private _sizeOf(def: ModellingModelElement): number {
    const s = Number(def.get('size') ?? 25);
    return Number.isFinite(s) && s > 0 ? s : 25;
  }

  private _placement(def: ModellingModelElement): Placement {
    const pos = def.position as Point;
    return { position: { x: pos.x, y: pos.y }, status: Number(def.get('status') ?? 0) };
  }

  private _buildGraph(nodes: ModellingModelElement[]): LayoutGraph {
    const ids = new Set(nodes.map((n) => n.id as string));
    const graphNodes = nodes.map((n) => {
      const size = this._sizeOf(n);
      return { id: n.id as string, width: size, height: size };
    });
    const links = (this._model.definitions.link ?? []) as ModellingModelElement[];
    const edges = links
      .filter((l) => this._drawingRegistry.get(l.id as string) !== false)
      .map((l) => ({
        source: (l.source as ModellingModelElement | undefined)?.id as string | undefined,
        target: (l.target as ModellingModelElement | undefined)?.id as string | undefined
      }))
      .filter(
        (e): e is { source: string; target: string } =>
          !!e.source && !!e.target && ids.has(e.source) && ids.has(e.target)
      );
    return { nodes: graphNodes, edges };
  }

  private _buildMoveItems(
    nodes: ModellingModelElement[],
    positions: Record<string, Point>
  ): MoveItem[] {
    const items: MoveItem[] = [];
    for (const def of nodes) {
      const center = positions[def.id as string];
      if (!center) {
        continue;
      }
      const size = this._sizeOf(def);
      const from = this._placement(def);
      const to: Placement = {
        position: { x: Math.round(center.x - size / 2), y: Math.round(center.y - size / 2) },
        status: from.status
      };
      const dx = to.position.x - from.position.x;
      const dy = to.position.y - from.position.y;
      if (dx === 0 && dy === 0) {
        continue; // node already where the solver would put it
      }
      const label = def.label as ModellingModelElement | undefined;
      let labelItem: MoveItem['label'];
      if (label && this._drawingRegistry.get(label.id as string) !== false) {
        const lf = this._placement(label);
        labelItem = {
          def: label,
          from: lf,
          to: { position: { x: lf.position.x + dx, y: lf.position.y + dy }, status: lf.status }
        };
      }
      items.push({ def, className: 'node' as ElementClass, from, to, label: labelItem });
    }
    return items;
  }
}

/**
 * didi module contributing {@link AutoLayout} plus the default `layoutRunner`
 * (the pure in-thread solver). Compose a module redefining `layoutRunner` with a
 * `WorkerLayoutRunner` to move layout off the main thread (last-definition-wins).
 */
export const autoLayoutModule = {
  __depends__: [] as unknown[],
  autoLayout: ['type', AutoLayout],
  layoutRunner: ['value', createSyncLayoutRunner()]
};
