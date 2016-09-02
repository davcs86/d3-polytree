'use strict';

var d3js = require('d3');

/**
 * The zoom functionality.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 * @param {GridLines} GridLines
 */
function Zoom(options, canvas, eventBus, gridLines) {

  var isZoomable = options.isZoomable | false;

  if (!isZoomable) return;

  this._options = options;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._gridLines = gridLines;
  this._zoom = null;

  this._init();
  this.setZoom(options.translateX, options.translateY, options.scale);
}

Zoom.$inject = [ 'd3polytree.options', 'canvas', 'eventBus', 'gridLines' ];

module.exports = Zoom;

Zoom.prototype.setZoom = function(translateX, translateY, scale){
  this._canvas
    .getDrawingLayer()
    .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
  if (this._gridLines){
    this._gridLines._draw();
  }
};

Zoom.prototype._init = function(){
  var drawingLayer = this._canvas.getDrawingLayer();
  var that = this;
  this._zoom = d3js
    .zoom()
    .scaleExtent([0.01, 10])
    // .filter(function(){
    //   console.log(arguments);
    //   return true;
    // })
    .on('zoom', function(){
      var trans = d3js.event.transform;
      that.setZoom(trans.x, trans.y, trans.k);
    });
  drawingLayer = drawingLayer
    .call(this._zoom)
    .append('g');
  this._canvas.setDrawingLayer(drawingLayer);
};