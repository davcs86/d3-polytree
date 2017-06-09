'use strict';

var d3 = require('d3'),
    isUndefined = require('lodash/lang').isUndefined,
    getLocalName = require('../../utils/LocalName'),
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
 * @param calculateCenter
 */
function Zoom(options, canvas, eventBus, calculateCenter) {
  var tX = options.get('offset').get('x'),
      tY = options.get('offset').get('y'),
      s = options.get('scale');
  
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._options = options;
  this._isZoomable = false;
  this._calculateCenter = calculateCenter;

  this._init();

  //console.log(options);

  this.setZoomable(true);
  this.setInitialZoom(tX, tY, s);
  this.setZoomable(false);
}

Zoom.$inject = [
  'd3polytree.definitions.settings.zoom',
  'canvas',
  'eventBus',
  'calculateCenter'
];

module.exports = Zoom;

Zoom.prototype.setZoom = function (translateX, translateY, scale) {
  this._eventBus.emit('zoom.preZoom', translateX, translateY, scale);

  if (this._isZoomable === true) {
    
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
  this._isZoomable = isZoomable;
};

Zoom.prototype.setInitialZoom = function (tX, tY, s, duration) {
  var drawingLayer = this._canvas.getDrawingLayer();
  var selection = d3.select(drawingLayer.node().parentNode);
  if (duration){
    selection = selection
      .transition()
      .duration(duration)
    ;
  }
  selection.call(_zoom.transform, d3.zoomIdentity
    .translate(tX, tY)
    .scale(s));
};

Zoom.prototype._init = function () {
  var drawingLayer = this._canvas.getDrawingLayer();
  var that = this;
  _zoom = d3
    .zoom()
    .scaleExtent([0.1, 15])
    .on('start', function () {
      that._eventBus.emit('zoom.start');
    })
    .on('zoom', function () {
      if (!that._isZoomable) return true;
      // on zoom event
      var trans = d3.event.transform;
      that.setZoom.call(that, trans.x, trans.y, trans.k);
    })
    .on('end', function () {
      that._eventBus.emit('zoom.end');
    });

  drawingLayer.on('click', function(){
    var isOutline = d3.select(d3.event.target).classed('element-outline');
    if (!isOutline) {
      that._eventBus.emit('background.click');
    }
  });
  
  drawingLayer = drawingLayer
    .call(_zoom)
    .append('g');

  this._canvas.setDrawingLayer(drawingLayer);

  this._eventBus.on('zoom.to.element', function(element, definition){
    var wasZoomable = that._isZoomable,
        localName = getLocalName(definition),
        center = that._calculateCenter.getCenterPosition(),
        centralPoint = {x: 0, y: 0};

    that.setZoomable(true);
    if (localName === 'node') {
      centralPoint.x = (1.5 + definition.position.x + definition.size / 2);
      centralPoint.y = (1.5 + definition.position.y + definition.size / 2);
    } else if (localName === 'link') {
      var nW = definition.waypoint.length - 1;
      if (nW >= 0) {
        centralPoint.x = definition.waypoint[nW].x;
        centralPoint.y = definition.waypoint[nW].y;
      }
    }
    that.setInitialZoom(center.x - centralPoint.x * 1.2, center.y - centralPoint.y * 1.2, 1.2, 1800);
    that.setZoomable(wasZoomable);
  });

  this._eventBus.emit('zoom.init');

};