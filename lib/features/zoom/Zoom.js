'use strict';

var d3js = require('d3');

function rescale(drawingLayer) {
  var trans = d3js.event.translate;
  var scale = d3js.event.scale;
  drawingLayer.attr('transform', 'translate(' + trans + ') scale(' + scale + ')');
}

/**
 * The zoom functionality.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 */
function Zoom(options, canvas, eventBus) {

  var isZoomable = options.isZoomable | false;

  if (!isZoomable) return;

  this._options = options;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._zoom = null;

  this._init();
  this.setZoom(options.translateX, options.translateY, options.scale);
}

Zoom.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];

module.exports = Zoom;

Zoom.prototype.setZoom = function(translateX, translateY, scale){
  var drawingLayer = this._canvas.getDrawingLayer();
  this._zoom
    .translateBy(drawingLayer, translateX, translateY)
    .scaleBy(drawingLayer, scale)
    .event(drawingLayer); // apply zoom
};

Zoom.prototype._init = function(){
  var drawingLayer = this._canvas.getDrawingLayer();
  this._zoom = d3js
    .zoom()
    .scaleExtent([0.05, 10])
    .on('zoom', function(){
      rescale(drawingLayer);
    });
  drawingLayer = drawingLayer
    .call(this._zoom)
    .on('dblclick.zoom', null)
    .append('g');
  this._canvas.setDrawingLayer(drawingLayer);
};