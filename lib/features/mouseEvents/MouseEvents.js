'use strict';

var d3 = require('d3'),
    getLocalName = require('../../utils/LocalName'),
    domDelegate = require('min-dom/lib/delegate');

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
  var type = className ? className: getLocalName(definition),
      that = this
  ;

  var createListener = function(kind){
    element.on(kind, function () {
      that._eventBus.emit(type + '.' + kind, element, definition, d3.event);
    });
  }.bind(this);

  ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click', 'dblclick', 'mouseleave', 'mouseout', 'contextmenu'].forEach(createListener);

  // element.on('mouseenter', function () {
  //   that._eventBus.emit(type + '.mouseenter', element, definition, d3.event);
  // });
  // element.on('mouseover', function () {
  //   that._eventBus.emit(type + '.mouseover', element, definition, d3.event);
  // });
  // element.on('mousedown', function () {
  //   that._eventBus.emit(type + '.mousedown', element, definition, d3.event);
  // });
  // element.on('mouseup', function () {
  //   that._eventBus.emit(type + '.mouseup', element, definition, d3.event);
  // });
  // element.on('click', function () {
  //   that._eventBus.emit(type + '.click', element, definition, d3.event);
  // });
  // element.on('dblclick', function () {
  //   that._eventBus.emit(type + '.dblclick', element, definition, d3.event);
  // });
  // element.on('mouseleave', function () {
  //   that._eventBus.emit(type + '.mouseleave', element, definition, d3.event);
  // });
  // element.on('mouseout', function () {
  //   that._eventBus.emit(type + '.mouseout', element, definition, d3.event);
  // });
  // element.on('contextmenu', function () {
  //   that._eventBus.emit(type + '.contextmenu', element, definition, d3.event);
  // });
};

MouseEvents.prototype._init = function () {
  var that = this;

  // d3.select(that._canvas.getContainer()).delegate('mousedown', '.innerElement', function(){
  //   console.log('evnt delegate node, mousedown', arguments);
  // });
  //
  // d3.select(that._canvas.getContainer()).delegate('mouseover', '.innerElement', function(){
  //   console.log('evnt delegate node, mouseover', arguments);
  // });
  //
  // d3.select(that._canvas.getContainer()).delegate('click', '.innerElement', function(){
  //   console.log('evnt delegate node, click', arguments);
  // });

  // add delegated event listeners
  // ['label', 'node', 'link', 'zone'].forEach(function(i){
  //
  //   var selector = '.'+i+'Item';
  //
  //   ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click', 'dblclick', 'mouseleave', 'mouseout', 'contextmenu'].forEach(function(ev){
  //     domDelegate.bind(that._canvas.getContainer(), selector, ev, function (event) {
  //       //
  //       var element = d3.select(event.delegateTarget);
  //       var elemId = element.attr('id');
  //       var definition = that._elementRegistry.get(elemId);
  //
  //       console.log(i + '.mouseout', element, definition, event);
  //
  //       that._eventBus.emit(i + '.mouseout', element, definition, event);
  //
  //     });
  //   });
  //
  // });

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