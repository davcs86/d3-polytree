import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Impacts that gate. Minor/moderate are tracked by axe but not enforced here
 *  (too noisy before C2 lands the real a11y layer); serious/critical do gate. */
export const GATING_IMPACTS = ['serious', 'critical'] as const;

/** Map of story id → the serious/critical axe rule ids currently *known* to
 *  fire on that story. New rules beyond this set fail the build; C2 burns the
 *  set down over time. Environment-stable (DOM/ARIA/computed-style, not pixels),
 *  so it is committed and generated on any Linux host, not only the container. */
export type A11yBaseline = Record<string, string[]>;

const BASELINE_PATH = join(__dirname, 'a11y-baseline.json');

export function loadBaseline(): A11yBaseline {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as A11yBaseline;
  } catch {
    return {};
  }
}

/** Persist one story's known rule ids (used only under `UPDATE_A11Y`, workers=1
 *  so the read-modify-write of the shared file cannot race). */
export function recordBaseline(storyId: string, ruleIds: string[]): void {
  const current = loadBaseline();
  if (ruleIds.length > 0) {
    current[storyId] = [...ruleIds].sort();
  } else {
    delete current[storyId];
  }
  const ordered: A11yBaseline = {};
  for (const key of Object.keys(current).sort()) {
    ordered[key] = current[key];
  }
  writeFileSync(BASELINE_PATH, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
}

export const isUpdate = process.env.UPDATE_A11Y === '1';
