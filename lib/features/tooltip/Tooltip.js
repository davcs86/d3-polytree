'use strict';

var d3js = require('../../utils/CustomD3'),
  _tooltipHelper = require('d3-tip'),
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
  _tooltipHelper(d3js);
  _tooltip = d3js.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return isEmpty(d.label)?'':d.label;
    });
  canvas.getDrawingLayer().call(_tooltip);
  eventBus.on('groups.drawn', function(groups){
    // show tooltip on groups
    groups.on('mouseover', function(){
      var transform = canvas.getTransform(),
        zoom = transform.a;
      if (zoom < 0.8){
        _tooltip.show.apply(this, arguments);
      }
    })
      .on('mouseout', _tooltip.hide);
  });
}

Tooltip.$inject = [ 'canvas', 'eventBus' ];

module.exports = Tooltip;