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
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 */
function Axes(options, canvas, eventBus) {

  this._options = options;
  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

Axes.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];

module.exports = Axes;

Axes.prototype._init = function() {
  var that = this;

  this._eventBus.on('canvas.resized', function(){
    that._rescale();
  });
  this._eventBus.on('canvas.zoomed', function(){
    that._rescale();
  });

  this._draw();
};

Axes.prototype._rescale = function(){
  var canvasSize = this._canvas.getSize(),
    currentTransform = this._canvas.getTransform(),
    scaleX = currentTransform.a,
    scaleY = currentTransform.d,
    height = canvasSize.height / scaleY,
    width = canvasSize.width / scaleX,
    zoomTransform = d3.zoomIdentity
      .translate(currentTransform.e, currentTransform.f)
      .scale(currentTransform.a)
    ;
  _gX.call(
    _xAxis
      .scale(
        zoomTransform.rescaleX(_x)
      )
      .ticks(width / this._options.gridSize)
  );
  _gY.call(
    _yAxis
      .scale(
        zoomTransform.rescaleY(_y)
      )
      .ticks(height / this._options.gridSize)
  );

  _gX.selectAll('line, path')
    .style('stroke', this._options.gridLinesColor);
  _gY.selectAll('line, path')
    .style('stroke', this._options.gridLinesColor);
};

Axes.prototype._draw = function() {
  if (_svg){
    _svg.remove();
  }

  _svg = this._canvas.getDrawingLayer()
    .insert('g', ':first-child') // send to the background
    .attr('class', 'axis')
  ;

  var canvasSize = this._canvas.getSize(),
    svgTransform = this._canvas.getTransform(),
    scaleX = svgTransform.a,
    scaleY = svgTransform.d,
    height = canvasSize.height / scaleY,
    width = canvasSize.width / scaleX
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
    .tickSize(height);
  _yAxis = d3.axisRight(_y)
    .tickSize(width);

  _gX = _svg.append('g')
    .attr('class', 'axis axis--x')
    .call(_xAxis);
  _gY = _svg.append('g')
    .attr('class', 'axis axis--y')
    .call(_yAxis);

};
