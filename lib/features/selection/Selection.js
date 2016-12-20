'use strict';

var d3 = require('d3'),
  forIn = require('lodash/object').forIn;

/**
 * Selection description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param {Canvas} canvas
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

Selection.prototype._unSelectElement = function(element, definition){
  delete this._currentSelection[definition.id];
  d3.select(element.node().parentNode).classed('selected', false);
};

Selection.prototype._selectElement = function(element, definition, event){

  event.stopImmediatePropagation();
  if (!event.ctrlKey){
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

Selection.prototype._unSelectAllElements = function(){
  var that = this;
  forIn(this._currentSelection, function(v){
    that._unSelectElement(v.element, v.definition);
  });
};

Selection.prototype._init = function () {
  this._eventBus.on('node.click', this._selectElement, this);
  this._eventBus.on('label.click', this._selectElement, this);
  this._eventBus.on('zone.click', this._selectElement, this);
  //TODO: Fix when user clicks the canvas, un-select all elements.
  // this._eventBus.on('canvas.resized', function(){
  //   var that = this,
  //     canvas = this._canvas.getDrawingLayer();
  //   console.log('canvas resized');
  //   canvas.on('click', function(){
  //     console.log('canvas clicked');
  //     that._unSelectAllElements();
  //   });
  // }, this);

};