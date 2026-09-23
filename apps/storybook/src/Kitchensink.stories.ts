import type { Meta, StoryObj } from '@storybook/html';
import type { DiagramModule, DrawingSelection, ModellingModelElement } from '@d3-polytree/core';
import { Editor } from '@d3-polytree/editor';
import '@d3-polytree/interactive-viewer/style.css';
import '@d3-polytree/editor/style.css';

/**
 * The kitchensink: the three ways to extend the library, wired into one live
 * editor.
 *
 *  1. A **custom feature module** — a didi service that subscribes to the event
 *     bus and reacts (here, an activity log).
 *  2. A **custom node-type drawer** — a didi service that hooks `node.created`
 *     and renders nodes of a chosen `type` differently (here, a badge).
 *  3. The **programmatic API** — `createNode` / `select` / `deleteSelected` /
 *     `exportSVG` / `exportDiagram`, driven from the toolbar.
 *
 * Both custom modules are handed to the component through the `modules` option
 * (`new Editor({ modules: [...] })`); they compose *after* the component's own
 * modules, so a token they redefine wins — no subclassing required.
 */

/** The node `type` the custom drawer decorates. */
const CUSTOM_TYPE = 'kitchensink';

/** Minimal event-bus shape the custom modules rely on. */
interface Bus {
  on(event: string, fn: (...args: unknown[]) => void): void;
}

/** A model element as seen on the bus (only the fields we read). */
type Def = ModellingModelElement & { id?: string; type?: string };

/**
 * (1) Custom feature module: appends every interesting bus event to a log sink.
 * The sink is provided as a plain `value` token, so the module is a reusable
 * unit and the story just supplies where the lines go.
 */
function activityLogModule(log: (line: string) => void): DiagramModule {
  class ActivityLog {
    static readonly $inject = ['eventBus', 'kitchensinkLog'];
    constructor(eventBus: Bus, sink: (line: string) => void) {
      eventBus.on('node.created', (...a) =>
        sink(`node.created    ${(a[1] as Def).id}  (type=${(a[1] as Def).type ?? 'default'})`)
      );
      eventBus.on('link.created', (...a) => sink(`link.created    ${(a[1] as Def).id}`));
      eventBus.on('node.deleted', (...a) => sink(`node.deleted    ${(a[1] as Def).id}`));
      eventBus.on('selection.changed', (...a) =>
        sink(`selection.changed  ${(a[1] as unknown[]).length} selected`)
      );
    }
  }
  return {
    __init__: ['activityLog'],
    activityLog: ['type', ActivityLog],
    kitchensinkLog: ['value', log]
  };
}

/**
 * (2) Custom node-type drawer: on `node.created`, nodes whose `type` is
 * {@link CUSTOM_TYPE} get a distinguishing badge appended to their group. A
 * real drawer would render richer geometry; the seam is the same.
 */
const badgeDrawerModule: DiagramModule = (() => {
  class BadgeDrawer {
    static readonly $inject = ['eventBus'];
    constructor(eventBus: Bus) {
      eventBus.on('node.created', (...a) => {
        const element = a[0] as DrawingSelection;
        const def = a[1] as Def;
        if (def.type !== CUSTOM_TYPE) return;
        element
          .append('circle')
          .attr('cx', 6)
          .attr('cy', 6)
          .attr('r', 7)
          .attr('fill', '#7c3aed')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      });
    }
  }
  return { __init__: ['badgeDrawer'], badgeDrawer: ['type', BadgeDrawer] };
})();

/** Build the story DOM: a toolbar, the editor canvas, and an activity log. */
function build(): HTMLElement {
  const root = document.createElement('div');
  root.style.font = '13px system-ui, sans-serif';
  root.style.maxWidth = '900px';

  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px';

  const stage = document.createElement('div');
  stage.style.cssText = 'display:flex;gap:8px;align-items:stretch';

  const host = document.createElement('div');
  host.style.cssText =
    'position:relative;width:600px;height:440px;border:1px solid #ddd;flex:0 0 auto';

  const logWrap = document.createElement('div');
  logWrap.style.cssText = 'flex:1 1 auto;min-width:220px;display:flex;flex-direction:column';
  const logTitle = document.createElement('div');
  logTitle.textContent = 'Activity log (custom feature module)';
  logTitle.style.cssText = 'font-weight:600;margin-bottom:4px';
  const logEl = document.createElement('pre');
  logEl.style.cssText =
    'flex:1;margin:0;padding:8px;overflow:auto;background:#0f172a;color:#e2e8f0;border-radius:6px;font-size:11px;line-height:1.5;white-space:pre-wrap';
  logWrap.append(logTitle, logEl);

  stage.append(host, logWrap);
  root.append(toolbar, stage);

  const log = (line: string): void => {
    const stamp = new Date().toLocaleTimeString();
    logEl.textContent = `${stamp}  ${line}\n${logEl.textContent ?? ''}`;
  };

  // Compose the two custom modules into the editor via the `modules` option.
  const editor = new Editor({
    container: host,
    modules: [activityLogModule(log), badgeDrawerModule]
  });

  let n = 0;
  const nextPos = (): { x: number; y: number } => {
    n += 1;
    return { x: 60 + (n % 5) * 90, y: 60 + Math.floor(n / 5) * 90 };
  };

  const button = (label: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText =
      'padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer';
    b.addEventListener('click', onClick);
    return b;
  };

  toolbar.append(
    button('Add node', () => {
      const def = editor.createNode({ type: 'default', position: nextPos() }) as Def;
      editor.select(def);
    }),
    button('Add custom-type node', () => {
      const def = editor.createNode({ type: CUSTOM_TYPE, position: nextPos() }) as Def;
      editor.select(def);
    }),
    button('Delete selected', () => editor.deleteSelected()),
    button('Export .pfdn', () => log(`exportDiagram()  ${editor.exportDiagram().length} chars`)),
    button('Export SVG', () => log(`exportSVG()  ${editor.exportSVG().length} chars`)),
    button('Clear log', () => {
      logEl.textContent = '';
    })
  );

  // Open the built-in starter diagram, then hand off to the toolbar.
  void editor.createDiagram().then(() => log('editor ready — try the toolbar'));

  return root;
}

const meta: Meta = {
  title: 'Guides/Kitchensink',
  parameters: {
    docs: {
      description: {
        component:
          'Extending @d3-polytree in one place: a custom feature module (activity ' +
          'log), a custom node-type drawer (badge), and the programmatic API — all ' +
          'composed through `new Editor({ modules: [...] })`. Add a custom-type node ' +
          'from the toolbar to see the drawer badge it and the feature log it.'
      }
    }
  }
};

export default meta;

export const ExtendingTheLibrary: StoryObj = {
  render: () => build()
};
