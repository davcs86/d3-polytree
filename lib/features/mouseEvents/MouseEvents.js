'use strict';

var d3 = require('d3'),
    getLocalName = require('../../utils/LocalName');

/**
 * MouseEvents description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param canvas
 */

function MouseEvents(eventBus, canvas) {

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._init();
}

MouseEvents.$inject = [
  'eventBus',
  'canvas'
];

module.exports = MouseEvents;

MouseEvents.prototype._addListeners = function (element, definition, className) {
  var type = className ? className : getLocalName(definition);

  var createListener = function (kind) {
    var self = this;
    element.on(kind, function () {
      self._eventBus.emit(type + '.' + kind, element, definition, d3.event);
    });
  }.bind(this);

  ['mouseenter',
    'mouseover',
    'mousedown',
    'mouseup',
    'click',
    'dblclick',
    'mouseleave',
    'mouseout',
    'contextmenu'].forEach(createListener);

};

MouseEvents.prototype._init = function () {
  this._eventBus.on('label.created', this._addListeners, this);
  this._eventBus.on('link.created', this._addListeners, this);
  this._eventBus.on('node.created', this._addListeners, this);
  this._eventBus.on('zone.created', this._addListeners, this);
};