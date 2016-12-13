'use strict';

var BaseElement = require('../baseElement'),
  inherits = require('inherits'),
  _map = require('lodash/collection').map
  ;

/**
 * Links processing & drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} links
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {Markers} markers
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Links(links, canvas, eventBus, markers, elementBuilder, elementRegistry, labels) {

  this._markers = markers;
  this._labels = labels;
  BaseElement.call(this, 'link', links, canvas, eventBus, elementBuilder, elementRegistry);

}

inherits(Links, BaseElement);

Links.$inject = [
  'd3polytree.definitions.link',
  'canvas',
  'eventBus',
  'markers',
  'elementBuilder',
  'elementRegistry',
  'labels'
];

module.exports = Links;

Links.prototype._createElement = function(link, definition) {
  var that = this;

  link
    .append('path')
    .attr(
      'marker-end', function(d){
        return 'url(#'
          + that._markers
            ._getMarker(d.id, d.lineColor, d.fillColor)
          +')';
      }
    )
    .attr('d', function(d){
      var path = _map(d.waypoint, function(p){
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function(d){
      return d.lineColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function(d){
      return d.lineWidth + 'px';
    })
    .style('stroke-linecap', 'round');

  link
    .append('path')
    .attr('d', function(d){
      var path = _map(d.waypoint, function(p){
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function(d){
      return d.fillColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function(d){
      return (0.375 * d.lineWidth) + 'px';
    })
    .style('stroke-linecap', 'round');

  // add the label
  this._labels.appendElement(definition.label);
};
