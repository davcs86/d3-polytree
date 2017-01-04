'use strict';

var d3 = require('d3'),
  forIn = require('lodash/object').forIn;

require('./style');

/**
 * Drag description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function Drag(canvas, eventBus, elementRegistry, selection) {

  this._canvas = canvas;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._selection = selection;

  this._init();
}

Drag.$inject = [
  'canvas',
  'eventBus',
  'elementRegistry',
  'selection'
];

module.exports = Drag;

Drag.prototype._applyOffset = function(elem, def, dX, dY){
  var x = (elem.attr('x')*1.0) + dX,
    y = (elem.attr('y')*1.0) + dY,
    translate = 'translate('+x+','+y+')';
  elem
    .attr('x', x)
    .attr('y', y)
    .attr('transform', translate);
  // update business object
  def.position.x = x;
  def.position.y = y;
};

Drag.prototype._applyOffsetToSelected = function(dX, dY){
  var that = this;
  forIn(this._selection._currentSelection, function(v){
    that._applyOffset(d3.select(v.element.node().parentNode), v.definition, dX, dY);
  });
};

Drag.prototype._setElemToDrag = function(element){
  var that = this;
  d3.select(element.node().parentNode).call(
    d3.drag()
      .subject(function(def) {
         return d3.select(that._elementRegistry.get(def.id).node().parentNode);
      })
      .on('start', function(){
        d3.event.subject.classed('cursor-grabbing', true);
      })
      .on('end', function(){
        d3.event.subject.classed('cursor-grabbing', false);
      })
      .on('drag', function(){
        that._applyOffsetToSelected(d3.event.dx, d3.event.dy);
      })
  );
};

Drag.prototype._init = function () {
  // set to drag outlined elements
  this._eventBus.on('outline.created', this._setElemToDrag, this);
};