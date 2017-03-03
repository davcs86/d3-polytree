'use strict';

/**
 * Updates model
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param {ModdleElement} definitions
 * @param modellingNodes
 * @param modellingLabels
 * @param modellingZones
 * @param modellingLinks
 */

function Modelling(eventBus, definitions, modellingNodes, modellingLabels, modellingZones, modellingLinks) {
  this._eventBus = eventBus;
  this._definitions = definitions;
  
  this._elements = {
    'label': modellingLabels,
    'node': modellingNodes,
    'zone': modellingZones,
    'link': modellingLinks,
  };
  
  this._init();
}

module.exports = Modelling;

Modelling.$inject = [
  'eventBus',
  'd3polytree.definitions',
  'modellingNodes',
  'modellingLabels',
  'modellingZones',
  'modellingLinks'
];

Modelling.prototype.doAction = function(elementClassName, action, parameters){
  var actionElem = this._elements[elementClassName];
  if (actionElem){
    var actionFunc = actionElem[action];
    if (actionFunc){
      return actionFunc.apply(actionElem, parameters);
    }
  }
  return null;
};

Modelling.prototype._init = function () {
  var that = this;
  
  this._eventBus.on('label.created', function () {
    that.doAction.apply(that, ['label', 'saveToModel', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('link.created', function () {
    that.doAction.apply(that, ['link', 'saveToModel', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('node.created', function () {
    that.doAction.apply(that, ['node', 'saveToModel', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('zone.created', function () {
    that.doAction.apply(that, ['zone', 'saveToModel', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('label.deleted', function () {
    that.doAction.apply(that, ['label', 'delete', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('link.deleted', function () {
    that.doAction.apply(that, ['link', 'delete', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('node.deleted', function () {
    that.doAction.apply(that, ['node', 'delete', [].slice.call(arguments)]);
  });
  
  this._eventBus.on('zone.deleted', function () {
    that.doAction.apply(that, ['zone', 'delete', [].slice.call(arguments)]);
  });
};
