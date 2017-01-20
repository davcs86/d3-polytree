'use strict';

/**
 *
 * D3-based node directed network modeler.
 *
 * @license MIT
 * @author David Castillo <davcs86@gmail.com>
 *
 */

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
  return this.importDiagram(this.initialDiagram);
};

Editor.prototype._interactionModules = [
  require('./features/zoomScroll'),
  require('./features/mouseEvents')
];

Editor.prototype._editionModules = [
  require('./features/drag'),
  require('./features/palette'),
  require('./features/localStorage'),
  require('./features/upload'),
  require('./features/exporting'),
];

Editor.prototype._modules = [].concat(
  Editor.prototype._modules,
  Editor.prototype._interactionModules,
  Editor.prototype._editionModules
);

Editor.prototype.initialDiagram = '<?xml version="1.0" encoding="UTF-8"?>' +
  '<pfdn:diagram xmlns:pfdn="http://pfdn">'+
  '<settings>'+
  '    <author>No Author</author>' +
  '    <name>No Name Diagram</name>' +
  '    <zoom>' +
  '        <offset x="0" y="0" />'+
  '        <scale>1</scale>'+
  '    </zoom>' +
  '    <grid />' +
  '</settings>' +
  '<node id="Node_1" label="Label_1">' +
  '    <position x="20" y="100" />'+
  '</node>' +
  '<label fontSize="12">' +
  '    <position x="33" y="140" />'+
  '    <text>Node 1</text>'+
  '</label>' +
  '</pfdn:diagram>';