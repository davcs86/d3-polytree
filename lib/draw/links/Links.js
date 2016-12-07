'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  _links = null,
  _linksContainer = null,
  _linkGroups = null
  ;

/**
 * The node processing & drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} links
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {Nodes} nodes
 */
function Links(links, canvas, eventBus, nodes, markers) {
  this._links = links;
  this._nodes = nodes;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._markers = markers;

  this._init();
}

Links.$inject = [
  'd3polytree.definitions.link',
  'canvas',
  'eventBus',
  'nodes',
  'markers'
];

module.exports = Links;

Links.prototype._draw = function() {
  var that = this;
  if (_linksContainer){
    // delete previous nodes
    _linksContainer.remove();
  }
  _linksContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', 'links');

  _linkGroups = _linksContainer
    .selectAll('.link')
    .data(this._links)
    .enter()
    .append('g')
    .attr('class', 'link')
    .attr('id', function(d){
      return d.id;
    });

  _links = _linkGroups
    .append('path')
    .attr(
      'marker-end', function(d){
        console.log(d);
        return 'url(#'
          + that._markers
            ._getMarker(d.id, d.strokeColor, d.fillColor, d.size)
          +')';
      }
    )
    .attr('stroke', function(d){
      return d.strokeColor;
    });

  _linkGroups.select('#L_1').selectAll('path')
    .attr('path', 'M 0 0,L 50 50')

  console.log();
    // .style({
    //   'fill': 'none',
    //   'stroke-width': '4px',
    //   'stroke-linecap': 'round'
    // });

};

Links.prototype._init = function() {
  this._draw();
};