'use strict';

var d3 = require('d3'),
    _svg = null,
    _x = null,
    _y = null,
    _xAxis = null,
    _yAxis = null,
    _gX = null,
    _gY = null
    ;

/**
 * The axes drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param canvas
 * @param eventBus
 * @param zoom
 */
function Axes(options, canvas, eventBus, zoom) {
  
  this._options = options;
  
  this._isVisible = this._options.show;
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._zoom = zoom;

  this._init();
}

Axes.$inject = [
  'd3polytree.definitions.settings.grid',
  'canvas',
  'eventBus',
  'zoom'
];

module.exports = Axes;

Axes.prototype._init = function () {
  var that = this,
      wasVisible = false;
  
  this._eventBus.on('canvas.resized', function () {
    // if (that._isVisible) {
    //   that._rescale();
    // }
  });
  this._eventBus.on('zoom.start', function () {
    if (that._zoom && !that._zoom._isZoomable) return;
    wasVisible = that._isVisible;
    that.setVisible(false);
  });
  this._eventBus.on('zoom.end', function () {
    if (wasVisible) {
      that.setVisible(true);
      that._rescale();
    }
  });
  
  this._draw();
  this._rescale();
  
  this.setVisible(this._options.show);
};

Axes.prototype.setVisible = function (visible) {
  if (_svg) {
    this._isVisible = visible;
    _svg.style('display', visible ? 'inline' : 'none');
  }
};

Axes.prototype.toggleVisible = function () {
  if (_svg) {
    this.setVisible(!this._isVisible);
  }
};

Axes.prototype._rescale = function () {
  var canvasSize = this._canvas.getSize(),
      currentTransform = this._canvas.getTransform(),
      height = canvasSize.height,
      width = canvasSize.width,
      scale = currentTransform.a,
      zoomTransform = d3.zoomIdentity
        .translate(currentTransform.e, currentTransform.f)
        .scale(scale)
      ;
  
  _x.domain([-1, width - 1])
    .range([-1, width - 1]);
  
  _y.domain([-1, height - 1])
    .range([-1, height - 1]);
  
  _gX.call(
    _xAxis
      .scale(
        zoomTransform.rescaleX(_x)
      )
      .ticks((width / scale) / this._options.size)
      .tickSize(height)
  );
  _gY.call(
    _yAxis
      .scale(
        zoomTransform.rescaleY(_y)
      )
      .ticks((height / scale) / this._options.size)
      .tickSize(width)
  );
  
  _gX.selectAll('line, path')
    .style('stroke-width', this._options.lineWidth)
    //.filter(Number)
    .style('stroke', this._options.lineColor)
    .style('stroke-dasharray', '2');

  _gY.selectAll('line, path')
    .style('stroke-width', this._options.lineWidth)
    //.filter(Number)
    .style('stroke', this._options.lineColor)
    .style('stroke-dasharray', '2');
};

Axes.prototype._draw = function () {
  if (_svg) {
    _svg.remove();
  }
  
  _svg = this._canvas.getRootLayer()
    .insert('g', ':first-child') // send to the background
    .attr('class', 'axis')
  ;
  
  var canvasSize = this._canvas.getSize(),
      height = canvasSize.height,
      width = canvasSize.width
      ;
  
  _x = d3.scaleLinear()
    .domain([-1, width - 1])
    .range([-1, width - 1])
  ;
  _y = d3.scaleLinear()
    .domain([-1, height - 1])
    .range([-1, height - 1])
  ;
  
  _xAxis = d3.axisBottom(_x)
    .tickFormat('')
    .tickSize(height);
  _yAxis = d3.axisRight(_y)
    .tickFormat('')
    .tickSize(width);
  
  _gX = _svg.append('g')
    .call(_xAxis);
  _gY = _svg.append('g')
    .call(_yAxis);
  
};
