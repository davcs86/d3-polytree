'use strict';

var D3PolytreeViewer = require('d3-polytree/lib/Viewer').Viewer,
  // load additional modules
  additionalModules = [
    require('./features/icons')
  ];

// add additional (default!) modules to d3-polytree
D3PolytreeViewer.prototype._modules = D3PolytreeViewer.prototype._modules.concat(additionalModules);

// export
module.exports = {
  Viewer: D3PolytreeViewer
};