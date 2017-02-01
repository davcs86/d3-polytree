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

function Selection(eventBus, canvas, elementRegistry) {

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._currentSelection = {};

  this._init();
}

Selection.$inject = [
  'eventBus',
  'canvas',
  'elementRegistry'
];

module.exports = Selection;

Selection.prototype._unSelectElement = function (element, definition) {
  delete this._currentSelection[definition.id];
  d3.select(element.node().parentNode).classed('selected', false);
};

Selection.prototype._selectElement = function (element, definition, event) {
  if (!event.ctrlKey) {
    // overwrite the selected elements with the clicked element
    this._unSelectAllElements();
  }
  // append the clicked element to the selected elements
  d3.select(element.node().parentNode).classed('selected', true);
  this._currentSelection[definition.id] = {
    element: element,
    definition: definition
  };
};

Selection.prototype._unSelectAllElements = function () {
  var that = this;
  forIn(this._currentSelection, function (v) {
    that._unSelectElement(v.element, v.definition);
  });
};

Selection.prototype.deleteSelected = function () {
  var that = this;
  forIn(this._currentSelection, function (v) {
    that._unSelectElement(v.element, v.definition);
    that._eventBus.emit(getLocalName(v.definition) + '.deleted', v.element, v.definition);
  });
};

Selection.prototype.getSelectedElements = function(){
  return valuesIn(this._currentSelection);
};

Selection.prototype._init = function () {
  this._eventBus.on('node.mousedown', this._selectElement, this);
  this._eventBus.on('label.mousedown', this._selectElement, this);
  this._eventBus.on('zone.mousedown', this._selectElement, this);
  //TODO: Fix when user clicks the canvas, un-select all elements.
};