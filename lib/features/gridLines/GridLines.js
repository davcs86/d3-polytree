'use strict';

var d3js = require('d3'),
  _hLines = null,
  _vLines = null;

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
      that = this,
      svgTransform = getTransform(svg.attr('transform')),
      scaleX = svgTransform.a,
      scaleY = svgTransform.d,
      translateX = svgTransform.e,
      translateY = svgTransform.f,
      height = canvasSize.height / scaleY,
      width = canvasSize.width / scaleX
    ;

  // create the grid lines
  var horizontalLines = Math.ceil(height / this._options.gridSize);
  // remove previous lines
  if (_hLines){
    _hLines.remove();
  }
  _hLines = svg // draw horizontal lines
    .selectAll('.hline')
    .data(d3js.range(horizontalLines))
    .enter()
    .append('line')
    .attr('y1', function (d) {
      return d * that._options.gridSize + ((translateY * -1.0)/scaleY);
    })
    .attr('y2', function (d) {
      return d * that._options.gridSize + ((translateY * -1.0)/scaleY);
    })
    .attr('x1', (translateX * -1.0)/scaleX)
    .attr('x2', width+(translateX * -1.0)/scaleX)
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px')
    .attr('class', 'gridline');

  var verticalLines = Math.ceil(width / this._options.gridSize);
  // remove previous lines
  if (_vLines){
    _vLines.remove();
  }
  _vLines = svg // draw vertical lines
    .selectAll('.vline')
    .data(d3js.range(verticalLines))
    .enter()
    .append('line')
    .attr('x1', function (d) {
      return d * that._options.gridSize + ((translateX * -1.0)/scaleX);
    })
    .attr('x2', function (d) {
      return d * that._options.gridSize + ((translateX * -1.0)/scaleX);
    })
    .attr('y1', (translateY * -1.0)/scaleY)
    .attr('y2', height+(translateY * -1.0)/scaleY)
    .style('stroke', this._options.gridLinesColor)
    .style('stroke-width', this._options.gridLinesWidth + 'px')
    .attr('class', 'gridline');

};

function getTransform(transform) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function
  // returns.
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, 'transform', transform);

  return g.transform.baseVal.consolidate().matrix;
}