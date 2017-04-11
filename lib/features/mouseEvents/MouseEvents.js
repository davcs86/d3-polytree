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
  // this._canvas.getRootLayer().on('mousedown', function(){
  //   console.log('_canvas.getRootLayer()on(\'click\')', arguments);
  //   if (d3.event.eventPhase === 2) {
  //     that._eventBus.emit('background.click');
  //   }
  // });
};