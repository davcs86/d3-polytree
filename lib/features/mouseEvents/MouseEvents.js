'use strict';

var d3 = require('d3');

/**
 * MouseEvents description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function MouseEvents(eventBus)
{
  this._eventBus = eventBus;

  this._init();
}

MouseEvents.$inject = [
  'eventBus'
];

module.exports = MouseEvents;

MouseEvents.prototype._addListeners = function(element, definition){
  var type = definition.$descriptor.ns.localName.toLowerCase(),
    that = this
    ;
  d3.select(element.node().parentNode).on('mouseenter', function () {
    that._eventBus.emit(type + '.mouseenter', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('mouseover', function () {
    that._eventBus.emit(type + '.mouseover', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('mousedown', function () {
    that._eventBus.emit(type + '.mousedown', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('mouseup', function () {
    that._eventBus.emit(type + '.mouseup', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('click', function () {
    //d3.event.stopImmediatePropagation();
    that._eventBus.emit(type + '.click', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('dblclick', function () {
    that._eventBus.emit(type + '.dblclick', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('mouseleave', function () {
    that._eventBus.emit(type + '.mouseleave', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('mouseout', function () {
    that._eventBus.emit(type + '.mouseout', element, definition, d3.event);
  });
  d3.select(element.node().parentNode).on('contextmenu', function () {
    that._eventBus.emit(type + '.contextmenu', element, definition, d3.event);
  });
};

MouseEvents.prototype._init = function () {
  this._eventBus.on('label.created', this._addListeners, this);
  this._eventBus.on('link.created', this._addListeners, this);
  this._eventBus.on('node.created', this._addListeners, this);
  this._eventBus.on('zone.created', this._addListeners, this);
};