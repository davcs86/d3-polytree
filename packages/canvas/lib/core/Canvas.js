'use strict';

var isNumber = require('lodash/lang').isNumber,
    assign = require('lodash/object').assign,
    isEmpty = require('lodash/lang').isEmpty,
    isUndefined = require('lodash/lang').isUndefined,
    svgExportingUtils = require('./SvgExportingUtils');


var d3js = require('d3');

function ensurePx(number) {
  return isNumber(number) ? number + 'px' : number;
}

/**
 * Creates a HTML container element for a SVG element with
 * the given configuration
 *
 * @param  {Object} options
 * @return {HTMLElement} the container element
 */
function createContainer(options) {

  options = assign({}, { width: '100%', height: '100%' }, options);

  var container = options.container || document.body;

  // create a <div> around the svg element with the respective size
  // this way we can always get the correct container size
  // (this is impossible for <svg> elements at the moment)
  var parent = document.createElement('div');
  parent.setAttribute('class', 'pfdjs-container');

  assign(parent.style, {
    position: 'absolute',
    overflow: 'hidden',
    width: ensurePx(options.width),
    height: ensurePx(options.height)
  });

  container.appendChild(parent);

  return parent;
}

/**
 * The main drawing canvas.
 *
 * @class
 * @constructor
 *
 * @emits Canvas#canvas.init
 *
 * @param {Object} config
 * @param {EventEmitter} eventBus
 */
function Canvas(config, eventBus) {

  this._eventBus = eventBus;

  this._init(config || {});
}

Canvas.$inject = [ 'config', 'eventBus' ];

module.exports = Canvas;


Canvas.prototype._init = function(config) {

  var eventBus = this._eventBus,
      that = this;

  // Creates a <svg> element that is wrapped into a <div>.
  // This way we are always able to correctly figure out the size of the svg element
  // by querying the parent node.
  //
  // (It is not possible to get the size of a svg element cross browser @ 2014-04-01)
  //
  // <div class="djs-container" style="width: {desired-width}, height: {desired-height}">
  //   <svg width="100%" height="100%">
  //    ...
  //   </svg>
  // </div>

  // html container
  var container = this._container = createContainer(config),
      svg = this._drawingLayer = this._svg = d3js.select(container)
      .append('svg');

  svg
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('pointer-events', 'all');
  
  this._drawingLayer = this._rootLayer = svg
    .append('g')
    .attr('class', 'full-group');

  eventBus.on('d3canvas.init', function() {

    /**
     * An event indicating that the canvas is ready to be drawn on.
     *
     * @memberOf Canvas
     *
     * @event canvas.init
     *
     * @type {Object}
     * @property {SVGElement} svg the created svg element
     */
    eventBus.emit('canvas.init', {
      svg: svg
    });

    // fire this in order for certain components to check
    // if they need to be adjusted due the canvas size
    that.resized();

  });

  eventBus.on('d3canvas.destroy', function(){
    that._destroy.call(that);
  });
};

Canvas.prototype._destroy = function() {
  this._eventBus.emit('canvas.destroy', {
    svg: this._svg
  });

  var parent;

  if (this._container){
    parent = this._container.parentNode;
  }

  if (parent) {
    parent.removeChild(this._container);
  }

  delete this._svg;
  delete this._container;
};

/**
 * Returns the html element that encloses the
 * drawing canvas.
 *
 * @return {Selection}
 */
Canvas.prototype.getContainer = function() {
  return this._container;
};

/**
 * Returns the drawing canvas.
 *
 * @return {HTMLElement}
 */
Canvas.prototype.getSVG = function() {
  return this._svg;
};

/**
 * Returns the drawing canvas as string with styles embedded.
 *
 * @return {string}
 */
Canvas.prototype.getSVGStr = function() {
  return svgExportingUtils(this._svg.node());
};

/**
 * Returns the root layer.0
 *
 * @return {Selection}
 */
Canvas.prototype.getRootLayer = function() {
  return this._rootLayer;
};

/**
 * Returns the drawing layer.
 *
 * @return {Selection}
 */
Canvas.prototype.getDrawingLayer = function() {
  return this._drawingLayer;
};

/**
 * Sets the drawing layer.
 *
 */
Canvas.prototype.setDrawingLayer = function(drawingLayer) {
  this._drawingLayer = drawingLayer;
};

/**
 * Returns the transform matrix of an element or of the drawing layer.
 *
 * @return {Object}
 */
Canvas.prototype.getTransform = function(element) {
  if (isUndefined(element)){
    element = this._drawingLayer;
  }
  var transform = element.attr('transform');

  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function
  // returns.
  if (isEmpty(transform)){
    // return default transform
    return {
      // scale
      a: 1,
      d: 1,
      // translate
      e: 0,
      f: 0
    };
  } else {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, 'transform', transform);

    return g.transform.baseVal.consolidate().matrix;
  }
};

/**
 * Returns the size of the canvas
 *
 * @return {Object}
 */
Canvas.prototype.getSize = function() {
  return {
    width: this._container.clientWidth,
    height: this._container.clientHeight
  };
};

/**
 * Fires an event in order other modules can react to the
 * canvas resizing
 */
Canvas.prototype.resized = function() {
  this._eventBus.emit('canvas.resized');
};