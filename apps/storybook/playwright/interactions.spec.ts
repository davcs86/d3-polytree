import { test, expect } from '@playwright/test';
import { gotoStory, loadStories } from './_support';

/**
 * Interaction net (C8, closing H7): drive the live engine in a browser so CI
 * proves the app *works*, not merely that it builds.
 *
 * Two invariants:
 *  1. A real pointer click routes through `mouseEvents` → `selection` and marks
 *     the element selected.
 *  2. The C1 command stack round-trips atomically: a delete is a single entry
 *     that the editor's genuine keyboard shortcut undoes and redoes in one step.
 *     Selection here goes through the public API (`select`) rather than a click,
 *     because a click also commits a zero-delta `element.move` (a separate
 *     command-hygiene defect, reported for follow-up) that would muddy the stack.
 */
const harness = loadStories().find((s) => s.title === 'Tests/Interaction Harness');

test.describe('interaction', () => {
  test.beforeEach(async ({ page }) => {
    expect(harness, 'Interaction Harness story missing from the build').toBeTruthy();
    await gotoStory(page, harness!.id);
    await page.evaluate(() => window.__polytreeReady);
  });

  test('a pointer click selects a node', async ({ page }) => {
    const nodeA = page.locator('g[element-id="node_a"]');
    await expect(nodeA).not.toHaveClass(/(^|\s)selected(\s|$)/);
    // Click its top-left quadrant: the link path crosses the node's centre, so a
    // centre click would land on the link, not the node.
    await page.click('g[element-id="node_a"]', { position: { x: 6, y: 6 } });
    await expect(nodeA).toHaveClass(/(^|\s)selected(\s|$)/);
  });

  test('delete → keyboard undo → redo is one atomic command-stack step', async ({ page }) => {
    const nodes = page.locator('g.nodeItem');
    await expect(nodes).toHaveCount(2);
    expect(await page.evaluate(() => window.__polytreeEditor!.canUndo())).toBe(false);

    // Drag-free selection so the stack holds exactly the delete.
    expect(await page.evaluate(() => window.__polytreeSelectNodeById!('node_a'))).toBe(true);
    await expect(page.locator('g[element-id="node_a"]')).toHaveClass(/(^|\s)selected(\s|$)/);

    // Delete: one atomic, undoable command (cascades the node's read-only label).
    await page.evaluate(() => window.__polytreeEditor!.deleteSelected());
    await expect(nodes).toHaveCount(1);
    expect(await page.evaluate(() => window.__polytreeEditor!.canUndo())).toBe(true);

    // Undo through the REAL wired shortcut (focus the container so keydown lands).
    await page.locator('[data-testid="editor-host"]').focus();
    await page.keyboard.press('Control+z');
    await expect(nodes).toHaveCount(2);
    expect(await page.evaluate(() => window.__polytreeEditor!.canUndo())).toBe(false);

    // Redo restores the deletion in a single mirrored step.
    await page.keyboard.press('Control+Shift+z');
    await expect(nodes).toHaveCount(1);
    expect(await page.evaluate(() => window.__polytreeEditor!.canRedo())).toBe(false);
  });

  // C2 keyboard-first a11y. axe cannot detect a keyboard trap, so these assert the
  // roving/cone navigation and — critically — that Escape/Tab leave the region.
  test('keyboard: arrow-cone navigation moves a roving focus and drives selection', async ({
    page
  }) => {
    const svg = page.locator('svg[role="application"]');
    await expect(svg).toHaveCount(1);
    await svg.focus();

    await page.keyboard.press('ArrowRight'); // enter the diagram at the first element
    const first = await page.evaluate(() => document.activeElement?.getAttribute('element-id'));
    expect(first).toBeTruthy();
    await expect(page.locator(`g[element-id="${first}"]`)).toHaveClass(/(^|\s)selected(\s|$)/);

    await page.keyboard.press('ArrowRight'); // cone move → a different element
    const second = await page.evaluate(() => document.activeElement?.getAttribute('element-id'));
    expect(second).toBeTruthy();
    expect(second).not.toBe(first); // proves traversal, not just first-focus
  });

  test('keyboard: Escape leaves the application region (no keyboard trap)', async ({ page }) => {
    const svg = page.locator('svg[role="application"]');
    await svg.focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => !!document.activeElement?.closest?.('g[element-id]'))).toBe(
      true
    );

    await page.keyboard.press('Escape');
    const after = await page.evaluate(() => {
      const el = document.activeElement;
      const svgEl = document.querySelector('svg[role="application"]');
      return { inElement: !!el?.closest?.('g[element-id]'), isSvg: el === svgEl };
    });
    // Focus left the diagram entirely — neither an element nor the application svg.
    expect(after.inElement).toBe(false);
    expect(after.isSvg).toBe(false);
  });
});
