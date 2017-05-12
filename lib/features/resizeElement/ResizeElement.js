'use strict';

var d3 = require('d3'),
    _toNumber = require('lodash/lang').toNumber;

require('./style.scss');

/**
 * Element resizing module description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param {Canvas} canvas
 * @param nodes
 */

function ResizeElement(eventBus, canvas, nodes) {

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._nodes = nodes;

  this._init();
}

ResizeElement.$inject = [
  'eventBus',
  'canvas',
  'nodes'
];

module.exports = ResizeElement;

ResizeElement.prototype._createCorners = function(element, elemDefinition, outline) {
  // create the drag corners

  var outlineSize = _toNumber(outline.attr('width'));

  var container = d3.select(outline.node().parentNode)
    .append('g')
    .classed('resize-container', true);

  var nwCorner = container
    .append('rect');
    // .attr('x', -2.5)
    // .attr('y', -2.5)
    // .attr('width', 5)
    // .attr('height', 5)
    //.classed('resize-drag-nw', true);

  var neCorner = container
    .append('rect')
    .attr('x', outlineSize-2.5)
    .attr('y', -2.5)
    .attr('width', 5)
    .attr('height', 5)
    .classed('resize-drag-ne', true);

  var swCorner = container
    .append('rect')
    .attr('x', -2.5)
    .attr('y', outlineSize-2.5)
    .attr('width', 5)
    .attr('height', 5)
    .classed('resize-drag-sw', true);

  var seCorner = container
    .append('rect')
    .attr('x', outlineSize-2.5)
    .attr('y', outlineSize-2.5)
    .attr('width', 5)
    .attr('height', 5)
    .classed('resize-drag-se', true);

  var updateDefinition = function(){
    this._nodes._builder(elemDefinition._id, elemDefinition);
  }.bind(this);

  // var nwCornerFn = function(corner, refCorner){
  //   // update bottom-left
  //   var pos = d3.mouse(refCorner.node());
  //   var newSize = Math.max(16, pos[0]*-1.0, pos[1]*-1.0) - 2.5 - 3;
  //
  //   // previous size
  //   var oldSize = _toNumber(elemDefinition.size);
  //
  //   // update the node
  //   element
  //     .select('.innerElement')
  //     .select('svg')
  //     .attr('width', newSize)
  //     .attr('height', newSize);
  //
  //   var newX = _toNumber(element.attr('x')) + oldSize - newSize,
  //       newY = _toNumber(element.attr('y')) + oldSize - newSize,
  //       newTranslate = 'translate(' + newX + ',' + newY + ')';
  //   element
  //     .attr('x', newX)
  //     .attr('y', newY)
  //     .attr('transform', newTranslate);
  //
  //   // update the definition
  //   elemDefinition.size = newSize;
  //   elemDefinition.position.x = newX;
  //   elemDefinition.position.y = newY;
  //
  //   console.log(oldSize, newSize, pos, newX, newY);
  //
  //   // update the outline
  //   var newOutlineSize = newSize + 6;
  //   outline
  //     .attr('width', newOutlineSize)
  //     .attr('height', newOutlineSize);
  //
  //   // update the corners
  //   neCorner
  //     .attr('x', newOutlineSize-2.5);
  //   swCorner
  //     .attr('y', newOutlineSize-2.5);
  //   seCorner
  //     .attr('x', newOutlineSize-2.5)
  //     .attr('y', newOutlineSize-2.5);
  //
  // }.bind(this, nwCorner, seCorner);
  // this._setCornerToDrag(nwCorner, nwCornerFn, updateDefinition);

  var neCornerFn = function(corner, refCorner){
    // update top-right
    var pos = d3.mouse(refCorner.node());
    var newSize = Math.max(16, pos[0], pos[1]*-1.0) - 2.5 - 3;

    // previous size
    var oldSize = _toNumber(elemDefinition.size);

    // update the node
    element
      .select('.innerElement')
      .select('svg')
      .attr('width', newSize)
      .attr('height', newSize);

    var newY = _toNumber(element.attr('y')) + oldSize - newSize,
        oldX = _toNumber(element.attr('x')),
        newTranslate = 'translate(' + oldX + ',' + newY + ')';
    element
      .attr('y', newY)
      .attr('transform', newTranslate);

    // update the definition
    elemDefinition.size = newSize;
    elemDefinition.position.y = newY;

    // update the outline
    var newOutlineSize = newSize + 6;
    outline
      .attr('width', newOutlineSize)
      .attr('height', newOutlineSize);

    // update the corners
    neCorner
      .attr('x', newOutlineSize-2.5);
    swCorner
      .attr('y', newOutlineSize-2.5);
    seCorner
      .attr('x', newOutlineSize-2.5)
      .attr('y', newOutlineSize-2.5);

  }.bind(this, neCorner, swCorner);
  this._setCornerToDrag(neCorner, neCornerFn, updateDefinition);

  var swCornerFn = function(corner, refCorner){
    // update bottom-left
    var pos = d3.mouse(refCorner.node());
    var newSize = Math.max(16, pos[0]*-1.0, pos[1]) - 2.5 - 3;

    // previous size
    var oldSize = _toNumber(elemDefinition.size);

    // update the node
    element
      .select('.innerElement')
      .select('svg')
      .attr('width', newSize)
      .attr('height', newSize);

    var newX = _toNumber(element.attr('x')) + oldSize - newSize,
        oldY = _toNumber(element.attr('y')),
        newTranslate = 'translate(' + newX + ',' + oldY + ')';
    element
      .attr('x', newX)
      .attr('transform', newTranslate);

    // update the definition
    elemDefinition.size = newSize;
    elemDefinition.position.x = newX;

    // update the outline
    var newOutlineSize = newSize + 6;
    outline
      .attr('width', newOutlineSize)
      .attr('height', newOutlineSize);

    // update the corners
    neCorner
      .attr('x', newOutlineSize-2.5);
    swCorner
      .attr('y', newOutlineSize-2.5);
    seCorner
      .attr('x', newOutlineSize-2.5)
      .attr('y', newOutlineSize-2.5);

  }.bind(this, swCorner, neCorner);
  this._setCornerToDrag(swCorner, swCornerFn, updateDefinition);

  var seCornerFn = function(corner, refCorner, neCorner, swCorner){
    // update bottom-right corner

    var pos = d3.mouse(refCorner.node());
    var newSize = Math.max(16, pos[0], pos[1]) - 2.5 - 3;

    // update the definition
    elemDefinition.size = newSize;

    // update the node
    element
      .select('.innerElement')
      .select('svg')
      .attr('width', newSize)
      .attr('height', newSize);

    // update the outline
    var newOutlineSize = newSize + 6;
    outline
      .attr('width', newOutlineSize)
      .attr('height', newOutlineSize);

    // update the corners
    neCorner
      .attr('x', newOutlineSize-2.5);
    swCorner
      .attr('y', newOutlineSize-2.5);
    seCorner
      .attr('x', newOutlineSize-2.5)
      .attr('y', newOutlineSize-2.5);

  }.bind(this, seCorner, nwCorner, neCorner, swCorner);
  this._setCornerToDrag(seCorner, seCornerFn, updateDefinition);

};

ResizeElement.prototype._setCornerToDrag = function(corner, draggedFn, updateDefinitionFn){

  var dragStart = function(){
    if (!this._canvas.getRootLayer().classed('no-drag')) {
      d3.event
        .on('drag', draggedFn)
        .on('end', updateDefinitionFn);
    }
  }.bind(this);

  corner.call(
    d3.drag()
      .on('start', dragStart)
  );
};

ResizeElement.prototype._init = function(){
  // create the event listeners
  var createCorners = function(element, elemDefinition, outline){
    if (elemDefinition.$instanceOf('pfdn:Node')) {
      this._createCorners(element, elemDefinition, outline);
    }
  }.bind(this);
  this._eventBus.on('outline.created', createCorners);
};