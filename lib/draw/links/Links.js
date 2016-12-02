'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  _nodes = null,
  _nodesContainer = null
  ;

/**
 * The node processing & drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} links
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 */
function Links(links, canvas, eventBus) {
  this._nodes = nodes;
  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

Nodes.$inject = [ 'd3polytree.definitions.link', 'canvas', 'eventBus', 'iconLoader' ];

module.exports = Nodes;

Nodes.prototype._draw = function() {
  var that = this;

};

Nodes.prototype._init = function() {

};