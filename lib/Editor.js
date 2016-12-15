'use strict';

var inherits = require('inherits'),
  Viewer = require('./Viewer').Viewer;

/**
 * An editor for node networks
 *
 * @param {Object} options
 */
function Editor(options) {
  Viewer.call(this, options);
}

inherits(Editor, Viewer);

module.exports = {
  Editor: Editor
};

Editor.prototype.createDiagram = function(){
  return this.importNodes({});
};

Editor.prototype._interactionModules = [
  require('./features/zoomScroll'),
  require('./features/mouseEvents')
];

Editor.prototype._editionModules = [
  require('./features/drag')
];

Editor.prototype._modules = [].concat(
  Editor.prototype._modules,
  Editor.prototype._interactionModules,
  Editor.prototype._editionModules
);