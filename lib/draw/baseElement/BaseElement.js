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
 * @param {Array} items
 */

function BaseElement(className, items, canvas, eventBus, elementBuilder, elementRegistry) {
  
  this._className = className;
  this._items = items;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._elementBuilder = elementBuilder;
  this._elementRegistry = elementRegistry;
  
  this._elements = {};
  this._elementsContainer = null;
  
  this._init();
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

BaseElement.prototype._drawElements = function () {
  var that = this,
    elementsData = this._elementsContainer
      .selectAll('.' + this._className + 'Item')
      .data(this.getAll(), function (d) {
        return d.id;
      });
  
  var newElements = elementsData
    .enter()
    .append('g')
    .attr('class', this._className + 'Item element')
    //.attr('class', 'element')
    .append('g')
    .attr('class', 'innerElement')
    .attr('transform', 'translate(3, 3)')
    .attr('id', function (d) {
      return d.id;
    });
  
  // remove deleted items
  forEach(elementsData.exit().nodes(), function (n) {
    var definition = n.__data__;
    that._elementRegistry.unClaim({id: definition.id});
  });
  elementsData.exit().remove();
  
  // create appended items
  newElements.each(function (definition, index, elements) {
    var element = d3.select(elements[index]);
    that._createElement(element, definition);
    that._elementRegistry.claim(definition.id, element);
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

BaseElement.prototype._init = function () {
  var that = this;
  this._eventBus.on('force.init', function () {
    that._redrawAll();
  });
  this._eventBus.on('canvas.resized', function () {
    that._redrawAll();
  });
  this._drawContainer();
  // initialize _elements
  if (this._items) {
    forEach(this._items, function (definition) {
      that._builder(definition);
    });
  }
};
