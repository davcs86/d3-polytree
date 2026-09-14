'use strict';

var propertiesTab = require('./tabs/propertiesTab'),
    is = require('../../utils/modelUtils').is,
    formatTab = require('./tabs/formatTab')
;

function PfdnPropertiesProvider(icons, entryFactory, eventBus) {
  this._icons = icons;
  this._entryFactory = entryFactory;
  this._eventBus = eventBus;
}

PfdnPropertiesProvider.$inject = [
  'icons',
  'entryFactory',
  'eventBus'
];

module.exports = PfdnPropertiesProvider;

PfdnPropertiesProvider.prototype.updateDrawing = function(definition){
  if (is(definition, 'pfdn:Settings')){
    // trigger to redraw the axes
    this._eventBus.emit('canvas.resized');
  } else {
    this._eventBus.emit('element.updated', definition.id, definition);
    if (is(definition, 'pfdn:Link') || is(definition, 'pfdn:Node')){
      this._eventBus.emit('element.updated', definition.label.id, definition.label);
    }
  }
};

PfdnPropertiesProvider.prototype.getTabs = function(element){
  var icons = this._icons,
      entryFactory = this._entryFactory;
  return [
    propertiesTab(element, entryFactory),
    formatTab(element, entryFactory, icons)
  ];
};