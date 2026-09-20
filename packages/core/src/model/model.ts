import {
  createPfdnModdle,
  fromJson,
  PfdnValidationError,
  type ModelElement,
  type PfdnModdle,
  type PfdnDocument
} from '@d3-polytree/pfdn-moddle';
import type { DiagramModule } from '../Diagram';
import { routeLinks } from '../modelling/linkRouting';
import type { ModellingModelElement } from '../modelling/types';

/** A loaded PFDN model: the root `pfdn:Diagram` plus its moddle instance. */
export interface ModelHost {
  definitions: ModelElement;
  moddle: PfdnModdle;
}

/**
 * Ensure the diagram carries a complete `settings` sub-tree.
 *
 * The settings-bound features (zoom, background colour, grid/axes) inject deep
 * model tokens such as `d3polytree.definitions.settings.zoom.offset`; a diagram
 * that omitted `<settings>` would make those tokens throw at injection time.
 * The source engine relied on every input document providing them — this
 * normalisation makes the engine fault-tolerant to models that don't, filling
 * the gaps with the schema defaults rather than failing to boot.
 */
export function ensureSettings(definitions: ModelElement, moddle: PfdnModdle): ModelElement {
  let settings = definitions.settings as ModelElement | undefined;
  if (!settings) {
    settings = moddle.create('pfdn:Settings', {});
    definitions.settings = settings;
  }

  const zoom = settings.zoom as ModelElement | undefined;
  if (!zoom) {
    settings.zoom = moddle.create('pfdn:Zoom', {
      offset: moddle.create('pfdn:Coordinates', { x: 0, y: 0 }),
      scale: 1
    });
  } else if (!zoom.offset) {
    zoom.offset = moddle.create('pfdn:Coordinates', { x: 0, y: 0 });
  }

  if (!settings.grid) {
    settings.grid = moddle.create('pfdn:Grid', {});
  }

  return definitions;
}

/** Create an empty in-memory model (a fresh, normalised `pfdn:Diagram`). */
export function emptyModel(): ModelHost {
  const moddle = createPfdnModdle();
  const definitions = ensureSettings(moddle.create('pfdn:Diagram', {}), moddle);
  return { definitions, moddle };
}

/** Parse a `.pfdn` XML document into a normalised model. */
export async function loadModel(xml: string): Promise<ModelHost> {
  const moddle = createPfdnModdle();
  const { rootElement } = await moddle.fromXML(xml, 'pfdn:Diagram');
  const definitions = ensureSettings(rootElement, moddle);
  // Route every link to edge-docked orthogonal waypoints up front, so links
  // render correctly on first paint in every component — including the static
  // Viewer, which has no modelling layer to re-route on interaction. A saved
  // document may already carry routed waypoints; recomputing here is idempotent
  // and also corrects centre-to-centre waypoints authored by hand or by tools.
  routeLinks(
    definitions.link as ModellingModelElement[] | undefined,
    definitions.node as ModellingModelElement[] | undefined,
    moddle
  );
  return { definitions, moddle };
}

/**
 * Parse a PFDN **JSON** document into a normalised model — the JSON twin of
 * {@link loadModel}, reusing the same `ensureSettings`/`routeLinks` normalisation
 * so a JSON-loaded model boots every component identically to an XML-loaded one.
 *
 * Accepts a JSON string or an already-parsed {@link PfdnDocument}. **Unlike
 * `loadModel` (which forces moddle-xml's lax mode and silently tolerates malformed
 * input), this validates strictly and THROWS a `PfdnValidationError` on any schema
 * violation** — a JSON document is a new external contract where silent corruption
 * is the worse failure. Pass `{ lax: true }` to restore `loadModel`-style tolerance
 * (unresolvable references are dropped rather than rejected). A malformed JSON
 * string throws the same `PfdnValidationError` (single error, keyword `json`).
 */
export async function loadModelFromJson(
  input: string | PfdnDocument,
  opts: { lax?: boolean } = {}
): Promise<ModelHost> {
  let doc: PfdnDocument;
  if (typeof input === 'string') {
    try {
      doc = JSON.parse(input) as PfdnDocument;
    } catch (error) {
      throw new PfdnValidationError([
        { instancePath: '', keyword: 'json', message: (error as Error).message }
      ]);
    }
  } else {
    doc = input;
  }

  const result = fromJson(doc, opts);
  if (!result.ok) throw new PfdnValidationError(result.errors);

  // Reuse the exact moddle instance fromJson built the tree with, matching
  // loadModel's single-instance contract (a moddle element carries its own $model).
  const definitions = result.value;
  const moddle = (definitions as unknown as { $model: PfdnModdle }).$model;
  ensureSettings(definitions, moddle);
  routeLinks(
    definitions.link as ModellingModelElement[] | undefined,
    definitions.node as ModellingModelElement[] | undefined,
    moddle
  );
  return { definitions, moddle };
}

/**
 * A didi module that exposes the model to the engine. Registered as the
 * `d3polytree` value, so didi's property-path resolution supplies the tokens the
 * drawers and modelling layer inject: `d3polytree.moddle`, `d3polytree.definitions`,
 * and `d3polytree.definitions.<node|link|label|zone>` (the definition arrays).
 */
export function createModelModule(host: ModelHost): DiagramModule {
  return { d3polytree: ['value', host] };
}
