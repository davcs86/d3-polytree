'use strict';

var d3 = require('d3'),
    forIn = require('lodash/object').forIn,
    valuesIn = require('lodash/object').valuesIn,
    getLocalName = require('../../utils/LocalName');

/**
 * Selection description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param {Canvas} canvas
 * @param {ElementRegistry} elementRegistry
 */

function Selection(eventBus, canvas) {
  
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._currentSelection = {};
  
  this._init();
}

Selection.$inject = [
  'eventBus',
  'canvas'
];

module.exports = Selection;

Selection.prototype._unSelectElement = function (element, definition, emitChange) {
  var prevSelection = valuesIn(this._currentSelection);
  delete this._currentSelection[definition.id];
  d3.select(element.node().parentNode).classed('selected', false);
  if (emitChange){
    var curSelection = valuesIn(this._currentSelection);
    this._eventBus.emit('selection.changed', prevSelection, curSelection);
  }
};

Selection.prototype._selectElement = function (element, definition, event) {
  if (!event || !event.ctrlKey) {
    // overwrite the selected elements with the clicked element
    this._unSelectAllElements(true);
  }
  //console.log(element);
  // append the clicked element to the selected elements
  d3.select(element.node().parentNode).classed('selected', true);
  var prevSelection = valuesIn(this._currentSelection);
  this._currentSelection[definition.id] = {
    element: element,
    definition: definition
  };
  var curSelection = valuesIn(this._currentSelection);
  this._eventBus.emit('selection.changed', prevSelection, curSelection);
};

Selection.prototype._unSelectAllElements = function (cancelEmitChange) {
  var that = this;
  forIn(this._currentSelection, function (v) {
    that._unSelectElement(v.element, v.definition, !cancelEmitChange);
  });
};

Selection.prototype.deleteSelected = function () {
  var that = this;
  forIn(this._currentSelection, function (v) {
    that._unSelectElement(v.element, v.definition);
    that._eventBus.emit(getLocalName(v.definition) + '.deleted', v.element, v.definition);
  });
};

Selection.prototype.getSelectedElements = function () {
  return valuesIn(this._currentSelection);
};

Selection.prototype._init = function () {
  var that = this;
  this._eventBus.on('label.mousedown', function () {
    that._selectElement.apply(that, arguments);
  });
  this._eventBus.on('link.mousedown', function () {
    console.log('link.mousedown');
    that._selectElement.apply(that, arguments);
  });
  this._eventBus.on('node.mousedown', function () {
    that._selectElement.apply(that, arguments);
  });
  this._eventBus.on('zone.mousedown', function () {
    that._selectElement.apply(that, arguments);
  });
  this._eventBus.on('background.click', function () {
    that._unSelectAllElements.apply(that);
  });
};