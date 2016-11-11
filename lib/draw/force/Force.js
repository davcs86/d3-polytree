'use strict';

var d3 = require('d3');

/**
 * The D3 force handler.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {EventBus} eventBus
 */
function Force(options, eventBus, nodes) {

  this._force = {};

  this._options = options;
  this._eventBus = eventBus;
  this._nodes = nodes;

  this._init();
}

Force.$inject = [ 'd3polytree.options', 'eventBus', 'nodes' ];

module.exports = Force;

Force.prototype._init = function() {
  var that = this;
  this._force = d3.forceSimulation(this._nodes._nodes);
  this._links = d3.forceLink(this._nodes._links);

  this._force.on('tick', function(){
    that._eventBus.fire('force.tick');
    that._force.stop();
  });

  that._eventBus.fire('force.init');
};