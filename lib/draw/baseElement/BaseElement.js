'use strict';

var forEach = require('lodash/collection').forEach,
    d3 = require('d3'),
    isString = require('lodash/lang').isString,
    valuesIn = require('lodash/object').valuesIn,
    getLocalName = require('../../utils/LocalName')
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

BaseElement.prototype._buildElement = function (definition) {
  this._elements[definition.id] = definition;
  this._drawElements();
};

BaseElement.prototype._createElement = function () {
  console.error('This method must be implemented');
};

BaseElement.prototype._builder = function (definition) {
  this._elementBuilder.create(definition, getLocalName(definition), this._buildElement, this);
};

BaseElement.prototype._setElementsData = function(){
  return this._elementsContainer
    .selectAll('.' + this._className + 'Item')
    .data(this.getAll(), function (d) {
      return d.id;
    });
};

BaseElement.prototype._updateElement = function(){
  console.error('This method must be implemented');
};


BaseElement.prototype._drawElements = function () {
  var that = this,
      elementsData = this._setElementsData();
        // .filter(function(d){
        //   console.log(d);
        //   return d.change !== 3;
        // });

  // remove deleted items
  forEach(elementsData.exit().nodes(), function (n) {
    var definition = n.__data__;
    that._elementRegistry.unClaim({id: definition.id});
    that._drawingRegistry.remove(definition.id);
    that._eventBus.emit(that._className + '.removed', that._elements[definition.id], definition);
    delete that._elements[definition.id];
  });
  elementsData.exit().remove();

  // update items
  elementsData.attr('id', function (d) {
    return d.id;
  });
  elementsData.each(function(definition, index, elements) {
    var element = d3.select(elements[index]);
    that._updateElement(element, definition);
    that._drawingRegistry.set(definition.id, element);
    that._elements[definition.id] = definition;
    that._eventBus.emit(that._className + '.updated', element, definition);
  });

  // create items
  var newElements = elementsData
    .enter()
    .append('g')
    .attr('id', function (d) {
      return d.id;
    })
    .attr('class', this._className + 'Item element')
  ;

  newElements
    .append('g')
    .attr('class', 'innerElement')
    .attr('transform', 'translate(3, 3)')
  ;

  newElements.each(function (definition, index, elements) {
    var element = d3.select(elements[index]);
    that._createElement(element, definition);
    that._drawingRegistry.set(definition.id, element);
    that._elements[definition.id] = definition;
    that._eventBus.emit(that._className + '.created', element, definition);
  });

};

BaseElement.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', this._className);
  
};

BaseElement.prototype._redrawAll = function () {
  this._drawContainer();
  this._drawElements();
};

BaseElement.prototype.removeElement = function (element, definition) {
  var id = definition.id || false;
  console.log('removeElements', arguments);
  if (isString(id)) {
    delete this._elements[id];
    this._drawElements();
  }
};

BaseElement.prototype.removeElementById = function (id) {
  this._removeElement({}, {id: id});
};

BaseElement.prototype.appendElement = function (definition) {
  this._builder(definition);
};

BaseElement.prototype.getAll = function () {
  return valuesIn(this._elements);
};

BaseElement.prototype.getContainer = function () {
  return this._elementsContainer;
};

BaseElement.prototype._init = function (items) {
  var that = this;
  this._eventBus.on('canvas.resized', function () {
    that._redrawAll();
  });
  this._drawContainer();
  // initialize _elements
  if (items) {
    forEach(items, function (definition) {
      that._builder(definition);
    });
  }
};
