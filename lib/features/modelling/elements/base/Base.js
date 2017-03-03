'use strict';

var getLocalName = require('../../../../utils/LocalName'),
  collections = require('../../../../utils/Collections');

/**
 * Updates element's model
 *
 * @class
 * @constructor
 *
 * @param {ModdleElement} definitions
 */

function Base(definitions, elements) {
  this._definitions = definitions;
  this._elements = elements;
}

module.exports = Base;

Base.prototype.create = function () {
  console.error('This method must be implemented');
};

Base.prototype.saveToModel = function (element, definition) {
  var localName = getLocalName(definition);
  collections.add(this._definitions.get(localName), definition);
};

Base.prototype.delete = function (element, definition) {
  var localName = getLocalName(definition);
  collections.remove(this._definitions.get(localName), definition);
  this._elements.removeElement.apply(this._elements, arguments);
};