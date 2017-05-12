'use strict';

var forEach = require('lodash/collection').forEach,
    d3 = require('d3'),
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

// BaseElement.prototype._buildElement = function (definition) {
//   this._elements[definition.id] = definition;
// };

BaseElement.prototype._createElement = function () {
  console.error('This method must be implemented');
};

BaseElement.prototype._builder = function (elementId, definition) {
  var element = this._elementRegistry.get(elementId);
  if (element && definition){
    // update
    this.updateElement(definition);
  } else if (element && !definition){
    // remove
    this.removeElementById(element.id);
  } else if (!element && definition) {
    // create
    this.appendElement(definition);
  }
};

// BaseElement.prototype._setElementsData = function(){
//   return this._elementsContainer
//     .selectAll('.' + this._className + 'Item')
//     .data(this.getAll(), function (d) {
//       return d.id;
//     });
// };

BaseElement.prototype._updateElement = function(){
  console.error('This method must be implemented');
};


// BaseElement.prototype._drawElements = function () {
//   var that = this,
//       elementsData = this._setElementsData();
//         // .filter(function(d){
//         //   console.log(d);
//         //   return d.change !== 3;
//         // });
//
//   // remove deleted items
//   forEach(elementsData.exit().nodes(), function (n) {
//     var definition = n.__data__;
//     that._elementRegistry.unClaim({id: definition.id});
//     that._drawingRegistry.remove(definition.id);
//     that._eventBus.emit(that._className + '.removed', that._elements[definition.id], definition);
//     delete that._elements[definition.id];
//   });
//   elementsData.exit().remove();
//
//   // update items
//   elementsData.attr('id', function (d) {
//     return d.id;
//   });
//   elementsData.each(function(definition, index, elements) {
//     var element = d3.select(elements[index]);
//     that._updateElement(element, definition);
//     that._drawingRegistry.set(definition.id, element);
//     that._elements[definition.id] = definition;
//     that._eventBus.emit(that._className + '.updated', element, definition);
//   });
//
//   // create items
//   var newElements = elementsData
//     .enter()
//     .append('g')
//     .attr('id', function (d) {
//       return d.id;
//     })
//     .attr('class', this._className + 'Item element')
//   ;
//
//   newElements
//     .append('g')
//     .attr('class', 'innerElement')
//     .attr('transform', 'translate(3, 3)')
//   ;
//
//   newElements.each(function (definition, index, elements) {
//     var element = d3.select(elements[index]);
//     that._createElement(element, definition);
//     that._drawingRegistry.set(definition.id, element);
//     that._elements[definition.id] = definition;
//     that._eventBus.emit(that._className + '.created', element, definition);
//   });
//
// };

BaseElement.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', this._className);
  
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
    .attr('id', definition.id)
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
