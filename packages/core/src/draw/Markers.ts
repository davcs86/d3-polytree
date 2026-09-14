import type { Selection } from 'd3-selection';
import type { DefsSelection } from './Defs';

type MarkerSelection = Selection<SVGMarkerElement, unknown, null, undefined>;

/**
 * Manages reusable arrowhead `<marker>` definitions for links.
 *
 * (The original kept the marker map in a module-level variable — shared across
 * instances; here it is per-instance, closing that class of bug.)
 */
export class Markers {
  static readonly $inject = ['defs'];

  private readonly _defs: DefsSelection;
  private readonly _markers = new Map<string, MarkerSelection>();

  constructor(defs: DefsSelection) {
    this._defs = defs;
  }

  /** Ensure a marker for `linkId` exists/updated; return its id for `url(#…)`. */
  getMarker(linkId: string, strokeColor?: string, fillColor?: string): string {
    if (!this._markers.has(linkId)) {
      this._createMarker(linkId, strokeColor, fillColor);
    } else {
      this._updateMarker(linkId, strokeColor, fillColor);
    }
    return `${linkId}_markerEnd`;
  }

  private _createMarker(linkId: string, strokeColor?: string, fillColor?: string): void {
    const marker = this._defs
      .append('marker')
      .attr('stroke', strokeColor ?? '')
      .attr('id', `${linkId}_markerEnd`)
      .attr('fill', fillColor ?? '')
      .attr('viewBox', '-4 -8 15 15')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .style('stroke-width', 4 * 0.375);

    marker.append('path').attr('d', 'M0,-5L8.67,0L0,5Z');

    this._markers.set(linkId, marker);
  }

  private _updateMarker(linkId: string, strokeColor?: string, fillColor?: string): void {
    this._markers
      .get(linkId)!
      .attr('stroke', strokeColor ?? '')
      .attr('fill', fillColor ?? '')
      .attr('markerWidth', 4)
      .attr('markerHeight', 4);
  }
}
