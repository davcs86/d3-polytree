'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  forEach = require('lodash/collection').forEach,
  _nodesContainer = null
  ;

/**
 * The node drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Nodes} nodes
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {IconLoader} iconLoader
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Nodes(nodes, canvas, eventBus, iconLoader, elementBuilder, elementRegistry) {

  this._nodes = nodes;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._iconLoader = iconLoader;
  this._elementBuilder = elementBuilder;
  this._elementRegistry = elementRegistry;

  this._init();
}

Nodes.$inject = [
  'd3polytree.definitions.node',
  'canvas',
  'eventBus',
  'iconLoader',
  'elementBuilder',
  'elementRegistry'
];

module.exports = Nodes;

Nodes.prototype._buildNode = function(definition, isUpdate){
  return (!!isUpdate) ? this._updateNode(definition) : this._createNode(definition);
};

Nodes.prototype._createNode = function(definition){
  var that = this;
  var node = _nodesContainer
    .selectAll('.node')
    .data([definition])
    .enter()
    .append('g')
    //.attr('class', 'node')
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
    }).on('mouseover', function(){
      console.log('node mouseover');
    });

  // draw the nodes icons
  node
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

  return node;
};

Nodes.prototype._updateNode = function(definition){
  var element = this._elementRegistry.get(definition.id);
  element.remove();
  return this._createNode(definition);
};

Nodes.prototype._draw = function() {
  var that = this;
  if (_nodesContainer){
    // delete previous nodes
    _nodesContainer.remove();
  }
  _nodesContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', 'nodes');
  // build the nodes
  forEach(this._nodes, function(def){
    that._elementBuilder.create(def, that._buildNode, that);
  });
};

Nodes.prototype._init = function() {
  var that = this;
  this._eventBus.on('force.init', function(){
    that._draw();
  });
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
};