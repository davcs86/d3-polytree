import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoStory, loadStories } from './_support';
import { GATING_IMPACTS, isUpdate, loadBaseline, recordBaseline } from './_a11y';

/**
 * Accessibility net (C8): axe-core per story, scoped to the rendered component
 * (`#storybook-root`, not Storybook's own chrome). It gates on *regressions* —
 * a serious/critical rule that is not already in `a11y-baseline.json` fails the
 * build. The baseline captures the pre-C2 reality so the gate is green today
 * while still catching anything new; C2 shrinks the baseline toward empty.
 *
 * Run with `UPDATE_A11Y=1 … --workers=1` (see `test:e2e:update-a11y`) to refresh
 * the baseline after an intentional a11y change.
 */
const stories = loadStories();
const gatingImpacts = new Set<string>(GATING_IMPACTS);

test.describe('accessibility', () => {
  for (const story of stories) {
    test(story.id, async ({ page }) => {
      await gotoStory(page, story.id);

      const results = await new AxeBuilder({ page }).include('#storybook-root').analyze();
      const currentRules = [
        ...new Set(
          results.violations
            .filter((v) => v.impact != null && gatingImpacts.has(v.impact))
            .map((v) => v.id)
        )
      ].sort();

      if (isUpdate) {
        recordBaseline(story.id, currentRules);
        return;
      }

      const known = new Set(loadBaseline()[story.id] ?? []);
      const regressions = currentRules.filter((id) => !known.has(id));
      expect(
        regressions,
        `New serious/critical a11y violations on "${story.id}": ${regressions.join(', ')}. ` +
          `If intentional, refresh the baseline via \`pnpm --filter @d3-polytree/storybook test:e2e:update-a11y\`.`
      ).toEqual([]);
    });
  }
});
