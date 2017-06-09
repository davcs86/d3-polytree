'use strict';

var d3 = require('d3'),
    forIn = require('lodash/object').forIn,
    getLocalName = require('../../utils/LocalName');

require('./style.scss');

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
    .attr('x', x)
    .attr('y', y)
    .attr('transform', translate);
  // update business object
  def.position.x = x;
  def.position.y = y;
  //console.log('drag', def, def.get('status'));
  if (def.get('status') !== 1){
    def.set('status', 2);
  }
  this._eventBus.emit(getLocalName(def) + '.moving', elem, def);
};

Drag.prototype._applyOffsetToSelected = function (dX, dY) {
  var updateDrag = function (v) {
    if (getLocalName(v.definition) !== 'link') {
      this._applyOffset(v.element, v.definition, dX, dY);
      // drag associated label
      if (v.definition.label) {
        var label = this._drawingRegistry.get(v.definition.label.id);
        if (label) {
          this._applyOffset(label, v.definition.label, dX, dY);
        }
      }
    }
  }.bind(this);
  forIn(this._selection._currentSelection, updateDrag);
};

Drag.prototype._notifyOffsetToSelected = function () {
  var notifyDrag = function (v) {
    if (getLocalName(v.definition) !== 'link') {
      this._eventBus.emit(getLocalName(v.definition) + '.moved', v.element, v.definition);
    }
  }.bind(this);
  forIn(this._selection._currentSelection, notifyDrag);
};

Drag.prototype._setElemToDrag = function (element, definition) {
  var that = this;
  element.call(
    d3.drag()
      .on('start', function () {
        that._selection._selectElement(element, definition, d3.event.sourceEvent);
        if (!that._canvas.getRootLayer().classed('no-drag')) {
          d3.event
            .on('end', function () {
              that._notifyOffsetToSelected();
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
      that._setElemToDrag.call(that, element, definition);
    }
  });
};