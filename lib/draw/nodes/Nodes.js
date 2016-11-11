'use strict';

var cloneDeep = require('lodash/lang').cloneDeep,
  forIn = require('lodash/object').forIn,
  forEach = require('lodash/collection').forEach,
  isUndefined = require('lodash/lang').isUndefined
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
    that._draw.apply(that, arguments);
  });
}

Nodes.$inject = [ 'd3polytree.nodes', 'canvas', 'eventBus', 'iconLoader' ];

module.exports = Nodes;

Nodes.prototype._draw = function() {
  this._canvas.getDrawingLayer()
    .selectAll('.node')
    .data(this._nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('node-id', function(d){
      return d.nodeId;
    })
    .on('mouseover', function(){
      console.log('node mouseover');
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