'use strict';

var D3PolytreeInteractiveViewer = require('d3-polytree/lib/InteractiveViewer').InteractiveViewer,
  // load additional modules
  additionalModules = [
    require('./features/icons')
  ];

// add additional (default!) modules to d3-polytree
D3PolytreeInteractiveViewer.prototype._modules = D3PolytreeInteractiveViewer.prototype._modules.concat(additionalModules);

// export
module.exports = {
  InteractiveViewer: D3PolytreeInteractiveViewer
};