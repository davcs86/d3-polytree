'use strict';

var /*d3 = require('d3'),*/
  //forIn = require('lodash/object').forIn,
  values = require('lodash/object').values,
  //isUndefined = require('lodash/lang').isUndefined,
  //_groupsArray = [],
  _groupContainer = null,
  _groupContainers = null
  ;

/**
 * The groups processing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} groupsDict
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {Nodes} nodes
 */
function Groups(canvas, eventBus, nodes) {
  this._groups = {};
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._nodes = nodes;
  this._init();
}

Groups.$inject = [
  'canvas', 'eventBus', 'nodes'
];

module.exports = Groups;

Groups.prototype._init = function(){
  var that = this;
  this._eventBus.on('force.init', function(){
    that._draw();
  });
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
};

Groups.prototype._draw = function(){
  this._drawContainer();
  //this._drawGroups();
  //this._drawLabels();
};

Groups.prototype._drawContainer = function(){
  if (_groupContainer){
    _groupContainer.remove();
  }
  _groupContainer = this._canvas
    .getDrawingLayer()
    .insert('g', ':first-child')
    .attr('class', 'groups');
  console.log(_groupContainer);
};

Groups.prototype._drawGroups = function(groupsDict){
  var that = this;

  if (groupsDict){
    this.groups = values(groupsDict);
  }

  this.groups = _groupContainers
    .append('rect')
    .attr('coords', function(d) {
      d.coords = that._calculateGroupBoundaries(d.nodes, d.label);
      return 1;
    })
    .attr('x', function (d) {
      return d.coords.x;
    })
    .attr('y', function (d) {
      return d.coords.y;
    })
    .attr('width', function (d) {
      return d.coords.width;
    })
    .attr('height', function (d) {
      return d.coords.height;
    })
    .attr('rx', function () {
      return '5';
    })
    .style('fill', function(d){
      return d.color;
    })
    .style('stroke', function(d){
      return d.color;
    })
    .style('stroke-width', '2px')
    .style('fill-opacity', '0.3');
};

// Groups.prototype._drawLabels = function(){
//   var that = this;
//   this.groupLabels = _groupContainers
//     .append('text')
//     .attr('x', function (d) {
//       return d.coords.x + 3;
//     })
//     .attr('y', function (d) {
//       return d.coords.y + 10;
//     })
//     .style('font-size', '8px')
//     .style('font-weight', 'bold')
//     .style('fill', function(d){
//       return d.color;
//     })
//     .text(function(d){
//       return isUndefined(d.label) ? null : d.label;
//     })
//     .on('mouseover', function(){
//       that._eventBus.emit('groupLabel.mouseover');
//     })
//     .on('mouseout', function(){
//       that._eventBus.emit('groupLabel.mouseout');
//     });
// };
//
// Groups.prototype._calculateGroupBoundaries = function(groupNodes, label){
//   var that = this,
//     xArr = [],
//     yArr = [],
//     hasLabel = !isUndefined(label);
//   forIn(groupNodes, function(n, k){
//     var pos = that._nodesDict[k].position;
//     if (isUndefined(pos)){
//       pos = {x: 0, y: 0};
//     }
//     xArr.push(pos.x);
//     yArr.push(pos.y);
//   });
//   var x = d3.min(xArr) - 32,
//     width = d3.max(xArr) - x + 32,
//     y = d3.min(yArr) - 32 - (hasLabel ? 6 : 0),
//     height = d3.max(yArr) - y + 42;
//   return {
//     x: x,
//     y: y,
//     width: width,
//     height: height
//   };
//};