/**
 * `@d3-polytree/core` obstacle-avoidance router (roadmap C4).
 *
 * A pure, deterministic, dependency-free sub-module: it takes an elbow polyline
 * plus node bounding boxes and returns waypoints nudged around the boxes. It has
 * no DOM/D3/moddle coupling so it is fixture-testable and worker-extractable.
 * The moddle glue lives in `../modelling/linkRouting.ts`.
 */
export { avoidObstacles, segmentIntersectsObstacle } from './obstacles';
export type { Obstacle, RoutePoint } from './types';
