'use strict';

var d3 = require('d3');

/**
 * Drag description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function Drag(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._init();
}

Drag.$inject = [
  'eventBus',
  'elementRegistry'
];

module.exports = Drag;

Drag.prototype._setElemToDrag = function(element){
  var that = this;
  element.call(
    d3.drag()
      //.origin(function(d) { return d; })
      .on('drag', function(def){
        var elem = d3.select(that._elementRegistry.get(def.id).node().parentNode),
          //x = elem.attr('x')*1.0,
          //y = elem.attr('y')*1.0,
          x = d3.event.dx,
          y = d3.event.dy,
          translate = 'translate('+(x)+','+(y)+')';
        console.log(x,y);
        elem
          .attr('x', x)
          .attr('y', y)
          .attr('transform', translate);

        console.log(elem.attr('x'));
      })
  );
};

Drag.prototype._init = function () {
  // set to drag outlined elements
  this._eventBus.on('outline.created', this._setElemToDrag, this);
};