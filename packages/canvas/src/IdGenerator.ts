import Ids from 'ids';

/**
 * The id-minting surface {@link ElementRegistry} depends on — the exact subset
 * of the `ids` API it calls. Making it injectable lets a consumer (SSR,
 * golden-file tests) swap in a deterministic generator without touching the
 * registry, while the default preserves today's random behavior.
 */
export interface IdGenerator {
  /** Mint a fresh, unclaimed id under `prefix` (which includes its trailing `_`). */
  nextPrefixed(prefix: string, element?: unknown): string;
  /** Record `id` as taken so it is never minted. */
  claim(id: string, element?: unknown): void;
  /** Release `id`. */
  unclaim(id: string): void;
}

/**
 * The default generator: wraps `ids` (`new Ids([8, 24, 86])`) — random hex per
 * id, exactly as before this seam existed. Consumers that do nothing keep this.
 */
export class IdsIdGenerator implements IdGenerator {
  private readonly _ids = new Ids([8, 24, 86]);

  nextPrefixed(prefix: string, element?: unknown): string {
    return this._ids.nextPrefixed(prefix, element);
  }

  claim(id: string, element?: unknown): void {
    this._ids.claim(id, element);
  }

  unclaim(id: string): void {
    this._ids.unclaim(id);
  }
}

/**
 * A deterministic, collision-safe generator: per-prefix sequential counters
 * (`node_1`, `node_2`, …) with a claimed-id set so a generated candidate that
 * matches an already-claimed id (e.g. an author-set id) is skipped, never
 * re-emitted. Reproducible because the boot render order is deterministic.
 */
export class SequentialIdGenerator implements IdGenerator {
  private readonly _claimed = new Set<string>();
  private readonly _counters = new Map<string, number>();

  nextPrefixed(prefix: string): string {
    let n = this._counters.get(prefix) ?? 0;
    let candidate: string;
    do {
      n += 1;
      candidate = `${prefix}${n}`;
    } while (this._claimed.has(candidate));
    this._counters.set(prefix, n);
    this.claim(candidate);
    return candidate;
  }

  claim(id: string): void {
    this._claimed.add(id);
  }

  unclaim(id: string): void {
    this._claimed.delete(id);
  }
}
