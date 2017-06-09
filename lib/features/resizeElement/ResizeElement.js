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
 */

function ResizeElement(eventBus, canvas ) {

  this._eventBus = eventBus;
  this._canvas = canvas;

  this._init();
}

ResizeElement.$inject = [
  'eventBus',
  'canvas'
];

module.exports = ResizeElement;

ResizeElement.prototype._createCorners = function(element, elemDefinition, outline) {
  // create the drag corners

  var outlineSize = _toNumber(outline.attr('width'));

  var container = d3.select(outline.node().parentNode)
    .append('g')
    .attr('class', 'resize-container');

  var nwCorner = container
    .append('rect');

  var neCorner = container
    .append('rect')
    .attr('fill', 'none')
    .attr('x', outlineSize-2.5)
    .attr('y', -2.5)
    .attr('width', 5)
    .attr('height', 5)
    .attr('class', 'resize-drag-ne');

  var swCorner = container
    .append('rect')
    .attr('fill', 'none')
    .attr('x', -2.5)
    .attr('y', outlineSize-2.5)
    .attr('width', 5)
    .attr('height', 5)
    .attr('class', 'resize-drag-sw');

  var seCorner = container
    .append('rect')
    .attr('fill', 'none')
    .attr('x', outlineSize-2.5)
    .attr('y', outlineSize-2.5)
    .attr('width', 5)
    .attr('height', 5)
    .attr('class', 'resize-drag-se');

  var updateDefinition = function(){
    this._eventBus.emit('element.updated', elemDefinition.id, elemDefinition);
  }.bind(this);

  var neCornerFn = function(refCorner){
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

    this._updateOutlineAndCorners(outline, container, newSize+6);

  }.bind(this, swCorner);
  this._setCornerToDrag(neCorner, neCornerFn, updateDefinition);

  var swCornerFn = function(refCorner){
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

    this._updateOutlineAndCorners(outline, container, newSize+6);

  }.bind(this, neCorner);
  this._setCornerToDrag(swCorner, swCornerFn, updateDefinition);

  var seCornerFn = function(refCorner){
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

    this._updateOutlineAndCorners(outline, container, newSize+6);

  }.bind(this, nwCorner);
  this._setCornerToDrag(seCorner, seCornerFn, updateDefinition);

};

ResizeElement.prototype._updateOutlineAndCorners = function(outline, container, newOutlineSize){
  //console.log(newOutlineSize);
  // update the outline
  outline
    .attr('width', newOutlineSize)
    .attr('height', newOutlineSize);

  // update the corners
  container
    .select('.resize-drag-ne')
    .attr('x', newOutlineSize-2.5);
  container
    .select('.resize-drag-sw')
    .attr('y', newOutlineSize-2.5);
  container
    .select('.resize-drag-se')
    .attr('x', newOutlineSize-2.5)
    .attr('y', newOutlineSize-2.5);
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
  var updateCorners = function(element, elemDefinition, outline){
    if (elemDefinition.$instanceOf('pfdn:Node')) {
      this._updateOutlineAndCorners(outline, element.select('.resize-container'), 6+_toNumber(elemDefinition.size));
    }
  }.bind(this);
  this._eventBus.on('outline.created', createCorners);
  this._eventBus.on('outline.updated', updateCorners);
};