'use strict';

var d3 = require('d3'),
    forIn = require('lodash/object').forIn,
    getLocalName = require('../../utils/LocalName');

require('./style');

/**
 * Drag description
 *
 * @class
 * @constructor
 *
 * @param canvas
 * @param {EventEmitter} eventBus
 * @param {DrawingRegistry} drawingRegistry
 * @param selection
 */

function Drag(canvas, eventBus, drawingRegistry, selection) {
  
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._drawingRegistry = drawingRegistry;
  this._selection = selection;
  
  this._init();
}

Drag.$inject = [
  'canvas',
  'eventBus',
  'drawingRegistry',
  'selection'
];

module.exports = Drag;

Drag.prototype._applyOffset = function (elem, def, dX, dY) {
  var x = (elem.attr('x') * 1.0) + dX,
      y = (elem.attr('y') * 1.0) + dY,
      translate = 'translate(' + x + ',' + y + ')';
  elem
    //.select('.innerElement')
    .attr('x', x)
    .attr('y', y)
    .attr('transform', translate);
  // update business object
  def.position.x = x;
  def.position.y = y;
  def.change = 1;
  this._eventBus.emit(getLocalName(def) + '.moved', elem, def);
};

Drag.prototype._applyOffsetToSelected = function (dX, dY) {
  // var that = this;
  // forIn(this._selection._currentSelection, function (v) {
  //   if (getLocalName(v.definition) !== 'link') {
  //     that._applyOffset(d3.select(v.element.node().parentNode), v.definition, dX, dY);
  //     // drag associated label
  //     if (v.definition.label){
  //       var associatedLabel = that._elementRegistry.get(v.definition.label.id);
  //       that._applyOffset(d3.select(associatedLabel.node().parentNode), v.definition.label, dX, dY);
  //     }
  //   }
  // });
  // var that = this;
  var updateDrag = function (v) {
    if (getLocalName(v.definition) === 'link') {
    } else {
      this._applyOffset(d3.select(v.element.node().parentNode), v.definition, dX, dY);
      // drag associated label
      if (v.definition.label) {
        this._applyOffset(d3.select(this._drawingRegistry.get(v.definition.label.id).node().parentNode), v.definition.label, dX, dY);
      }
    }
  }.bind(this);
  forIn(this._selection._currentSelection, updateDrag);
};

Drag.prototype._setElemToDrag = function (element) {
  var that = this;
  d3.select(element.node().parentNode).call(
    d3.drag()
      .on('start', function () {
        if (!that._canvas.getRootLayer().classed('no-drag')) {
          that._canvas.getRootLayer().classed('cursor-grabbing', true);
          d3.event
            .on('end', function () {
              that._canvas.getRootLayer().classed('cursor-grabbing', false);

            })
            .on('drag', function () {
              that._applyOffsetToSelected(d3.event.dx, d3.event.dy);
            });
        }
      })
  );
};

Drag.prototype._init = function () {
  var that = this;
  // set to drag outlined elements
  this._eventBus.on('outline.created', function (element, definition) {
    if (getLocalName(definition) !== 'link') {
      that._setElemToDrag.apply(that, arguments);
    }
  });
};