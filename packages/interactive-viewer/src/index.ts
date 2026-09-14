/**
 * @d3-polytree/interactive-viewer — viewer plus zooming, panning and a search panel.
 *
 * B3 skeleton: extends the base Viewer; interaction features are filled in by
 * subsequent B3 PRs.
 */
import { Viewer, type ViewerOptions } from '@d3-polytree/viewer';

export type InteractiveViewerOptions = ViewerOptions;

export class InteractiveViewer extends Viewer {}

export default InteractiveViewer;
