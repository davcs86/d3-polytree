import { createPfdnModdle, type ModelElement, type PfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { DiagramModule } from '../Diagram';

/** A loaded PFDN model: the root `pfdn:Diagram` plus its moddle instance. */
export interface ModelHost {
  definitions: ModelElement;
  moddle: PfdnModdle;
}

/** Create an empty in-memory model (a fresh `pfdn:Diagram`). */
export function emptyModel(): ModelHost {
  const moddle = createPfdnModdle();
  const definitions = moddle.create('pfdn:Diagram', {});
  return { definitions, moddle };
}

/** Parse a `.pfdn` XML document into a model. */
export async function loadModel(xml: string): Promise<ModelHost> {
  const moddle = createPfdnModdle();
  const { rootElement } = await moddle.fromXML(xml, 'pfdn:Diagram');
  return { definitions: rootElement, moddle };
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
