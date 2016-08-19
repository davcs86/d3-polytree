'use strict';

var d3js = require('d3');

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
  this._draw();
};

GridLines.prototype._draw = function() {
  var svg = this._canvas.getDrawingLayer(),
      canvasSize = this._canvas.getSize(),
      height = canvasSize.height,
      width = canvasSize.width,
      that = this;
  // create the grid lines

  var horizontalLines = Math.ceil(height / this._options.gridSize);
  svg // draw horizontal lines
    .selectAll('.hline')
    .data(d3js.range(horizontalLines))
    .enter()
    .append('line')
    .attr('y1', function (d) {
      return d * that._options.gridSize;
    })
    .attr('y2', function (d) {
      return d * that._options.gridSize;
    })
    .attr('x1', 0)
    .attr('x2', '100%')
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px')
    .attr('class', 'gridline');

  var verticalLines = Math.ceil(width / this._options.gridSize);
  svg // draw vertical lines
    .selectAll('.vline')
    .data(d3js.range(verticalLines))
    .enter()
    .append('line')
    .attr('x1', function (d) {
      return d * that._options.gridSize;
    })
    .attr('x2', function (d) {
      return d * that._options.gridSize;
    })
    .attr('y1', 0)
    .attr('y2', '100%')
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px')
    .attr('class', 'gridline');

};