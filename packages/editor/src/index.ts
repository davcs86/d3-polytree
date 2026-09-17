/**
 * @d3-polytree/editor — create and modify polytree diagrams.
 *
 * Extends the {@link InteractiveViewer} with the editing layer: element
 * dragging plus the modelling create/save/delete flows. Element creation is
 * exposed programmatically here; the palette toolbar UI is layered on next.
 */
import { InteractiveViewer, type InteractiveViewerOptions } from '@d3-polytree/interactive-viewer';
import { Viewer } from '@d3-polytree/viewer';
import {
  dragModule,
  modellingModule,
  exportingModule,
  localStorageModule,
  uploadModule,
  paletteModule,
  resizeElementModule,
  type DiagramModule,
  type DrawingRegistry,
  type ModellingModelElement,
  type CreateParameters,
  type CommandStack,
  type CreateContext,
  type Selection
} from '@d3-polytree/core';
// The properties panel used to be its own package; it is now folded in here
// (the editor was its only consumer) and re-exported below.
import {
  entryFactoryModule,
  pfdnPropertiesProviderModule,
  propertiesPanelModule
} from './properties-panel';

export * from './properties-panel';

/** The document a fresh editor opens with. */
const INITIAL_DIAGRAM =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">' +
  '<settings author="No Author" name="No Name Diagram" status="1">' +
  '<zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid />' +
  '</settings>' +
  '<node id="node_1" label="label_1" status="1"><position x="20" y="100" /></node>' +
  '<label id="label_1" fontSize="12" isReadOnly="true" status="1">' +
  '<position x="33" y="140" /><text>Node 1</text></label>' +
  '</pfdn:diagram>';

export type EditorOptions = InteractiveViewerOptions;

export class Editor extends InteractiveViewer {
  /** Editing modules on top of the interaction layer. */
  static readonly editionModules: readonly DiagramModule[] = [
    dragModule as DiagramModule,
    modellingModule as DiagramModule,
    exportingModule as DiagramModule,
    localStorageModule as DiagramModule,
    uploadModule as DiagramModule,
    paletteModule as DiagramModule,
    resizeElementModule as DiagramModule,
    // the properties panel (registers a side tab; side-tabs + search-panel are
    // inherited from InteractiveViewer)
    entryFactoryModule as DiagramModule,
    pfdnPropertiesProviderModule as DiagramModule,
    propertiesPanelModule as DiagramModule
  ];

  /** The document a fresh editor opens with (used by {@link createDiagram}). */
  initialDiagram = INITIAL_DIAGRAM;

  /** (Re)open the initial diagram. */
  createDiagram(): Promise<void> {
    return this.importDiagram(this.initialDiagram);
  }

  getModules(): readonly DiagramModule[] {
    // interaction + editing features first (they subscribe / swap the layer),
    // then the drawers
    return [
      ...InteractiveViewer.interactionModules,
      ...Editor.editionModules,
      ...Viewer.modules
    ];
  }

  /**
   * Create a node (and its associated label) at an optional position.
   *
   * Routed through the command stack so it persists and is undoable (since B10
   * the draw-layer `.created` event no longer persists on its own).
   */
  createNode(parameters: CreateParameters = {}): ModellingModelElement {
    const ctx: CreateContext = { className: 'node', parameters: [parameters] };
    this.get<CommandStack>('commandStack').execute('element.create', ctx);
    return ctx.created as ModellingModelElement;
  }

  /** Select an element by definition (e.g. to prepare a delete). */
  select(definition: ModellingModelElement): void {
    const element = this.get<DrawingRegistry>('drawingRegistry').get(definition.id as string);
    if (element) {
      this.get<Selection>('selection').select(element, definition);
    }
  }

  /** Delete the current selection (cascading to associated labels). */
  deleteSelected(): void {
    this.get<Selection>('selection').deleteSelected();
  }
}

export default Editor;
