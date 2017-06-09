'use strict';

var forEach = require('lodash/collection').forEach,
    isString = require('lodash/lang').isString,
    valuesIn = require('lodash/object').valuesIn
    ;

/**
 * BaseElement description
 *
 * @class
 * @constructor
 *
 * @param className
 * @param {Array} items
 * @param canvas
 * @param eventBus
 * @param elementBuilder
 * @param elementRegistry
 * @param drawingRegistry
 */

function BaseElement(className, items, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry) {
  
  this._className = className;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._elementBuilder = elementBuilder;
  this._elementRegistry = elementRegistry;
  this._drawingRegistry = drawingRegistry;

  this._elements = {};
  this._elementsContainer = null;
  
  this._init(items);
}

module.exports = BaseElement;

BaseElement.prototype._createElement = function () {
  console.error('This method must be implemented');
};

BaseElement.prototype._builder = function (elementId, definition) {
  var element = this._elementRegistry.get(elementId);
  if (element && definition){
    // update
    if (definition.get('status') !== 1){
      definition.set('status', 2);
    }
    this.updateElement(definition);
  } else if (element && !definition){
    // remove
    this.removeElementById(element.id);
  } else if (!element && definition) {
    // create
    this.appendElement(definition);
  }
};

BaseElement.prototype._updateElement = function(){
  console.error('This method must be implemented');
};

BaseElement.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', this._className+'-group');
};

BaseElement.prototype.removeElement = function (definition) {
  var id = definition.id || false;
  if (isString(id)) {
    delete this._elements[id];
    var elem = this._drawingRegistry.get(id);
    if (elem){
      this._drawingRegistry.remove(id);
      this._elementRegistry.removeElementById(id);
      this._eventBus.emit(this._className + '.removed', elem, definition);
      elem.remove();
    }
  }
};

BaseElement.prototype.removeElementById = function (id) {
  this.removeElement({id: id});
};

BaseElement.prototype.appendElement = function (definition) {

  this._elementRegistry.claimId(definition, this._className);

  // draw definition
  var newElem = this._elementsContainer
    .append('g')
    .datum(definition)
    .attr('element-id', definition.id)
    .attr('class', this._className + 'Item element');

  newElem
    .append('g')
    .attr('class', 'innerElement')
    .attr('transform', 'translate(3, 3)');

  this._createElement(newElem, definition);
  this._drawingRegistry.set(definition.id, newElem);
  this._elements[definition.id] = definition;

  this._eventBus.emit(this._className + '.created', newElem, definition);
};

BaseElement.prototype.updateElement = function (definition) {
  // draw definition
  var element = this._drawingRegistry.get(definition.id);

  element.datum(definition);

  this._updateElement(element, definition);
  this._drawingRegistry.set(definition.id, element);
  this._elements[definition.id] = definition;

  this._eventBus.emit(this._className + '.updated', element, definition);
};

BaseElement.prototype.getAll = function () {
  return valuesIn(this._elements);
};

BaseElement.prototype.getContainer = function () {
  return this._elementsContainer;
};

BaseElement.prototype._init = function (items) {
  var that = this;
  this._drawContainer();
  // initialize _elements
  if (items) {
    forEach(items, function (definition) {
      that._builder(definition.id, definition);
    });
  }
};
