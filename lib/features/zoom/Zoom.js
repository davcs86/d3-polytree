'use strict';

var d3js = require('../../utils/CustomD3'),
  _isZoomable = false,
  _canvas = null,
  _zoom = null,
  _gridLines = null;

/**
 * The zoom functionality.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {Canvas} Canvas
 * @param {GridLines} GridLines
 */
function Zoom(options, canvas, gridLines) {
  _canvas = canvas;
  _gridLines = gridLines;

  init.apply(this);

  this.setZoomable(!!options.isZoomable);
  this.setZoom(options.translateX, options.translateY, options.scale);
}

Zoom.$inject = [ 'd3polytree.options', 'canvas', 'gridLines' ];

module.exports = Zoom;

Zoom.prototype.setZoom = function(translateX, translateY, scale){
  if (_isZoomable === true) {
    // apply zoom
    _canvas
      .getDrawingLayer()
      .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
    if (_gridLines) {
      // re-draw grid lines
      _gridLines._draw();
    }
  }
};

Zoom.prototype.setZoomable = function(isZoomable){
  _isZoomable = isZoomable;
};

var init = function(){
  var drawingLayer = _canvas.getDrawingLayer();
  //var that = this;
  _zoom = d3js
    .zoom()
    .scaleExtent([0.01, 10])
    // .filter(function(){
    //   console.log(this);
    //   console.log(arguments);
    //   console.log(d3js.event);
    //   return false;
    // })
    .on('end', console.log);
    // .on('zoom', function(){
    //   // on zoom event
    //   var trans = d3js.event.transform;
    //   that.setZoom(trans.x, trans.y, trans.k);
    // });
  drawingLayer = drawingLayer
    .call(_zoom)
    .append('g');
  _canvas.setDrawingLayer(drawingLayer);
};