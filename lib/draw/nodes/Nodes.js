'use strict';

/**
 * The node drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} nodesDict
 * @param {Canvas} canvas
 */
function Nodes(nodesDict, canvas) {

  this._nodes = nodesDict;
  this._canvas = canvas;

  this._init();
}

Nodes.$inject = [ 'd3polytree.nodes', 'canvas' ];

module.exports = Nodes;

Nodes.prototype._init = function() {

};