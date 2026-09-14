import type { DiagramElement } from './types';

export interface Point {
  x: number;
  y: number;
}

/** A floating text label. */
export interface LabelDefinition extends DiagramElement {
  position: Point;
  color?: string;
  fontSize?: number;
  text?: string;
}

export interface ZoneBorder {
  lineColor?: string;
  lineWidth?: number;
}

/** A background rectangle grouping part of the diagram. */
export interface ZoneDefinition extends DiagramElement {
  position: Point;
  width?: number;
  height?: number;
  fillColor?: string;
  opacity?: number;
  border: ZoneBorder;
}
