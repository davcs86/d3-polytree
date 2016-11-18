'use strict';

var d3js = require('d3'),
  _d3tip = require('d3-tip'),
  _tooltip = null,
  isEmpty = require('lodash/lang').isEmpty;

/**
 * The tooltip functionality.
 *
 * @class
 * @constructor
 *
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 */
function Tooltip(canvas, eventBus) {
  d3js.functor = function functor(v) {
    // legacy function: https://bl.ocks.org/micahstubbs/f94ee71c353f0152da3bc2ee4351608d#d3-tip.js
    return typeof v === 'function' ? v : function() {
      return v;
    };
  };
  _tooltip = _d3tip(d3js)
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return isEmpty(d.label)?'':d.label;
    });
  canvas.getDrawingLayer().call(_tooltip);
  eventBus.on('groupLabel.mouseover', function(){
    // show tooltip on groups
    var zoom = canvas.getTransform().a;
    if (zoom < 0.8){
      _tooltip.show.apply(this, arguments);
    }
  });
  eventBus.on('groupLabel.mouseout', function(){
    _tooltip.hide();
  });
}

Tooltip.$inject = [ 'canvas', 'eventBus' ];

module.exports = Tooltip;