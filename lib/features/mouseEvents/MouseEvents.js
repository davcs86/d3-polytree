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
 * @param elementRegistry
 */

function MouseEvents(eventBus, canvas, elementRegistry) {

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._init();
}

MouseEvents.$inject = [
  'eventBus',
  'canvas',
  'elementRegistry'
];

module.exports = MouseEvents;

MouseEvents.prototype._addListeners = function (element, definition, className) {
  var type = className ? className : getLocalName(definition),
      that = this
  ;

  var createListener = function (kind) {
    element.on(kind, function () {
      that._eventBus.emit(type + '.' + kind, element, definition, d3.event);
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
  var addListFn = function(){
    this._addListeners.apply(this, arguments);
  }.bind(this);

  this._eventBus.on('label.created', addListFn);
  this._eventBus.on('link.created', addListFn);
  this._eventBus.on('node.created',addListFn);
  this._eventBus.on('zone.created', addListFn);
};