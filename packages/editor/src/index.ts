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
  type DiagramModule,
  type DrawingRegistry,
  type ModellingNodes,
  type ModellingModelElement,
  type CreateParameters,
  type Selection
} from '@d3-polytree/core';

export type EditorOptions = InteractiveViewerOptions;

export class Editor extends InteractiveViewer {
  /** Editing modules on top of the interaction layer. */
  static readonly editionModules: readonly DiagramModule[] = [
    dragModule as DiagramModule,
    modellingModule as DiagramModule,
    exportingModule as DiagramModule
  ];

  getModules(): readonly DiagramModule[] {
    // interaction + editing features first (they subscribe / swap the layer),
    // then the drawers
    return [
      ...InteractiveViewer.interactionModules,
      ...Editor.editionModules,
      ...Viewer.modules
    ];
  }

  /** Create a node (and its associated label) at an optional position. */
  createNode(parameters: CreateParameters = {}): ModellingModelElement {
    return this.get<ModellingNodes>('modellingNodes').create(parameters);
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
