'use strict';

var getLocalName = require('../../utils/LocalName'),
  collections = require('../../utils/Collections');

/**
 * Updates model
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param {ModdleElement} definitions
 */

function Modelling(eventBus, definitions, nodes, labels, zones, links)
{
  this._eventBus = eventBus;
  this._definitions = definitions;

  this._nodes = nodes;
  this._labels = labels;
  this._zones = zones;
  this._links = links;

  this._init();
}

module.exports = Modelling;

Modelling.$inject = [
  'eventBus',
  'd3polytree.definitions',
  'nodes',
  'labels',
  'zones',
  'links'
];

Modelling.prototype._init = function () {
  this._eventBus.on('label.created', this._saveToModel, this);
  this._eventBus.on('link.created', this._saveToModel, this);
  this._eventBus.on('node.created', this._saveToModel, this);
  this._eventBus.on('zone.created', this._saveToModel, this);

  this._eventBus.on('label.deleted', this._deleteFromModel, this);
  this._eventBus.on('label.deleted', this._labels.removeElement, this._labels);

  this._eventBus.on('link.deleted', this._deleteFromModel, this);
  this._eventBus.on('link.deleted', this._links.removeElement, this._links);

  this._eventBus.on('node.deleted', this._deleteFromModel, this);
  this._eventBus.on('node.deleted', this._nodes.removeElement, this._nodes);

  this._eventBus.on('zone.deleted', this._deleteFromModel, this);
  this._eventBus.on('zone.deleted', this._zones.removeElement, this._zones);
};

Modelling.prototype._saveToModel = function(element, definition){
  var localName = getLocalName(definition);
  collections.add(this._definitions.get(localName), definition);
};

Modelling.prototype._deleteFromModel = function(element, definition){
  var localName = getLocalName(definition);
  collections.remove(this._definitions.get(localName), definition);
};