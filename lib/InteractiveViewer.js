'use strict';

var inherits = require('inherits'),
    Viewer = require('./Viewer').Viewer;

/**
 * A viewer that includes user interactions
 *
 * @param {Object} options
 */
function InteractiveViewer(options) {
  Viewer.call(this, options);
}

inherits(InteractiveViewer, Viewer);

module.exports = {
  InteractiveViewer: InteractiveViewer
};

InteractiveViewer.prototype._interactionModules = [
  require('./features/zoomScroll'),
  //require('./features/mouseEvents'),
  require('./features/tooltip'),
  require('d3-polytree-sidetabs'),
  require('d3-polytree-searchpanel'),
];

InteractiveViewer.prototype._modules = [].concat(
  InteractiveViewer.prototype._modules,
  InteractiveViewer.prototype._interactionModules
);