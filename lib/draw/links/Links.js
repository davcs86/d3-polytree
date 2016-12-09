'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  _map = require('lodash/collection').map,
  _linksObj = null,
  _sublinks = null,
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

  _linksObj = _linkGroups
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

  _sublinks = _linkGroups
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

};

Links.prototype._init = function() {
  var that = this;
  this._eventBus.on('force.init', function(){
    that._draw();
  });
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
};