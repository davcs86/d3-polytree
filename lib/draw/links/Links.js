'use strict';

var BaseElement = require('../baseElement'),
  inherits = require('inherits'),
  forEach = require('lodash/collection').forEach,
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
function Links(links, canvas, eventBus, markers, elementBuilder, elementRegistry) {

  this._markers = markers;
  BaseElement.call(this, 'link', links, canvas, eventBus, elementBuilder, elementRegistry);

}

inherits(Links, BaseElement);

Links.$inject = [
  'd3polytree.definitions.link',
  'canvas',
  'eventBus',
  'markers',
  'elementBuilder',
  'elementRegistry'
];

module.exports = Links;

Links.prototype._setElementsData = function () {
  return this._elementsContainer
    .selectAll('.' + this._className + 'Item')
    .data(this.getAll(), function (d) {
      var key = {
        "id_": d.id,
        "s_": d.source.id,
        "sx_": d.source.position.x,
        "sy_": d.source.position.y,
        "t_": d.target.id,
        "tx_": d.target.position.x,
        "ty_": d.target.position.y
      };
      return key;
    });
};

Links.prototype._createElement = function (link) {
  var that = this;

  link
    .append('path')
    .attr('class', 'line-path')
    .attr(
      'marker-end', function (d) {
        return 'url(#'
          + that._markers
            ._getMarker(d.id, d.lineColor, d.fillColor)
          + ')';
      }
    )
    .attr('d', function (d) {
      var path = _map(d.waypoint, function (p) {
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function (d) {
      return d.lineColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function (d) {
      return d.lineWidth + 'px';
    })
    .style('stroke-linecap', 'round');

  link
    .append('path')
    .attr('class', 'line-subpath')
    .attr('d', function (d) {
      var path = _map(d.waypoint, function (p) {
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function (d) {
      return d.fillColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function (d) {
      return (0.375 * d.lineWidth) + 'px';
    })
    .style('stroke-linecap', 'round');

};

Links.prototype._updateElement = function (link, definition) {
  var that = this;

  link
    .select('.line-path')
    .attr(
      'marker-end', function (d) {
        return 'url(#'
          + that._markers
            ._getMarker(d.id, d.lineColor, d.fillColor)
          + ')';
      }
    )
    .attr('d', function (d) {
      var path = _map(d.waypoint, function (p) {
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function (d) {
      return d.lineColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function (d) {
      return d.lineWidth + 'px';
    })
    .style('stroke-linecap', 'round');

  link
    .select('.line-subpath')
    .attr('d', function (d) {
      var path = _map(d.waypoint, function (p) {
        return p.x + ' ' + p.y;
      }).join(', L ');
      return 'M ' + path;
    })
    .style('stroke', function (d) {
      return d.fillColor;
    })
    .style('fill', 'none')
    .style('stroke-width', function (d) {
      return (0.375 * d.lineWidth) + 'px';
    })
    .style('stroke-linecap', 'round');

  // update outline
  try {
    var x = Infinity,
      y = Infinity,
      elemSize = link.select('.innerElement').node().getBBox();
    forEach(definition.waypoint, function (v) {
      x = Math.min(x, v.x);
      y = Math.min(y, v.y);
    });
    link
      .select('.element-outline')
      .attr('x', x)
      .attr('y', y)
      .attr('width', elemSize.width + 6)
      .attr('height', elemSize.height + 6);
  } catch(ex){
    console.log(ex);
  }

};

Links.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .insert('g', '.node') // send to the background
    .attr('class', this._className);
};
