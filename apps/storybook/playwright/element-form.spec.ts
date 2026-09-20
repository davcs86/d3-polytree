import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Browser-only contract for `<d3-polytree-editor>` (C7): real ElementInternals
 * form association — `setFormValue` must enter the element's document into its
 * owning `<form>`'s `FormData` under the element `name`. This cannot be exercised
 * in jsdom (its ElementInternals stub has no `setFormValue`), so it runs here in
 * the pinned Chromium.
 *
 * Standalone: it builds its own page via `setContent` + injects the self-contained
 * element UMD, so it needs no Storybook story (and therefore never enters the
 * visual-regression or a11y nets, which enumerate stories).
 */
const ELEMENT_UMD = join(__dirname, '../../../packages/element/dist/element.umd.js');

test.describe('custom element form participation', () => {
  test.skip(
    !existsSync(ELEMENT_UMD),
    'element UMD not built — run `pnpm build` (or filter @d3-polytree/element) first'
  );

  test('setFormValue enters the .pfdn into the owning form under `name`', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setContent(
      '<form id="f"><d3-polytree-editor name="doc" style="width:400px;height:300px"></d3-polytree-editor></form>'
    );
    // Inject the self-contained UMD (self-registers the tag + boots the element).
    await page.addScriptTag({ content: readFileSync(ELEMENT_UMD, 'utf8') });

    // Wait for upgrade + boot: the element renders its SVG and sets its form value.
    await page.waitForFunction(() => {
      const el = document.querySelector('d3-polytree-editor');
      return !!el?.shadowRoot?.querySelector('svg');
    });

    const submitted = await page.evaluate(() => {
      const form = document.getElementById('f') as HTMLFormElement;
      return String(new FormData(form).get('doc') ?? '');
    });
    expect(submitted).toContain('pfdn:diagram');
  });
});
