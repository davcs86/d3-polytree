'use strict';

var d3 = require('d3'),
  _d3tip = require('d3-tip'),
  _tooltip = null,
  isFunction = require('lodash/lang').isFunction
;

require('./style.scss');

/**
 * The tooltip functionality.
 *
 * @class
 * @constructor
 *
 * @param {Function} tooltip
 * @param {Canvas} canvas
 * @param {EventEmitter} eventBus
 */
function Tooltip(tooltip, canvas, eventBus) {
  if (isFunction(tooltip)) {
    _tooltip = _d3tip(d3)
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function () {
        return tooltip.apply(this, arguments);
      });
    
    canvas.getSVG().call(_tooltip);
    
    eventBus.on('node.mouseover', function () {
      // show tooltip on nodes
      var zoom = canvas.getTransform().a;
      if (zoom < 0.8) {
        _tooltip.show.apply(this, arguments);
      }
    });
    eventBus.on('node.mouseout', function () {
      _tooltip.hide();
    });
  }
}

Tooltip.$inject = [
  'd3polytree.options.tooltip',
  'canvas',
  'eventBus'
];

module.exports = Tooltip;