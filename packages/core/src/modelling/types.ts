import type { DiagramElement, Point } from '../draw';

/**
 * A moddle model element as consumed by the modelling layer.
 *
 * Extends the draw layer's {@link DiagramElement} (id + `get`/`set`) with the
 * moddle `Base` surface the modelling flows rely on — instance-of checks, the
 * descriptor used to derive a local name, and the well-known PFDN properties.
 */
export interface ModellingModelElement extends DiagramElement {
  $type?: string;
  $descriptor: { ns: { localName: string } };
  $instanceOf(type: string): boolean;
  status?: number;
  isReadOnly?: boolean;
  position?: Point;
  size?: number;
  label?: ModellingModelElement;
  text?: string;
  type?: string;
  source?: ModellingModelElement;
  target?: ModellingModelElement;
  waypoint?: Point[];
}

/** Parameters accepted by the label/node create flows. */
export interface CreateParameters {
  position?: Point;
  type?: string;
}
