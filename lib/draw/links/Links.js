'use strict';

var _map = require('lodash/collection').map,
  forEach = require('lodash/collection').forEach,
  _linksContainer = null
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
 * @param {Markers} markers
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Links(links, canvas, eventBus, nodes, markers, elementBuilder, elementRegistry) {

  this._links = links;
  this._nodes = nodes;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._markers = markers;
  this._elementBuilder = elementBuilder;
  this._elementRegistry = elementRegistry;

  this._init();
}

Links.$inject = [
  'd3polytree.definitions.link',
  'canvas',
  'eventBus',
  'nodes',
  'markers',
  'elementBuilder',
  'elementRegistry'
];

module.exports = Links;

Links.prototype._buildLink = function(definition, isUpdate){
  return (!!isUpdate) ? this._updateLink(definition) : this._createLink(definition);
};

Links.prototype._createLink = function(definition) {
  var that = this;
  var link = _linksContainer
    .selectAll('.link')
    .data([definition])
    .enter()
    .append('g')
    //.attr('class', 'link')
    .attr('id', function(d){
      return d.id;
    });

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
  return link;
};

Links.prototype._updateLink = function(definition){
  var element = this._elementRegistry.get(definition.id);
  element.remove();
  return this._createLink(definition);
};

Links.prototype._draw = function() {
  var that = this;
  if (_linksContainer){
    // delete previous nodes
    _linksContainer.remove();
  }
  _linksContainer = this._canvas.getDrawingLayer()
    .append('g')
    .attr('class', 'links');
  // build the nodes
  forEach(this._links, function(def){
    that._elementBuilder.create(def, that._buildLink, that);
  });

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