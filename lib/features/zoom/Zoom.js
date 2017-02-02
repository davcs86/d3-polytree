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
 * @param {EventEmitter} eventBus
 */
function Zoom(options, canvas, eventBus) {
  var tX = options.get('offset').get('x'),
    tY = options.get('offset').get('y'),
    s = options.get('scale');
  
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._options = options;
  
  init.call(this);
  
  this.setZoomable(true);
  this.setInitialZoom(tX, tY, s);
  this.setZoomable(false);
}

Zoom.$inject = ['d3polytree.definitions.settings.zoom', 'canvas', 'eventBus'];

module.exports = Zoom;

Zoom.prototype.setZoom = function (translateX, translateY, scale) {
  this._eventBus.emit('zoom.preZoom', translateX, translateY, scale);
  
  if (_isZoomable === true) {
    
    var currentTransform = this._canvas.getTransform();
    
    translateX = !isUndefined(translateX) ? translateX : currentTransform.e;
    
    translateY = !isUndefined(translateY) ? translateY : currentTransform.f;
    
    scale = !isUndefined(scale) ? scale : currentTransform.a;
    
    // apply transform
    this._canvas.getDrawingLayer()
      .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
    
    // save the business object
    this._options.scale = scale;
    this._options.offset.x = translateX;
    this._options.offset.y = translateY;
    
    this._eventBus.emit('canvas.zoomed');
  }
};

Zoom.prototype.setZoomable = function (isZoomable) {
  _isZoomable = isZoomable;
};

Zoom.prototype.setInitialZoom = function (tX, tY, s) {
  var drawingLayer = this._canvas.getDrawingLayer();
  d3.select(drawingLayer.node().parentNode).call(_zoom.transform, d3.zoomIdentity
    .translate(tX, tY)
    .scale(s));
};

var init = function () {
  var drawingLayer = this._canvas.getDrawingLayer();
  var that = this;
  _zoom = d3
    .zoom()
    .scaleExtent([0.1, 15])
    .on('start', function () {
      that._eventBus.emit('zoom.start');
    })
    .on('zoom', function () {
      if (!_isZoomable) return true;
      // on zoom event
      var trans = d3.event.transform;
      that.setZoom(trans.x, trans.y, trans.k);
    })
    .on('end', function () {
      that._eventBus.emit('zoom.end');
    });
  
  drawingLayer = drawingLayer
    .call(_zoom)
    .append('g');
  
  this._canvas.setDrawingLayer(drawingLayer);
};