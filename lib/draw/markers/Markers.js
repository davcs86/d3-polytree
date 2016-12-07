'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  _markers = null
  ;

function Markers(defs) {
  this._defs = defs;
  _markers = {};
}

Markers.$inject = ['defs'];

module.exports = Markers;

Markers.prototype._getMarker = function(linkId, strokeColor, fillColor, size){
  if (isUndefined(_markers[linkId])){
    // create marker
    this._createMarker(linkId, strokeColor, fillColor, size);
  } else {
    // update marker
    this._updateMarker(linkId, strokeColor, fillColor, size);
  }
  return linkId + '_markerEnd';
};

Markers.prototype._createMarker = function(linkId, strokeColor, fillColor, size){
  var marker = this._defs
    .append('marker')
    .attr('stroke', strokeColor)
    .attr('id', linkId + '_markerEnd')
    .attr('fill', fillColor)
    .attr('viewBox', '-4 -8 15 15')
    .attr('refX', 7)
    .attr('refY', 0)
    .attr('markerWidth', size)
    .attr('markerHeight', size)
    .attr('orient', 'auto')
    ;

  marker
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5Z');

  _markers[linkId] = marker;
};

Markers.prototype._updateMarker = function(linkId, strokeColor, fillColor, size){
  _markers[linkId]
    .attr('stroke', strokeColor)
    .attr('fill', fillColor)
    .attr('markerWidth', size)
    .attr('markerHeight', size);
};