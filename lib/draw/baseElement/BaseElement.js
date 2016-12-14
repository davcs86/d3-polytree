'use strict';

var forEach = require('lodash/collection').forEach,
  forIn = require('lodash/object').forIn,
  isString = require('lodash/lang').isString,
  valuesIn = require('lodash/object').valuesIn
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

BaseElement.prototype._buildElement = function(definition){
  this.removeElement(definition);
  this._elements[definition.id] = definition;
  var element = this._elementsContainer
    .selectAll('.' + this._className)
    .data([definition])
    .enter()
    .append('g')
    .attr('class', 'element')
    .append('g')
    //.attr('class', this._className)
    .attr('id', function(d){
      return d.id;
    });
  this._createElement(element, definition);
  this._eventBus.emit(this._className+'.created', element, definition);
  return element;
};

BaseElement.prototype._createElement = function(){
  console.error('This method must be implemented');
};

BaseElement.prototype._builder = function(definition){
  this._elementBuilder.create(definition, this._buildElement, this);
};

BaseElement.prototype._drawContainer = function(){
  if (this._elementsContainer){
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', this._className);
};

BaseElement.prototype._draw = function() {
  var that = this;

  this._drawContainer();
  // build the elements
  forIn(this._elements, function (itemDefinition) {
    that._builder(itemDefinition);
  });

};

BaseElement.prototype.removeElement = function(definition){
  var id = definition.id || false;
  if (isString(id)){
    var element = this._elementRegistry.get(id);
    if (element) {
      // remove element
      this._elementRegistry.unClaim(definition);
      this._elementRegistry.unRegister(definition);
      element.remove();
      element = null;
    }
    delete this._elements[id];
  }
};

BaseElement.prototype.removeElementById = function(id){
  this._removeElement({id:id});
};

BaseElement.prototype.appendElement = function(definition){
  this._builder(definition);
};

BaseElement.prototype.getAll = function(){
  return valuesIn(this._elements);
};

BaseElement.prototype.getContainer = function(){
  return this._elementsContainer;
};

BaseElement.prototype._init = function () {
  var that = this;
  this._eventBus.on('force.init', function(){
    that._draw();
  });
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
  this._drawContainer();
  // initialize _elements
  forEach(this._items, function(definition){
    that._builder(definition);
  });
};
