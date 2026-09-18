import { describe, it, expect } from 'vitest';
import { renderToSvg } from './index';

/** A diagram with author-set ids (an editor-saved shape). */
const WITH_IDS = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
<settings author="No Author" name="No Name Diagram" status="1">
<zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
</settings>
<node id="node_1" label="label_1" status="1"><position x="20" y="100" /></node>
<label id="label_1" fontSize="12" isReadOnly="true" status="1"><position x="33" y="140" /><text>Node 1</text></label>
</pfdn:diagram>`;

/** A diagram whose single node carries no id (generation must fill it). */
const NO_IDS = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
<settings author="No Author" name="No Name Diagram" status="1">
<zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
</settings>
<node status="1"><position x="20" y="100" /></node>
</pfdn:diagram>`;

/** A diagram mixing an author-set node_1 with an id-less node. */
const MIXED_IDS = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
<settings author="No Author" name="No Name Diagram" status="1">
<zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
</settings>
<node id="node_1" status="1"><position x="10" y="10" /></node>
<node status="1"><position x="50" y="50" /></node>
</pfdn:diagram>`;

describe('@d3-polytree/ssr renderToSvg', () => {
  it('renders a standalone SVG string preserving author-set ids', async () => {
    const svg = await renderToSvg(WITH_IDS);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('element-id="node_1"');
  });

  it('is deterministic: the same document renders byte-identically', async () => {
    const a = await renderToSvg(WITH_IDS);
    const b = await renderToSvg(WITH_IDS);
    expect(a).toBe(b);
  });

  it('generates a deterministic id for an id-less element, stable across renders', async () => {
    const a = await renderToSvg(NO_IDS);
    expect(a).toContain('element-id="node_1"'); // sequential generator minted node_1
    const b = await renderToSvg(NO_IDS);
    expect(a).toBe(b);
  });

  it('does not collide a generated id with an author-set id (pre-claim)', async () => {
    const svg = await renderToSvg(MIXED_IDS);
    // author node_1 preserved; the id-less node became node_2, not a duplicate node_1
    expect(svg).toContain('element-id="node_1"');
    expect(svg).toContain('element-id="node_2"');
    const node1Count = svg.match(/element-id="node_1"/g)?.length ?? 0;
    expect(node1Count).toBe(1);
  });

  it('restores globals it did not own (add-only install)', async () => {
    // Under the vitest jsdom env, `document` pre-exists, so renderToSvg must not
    // delete it on cleanup (add-only skips already-present keys).
    const hadDocumentBefore = 'document' in globalThis;
    await renderToSvg(WITH_IDS);
    expect('document' in globalThis).toBe(hadDocumentBefore);
  });
});
