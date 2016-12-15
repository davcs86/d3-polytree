'use strict';

var d3 = require('d3');

require('./style');

/**
 * Drag description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function Drag(canvas, eventBus, elementRegistry) {

  this._canvas = canvas;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._init();
}

Drag.$inject = [
  'canvas',
  'eventBus',
  'elementRegistry'
];

module.exports = Drag;

Drag.prototype._setElemToDrag = function(element){
  var that = this;
  d3.select(element.node().parentNode).call(
    d3.drag()
      .subject(function(def) {
         return d3.select(that._elementRegistry.get(def.id).node().parentNode);
      })
      .on('start', function(){
        d3.event.subject.classed('cursor-grabbing', true);
      })
      .on('end', function(){
        d3.event.subject.classed('cursor-grabbing', false);
      })
      .on('drag', function(def){
        var elem = d3.event.subject,
          x = (elem.attr('x')*1.0) + d3.event.dx,
          y = (elem.attr('y')*1.0) + d3.event.dy,
          translate = 'translate('+x+','+y+')';
        elem
          .attr('x', x)
          .attr('y', y)
          .attr('transform', translate);
        // update business object
        def.position.x = x;
        def.position.y = y;
      })
  );
};

Drag.prototype._init = function () {
  // set to drag outlined elements
  this._eventBus.on('outline.created', this._setElemToDrag, this);
};