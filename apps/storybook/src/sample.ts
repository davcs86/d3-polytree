/**
 * Shared `.pfdn` fixtures for the component stories.
 *
 * Authored as literal XML (rather than built through the moddle at runtime) so
 * the stories stay declarative and the exact document is visible in source. The
 * shape mirrors what the core moddle emits: a default-namespaced `<pfdn:diagram>`
 * with `settings`, `node`/`label`/`link` children, explicit `size` so the icon
 * is visible, and label references wired by id.
 */

/** Two nodes joined by a link, each with a caption label. */
export const SAMPLE_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
  <settings author="d3-polytree" name="Sample flow" status="1">
    <zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
  </settings>
  <node id="node_a" label="label_a" type="default" size="50" status="1"><position x="80" y="90" /></node>
  <node id="node_b" label="label_b" type="default" size="50" status="1"><position x="340" y="230" /></node>
  <link id="link_ab" source="node_a" target="node_b" status="1">
    <waypoint x="105" y="115" /><waypoint x="365" y="255" />
  </link>
  <label id="label_a" fontSize="12" isReadOnly="true" status="1"><position x="80" y="150" /><text>Source</text></label>
  <label id="label_b" fontSize="12" isReadOnly="true" status="1"><position x="340" y="290" /><text>Target</text></label>
</pfdn:diagram>`;

/**
 * Six nodes wired into a small DAG but authored at deliberately overlapping
 * positions — the "before" state for the auto-layout story. Running
 * `editor.autoLayout()` re-places them into tidy layers.
 */
export const LAYOUT_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
  <settings author="d3-polytree" name="Auto-layout demo" status="1">
    <zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
  </settings>
  <node id="root" type="default" size="40" status="1"><position x="200" y="200" /></node>
  <node id="a" type="default" size="40" status="1"><position x="212" y="206" /></node>
  <node id="b" type="default" size="40" status="1"><position x="190" y="212" /></node>
  <node id="c" type="default" size="40" status="1"><position x="206" y="196" /></node>
  <node id="d" type="default" size="40" status="1"><position x="196" y="202" /></node>
  <node id="e" type="default" size="40" status="1"><position x="202" y="216" /></node>
  <link id="l1" source="root" target="a" status="1"><waypoint x="220" y="220" /><waypoint x="232" y="226" /></link>
  <link id="l2" source="root" target="b" status="1"><waypoint x="220" y="220" /><waypoint x="210" y="232" /></link>
  <link id="l3" source="a" target="c" status="1"><waypoint x="232" y="226" /><waypoint x="226" y="216" /></link>
  <link id="l4" source="a" target="d" status="1"><waypoint x="232" y="226" /><waypoint x="216" y="222" /></link>
  <link id="l5" source="b" target="d" status="1"><waypoint x="210" y="232" /><waypoint x="216" y="222" /></link>
  <link id="l6" source="d" target="e" status="1"><waypoint x="216" y="222" /><waypoint x="222" y="236" /></link>
</pfdn:diagram>`;

/**
 * Three nodes typed to AWS icon keys, to demonstrate the icon-pack convention:
 * with `awsIconsModule` composed, the `type` attribute resolves to the pack's
 * SVG symbol; without it, the same document falls back to the default icon.
 */
export const AWS_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
  <settings author="d3-polytree" name="AWS topology" status="1">
    <zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />
  </settings>
  <node id="gw" label="gw_l" type="MobileServices_AmazonAPIGateway" size="56" status="1"><position x="80" y="70" /></node>
  <node id="svc" label="svc_l" type="Compute_AmazonECS" size="56" status="1"><position x="300" y="70" /></node>
  <node id="store" label="store_l" type="Storage_AmazonS3" size="56" status="1"><position x="300" y="240" /></node>
  <link id="gw_svc" source="gw" target="svc" status="1"><waypoint x="108" y="98" /><waypoint x="328" y="98" /></link>
  <link id="svc_store" source="svc" target="store" status="1"><waypoint x="328" y="126" /><waypoint x="328" y="268" /></link>
  <label id="gw_l" fontSize="12" isReadOnly="true" status="1"><position x="80" y="135" /><text>API Gateway</text></label>
  <label id="svc_l" fontSize="12" isReadOnly="true" status="1"><position x="300" y="135" /><text>ECS</text></label>
  <label id="store_l" fontSize="12" isReadOnly="true" status="1"><position x="300" y="305" /><text>S3</text></label>
</pfdn:diagram>`;
