'use strict';

var D3PolytreeEditor = require('d3-polytree/lib/Editor').Editor,
  // load additional modules
  additionalModules = [
    require('./features/icons')
  ];

// add additional (default!) modules to d3-polytree
D3PolytreeEditor.prototype._modules = D3PolytreeEditor.prototype._modules.concat(additionalModules);

// export
module.exports = {
  Editor: D3PolytreeEditor
};