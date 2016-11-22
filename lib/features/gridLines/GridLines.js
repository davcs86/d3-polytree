'use strict';

var d3 = require('d3'),
  isUndefined = require('lodash/lang').isUndefined,
  ceil = require('lodash/math').ceil,
  _svg = null,
  acumDeltaX = 0,
  acumDeltaY = 0
  ;

/**
 * The grid lines drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} options
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 */
function GridLines(options, canvas, eventBus) {

  var drawGridLines = options.showGridLines | false;

  if (!drawGridLines) return;

  this._options = options;
  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

GridLines.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];

module.exports = GridLines;

GridLines.prototype._init = function() {
  var that = this;

  this._eventBus.on('canvas.resized', function(){
    that._draw();
  });
  this._eventBus.on('canvas.zoomed', function(deltaX, deltaY){
    that._draw(deltaX, deltaY);
  });

  this._draw();
};

GridLines.prototype._draw = function(dX, dY) {
  if (_svg){
    _svg.remove();
  }
  console.log(dX, dY);

  acumDeltaX = ceil(acumDeltaX + (isUndefined(dX) ? 0 : dX));
  acumDeltaY = ceil(acumDeltaY + (isUndefined(dY) ? 0 : dY));

  _svg = this._canvas.getDrawingLayer()
    .insert('g', ':first-child') // send to the background
    .attr('class', 'grid');

  var canvasSize = this._canvas.getSize(),
    that = this,
    svgTransform = this._canvas.getTransform(),
    scaleX = svgTransform.a,
    scaleY = svgTransform.d,
    translateX = svgTransform.e,
    translateY = svgTransform.f,
    height = canvasSize.height / scaleY,
    width = canvasSize.width / scaleX
    ;

  // create the grid lines
  var horizontalLines = ceil(height / this._options.gridSize);
  _svg.selectAll('.hline') // draw horizontal lines
    .data(d3.range(horizontalLines))
    .enter()
    .append('line') // send to the background
    .attr('y1', function (d) {
      return d * that._options.gridSize + ((translateY * -1.0)/scaleY) + ((acumDeltaY/scaleY) % that._options.gridSize);
    })
    .attr('y2', function (d) {
      return d * that._options.gridSize + ((translateY * -1.0)/scaleY) + ((acumDeltaY/scaleY) % that._options.gridSize);
    })
    .attr('x1', function(){
      return ceil((translateX * -1.0) / scaleX);
    })
    .attr('x2', function(){
      return width + ceil((translateX * -1.0)/scaleX);
    })
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px')
    .attr('class', 'gridline');

  var verticalLines = Math.ceil(width / this._options.gridSize);
  _svg.selectAll('.vline')  // draw vertical lines
    .data(d3.range(verticalLines))
    .enter()
    .append('line') // send to the background
    .attr('x1', function (d) {
      console.log(acumDeltaX);
      return d * that._options.gridSize + ((translateX * -1.0)/scaleX) + ((acumDeltaX/scaleX) % that._options.gridSize);
    })
    .attr('x2', function (d) {
      return d * that._options.gridSize + ((translateX * -1.0)/scaleX) + ((acumDeltaX/scaleX) % that._options.gridSize);
    })
    .attr('y1', (translateY * -1.0)/scaleY)
    .attr('y2', height+(translateY * -1.0)/scaleY)
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px');


};
