import { emptyModel } from '@d3-polytree/core';
import type { FixtureSpec } from './fixture.data';

/**
 * Serialize a {@link FixtureSpec} to `.pfdn` XML through the real moddle (never hand-written
 * XML — zone/border serialization is schema-owned). Browser-side only: it imports the
 * engine. Specs that need only expectations import `fixture.data.ts` instead.
 */
export function fixtureToXml(spec: FixtureSpec): string {
  const { definitions, moddle } = emptyModel();
  const coord = (x: number, y: number) => moddle.create('pfdn:Coordinates', { x, y });

  const labels = new Map(
    spec.labels.map((l) => [
      l.id,
      moddle.create('pfdn:Label', {
        id: l.id,
        status: 1,
        isReadOnly: true,
        fontSize: l.fontSize,
        text: l.text,
        position: coord(l.x, l.y)
      })
    ])
  );
  definitions.label = [...labels.values()];

  definitions.node = spec.nodes.map((n) =>
    moddle.create('pfdn:Node', {
      id: n.id,
      status: 1,
      type: 'default',
      size: n.size,
      position: coord(n.x, n.y),
      ...(n.labelId ? { label: labels.get(n.labelId) } : {})
    })
  );

  definitions.link = spec.links.map((l) =>
    moddle.create('pfdn:Link', {
      id: l.id,
      status: 1,
      source: l.source,
      target: l.target,
      pinned: true,
      waypoint: l.waypoints.map((p) => coord(p.x, p.y))
    })
  );

  definitions.zone = spec.zones.map((z) =>
    moddle.create('pfdn:Zone', {
      id: z.id,
      status: 1,
      width: z.width,
      height: z.height,
      position: coord(z.x, z.y),
      border: moddle.create('pfdn:Border', { lineWidth: 1, lineColor: '#bbbbbb' })
    })
  );

  return moddle.toXML(definitions);
}
