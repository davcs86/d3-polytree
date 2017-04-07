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
 * @param elements
 * @param elementRegistry
 * @param notifications
 */

function Base(definitions, elements, elementRegistry, notifications) {
  this._definitions = definitions;
  this._elements = elements;
  this._elementRegistry = elementRegistry;
  this._notifications = notifications;
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
  if (localName === 'label' && definition.isReadOnly === true) {
    this._notifications.error({
      text: 'You can\'t delete an associated label, you should remove the main element',
      title: 'Not allowed!'
    });
    return;
  } else if (localName !== 'label' && definition.get('label') && definition.get('label').$instanceOf('pfdn:Label')) {
    // also delete the associated label
    definition.label.isReadOnly = false;
    var lblElement = this._elementRegistry.get(definition.label.id);
    //console.log(lblElement, definition.label);
    this._eventBus.emit('label.deleted', lblElement, definition.label);
  }
  collections.remove(this._definitions.get(localName), definition);
  this._elements.removeElement.apply(this._elements, arguments);
};