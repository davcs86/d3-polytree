'use strict';

var cloneDeep = require('lodash/lang').cloneDeep,
  forIn = require('lodash/object').forIn,
  forEach = require('lodash/collection').forEach,
  isUndefined = require('lodash/lang').isUndefined,
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
function Nodes(nodesDict, canvas, eventBus, iconLoader) {
  var that = this;

  this._nodesDict = cloneDeep(nodesDict);
  this._nodes = [];
  this._links = [];
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

Nodes.$inject = [ 'd3polytree.nodes', 'canvas', 'eventBus', 'iconLoader' ];

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
      return d.nodeId;
    })
    .attr('x', function(d){
      return !isUndefined(d.fx) ? d.fx : d.x;
    })
    .attr('y', function(d){
      return !isUndefined(d.fy) ? d.fy : d.y;
    })
    .attr('transform', function(d){
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  _nodes.on('mouseover', function(){
    console.log('node mouseover');
  });
  // draw the nodes icons
  _nodes
    .append('svg')
    .attr('width', function(d){
      return !isUndefined(d.width) ? d.width : 50;
    })
    .attr('height', function(d){
      return !isUndefined(d.height) ? d.height : 50;
    })
    .attr('x', function(d){
      return -1.0 * (!isUndefined(d.width) ? d.width : 50) / 2.0;
    })
    .attr('y', function(d){
      return -1.0 * (!isUndefined(d.height) ? d.height : 50) / 2.0;
    })
    .attr('viewBox', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.iconType])) ? that._iconLoader._processedIcons[d.iconType] :
        that._iconLoader._processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
    .attr('xlink:href', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.iconType])) ? '#'+d.iconType+'_icon_def' :
        '#default_icon_def';
    });
};

Nodes.prototype._init = function() {
  var that = this;
  forIn(this._nodesDict, function(n, k){
    // create the nodes
    var newNode = {
      id: k,
      nodeId: k,
      label: n.label,
      adjacencyList: n.adjacencyList,
      positionX: n.positionX,
      positionY: n.positionY,
      iconType: n.iconType || 'default'
    };
    if (!isUndefined(newNode.positionX) && !isUndefined(newNode.positionY)){
      newNode.fx = newNode.positionX;
      newNode.fy = newNode.positionY;
    }
    that._nodes.push(newNode);
    that._nodesDict[k] = newNode;
    // create the links
    forEach(newNode.adjacencyList, function(n, k){
      that._links.push({
        source: newNode.id,
        target: k,
        label: n.label
      });
    });
  });
};