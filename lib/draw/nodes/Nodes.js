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
 * @param {Object} nodesDict
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 */
function Nodes(nodes, canvas, eventBus, iconLoader) {
  var that = this;

  this._nodes = nodes;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._iconLoader = iconLoader;

  this._init();
  this._eventBus.on('force.init', function(){
    that._draw();
  });
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
}

Nodes.$inject = [ 'd3polytree.definitions.node', 'canvas', 'eventBus', 'iconLoader' ];

module.exports = Nodes;

Nodes.prototype._draw = function() {
  var that = this;
  if (_nodesContainer){
    // delete previous nodes
    _nodesContainer.remove();
  }
  _nodesContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', 'nodes');
  // draw the nodes wraps
  _nodes = _nodesContainer
    .selectAll('.node')
    .data(this._nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('node-id', function(d){
      return d.id;
    })
    // .attr('fx', function(d){
    //   console.log(d);
    //   return !isUndefined(d.position.x) ? d.position.x : d.x;
    // })
    // .attr('fy', function(d){
    //   return !isUndefined(d.position.y) ? d.position.y : d.y;
    // })
    .attr('transform', function(d){
      return 'translate(' + d.position.x + ',' + d.position.y + ')';
    });
  _nodes.on('mouseover', function(){
    console.log('node mouseover');
  });
  // draw the nodes icons
  _nodes
    .append('svg')
    .attr('width', function(d){
      return !isUndefined(d.size) ? d.size : 50;
    })
    .attr('height', function(d){
      return !isUndefined(d.size) ? d.size : 50;
    })
    .attr('viewBox', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? that._iconLoader._processedIcons[d.type] :
        that._iconLoader._processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
    .attr('xlink:href', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? '#'+d.type+'_icon_def' :
        '#default_icon_def';
    });
};

Nodes.prototype._init = function() {

};