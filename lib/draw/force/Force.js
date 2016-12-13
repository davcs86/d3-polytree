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
function Force(canvas, eventBus, nodes, links) {

  this._force = {};

  this._canvas = canvas;
  this._eventBus = eventBus;
  this._nodes = nodes;
  this._links = links;

  this._init();
}

Force.$inject = [ 'canvas', 'eventBus', 'nodes', 'links' ];

module.exports = Force;

Force.prototype._init = function() {

  var that = this;

  this._force = d3.forceSimulation(this._nodes.getAll())
    .force('link', d3.forceLink().distance(0).strength(0.1).id(
      function (d) {
        return d.id;
      }
    ))
  ;
  this._force.force('link')
    .links(this._links.getAll());

  this._force.on('tick', function(){
    that._eventBus.emit('force.tick');
    //that._force.stop();
  });

  that._eventBus.emit('force.init');
};