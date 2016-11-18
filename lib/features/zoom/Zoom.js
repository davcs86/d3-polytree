'use strict';

var d3 = require('d3'),
  isUndefined = require('lodash/lang').isUndefined,
  _isZoomable = false,
  _zoom = null
  ;

/**
 * The zoom functionality.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {Canvas} canvas
 * @param {GridLines} gridLines
 */
function Zoom(options, canvas, eventBus) {
  this._canvas = canvas;
  this._eventBus = eventBus;

  init.apply(this, [options.translateX, options.translateY, options.scale]);

  this.setZoomable(!!options.isZoomable);
  this.setZoom(options.translateX, options.translateY, options.scale, options.scale);
}

Zoom.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];

module.exports = Zoom;

Zoom.prototype.setZoom = function(translateX, translateY, scale){
  if (_isZoomable === true) {
    console.log('setZoom');
    var currentTransform = this._canvas.getTransform(),
      deltaX,
      deltaY
      ;

    translateX = !isUndefined(translateX) ? translateX : currentTransform.e;

    translateY = !isUndefined(translateY) ? translateY : currentTransform.f;

    scale = !isUndefined(scale) ? scale : currentTransform.a;

    deltaX = translateX - currentTransform.e;
    deltaY = translateY - currentTransform.f;

    // apply transform
    this._canvas.getDrawingLayer()
      .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');

    this._eventBus.fire('canvas.zoomed', deltaX, deltaY);
  }
};

Zoom.prototype.setZoomable = function(isZoomable){
  _isZoomable = isZoomable;
};

var init = function(tX, tY, s){
  var drawingLayer = this._canvas.getDrawingLayer();
  var that = this;
  _zoom = d3
    .zoom()
    .scaleExtent([0.01, 10])
    .on('zoom', function(){
      if (!_isZoomable) return true;
      // on zoom event
      var trans = d3.event.transform;
      that.setZoom(trans.x, trans.y, trans.k);
    });

  // var drag = d3
  //   .drag()
  //   .on('drag', function(){
  //     if (!_isZoomable) return true;
  //     // on zoom event
  //     var trans = d3.event,
  //       svgTrans = that._canvas.getTransform();
  //     console.log('ondrag');
  //     drawingLayer
  //       .call(_zoom.transform, d3.zoomIdentity
  //         .translate(svgTrans.e + trans.dx, svgTrans.f + trans.dy)
  //         .scale(svgTrans.a));
  //     that._eventBus.fire('canvas.dragged');
  //   });

  drawingLayer = drawingLayer

    .call(_zoom)
    .call(_zoom.transform, d3.zoomIdentity
      .translate(tX, tY)
      .scale(s))
    //.call(drag)
    .append('g');

  this._canvas.setDrawingLayer(drawingLayer);
};