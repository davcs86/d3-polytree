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
  var type = className ? className: getLocalName(definition),
      that = this
  ;
  element.on('mouseenter', function () {
    that._eventBus.emit(type + '.mouseenter', element, definition, d3.event);
  });
  element.on('mouseover', function () {
    that._eventBus.emit(type + '.mouseover', element, definition, d3.event);
  });
  element.on('mousedown', function () {
    that._eventBus.emit(type + '.mousedown', element, definition, d3.event);
  });
  element.on('mouseup', function () {
    that._eventBus.emit(type + '.mouseup', element, definition, d3.event);
  });
  element.on('click', function () {
    that._eventBus.emit(type + '.click', element, definition, d3.event);
  });
  element.on('dblclick', function () {
    that._eventBus.emit(type + '.dblclick', element, definition, d3.event);
  });
  element.on('mouseleave', function () {
    that._eventBus.emit(type + '.mouseleave', element, definition, d3.event);
  });
  element.on('mouseout', function () {
    that._eventBus.emit(type + '.mouseout', element, definition, d3.event);
  });
  element.on('contextmenu', function () {
    that._eventBus.emit(type + '.contextmenu', element, definition, d3.event);
  });
};

MouseEvents.prototype._init = function () {
  var that = this;
  this._eventBus.on('label.created', function () {
    that._addListeners.apply(that, arguments);
  });
  this._eventBus.on('link.created', function () {
    that._addListeners.apply(that, arguments);
  });
  this._eventBus.on('node.created', function () {
    that._addListeners.apply(that, arguments);
  });
  this._eventBus.on('zone.created', function () {
    that._addListeners.apply(that, arguments);
  });
};