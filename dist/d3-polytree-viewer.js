/*!
 * d3-polytree - d3-polytree-viewer v1.0.0

 * Copyright 2016 David Castillo
 *
 * Released under the MIT license
 * https://github.com/davcs86/d3-simple-networks/blob/master/LICENSE
 *
 * Source Code: https://github.com/davcs86/d3-simple-networks
 *
 * Date: 2016-09-05
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D3PolytreeViewer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_(2);

},{"2":2}],2:[function(_dereq_,module,exports){
'use strict';

var di = _dereq_(9);

/**
 * Bootstrap an injector from a list of modules, instantiating a number of default components
 *
 * @ignore
 * @param {Array<didi.Module>} bootstrapModules
 *
 * @return {didi.Injector} a injector to use to access the components
 */
function bootstrap(bootstrapModules) {

  var modules = [],
      components = [];

  function hasModule(m) {
    return modules.indexOf(m) >= 0;
  }

  function addModule(m) {
    modules.push(m);
  }

  function visit(m) {
    if (hasModule(m)) {
      return;
    }

    (m.__depends__ || []).forEach(visit);

    if (hasModule(m)) {
      return;
    }

    addModule(m);

    (m.__init__ || []).forEach(function (c) {
      components.push(c);
    });
  }

  bootstrapModules.forEach(visit);

  var injector = new di.Injector(modules);

  components.forEach(function (c) {

    try {
      // eagerly resolve component (fn or string)
      injector[typeof c === 'string' ? 'get' : 'invoke'](c);
    } catch (e) {
      console.error('Failed to instantiate component');
      console.error(e.stack);

      throw e;
    }
  });

  return injector;
}

/**
 * Creates an injector from passed options.
 *
 * @ignore
 * @param  {Object} options
 * @return {didi.Injector}
 */
function createInjector(options) {

  options = options || {};

  var configModule = {
    'config': ['value', options]
  };

  var coreModule = _dereq_(6);

  var modules = [configModule, coreModule].concat(options.modules || []);

  return bootstrap(modules);
}

/**
 * The main diagram-js entry point that bootstraps the diagram with the given
 * configuration.
 *
 * To register extensions with the diagram, pass them as Array<didi.Module> to the constructor.
 *
 * @class djs.D3Canvas
 * @memberOf djs
 * @constructor
 *
 * @example
 *
 * <caption>Creating a plug-in that logs whenever a shape is added to the canvas.</caption>
 *
 * // plug-in implemenentation
 * function MyLoggingPlugin(eventBus) {
 *   eventBus.on('shape.added', function(event) {
 *     console.log('shape ', event.shape, ' was added to the diagram');
 *   });
 * }
 *
 * // export as module
 * module.exports = {
 *   __init__: [ 'myLoggingPlugin' ],
 *     myLoggingPlugin: [ 'type', MyLoggingPlugin ]
 * };
 *
 *
 * // instantiate the diagram with the new plug-in
 *
 * var diagram = new Diagram({ modules: [ require('path-to-my-logging-plugin') ] });
 *
 * diagram.invoke([ 'canvas', function(canvas) {
 *   // add shape to drawing canvas
 *   canvas.addShape({ x: 10, y: 10 });
 * });
 *
 * // 'shape ... was added to the diagram' logged to console
 *
 * @param {Object} options
 * @param {Array<didi.Module>} [options.modules] external modules to instantiate with the diagram
 * @param {didi.Injector} [injector] an (optional) injector to bootstrap the diagram with
 */
function D3Canvas(options, injector) {

  // create injector unless explicitly specified
  this.injector = injector = injector || createInjector(options);

  // API

  /**
   * Resolves a diagram service
   *
   * @method D3Canvas#get
   *
   * @param {String} name the name of the diagram service to be retrieved
   * @param {Boolean} [strict=true] if false, resolve missing services to null
   */
  this.get = injector.get;

  /**
   * Executes a function into which diagram services are injected
   *
   * @method D3Canvas#invoke
   *
   * @param {Function|Object[]} fn the function to resolve
   * @param {Object} locals a number of locals to use to resolve certain dependencies
   */
  this.invoke = injector.invoke;

  // init

  // indicate via event


  /**
   * An event indicating that all plug-ins are loaded.
   *
   * Use this event to fire other events to interested plug-ins
   *
   * @memberOf D3Canvas
   *
   * @event diagram.init
   *
   * @example
   *
   * eventBus.on('diagram.init', function() {
   *   eventBus.fire('my-custom-event', { foo: 'BAR' });
   * });
   *
   * @type {Object}
   */
  this.get('eventBus').fire('d3canvas.init');
}

module.exports = D3Canvas;

/**
 * Destroys the D3Canvas
 *
 * @method  D3Canvas#destroy
 */
D3Canvas.prototype.destroy = function () {
  this.get('eventBus').fire('d3canvas.destroy');
};

/**
 * Clear the diagram, removing all contents.
 */
D3Canvas.prototype.clear = function () {
  this.get('eventBus').fire('d3canvas.clear');
};

},{"6":6,"9":9}],3:[function(_dereq_,module,exports){
'use strict';

var isNumber = _dereq_(307).isNumber,
    assign = _dereq_(319).assign,
    isEmpty = _dereq_(307).isEmpty /*,
                                             forEach = require('lodash/collection').forEach,
                                             every = require('lodash/collection').every,
                                             debounce = require('lodash/function').debounce*/;

// var Collections = require('../util/Collections'),
//   Elements = require('../util/Elements');

var d3js = _dereq_(4);

// function round(number, resolution) {
//   return Math.round(number * resolution) / resolution;
// }

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
  parent.setAttribute('class', 'djs-container');

  assign(parent.style, {
    position: 'absolute',
    overflow: 'hidden',
    width: ensurePx(options.width),
    height: ensurePx(options.height)
  });

  container.appendChild(parent);

  return parent;
}

// function createGroup(parent, cls) {
//   return parent.group().attr({ 'class' : cls });
// }
//
// var BASE_LAYER = 'base';
//
//
// var REQUIRED_MODEL_ATTRS = {
//   shape: [ 'x', 'y', 'width', 'height' ],
//   connection: [ 'waypoints' ]
// };

/**
 * The main drawing canvas.
 *
 * @class
 * @constructor
 *
 * @emits Canvas#canvas.init
 *
 * @param {Object} config
 * @param {EventBus} eventBus
 */
function Canvas(config, eventBus) {

  this._eventBus = eventBus;

  this._init(config || {});
}

Canvas.$inject = ['config', 'eventBus'];

module.exports = Canvas;

Canvas.prototype._init = function (config) {

  var eventBus = this._eventBus;

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
      svg = this._drawingLayer = this._svg = d3js.select(container).append('svg');

  svg.attr('fill', 'transparent').attr('width', '100%').attr('height', '100%').attr('pointer-events', 'all');

  // debounce canvas.viewbox.changed events
  // for smoother diagram interaction
  // if (config.deferUpdate !== false) {
  //   this._viewboxChanged = debounce(this._viewboxChanged, 300);
  // }

  eventBus.on('d3canvas.init', function () {

    /**
     * An event indicating that the canvas is ready to be drawn on.
     *
     * @memberOf Canvas
     *
     * @event canvas.init
     *
     * @type {Object}
     * @property {Snap<SVGSVGElement>} svg the created svg element
     */
    eventBus.fire('canvas.init', {
      svg: svg
    });

    // fire this in order for certain components to check
    // if they need to be adjusted due the canvas size
    this.resized();
  }, this);

  eventBus.on('d3canvas.destroy', 500, this._destroy, this);
  eventBus.on('d3canvas.clear', 500, this._clear, this);
};

Canvas.prototype._destroy = function (emit) {
  this._eventBus.fire('canvas.destroy', {
    svg: this._svg
  });

  var parent = this._container.parentNode;

  if (parent) {
    parent.removeChild(this._container);
  }

  delete this._svg;
  delete this._container;
};

Canvas.prototype._clear = function () {

  var self = this;

  //var allElements = this._elementRegistry.getAll();

  // remove all elements
  /*allElements.forEach(function(element) {
    var type = Elements.getType(element);
      if (type === 'root') {
      self.setRootElement(null, true);
    } else {
      self._removeElement(element, type);
    }
  });*/

  // force recomputation of view box
  //delete this._cachedViewbox;
};

/**
 * Returns the default layer on which
 * all elements are drawn.
 *
 * @returns {Snap<SVGGroup>}
 */
// Canvas.prototype.getDefaultLayer = function() {
//   return this.getLayer(BASE_LAYER);
// };

/**
 * Returns a layer that is used to draw elements
 * or annotations on it.
 *
 * @param  {String} name
 *
 * @returns {Snap<SVGGroup>}
 */
// Canvas.prototype.getLayer = function(name) {
//
//   if (!name) {
//     throw new Error('must specify a name');
//   }
//
//   var layer = this._layers[name];
//   if (!layer) {
//     layer = this._layers[name] = createGroup(this._viewport, 'layer-' + name);
//   }
//
//   return layer;
// };


/**
 * Returns the html element that encloses the
 * drawing canvas.
 *
 * @return {DOMNode}
 */
Canvas.prototype.getContainer = function () {
  return this._container;
};

/**
 * Returns the drawing canvas.
 *
 * @return {DOMNode}
 */
Canvas.prototype.getSVG = function () {
  return this._svg;
};

/**
 * Returns the drawing layer.
 *
 * @return {DOMNode}
 */
Canvas.prototype.getDrawingLayer = function () {
  return this._drawingLayer;
};

/**
 * Sets the drawing layer.
 *
 */
Canvas.prototype.setDrawingLayer = function (drawingLayer) {
  this._drawingLayer = drawingLayer;
};

/**
 * Returns the drawing layer's transform matrix.
 *
 * @return {Object}
 */
Canvas.prototype.getTransform = function () {
  var transform = this._drawingLayer.attr('transform');

  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function
  // returns.

  if (isEmpty(transform)) {
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

/////////////// markers ///////////////////////////////////

// Canvas.prototype._updateMarker = function(element, marker, add) {
//   var container;
//
//   if (!element.id) {
//     element = this._elementRegistry.get(element);
//   }
//
//   // we need to access all
//   container = this._elementRegistry._elements[element.id];
//
//   if (!container) {
//     return;
//   }
//
//   forEach([ container.gfx, container.secondaryGfx ], function(gfx) {
//     if (gfx) {
//       // invoke either addClass or removeClass based on mode
//       gfx[add ? 'addClass' : 'removeClass'](marker);
//     }
//   });
//
//   /**
//    * An event indicating that a marker has been updated for an element
//    *
//    * @event element.marker.update
//    * @type {Object}
//    * @property {djs.model.Element} element the shape
//    * @property {Object} gfx the graphical representation of the shape
//    * @property {String} marker
//    * @property {Boolean} add true if the marker was added, false if it got removed
//    */
//   this._eventBus.fire('element.marker.update', { element: element, gfx: container.gfx, marker: marker, add: !!add });
// };


/**
 * Adds a marker to an element (basically a css class).
 *
 * Fires the element.marker.update event, making it possible to
 * integrate extension into the marker life-cycle, too.
 *
 * @example
 * canvas.addMarker('foo', 'some-marker');
 *
 * var fooGfx = canvas.getGraphics('foo');
 *
 * fooGfx; // <g class="... some-marker"> ... </g>
 *
 * @param {String|djs.model.Base} element
 * @param {String} marker
 */
// Canvas.prototype.addMarker = function(element, marker) {
//   this._updateMarker(element, marker, true);
// };


/**
 * Remove a marker from an element.
 *
 * Fires the element.marker.update event, making it possible to
 * integrate extension into the marker life-cycle, too.
 *
 * @param  {String|djs.model.Base} element
 * @param  {String} marker
 */
// Canvas.prototype.removeMarker = function(element, marker) {
//   this._updateMarker(element, marker, false);
// };

/**
 * Check the existence of a marker on element.
 *
 * @param  {String|djs.model.Base} element
 * @param  {String} marker
 */
// Canvas.prototype.hasMarker = function(element, marker) {
//   if (!element.id) {
//     element = this._elementRegistry.get(element);
//   }
//
//   var gfx = this.getGraphics(element);
//
//   return gfx && gfx.hasClass(marker);
// };

/**
 * Toggles a marker on an element.
 *
 * Fires the element.marker.update event, making it possible to
 * integrate extension into the marker life-cycle, too.
 *
 * @param  {String|djs.model.Base} element
 * @param  {String} marker
 */
// Canvas.prototype.toggleMarker = function(element, marker) {
//   if (this.hasMarker(element, marker)) {
//     this.removeMarker(element, marker);
//   } else {
//     this.addMarker(element, marker);
//   }
// };

// Canvas.prototype.getRootElement = function() {
//   if (!this._rootElement) {
//     this.setRootElement({ id: '__implicitroot', children: [] });
//   }
//
//   return this._rootElement;
// };


//////////////// root element handling ///////////////////////////

/**
 * Sets a given element as the new root element for the canvas
 * and returns the new root element.
 *
 * @param {Object|djs.model.Root} element
 * @param {Boolean} [override] whether to override the current root element, if any
 *
 * @return {Object|djs.model.Root} new root element
 */
// Canvas.prototype.setRootElement = function(element, override) {
//
//   if (element) {
//     this._ensureValid('root', element);
//   }
//
//   var currentRoot = this._rootElement,
//     elementRegistry = this._elementRegistry,
//     eventBus = this._eventBus;
//
//   if (currentRoot) {
//     if (!override) {
//       throw new Error('rootElement already set, need to specify override');
//     }
//
//     // simulate element remove event sequence
//     eventBus.fire('root.remove', { element: currentRoot });
//     eventBus.fire('root.removed', { element: currentRoot });
//
//     elementRegistry.remove(currentRoot);
//   }
//
//   if (element) {
//     var gfx = this.getDefaultLayer();
//
//     // resemble element add event sequence
//     eventBus.fire('root.add', { element: element });
//
//     elementRegistry.add(element, gfx, this._svg);
//
//     eventBus.fire('root.added', { element: element, gfx: gfx });
//   }
//
//   this._rootElement = element;
//
//   return element;
// };


///////////// add functionality ///////////////////////////////

// Canvas.prototype._ensureValid = function(type, element) {
//   if (!element.id) {
//     throw new Error('element must have an id');
//   }
//
//   if (this._elementRegistry.get(element.id)) {
//     throw new Error('element with id ' + element.id + ' already exists');
//   }
//
//   var requiredAttrs = REQUIRED_MODEL_ATTRS[type];
//
//   var valid = every(requiredAttrs, function(attr) {
//     return typeof element[attr] !== 'undefined';
//   });
//
//   if (!valid) {
//     throw new Error(
//       'must supply { ' + requiredAttrs.join(', ') + ' } with ' + type);
//   }
// };

// Canvas.prototype._setParent = function(element, parent, parentIndex) {
//   Collections.add(parent.children, element, parentIndex);
//   element.parent = parent;
// };

/**
 * Adds an element to the canvas.
 *
 * This wires the parent <-> child relationship between the element and
 * a explicitly specified parent or an implicit root element.
 *
 * During add it emits the events
 *
 *  * <{type}.add> (element, parent)
 *  * <{type}.added> (element, gfx)
 *
 * Extensions may hook into these events to perform their magic.
 *
 * @param {String} type
 * @param {Object|djs.model.Base} element
 * @param {Object|djs.model.Base} [parent]
 * @param {Number} [parentIndex]
 *
 * @return {Object|djs.model.Base} the added element
 */
// Canvas.prototype._addElement = function(type, element, parent, parentIndex) {
//
//   parent = parent || this.getRootElement();
//
//   var eventBus = this._eventBus,
//     graphicsFactory = this._graphicsFactory;
//
//   this._ensureValid(type, element);
//
//   eventBus.fire(type + '.add', { element: element, parent: parent });
//
//   this._setParent(element, parent, parentIndex);
//
//   // create graphics
//   var gfx = graphicsFactory.create(type, element);
//
//   this._elementRegistry.add(element, gfx);
//
//   // update its visual
//   graphicsFactory.update(type, element, gfx);
//
//   eventBus.fire(type + '.added', { element: element, gfx: gfx });
//
//   return element;
// };

/**
 * Adds a shape to the canvas
 *
 * @param {Object|djs.model.Shape} shape to add to the diagram
 * @param {djs.model.Base} [parent]
 * @param {Number} [parentIndex]
 *
 * @return {djs.model.Shape} the added shape
 */
// Canvas.prototype.addShape = function(shape, parent, parentIndex) {
//   return this._addElement('shape', shape, parent, parentIndex);
// };

/**
 * Adds a connection to the canvas
 *
 * @param {Object|djs.model.Connection} connection to add to the diagram
 * @param {djs.model.Base} [parent]
 * @param {Number} [parentIndex]
 *
 * @return {djs.model.Connection} the added connection
 */
// Canvas.prototype.addConnection = function(connection, parent, parentIndex) {
//   return this._addElement('connection', connection, parent, parentIndex);
// };


/**
 * Internal remove element
 */
// Canvas.prototype._removeElement = function(element, type) {
//
//   var elementRegistry = this._elementRegistry,
//     graphicsFactory = this._graphicsFactory,
//     eventBus = this._eventBus;
//
//   element = elementRegistry.get(element.id || element);
//
//   if (!element) {
//     // element was removed already
//     return;
//   }
//
//   eventBus.fire(type + '.remove', { element: element });
//
//   graphicsFactory.remove(element);
//
//   // unset parent <-> child relationship
//   Collections.remove(element.parent && element.parent.children, element);
//   element.parent = null;
//
//   eventBus.fire(type + '.removed', { element: element });
//
//   elementRegistry.remove(element);
//
//   return element;
// };


/**
 * Removes a shape from the canvas
 *
 * @param {String|djs.model.Shape} shape or shape id to be removed
 *
 * @return {djs.model.Shape} the removed shape
 */
// Canvas.prototype.removeShape = function(shape) {
//
//   /**
//    * An event indicating that a shape is about to be removed from the canvas.
//    *
//    * @memberOf Canvas
//    *
//    * @event shape.remove
//    * @type {Object}
//    * @property {djs.model.Shape} element the shape descriptor
//    * @property {Object} gfx the graphical representation of the shape
//    */
//
//   /**
//    * An event indicating that a shape has been removed from the canvas.
//    *
//    * @memberOf Canvas
//    *
//    * @event shape.removed
//    * @type {Object}
//    * @property {djs.model.Shape} element the shape descriptor
//    * @property {Object} gfx the graphical representation of the shape
//    */
//   return this._removeElement(shape, 'shape');
// };


/**
 * Removes a connection from the canvas
 *
 * @param {String|djs.model.Connection} connection or connection id to be removed
 *
 * @return {djs.model.Connection} the removed connection
 */
// Canvas.prototype.removeConnection = function(connection) {
//
//   /**
//    * An event indicating that a connection is about to be removed from the canvas.
//    *
//    * @memberOf Canvas
//    *
//    * @event connection.remove
//    * @type {Object}
//    * @property {djs.model.Connection} element the connection descriptor
//    * @property {Object} gfx the graphical representation of the connection
//    */
//
//   /**
//    * An event indicating that a connection has been removed from the canvas.
//    *
//    * @memberOf Canvas
//    *
//    * @event connection.removed
//    * @type {Object}
//    * @property {djs.model.Connection} element the connection descriptor
//    * @property {Object} gfx the graphical representation of the connection
//    */
//   return this._removeElement(connection, 'connection');
// };


/**
 * Return the graphical object underlaying a certain diagram element
 *
 * @param {String|djs.model.Base} element descriptor of the element
 * @param {Boolean} [secondary=false] whether to return the secondary connected element
 *
 * @return {SVGElement}
 */
// Canvas.prototype.getGraphics = function(element, secondary) {
//   return this._elementRegistry.getGraphics(element, secondary);
// };


/**
 * Perform a viewbox update via a given change function.
 *
 * @param {Function} changeFn
 */
// Canvas.prototype._changeViewbox = function(changeFn) {
//
//   // notify others of the upcoming viewbox change
//   this._eventBus.fire('canvas.viewbox.changing');
//
//   // perform actual change
//   changeFn.apply(this);
//
//   // reset the cached viewbox so that
//   // a new get operation on viewbox or zoom
//   // triggers a viewbox re-computation
//   this._cachedViewbox = null;
//
//   // notify others of the change; this step
//   // may or may not be debounced
//   this._viewboxChanged();
// };
//
// Canvas.prototype._viewboxChanged = function() {
//   this._eventBus.fire('canvas.viewbox.changed', { viewbox: this.viewbox() });
// };


/**
 * Gets or sets the view box of the canvas, i.e. the
 * area that is currently displayed.
 *
 * The getter may return a cached viewbox (if it is currently
 * changing). To force a recomputation, pass `false` as the first argument.
 *
 * @example
 *
 * canvas.viewbox({ x: 100, y: 100, width: 500, height: 500 })
 *
 * // sets the visible area of the diagram to (100|100) -> (600|100)
 * // and and scales it according to the diagram width
 *
 * var viewbox = canvas.viewbox(); // pass `false` to force recomputing the box.
 *
 * console.log(viewbox);
 * // {
 * //   inner: Dimensions,
 * //   outer: Dimensions,
 * //   scale,
 * //   x, y,
 * //   width, height
 * // }
 *
 * @param  {Object} [box] the new view box to set
 * @param  {Number} box.x the top left X coordinate of the canvas visible in view box
 * @param  {Number} box.y the top left Y coordinate of the canvas visible in view box
 * @param  {Number} box.width the visible width
 * @param  {Number} box.height
 *
 * @return {Object} the current view box
 */
// Canvas.prototype.viewbox = function(box) {
//
//   if (box === undefined && this._cachedViewbox) {
//     return this._cachedViewbox;
//   }
//
//   var viewport = this._viewport,
//     innerBox,
//     outerBox = this.getSize(),
//     matrix,
//     scale,
//     x, y;
//
//   if (!box) {
//     // compute the inner box based on the
//     // diagrams default layer. This allows us to exclude
//     // external components, such as overlays
//     innerBox = this.getDefaultLayer().getBBox(true);
//
//     matrix = viewport.transform().localMatrix;
//     scale = round(matrix.a, 1000);
//
//     x = round(-matrix.e || 0, 1000);
//     y = round(-matrix.f || 0, 1000);
//
//     box = this._cachedViewbox = {
//       x: x ? x / scale : 0,
//       y: y ? y / scale : 0,
//       width: outerBox.width / scale,
//       height: outerBox.height / scale,
//       scale: scale,
//       inner: {
//         width: innerBox.width,
//         height: innerBox.height,
//         x: innerBox.x,
//         y: innerBox.y
//       },
//       outer: outerBox
//     };
//
//     return box;
//   } else {
//
//     this._changeViewbox(function() {
//       scale = Math.min(outerBox.width / box.width, outerBox.height / box.height);
//
//       matrix = new Snap.Matrix().scale(scale).translate(-box.x, -box.y);
//       viewport.transform(matrix);
//     });
//   }
//
//   return box;
// };


/**
 * Gets or sets the scroll of the canvas.
 *
 * @param {Object} [delta] the new scroll to apply.
 *
 * @param {Number} [delta.dx]
 * @param {Number} [delta.dy]
 */
// Canvas.prototype.scroll = function(delta) {
//
//   var node = this._viewport.node;
//   var matrix = node.getCTM();
//
//   if (delta) {
//     this._changeViewbox(function() {
//       delta = assign({ dx: 0, dy: 0 }, delta || {});
//
//       matrix = this._svg.node.createSVGMatrix().translate(delta.dx, delta.dy).multiply(matrix);
//
//       setCTM(node, matrix);
//     });
//   }
//
//   return { x: matrix.e, y: matrix.f };
// };


/**
 * Gets or sets the current zoom of the canvas, optionally zooming
 * to the specified position.
 *
 * The getter may return a cached zoom level. Call it with `false` as
 * the first argument to force recomputation of the current level.
 *
 * @param {String|Number} [newScale] the new zoom level, either a number, i.e. 0.9,
 *                                   or `fit-viewport` to adjust the size to fit the current viewport
 * @param {String|Point} [center] the reference point { x: .., y: ..} to zoom to, 'auto' to zoom into mid or null
 *
 * @return {Number} the current scale
 */
// Canvas.prototype.zoom = function(newScale, center) {
//
//   if (!newScale) {
//     return this.viewbox(newScale).scale;
//   }
//
//   if (newScale === 'fit-viewport') {
//     return this._fitViewport(center);
//   }
//
//   var outer,
//     matrix;
//
//   this._changeViewbox(function() {
//
//     if (typeof center !== 'object') {
//       outer = this.viewbox().outer;
//
//       center = {
//         x: outer.width / 2,
//         y: outer.height / 2
//       };
//     }
//
//     matrix = this._setZoom(newScale, center);
//   });
//
//   return round(matrix.a, 1000);
// };
//
// function setCTM(node, m) {
//   var mstr = 'matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + m.e + ',' + m.f + ')';
//   node.setAttribute('transform', mstr);
// }
//
// Canvas.prototype._fitViewport = function(center) {
//
//   var vbox = this.viewbox(),
//     outer = vbox.outer,
//     inner = vbox.inner,
//     newScale,
//     newViewbox;
//
//   // display the complete diagram without zooming in.
//   // instead of relying on internal zoom, we perform a
//   // hard reset on the canvas viewbox to realize this
//   //
//   // if diagram does not need to be zoomed in, we focus it around
//   // the diagram origin instead
//
//   if (inner.x >= 0 &&
//     inner.y >= 0 &&
//     inner.x + inner.width <= outer.width &&
//     inner.y + inner.height <= outer.height &&
//     !center) {
//
//     newViewbox = {
//       x: 0,
//       y: 0,
//       width: Math.max(inner.width + inner.x, outer.width),
//       height: Math.max(inner.height + inner.y, outer.height)
//     };
//   } else {
//
//     newScale = Math.min(1, outer.width / inner.width, outer.height / inner.height);
//     newViewbox = {
//       x: inner.x + (center ? inner.width / 2 - outer.width / newScale / 2 : 0),
//       y: inner.y + (center ? inner.height / 2 - outer.height / newScale / 2 : 0),
//       width: outer.width / newScale,
//       height: outer.height / newScale
//     };
//   }
//
//   this.viewbox(newViewbox);
//
//   return this.viewbox(false).scale;
// };
//
//
// Canvas.prototype._setZoom = function(scale, center) {
//
//   var svg = this._svg.node,
//     viewport = this._viewport.node;
//
//   var matrix = svg.createSVGMatrix();
//   var point = svg.createSVGPoint();
//
//   var centerPoint,
//     originalPoint,
//     currentMatrix,
//     scaleMatrix,
//     newMatrix;
//
//   currentMatrix = viewport.getCTM();
//
//
//   var currentScale = currentMatrix.a;
//
//   if (center) {
//     centerPoint = assign(point, center);
//
//     // revert applied viewport transformations
//     originalPoint = centerPoint.matrixTransform(currentMatrix.inverse());
//
//     // create scale matrix
//     scaleMatrix = matrix
//       .translate(originalPoint.x, originalPoint.y)
//       .scale(1 / currentScale * scale)
//       .translate(-originalPoint.x, -originalPoint.y);
//
//     newMatrix = currentMatrix.multiply(scaleMatrix);
//   } else {
//     newMatrix = matrix.scale(scale);
//   }
//
//   setCTM(this._viewport.node, newMatrix);
//
//   return newMatrix;
// };
//
//
/**
 * Returns the size of the canvas
 *
 * @return {Dimensions}
 */
Canvas.prototype.getSize = function () {
  return {
    width: this._container.clientWidth,
    height: this._container.clientHeight
  };
};
//
//
// /**
//  * Return the absolute bounding box for the given element
//  *
//  * The absolute bounding box may be used to display overlays in the
//  * callers (browser) coordinate system rather than the zoomed in/out
//  * canvas coordinates.
//  *
//  * @param  {ElementDescriptor} element
//  * @return {Bounds} the absolute bounding box
//  */
// Canvas.prototype.getAbsoluteBBox = function(element) {
//   var vbox = this.viewbox();
//   var bbox;
//
//   // connection
//   // use svg bbox
//   if (element.waypoints) {
//     var gfx = this.getGraphics(element);
//
//     var transformBBox = gfx.getBBox(true);
//     bbox = gfx.getBBox();
//
//     bbox.x -= transformBBox.x;
//     bbox.y -= transformBBox.y;
//
//     bbox.width += 2 * transformBBox.x;
//     bbox.height +=  2 * transformBBox.y;
//   }
//   // shapes
//   // use data
//   else {
//     bbox = element;
//   }
//
//   var x = bbox.x * vbox.scale - vbox.x * vbox.scale;
//   var y = bbox.y * vbox.scale - vbox.y * vbox.scale;
//
//   var width = bbox.width * vbox.scale;
//   var height = bbox.height * vbox.scale;
//
//   return {
//     x: x,
//     y: y,
//     width: width,
//     height: height
//   };
// };
//
/**
 * Fires an event in order other modules can react to the
 * canvas resizing
 */
Canvas.prototype.resized = function () {
  this._eventBus.fire('canvas.resized');
};

},{"307":307,"319":319,"4":4}],4:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _d3Selection = _dereq_(7);

Object.defineProperty(exports, "event", {
  enumerable: true,
  get: function get() {
    return _d3Selection.event;
  }
});
Object.defineProperty(exports, "select", {
  enumerable: true,
  get: function get() {
    return _d3Selection.select;
  }
});
Object.defineProperty(exports, "selectAll", {
  enumerable: true,
  get: function get() {
    return _d3Selection.selectAll;
  }
});

},{"7":7}],5:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var isFunction = _dereq_(307).isFunction,
    isArray = _dereq_(307).isArray,
    isNumber = _dereq_(307).isNumber,
    bind = _dereq_(256).bind,
    assign = _dereq_(319).assign;

var FN_REF = '__fn';

var DEFAULT_PRIORITY = 1000;

var slice = Array.prototype.slice;

/**
 * A general purpose event bus.
 *
 * 2016. BPMN.IO @ https://github.com/bpmn-io/diagram-js/blob/master/lib/core/EventBus.js
 *
 * This component is used to communicate across a diagram instance.
 * Other parts of a diagram can use it to listen to and broadcast events.
 *
 *
 * ## Registering for Events
 *
 * The event bus provides the {@link EventBus#on} and {@link EventBus#once}
 * methods to register for events. {@link EventBus#off} can be used to
 * remove event registrations. Listeners receive an instance of {@link Event}
 * as the first argument. It allows them to hook into the event execution.
 *
 * ```javascript
 *
 * // listen for event
 * eventBus.on('foo', function(event) {
 *
 *   // access event type
 *   event.type; // 'foo'
 *
 *   // stop propagation to other listeners
 *   event.stopPropagation();
 *
 *   // prevent event default
 *   event.preventDefault();
 * });
 *
 * // listen for event with custom payload
 * eventBus.on('bar', function(event, payload) {
 *   console.log(payload);
 * });
 *
 * // listen for event returning value
 * eventBus.on('foobar', function(event) {
 *
 *   // stop event propagation + prevent default
 *   return false;
 *
 *   // stop event propagation + return custom result
 *   return {
 *     complex: 'listening result'
 *   };
 * });
 *
 *
 * // listen with custom priority (default=1000, higher is better)
 * eventBus.on('priorityfoo', 1500, function(event) {
 *   console.log('invoked first!');
 * });
 *
 *
 * // listen for event and pass the context (`this`)
 * eventBus.on('foobar', function(event) {
 *   this.foo();
 * }, this);
 * ```
 *
 *
 * ## Emitting Events
 *
 * Events can be emitted via the event bus using {@link EventBus#fire}.
 *
 * ```javascript
 *
 * // false indicates that the default action
 * // was prevented by listeners
 * if (eventBus.fire('foo') === false) {
 *   console.log('default has been prevented!');
 * };
 *
 *
 * // custom args + return value listener
 * eventBus.on('sum', function(event, a, b) {
 *   return a + b;
 * });
 *
 * // you can pass custom arguments + retrieve result values.
 * var sum = eventBus.fire('sum', 1, 2);
 * console.log(sum); // 3
 * ```
 */
function EventBus() {
  this._listeners = {};

  // cleanup on destroy on lowest priority to allow
  // message passing until the bitter end
  this.on('diagram.destroy', 1, this._destroy, this);
}

module.exports = EventBus;

/**
 * Register an event listener for events with the given name.
 *
 * The callback will be invoked with `event, ...additionalArguments`
 * that have been passed to {@link EventBus#fire}.
 *
 * Returning false from a listener will prevent the events default action
 * (if any is specified). To stop an event from being processed further in
 * other listeners execute {@link Event#stopPropagation}.
 *
 * Returning anything but `undefined` from a listener will stop the listener propagation.
 *
 * @param {String|Array<String>} events
 * @param {Number} [priority=1000] the priority in which this listener is called, larger is higher
 * @param {Function} callback
 * @param {Object} [that] Pass context (`this`) to the callback
 */
EventBus.prototype.on = function (events, priority, callback, that) {

  events = isArray(events) ? events : [events];

  if (isFunction(priority)) {
    that = callback;
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var actualCallback = callback;

  if (that) {
    actualCallback = bind(callback, that);

    // make sure we remember and are able to remove
    // bound callbacks via {@link #off} using the original
    // callback
    actualCallback[FN_REF] = callback[FN_REF] || callback;
  }

  var self = this,
      listener = { priority: priority, callback: actualCallback };

  events.forEach(function (e) {
    self._addListener(e, listener);
  });
};

/**
 * Register an event listener that is executed only once.
 *
 * @param {String} event the event name to register for
 * @param {Function} callback the callback to execute
 * @param {Object} [that] Pass context (`this`) to the callback
 */
EventBus.prototype.once = function (event, priority, callback, that) {
  var self = this;

  if (isFunction(priority)) {
    that = callback;
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  function wrappedCallback() {
    self.off(event, wrappedCallback);
    return callback.apply(that, arguments);
  }

  // make sure we remember and are able to remove
  // bound callbacks via {@link #off} using the original
  // callback
  wrappedCallback[FN_REF] = callback;

  this.on(event, priority, wrappedCallback);
};

/**
 * Removes event listeners by event and callback.
 *
 * If no callback is given, all listeners for a given event name are being removed.
 *
 * @param {String} event
 * @param {Function} [callback]
 */
EventBus.prototype.off = function (event, callback) {
  var listeners = this._getListeners(event),
      listener,
      listenerCallback,
      idx;

  if (callback) {

    // move through listeners from back to front
    // and remove matching listeners
    for (idx = listeners.length - 1; listener = listeners[idx]; idx--) {
      listenerCallback = listener.callback;

      if (listenerCallback === callback || listenerCallback[FN_REF] === callback) {
        listeners.splice(idx, 1);
      }
    }
  } else {
    // clear listeners
    listeners.length = 0;
  }
};

/**
 * Fires a named event.
 *
 * @example
 *
 * // fire event by name
 * events.fire('foo');
 *
 * // fire event object with nested type
 * var event = { type: 'foo' };
 * events.fire(event);
 *
 * // fire event with explicit type
 * var event = { x: 10, y: 20 };
 * events.fire('element.moved', event);
 *
 * // pass additional arguments to the event
 * events.on('foo', function(event, bar) {
 *   alert(bar);
 * });
 *
 * events.fire({ type: 'foo' }, 'I am bar!');
 *
 * @param {String} [name] the optional event name
 * @param {Object} [event] the event object
 * @param {...Object} additional arguments to be passed to the callback functions
 *
 * @return {Boolean} the events return value, if specified or false if the
 *                   default action was prevented by listeners
 */
EventBus.prototype.fire = function (type, data) {

  var event, listeners, returnValue, args;

  args = slice.call(arguments);

  if ((typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'object') {
    event = type;
    type = event.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  listeners = this._listeners[type];

  if (!listeners) {
    return;
  }

  // we make sure we fire instances of our home made
  // events here. We wrap them only once, though
  if (data instanceof Event) {
    // we are fine, we alread have an event
    event = data;
  } else {
    event = new Event();
    event.init(data);
  }

  // ensure we pass the event as the first parameter
  args[0] = event;

  // original event type (in case we delegate)
  var originalType = event.type;

  // update event type before delegation
  if (type !== originalType) {
    event.type = type;
  }

  try {
    returnValue = this._invokeListeners(event, args, listeners);
  } finally {
    // reset event type after delegation
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  // set the return value to false if the event default
  // got prevented and no other return value exists
  if (returnValue === undefined && event.defaultPrevented) {
    returnValue = false;
  }

  return returnValue;
};

EventBus.prototype.handleError = function (error) {
  return this.fire('error', { error: error }) === false;
};

EventBus.prototype._destroy = function () {
  this._listeners = {};
};

EventBus.prototype._invokeListeners = function (event, args, listeners) {

  var idx, listener, returnValue;

  for (idx = 0; listener = listeners[idx]; idx++) {

    // handle stopped propagation
    if (event.cancelBubble) {
      break;
    }

    returnValue = this._invokeListener(event, args, listener);
  }

  return returnValue;
};

EventBus.prototype._invokeListener = function (event, args, listener) {

  var returnValue;

  try {
    // returning false prevents the default action
    returnValue = invokeFunction(listener.callback, args);

    // stop propagation on return value
    if (returnValue !== undefined) {
      event.returnValue = returnValue;
      event.stopPropagation();
    }

    // prevent default on return false
    if (returnValue === false) {
      event.preventDefault();
    }
  } catch (e) {
    if (!this.handleError(e)) {
      console.error('unhandled error in event listener');
      console.error(e.stack);

      throw e;
    }
  }

  return returnValue;
};

/*
 * Add new listener with a certain priority to the list
 * of listeners (for the given event).
 *
 * The semantics of listener registration / listener execution are
 * first register, first serve: New listeners will always be inserted
 * after existing listeners with the same priority.
 *
 * Example: Inserting two listeners with priority 1000 and 1300
 *
 *    * before: [ 1500, 1500, 1000, 1000 ]
 *    * after: [ 1500, 1500, (new=1300), 1000, 1000, (new=1000) ]
 *
 * @param {String} event
 * @param {Object} listener { priority, callback }
 */
EventBus.prototype._addListener = function (event, newListener) {

  var listeners = this._getListeners(event),
      existingListener,
      idx;

  // ensure we order listeners by priority from
  // 0 (high) to n > 0 (low)
  for (idx = 0; existingListener = listeners[idx]; idx++) {
    if (existingListener.priority < newListener.priority) {

      // prepend newListener at before existingListener
      listeners.splice(idx, 0, newListener);
      return;
    }
  }

  listeners.push(newListener);
};

EventBus.prototype._getListeners = function (name) {
  var listeners = this._listeners[name];

  if (!listeners) {
    this._listeners[name] = listeners = [];
  }

  return listeners;
};

/**
 * A event that is emitted via the event bus.
 */
function Event() {}

module.exports.Event = Event;

Event.prototype.stopPropagation = function () {
  this.cancelBubble = true;
};

Event.prototype.preventDefault = function () {
  this.defaultPrevented = true;
};

Event.prototype.init = function (data) {
  assign(this, data || {});
};

/**
 * Invoke function. Be fast...
 *
 * @param {Function} fn
 * @param {Array<Object>} args
 *
 * @return {Any}
 */
function invokeFunction(fn, args) {
  return fn.apply(null, args);
}

},{"256":256,"307":307,"319":319}],6:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  //__depends__: [ require('../draw') ],
  __init__: ['canvas'],
  canvas: ['type', _dereq_(3)],
  eventBus: ['type', _dereq_(5)]
};

},{"3":3,"5":5}],7:[function(_dereq_,module,exports){
// https://d3js.org/d3-selection/ Version 1.0.2. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  var nextId = 0;

  function local() {
    return new Local;
  }

  function Local() {
    this._ = "@" + (++nextId).toString(36);
  }

  Local.prototype = local.prototype = {
    constructor: Local,
    get: function(node) {
      var id = this._;
      while (!(id in node)) if (!(node = node.parentNode)) return;
      return node[id];
    },
    set: function(node, value) {
      return node[this._] = value;
    },
    remove: function(node) {
      return this._ in node && delete node[this._];
    },
    toString: function() {
      return this._;
    }
  };

  var matcher = function(selector) {
    return function() {
      return this.matches(selector);
    };
  };

  if (typeof document !== "undefined") {
    var element = document.documentElement;
    if (!element.matches) {
      var vendorMatches = element.webkitMatchesSelector
          || element.msMatchesSelector
          || element.mozMatchesSelector
          || element.oMatchesSelector;
      matcher = function(selector) {
        return function() {
          return vendorMatches.call(this, selector);
        };
      };
    }
  }

  var matcher$1 = matcher;

  var filterEvents = {};

  exports.event = null;

  if (typeof document !== "undefined") {
    var element$1 = document.documentElement;
    if (!("onmouseenter" in element$1)) {
      filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function(event1) {
      var event0 = exports.event; // Events can be reentrant (e.g., focus).
      exports.event = event1;
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
        exports.event = event0;
      }
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function customEvent(event1, listener, that, args) {
    var event0 = exports.event;
    event1.sourceEvent = exports.event;
    exports.event = event1;
    try {
      return listener.apply(that, args);
    } finally {
      exports.event = event0;
    }
  }

  function sourceEvent() {
    var current = exports.event, source;
    while (source = current.sourceEvent) current = source;
    return current;
  }

  function point(node, event) {
    var svg = node.ownerSVGElement || node;

    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }

    var rect = node.getBoundingClientRect();
    return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
  }

  function mouse(node) {
    var event = sourceEvent();
    if (event.changedTouches) event = event.changedTouches[0];
    return point(node, event);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher$1(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix = "$"; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_merge(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    var node;
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : defaultView(node = this.node())
            .getComputedStyle(node, null)
            .getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (event) {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection([[document.documentElement]], root);
  }

  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  function selectAll(selector) {
    return typeof selector === "string"
        ? new Selection([document.querySelectorAll(selector)], [document.documentElement])
        : new Selection([selector == null ? [] : selector], root);
  }

  function touch(node, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

    for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return point(node, touch);
      }
    }

    return null;
  }

  function touches(node, touches) {
    if (touches == null) touches = sourceEvent().touches;

    for (var i = 0, n = touches ? touches.length : 0, points = new Array(n); i < n; ++i) {
      points[i] = point(node, touches[i]);
    }

    return points;
  }

  exports.creator = creator;
  exports.local = local;
  exports.matcher = matcher$1;
  exports.mouse = mouse;
  exports.namespace = namespace;
  exports.namespaces = namespaces;
  exports.select = select;
  exports.selectAll = selectAll;
  exports.selection = selection;
  exports.selector = selector;
  exports.selectorAll = selectorAll;
  exports.touch = touch;
  exports.touches = touches;
  exports.window = defaultView;
  exports.customEvent = customEvent;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],8:[function(_dereq_,module,exports){

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var annotate = function() {
  var args = Array.prototype.slice.call(arguments);
  
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  var fn = args.pop();

  fn.$inject = args;

  return fn;
};


// Current limitations:
// - can't put into "function arg" comments
// function /* (no parenthesis like this) */ (){}
// function abc( /* xx (no parenthesis like this) */ a, b) {}
//
// Just put the comment before function or inside:
// /* (((this is fine))) */ function(a, b) {}
// function abc(a) { /* (((this is fine))) */}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG = /\/\*([^\*]*)\*\//m;

var parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(FN_ARGS);
  return match[1] && match[1].split(',').map(function(arg) {
    match = arg.match(FN_ARG);
    return match ? match[1].trim() : arg.trim();
  }) || [];
};


exports.annotate = annotate;
exports.parse = parse;
exports.isArray = isArray;

},{}],9:[function(_dereq_,module,exports){
module.exports = {
  annotate: _dereq_(8).annotate,
  Module: _dereq_(11),
  Injector: _dereq_(10)
};

},{"10":10,"11":11,"8":8}],10:[function(_dereq_,module,exports){
var Module = _dereq_(11);
var autoAnnotate = _dereq_(8).parse;
var annotate = _dereq_(8).annotate;
var isArray = _dereq_(8).isArray;


var Injector = function(modules, parent) {
  parent = parent || {
    get: function(name, strict) {
      currentlyResolving.push(name);

      if (strict === false) {
        return null;
      } else {
        throw error('No provider for "' + name + '"!');
      }
    }
  };

  var currentlyResolving = [];
  var providers = this._providers = Object.create(parent._providers || null);
  var instances = this._instances = Object.create(null);

  var self = instances.injector = this;

  var error = function(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  };

  /**
   * Return a named service.
   *
   * @param {String} name
   * @param {Boolean} [strict=true] if false, resolve missing services to null
   *
   * @return {Object}
   */
  var get = function(name, strict) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = get(parts.shift());

      while(parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (Object.hasOwnProperty.call(instances, name)) {
      return instances[name];
    }

    if (Object.hasOwnProperty.call(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      instances[name] = providers[name][0](providers[name][1]);
      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name, strict);
  };

  var instantiate = function(Type) {
    var instance = Object.create(Type.prototype);
    var returned = invoke(Type, instance);

    return typeof returned === 'object' ? returned : instance;
  };

  var invoke = function(fn, context) {
    if (typeof fn !== 'function') {
      if (isArray(fn)) {
        fn = annotate(fn.slice());
      } else {
        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
      }
    }

    var inject = fn.$inject && fn.$inject || autoAnnotate(fn);
    var dependencies = inject.map(function(dep) {
      return get(dep);
    });

    // TODO(vojta): optimize without apply
    return fn.apply(context, dependencies);
  };


  var createPrivateInjectorFactory = function(privateChildInjector) {
    return annotate(function(key) {
      return privateChildInjector.get(key);
    });
  };

  var createChild = function(modules, forceNewInstances) {
    if (forceNewInstances && forceNewInstances.length) {
      var fromParentModule = Object.create(null);
      var matchedScopes = Object.create(null);

      var privateInjectorsCache = [];
      var privateChildInjectors = [];
      var privateChildFactories = [];

      var provider;
      var cacheIdx;
      var privateChildInjector;
      var privateChildInjectorFactory;
      for (var name in providers) {
        provider = providers[name];

        if (forceNewInstances.indexOf(name) !== -1) {
          if (provider[2] === 'private') {
            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
            if (cacheIdx === -1) {
              privateChildInjector = provider[3].createChild([], forceNewInstances);
              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
              privateInjectorsCache.push(provider[3]);
              privateChildInjectors.push(privateChildInjector);
              privateChildFactories.push(privateChildInjectorFactory);
              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
            } else {
              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
            }
          } else {
            fromParentModule[name] = [provider[2], provider[1]];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          /*jshint -W083 */
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [provider[2], provider[1]];
              matchedScopes[scope] = true;
            }
          });
        }
      }

      forceNewInstances.forEach(function(scope) {
        if (!matchedScopes[scope]) {
          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
        }
      });

      modules.unshift(fromParentModule);
    }

    return new Injector(modules, self);
  };

  var factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  modules.forEach(function(module) {

    function arrayUnwrap(type, value) {
      if (type !== 'value' && isArray(value)) {
        value = annotate(value.slice());
      }

      return value;
    }

    // TODO(vojta): handle wrong inputs (modules)
    if (module instanceof Module) {
      module.forEach(function(provider) {
        var name = provider[0];
        var type = provider[1];
        var value = provider[2];

        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
      });
    } else if (typeof module === 'object') {
      if (module.__exports__) {
        var clonedModule = Object.keys(module).reduce(function(m, key) {
          if (key.substring(0, 2) !== '__') {
            m[key] = module[key];
          }
          return m;
        }, Object.create(null));

        var privateInjector = new Injector((module.__modules__ || []).concat([clonedModule]), self);
        var getFromPrivateInjector = annotate(function(key) {
          return privateInjector.get(key);
        });
        module.__exports__.forEach(function(key) {
          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
        });
      } else {
        Object.keys(module).forEach(function(name) {
          if (module[name][2] === 'private') {
            providers[name] = module[name];
            return;
          }

          var type = module[name][0];
          var value = module[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
};

module.exports = Injector;

},{"11":11,"8":8}],11:[function(_dereq_,module,exports){
var Module = function() {
  var providers = [];

  this.factory = function(name, factory) {
    providers.push([name, 'factory', factory]);
    return this;
  };

  this.value = function(name, value) {
    providers.push([name, 'value', value]);
    return this;
  };

  this.type = function(name, type) {
    providers.push([name, 'type', type]);
    return this;
  };

  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };
};

module.exports = Module;

},{}],12:[function(_dereq_,module,exports){
var getNative = _dereq_(146),
    root = _dereq_(200);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;

},{"146":146,"200":200}],13:[function(_dereq_,module,exports){
var hashClear = _dereq_(155),
    hashDelete = _dereq_(156),
    hashGet = _dereq_(157),
    hashHas = _dereq_(158),
    hashSet = _dereq_(159);

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"155":155,"156":156,"157":157,"158":158,"159":159}],14:[function(_dereq_,module,exports){
var baseCreate = _dereq_(48),
    baseLodash = _dereq_(82);

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
 *
 * @private
 * @constructor
 * @param {*} value The value to wrap.
 */
function LazyWrapper(value) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__dir__ = 1;
  this.__filtered__ = false;
  this.__iteratees__ = [];
  this.__takeCount__ = MAX_ARRAY_LENGTH;
  this.__views__ = [];
}

// Ensure `LazyWrapper` is an instance of `baseLodash`.
LazyWrapper.prototype = baseCreate(baseLodash.prototype);
LazyWrapper.prototype.constructor = LazyWrapper;

module.exports = LazyWrapper;

},{"48":48,"82":82}],15:[function(_dereq_,module,exports){
var listCacheClear = _dereq_(176),
    listCacheDelete = _dereq_(177),
    listCacheGet = _dereq_(178),
    listCacheHas = _dereq_(179),
    listCacheSet = _dereq_(180);

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"176":176,"177":177,"178":178,"179":179,"180":180}],16:[function(_dereq_,module,exports){
var baseCreate = _dereq_(48),
    baseLodash = _dereq_(82);

/**
 * The base constructor for creating `lodash` wrapper objects.
 *
 * @private
 * @param {*} value The value to wrap.
 * @param {boolean} [chainAll] Enable explicit method chain sequences.
 */
function LodashWrapper(value, chainAll) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__chain__ = !!chainAll;
  this.__index__ = 0;
  this.__values__ = undefined;
}

LodashWrapper.prototype = baseCreate(baseLodash.prototype);
LodashWrapper.prototype.constructor = LodashWrapper;

module.exports = LodashWrapper;

},{"48":48,"82":82}],17:[function(_dereq_,module,exports){
var getNative = _dereq_(146),
    root = _dereq_(200);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"146":146,"200":200}],18:[function(_dereq_,module,exports){
var mapCacheClear = _dereq_(181),
    mapCacheDelete = _dereq_(182),
    mapCacheGet = _dereq_(183),
    mapCacheHas = _dereq_(184),
    mapCacheSet = _dereq_(185);

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"181":181,"182":182,"183":183,"184":184,"185":185}],19:[function(_dereq_,module,exports){
var getNative = _dereq_(146),
    root = _dereq_(200);

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;

},{"146":146,"200":200}],20:[function(_dereq_,module,exports){
var getNative = _dereq_(146),
    root = _dereq_(200);

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;

},{"146":146,"200":200}],21:[function(_dereq_,module,exports){
var MapCache = _dereq_(18),
    setCacheAdd = _dereq_(201),
    setCacheHas = _dereq_(202);

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

module.exports = SetCache;

},{"18":18,"201":201,"202":202}],22:[function(_dereq_,module,exports){
var ListCache = _dereq_(15),
    stackClear = _dereq_(207),
    stackDelete = _dereq_(208),
    stackGet = _dereq_(209),
    stackHas = _dereq_(210),
    stackSet = _dereq_(211);

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  this.__data__ = new ListCache(entries);
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;

},{"15":15,"207":207,"208":208,"209":209,"210":210,"211":211}],23:[function(_dereq_,module,exports){
var root = _dereq_(200);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"200":200}],24:[function(_dereq_,module,exports){
var root = _dereq_(200);

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;

},{"200":200}],25:[function(_dereq_,module,exports){
var getNative = _dereq_(146),
    root = _dereq_(200);

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;

},{"146":146,"200":200}],26:[function(_dereq_,module,exports){
/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

module.exports = addMapEntry;

},{}],27:[function(_dereq_,module,exports){
/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set.add(value);
  return set;
}

module.exports = addSetEntry;

},{}],28:[function(_dereq_,module,exports){
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],29:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],30:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array ? array.length : 0,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],31:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(65);

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

module.exports = arrayIncludes;

},{"65":65}],32:[function(_dereq_,module,exports){
/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

module.exports = arrayIncludesWith;

},{}],33:[function(_dereq_,module,exports){
var baseTimes = _dereq_(96),
    isArguments = _dereq_(268),
    isArray = _dereq_(269),
    isIndex = _dereq_(166);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;

},{"166":166,"268":268,"269":269,"96":96}],34:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],35:[function(_dereq_,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],36:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],37:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],38:[function(_dereq_,module,exports){
/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

module.exports = asciiToArray;

},{}],39:[function(_dereq_,module,exports){
var eq = _dereq_(246);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used by `_.defaults` to customize its `_.assignIn` use.
 *
 * @private
 * @param {*} objValue The destination value.
 * @param {*} srcValue The source value.
 * @param {string} key The key of the property to assign.
 * @param {Object} object The parent object of `objValue`.
 * @returns {*} Returns the value to assign.
 */
function assignInDefaults(objValue, srcValue, key, object) {
  if (objValue === undefined ||
      (eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key))) {
    return srcValue;
  }
  return objValue;
}

module.exports = assignInDefaults;

},{"246":246}],40:[function(_dereq_,module,exports){
var eq = _dereq_(246);

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (typeof key == 'number' && value === undefined && !(key in object))) {
    object[key] = value;
  }
}

module.exports = assignMergeValue;

},{"246":246}],41:[function(_dereq_,module,exports){
var eq = _dereq_(246);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    object[key] = value;
  }
}

module.exports = assignValue;

},{"246":246}],42:[function(_dereq_,module,exports){
var eq = _dereq_(246);

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"246":246}],43:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    keys = _dereq_(305);

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

module.exports = baseAssign;

},{"118":118,"305":305}],44:[function(_dereq_,module,exports){
var get = _dereq_(259);

/**
 * The base implementation of `_.at` without support for individual paths.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {string[]} paths The property paths of elements to pick.
 * @returns {Array} Returns the picked elements.
 */
function baseAt(object, paths) {
  var index = -1,
      isNil = object == null,
      length = paths.length,
      result = Array(length);

  while (++index < length) {
    result[index] = isNil ? undefined : get(object, paths[index]);
  }
  return result;
}

module.exports = baseAt;

},{"259":259}],45:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.clamp` which doesn't coerce arguments.
 *
 * @private
 * @param {number} number The number to clamp.
 * @param {number} [lower] The lower bound.
 * @param {number} upper The upper bound.
 * @returns {number} Returns the clamped number.
 */
function baseClamp(number, lower, upper) {
  if (number === number) {
    if (upper !== undefined) {
      number = number <= upper ? number : upper;
    }
    if (lower !== undefined) {
      number = number >= lower ? number : lower;
    }
  }
  return number;
}

module.exports = baseClamp;

},{}],46:[function(_dereq_,module,exports){
var Stack = _dereq_(22),
    arrayEach = _dereq_(29),
    assignValue = _dereq_(41),
    baseAssign = _dereq_(43),
    cloneBuffer = _dereq_(108),
    copyArray = _dereq_(117),
    copySymbols = _dereq_(119),
    getAllKeys = _dereq_(139),
    getTag = _dereq_(150),
    initCloneArray = _dereq_(160),
    initCloneByTag = _dereq_(161),
    initCloneObject = _dereq_(162),
    isArray = _dereq_(269),
    isBuffer = _dereq_(274),
    isHostObject = _dereq_(165),
    isObject = _dereq_(293),
    keys = _dereq_(305);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {boolean} [isFull] Specify a clone including symbols.
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      if (isHostObject(value)) {
        return object ? value : {};
      }
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys(value);
  }
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;

},{"108":108,"117":117,"119":119,"139":139,"150":150,"160":160,"161":161,"162":162,"165":165,"22":22,"269":269,"274":274,"29":29,"293":293,"305":305,"41":41,"43":43}],47:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.conformsTo` which accepts `props` to check.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property predicates to conform to.
 * @returns {boolean} Returns `true` if `object` conforms, else `false`.
 */
function baseConformsTo(object, source, props) {
  var length = props.length;
  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (length--) {
    var key = props[length],
        predicate = source[key],
        value = object[key];

    if ((value === undefined && !(key in object)) || !predicate(value)) {
      return false;
    }
  }
  return true;
}

module.exports = baseConformsTo;

},{}],48:[function(_dereq_,module,exports){
var isObject = _dereq_(293);

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(proto) {
  return isObject(proto) ? objectCreate(proto) : {};
}

module.exports = baseCreate;

},{"293":293}],49:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * The base implementation of `_.delay` and `_.defer` which accepts `args`
 * to provide to `func`.
 *
 * @private
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {Array} args The arguments to provide to `func`.
 * @returns {number|Object} Returns the timer id or timeout object.
 */
function baseDelay(func, wait, args) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return setTimeout(function() { func.apply(undefined, args); }, wait);
}

module.exports = baseDelay;

},{}],50:[function(_dereq_,module,exports){
var SetCache = _dereq_(21),
    arrayIncludes = _dereq_(31),
    arrayIncludesWith = _dereq_(32),
    arrayMap = _dereq_(34),
    baseUnary = _dereq_(99),
    cacheHas = _dereq_(103);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap(values, baseUnary(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  }
  else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"103":103,"21":21,"31":31,"32":32,"34":34,"99":99}],51:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],52:[function(_dereq_,module,exports){
/**
 * The base implementation of methods like `_.findKey` and `_.findLastKey`,
 * without support for iteratee shorthands, which iterates over `collection`
 * using `eachFunc`.
 *
 * @private
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFindKey(collection, predicate, eachFunc) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = key;
      return false;
    }
  });
  return result;
}

module.exports = baseFindKey;

},{}],53:[function(_dereq_,module,exports){
var arrayPush = _dereq_(35),
    isFlattenable = _dereq_(164);

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"164":164,"35":35}],54:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(123);

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"123":123}],55:[function(_dereq_,module,exports){
var baseFor = _dereq_(54),
    keys = _dereq_(305);

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"305":305,"54":54}],56:[function(_dereq_,module,exports){
var baseForRight = _dereq_(57),
    keys = _dereq_(305);

/**
 * The base implementation of `_.forOwnRight` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwnRight(object, iteratee) {
  return object && baseForRight(object, iteratee, keys);
}

module.exports = baseForOwnRight;

},{"305":305,"57":57}],57:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(123);

/**
 * This function is like `baseFor` except that it iterates over properties
 * in the opposite order.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseForRight = createBaseFor(true);

module.exports = baseForRight;

},{"123":123}],58:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(30),
    isFunction = _dereq_(282);

/**
 * The base implementation of `_.functions` which creates an array of
 * `object` function property names filtered from `props`.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} props The property names to filter.
 * @returns {Array} Returns the function names.
 */
function baseFunctions(object, props) {
  return arrayFilter(props, function(key) {
    return isFunction(object[key]);
  });
}

module.exports = baseFunctions;

},{"282":282,"30":30}],59:[function(_dereq_,module,exports){
var castPath = _dereq_(105),
    isKey = _dereq_(168),
    toKey = _dereq_(214);

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"105":105,"168":168,"214":214}],60:[function(_dereq_,module,exports){
var arrayPush = _dereq_(35),
    isArray = _dereq_(269);

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

},{"269":269,"35":35}],61:[function(_dereq_,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString.call(value);
}

module.exports = baseGetTag;

},{}],62:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.gt` which doesn't coerce arguments.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is greater than `other`,
 *  else `false`.
 */
function baseGt(value, other) {
  return value > other;
}

module.exports = baseGt;

},{}],63:[function(_dereq_,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object, key) {
  return object != null && hasOwnProperty.call(object, key);
}

module.exports = baseHas;

},{}],64:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

module.exports = baseHasIn;

},{}],65:[function(_dereq_,module,exports){
var baseFindIndex = _dereq_(51),
    baseIsNaN = _dereq_(74);

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"51":51,"74":74}],66:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(55);

/**
 * The base implementation of `_.invert` and `_.invertBy` which inverts
 * `object` with values transformed by `iteratee` and set by `setter`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform values.
 * @param {Object} accumulator The initial inverted object.
 * @returns {Function} Returns `accumulator`.
 */
function baseInverter(object, setter, iteratee, accumulator) {
  baseForOwn(object, function(value, key, object) {
    setter(accumulator, iteratee(value), key, object);
  });
  return accumulator;
}

module.exports = baseInverter;

},{"55":55}],67:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    castPath = _dereq_(105),
    isKey = _dereq_(168),
    last = _dereq_(308),
    parent = _dereq_(196),
    toKey = _dereq_(214);

/**
 * The base implementation of `_.invoke` without support for individual
 * method arguments.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the method to invoke.
 * @param {Array} args The arguments to invoke the method with.
 * @returns {*} Returns the result of the invoked method.
 */
function baseInvoke(object, path, args) {
  if (!isKey(path, object)) {
    path = castPath(path);
    object = parent(object, path);
    path = last(path);
  }
  var func = object == null ? object : object[toKey(path)];
  return func == null ? undefined : apply(func, object, args);
}

module.exports = baseInvoke;

},{"105":105,"168":168,"196":196,"214":214,"28":28,"308":308}],68:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

var arrayBufferTag = '[object ArrayBuffer]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `_.isArrayBuffer` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
 */
function baseIsArrayBuffer(value) {
  return isObjectLike(value) && objectToString.call(value) == arrayBufferTag;
}

module.exports = baseIsArrayBuffer;

},{"294":294}],69:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var dateTag = '[object Date]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `_.isDate` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 */
function baseIsDate(value) {
  return isObjectLike(value) && objectToString.call(value) == dateTag;
}

module.exports = baseIsDate;

},{"294":294}],70:[function(_dereq_,module,exports){
var baseIsEqualDeep = _dereq_(71),
    isObject = _dereq_(293),
    isObjectLike = _dereq_(294);

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {boolean} [bitmask] The bitmask of comparison flags.
 *  The bitmask may be composed of the following flags:
 *     1 - Unordered comparison
 *     2 - Partial comparison
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, bitmask, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
}

module.exports = baseIsEqual;

},{"293":293,"294":294,"71":71}],71:[function(_dereq_,module,exports){
var Stack = _dereq_(22),
    equalArrays = _dereq_(135),
    equalByTag = _dereq_(136),
    equalObjects = _dereq_(137),
    getTag = _dereq_(150),
    isArray = _dereq_(269),
    isHostObject = _dereq_(165),
    isTypedArray = _dereq_(301);

/** Used to compose bitmasks for comparison styles. */
var PARTIAL_COMPARE_FLAG = 2;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = getTag(object);
    objTag = objTag == argsTag ? objectTag : objTag;
  }
  if (!othIsArr) {
    othTag = getTag(other);
    othTag = othTag == argsTag ? objectTag : othTag;
  }
  var objIsObj = objTag == objectTag && !isHostObject(object),
      othIsObj = othTag == objectTag && !isHostObject(other),
      isSameTag = objTag == othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
}

module.exports = baseIsEqualDeep;

},{"135":135,"136":136,"137":137,"150":150,"165":165,"22":22,"269":269,"301":301}],72:[function(_dereq_,module,exports){
var getTag = _dereq_(150),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike(value) && getTag(value) == mapTag;
}

module.exports = baseIsMap;

},{"150":150,"294":294}],73:[function(_dereq_,module,exports){
var Stack = _dereq_(22),
    baseIsEqual = _dereq_(70);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"22":22,"70":70}],74:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

module.exports = baseIsNaN;

},{}],75:[function(_dereq_,module,exports){
var isFunction = _dereq_(282),
    isHostObject = _dereq_(165),
    isMasked = _dereq_(172),
    isObject = _dereq_(293),
    toSource = _dereq_(215);

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"165":165,"172":172,"215":215,"282":282,"293":293}],76:[function(_dereq_,module,exports){
var isObject = _dereq_(293);

/** `Object#toString` result references. */
var regexpTag = '[object RegExp]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `_.isRegExp` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
 */
function baseIsRegExp(value) {
  return isObject(value) && objectToString.call(value) == regexpTag;
}

module.exports = baseIsRegExp;

},{"293":293}],77:[function(_dereq_,module,exports){
var getTag = _dereq_(150),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike(value) && getTag(value) == setTag;
}

module.exports = baseIsSet;

},{"150":150,"294":294}],78:[function(_dereq_,module,exports){
var isLength = _dereq_(284),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

module.exports = baseIsTypedArray;

},{"284":284,"294":294}],79:[function(_dereq_,module,exports){
var baseMatches = _dereq_(84),
    baseMatchesProperty = _dereq_(85),
    identity = _dereq_(264),
    isArray = _dereq_(269),
    property = _dereq_(328);

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

module.exports = baseIteratee;

},{"264":264,"269":269,"328":328,"84":84,"85":85}],80:[function(_dereq_,module,exports){
var isPrototype = _dereq_(173),
    nativeKeys = _dereq_(192);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeys;

},{"173":173,"192":192}],81:[function(_dereq_,module,exports){
var isObject = _dereq_(293),
    isPrototype = _dereq_(173),
    nativeKeysIn = _dereq_(193);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;

},{"173":173,"193":193,"293":293}],82:[function(_dereq_,module,exports){
/**
 * The function whose prototype chain sequence wrappers inherit from.
 *
 * @private
 */
function baseLodash() {
  // No operation performed.
}

module.exports = baseLodash;

},{}],83:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.lt` which doesn't coerce arguments.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is less than `other`,
 *  else `false`.
 */
function baseLt(value, other) {
  return value < other;
}

module.exports = baseLt;

},{}],84:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(73),
    getMatchData = _dereq_(145),
    matchesStrictComparable = _dereq_(187);

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

module.exports = baseMatches;

},{"145":145,"187":187,"73":73}],85:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(70),
    get = _dereq_(259),
    hasIn = _dereq_(263),
    isKey = _dereq_(168),
    isStrictComparable = _dereq_(174),
    matchesStrictComparable = _dereq_(187),
    toKey = _dereq_(214);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
  };
}

module.exports = baseMatchesProperty;

},{"168":168,"174":174,"187":187,"214":214,"259":259,"263":263,"70":70}],86:[function(_dereq_,module,exports){
var Stack = _dereq_(22),
    arrayEach = _dereq_(29),
    assignMergeValue = _dereq_(40),
    baseKeysIn = _dereq_(81),
    baseMergeDeep = _dereq_(87),
    isArray = _dereq_(269),
    isObject = _dereq_(293),
    isTypedArray = _dereq_(301);

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  if (!(isArray(source) || isTypedArray(source))) {
    var props = baseKeysIn(source);
  }
  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(object[key], srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  });
}

module.exports = baseMerge;

},{"22":22,"269":269,"29":29,"293":293,"301":301,"40":40,"81":81,"87":87}],87:[function(_dereq_,module,exports){
var assignMergeValue = _dereq_(40),
    baseClone = _dereq_(46),
    copyArray = _dereq_(117),
    isArguments = _dereq_(268),
    isArray = _dereq_(269),
    isArrayLikeObject = _dereq_(272),
    isFunction = _dereq_(282),
    isObject = _dereq_(293),
    isPlainObject = _dereq_(295),
    isTypedArray = _dereq_(301),
    toPlainObject = _dereq_(345);

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = object[key],
      srcValue = source[key],
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    newValue = srcValue;
    if (isArray(srcValue) || isTypedArray(srcValue)) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
      else {
        newValue = objValue;
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

module.exports = baseMergeDeep;

},{"117":117,"268":268,"269":269,"272":272,"282":282,"293":293,"295":295,"301":301,"345":345,"40":40,"46":46}],88:[function(_dereq_,module,exports){
var basePickBy = _dereq_(89);

/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property identifiers to pick.
 * @returns {Object} Returns the new object.
 */
function basePick(object, props) {
  object = Object(object);
  return basePickBy(object, props, function(value, key) {
    return key in object;
  });
}

module.exports = basePick;

},{"89":89}],89:[function(_dereq_,module,exports){
/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property identifiers to pick from.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */
function basePickBy(object, props, predicate) {
  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index],
        value = object[key];

    if (predicate(value, key)) {
      result[key] = value;
    }
  }
  return result;
}

module.exports = basePickBy;

},{}],90:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],91:[function(_dereq_,module,exports){
var baseGet = _dereq_(59);

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

module.exports = basePropertyDeep;

},{"59":59}],92:[function(_dereq_,module,exports){
var apply = _dereq_(28);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

module.exports = baseRest;

},{"28":28}],93:[function(_dereq_,module,exports){
var assignValue = _dereq_(41),
    castPath = _dereq_(105),
    isIndex = _dereq_(166),
    isKey = _dereq_(168),
    isObject = _dereq_(293),
    toKey = _dereq_(214);

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]),
        newValue = value;

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = isObject(objValue)
          ? objValue
          : (isIndex(path[index + 1]) ? [] : {});
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

module.exports = baseSet;

},{"105":105,"166":166,"168":168,"214":214,"293":293,"41":41}],94:[function(_dereq_,module,exports){
var identity = _dereq_(264),
    metaMap = _dereq_(190);

/**
 * The base implementation of `setData` without support for hot loop detection.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var baseSetData = !metaMap ? identity : function(func, data) {
  metaMap.set(func, data);
  return func;
};

module.exports = baseSetData;

},{"190":190,"264":264}],95:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],96:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;

},{}],97:[function(_dereq_,module,exports){
var arrayMap = _dereq_(34);

/**
 * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
 * of key-value pairs for `object` corresponding to the property names of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the key-value pairs.
 */
function baseToPairs(object, props) {
  return arrayMap(props, function(key) {
    return [key, object[key]];
  });
}

module.exports = baseToPairs;

},{"34":34}],98:[function(_dereq_,module,exports){
var Symbol = _dereq_(23),
    isSymbol = _dereq_(300);

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = baseToString;

},{"23":23,"300":300}],99:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;

},{}],100:[function(_dereq_,module,exports){
var castPath = _dereq_(105),
    isKey = _dereq_(168),
    last = _dereq_(308),
    parent = _dereq_(196),
    toKey = _dereq_(214);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.unset`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 */
function baseUnset(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);
  object = parent(object, path);

  var key = toKey(last(path));
  return !(object != null && hasOwnProperty.call(object, key)) || delete object[key];
}

module.exports = baseUnset;

},{"105":105,"168":168,"196":196,"214":214,"308":308}],101:[function(_dereq_,module,exports){
var baseGet = _dereq_(59),
    baseSet = _dereq_(93);

/**
 * The base implementation of `_.update`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to update.
 * @param {Function} updater The function to produce the updated value.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseUpdate(object, path, updater, customizer) {
  return baseSet(object, path, updater(baseGet(object, path)), customizer);
}

module.exports = baseUpdate;

},{"59":59,"93":93}],102:[function(_dereq_,module,exports){
var arrayMap = _dereq_(34);

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

module.exports = baseValues;

},{"34":34}],103:[function(_dereq_,module,exports){
/**
 * Checks if a cache value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

module.exports = cacheHas;

},{}],104:[function(_dereq_,module,exports){
var identity = _dereq_(264);

/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : identity;
}

module.exports = castFunction;

},{"264":264}],105:[function(_dereq_,module,exports){
var isArray = _dereq_(269),
    stringToPath = _dereq_(213);

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

module.exports = castPath;

},{"213":213,"269":269}],106:[function(_dereq_,module,exports){
var baseSlice = _dereq_(95);

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

module.exports = castSlice;

},{"95":95}],107:[function(_dereq_,module,exports){
var Uint8Array = _dereq_(24);

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;

},{"24":24}],108:[function(_dereq_,module,exports){
/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var result = new buffer.constructor(buffer.length);
  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

},{}],109:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(107);

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

module.exports = cloneDataView;

},{"107":107}],110:[function(_dereq_,module,exports){
var addMapEntry = _dereq_(26),
    arrayReduce = _dereq_(36),
    mapToArray = _dereq_(186);

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

module.exports = cloneMap;

},{"186":186,"26":26,"36":36}],111:[function(_dereq_,module,exports){
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

module.exports = cloneRegExp;

},{}],112:[function(_dereq_,module,exports){
var addSetEntry = _dereq_(27),
    arrayReduce = _dereq_(36),
    setToArray = _dereq_(204);

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

module.exports = cloneSet;

},{"204":204,"27":27,"36":36}],113:[function(_dereq_,module,exports){
var Symbol = _dereq_(23);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

module.exports = cloneSymbol;

},{"23":23}],114:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(107);

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;

},{"107":107}],115:[function(_dereq_,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates an array that is the composition of partially applied arguments,
 * placeholders, and provided arguments into a single array of arguments.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to prepend to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgs(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersLength = holders.length,
      leftIndex = -1,
      leftLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(leftLength + rangeLength),
      isUncurried = !isCurried;

  while (++leftIndex < leftLength) {
    result[leftIndex] = partials[leftIndex];
  }
  while (++argsIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[holders[argsIndex]] = args[argsIndex];
    }
  }
  while (rangeLength--) {
    result[leftIndex++] = args[argsIndex++];
  }
  return result;
}

module.exports = composeArgs;

},{}],116:[function(_dereq_,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This function is like `composeArgs` except that the arguments composition
 * is tailored for `_.partialRight`.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to append to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgsRight(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersIndex = -1,
      holdersLength = holders.length,
      rightIndex = -1,
      rightLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(rangeLength + rightLength),
      isUncurried = !isCurried;

  while (++argsIndex < rangeLength) {
    result[argsIndex] = args[argsIndex];
  }
  var offset = argsIndex;
  while (++rightIndex < rightLength) {
    result[offset + rightIndex] = partials[rightIndex];
  }
  while (++holdersIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[offset + holders[holdersIndex]] = args[argsIndex++];
    }
  }
  return result;
}

module.exports = composeArgsRight;

},{}],117:[function(_dereq_,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;

},{}],118:[function(_dereq_,module,exports){
var assignValue = _dereq_(41);

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    assignValue(object, key, newValue === undefined ? source[key] : newValue);
  }
  return object;
}

module.exports = copyObject;

},{"41":41}],119:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    getSymbols = _dereq_(148);

/**
 * Copies own symbol properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

module.exports = copySymbols;

},{"118":118,"148":148}],120:[function(_dereq_,module,exports){
var root = _dereq_(200);

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"200":200}],121:[function(_dereq_,module,exports){
/**
 * Gets the number of `placeholder` occurrences in `array`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} placeholder The placeholder to search for.
 * @returns {number} Returns the placeholder count.
 */
function countHolders(array, placeholder) {
  var length = array.length,
      result = 0;

  while (length--) {
    if (array[length] === placeholder) {
      result++;
    }
  }
  return result;
}

module.exports = countHolders;

},{}],122:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    isIterateeCall = _dereq_(167);

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"167":167,"92":92}],123:[function(_dereq_,module,exports){
/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{}],124:[function(_dereq_,module,exports){
var createCtor = _dereq_(125),
    root = _dereq_(200);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg`.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createBind(func, bitmask, thisArg) {
  var isBind = bitmask & BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return fn.apply(isBind ? thisArg : this, arguments);
  }
  return wrapper;
}

module.exports = createBind;

},{"125":125,"200":200}],125:[function(_dereq_,module,exports){
var baseCreate = _dereq_(48),
    isObject = _dereq_(293);

/**
 * Creates a function that produces an instance of `Ctor` regardless of
 * whether it was invoked as part of a `new` expression or by `call` or `apply`.
 *
 * @private
 * @param {Function} Ctor The constructor to wrap.
 * @returns {Function} Returns the new wrapped function.
 */
function createCtor(Ctor) {
  return function() {
    // Use a `switch` statement to work with class constructors. See
    // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
    // for more details.
    var args = arguments;
    switch (args.length) {
      case 0: return new Ctor;
      case 1: return new Ctor(args[0]);
      case 2: return new Ctor(args[0], args[1]);
      case 3: return new Ctor(args[0], args[1], args[2]);
      case 4: return new Ctor(args[0], args[1], args[2], args[3]);
      case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
      case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
    var thisBinding = baseCreate(Ctor.prototype),
        result = Ctor.apply(thisBinding, args);

    // Mimic the constructor's `return` behavior.
    // See https://es5.github.io/#x13.2.2 for more details.
    return isObject(result) ? result : thisBinding;
  };
}

module.exports = createCtor;

},{"293":293,"48":48}],126:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    createCtor = _dereq_(125),
    createHybrid = _dereq_(127),
    createRecurry = _dereq_(130),
    getHolder = _dereq_(143),
    replaceHolders = _dereq_(199),
    root = _dereq_(200);

/**
 * Creates a function that wraps `func` to enable currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {number} arity The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createCurry(func, bitmask, arity) {
  var Ctor = createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length,
        placeholder = getHolder(wrapper);

    while (index--) {
      args[index] = arguments[index];
    }
    var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
      ? []
      : replaceHolders(args, placeholder);

    length -= holders.length;
    if (length < arity) {
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, undefined,
        args, holders, undefined, undefined, arity - length);
    }
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return apply(fn, this, args);
  }
  return wrapper;
}

module.exports = createCurry;

},{"125":125,"127":127,"130":130,"143":143,"199":199,"200":200,"28":28}],127:[function(_dereq_,module,exports){
var composeArgs = _dereq_(115),
    composeArgsRight = _dereq_(116),
    countHolders = _dereq_(121),
    createCtor = _dereq_(125),
    createRecurry = _dereq_(130),
    getHolder = _dereq_(143),
    reorder = _dereq_(198),
    replaceHolders = _dereq_(199),
    root = _dereq_(200);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_FLAG = 8,
    CURRY_RIGHT_FLAG = 16,
    ARY_FLAG = 128,
    FLIP_FLAG = 512;

/**
 * Creates a function that wraps `func` to invoke it with optional `this`
 * binding of `thisArg`, partial application, and currying.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [partialsRight] The arguments to append to those provided
 *  to the new function.
 * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
  var isAry = bitmask & ARY_FLAG,
      isBind = bitmask & BIND_FLAG,
      isBindKey = bitmask & BIND_KEY_FLAG,
      isCurried = bitmask & (CURRY_FLAG | CURRY_RIGHT_FLAG),
      isFlip = bitmask & FLIP_FLAG,
      Ctor = isBindKey ? undefined : createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length;

    while (index--) {
      args[index] = arguments[index];
    }
    if (isCurried) {
      var placeholder = getHolder(wrapper),
          holdersCount = countHolders(args, placeholder);
    }
    if (partials) {
      args = composeArgs(args, partials, holders, isCurried);
    }
    if (partialsRight) {
      args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
    }
    length -= holdersCount;
    if (isCurried && length < arity) {
      var newHolders = replaceHolders(args, placeholder);
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, thisArg,
        args, newHolders, argPos, ary, arity - length
      );
    }
    var thisBinding = isBind ? thisArg : this,
        fn = isBindKey ? thisBinding[func] : func;

    length = args.length;
    if (argPos) {
      args = reorder(args, argPos);
    } else if (isFlip && length > 1) {
      args.reverse();
    }
    if (isAry && ary < length) {
      args.length = ary;
    }
    if (this && this !== root && this instanceof wrapper) {
      fn = Ctor || createCtor(fn);
    }
    return fn.apply(thisBinding, args);
  }
  return wrapper;
}

module.exports = createHybrid;

},{"115":115,"116":116,"121":121,"125":125,"130":130,"143":143,"198":198,"199":199,"200":200}],128:[function(_dereq_,module,exports){
var baseInverter = _dereq_(66);

/**
 * Creates a function like `_.invertBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} toIteratee The function to resolve iteratees.
 * @returns {Function} Returns the new inverter function.
 */
function createInverter(setter, toIteratee) {
  return function(object, iteratee) {
    return baseInverter(object, setter, toIteratee(iteratee), {});
  };
}

module.exports = createInverter;

},{"66":66}],129:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    createCtor = _dereq_(125),
    root = _dereq_(200);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the `this` binding
 * of `thisArg` and `partials` prepended to the arguments it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} partials The arguments to prepend to those provided to
 *  the new function.
 * @returns {Function} Returns the new wrapped function.
 */
function createPartial(func, bitmask, thisArg, partials) {
  var isBind = bitmask & BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var argsIndex = -1,
        argsLength = arguments.length,
        leftIndex = -1,
        leftLength = partials.length,
        args = Array(leftLength + argsLength),
        fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

    while (++leftIndex < leftLength) {
      args[leftIndex] = partials[leftIndex];
    }
    while (argsLength--) {
      args[leftIndex++] = arguments[++argsIndex];
    }
    return apply(fn, isBind ? thisArg : this, args);
  }
  return wrapper;
}

module.exports = createPartial;

},{"125":125,"200":200,"28":28}],130:[function(_dereq_,module,exports){
var isLaziable = _dereq_(170),
    setData = _dereq_(203),
    setWrapToString = _dereq_(206);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_BOUND_FLAG = 4,
    CURRY_FLAG = 8,
    PARTIAL_FLAG = 32,
    PARTIAL_RIGHT_FLAG = 64;

/**
 * Creates a function that wraps `func` to continue currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {Function} wrapFunc The function to create the `func` wrapper.
 * @param {*} placeholder The placeholder value.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
  var isCurry = bitmask & CURRY_FLAG,
      newHolders = isCurry ? holders : undefined,
      newHoldersRight = isCurry ? undefined : holders,
      newPartials = isCurry ? partials : undefined,
      newPartialsRight = isCurry ? undefined : partials;

  bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
  bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

  if (!(bitmask & CURRY_BOUND_FLAG)) {
    bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
  }
  var newData = [
    func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
    newHoldersRight, argPos, ary, arity
  ];

  var result = wrapFunc.apply(undefined, newData);
  if (isLaziable(func)) {
    setData(result, newData);
  }
  result.placeholder = placeholder;
  return setWrapToString(result, func, bitmask);
}

module.exports = createRecurry;

},{"170":170,"203":203,"206":206}],131:[function(_dereq_,module,exports){
var toNumber = _dereq_(342);

/**
 * Creates a function that performs a relational operation on two values.
 *
 * @private
 * @param {Function} operator The function to perform the operation.
 * @returns {Function} Returns the new relational operation function.
 */
function createRelationalOperation(operator) {
  return function(value, other) {
    if (!(typeof value == 'string' && typeof other == 'string')) {
      value = toNumber(value);
      other = toNumber(other);
    }
    return operator(value, other);
  };
}

module.exports = createRelationalOperation;

},{"342":342}],132:[function(_dereq_,module,exports){
var baseToPairs = _dereq_(97),
    getTag = _dereq_(150),
    mapToArray = _dereq_(186),
    setToPairs = _dereq_(205);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/**
 * Creates a `_.toPairs` or `_.toPairsIn` function.
 *
 * @private
 * @param {Function} keysFunc The function to get the keys of a given object.
 * @returns {Function} Returns the new pairs function.
 */
function createToPairs(keysFunc) {
  return function(object) {
    var tag = getTag(object);
    if (tag == mapTag) {
      return mapToArray(object);
    }
    if (tag == setTag) {
      return setToPairs(object);
    }
    return baseToPairs(object, keysFunc(object));
  };
}

module.exports = createToPairs;

},{"150":150,"186":186,"205":205,"97":97}],133:[function(_dereq_,module,exports){
var baseSetData = _dereq_(94),
    createBind = _dereq_(124),
    createCurry = _dereq_(126),
    createHybrid = _dereq_(127),
    createPartial = _dereq_(129),
    getData = _dereq_(141),
    mergeData = _dereq_(188),
    setData = _dereq_(203),
    setWrapToString = _dereq_(206),
    toInteger = _dereq_(340);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_FLAG = 8,
    CURRY_RIGHT_FLAG = 16,
    PARTIAL_FLAG = 32,
    PARTIAL_RIGHT_FLAG = 64;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that either curries or invokes `func` with optional
 * `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags.
 *  The bitmask may be composed of the following flags:
 *     1 - `_.bind`
 *     2 - `_.bindKey`
 *     4 - `_.curry` or `_.curryRight` of a bound function
 *     8 - `_.curry`
 *    16 - `_.curryRight`
 *    32 - `_.partial`
 *    64 - `_.partialRight`
 *   128 - `_.rearg`
 *   256 - `_.ary`
 *   512 - `_.flip`
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to be partially applied.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
  var isBindKey = bitmask & BIND_KEY_FLAG;
  if (!isBindKey && typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var length = partials ? partials.length : 0;
  if (!length) {
    bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
    partials = holders = undefined;
  }
  ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
  arity = arity === undefined ? arity : toInteger(arity);
  length -= holders ? holders.length : 0;

  if (bitmask & PARTIAL_RIGHT_FLAG) {
    var partialsRight = partials,
        holdersRight = holders;

    partials = holders = undefined;
  }
  var data = isBindKey ? undefined : getData(func);

  var newData = [
    func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
    argPos, ary, arity
  ];

  if (data) {
    mergeData(newData, data);
  }
  func = newData[0];
  bitmask = newData[1];
  thisArg = newData[2];
  partials = newData[3];
  holders = newData[4];
  arity = newData[9] = newData[9] == null
    ? (isBindKey ? 0 : func.length)
    : nativeMax(newData[9] - length, 0);

  if (!arity && bitmask & (CURRY_FLAG | CURRY_RIGHT_FLAG)) {
    bitmask &= ~(CURRY_FLAG | CURRY_RIGHT_FLAG);
  }
  if (!bitmask || bitmask == BIND_FLAG) {
    var result = createBind(func, bitmask, thisArg);
  } else if (bitmask == CURRY_FLAG || bitmask == CURRY_RIGHT_FLAG) {
    result = createCurry(func, bitmask, arity);
  } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !holders.length) {
    result = createPartial(func, bitmask, thisArg, partials);
  } else {
    result = createHybrid.apply(undefined, newData);
  }
  var setter = data ? baseSetData : setData;
  return setWrapToString(setter(result, newData), func, bitmask);
}

module.exports = createWrap;

},{"124":124,"126":126,"127":127,"129":129,"141":141,"188":188,"203":203,"206":206,"340":340,"94":94}],134:[function(_dereq_,module,exports){
var getNative = _dereq_(146);

/* Used to set `toString` methods. */
var defineProperty = (function() {
  var func = getNative(Object, 'defineProperty'),
      name = getNative.name;

  return (name && name.length > 2) ? func : undefined;
}());

module.exports = defineProperty;

},{"146":146}],135:[function(_dereq_,module,exports){
var SetCache = _dereq_(21),
    arraySome = _dereq_(37);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!seen.has(othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
              return seen.add(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, customizer, bitmask, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

module.exports = equalArrays;

},{"21":21,"37":37}],136:[function(_dereq_,module,exports){
var Symbol = _dereq_(23),
    Uint8Array = _dereq_(24),
    eq = _dereq_(246),
    equalArrays = _dereq_(135),
    mapToArray = _dereq_(186),
    setToArray = _dereq_(204);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

module.exports = equalByTag;

},{"135":135,"186":186,"204":204,"23":23,"24":24,"246":246}],137:[function(_dereq_,module,exports){
var keys = _dereq_(305);

/** Used to compose bitmasks for comparison styles. */
var PARTIAL_COMPARE_FLAG = 2;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

module.exports = equalObjects;

},{"305":305}],138:[function(_dereq_,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],139:[function(_dereq_,module,exports){
var baseGetAllKeys = _dereq_(60),
    getSymbols = _dereq_(148),
    keys = _dereq_(305);

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;

},{"148":148,"305":305,"60":60}],140:[function(_dereq_,module,exports){
var baseGetAllKeys = _dereq_(60),
    getSymbolsIn = _dereq_(149),
    keysIn = _dereq_(306);

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn);
}

module.exports = getAllKeysIn;

},{"149":149,"306":306,"60":60}],141:[function(_dereq_,module,exports){
var metaMap = _dereq_(190),
    noop = _dereq_(317);

/**
 * Gets metadata for `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {*} Returns the metadata for `func`.
 */
var getData = !metaMap ? noop : function(func) {
  return metaMap.get(func);
};

module.exports = getData;

},{"190":190,"317":317}],142:[function(_dereq_,module,exports){
var realNames = _dereq_(197);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the name of `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {string} Returns the function name.
 */
function getFuncName(func) {
  var result = (func.name + ''),
      array = realNames[result],
      length = hasOwnProperty.call(realNames, result) ? array.length : 0;

  while (length--) {
    var data = array[length],
        otherFunc = data.func;
    if (otherFunc == null || otherFunc == func) {
      return data.name;
    }
  }
  return result;
}

module.exports = getFuncName;

},{"197":197}],143:[function(_dereq_,module,exports){
/**
 * Gets the argument placeholder value for `func`.
 *
 * @private
 * @param {Function} func The function to inspect.
 * @returns {*} Returns the placeholder value.
 */
function getHolder(func) {
  var object = func;
  return object.placeholder;
}

module.exports = getHolder;

},{}],144:[function(_dereq_,module,exports){
var isKeyable = _dereq_(169);

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;

},{"169":169}],145:[function(_dereq_,module,exports){
var isStrictComparable = _dereq_(174),
    keys = _dereq_(305);

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

module.exports = getMatchData;

},{"174":174,"305":305}],146:[function(_dereq_,module,exports){
var baseIsNative = _dereq_(75),
    getValue = _dereq_(151);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"151":151,"75":75}],147:[function(_dereq_,module,exports){
var overArg = _dereq_(195);

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"195":195}],148:[function(_dereq_,module,exports){
var overArg = _dereq_(195),
    stubArray = _dereq_(335);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbol properties of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;

module.exports = getSymbols;

},{"195":195,"335":335}],149:[function(_dereq_,module,exports){
var arrayPush = _dereq_(35),
    getPrototype = _dereq_(147),
    getSymbols = _dereq_(148),
    stubArray = _dereq_(335);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbol properties
 * of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;

},{"147":147,"148":148,"335":335,"35":35}],150:[function(_dereq_,module,exports){
var DataView = _dereq_(12),
    Map = _dereq_(17),
    Promise = _dereq_(19),
    Set = _dereq_(20),
    WeakMap = _dereq_(25),
    baseGetTag = _dereq_(61),
    toSource = _dereq_(215);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge < 14, and promises in Node.js.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

module.exports = getTag;

},{"12":12,"17":17,"19":19,"20":20,"215":215,"25":25,"61":61}],151:[function(_dereq_,module,exports){
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],152:[function(_dereq_,module,exports){
/** Used to match wrap detail comments. */
var reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
    reSplitDetails = /,? & /;

/**
 * Extracts wrapper details from the `source` body comment.
 *
 * @private
 * @param {string} source The source to inspect.
 * @returns {Array} Returns the wrapper details.
 */
function getWrapDetails(source) {
  var match = source.match(reWrapDetails);
  return match ? match[1].split(reSplitDetails) : [];
}

module.exports = getWrapDetails;

},{}],153:[function(_dereq_,module,exports){
var castPath = _dereq_(105),
    isArguments = _dereq_(268),
    isArray = _dereq_(269),
    isIndex = _dereq_(166),
    isKey = _dereq_(168),
    isLength = _dereq_(284),
    toKey = _dereq_(214);

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = isKey(path, object) ? [path] : castPath(path);

  var result,
      index = -1,
      length = path.length;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result) {
    return result;
  }
  var length = object ? object.length : 0;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

module.exports = hasPath;

},{"105":105,"166":166,"168":168,"214":214,"268":268,"269":269,"284":284}],154:[function(_dereq_,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

module.exports = hasUnicode;

},{}],155:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(191);

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

module.exports = hashClear;

},{"191":191}],156:[function(_dereq_,module,exports){
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

module.exports = hashDelete;

},{}],157:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(191);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"191":191}],158:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(191);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"191":191}],159:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(191);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"191":191}],160:[function(_dereq_,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],161:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(107),
    cloneDataView = _dereq_(109),
    cloneMap = _dereq_(110),
    cloneRegExp = _dereq_(111),
    cloneSet = _dereq_(112),
    cloneSymbol = _dereq_(113),
    cloneTypedArray = _dereq_(114);

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag:
      return cloneSymbol(object);
  }
}

module.exports = initCloneByTag;

},{"107":107,"109":109,"110":110,"111":111,"112":112,"113":113,"114":114}],162:[function(_dereq_,module,exports){
var baseCreate = _dereq_(48),
    getPrototype = _dereq_(147),
    isPrototype = _dereq_(173);

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;

},{"147":147,"173":173,"48":48}],163:[function(_dereq_,module,exports){
/** Used to match wrap detail comments. */
var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;

/**
 * Inserts wrapper `details` in a comment at the top of the `source` body.
 *
 * @private
 * @param {string} source The source to modify.
 * @returns {Array} details The details to insert.
 * @returns {string} Returns the modified source.
 */
function insertWrapDetails(source, details) {
  var length = details.length,
      lastIndex = length - 1;

  details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
  details = details.join(length > 2 ? ', ' : ' ');
  return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
}

module.exports = insertWrapDetails;

},{}],164:[function(_dereq_,module,exports){
var Symbol = _dereq_(23),
    isArguments = _dereq_(268),
    isArray = _dereq_(269);

/** Built-in value references. */
var spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

module.exports = isFlattenable;

},{"23":23,"268":268,"269":269}],165:[function(_dereq_,module,exports){
/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

module.exports = isHostObject;

},{}],166:[function(_dereq_,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;

},{}],167:[function(_dereq_,module,exports){
var eq = _dereq_(246),
    isArrayLike = _dereq_(271),
    isIndex = _dereq_(166),
    isObject = _dereq_(293);

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;

},{"166":166,"246":246,"271":271,"293":293}],168:[function(_dereq_,module,exports){
var isArray = _dereq_(269),
    isSymbol = _dereq_(300);

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

module.exports = isKey;

},{"269":269,"300":300}],169:[function(_dereq_,module,exports){
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;

},{}],170:[function(_dereq_,module,exports){
var LazyWrapper = _dereq_(14),
    getData = _dereq_(141),
    getFuncName = _dereq_(142),
    lodash = _dereq_(356);

/**
 * Checks if `func` has a lazy counterpart.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
 *  else `false`.
 */
function isLaziable(func) {
  var funcName = getFuncName(func),
      other = lodash[funcName];

  if (typeof other != 'function' || !(funcName in LazyWrapper.prototype)) {
    return false;
  }
  if (func === other) {
    return true;
  }
  var data = getData(other);
  return !!data && func === data[0];
}

module.exports = isLaziable;

},{"14":14,"141":141,"142":142,"356":356}],171:[function(_dereq_,module,exports){
var coreJsData = _dereq_(120),
    isFunction = _dereq_(282),
    stubFalse = _dereq_(336);

/**
 * Checks if `func` is capable of being masked.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `func` is maskable, else `false`.
 */
var isMaskable = coreJsData ? isFunction : stubFalse;

module.exports = isMaskable;

},{"120":120,"282":282,"336":336}],172:[function(_dereq_,module,exports){
var coreJsData = _dereq_(120);

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;

},{"120":120}],173:[function(_dereq_,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;

},{}],174:[function(_dereq_,module,exports){
var isObject = _dereq_(293);

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"293":293}],175:[function(_dereq_,module,exports){
/**
 * Converts `iterator` to an array.
 *
 * @private
 * @param {Object} iterator The iterator to convert.
 * @returns {Array} Returns the converted array.
 */
function iteratorToArray(iterator) {
  var data,
      result = [];

  while (!(data = iterator.next()).done) {
    result.push(data.value);
  }
  return result;
}

module.exports = iteratorToArray;

},{}],176:[function(_dereq_,module,exports){
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

module.exports = listCacheClear;

},{}],177:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(42);

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

module.exports = listCacheDelete;

},{"42":42}],178:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(42);

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"42":42}],179:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(42);

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"42":42}],180:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(42);

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"42":42}],181:[function(_dereq_,module,exports){
var Hash = _dereq_(13),
    ListCache = _dereq_(15),
    Map = _dereq_(17);

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;

},{"13":13,"15":15,"17":17}],182:[function(_dereq_,module,exports){
var getMapData = _dereq_(144);

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

module.exports = mapCacheDelete;

},{"144":144}],183:[function(_dereq_,module,exports){
var getMapData = _dereq_(144);

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"144":144}],184:[function(_dereq_,module,exports){
var getMapData = _dereq_(144);

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"144":144}],185:[function(_dereq_,module,exports){
var getMapData = _dereq_(144);

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

module.exports = mapCacheSet;

},{"144":144}],186:[function(_dereq_,module,exports){
/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

module.exports = mapToArray;

},{}],187:[function(_dereq_,module,exports){
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

module.exports = matchesStrictComparable;

},{}],188:[function(_dereq_,module,exports){
var composeArgs = _dereq_(115),
    composeArgsRight = _dereq_(116),
    replaceHolders = _dereq_(199);

/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_BOUND_FLAG = 4,
    CURRY_FLAG = 8,
    ARY_FLAG = 128,
    REARG_FLAG = 256;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Merges the function metadata of `source` into `data`.
 *
 * Merging metadata reduces the number of wrappers used to invoke a function.
 * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
 * may be applied regardless of execution order. Methods like `_.ary` and
 * `_.rearg` modify function arguments, making the order in which they are
 * executed important, preventing the merging of metadata. However, we make
 * an exception for a safe combined case where curried functions have `_.ary`
 * and or `_.rearg` applied.
 *
 * @private
 * @param {Array} data The destination metadata.
 * @param {Array} source The source metadata.
 * @returns {Array} Returns `data`.
 */
function mergeData(data, source) {
  var bitmask = data[1],
      srcBitmask = source[1],
      newBitmask = bitmask | srcBitmask,
      isCommon = newBitmask < (BIND_FLAG | BIND_KEY_FLAG | ARY_FLAG);

  var isCombo =
    ((srcBitmask == ARY_FLAG) && (bitmask == CURRY_FLAG)) ||
    ((srcBitmask == ARY_FLAG) && (bitmask == REARG_FLAG) && (data[7].length <= source[8])) ||
    ((srcBitmask == (ARY_FLAG | REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == CURRY_FLAG));

  // Exit early if metadata can't be merged.
  if (!(isCommon || isCombo)) {
    return data;
  }
  // Use source `thisArg` if available.
  if (srcBitmask & BIND_FLAG) {
    data[2] = source[2];
    // Set when currying a bound function.
    newBitmask |= bitmask & BIND_FLAG ? 0 : CURRY_BOUND_FLAG;
  }
  // Compose partial arguments.
  var value = source[3];
  if (value) {
    var partials = data[3];
    data[3] = partials ? composeArgs(partials, value, source[4]) : value;
    data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
  }
  // Compose partial right arguments.
  value = source[5];
  if (value) {
    partials = data[5];
    data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
    data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
  }
  // Use source `argPos` if available.
  value = source[7];
  if (value) {
    data[7] = value;
  }
  // Use source `ary` if it's smaller.
  if (srcBitmask & ARY_FLAG) {
    data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
  }
  // Use source `arity` if one is not provided.
  if (data[9] == null) {
    data[9] = source[9];
  }
  // Use source `func` and merge bitmasks.
  data[0] = source[0];
  data[1] = newBitmask;

  return data;
}

module.exports = mergeData;

},{"115":115,"116":116,"199":199}],189:[function(_dereq_,module,exports){
var baseMerge = _dereq_(86),
    isObject = _dereq_(293);

/**
 * Used by `_.defaultsDeep` to customize its `_.merge` use.
 *
 * @private
 * @param {*} objValue The destination value.
 * @param {*} srcValue The source value.
 * @param {string} key The key of the property to merge.
 * @param {Object} object The parent object of `objValue`.
 * @param {Object} source The parent object of `srcValue`.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 * @returns {*} Returns the value to assign.
 */
function mergeDefaults(objValue, srcValue, key, object, source, stack) {
  if (isObject(objValue) && isObject(srcValue)) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, objValue);
    baseMerge(objValue, srcValue, undefined, mergeDefaults, stack);
    stack['delete'](srcValue);
  }
  return objValue;
}

module.exports = mergeDefaults;

},{"293":293,"86":86}],190:[function(_dereq_,module,exports){
var WeakMap = _dereq_(25);

/** Used to store function metadata. */
var metaMap = WeakMap && new WeakMap;

module.exports = metaMap;

},{"25":25}],191:[function(_dereq_,module,exports){
var getNative = _dereq_(146);

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"146":146}],192:[function(_dereq_,module,exports){
var overArg = _dereq_(195);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

module.exports = nativeKeys;

},{"195":195}],193:[function(_dereq_,module,exports){
/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;

},{}],194:[function(_dereq_,module,exports){
var freeGlobal = _dereq_(138);

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;

},{"138":138}],195:[function(_dereq_,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],196:[function(_dereq_,module,exports){
var baseGet = _dereq_(59),
    baseSlice = _dereq_(95);

/**
 * Gets the parent value at `path` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path to get the parent value of.
 * @returns {*} Returns the parent value.
 */
function parent(object, path) {
  return path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
}

module.exports = parent;

},{"59":59,"95":95}],197:[function(_dereq_,module,exports){
/** Used to lookup unminified function names. */
var realNames = {};

module.exports = realNames;

},{}],198:[function(_dereq_,module,exports){
var copyArray = _dereq_(117),
    isIndex = _dereq_(166);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Reorder `array` according to the specified indexes where the element at
 * the first index is assigned as the first element, the element at
 * the second index is assigned as the second element, and so on.
 *
 * @private
 * @param {Array} array The array to reorder.
 * @param {Array} indexes The arranged array indexes.
 * @returns {Array} Returns `array`.
 */
function reorder(array, indexes) {
  var arrLength = array.length,
      length = nativeMin(indexes.length, arrLength),
      oldArray = copyArray(array);

  while (length--) {
    var index = indexes[length];
    array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
  }
  return array;
}

module.exports = reorder;

},{"117":117,"166":166}],199:[function(_dereq_,module,exports){
/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/**
 * Replaces all `placeholder` elements in `array` with an internal placeholder
 * and returns an array of their indexes.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {*} placeholder The placeholder to replace.
 * @returns {Array} Returns the new array of placeholder indexes.
 */
function replaceHolders(array, placeholder) {
  var index = -1,
      length = array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value === placeholder || value === PLACEHOLDER) {
      array[index] = PLACEHOLDER;
      result[resIndex++] = index;
    }
  }
  return result;
}

module.exports = replaceHolders;

},{}],200:[function(_dereq_,module,exports){
var freeGlobal = _dereq_(138);

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"138":138}],201:[function(_dereq_,module,exports){
/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

module.exports = setCacheAdd;

},{}],202:[function(_dereq_,module,exports){
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

module.exports = setCacheHas;

},{}],203:[function(_dereq_,module,exports){
var baseSetData = _dereq_(94),
    now = _dereq_(318);

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 150,
    HOT_SPAN = 16;

/**
 * Sets metadata for `func`.
 *
 * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
 * period of time, it will trip its breaker and transition to an identity
 * function to avoid garbage collection pauses in V8. See
 * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
 * for more details.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var setData = (function() {
  var count = 0,
      lastCalled = 0;

  return function(key, value) {
    var stamp = now(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return key;
      }
    } else {
      count = 0;
    }
    return baseSetData(key, value);
  };
}());

module.exports = setData;

},{"318":318,"94":94}],204:[function(_dereq_,module,exports){
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

module.exports = setToArray;

},{}],205:[function(_dereq_,module,exports){
/**
 * Converts `set` to its value-value pairs.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the value-value pairs.
 */
function setToPairs(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = [value, value];
  });
  return result;
}

module.exports = setToPairs;

},{}],206:[function(_dereq_,module,exports){
var constant = _dereq_(235),
    defineProperty = _dereq_(134),
    getWrapDetails = _dereq_(152),
    identity = _dereq_(264),
    insertWrapDetails = _dereq_(163),
    updateWrapDetails = _dereq_(217);

/**
 * Sets the `toString` method of `wrapper` to mimic the source of `reference`
 * with wrapper details in a comment at the top of the source body.
 *
 * @private
 * @param {Function} wrapper The function to modify.
 * @param {Function} reference The reference function.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Function} Returns `wrapper`.
 */
var setWrapToString = !defineProperty ? identity : function(wrapper, reference, bitmask) {
  var source = (reference + '');
  return defineProperty(wrapper, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)))
  });
};

module.exports = setWrapToString;

},{"134":134,"152":152,"163":163,"217":217,"235":235,"264":264}],207:[function(_dereq_,module,exports){
var ListCache = _dereq_(15);

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
}

module.exports = stackClear;

},{"15":15}],208:[function(_dereq_,module,exports){
/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  return this.__data__['delete'](key);
}

module.exports = stackDelete;

},{}],209:[function(_dereq_,module,exports){
/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;

},{}],210:[function(_dereq_,module,exports){
/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;

},{}],211:[function(_dereq_,module,exports){
var ListCache = _dereq_(15),
    Map = _dereq_(17),
    MapCache = _dereq_(18);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache) {
    var pairs = cache.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      return this;
    }
    cache = this.__data__ = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
}

module.exports = stackSet;

},{"15":15,"17":17,"18":18}],212:[function(_dereq_,module,exports){
var asciiToArray = _dereq_(38),
    hasUnicode = _dereq_(154),
    unicodeToArray = _dereq_(216);

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

module.exports = stringToArray;

},{"154":154,"216":216,"38":38}],213:[function(_dereq_,module,exports){
var memoize = _dereq_(313),
    toString = _dereq_(347);

/** Used to match property names within property paths. */
var reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

module.exports = stringToPath;

},{"313":313,"347":347}],214:[function(_dereq_,module,exports){
var isSymbol = _dereq_(300);

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toKey;

},{"300":300}],215:[function(_dereq_,module,exports){
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],216:[function(_dereq_,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

module.exports = unicodeToArray;

},{}],217:[function(_dereq_,module,exports){
var arrayEach = _dereq_(29),
    arrayIncludes = _dereq_(31);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    CURRY_FLAG = 8,
    CURRY_RIGHT_FLAG = 16,
    PARTIAL_FLAG = 32,
    PARTIAL_RIGHT_FLAG = 64,
    ARY_FLAG = 128,
    REARG_FLAG = 256,
    FLIP_FLAG = 512;

/** Used to associate wrap methods with their bit flags. */
var wrapFlags = [
  ['ary', ARY_FLAG],
  ['bind', BIND_FLAG],
  ['bindKey', BIND_KEY_FLAG],
  ['curry', CURRY_FLAG],
  ['curryRight', CURRY_RIGHT_FLAG],
  ['flip', FLIP_FLAG],
  ['partial', PARTIAL_FLAG],
  ['partialRight', PARTIAL_RIGHT_FLAG],
  ['rearg', REARG_FLAG]
];

/**
 * Updates wrapper `details` based on `bitmask` flags.
 *
 * @private
 * @returns {Array} details The details to modify.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Array} Returns `details`.
 */
function updateWrapDetails(details, bitmask) {
  arrayEach(wrapFlags, function(pair) {
    var value = '_.' + pair[0];
    if ((bitmask & pair[1]) && !arrayIncludes(details, value)) {
      details.push(value);
    }
  });
  return details.sort();
}

module.exports = updateWrapDetails;

},{"29":29,"31":31}],218:[function(_dereq_,module,exports){
var LazyWrapper = _dereq_(14),
    LodashWrapper = _dereq_(16),
    copyArray = _dereq_(117);

/**
 * Creates a clone of `wrapper`.
 *
 * @private
 * @param {Object} wrapper The wrapper to clone.
 * @returns {Object} Returns the cloned wrapper.
 */
function wrapperClone(wrapper) {
  if (wrapper instanceof LazyWrapper) {
    return wrapper.clone();
  }
  var result = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
  result.__actions__ = copyArray(wrapper.__actions__);
  result.__index__  = wrapper.__index__;
  result.__values__ = wrapper.__values__;
  return result;
}

module.exports = wrapperClone;

},{"117":117,"14":14,"16":16}],219:[function(_dereq_,module,exports){
var toInteger = _dereq_(340);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * The opposite of `_.before`; this method creates a function that invokes
 * `func` once it's called `n` or more times.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {number} n The number of calls before `func` is invoked.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * var saves = ['profile', 'settings'];
 *
 * var done = _.after(saves.length, function() {
 *   console.log('done saving!');
 * });
 *
 * _.forEach(saves, function(type) {
 *   asyncSave({ 'type': type, 'complete': done });
 * });
 * // => Logs 'done saving!' after the two async saves have completed.
 */
function after(n, func) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  n = toInteger(n);
  return function() {
    if (--n < 1) {
      return func.apply(this, arguments);
    }
  };
}

module.exports = after;

},{"340":340}],220:[function(_dereq_,module,exports){
var createWrap = _dereq_(133);

/** Used to compose bitmasks for function metadata. */
var ARY_FLAG = 128;

/**
 * Creates a function that invokes `func`, with up to `n` arguments,
 * ignoring any additional arguments.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} func The function to cap arguments for.
 * @param {number} [n=func.length] The arity cap.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Function} Returns the new capped function.
 * @example
 *
 * _.map(['6', '8', '10'], _.ary(parseInt, 1));
 * // => [6, 8, 10]
 */
function ary(func, n, guard) {
  n = guard ? undefined : n;
  n = (func && n == null) ? func.length : n;
  return createWrap(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
}

module.exports = ary;

},{"133":133}],221:[function(_dereq_,module,exports){
var assignValue = _dereq_(41),
    copyObject = _dereq_(118),
    createAssigner = _dereq_(122),
    isArrayLike = _dereq_(271),
    isPrototype = _dereq_(173),
    keys = _dereq_(305);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

/**
 * Assigns own enumerable string keyed properties of source objects to the
 * destination object. Source objects are applied from left to right.
 * Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object` and is loosely based on
 * [`Object.assign`](https://mdn.io/Object/assign).
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assignIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assign({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3 }
 */
var assign = createAssigner(function(object, source) {
  if (nonEnumShadows || isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keys(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty.call(source, key)) {
      assignValue(object, key, source[key]);
    }
  }
});

module.exports = assign;

},{"118":118,"122":122,"173":173,"271":271,"305":305,"41":41}],222:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    createAssigner = _dereq_(122),
    keysIn = _dereq_(306);

/**
 * This method is like `_.assign` except that it iterates over own and
 * inherited source properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assign
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assignIn({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
 */
var assignIn = createAssigner(function(object, source) {
  copyObject(source, keysIn(source), object);
});

module.exports = assignIn;

},{"118":118,"122":122,"306":306}],223:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    createAssigner = _dereq_(122),
    keysIn = _dereq_(306);

/**
 * This method is like `_.assignIn` except that it accepts `customizer`
 * which is invoked to produce the assigned values. If `customizer` returns
 * `undefined`, assignment is handled by the method instead. The `customizer`
 * is invoked with five arguments: (objValue, srcValue, key, object, source).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias extendWith
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @see _.assignWith
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   return _.isUndefined(objValue) ? srcValue : objValue;
 * }
 *
 * var defaults = _.partialRight(_.assignInWith, customizer);
 *
 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
  copyObject(source, keysIn(source), object, customizer);
});

module.exports = assignInWith;

},{"118":118,"122":122,"306":306}],224:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    createAssigner = _dereq_(122),
    keys = _dereq_(305);

/**
 * This method is like `_.assign` except that it accepts `customizer`
 * which is invoked to produce the assigned values. If `customizer` returns
 * `undefined`, assignment is handled by the method instead. The `customizer`
 * is invoked with five arguments: (objValue, srcValue, key, object, source).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @see _.assignInWith
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   return _.isUndefined(objValue) ? srcValue : objValue;
 * }
 *
 * var defaults = _.partialRight(_.assignWith, customizer);
 *
 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
  copyObject(source, keys(source), object, customizer);
});

module.exports = assignWith;

},{"118":118,"122":122,"305":305}],225:[function(_dereq_,module,exports){
var baseAt = _dereq_(44),
    baseFlatten = _dereq_(53),
    baseRest = _dereq_(92);

/**
 * Creates an array of values corresponding to `paths` of `object`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {...(string|string[])} [paths] The property paths of elements to pick.
 * @returns {Array} Returns the picked values.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
 *
 * _.at(object, ['a[0].b.c', 'a[1]']);
 * // => [3, 4]
 */
var at = baseRest(function(object, paths) {
  return baseAt(object, baseFlatten(paths, 1));
});

module.exports = at;

},{"44":44,"53":53,"92":92}],226:[function(_dereq_,module,exports){
var toInteger = _dereq_(340);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that invokes `func`, with the `this` binding and arguments
 * of the created function, while it's called less than `n` times. Subsequent
 * calls to the created function return the result of the last `func` invocation.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {number} n The number of calls at which `func` is no longer invoked.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * jQuery(element).on('click', _.before(5, addContactToList));
 * // => Allows adding up to 4 contacts to the list.
 */
function before(n, func) {
  var result;
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  n = toInteger(n);
  return function() {
    if (--n > 0) {
      result = func.apply(this, arguments);
    }
    if (n <= 1) {
      func = undefined;
    }
    return result;
  };
}

module.exports = before;

},{"340":340}],227:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    createWrap = _dereq_(133),
    getHolder = _dereq_(143),
    replaceHolders = _dereq_(199);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    PARTIAL_FLAG = 32;

/**
 * Creates a function that invokes `func` with the `this` binding of `thisArg`
 * and `partials` prepended to the arguments it receives.
 *
 * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
 * may be used as a placeholder for partially applied arguments.
 *
 * **Note:** Unlike native `Function#bind`, this method doesn't set the "length"
 * property of bound functions.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new bound function.
 * @example
 *
 * function greet(greeting, punctuation) {
 *   return greeting + ' ' + this.user + punctuation;
 * }
 *
 * var object = { 'user': 'fred' };
 *
 * var bound = _.bind(greet, object, 'hi');
 * bound('!');
 * // => 'hi fred!'
 *
 * // Bound with placeholders.
 * var bound = _.bind(greet, object, _, '!');
 * bound('hi');
 * // => 'hi fred!'
 */
var bind = baseRest(function(func, thisArg, partials) {
  var bitmask = BIND_FLAG;
  if (partials.length) {
    var holders = replaceHolders(partials, getHolder(bind));
    bitmask |= PARTIAL_FLAG;
  }
  return createWrap(func, bitmask, thisArg, partials, holders);
});

// Assign default placeholders.
bind.placeholder = {};

module.exports = bind;

},{"133":133,"143":143,"199":199,"92":92}],228:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    createWrap = _dereq_(133),
    getHolder = _dereq_(143),
    replaceHolders = _dereq_(199);

/** Used to compose bitmasks for function metadata. */
var BIND_FLAG = 1,
    BIND_KEY_FLAG = 2,
    PARTIAL_FLAG = 32;

/**
 * Creates a function that invokes the method at `object[key]` with `partials`
 * prepended to the arguments it receives.
 *
 * This method differs from `_.bind` by allowing bound functions to reference
 * methods that may be redefined or don't yet exist. See
 * [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
 * for more details.
 *
 * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Function
 * @param {Object} object The object to invoke the method on.
 * @param {string} key The key of the method.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new bound function.
 * @example
 *
 * var object = {
 *   'user': 'fred',
 *   'greet': function(greeting, punctuation) {
 *     return greeting + ' ' + this.user + punctuation;
 *   }
 * };
 *
 * var bound = _.bindKey(object, 'greet', 'hi');
 * bound('!');
 * // => 'hi fred!'
 *
 * object.greet = function(greeting, punctuation) {
 *   return greeting + 'ya ' + this.user + punctuation;
 * };
 *
 * bound('!');
 * // => 'hiya fred!'
 *
 * // Bound with placeholders.
 * var bound = _.bindKey(object, 'greet', _, '!');
 * bound('hi');
 * // => 'hiya fred!'
 */
var bindKey = baseRest(function(object, key, partials) {
  var bitmask = BIND_FLAG | BIND_KEY_FLAG;
  if (partials.length) {
    var holders = replaceHolders(partials, getHolder(bindKey));
    bitmask |= PARTIAL_FLAG;
  }
  return createWrap(key, bitmask, object, partials, holders);
});

// Assign default placeholders.
bindKey.placeholder = {};

module.exports = bindKey;

},{"133":133,"143":143,"199":199,"92":92}],229:[function(_dereq_,module,exports){
var isArray = _dereq_(269);

/**
 * Casts `value` as an array if it's not one.
 *
 * @static
 * @memberOf _
 * @since 4.4.0
 * @category Lang
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast array.
 * @example
 *
 * _.castArray(1);
 * // => [1]
 *
 * _.castArray({ 'a': 1 });
 * // => [{ 'a': 1 }]
 *
 * _.castArray('abc');
 * // => ['abc']
 *
 * _.castArray(null);
 * // => [null]
 *
 * _.castArray(undefined);
 * // => [undefined]
 *
 * _.castArray();
 * // => []
 *
 * var array = [1, 2, 3];
 * console.log(_.castArray(array) === array);
 * // => true
 */
function castArray() {
  if (!arguments.length) {
    return [];
  }
  var value = arguments[0];
  return isArray(value) ? value : [value];
}

module.exports = castArray;

},{"269":269}],230:[function(_dereq_,module,exports){
var baseClone = _dereq_(46);

/**
 * Creates a shallow clone of `value`.
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
 * and supports cloning arrays, array buffers, booleans, date objects, maps,
 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
 * arrays. The own enumerable properties of `arguments` objects are cloned
 * as plain objects. An empty object is returned for uncloneable values such
 * as error objects, functions, DOM nodes, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to clone.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeep
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return baseClone(value, false, true);
}

module.exports = clone;

},{"46":46}],231:[function(_dereq_,module,exports){
var baseClone = _dereq_(46);

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, true, true);
}

module.exports = cloneDeep;

},{"46":46}],232:[function(_dereq_,module,exports){
var baseClone = _dereq_(46);

/**
 * This method is like `_.cloneWith` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @param {Function} [customizer] The function to customize cloning.
 * @returns {*} Returns the deep cloned value.
 * @see _.cloneWith
 * @example
 *
 * function customizer(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(true);
 *   }
 * }
 *
 * var el = _.cloneDeepWith(document.body, customizer);
 *
 * console.log(el === document.body);
 * // => false
 * console.log(el.nodeName);
 * // => 'BODY'
 * console.log(el.childNodes.length);
 * // => 20
 */
function cloneDeepWith(value, customizer) {
  return baseClone(value, true, true, customizer);
}

module.exports = cloneDeepWith;

},{"46":46}],233:[function(_dereq_,module,exports){
var baseClone = _dereq_(46);

/**
 * This method is like `_.clone` except that it accepts `customizer` which
 * is invoked to produce the cloned value. If `customizer` returns `undefined`,
 * cloning is handled by the method instead. The `customizer` is invoked with
 * up to four arguments; (value [, index|key, object, stack]).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to clone.
 * @param {Function} [customizer] The function to customize cloning.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeepWith
 * @example
 *
 * function customizer(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(false);
 *   }
 * }
 *
 * var el = _.cloneWith(document.body, customizer);
 *
 * console.log(el === document.body);
 * // => false
 * console.log(el.nodeName);
 * // => 'BODY'
 * console.log(el.childNodes.length);
 * // => 0
 */
function cloneWith(value, customizer) {
  return baseClone(value, false, true, customizer);
}

module.exports = cloneWith;

},{"46":46}],234:[function(_dereq_,module,exports){
var baseConformsTo = _dereq_(47),
    keys = _dereq_(305);

/**
 * Checks if `object` conforms to `source` by invoking the predicate
 * properties of `source` with the corresponding property values of `object`.
 *
 * **Note:** This method is equivalent to `_.conforms` when `source` is
 * partially applied.
 *
 * @static
 * @memberOf _
 * @since 4.14.0
 * @category Lang
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property predicates to conform to.
 * @returns {boolean} Returns `true` if `object` conforms, else `false`.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 *
 * _.conformsTo(object, { 'b': function(n) { return n > 1; } });
 * // => true
 *
 * _.conformsTo(object, { 'b': function(n) { return n > 2; } });
 * // => false
 */
function conformsTo(object, source) {
  return source == null || baseConformsTo(object, source, keys(source));
}

module.exports = conformsTo;

},{"305":305,"47":47}],235:[function(_dereq_,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],236:[function(_dereq_,module,exports){
var baseAssign = _dereq_(43),
    baseCreate = _dereq_(48);

/**
 * Creates an object that inherits from the `prototype` object. If a
 * `properties` object is given, its own enumerable string keyed properties
 * are assigned to the created object.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Object
 * @param {Object} prototype The object to inherit from.
 * @param {Object} [properties] The properties to assign to the object.
 * @returns {Object} Returns the new object.
 * @example
 *
 * function Shape() {
 *   this.x = 0;
 *   this.y = 0;
 * }
 *
 * function Circle() {
 *   Shape.call(this);
 * }
 *
 * Circle.prototype = _.create(Shape.prototype, {
 *   'constructor': Circle
 * });
 *
 * var circle = new Circle;
 * circle instanceof Circle;
 * // => true
 *
 * circle instanceof Shape;
 * // => true
 */
function create(prototype, properties) {
  var result = baseCreate(prototype);
  return properties ? baseAssign(result, properties) : result;
}

module.exports = create;

},{"43":43,"48":48}],237:[function(_dereq_,module,exports){
var createWrap = _dereq_(133);

/** Used to compose bitmasks for function metadata. */
var CURRY_FLAG = 8;

/**
 * Creates a function that accepts arguments of `func` and either invokes
 * `func` returning its result, if at least `arity` number of arguments have
 * been provided, or returns a function that accepts the remaining `func`
 * arguments, and so on. The arity of `func` may be specified if `func.length`
 * is not sufficient.
 *
 * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
 * may be used as a placeholder for provided arguments.
 *
 * **Note:** This method doesn't set the "length" property of curried functions.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Function
 * @param {Function} func The function to curry.
 * @param {number} [arity=func.length] The arity of `func`.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Function} Returns the new curried function.
 * @example
 *
 * var abc = function(a, b, c) {
 *   return [a, b, c];
 * };
 *
 * var curried = _.curry(abc);
 *
 * curried(1)(2)(3);
 * // => [1, 2, 3]
 *
 * curried(1, 2)(3);
 * // => [1, 2, 3]
 *
 * curried(1, 2, 3);
 * // => [1, 2, 3]
 *
 * // Curried with placeholders.
 * curried(1)(_, 3)(2);
 * // => [1, 2, 3]
 */
function curry(func, arity, guard) {
  arity = guard ? undefined : arity;
  var result = createWrap(func, CURRY_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
  result.placeholder = curry.placeholder;
  return result;
}

// Assign default placeholders.
curry.placeholder = {};

module.exports = curry;

},{"133":133}],238:[function(_dereq_,module,exports){
var createWrap = _dereq_(133);

/** Used to compose bitmasks for function metadata. */
var CURRY_RIGHT_FLAG = 16;

/**
 * This method is like `_.curry` except that arguments are applied to `func`
 * in the manner of `_.partialRight` instead of `_.partial`.
 *
 * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for provided arguments.
 *
 * **Note:** This method doesn't set the "length" property of curried functions.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} func The function to curry.
 * @param {number} [arity=func.length] The arity of `func`.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Function} Returns the new curried function.
 * @example
 *
 * var abc = function(a, b, c) {
 *   return [a, b, c];
 * };
 *
 * var curried = _.curryRight(abc);
 *
 * curried(3)(2)(1);
 * // => [1, 2, 3]
 *
 * curried(2, 3)(1);
 * // => [1, 2, 3]
 *
 * curried(1, 2, 3);
 * // => [1, 2, 3]
 *
 * // Curried with placeholders.
 * curried(3)(1, _)(2);
 * // => [1, 2, 3]
 */
function curryRight(func, arity, guard) {
  arity = guard ? undefined : arity;
  var result = createWrap(func, CURRY_RIGHT_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
  result.placeholder = curryRight.placeholder;
  return result;
}

// Assign default placeholders.
curryRight.placeholder = {};

module.exports = curryRight;

},{"133":133}],239:[function(_dereq_,module,exports){
var isObject = _dereq_(293),
    now = _dereq_(318),
    toNumber = _dereq_(342);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;

},{"293":293,"318":318,"342":342}],240:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    assignInDefaults = _dereq_(39),
    assignInWith = _dereq_(223),
    baseRest = _dereq_(92);

/**
 * Assigns own and inherited enumerable string keyed properties of source
 * objects to the destination object for all destination properties that
 * resolve to `undefined`. Source objects are applied from left to right.
 * Once a property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaultsDeep
 * @example
 *
 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var defaults = baseRest(function(args) {
  args.push(undefined, assignInDefaults);
  return apply(assignInWith, undefined, args);
});

module.exports = defaults;

},{"223":223,"28":28,"39":39,"92":92}],241:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    baseRest = _dereq_(92),
    mergeDefaults = _dereq_(189),
    mergeWith = _dereq_(315);

/**
 * This method is like `_.defaults` except that it recursively assigns
 * default properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaults
 * @example
 *
 * _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
 * // => { 'a': { 'b': 2, 'c': 3 } }
 */
var defaultsDeep = baseRest(function(args) {
  args.push(undefined, mergeDefaults);
  return apply(mergeWith, undefined, args);
});

module.exports = defaultsDeep;

},{"189":189,"28":28,"315":315,"92":92}],242:[function(_dereq_,module,exports){
var baseDelay = _dereq_(49),
    baseRest = _dereq_(92);

/**
 * Defers invoking the `func` until the current call stack has cleared. Any
 * additional arguments are provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to defer.
 * @param {...*} [args] The arguments to invoke `func` with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.defer(function(text) {
 *   console.log(text);
 * }, 'deferred');
 * // => Logs 'deferred' after one or more milliseconds.
 */
var defer = baseRest(function(func, args) {
  return baseDelay(func, 1, args);
});

module.exports = defer;

},{"49":49,"92":92}],243:[function(_dereq_,module,exports){
var baseDelay = _dereq_(49),
    baseRest = _dereq_(92),
    toNumber = _dereq_(342);

/**
 * Invokes `func` after `wait` milliseconds. Any additional arguments are
 * provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {...*} [args] The arguments to invoke `func` with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.delay(function(text) {
 *   console.log(text);
 * }, 1000, 'later');
 * // => Logs 'later' after one second.
 */
var delay = baseRest(function(func, wait, args) {
  return baseDelay(func, toNumber(wait) || 0, args);
});

module.exports = delay;

},{"342":342,"49":49,"92":92}],244:[function(_dereq_,module,exports){
module.exports = _dereq_(343);

},{"343":343}],245:[function(_dereq_,module,exports){
module.exports = _dereq_(344);

},{"344":344}],246:[function(_dereq_,module,exports){
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;

},{}],247:[function(_dereq_,module,exports){
module.exports = _dereq_(222);

},{"222":222}],248:[function(_dereq_,module,exports){
module.exports = _dereq_(223);

},{"223":223}],249:[function(_dereq_,module,exports){
var baseFindKey = _dereq_(52),
    baseForOwn = _dereq_(55),
    baseIteratee = _dereq_(79);

/**
 * This method is like `_.find` except that it returns the key of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Object
 * @param {Object} object The object to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {string|undefined} Returns the key of the matched element,
 *  else `undefined`.
 * @example
 *
 * var users = {
 *   'barney':  { 'age': 36, 'active': true },
 *   'fred':    { 'age': 40, 'active': false },
 *   'pebbles': { 'age': 1,  'active': true }
 * };
 *
 * _.findKey(users, function(o) { return o.age < 40; });
 * // => 'barney' (iteration order is not guaranteed)
 *
 * // The `_.matches` iteratee shorthand.
 * _.findKey(users, { 'age': 1, 'active': true });
 * // => 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findKey(users, ['active', false]);
 * // => 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.findKey(users, 'active');
 * // => 'barney'
 */
function findKey(object, predicate) {
  return baseFindKey(object, baseIteratee(predicate, 3), baseForOwn);
}

module.exports = findKey;

},{"52":52,"55":55,"79":79}],250:[function(_dereq_,module,exports){
var baseFindKey = _dereq_(52),
    baseForOwnRight = _dereq_(56),
    baseIteratee = _dereq_(79);

/**
 * This method is like `_.findKey` except that it iterates over elements of
 * a collection in the opposite order.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Object
 * @param {Object} object The object to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {string|undefined} Returns the key of the matched element,
 *  else `undefined`.
 * @example
 *
 * var users = {
 *   'barney':  { 'age': 36, 'active': true },
 *   'fred':    { 'age': 40, 'active': false },
 *   'pebbles': { 'age': 1,  'active': true }
 * };
 *
 * _.findLastKey(users, function(o) { return o.age < 40; });
 * // => returns 'pebbles' assuming `_.findKey` returns 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.findLastKey(users, { 'age': 36, 'active': true });
 * // => 'barney'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findLastKey(users, ['active', false]);
 * // => 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.findLastKey(users, 'active');
 * // => 'pebbles'
 */
function findLastKey(object, predicate) {
  return baseFindKey(object, baseIteratee(predicate, 3), baseForOwnRight);
}

module.exports = findLastKey;

},{"52":52,"56":56,"79":79}],251:[function(_dereq_,module,exports){
var createWrap = _dereq_(133);

/** Used to compose bitmasks for function metadata. */
var FLIP_FLAG = 512;

/**
 * Creates a function that invokes `func` with arguments reversed.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Function
 * @param {Function} func The function to flip arguments for.
 * @returns {Function} Returns the new flipped function.
 * @example
 *
 * var flipped = _.flip(function() {
 *   return _.toArray(arguments);
 * });
 *
 * flipped('a', 'b', 'c', 'd');
 * // => ['d', 'c', 'b', 'a']
 */
function flip(func) {
  return createWrap(func, FLIP_FLAG);
}

module.exports = flip;

},{"133":133}],252:[function(_dereq_,module,exports){
var baseFor = _dereq_(54),
    baseIteratee = _dereq_(79),
    keysIn = _dereq_(306);

/**
 * Iterates over own and inherited enumerable string keyed properties of an
 * object and invokes `iteratee` for each property. The iteratee is invoked
 * with three arguments: (value, key, object). Iteratee functions may exit
 * iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 0.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns `object`.
 * @see _.forInRight
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forIn(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a', 'b', then 'c' (iteration order is not guaranteed).
 */
function forIn(object, iteratee) {
  return object == null
    ? object
    : baseFor(object, baseIteratee(iteratee, 3), keysIn);
}

module.exports = forIn;

},{"306":306,"54":54,"79":79}],253:[function(_dereq_,module,exports){
var baseForRight = _dereq_(57),
    baseIteratee = _dereq_(79),
    keysIn = _dereq_(306);

/**
 * This method is like `_.forIn` except that it iterates over properties of
 * `object` in the opposite order.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns `object`.
 * @see _.forIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forInRight(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'c', 'b', then 'a' assuming `_.forIn` logs 'a', 'b', then 'c'.
 */
function forInRight(object, iteratee) {
  return object == null
    ? object
    : baseForRight(object, baseIteratee(iteratee, 3), keysIn);
}

module.exports = forInRight;

},{"306":306,"57":57,"79":79}],254:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(55),
    baseIteratee = _dereq_(79);

/**
 * Iterates over own enumerable string keyed properties of an object and
 * invokes `iteratee` for each property. The iteratee is invoked with three
 * arguments: (value, key, object). Iteratee functions may exit iteration
 * early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 0.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns `object`.
 * @see _.forOwnRight
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forOwn(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forOwn(object, iteratee) {
  return object && baseForOwn(object, baseIteratee(iteratee, 3));
}

module.exports = forOwn;

},{"55":55,"79":79}],255:[function(_dereq_,module,exports){
var baseForOwnRight = _dereq_(56),
    baseIteratee = _dereq_(79);

/**
 * This method is like `_.forOwn` except that it iterates over properties of
 * `object` in the opposite order.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns `object`.
 * @see _.forOwn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forOwnRight(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'b' then 'a' assuming `_.forOwn` logs 'a' then 'b'.
 */
function forOwnRight(object, iteratee) {
  return object && baseForOwnRight(object, baseIteratee(iteratee, 3));
}

module.exports = forOwnRight;

},{"56":56,"79":79}],256:[function(_dereq_,module,exports){
module.exports = {
  'after': _dereq_(219),
  'ary': _dereq_(220),
  'before': _dereq_(226),
  'bind': _dereq_(227),
  'bindKey': _dereq_(228),
  'curry': _dereq_(237),
  'curryRight': _dereq_(238),
  'debounce': _dereq_(239),
  'defer': _dereq_(242),
  'delay': _dereq_(243),
  'flip': _dereq_(251),
  'memoize': _dereq_(313),
  'negate': _dereq_(316),
  'once': _dereq_(322),
  'overArgs': _dereq_(323),
  'partial': _dereq_(324),
  'partialRight': _dereq_(325),
  'rearg': _dereq_(329),
  'rest': _dereq_(330),
  'spread': _dereq_(334),
  'throttle': _dereq_(337),
  'unary': _dereq_(349),
  'wrap': _dereq_(355)
};

},{"219":219,"220":220,"226":226,"227":227,"228":228,"237":237,"238":238,"239":239,"242":242,"243":243,"251":251,"313":313,"316":316,"322":322,"323":323,"324":324,"325":325,"329":329,"330":330,"334":334,"337":337,"349":349,"355":355}],257:[function(_dereq_,module,exports){
var baseFunctions = _dereq_(58),
    keys = _dereq_(305);

/**
 * Creates an array of function property names from own enumerable properties
 * of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the function names.
 * @see _.functionsIn
 * @example
 *
 * function Foo() {
 *   this.a = _.constant('a');
 *   this.b = _.constant('b');
 * }
 *
 * Foo.prototype.c = _.constant('c');
 *
 * _.functions(new Foo);
 * // => ['a', 'b']
 */
function functions(object) {
  return object == null ? [] : baseFunctions(object, keys(object));
}

module.exports = functions;

},{"305":305,"58":58}],258:[function(_dereq_,module,exports){
var baseFunctions = _dereq_(58),
    keysIn = _dereq_(306);

/**
 * Creates an array of function property names from own and inherited
 * enumerable properties of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the function names.
 * @see _.functions
 * @example
 *
 * function Foo() {
 *   this.a = _.constant('a');
 *   this.b = _.constant('b');
 * }
 *
 * Foo.prototype.c = _.constant('c');
 *
 * _.functionsIn(new Foo);
 * // => ['a', 'b', 'c']
 */
function functionsIn(object) {
  return object == null ? [] : baseFunctions(object, keysIn(object));
}

module.exports = functionsIn;

},{"306":306,"58":58}],259:[function(_dereq_,module,exports){
var baseGet = _dereq_(59);

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"59":59}],260:[function(_dereq_,module,exports){
var baseGt = _dereq_(62),
    createRelationalOperation = _dereq_(131);

/**
 * Checks if `value` is greater than `other`.
 *
 * @static
 * @memberOf _
 * @since 3.9.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is greater than `other`,
 *  else `false`.
 * @see _.lt
 * @example
 *
 * _.gt(3, 1);
 * // => true
 *
 * _.gt(3, 3);
 * // => false
 *
 * _.gt(1, 3);
 * // => false
 */
var gt = createRelationalOperation(baseGt);

module.exports = gt;

},{"131":131,"62":62}],261:[function(_dereq_,module,exports){
var createRelationalOperation = _dereq_(131);

/**
 * Checks if `value` is greater than or equal to `other`.
 *
 * @static
 * @memberOf _
 * @since 3.9.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is greater than or equal to
 *  `other`, else `false`.
 * @see _.lte
 * @example
 *
 * _.gte(3, 1);
 * // => true
 *
 * _.gte(3, 3);
 * // => true
 *
 * _.gte(1, 3);
 * // => false
 */
var gte = createRelationalOperation(function(value, other) {
  return value >= other;
});

module.exports = gte;

},{"131":131}],262:[function(_dereq_,module,exports){
var baseHas = _dereq_(63),
    hasPath = _dereq_(153);

/**
 * Checks if `path` is a direct property of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': 2 } };
 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b');
 * // => true
 *
 * _.has(object, ['a', 'b']);
 * // => true
 *
 * _.has(other, 'a');
 * // => false
 */
function has(object, path) {
  return object != null && hasPath(object, path, baseHas);
}

module.exports = has;

},{"153":153,"63":63}],263:[function(_dereq_,module,exports){
var baseHasIn = _dereq_(64),
    hasPath = _dereq_(153);

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

module.exports = hasIn;

},{"153":153,"64":64}],264:[function(_dereq_,module,exports){
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],265:[function(_dereq_,module,exports){
var constant = _dereq_(235),
    createInverter = _dereq_(128),
    identity = _dereq_(264);

/**
 * Creates an object composed of the inverted keys and values of `object`.
 * If `object` contains duplicate values, subsequent values overwrite
 * property assignments of previous values.
 *
 * @static
 * @memberOf _
 * @since 0.7.0
 * @category Object
 * @param {Object} object The object to invert.
 * @returns {Object} Returns the new inverted object.
 * @example
 *
 * var object = { 'a': 1, 'b': 2, 'c': 1 };
 *
 * _.invert(object);
 * // => { '1': 'c', '2': 'b' }
 */
var invert = createInverter(function(result, value, key) {
  result[value] = key;
}, constant(identity));

module.exports = invert;

},{"128":128,"235":235,"264":264}],266:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    createInverter = _dereq_(128);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * This method is like `_.invert` except that the inverted object is generated
 * from the results of running each element of `object` thru `iteratee`. The
 * corresponding inverted value of each inverted key is an array of keys
 * responsible for generating the inverted value. The iteratee is invoked
 * with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 4.1.0
 * @category Object
 * @param {Object} object The object to invert.
 * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
 * @returns {Object} Returns the new inverted object.
 * @example
 *
 * var object = { 'a': 1, 'b': 2, 'c': 1 };
 *
 * _.invertBy(object);
 * // => { '1': ['a', 'c'], '2': ['b'] }
 *
 * _.invertBy(object, function(value) {
 *   return 'group' + value;
 * });
 * // => { 'group1': ['a', 'c'], 'group2': ['b'] }
 */
var invertBy = createInverter(function(result, value, key) {
  if (hasOwnProperty.call(result, value)) {
    result[value].push(key);
  } else {
    result[value] = [key];
  }
}, baseIteratee);

module.exports = invertBy;

},{"128":128,"79":79}],267:[function(_dereq_,module,exports){
var baseInvoke = _dereq_(67),
    baseRest = _dereq_(92);

/**
 * Invokes the method at `path` of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the method to invoke.
 * @param {...*} [args] The arguments to invoke the method with.
 * @returns {*} Returns the result of the invoked method.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': [1, 2, 3, 4] } }] };
 *
 * _.invoke(object, 'a[0].b.c.slice', 1, 3);
 * // => [2, 3]
 */
var invoke = baseRest(baseInvoke);

module.exports = invoke;

},{"67":67,"92":92}],268:[function(_dereq_,module,exports){
var isArrayLikeObject = _dereq_(272);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

module.exports = isArguments;

},{"272":272}],269:[function(_dereq_,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],270:[function(_dereq_,module,exports){
var baseIsArrayBuffer = _dereq_(68),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer;

/**
 * Checks if `value` is classified as an `ArrayBuffer` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
 * @example
 *
 * _.isArrayBuffer(new ArrayBuffer(2));
 * // => true
 *
 * _.isArrayBuffer(new Array(2));
 * // => false
 */
var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;

module.exports = isArrayBuffer;

},{"194":194,"68":68,"99":99}],271:[function(_dereq_,module,exports){
var isFunction = _dereq_(282),
    isLength = _dereq_(284);

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

},{"282":282,"284":284}],272:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(271),
    isObjectLike = _dereq_(294);

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

module.exports = isArrayLikeObject;

},{"271":271,"294":294}],273:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var boolTag = '[object Boolean]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
 * @example
 *
 * _.isBoolean(false);
 * // => true
 *
 * _.isBoolean(null);
 * // => false
 */
function isBoolean(value) {
  return value === true || value === false ||
    (isObjectLike(value) && objectToString.call(value) == boolTag);
}

module.exports = isBoolean;

},{"294":294}],274:[function(_dereq_,module,exports){
var root = _dereq_(200),
    stubFalse = _dereq_(336);

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;

},{"200":200,"336":336}],275:[function(_dereq_,module,exports){
var baseIsDate = _dereq_(69),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsDate = nodeUtil && nodeUtil.isDate;

/**
 * Checks if `value` is classified as a `Date` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 * @example
 *
 * _.isDate(new Date);
 * // => true
 *
 * _.isDate('Mon April 23 2012');
 * // => false
 */
var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;

module.exports = isDate;

},{"194":194,"69":69,"99":99}],276:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294),
    isPlainObject = _dereq_(295);

/**
 * Checks if `value` is likely a DOM element.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
 * @example
 *
 * _.isElement(document.body);
 * // => true
 *
 * _.isElement('<body>');
 * // => false
 */
function isElement(value) {
  return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
}

module.exports = isElement;

},{"294":294,"295":295}],277:[function(_dereq_,module,exports){
var getTag = _dereq_(150),
    isArguments = _dereq_(268),
    isArray = _dereq_(269),
    isArrayLike = _dereq_(271),
    isBuffer = _dereq_(274),
    isPrototype = _dereq_(173),
    nativeKeys = _dereq_(192);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (isArrayLike(value) &&
      (isArray(value) || typeof value == 'string' ||
        typeof value.splice == 'function' || isBuffer(value) || isArguments(value))) {
    return !value.length;
  }
  var tag = getTag(value);
  if (tag == mapTag || tag == setTag) {
    return !value.size;
  }
  if (nonEnumShadows || isPrototype(value)) {
    return !nativeKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

module.exports = isEmpty;

},{"150":150,"173":173,"192":192,"268":268,"269":269,"271":271,"274":274}],278:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(70);

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are **not** supported.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

module.exports = isEqual;

},{"70":70}],279:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(70);

/**
 * This method is like `_.isEqual` except that it accepts `customizer` which
 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
 * are handled by the method instead. The `customizer` is invoked with up to
 * six arguments: (objValue, othValue [, index|key, object, other, stack]).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * function isGreeting(value) {
 *   return /^h(?:i|ello)$/.test(value);
 * }
 *
 * function customizer(objValue, othValue) {
 *   if (isGreeting(objValue) && isGreeting(othValue)) {
 *     return true;
 *   }
 * }
 *
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqualWith(array, other, customizer);
 * // => true
 */
function isEqualWith(value, other, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqualWith;

},{"70":70}],280:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var errorTag = '[object Error]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
 * `SyntaxError`, `TypeError`, or `URIError` object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
 * @example
 *
 * _.isError(new Error);
 * // => true
 *
 * _.isError(Error);
 * // => false
 */
function isError(value) {
  if (!isObjectLike(value)) {
    return false;
  }
  return (objectToString.call(value) == errorTag) ||
    (typeof value.message == 'string' && typeof value.name == 'string');
}

module.exports = isError;

},{"294":294}],281:[function(_dereq_,module,exports){
var root = _dereq_(200);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsFinite = root.isFinite;

/**
 * Checks if `value` is a finite primitive number.
 *
 * **Note:** This method is based on
 * [`Number.isFinite`](https://mdn.io/Number/isFinite).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
 * @example
 *
 * _.isFinite(3);
 * // => true
 *
 * _.isFinite(Number.MIN_VALUE);
 * // => true
 *
 * _.isFinite(Infinity);
 * // => false
 *
 * _.isFinite('3');
 * // => false
 */
function isFinite(value) {
  return typeof value == 'number' && nativeIsFinite(value);
}

module.exports = isFinite;

},{"200":200}],282:[function(_dereq_,module,exports){
var isObject = _dereq_(293);

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"293":293}],283:[function(_dereq_,module,exports){
var toInteger = _dereq_(340);

/**
 * Checks if `value` is an integer.
 *
 * **Note:** This method is based on
 * [`Number.isInteger`](https://mdn.io/Number/isInteger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an integer, else `false`.
 * @example
 *
 * _.isInteger(3);
 * // => true
 *
 * _.isInteger(Number.MIN_VALUE);
 * // => false
 *
 * _.isInteger(Infinity);
 * // => false
 *
 * _.isInteger('3');
 * // => false
 */
function isInteger(value) {
  return typeof value == 'number' && value == toInteger(value);
}

module.exports = isInteger;

},{"340":340}],284:[function(_dereq_,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],285:[function(_dereq_,module,exports){
var baseIsMap = _dereq_(72),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsMap = nodeUtil && nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

module.exports = isMap;

},{"194":194,"72":72,"99":99}],286:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(73),
    getMatchData = _dereq_(145);

/**
 * Performs a partial deep comparison between `object` and `source` to
 * determine if `object` contains equivalent property values.
 *
 * **Note:** This method is equivalent to `_.matches` when `source` is
 * partially applied.
 *
 * Partial comparisons will match empty array and empty object `source`
 * values against any array or object value, respectively. See `_.isEqual`
 * for a list of supported value comparisons.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 *
 * _.isMatch(object, { 'b': 2 });
 * // => true
 *
 * _.isMatch(object, { 'b': 1 });
 * // => false
 */
function isMatch(object, source) {
  return object === source || baseIsMatch(object, source, getMatchData(source));
}

module.exports = isMatch;

},{"145":145,"73":73}],287:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(73),
    getMatchData = _dereq_(145);

/**
 * This method is like `_.isMatch` except that it accepts `customizer` which
 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
 * are handled by the method instead. The `customizer` is invoked with five
 * arguments: (objValue, srcValue, index|key, object, source).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 * @example
 *
 * function isGreeting(value) {
 *   return /^h(?:i|ello)$/.test(value);
 * }
 *
 * function customizer(objValue, srcValue) {
 *   if (isGreeting(objValue) && isGreeting(srcValue)) {
 *     return true;
 *   }
 * }
 *
 * var object = { 'greeting': 'hello' };
 * var source = { 'greeting': 'hi' };
 *
 * _.isMatchWith(object, source, customizer);
 * // => true
 */
function isMatchWith(object, source, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  return baseIsMatch(object, source, getMatchData(source), customizer);
}

module.exports = isMatchWith;

},{"145":145,"73":73}],288:[function(_dereq_,module,exports){
var isNumber = _dereq_(292);

/**
 * Checks if `value` is `NaN`.
 *
 * **Note:** This method is based on
 * [`Number.isNaN`](https://mdn.io/Number/isNaN) and is not the same as
 * global [`isNaN`](https://mdn.io/isNaN) which returns `true` for
 * `undefined` and other non-number values.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 * @example
 *
 * _.isNaN(NaN);
 * // => true
 *
 * _.isNaN(new Number(NaN));
 * // => true
 *
 * isNaN(undefined);
 * // => true
 *
 * _.isNaN(undefined);
 * // => false
 */
function isNaN(value) {
  // An `NaN` primitive is the only value that is not equal to itself.
  // Perform the `toStringTag` check first to avoid errors with some
  // ActiveX objects in IE.
  return isNumber(value) && value != +value;
}

module.exports = isNaN;

},{"292":292}],289:[function(_dereq_,module,exports){
var baseIsNative = _dereq_(75),
    isMaskable = _dereq_(171);

/**
 * Checks if `value` is a pristine native function.
 *
 * **Note:** This method can't reliably detect native functions in the presence
 * of the core-js package because core-js circumvents this kind of detection.
 * Despite multiple requests, the core-js maintainer has made it clear: any
 * attempt to fix the detection will be obstructed. As a result, we're left
 * with little choice but to throw an error. Unfortunately, this also affects
 * packages, like [babel-polyfill](https://www.npmjs.com/package/babel-polyfill),
 * which rely on core-js.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (isMaskable(value)) {
    throw new Error('This method is not supported with core-js. Try https://github.com/es-shims.');
  }
  return baseIsNative(value);
}

module.exports = isNative;

},{"171":171,"75":75}],290:[function(_dereq_,module,exports){
/**
 * Checks if `value` is `null` or `undefined`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
 * @example
 *
 * _.isNil(null);
 * // => true
 *
 * _.isNil(void 0);
 * // => true
 *
 * _.isNil(NaN);
 * // => false
 */
function isNil(value) {
  return value == null;
}

module.exports = isNil;

},{}],291:[function(_dereq_,module,exports){
/**
 * Checks if `value` is `null`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
 * @example
 *
 * _.isNull(null);
 * // => true
 *
 * _.isNull(void 0);
 * // => false
 */
function isNull(value) {
  return value === null;
}

module.exports = isNull;

},{}],292:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
 * classified as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' ||
    (isObjectLike(value) && objectToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"294":294}],293:[function(_dereq_,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],294:[function(_dereq_,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],295:[function(_dereq_,module,exports){
var getPrototype = _dereq_(147),
    isHostObject = _dereq_(165),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) ||
      objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

module.exports = isPlainObject;

},{"147":147,"165":165,"294":294}],296:[function(_dereq_,module,exports){
var baseIsRegExp = _dereq_(76),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsRegExp = nodeUtil && nodeUtil.isRegExp;

/**
 * Checks if `value` is classified as a `RegExp` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
 * @example
 *
 * _.isRegExp(/abc/);
 * // => true
 *
 * _.isRegExp('/abc/');
 * // => false
 */
var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;

module.exports = isRegExp;

},{"194":194,"76":76,"99":99}],297:[function(_dereq_,module,exports){
var isInteger = _dereq_(283);

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a safe integer. An integer is safe if it's an IEEE-754
 * double precision number which isn't the result of a rounded unsafe integer.
 *
 * **Note:** This method is based on
 * [`Number.isSafeInteger`](https://mdn.io/Number/isSafeInteger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a safe integer, else `false`.
 * @example
 *
 * _.isSafeInteger(3);
 * // => true
 *
 * _.isSafeInteger(Number.MIN_VALUE);
 * // => false
 *
 * _.isSafeInteger(Infinity);
 * // => false
 *
 * _.isSafeInteger('3');
 * // => false
 */
function isSafeInteger(value) {
  return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
}

module.exports = isSafeInteger;

},{"283":283}],298:[function(_dereq_,module,exports){
var baseIsSet = _dereq_(77),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsSet = nodeUtil && nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

module.exports = isSet;

},{"194":194,"77":77,"99":99}],299:[function(_dereq_,module,exports){
var isArray = _dereq_(269),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
}

module.exports = isString;

},{"269":269,"294":294}],300:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

module.exports = isSymbol;

},{"294":294}],301:[function(_dereq_,module,exports){
var baseIsTypedArray = _dereq_(78),
    baseUnary = _dereq_(99),
    nodeUtil = _dereq_(194);

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;

},{"194":194,"78":78,"99":99}],302:[function(_dereq_,module,exports){
/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
  return value === undefined;
}

module.exports = isUndefined;

},{}],303:[function(_dereq_,module,exports){
var getTag = _dereq_(150),
    isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var weakMapTag = '[object WeakMap]';

/**
 * Checks if `value` is classified as a `WeakMap` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a weak map, else `false`.
 * @example
 *
 * _.isWeakMap(new WeakMap);
 * // => true
 *
 * _.isWeakMap(new Map);
 * // => false
 */
function isWeakMap(value) {
  return isObjectLike(value) && getTag(value) == weakMapTag;
}

module.exports = isWeakMap;

},{"150":150,"294":294}],304:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(294);

/** `Object#toString` result references. */
var weakSetTag = '[object WeakSet]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `WeakSet` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a weak set, else `false`.
 * @example
 *
 * _.isWeakSet(new WeakSet);
 * // => true
 *
 * _.isWeakSet(new Set);
 * // => false
 */
function isWeakSet(value) {
  return isObjectLike(value) && objectToString.call(value) == weakSetTag;
}

module.exports = isWeakSet;

},{"294":294}],305:[function(_dereq_,module,exports){
var arrayLikeKeys = _dereq_(33),
    baseKeys = _dereq_(80),
    isArrayLike = _dereq_(271);

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

},{"271":271,"33":33,"80":80}],306:[function(_dereq_,module,exports){
var arrayLikeKeys = _dereq_(33),
    baseKeysIn = _dereq_(81),
    isArrayLike = _dereq_(271);

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;

},{"271":271,"33":33,"81":81}],307:[function(_dereq_,module,exports){
module.exports = {
  'castArray': _dereq_(229),
  'clone': _dereq_(230),
  'cloneDeep': _dereq_(231),
  'cloneDeepWith': _dereq_(232),
  'cloneWith': _dereq_(233),
  'conformsTo': _dereq_(234),
  'eq': _dereq_(246),
  'gt': _dereq_(260),
  'gte': _dereq_(261),
  'isArguments': _dereq_(268),
  'isArray': _dereq_(269),
  'isArrayBuffer': _dereq_(270),
  'isArrayLike': _dereq_(271),
  'isArrayLikeObject': _dereq_(272),
  'isBoolean': _dereq_(273),
  'isBuffer': _dereq_(274),
  'isDate': _dereq_(275),
  'isElement': _dereq_(276),
  'isEmpty': _dereq_(277),
  'isEqual': _dereq_(278),
  'isEqualWith': _dereq_(279),
  'isError': _dereq_(280),
  'isFinite': _dereq_(281),
  'isFunction': _dereq_(282),
  'isInteger': _dereq_(283),
  'isLength': _dereq_(284),
  'isMap': _dereq_(285),
  'isMatch': _dereq_(286),
  'isMatchWith': _dereq_(287),
  'isNaN': _dereq_(288),
  'isNative': _dereq_(289),
  'isNil': _dereq_(290),
  'isNull': _dereq_(291),
  'isNumber': _dereq_(292),
  'isObject': _dereq_(293),
  'isObjectLike': _dereq_(294),
  'isPlainObject': _dereq_(295),
  'isRegExp': _dereq_(296),
  'isSafeInteger': _dereq_(297),
  'isSet': _dereq_(298),
  'isString': _dereq_(299),
  'isSymbol': _dereq_(300),
  'isTypedArray': _dereq_(301),
  'isUndefined': _dereq_(302),
  'isWeakMap': _dereq_(303),
  'isWeakSet': _dereq_(304),
  'lt': _dereq_(309),
  'lte': _dereq_(310),
  'toArray': _dereq_(338),
  'toFinite': _dereq_(339),
  'toInteger': _dereq_(340),
  'toLength': _dereq_(341),
  'toNumber': _dereq_(342),
  'toPlainObject': _dereq_(345),
  'toSafeInteger': _dereq_(346),
  'toString': _dereq_(347)
};

},{"229":229,"230":230,"231":231,"232":232,"233":233,"234":234,"246":246,"260":260,"261":261,"268":268,"269":269,"270":270,"271":271,"272":272,"273":273,"274":274,"275":275,"276":276,"277":277,"278":278,"279":279,"280":280,"281":281,"282":282,"283":283,"284":284,"285":285,"286":286,"287":287,"288":288,"289":289,"290":290,"291":291,"292":292,"293":293,"294":294,"295":295,"296":296,"297":297,"298":298,"299":299,"300":300,"301":301,"302":302,"303":303,"304":304,"309":309,"310":310,"338":338,"339":339,"340":340,"341":341,"342":342,"345":345,"346":346,"347":347}],308:[function(_dereq_,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],309:[function(_dereq_,module,exports){
var baseLt = _dereq_(83),
    createRelationalOperation = _dereq_(131);

/**
 * Checks if `value` is less than `other`.
 *
 * @static
 * @memberOf _
 * @since 3.9.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is less than `other`,
 *  else `false`.
 * @see _.gt
 * @example
 *
 * _.lt(1, 3);
 * // => true
 *
 * _.lt(3, 3);
 * // => false
 *
 * _.lt(3, 1);
 * // => false
 */
var lt = createRelationalOperation(baseLt);

module.exports = lt;

},{"131":131,"83":83}],310:[function(_dereq_,module,exports){
var createRelationalOperation = _dereq_(131);

/**
 * Checks if `value` is less than or equal to `other`.
 *
 * @static
 * @memberOf _
 * @since 3.9.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is less than or equal to
 *  `other`, else `false`.
 * @see _.gte
 * @example
 *
 * _.lte(1, 3);
 * // => true
 *
 * _.lte(3, 3);
 * // => true
 *
 * _.lte(3, 1);
 * // => false
 */
var lte = createRelationalOperation(function(value, other) {
  return value <= other;
});

module.exports = lte;

},{"131":131}],311:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(55),
    baseIteratee = _dereq_(79);

/**
 * The opposite of `_.mapValues`; this method creates an object with the
 * same values as `object` and keys generated by running each own enumerable
 * string keyed property of `object` thru `iteratee`. The iteratee is invoked
 * with three arguments: (value, key, object).
 *
 * @static
 * @memberOf _
 * @since 3.8.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns the new mapped object.
 * @see _.mapValues
 * @example
 *
 * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
 *   return key + value;
 * });
 * // => { 'a1': 1, 'b2': 2 }
 */
function mapKeys(object, iteratee) {
  var result = {};
  iteratee = baseIteratee(iteratee, 3);

  baseForOwn(object, function(value, key, object) {
    result[iteratee(value, key, object)] = value;
  });
  return result;
}

module.exports = mapKeys;

},{"55":55,"79":79}],312:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(55),
    baseIteratee = _dereq_(79);

/**
 * Creates an object with the same keys as `object` and values generated
 * by running each own enumerable string keyed property of `object` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, key, object).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns the new mapped object.
 * @see _.mapKeys
 * @example
 *
 * var users = {
 *   'fred':    { 'user': 'fred',    'age': 40 },
 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
 * };
 *
 * _.mapValues(users, function(o) { return o.age; });
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 *
 * // The `_.property` iteratee shorthand.
 * _.mapValues(users, 'age');
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 */
function mapValues(object, iteratee) {
  var result = {};
  iteratee = baseIteratee(iteratee, 3);

  baseForOwn(object, function(value, key, object) {
    result[key] = iteratee(value, key, object);
  });
  return result;
}

module.exports = mapValues;

},{"55":55,"79":79}],313:[function(_dereq_,module,exports){
var MapCache = _dereq_(18);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"18":18}],314:[function(_dereq_,module,exports){
var baseMerge = _dereq_(86),
    createAssigner = _dereq_(122);

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

module.exports = merge;

},{"122":122,"86":86}],315:[function(_dereq_,module,exports){
var baseMerge = _dereq_(86),
    createAssigner = _dereq_(122);

/**
 * This method is like `_.merge` except that it accepts `customizer` which
 * is invoked to produce the merged values of the destination and source
 * properties. If `customizer` returns `undefined`, merging is handled by the
 * method instead. The `customizer` is invoked with seven arguments:
 * (objValue, srcValue, key, object, source, stack).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   if (_.isArray(objValue)) {
 *     return objValue.concat(srcValue);
 *   }
 * }
 *
 * var object = { 'a': [1], 'b': [2] };
 * var other = { 'a': [3], 'b': [4] };
 *
 * _.mergeWith(object, other, customizer);
 * // => { 'a': [1, 3], 'b': [2, 4] }
 */
var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});

module.exports = mergeWith;

},{"122":122,"86":86}],316:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that negates the result of the predicate `func`. The
 * `func` predicate is invoked with the `this` binding and arguments of the
 * created function.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} predicate The predicate to negate.
 * @returns {Function} Returns the new negated function.
 * @example
 *
 * function isEven(n) {
 *   return n % 2 == 0;
 * }
 *
 * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
 * // => [1, 3, 5]
 */
function negate(predicate) {
  if (typeof predicate != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return function() {
    var args = arguments;
    switch (args.length) {
      case 0: return !predicate.call(this);
      case 1: return !predicate.call(this, args[0]);
      case 2: return !predicate.call(this, args[0], args[1]);
      case 3: return !predicate.call(this, args[0], args[1], args[2]);
    }
    return !predicate.apply(this, args);
  };
}

module.exports = negate;

},{}],317:[function(_dereq_,module,exports){
/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

module.exports = noop;

},{}],318:[function(_dereq_,module,exports){
var root = _dereq_(200);

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;

},{"200":200}],319:[function(_dereq_,module,exports){
module.exports = {
  'assign': _dereq_(221),
  'assignIn': _dereq_(222),
  'assignInWith': _dereq_(223),
  'assignWith': _dereq_(224),
  'at': _dereq_(225),
  'create': _dereq_(236),
  'defaults': _dereq_(240),
  'defaultsDeep': _dereq_(241),
  'entries': _dereq_(244),
  'entriesIn': _dereq_(245),
  'extend': _dereq_(247),
  'extendWith': _dereq_(248),
  'findKey': _dereq_(249),
  'findLastKey': _dereq_(250),
  'forIn': _dereq_(252),
  'forInRight': _dereq_(253),
  'forOwn': _dereq_(254),
  'forOwnRight': _dereq_(255),
  'functions': _dereq_(257),
  'functionsIn': _dereq_(258),
  'get': _dereq_(259),
  'has': _dereq_(262),
  'hasIn': _dereq_(263),
  'invert': _dereq_(265),
  'invertBy': _dereq_(266),
  'invoke': _dereq_(267),
  'keys': _dereq_(305),
  'keysIn': _dereq_(306),
  'mapKeys': _dereq_(311),
  'mapValues': _dereq_(312),
  'merge': _dereq_(314),
  'mergeWith': _dereq_(315),
  'omit': _dereq_(320),
  'omitBy': _dereq_(321),
  'pick': _dereq_(326),
  'pickBy': _dereq_(327),
  'result': _dereq_(331),
  'set': _dereq_(332),
  'setWith': _dereq_(333),
  'toPairs': _dereq_(343),
  'toPairsIn': _dereq_(344),
  'transform': _dereq_(348),
  'unset': _dereq_(350),
  'update': _dereq_(351),
  'updateWith': _dereq_(352),
  'values': _dereq_(353),
  'valuesIn': _dereq_(354)
};

},{"221":221,"222":222,"223":223,"224":224,"225":225,"236":236,"240":240,"241":241,"244":244,"245":245,"247":247,"248":248,"249":249,"250":250,"252":252,"253":253,"254":254,"255":255,"257":257,"258":258,"259":259,"262":262,"263":263,"265":265,"266":266,"267":267,"305":305,"306":306,"311":311,"312":312,"314":314,"315":315,"320":320,"321":321,"326":326,"327":327,"331":331,"332":332,"333":333,"343":343,"344":344,"348":348,"350":350,"351":351,"352":352,"353":353,"354":354}],320:[function(_dereq_,module,exports){
var arrayMap = _dereq_(34),
    baseDifference = _dereq_(50),
    baseFlatten = _dereq_(53),
    basePick = _dereq_(88),
    baseRest = _dereq_(92),
    getAllKeysIn = _dereq_(140),
    toKey = _dereq_(214);

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable string keyed properties of `object` that are
 * not omitted.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [props] The property identifiers to omit.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omit(object, ['a', 'c']);
 * // => { 'b': '2' }
 */
var omit = baseRest(function(object, props) {
  if (object == null) {
    return {};
  }
  props = arrayMap(baseFlatten(props, 1), toKey);
  return basePick(object, baseDifference(getAllKeysIn(object), props));
});

module.exports = omit;

},{"140":140,"214":214,"34":34,"50":50,"53":53,"88":88,"92":92}],321:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    negate = _dereq_(316),
    pickBy = _dereq_(327);

/**
 * The opposite of `_.pickBy`; this method creates an object composed of
 * the own and inherited enumerable string keyed properties of `object` that
 * `predicate` doesn't return truthy for. The predicate is invoked with two
 * arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omitBy(object, _.isNumber);
 * // => { 'b': '2' }
 */
function omitBy(object, predicate) {
  return pickBy(object, negate(baseIteratee(predicate)));
}

module.exports = omitBy;

},{"316":316,"327":327,"79":79}],322:[function(_dereq_,module,exports){
var before = _dereq_(226);

/**
 * Creates a function that is restricted to invoking `func` once. Repeat calls
 * to the function return the value of the first invocation. The `func` is
 * invoked with the `this` binding and arguments of the created function.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * var initialize = _.once(createApplication);
 * initialize();
 * initialize();
 * // => `createApplication` is invoked once
 */
function once(func) {
  return before(2, func);
}

module.exports = once;

},{"226":226}],323:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    arrayMap = _dereq_(34),
    baseFlatten = _dereq_(53),
    baseIteratee = _dereq_(79),
    baseRest = _dereq_(92),
    baseUnary = _dereq_(99),
    isArray = _dereq_(269);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Creates a function that invokes `func` with its arguments transformed.
 *
 * @static
 * @since 4.0.0
 * @memberOf _
 * @category Function
 * @param {Function} func The function to wrap.
 * @param {...(Function|Function[])} [transforms=[_.identity]]
 *  The argument transforms.
 * @returns {Function} Returns the new function.
 * @example
 *
 * function doubled(n) {
 *   return n * 2;
 * }
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var func = _.overArgs(function(x, y) {
 *   return [x, y];
 * }, [square, doubled]);
 *
 * func(9, 3);
 * // => [81, 6]
 *
 * func(10, 5);
 * // => [100, 10]
 */
var overArgs = baseRest(function(func, transforms) {
  transforms = (transforms.length == 1 && isArray(transforms[0]))
    ? arrayMap(transforms[0], baseUnary(baseIteratee))
    : arrayMap(baseFlatten(transforms, 1), baseUnary(baseIteratee));

  var funcsLength = transforms.length;
  return baseRest(function(args) {
    var index = -1,
        length = nativeMin(args.length, funcsLength);

    while (++index < length) {
      args[index] = transforms[index].call(this, args[index]);
    }
    return apply(func, this, args);
  });
});

module.exports = overArgs;

},{"269":269,"28":28,"34":34,"53":53,"79":79,"92":92,"99":99}],324:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    createWrap = _dereq_(133),
    getHolder = _dereq_(143),
    replaceHolders = _dereq_(199);

/** Used to compose bitmasks for function metadata. */
var PARTIAL_FLAG = 32;

/**
 * Creates a function that invokes `func` with `partials` prepended to the
 * arguments it receives. This method is like `_.bind` except it does **not**
 * alter the `this` binding.
 *
 * The `_.partial.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * **Note:** This method doesn't set the "length" property of partially
 * applied functions.
 *
 * @static
 * @memberOf _
 * @since 0.2.0
 * @category Function
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new partially applied function.
 * @example
 *
 * function greet(greeting, name) {
 *   return greeting + ' ' + name;
 * }
 *
 * var sayHelloTo = _.partial(greet, 'hello');
 * sayHelloTo('fred');
 * // => 'hello fred'
 *
 * // Partially applied with placeholders.
 * var greetFred = _.partial(greet, _, 'fred');
 * greetFred('hi');
 * // => 'hi fred'
 */
var partial = baseRest(function(func, partials) {
  var holders = replaceHolders(partials, getHolder(partial));
  return createWrap(func, PARTIAL_FLAG, undefined, partials, holders);
});

// Assign default placeholders.
partial.placeholder = {};

module.exports = partial;

},{"133":133,"143":143,"199":199,"92":92}],325:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    createWrap = _dereq_(133),
    getHolder = _dereq_(143),
    replaceHolders = _dereq_(199);

/** Used to compose bitmasks for function metadata. */
var PARTIAL_RIGHT_FLAG = 64;

/**
 * This method is like `_.partial` except that partially applied arguments
 * are appended to the arguments it receives.
 *
 * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * **Note:** This method doesn't set the "length" property of partially
 * applied functions.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Function
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new partially applied function.
 * @example
 *
 * function greet(greeting, name) {
 *   return greeting + ' ' + name;
 * }
 *
 * var greetFred = _.partialRight(greet, 'fred');
 * greetFred('hi');
 * // => 'hi fred'
 *
 * // Partially applied with placeholders.
 * var sayHelloTo = _.partialRight(greet, 'hello', _);
 * sayHelloTo('fred');
 * // => 'hello fred'
 */
var partialRight = baseRest(function(func, partials) {
  var holders = replaceHolders(partials, getHolder(partialRight));
  return createWrap(func, PARTIAL_RIGHT_FLAG, undefined, partials, holders);
});

// Assign default placeholders.
partialRight.placeholder = {};

module.exports = partialRight;

},{"133":133,"143":143,"199":199,"92":92}],326:[function(_dereq_,module,exports){
var arrayMap = _dereq_(34),
    baseFlatten = _dereq_(53),
    basePick = _dereq_(88),
    baseRest = _dereq_(92),
    toKey = _dereq_(214);

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [props] The property identifiers to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */
var pick = baseRest(function(object, props) {
  return object == null ? {} : basePick(object, arrayMap(baseFlatten(props, 1), toKey));
});

module.exports = pick;

},{"214":214,"34":34,"53":53,"88":88,"92":92}],327:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    basePickBy = _dereq_(89),
    getAllKeysIn = _dereq_(140);

/**
 * Creates an object composed of the `object` properties `predicate` returns
 * truthy for. The predicate is invoked with two arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pickBy(object, _.isNumber);
 * // => { 'a': 1, 'c': 3 }
 */
function pickBy(object, predicate) {
  return object == null ? {} : basePickBy(object, getAllKeysIn(object), baseIteratee(predicate));
}

module.exports = pickBy;

},{"140":140,"79":79,"89":89}],328:[function(_dereq_,module,exports){
var baseProperty = _dereq_(90),
    basePropertyDeep = _dereq_(91),
    isKey = _dereq_(168),
    toKey = _dereq_(214);

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

},{"168":168,"214":214,"90":90,"91":91}],329:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(53),
    baseRest = _dereq_(92),
    createWrap = _dereq_(133);

/** Used to compose bitmasks for function metadata. */
var REARG_FLAG = 256;

/**
 * Creates a function that invokes `func` with arguments arranged according
 * to the specified `indexes` where the argument value at the first index is
 * provided as the first argument, the argument value at the second index is
 * provided as the second argument, and so on.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} func The function to rearrange arguments for.
 * @param {...(number|number[])} indexes The arranged argument indexes.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var rearged = _.rearg(function(a, b, c) {
 *   return [a, b, c];
 * }, [2, 0, 1]);
 *
 * rearged('b', 'c', 'a')
 * // => ['a', 'b', 'c']
 */
var rearg = baseRest(function(func, indexes) {
  return createWrap(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes, 1));
});

module.exports = rearg;

},{"133":133,"53":53,"92":92}],330:[function(_dereq_,module,exports){
var baseRest = _dereq_(92),
    toInteger = _dereq_(340);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as
 * an array.
 *
 * **Note:** This method is based on the
 * [rest parameter](https://mdn.io/rest_parameters).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.rest(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function rest(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = start === undefined ? start : toInteger(start);
  return baseRest(func, start);
}

module.exports = rest;

},{"340":340,"92":92}],331:[function(_dereq_,module,exports){
var castPath = _dereq_(105),
    isFunction = _dereq_(282),
    isKey = _dereq_(168),
    toKey = _dereq_(214);

/**
 * This method is like `_.get` except that if the resolved value is a
 * function it's invoked with the `this` binding of its parent object and
 * its result is returned.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to resolve.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
 *
 * _.result(object, 'a[0].b.c1');
 * // => 3
 *
 * _.result(object, 'a[0].b.c2');
 * // => 4
 *
 * _.result(object, 'a[0].b.c3', 'default');
 * // => 'default'
 *
 * _.result(object, 'a[0].b.c3', _.constant('default'));
 * // => 'default'
 */
function result(object, path, defaultValue) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length;

  // Ensure the loop is entered when path is empty.
  if (!length) {
    object = undefined;
    length = 1;
  }
  while (++index < length) {
    var value = object == null ? undefined : object[toKey(path[index])];
    if (value === undefined) {
      index = length;
      value = defaultValue;
    }
    object = isFunction(value) ? value.call(object) : value;
  }
  return object;
}

module.exports = result;

},{"105":105,"168":168,"214":214,"282":282}],332:[function(_dereq_,module,exports){
var baseSet = _dereq_(93);

/**
 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
 * it's created. Arrays are created for missing index properties while objects
 * are created for all other missing properties. Use `_.setWith` to customize
 * `path` creation.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.set(object, 'a[0].b.c', 4);
 * console.log(object.a[0].b.c);
 * // => 4
 *
 * _.set(object, ['x', '0', 'y', 'z'], 5);
 * console.log(object.x[0].y.z);
 * // => 5
 */
function set(object, path, value) {
  return object == null ? object : baseSet(object, path, value);
}

module.exports = set;

},{"93":93}],333:[function(_dereq_,module,exports){
var baseSet = _dereq_(93);

/**
 * This method is like `_.set` except that it accepts `customizer` which is
 * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
 * path creation is handled by the method instead. The `customizer` is invoked
 * with three arguments: (nsValue, key, nsObject).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {};
 *
 * _.setWith(object, '[0][1]', 'a', Object);
 * // => { '0': { '1': 'a' } }
 */
function setWith(object, path, value, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  return object == null ? object : baseSet(object, path, value, customizer);
}

module.exports = setWith;

},{"93":93}],334:[function(_dereq_,module,exports){
var apply = _dereq_(28),
    arrayPush = _dereq_(35),
    baseRest = _dereq_(92),
    castSlice = _dereq_(106),
    toInteger = _dereq_(340);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * create function and an array of arguments much like
 * [`Function#apply`](http://www.ecma-international.org/ecma-262/7.0/#sec-function.prototype.apply).
 *
 * **Note:** This method is based on the
 * [spread operator](https://mdn.io/spread_operator).
 *
 * @static
 * @memberOf _
 * @since 3.2.0
 * @category Function
 * @param {Function} func The function to spread arguments over.
 * @param {number} [start=0] The start position of the spread.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.spread(function(who, what) {
 *   return who + ' says ' + what;
 * });
 *
 * say(['fred', 'hello']);
 * // => 'fred says hello'
 *
 * var numbers = Promise.all([
 *   Promise.resolve(40),
 *   Promise.resolve(36)
 * ]);
 *
 * numbers.then(_.spread(function(x, y) {
 *   return x + y;
 * }));
 * // => a Promise of 76
 */
function spread(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = start === undefined ? 0 : nativeMax(toInteger(start), 0);
  return baseRest(function(args) {
    var array = args[start],
        otherArgs = castSlice(args, 0, start);

    if (array) {
      arrayPush(otherArgs, array);
    }
    return apply(func, this, otherArgs);
  });
}

module.exports = spread;

},{"106":106,"28":28,"340":340,"35":35,"92":92}],335:[function(_dereq_,module,exports){
/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;

},{}],336:[function(_dereq_,module,exports){
/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;

},{}],337:[function(_dereq_,module,exports){
var debounce = _dereq_(239),
    isObject = _dereq_(293);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

module.exports = throttle;

},{"239":239,"293":293}],338:[function(_dereq_,module,exports){
var Symbol = _dereq_(23),
    copyArray = _dereq_(117),
    getTag = _dereq_(150),
    isArrayLike = _dereq_(271),
    isString = _dereq_(299),
    iteratorToArray = _dereq_(175),
    mapToArray = _dereq_(186),
    setToArray = _dereq_(204),
    stringToArray = _dereq_(212),
    values = _dereq_(353);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Built-in value references. */
var iteratorSymbol = Symbol ? Symbol.iterator : undefined;

/**
 * Converts `value` to an array.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Array} Returns the converted array.
 * @example
 *
 * _.toArray({ 'a': 1, 'b': 2 });
 * // => [1, 2]
 *
 * _.toArray('abc');
 * // => ['a', 'b', 'c']
 *
 * _.toArray(1);
 * // => []
 *
 * _.toArray(null);
 * // => []
 */
function toArray(value) {
  if (!value) {
    return [];
  }
  if (isArrayLike(value)) {
    return isString(value) ? stringToArray(value) : copyArray(value);
  }
  if (iteratorSymbol && value[iteratorSymbol]) {
    return iteratorToArray(value[iteratorSymbol]());
  }
  var tag = getTag(value),
      func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);

  return func(value);
}

module.exports = toArray;

},{"117":117,"150":150,"175":175,"186":186,"204":204,"212":212,"23":23,"271":271,"299":299,"353":353}],339:[function(_dereq_,module,exports){
var toNumber = _dereq_(342);

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

module.exports = toFinite;

},{"342":342}],340:[function(_dereq_,module,exports){
var toFinite = _dereq_(339);

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

module.exports = toInteger;

},{"339":339}],341:[function(_dereq_,module,exports){
var baseClamp = _dereq_(45),
    toInteger = _dereq_(340);

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Converts `value` to an integer suitable for use as the length of an
 * array-like object.
 *
 * **Note:** This method is based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toLength(3.2);
 * // => 3
 *
 * _.toLength(Number.MIN_VALUE);
 * // => 0
 *
 * _.toLength(Infinity);
 * // => 4294967295
 *
 * _.toLength('3.2');
 * // => 3
 */
function toLength(value) {
  return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
}

module.exports = toLength;

},{"340":340,"45":45}],342:[function(_dereq_,module,exports){
var isObject = _dereq_(293),
    isSymbol = _dereq_(300);

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"293":293,"300":300}],343:[function(_dereq_,module,exports){
var createToPairs = _dereq_(132),
    keys = _dereq_(305);

/**
 * Creates an array of own enumerable string keyed-value pairs for `object`
 * which can be consumed by `_.fromPairs`. If `object` is a map or set, its
 * entries are returned.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias entries
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the key-value pairs.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.toPairs(new Foo);
 * // => [['a', 1], ['b', 2]] (iteration order is not guaranteed)
 */
var toPairs = createToPairs(keys);

module.exports = toPairs;

},{"132":132,"305":305}],344:[function(_dereq_,module,exports){
var createToPairs = _dereq_(132),
    keysIn = _dereq_(306);

/**
 * Creates an array of own and inherited enumerable string keyed-value pairs
 * for `object` which can be consumed by `_.fromPairs`. If `object` is a map
 * or set, its entries are returned.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias entriesIn
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the key-value pairs.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.toPairsIn(new Foo);
 * // => [['a', 1], ['b', 2], ['c', 3]] (iteration order is not guaranteed)
 */
var toPairsIn = createToPairs(keysIn);

module.exports = toPairsIn;

},{"132":132,"306":306}],345:[function(_dereq_,module,exports){
var copyObject = _dereq_(118),
    keysIn = _dereq_(306);

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

module.exports = toPlainObject;

},{"118":118,"306":306}],346:[function(_dereq_,module,exports){
var baseClamp = _dereq_(45),
    toInteger = _dereq_(340);

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Converts `value` to a safe integer. A safe integer can be compared and
 * represented correctly.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toSafeInteger(3.2);
 * // => 3
 *
 * _.toSafeInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toSafeInteger(Infinity);
 * // => 9007199254740991
 *
 * _.toSafeInteger('3.2');
 * // => 3
 */
function toSafeInteger(value) {
  return baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
}

module.exports = toSafeInteger;

},{"340":340,"45":45}],347:[function(_dereq_,module,exports){
var baseToString = _dereq_(98);

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"98":98}],348:[function(_dereq_,module,exports){
var arrayEach = _dereq_(29),
    baseCreate = _dereq_(48),
    baseForOwn = _dereq_(55),
    baseIteratee = _dereq_(79),
    getPrototype = _dereq_(147),
    isArray = _dereq_(269),
    isFunction = _dereq_(282),
    isObject = _dereq_(293),
    isTypedArray = _dereq_(301);

/**
 * An alternative to `_.reduce`; this method transforms `object` to a new
 * `accumulator` object which is the result of running each of its own
 * enumerable string keyed properties thru `iteratee`, with each invocation
 * potentially mutating the `accumulator` object. If `accumulator` is not
 * provided, a new object with the same `[[Prototype]]` will be used. The
 * iteratee is invoked with four arguments: (accumulator, value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 1.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The custom accumulator value.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.transform([2, 3, 4], function(result, n) {
 *   result.push(n *= n);
 *   return n % 2 == 0;
 * }, []);
 * // => [4, 9]
 *
 * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] }
 */
function transform(object, iteratee, accumulator) {
  var isArr = isArray(object) || isTypedArray(object);
  iteratee = baseIteratee(iteratee, 4);

  if (accumulator == null) {
    if (isArr || isObject(object)) {
      var Ctor = object.constructor;
      if (isArr) {
        accumulator = isArray(object) ? new Ctor : [];
      } else {
        accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
      }
    } else {
      accumulator = {};
    }
  }
  (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
    return iteratee(accumulator, value, index, object);
  });
  return accumulator;
}

module.exports = transform;

},{"147":147,"269":269,"282":282,"29":29,"293":293,"301":301,"48":48,"55":55,"79":79}],349:[function(_dereq_,module,exports){
var ary = _dereq_(220);

/**
 * Creates a function that accepts up to one argument, ignoring any
 * additional arguments.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Function
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 * @example
 *
 * _.map(['6', '8', '10'], _.unary(parseInt));
 * // => [6, 8, 10]
 */
function unary(func) {
  return ary(func, 1);
}

module.exports = unary;

},{"220":220}],350:[function(_dereq_,module,exports){
var baseUnset = _dereq_(100);

/**
 * Removes the property at `path` of `object`.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 7 } }] };
 * _.unset(object, 'a[0].b.c');
 * // => true
 *
 * console.log(object);
 * // => { 'a': [{ 'b': {} }] };
 *
 * _.unset(object, ['a', '0', 'b', 'c']);
 * // => true
 *
 * console.log(object);
 * // => { 'a': [{ 'b': {} }] };
 */
function unset(object, path) {
  return object == null ? true : baseUnset(object, path);
}

module.exports = unset;

},{"100":100}],351:[function(_dereq_,module,exports){
var baseUpdate = _dereq_(101),
    castFunction = _dereq_(104);

/**
 * This method is like `_.set` except that accepts `updater` to produce the
 * value to set. Use `_.updateWith` to customize `path` creation. The `updater`
 * is invoked with one argument: (value).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.6.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {Function} updater The function to produce the updated value.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.update(object, 'a[0].b.c', function(n) { return n * n; });
 * console.log(object.a[0].b.c);
 * // => 9
 *
 * _.update(object, 'x[0].y.z', function(n) { return n ? n + 1 : 0; });
 * console.log(object.x[0].y.z);
 * // => 0
 */
function update(object, path, updater) {
  return object == null ? object : baseUpdate(object, path, castFunction(updater));
}

module.exports = update;

},{"101":101,"104":104}],352:[function(_dereq_,module,exports){
var baseUpdate = _dereq_(101),
    castFunction = _dereq_(104);

/**
 * This method is like `_.update` except that it accepts `customizer` which is
 * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
 * path creation is handled by the method instead. The `customizer` is invoked
 * with three arguments: (nsValue, key, nsObject).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.6.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {Function} updater The function to produce the updated value.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {};
 *
 * _.updateWith(object, '[0][1]', _.constant('a'), Object);
 * // => { '0': { '1': 'a' } }
 */
function updateWith(object, path, updater, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
}

module.exports = updateWith;

},{"101":101,"104":104}],353:[function(_dereq_,module,exports){
var baseValues = _dereq_(102),
    keys = _dereq_(305);

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object ? baseValues(object, keys(object)) : [];
}

module.exports = values;

},{"102":102,"305":305}],354:[function(_dereq_,module,exports){
var baseValues = _dereq_(102),
    keysIn = _dereq_(306);

/**
 * Creates an array of the own and inherited enumerable string keyed property
 * values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.valuesIn(new Foo);
 * // => [1, 2, 3] (iteration order is not guaranteed)
 */
function valuesIn(object) {
  return object == null ? [] : baseValues(object, keysIn(object));
}

module.exports = valuesIn;

},{"102":102,"306":306}],355:[function(_dereq_,module,exports){
var identity = _dereq_(264),
    partial = _dereq_(324);

/**
 * Creates a function that provides `value` to `wrapper` as its first
 * argument. Any additional arguments provided to the function are appended
 * to those provided to the `wrapper`. The wrapper is invoked with the `this`
 * binding of the created function.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {*} value The value to wrap.
 * @param {Function} [wrapper=identity] The wrapper function.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var p = _.wrap(_.escape, function(func, text) {
 *   return '<p>' + func(text) + '</p>';
 * });
 *
 * p('fred, barney, & pebbles');
 * // => '<p>fred, barney, &amp; pebbles</p>'
 */
function wrap(value, wrapper) {
  wrapper = wrapper == null ? identity : wrapper;
  return partial(wrapper, value);
}

module.exports = wrap;

},{"264":264,"324":324}],356:[function(_dereq_,module,exports){
var LazyWrapper = _dereq_(14),
    LodashWrapper = _dereq_(16),
    baseLodash = _dereq_(82),
    isArray = _dereq_(269),
    isObjectLike = _dereq_(294),
    wrapperClone = _dereq_(218);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates a `lodash` object which wraps `value` to enable implicit method
 * chain sequences. Methods that operate on and return arrays, collections,
 * and functions can be chained together. Methods that retrieve a single value
 * or may return a primitive value will automatically end the chain sequence
 * and return the unwrapped value. Otherwise, the value must be unwrapped
 * with `_#value`.
 *
 * Explicit chain sequences, which must be unwrapped with `_#value`, may be
 * enabled using `_.chain`.
 *
 * The execution of chained methods is lazy, that is, it's deferred until
 * `_#value` is implicitly or explicitly called.
 *
 * Lazy evaluation allows several methods to support shortcut fusion.
 * Shortcut fusion is an optimization to merge iteratee calls; this avoids
 * the creation of intermediate arrays and can greatly reduce the number of
 * iteratee executions. Sections of a chain sequence qualify for shortcut
 * fusion if the section is applied to an array of at least `200` elements
 * and any iteratees accept only one argument. The heuristic for whether a
 * section qualifies for shortcut fusion is subject to change.
 *
 * Chaining is supported in custom builds as long as the `_#value` method is
 * directly or indirectly included in the build.
 *
 * In addition to lodash methods, wrappers have `Array` and `String` methods.
 *
 * The wrapper `Array` methods are:
 * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
 *
 * The wrapper `String` methods are:
 * `replace` and `split`
 *
 * The wrapper methods that support shortcut fusion are:
 * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
 * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
 * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
 *
 * The chainable wrapper methods are:
 * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
 * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
 * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
 * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
 * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
 * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
 * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
 * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
 * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
 * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
 * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
 * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
 * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
 * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
 * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
 * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
 * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
 * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
 * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
 * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
 * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
 * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
 * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
 * `zipObject`, `zipObjectDeep`, and `zipWith`
 *
 * The wrapper methods that are **not** chainable by default are:
 * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
 * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
 * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
 * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
 * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
 * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
 * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
 * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
 * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
 * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
 * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
 * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
 * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
 * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
 * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
 * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
 * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
 * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
 * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
 * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
 * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
 * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
 * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
 * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
 * `upperFirst`, `value`, and `words`
 *
 * @name _
 * @constructor
 * @category Seq
 * @param {*} value The value to wrap in a `lodash` instance.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var wrapped = _([1, 2, 3]);
 *
 * // Returns an unwrapped value.
 * wrapped.reduce(_.add);
 * // => 6
 *
 * // Returns a wrapped value.
 * var squares = wrapped.map(square);
 *
 * _.isArray(squares);
 * // => false
 *
 * _.isArray(squares.value());
 * // => true
 */
function lodash(value) {
  if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
    if (value instanceof LodashWrapper) {
      return value;
    }
    if (hasOwnProperty.call(value, '__wrapped__')) {
      return wrapperClone(value);
    }
  }
  return new LodashWrapper(value);
}

// Ensure wrappers are instances of `baseLodash`.
lodash.prototype = baseLodash.prototype;
lodash.prototype.constructor = lodash;

module.exports = lodash;

},{"14":14,"16":16,"218":218,"269":269,"294":294,"82":82}],357:[function(_dereq_,module,exports){
'use strict';

var domQuery = _dereq_(692),
    assign = _dereq_(665).assign,
    omit = _dereq_(665).omit,
    Deferred = _dereq_(389).defer,
    Graph = _dereq_(1),
    isString = _dereq_(655).isString,
    eventListener = _dereq_(390),


//isNumber = require('lodash/lang').isNumber,
DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  container: 'body',
  translateX: '0',
  translateY: '0',
  scale: '1',
  nodes: {
    adjacencyList: {
      nodeId: {
        label: ''
      }
    }
  },
  draggable: true,
  bgColor: 'white',
  gridSize: 25,
  gridLinesColor: '#ddd',
  gridLinesWidth: 1,
  showGridLines: true,
  fontColor: '#333',
  groups: {},
  /* Features */
  isZoomable: true
};
//xml2js = require('xml2js'),
//helper = require('./utils/helper');

/**
 * Ensure the passed argument is a proper unit (defaulting to px)
 */
// function ensureUnit(val) {
//   return val + (isNumber(val) ? 'px' : '');
// }

function initListeners(graph, listeners) {
  var events = graph.get('eventBus');

  listeners.forEach(function (l) {
    events.on(l.event, l.priority, l.callback, l.that);
  });
}

function Viewer(options) {
  //var that = this;

  this.options = options = assign({}, DEFAULT_OPTIONS, options || {});

  var parent = options.container;

  // support jquery element
  // unwrap it if passed
  if (parent.get) {
    parent = parent.get(0);
  }

  // support selector
  if (isString(parent)) {
    parent = domQuery(parent);
  }

  assign(parent.style, {
    position: 'relative',
    backgroundColor: options.bgColor
  });

  options.container = this.container = parent;
}

module.exports = Viewer;

Viewer.prototype._init = function (graph) {
  var that = this;
  initListeners(graph, this.__listeners || []);
  eventListener(window, 'resize', function () {
    that.get('canvas').resized();
  });
};

Viewer.prototype._createGraph = function (options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);
  var icons = [].concat(options.icons || this.getIcons(), options.additionalIcons || []);

  // add self as an available service
  modules.unshift({
    d3polytree: ['value', this]
  });

  options = omit(options, 'additionalModules');
  options = omit(options, 'additionalIcons');

  this.options = options = assign(options, {
    canvas: assign({}, options.canvas, { container: this.container }),
    icons: icons,
    modules: modules
  });

  var graph = new Graph(options);
  this._init(graph);
  return graph;
};

Viewer.prototype.getModules = function () {
  return this._modules;
};

Viewer.prototype.getIcons = function () {
  return this._icons;
};

/**
 * Remove all drawn elements from the viewer.
 *
 * After calling this method the viewer can still
 * be reused for opening another nodes.
 */
Viewer.prototype.clear = function () {
  var graph = this.graph;
  if (graph) {
    graph.destroy();
  }
};

/**
 * Get a named graph service.
 *
 * @example
 *
 * @param {String} name
 *
 * @return {Object} graph service instance
 */
Viewer.prototype.get = function (name) {

  if (!this.graph) {
    throw new Error('no graph loaded');
  }

  return this.graph.get(name);
};

/**
 * Import the nodes to show in the diagram.
 *
 * Once finished the viewer reports back the result to the
 * provided callback function with (err, warnings).
 *
 * @param {Object} Javascript object with the nodes properties.
 */
Viewer.prototype.importNodes = function (nodesDictionary) {
  var deferResponse = Deferred();
  try {
    if (this.graph) {
      this.clear();
    }
    this.nodes = nodesDictionary;

    this.graph = this._createGraph(this.options);

    //this._init(graph);
    deferResponse.resolve();
  } catch (e) {
    deferResponse.reject(e);
  }
  return deferResponse.promise;
};

/**
 * Register an event listener on the viewer
 *
 * Remove a previously added listener via {@link #off(event, callback)}.
 *
 * @param {String} event
 * @param {Number} [priority]
 * @param {Function} callback
 * @param {Object} [that]
 */
Viewer.prototype.on = function (event, priority, callback, that) {
  var graph = this.graph,
      listeners = this.__listeners = this.__listeners || [];

  if (typeof priority === 'function') {
    that = callback;
    callback = priority;
    priority = 1000;
  }

  listeners.push({ event: event, priority: priority, callback: callback, that: that });

  if (graph) {
    return graph.get('eventBus').on(event, priority, callback, that);
  }
};

/**
 * De-register an event callback
 *
 * @param {String} event
 * @param {Function} callback
 */
Viewer.prototype.off = function (event, callback) {
  var filter,
      graph = this.graph;

  if (callback) {
    filter = function filter(l) {
      return !(l.event === event && l.callback === callback);
    };
  } else {
    filter = function filter(l) {
      return l.event !== event;
    };
  }

  this.__listeners = (this.__listeners || []).filter(filter);

  if (graph) {
    graph.get('eventBus').off(event, callback);
  }
};

// modules the viewer is composed of
Viewer.prototype._modules = [_dereq_(358)];

// icons the viewer has available
Viewer.prototype._icons = _dereq_(370);

},{"1":1,"358":358,"370":370,"389":389,"390":390,"655":655,"665":665,"692":692}],358:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __depends__: [_dereq_(387), _dereq_(383), _dereq_(385), _dereq_(381)]
};

},{"381":381,"383":383,"385":385,"387":387}],359:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.281,0H12.469C5.583,0,0,5.583,0,12.469v68.578v3.117v3.117C0,94.167,5.583,99.75,12.469,99.75h74.813\r\n\tc6.886,0,12.469-5.583,12.469-12.469v-3.042v-0.075v-3.117V12.469C99.75,5.583,94.167,0,87.281,0z\"/>\r\n<path fill=\"#822424\" d=\"M12.469,99.75h74.813c6.886,0,12.469-5.583,12.469-12.469v-3.042l-0.045-0.075H0v3.117\r\n\tC0,94.167,5.583,99.75,12.469,99.75z\"/>\r\n<rect y=\"81.047\" fill=\"#FFFFFF\" width=\"99.75\" height=\"3.117\"/>\r\n<path fill=\"none\" d=\"M27.54,46.941h0.754v-0.051c0.258-0.158,0.46-1.275,0.46-2.645c0-1.479-0.233-2.677-0.521-2.677h-0.7\r\n\tc0.133,0.906,0.18,1.969,0.18,2.716C27.712,45.014,27.666,46.047,27.54,46.941z\"/>\r\n<path fill=\"none\" d=\"M64.608,33.86l2.808,2.808c0.325-0.101,0.699-0.158,1.1-0.158c0.41,0,0.794,0.06,1.126,0.167l2.816-2.816\r\n\tH64.608z\"/>\r\n<path fill=\"none\" d=\"M25.578,48.545h1.205l-0.001-0.083c0.413-0.252,0.732-2.035,0.732-4.222c0-2.361-0.371-4.274-0.83-4.274h-1.119\r\n\tc0.212,1.447,0.288,3.143,0.288,4.334C25.853,45.466,25.779,47.117,25.578,48.545z\"/>\r\n<path fill=\"none\" d=\"M15.869,37.394h-5.616c0.01-0.011,0.02-0.035,0.03-0.043c-0.014-0.014-0.03-0.021-0.043-0.034\r\n\tc-0.07-0.061-0.141-0.101-0.214-0.101H9.529H8.8c-0.073,0-0.145,0.04-0.214,0.101c-0.014,0.012-0.028,0.032-0.042,0.047\r\n\tc-0.052,0.054-0.104,0.123-0.152,0.207c-0.534,0.916-0.921,3.566-0.921,6.71c0,1.019,0.045,1.977,0.119,2.852\r\n\tc0.129,1.552,0.359,2.804,0.648,3.524c0.086,0.215,0.175,0.397,0.269,0.512c0.079,0.093,0.161,0.144,0.245,0.161\r\n\tc0.016,0.003,0.032,0.016,0.049,0.016h0.405H9.74h0.286c0.073,0,0.144-0.04,0.214-0.1h5.643c-0.014-0.013-0.029-0.019-0.042-0.034\r\n\tc0.612-0.636,1.071-3.496,1.071-6.93C16.912,40.901,16.466,38.089,15.869,37.394z\"/>\r\n<path fill=\"none\" d=\"M24.643,51.245v-0.039c-0.07,0-0.138-0.038-0.205-0.094c0.612-0.578,1.076-3.413,1.076-6.832\r\n\tc0-3.455-0.475-6.312-1.095-6.847c0.013-0.013,0.025-0.029,0.039-0.04H24.37c-0.054-0.035-0.106-0.058-0.161-0.058\r\n\ts-0.108,0.023-0.162,0.058h-6.43c0.593,0.708,1.036,3.519,1.036,6.887c0,3.514-0.483,6.417-1.116,6.964H24.643z\"/>\r\n<path fill=\"none\" d=\"M26.357,48.545h1.205l-0.001-0.083c0.413-0.252,0.732-2.035,0.732-4.222c0-2.361-0.371-4.274-0.83-4.274h-1.119\r\n\tc0.212,1.447,0.288,3.143,0.288,4.334C26.632,45.466,26.558,47.117,26.357,48.545z\"/>\r\n<path fill=\"none\" d=\"M25.422,51.245v-0.039c-0.07,0-0.138-0.038-0.205-0.094c0.612-0.578,1.076-3.413,1.076-6.832\r\n\tc0-3.455-0.475-6.312-1.095-6.847c0.013-0.013,0.025-0.029,0.039-0.04h-0.088c-0.054-0.035-0.106-0.058-0.161-0.058\r\n\ts-0.108,0.023-0.162,0.058h-6.43c0.593,0.708,1.036,3.519,1.036,6.887c0,3.514-0.483,6.417-1.116,6.964H25.422z\"/>\r\n<path fill=\"none\" d=\"M28.319,46.941h0.754v-0.051c0.258-0.158,0.46-1.275,0.46-2.645c0-1.479-0.233-2.677-0.521-2.677h-0.7\r\n\tc0.133,0.906,0.18,1.969,0.18,2.716C28.491,45.014,28.445,46.047,28.319,46.941z\"/>\r\n<path fill=\"none\" d=\"M16.648,37.394h-5.616c0.01-0.011,0.02-0.035,0.03-0.043c-0.014-0.014-0.03-0.021-0.043-0.034\r\n\tc-0.07-0.061-0.141-0.101-0.214-0.101h-0.497H9.579c-0.073,0-0.145,0.04-0.214,0.101c-0.014,0.012-0.028,0.032-0.042,0.047\r\n\tc-0.052,0.054-0.104,0.123-0.152,0.207c-0.534,0.916-0.921,3.566-0.921,6.71c0,1.019,0.045,1.977,0.119,2.852\r\n\tc0.129,1.552,0.359,2.804,0.648,3.524c0.086,0.215,0.175,0.397,0.269,0.512c0.079,0.093,0.161,0.144,0.245,0.161\r\n\tc0.016,0.003,0.032,0.016,0.049,0.016h0.405h0.536h0.286c0.073,0,0.144-0.04,0.214-0.1h5.643c-0.014-0.013-0.029-0.019-0.042-0.034\r\n\tc0.612-0.636,1.071-3.496,1.071-6.93C17.691,40.901,17.245,38.089,16.648,37.394z\"/>\r\n<path fill=\"none\" d=\"M65.388,33.86l2.808,2.808c0.325-0.101,0.699-0.158,1.1-0.158c0.41,0,0.794,0.06,1.126,0.167l2.816-2.816\r\n\tH65.388z\"/>\r\n<path fill=\"none\" d=\"M65.388,33.86l2.808,2.808c0.325-0.101,0.699-0.158,1.1-0.158c0.41,0,0.794,0.06,1.126,0.167l2.816-2.816\r\n\tH65.388z\"/>\r\n<rect x=\"25.24\" y=\"39.973\" fill=\"#49494B\" width=\"1.993\" height=\"8.561\"/>\r\n<rect x=\"27.665\" y=\"41.563\" fill=\"#49494B\" width=\"1.235\" height=\"5.389\"/>\r\n<path fill=\"#FFFFFF\" d=\"M96.579,70.602l-0.006-3.221l-0.022-11.023l-0.435-0.374v-0.022c-1.459-1.336-3.773-3.385-6.505-5.569\r\n\tc0,0-8.618-9.295-18.702-10.501l-0.003-1.445l1.481-0.002l-0.002-1.483l-1.011,0.001l3.138-3.151l1.114-0.002\r\n\tc0.38-0.001,0.69-0.312,0.689-0.69l-0.001-0.466c-0.001-0.379-0.312-0.689-0.691-0.688l-14.271,0.028\r\n\tc-0.379,0.001-0.69,0.311-0.689,0.69l0.001,0.466c0.001,0.378,0.313,0.689,0.691,0.688l1.114-0.002l3.152,3.139l-1.011,0.002\r\n\tl0.003,1.483l1.48-0.003l0.004,1.271l-1.175,0.002v0.107l-4.919-2.275v-2.275H55.46v1.171l-45.272,0.09l-0.002-0.7l-4.072,0.008\r\n\tl0.002,1.133C4.719,38.37,3.759,41.2,3.767,44.494c0.006,3.295,0.978,6.124,2.378,7.501l0.003,1.28l4.072-0.008L10.219,52.8\r\n\tl1.618-0.005l0.008,3.903l0.021,10.851l-9.299,0.019l0.019,9.894l94.004-0.187L96.579,70.602z M64.567,33.831l7.85-0.017\r\n\tl-2.811,2.822c-0.332-0.105-0.716-0.166-1.127-0.165c-0.399,0.001-0.774,0.06-1.099,0.16L64.567,33.831z M15.876,51.312\r\n\tl-5.643,0.012c-0.07,0.06-0.141,0.1-0.214,0.1l-0.285,0.001l-0.536,0.001H8.793c-0.016,0-0.032-0.012-0.049-0.016\r\n\tc-0.083-0.017-0.167-0.067-0.246-0.16c-0.094-0.113-0.183-0.296-0.27-0.511c-0.291-0.72-0.524-1.97-0.656-3.523\r\n\tc-0.075-0.875-0.122-1.833-0.124-2.851c-0.006-3.144,0.375-5.795,0.908-6.712c0.048-0.084,0.099-0.153,0.151-0.207\r\n\tc0.013-0.015,0.027-0.035,0.042-0.047c0.07-0.061,0.141-0.1,0.214-0.101l0.729-0.001l0.497-0.001c0.073,0,0.144,0.04,0.214,0.101\r\n\tc0.013,0.012,0.028,0.02,0.042,0.034c-0.01,0.009-0.019,0.032-0.029,0.043l5.615-0.011c0.599,0.694,1.05,3.505,1.058,6.885\r\n\tc0.006,3.434-0.448,6.295-1.059,6.933C15.847,51.294,15.862,51.3,15.876,51.312z M17.583,37.457l6.43-0.012\r\n\tc0.053-0.035,0.106-0.058,0.161-0.059c0.055,0,0.108,0.023,0.162,0.058h0.088c-0.013,0.01-0.025,0.026-0.038,0.04\r\n\tc0.328,0.281,0.614,1.219,0.813,2.537h0.337c-0.001-0.002-0.001-0.004-0.001-0.006l1.119-0.002c0.261-0.001,0.493,0.631,0.646,1.6\r\n\th0.126c0.029,0,0.058,0.02,0.085,0.043c-0.003-0.014-0.003-0.029-0.006-0.043l0.7-0.001c0.288-0.001,0.524,1.197,0.527,2.676\r\n\tc0.002,1.37-0.198,2.487-0.455,2.645v0.051l-0.754,0.002c0.004-0.03,0.006-0.061,0.01-0.09c-0.012,0.012-0.023,0.032-0.036,0.04\r\n\tv0.051h-0.193c-0.131,0.822-0.319,1.389-0.538,1.522l0.001,0.082l-1.205,0.003c0.001-0.004,0.001-0.007,0.001-0.011h-0.342\r\n\tc-0.192,1.324-0.471,2.274-0.793,2.581c0.067,0.056,0.135,0.094,0.205,0.094v0.039l-7.106,0.013c0.632-0.548,1.11-3.452,1.103-6.966\r\n\tC18.626,40.974,18.178,38.164,17.583,37.457z M21.76,67.529l-0.029-14.753l33.729-0.067v0.63h4.546v-1.372l5.502-1.37v-0.058\r\n\tl4.001-0.008c0.73,0.235,1.901,0.679,3.422,1.485c2.039,1.189,6.646,4.597,7.001,4.904c2.825,2.446,7.836,6.551,12.671,10.469\r\n\tL21.76,67.529z\"/>\r\n</svg>\r\n";

},{}],360:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#143D48\" d=\"M87.513,0H12.772C5.893,0,0.315,5.578,0.315,12.457V80.97v3.113v3.114c0,6.88,5.578,12.457,12.457,12.457\r\n\th74.741c6.88,0,12.457-5.577,12.457-12.457v-3.039v-0.075V80.97V12.457C99.97,5.578,94.393,0,87.513,0z\"/>\r\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"#FFFFFD\" d=\"M30.94,47.15v8.552h-8.293v11.403h2.651v5.925\r\n\tc4.373,0.297,7.354,1.349,10.133,2.448v-8.373h32.253v7.043c2.382-0.699,5.164-1.202,8.857-1.202l0.239,0.001\r\n\tc0.238,0.001,0.463,0.012,0.691,0.018v-5.859h1.843V55.702h-3.898L66.385,27.02h2.479v-0.345v-2.763h-2.421V17.52h-0.345v-0.346\r\n\tH58.67v0.346h-0.519v6.393h-1.9v3.108h1.786l-9.031,28.682h-5.884V47.15h-1.944L23.735,11.667l-0.444-0.166l-2.244,0.951\r\n\tl-0.002,0.426l-0.124-0.282l-0.949,0.086L32.896,47.15H30.94z M30.251,65.377h-6.222v-1.555h6.222V65.377z M30.251,63.132h-6.222\r\n\tv-1.297h6.222V63.132z M30.251,60.454h-6.222v-1.7h6.222V60.454z M30.251,58.063h-6.222v-1.151h6.222V58.063z M37.821,65.377h-6.218\r\n\tv-1.555h6.218V65.377z M37.821,63.132h-6.218v-1.297h6.218V63.132z M37.821,60.454h-6.218v-1.7h6.218V60.454z M37.821,58.063h-6.218\r\n\tv-1.151h6.218V58.063z M34.081,42.93l3.899,0.133l-2.558,2.958L34.081,42.93z M45.684,65.377h-6.219v-1.555h6.219V65.377z\r\n\t M45.684,63.132h-6.219v-1.297h6.219V63.132z M45.684,60.454h-6.219v-1.7h6.219V60.454z M61.577,65.377h-6.218v-1.555h6.218V65.377z\r\n\t M61.577,63.132h-6.218v-1.297h6.218V63.132z M61.577,60.454h-6.218v-1.7h6.218V60.454z M61.577,58.063h-6.218v-1.151h6.218V58.063z\r\n\t M69.469,65.377h-6.221v-1.555h6.221V65.377z M69.469,63.132h-6.221v-1.297h6.221V63.132z M69.469,60.454h-6.221v-1.7h6.221V60.454z\r\n\t M69.469,58.063h-6.221v-1.151h6.221V58.063z M77.501,65.377h-6.22v-1.555h6.22V65.377z M77.501,63.132h-6.22v-1.297h6.22V63.132z\r\n\t M77.501,60.454h-6.22v-1.7h6.22V60.454z M77.501,56.911v1.151h-6.22v-1.151H77.501z M74.181,55.702H63.203v-3.219l8.403-4.951\r\n\tL74.181,55.702z M63.203,51.682V41.4l8.161,5.471L63.203,51.682z M71.076,45.846l-7.873-5.277v-0.668l4.993-3.203L71.076,45.846z\r\n\t M67.98,36.015l-4.777,3.064v-6.584l4.629,3.045L67.98,36.015z M67.504,34.497l-4.301-2.829V27.02h1.945L67.504,34.497z\r\n\t M62.858,17.866h3.109v2.591h-3.109V17.866z M62.858,21.149h3.109v2.763h-3.109V21.149z M59.055,17.866h3.11v2.591h-2.936v0.692\r\n\th2.936v2.763h-3.11V17.866z M59.701,27.02h2.119v4.742l-4.515,2.861L59.701,27.02z M56.985,35.647l4.835-3.066v7.061l-5.033-3.372\r\n\tL56.985,35.647z M56.572,36.957l4.861,3.258l-7.378,4.73L56.572,36.957z M53.733,45.973l8.087-5.186v11.016l-8.126-5.716\r\n\tL53.733,45.973z M53.479,46.779l8.342,5.871v3.053H50.669L53.479,46.779z M47.324,56.911h6.221v1.151h-6.221V56.911z M47.324,58.754\r\n\th6.221v1.7h-6.221V58.754z M47.324,61.835h6.221v1.297h-6.221V61.835z M47.324,63.822h6.221v1.555h-6.221V63.822z M45.684,56.911\r\n\tv1.151h-6.219v-1.151H45.684z M40.409,47.15h-4.495l-0.186-0.426l2.851-3.294L40.409,47.15z M38.061,42.376l-3.658-0.127\r\n\tl2.229-2.783L38.061,42.376z M36.043,38.271l-3.705-0.313l2.071-3.008L36.043,38.271z M23.258,12.263l0.65,1.322l-1.856-0.812\r\n\tL23.258,12.263z M21.154,13.135l2.332,1.02l-0.96,2.143L21.154,13.135z M24.217,14.213l1.87,3.804l-3.14-0.971L24.217,14.213z\r\n\t M23.199,17.846l2.438,0.756l-1.037,2.475L23.199,17.846z M26.38,18.615l1.703,3.465l-3.036-0.284L26.38,18.615z M25.22,22.506\r\n\tl2.452,0.23l-1.389,2.221L25.22,22.506z M28.442,22.808l1.601,3.257l-3.362-0.439L28.442,22.808z M26.887,26.35l2.654,0.346\r\n\tl-1.369,2.616L26.887,26.35z M30.336,26.663l1.658,3.369l-3.347-0.138L30.336,26.663z M28.729,30.589l2.968,0.121l-1.759,2.67\r\n\tL28.729,30.589z M32.412,30.882l1.533,3.12l-3.503-0.131L32.412,30.882z M30.45,34.562l3.303,0.125l-1.991,2.893L30.45,34.562z\r\n\t M32.22,38.642l3.921,0.33l-2.447,3.062L32.22,38.642z\"/>\r\n<path fill=\"#014C5D\" d=\"M99.941,84.112l0.012-3.662c0,0-0.081,0.032-0.186,0.074c-0.058,0.454-0.758,4.38-7.592,4.92\r\n\tc-5.549,0.439-10.227-4.057-15.922-3.798c-3.722,0.17-7.538,1.752-12.736,3.228c-1.863,0.528-7.727,2.428-14.144,2.323\r\n\tc-6.032-0.099-12.631-2.165-14.517-2.73c-4.501-1.347-7.96-2.668-11.34-2.82c-5.693-0.259-10.371,4.237-15.919,3.798\r\n\tc-4.926-0.388-6.662-2.533-7.271-3.874c-0.002,0-0.012-0.001-0.012-0.001v2.514v0.438v2.676c0,6.88,5.578,12.457,12.457,12.457\r\n\th74.741c6.88,0,12.457-5.577,12.457-12.457v-3.039L99.941,84.112z\"/>\r\n<path fill=\"#FFFFFD\" d=\"M7.598,85.444c5.549,0.439,10.227-4.057,15.919-3.798c3.38,0.152,6.839,1.474,11.34,2.82\r\n\tc1.885,0.565,8.485,2.632,14.517,2.73c6.417,0.104,12.28-1.795,14.144-2.323c5.198-1.476,9.015-3.058,12.736-3.228\r\n\tc5.695-0.259,10.373,4.237,15.922,3.798c6.834-0.54,7.534-4.466,7.592-4.92c0.004-0.027,0.006-0.046,0.006-0.046\r\n\tc-12.856,3.651-10.3-4.604-22.787-4.677c-12.207-0.069-13.536,5.495-27.099,5.823c-13.564-0.328-14.894-5.893-27.101-5.823\r\n\tC10.295,75.875,12.853,84.13,0,80.479c0,0,0.039,0.456,0.328,1.092C0.936,82.911,2.672,85.057,7.598,85.444z\"/>\r\n</svg>\r\n";

},{}],361:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#143D48\" d=\"M87.5,0h-75C5.597,0,0,5.597,0,12.5v68.75v3.125V87.5C0,94.403,5.597,100,12.5,100h75\r\n\tc6.903,0,12.5-5.597,12.5-12.5v-3.05v-0.075V81.25V12.5C100,5.597,94.403,0,87.5,0z\"/>\r\n<rect y=\"81.25\" fill=\"#FFFFFF\" width=\"100\" height=\"3.125\"/>\r\n<path fill=\"#014C5D\" d=\"M12.5,100h75c6.903,0,12.5-5.597,12.5-12.5v-3.05l-0.045-0.075H0V87.5C0,94.403,5.597,100,12.5,100z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFD\" d=\"M65.049,76.633L57.31,22.057h1.307v-2.815H41.823v2.815h1.306l-7.737,54.576H65.049z M41.233,73.819\r\n\t\tl8.986-4.684l8.986,4.684H41.233z M56.575,45.347H43.862l6.358-6.432L56.575,45.347z M45.866,32.508h8.708l-4.354,4.405\r\n\t\tL45.866,32.508z M56.154,48.161l-5.935,4.591l-5.935-4.591H56.154z M58.584,61H41.856l8.364-6.469L58.584,61z M57.39,63.813\r\n\t\tl-7.17,3.735l-7.167-3.735H57.39z M61.771,73.568l-10.03-5.227l8.651-4.507L61.771,73.568z M59.88,60.224l-8.511-6.583l6.828-5.281\r\n\t\tL59.88,60.224z M57.64,44.42l-6.432-6.507l4.818-4.873L57.64,44.42z M45.972,22.057h8.496l1.082,7.636H44.889L45.972,22.057z\r\n\t\t M44.415,33.041l4.816,4.873l-6.429,6.507L44.415,33.041z M42.242,48.359l6.828,5.281l-8.51,6.583L42.242,48.359z M48.698,68.342\r\n\t\tl-10.03,5.227l1.379-9.733L48.698,68.342z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M51.688,16.823c0,0,3.587,0.456,5.46-1.416c1.118-1.118,1.015-2.826-0.102-3.945\r\n\t\tc-1.117-1.116-2.827-1.217-3.944-0.1C51.23,13.234,51.688,16.823,51.688,16.823z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M57.882,7.452c0.654-0.653,0.594-1.654-0.06-2.308c-0.653-0.653-1.653-0.713-2.307-0.059\r\n\t\tc-1.097,1.095-0.829,3.196-0.829,3.196S56.787,8.548,57.882,7.452z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M50.22,11.362c0,0,2.543-1.97,2.543-4.322c0-1.404-1.14-2.416-2.543-2.416\r\n\t\tc-1.404,0-2.543,1.012-2.543,2.416C47.677,9.392,50.22,11.362,50.22,11.362z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M45.753,8.281c0,0,0.267-2.101-0.829-3.196c-0.653-0.654-1.653-0.594-2.307,0.059\r\n\t\tc-0.653,0.654-0.713,1.655-0.059,2.308C43.652,8.548,45.753,8.281,45.753,8.281z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M43.393,11.462c-1.117,1.119-1.218,2.827-0.101,3.945c1.872,1.872,5.461,1.416,5.461,1.416\r\n\t\ts0.456-3.589-1.416-5.46C46.22,10.246,44.51,10.347,43.393,11.462z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],362:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A1B13\" d=\"M87.791,0h-75.25C5.616,0,0,5.616,0,12.542v68.979v3.136v3.135c0,6.927,5.616,12.542,12.542,12.542h75.25\r\n\tc6.927,0,12.542-5.615,12.542-12.542v-3.06v-0.075v-3.136V12.542C100.333,5.616,94.718,0,87.791,0z\"/>\r\n<path fill=\"#A44C29\" d=\"M12.542,100.333h75.25c6.927,0,12.542-5.615,12.542-12.542v-3.06l-0.045-0.075H0v3.135\r\n\tC0,94.718,5.616,100.333,12.542,100.333z\"/>\r\n<g>\r\n\t<rect y=\"81.521\" fill=\"#FFFFFD\" width=\"100.333\" height=\"3.136\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M29.192,79.169V54.266h0.006h2.552v24.903h3.191V54.266h1.65v16.926c0,0.883,0.715,1.597,1.594,1.597h6.136\r\n\t\th0.01v6.381v0.065h12.435v-0.065l-0.069-28.634c-0.089-0.457-0.273-0.879-0.528-1.25c-0.007-0.01-0.015-0.021-0.021-0.032\r\n\t\tc-0.12-0.171-0.259-0.329-0.409-0.473c-0.025-0.024-0.051-0.047-0.077-0.07c-0.153-0.139-0.316-0.267-0.495-0.375\r\n\t\tc1.119-0.329,1.938-1.362,1.938-2.589c0-1.492-1.21-2.703-2.702-2.703H52.23v-2.516h-3.36v2.516h-2.174\r\n\t\tc-1.492,0-2.701,1.209-2.701,2.703c0,1.227,0.819,2.261,1.938,2.589c-0.958,0.582-1.601,1.634-1.601,2.834v18.427h-0.014h-4.536\r\n\t\tV52.668c0-0.881-0.715-1.595-1.594-1.595h-3.246V33.751c0-3.169-2.576-5.748-5.745-5.751c-0.002,0-0.004,0-0.006,0v-0.249\r\n\t\tc0-4.668-3.785-8.455-8.453-8.455c-4.669,0-8.455,3.787-8.455,8.455v51.418V79.3h16.908V79.169z M29.192,31.193\r\n\t\tc0.002,0,0.004,0.001,0.006,0.001c1.407,0.003,2.552,1.148,2.552,2.558v17.322h-2.552h-0.006V31.193z\"/>\r\n\t<rect x=\"29.264\" y=\"34.489\" fill=\"#FFFFFD\" width=\"1.764\" height=\"3.136\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M59.572,39.192v12.542c0,1.324,0.513,2.505,1.348,3.352v-2.82c0-2.125,0.663-4.096,1.788-5.724v-7.35\r\n\t\tc0-2.549-2.198-4.703-4.801-4.703H35.6v3.136h22.307C58.795,37.625,59.572,38.358,59.572,39.192z\"/>\r\n\t<path fill=\"#FFFFFD\" d=\"M61.442,69.597H56.96v3.191h4.482v6.381h3.192v-6.381h3.212h0.006v6.381v0.065H91.58v-0.065V65.82h-3.299\r\n\t\tv-4.917c0-4.323-3.205-7.898-7.367-8.48v-0.157c0-5.28-4.295-9.576-9.575-9.576h-0.318c-5.281,0-9.578,4.296-9.578,9.576V69.597z\r\n\t\t M64.635,52.266c0-3.52,2.864-6.385,6.386-6.385h0.318c3.519,0,6.383,2.865,6.383,6.385v0.308\r\n\t\tc-0.686,0.163-1.337,0.411-1.948,0.729H65.157v3.136h7.257c-0.797,1.301-1.264,2.828-1.264,4.466v4.917h-3.298v3.776h-0.006h-3.212\r\n\t\tV52.266z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],363:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.813-0.185H12.787c-6.905,0-12.504,5.599-12.504,12.504v68.773v3.126v3.126\r\n\tc0,6.905,5.599,12.504,12.504,12.504h75.025c6.905,0,12.504-5.599,12.504-12.504v-3.051v-0.075v-3.126V12.319\r\n\tC100.316,5.414,94.718-0.185,87.813-0.185z\"/>\r\n<rect x=\"0.283\" y=\"81.093\" fill=\"#FFFFFF\" width=\"100.033\" height=\"3.126\"/>\r\n<path fill=\"#822424\" d=\"M12.787,99.849h75.025c6.905,0,12.504-5.599,12.504-12.504v-3.051l-0.045-0.075H0.283v3.126\r\n\tC0.283,94.25,5.882,99.849,12.787,99.849z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M75.555,35.382H54.639c-3.241,0-5.867,2.625-5.867,5.866c0,3.241,2.625,5.867,5.867,5.867h20.916\r\n\t\tc3.24,0,5.866-2.625,5.866-5.867C81.421,38.008,78.795,35.382,75.555,35.382z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M60.103,68.962c-3.694,1.604-7.616,2.418-11.658,2.418c-6.84,0-13.134-2.364-18.124-6.309L28.626,76.33\r\n\t\th39.771l-1.924-11.183C64.526,66.677,62.389,67.968,60.103,68.962z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M61.794,51.228c-1.04,1.361-2.284,2.558-3.686,3.546c-2.731,1.93-6.063,3.066-9.664,3.066\r\n\t\tc-9.27,0-16.784-7.515-16.784-16.786c0-9.269,7.515-16.784,16.784-16.784c6.61,0,12.311,3.831,15.048,9.383h11.664\r\n\t\tC71.919,21.939,61.19,13.335,48.445,13.335c-15.309,0-27.719,12.411-27.719,27.719c0,15.31,12.411,27.72,27.719,27.72\r\n\t\tc3.922,0,7.652-0.819,11.035-2.288c6.72-2.921,12.052-8.424,14.751-15.259c0.308-0.778,0.58-1.574,0.817-2.384h-11.74\r\n\t\tC62.868,49.682,62.363,50.48,61.794,51.228z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M48.445,31.931c1.988,0,3.822,0.643,5.321,1.723h7.796c-2.587-4.573-7.487-7.667-13.117-7.667\r\n\t\tc-8.321,0-15.067,6.747-15.067,15.067c0,8.322,6.747,15.069,15.067,15.069c5.466,0,10.239-2.922,12.88-7.279h-1.787v-0.052h-5.644\r\n\t\tv0.052h-0.479c-0.073,0-0.146-0.009-0.22-0.011c-1.385,0.848-3.007,1.346-4.75,1.346c-5.038,0-9.123-4.085-9.123-9.124\r\n\t\tC39.322,36.016,43.407,31.931,48.445,31.931z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],364:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A1B13\" d=\"M87.719,0H12.531C5.611,0,0,5.611,0,12.531v68.922v3.133v3.133c0,6.92,5.611,12.531,12.531,12.531h75.188\r\n\tc6.92,0,12.531-5.611,12.531-12.531v-3.058v-0.075v-3.133V12.531C100.25,5.611,94.639,0,87.719,0z\"/>\r\n<path fill=\"#A44C29\" d=\"M12.531,100.25h75.188c6.92,0,12.531-5.611,12.531-12.531v-3.058l-0.045-0.075H0v3.133\r\n\tC0,94.639,5.611,100.25,12.531,100.25z\"/>\r\n<rect y=\"81.453\" fill=\"#FFFFFD\" width=\"100.25\" height=\"3.133\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M34.728,53.323l-0.811-0.548h2.481v-2.84l-7.678-1.001v-2.442c-0.481,0.158-0.995,0.247-1.529,0.247\r\n\t\tc-1.044,0-2.011-0.33-2.808-0.887v2.517l-6.881-0.897V35.875c0,0-0.261-1.393,2.874-1.393c0.691,0,1.875,0,3.299,0v-0.07\r\n\t\tc0-1.587,0.449-2.912,1.275-3.938H20.29c0,0-6.446-0.783-6.446,4.704v11.813l-0.983-0.127c-0.215-0.053-0.437-0.088-0.667-0.088\r\n\t\tc-1.63,0-2.95,1.391-2.95,3.105c0,1.505,1.019,2.759,2.37,3.043l-0.014,0.145l21.008,4.238\r\n\t\tC32.934,55.283,33.728,53.765,34.728,53.323z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M83.027,67.479c-1.621-1.106-2.699-3.021-2.699-5.197c0-2.923,1.939-5.374,4.537-6.024l-23.564-3.073\r\n\t\tv-5.453c-0.658,0.271-1.381,0.423-2.136,0.423c-1.303,0-2.501-0.45-3.456-1.196v5.497l-8.092-1.057v2.264h-0.816\r\n\t\tc0.072,0.328,0.107,0.663,0.107,1.004v5.527L83.027,67.479z\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"18.213,55.314 18.213,61.455 31.794,60.746 31.794,57.677 20.929,55.618 \t\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"74.069,75.035 85.644,73.736 85.644,69.131 74.069,66.533 \t\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"71.059,74.563 73.598,75.213 73.598,66.415 71.059,66.12 \t\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"17.091,61.131 17.932,61.484 17.932,55.285 17.091,54.955 \t\"/>\r\n\t<ellipse fill=\"#FFFFFF\" cx=\"86.237\" cy=\"62.282\" rx=\"5.554\" ry=\"5.846\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M24.384,37.793c0.796-0.558,1.763-0.887,2.808-0.887c0.534,0,1.047,0.089,1.529,0.248v-1.917\r\n\t\tc0,0-0.309-1.651,3.408-1.651c1.066,0,3.12,0,5.504,0c0.223-2.07,1.178-3.689,2.756-4.751h-8.362c0,0-7.643-0.929-7.643,5.577\r\n\t\tV37.793z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M91.71,26.588c-0.626,0-1.145,0.448-1.259,1.041h-1.489c0.629-0.105,1.109-0.647,1.109-1.307\r\n\t\tc0-0.733-0.596-1.328-1.329-1.328h-3.808c-0.733,0-1.329,0.595-1.329,1.328c0,0.659,0.48,1.202,1.11,1.307h-1.223\r\n\t\tc-0.114-0.593-0.635-1.041-1.26-1.041c-0.626,0-1.146,0.448-1.26,1.041H65.561c0,0-9.852-1.197-9.852,7.188v3.287\r\n\t\tc0.955-0.748,2.153-1.197,3.456-1.197c0.755,0,1.478,0.153,2.136,0.424v-1.449c0,0-0.399-2.13,4.393-2.13c2.53,0,9.366,0,15.255,0\r\n\t\tv0.056c0,0.709,0.575,1.284,1.285,1.284c0.709,0,1.284-0.575,1.284-1.284v-0.056c3.352,0,6.051,0,6.908,0v0.056\r\n\t\tc0,0.709,0.574,1.284,1.284,1.284c0.709,0,1.284-0.575,1.284-1.284v-5.934C92.994,27.163,92.419,26.588,91.71,26.588z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M38.288,34.53l0.049,13.644c0.721-1.16,2.118-1.952,3.73-1.952c0.411,0,0.804,0.064,1.181,0.16V35.475\r\n\t\tc0,0-0.355-1.889,3.896-1.889c1.459,0,4.533,0,7.941,0c0.311-2.436,1.555-4.294,3.574-5.433H47.028\r\n\t\tC47.028,28.153,38.288,27.091,38.288,34.53z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M46.909,52.953v-2.952h-1.306c0-0.02,0.007-0.04,0.007-0.06c0-1.663-1.587-3.011-3.543-3.011\r\n\t\tc-1.957,0-3.542,1.348-3.542,3.011c0,0.021,0.006,0.04,0.006,0.06h-1.423v2.952h1.333c-0.07,0.149-0.139,0.302-0.19,0.462\r\n\t\tc1.244,0.712,2.105,3.08,2.105,5.975c0,2.528-0.658,4.653-1.653,5.626c0.725,1.126,1.987,1.873,3.424,1.873\r\n\t\tc2.251,0,4.074-1.823,4.074-4.074v-8.148c0-0.612-0.139-1.191-0.381-1.713H46.909z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M35.335,53.898c-1.033,0-2.185,2.255-2.185,5.491s1.151,5.491,2.185,5.491s2.185-2.255,2.185-5.491\r\n\t\tS36.368,53.898,35.335,53.898z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M37.698,53.572v-0.088h-1.466c1.169,0.791,1.997,3.103,1.997,5.905c0,2.739-0.791,5.004-1.918,5.845h1.145\r\n\t\tc0.002,0,0.004,0.001,0.006,0.001c0.002,0,0.004-0.001,0.006-0.001h0.23v-0.027C38.988,64.933,40,62.434,40,59.39\r\n\t\tC40,56.345,38.988,53.847,37.698,53.572z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M22.985,41.823c0,2.323,1.882,4.207,4.207,4.207c2.323,0,4.207-1.883,4.207-4.207\r\n\t\tc0-2.324-1.883-4.208-4.207-4.208C24.868,37.615,22.985,39.499,22.985,41.823z M23.897,43.643c-0.448-0.959-0.32-2.399,0-3.135\r\n\t\tc0.319-0.736,0.799-0.352,0.799-0.352l1.184,1.215c-0.64,0.641,0,1.375,0,1.375s-0.352,0.32-0.928,0.928\r\n\t\tS23.897,43.643,23.897,43.643z M28.87,45.036c-0.961,0.448-2.4,0.319-3.135,0c-0.736-0.32-0.353-0.8-0.353-0.8l1.216-1.184\r\n\t\tc0.64,0.64,1.376,0,1.376,0s0.319,0.353,0.928,0.928C29.509,44.556,28.87,45.036,28.87,45.036z M26.601,41.919\r\n\t\tc0-0.309,0.25-0.56,0.56-0.56c0.308,0,0.56,0.251,0.56,0.56c0,0.308-0.252,0.56-0.56,0.56\r\n\t\tC26.85,42.479,26.601,42.227,26.601,41.919z M30.357,40.35c0.448,0.961,0.32,2.4,0,3.136c-0.319,0.736-0.8,0.351-0.8,0.351\r\n\t\tl-1.184-1.214c0.641-0.641,0-1.376,0-1.376s0.353-0.32,0.928-0.928C29.877,39.711,30.357,40.35,30.357,40.35z M28.711,38.703\r\n\t\tc0.736,0.319,0.352,0.8,0.352,0.8l-1.215,1.183c-0.641-0.639-1.376,0-1.376,0s-0.32-0.351-0.928-0.927s0.033-1.056,0.033-1.056\r\n\t\tC26.536,38.254,27.976,38.383,28.711,38.703z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M59.165,47.446c2.714,0,4.916-2.201,4.916-4.915c0-2.714-2.202-4.916-4.916-4.916s-4.916,2.202-4.916,4.916\r\n\t\tC54.249,45.245,56.451,47.446,59.165,47.446z M61.126,46.286c-1.122,0.523-2.805,0.373-3.663,0\r\n\t\tc-0.861-0.374-0.412-0.936-0.412-0.936l1.42-1.383c0.748,0.748,1.607,0,1.607,0s0.374,0.412,1.084,1.084\r\n\t\tC61.873,45.725,61.126,46.286,61.126,46.286z M58.474,42.643c0-0.361,0.293-0.653,0.654-0.653c0.36,0,0.653,0.292,0.653,0.653\r\n\t\tc0,0.361-0.293,0.655-0.653,0.655C58.767,43.297,58.474,43.004,58.474,42.643z M62.864,40.811c0.523,1.122,0.373,2.805,0,3.663\r\n\t\tc-0.374,0.861-0.936,0.411-0.936,0.411l-1.383-1.419c0.748-0.748,0-1.607,0-1.607s0.412-0.374,1.084-1.084\r\n\t\tC62.304,40.063,62.864,40.811,62.864,40.811z M57.278,38.887c1.12-0.524,2.803-0.374,3.663,0c0.859,0.374,0.41,0.934,0.41,0.934\r\n\t\tl-1.42,1.383c-0.748-0.747-1.608,0-1.608,0s-0.373-0.411-1.083-1.084C56.529,39.447,57.278,38.887,57.278,38.887z M56.25,40.585\r\n\t\tl1.383,1.42c-0.748,0.748,0,1.606,0,1.606s-0.411,0.375-1.084,1.084c-0.673,0.71-1.234-0.037-1.234-0.037\r\n\t\tc-0.522-1.122-0.373-2.804,0-3.663C55.689,40.135,56.25,40.585,56.25,40.585z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],365:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A1B13\" d=\"M87.5,0h-75C5.597,0,0,5.597,0,12.5v68.75v3.125V87.5C0,94.403,5.597,100,12.5,100h75\r\n\tc6.903,0,12.5-5.597,12.5-12.5v-3.05v-0.075V81.25V12.5C100,5.597,94.403,0,87.5,0z\"/>\r\n<path fill=\"#A44C29\" d=\"M12.5,100h75c6.903,0,12.5-5.597,12.5-12.5v-3.05l-0.045-0.075H0V87.5C0,94.403,5.597,100,12.5,100z\"/>\r\n<g>\r\n\t<rect y=\"81.25\" fill=\"#FFFFFF\" width=\"100\" height=\"3.125\"/>\r\n\t<polygon fill=\"#FFFFFD\" points=\"25.217,49.565 10.069,49.565 10.069,49.566 9.874,49.566 9.874,78.69 13.607,78.69 13.607,53.299 \r\n\t\t25.217,53.299 \t\"/>\r\n\t<polygon fill=\"#FFFFFD\" points=\"74.5,49.565 89.647,49.565 89.647,49.566 89.844,49.566 89.844,78.69 86.11,78.69 86.11,53.299 \r\n\t\t74.5,53.299 \t\"/>\r\n\t<g>\r\n\t\t<polygon fill=\"#FFFFFD\" points=\"30.363,29.521 30.363,37.196 27.312,37.196 33.822,46.012 40.496,37.196 37.398,37.196 \r\n\t\t\t37.398,31.081 61.79,36.491 61.79,45.226 68.823,45.226 68.823,38.05 73.191,39.019 73.191,56.966 26.482,70.298 26.482,28.661 \t\t\r\n\t\t\t\"/>\r\n\t\t<polygon fill=\"#FFFFFD\" points=\"31.926,38.759 31.926,15.878 35.835,15.878 35.835,38.759 37.353,38.759 33.837,43.403 \r\n\t\t\t30.408,38.759 \t\t\"/>\r\n\t\t<polygon fill=\"#FFFFFD\" points=\"61.835,20.479 65.351,15.835 68.778,20.479 67.261,20.479 67.261,43.663 63.353,43.663 \r\n\t\t\t63.353,20.479 \t\t\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";

},{}],366:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#143D48\" d=\"M50.041,99.917c9.333,0,18.056-2.573,25.527-7.027H24.515C31.986,97.344,40.709,99.917,50.041,99.917z\"/>\r\n<path fill=\"#014C5D\" d=\"M79.126,90.561h0.008C91.765,81.492,100,66.692,100,49.958C100,22.368,77.633,0,50.041,0\r\n\tC22.45,0,0.083,22.368,0.083,49.958c0,16.734,8.235,31.534,20.866,40.603h0.007H79.126z\"/>\r\n<path fill=\"#FFFFFF\" d=\"M79.126,90.561h-58.17h-0.007c1.146,0.822,2.326,1.603,3.543,2.329h0.023h51.053h0.021\r\n\tc1.217-0.727,2.396-1.507,3.544-2.329H79.126z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M57.373,83.086v3.474c0,0.391,0.29,0.704,0.644,0.704c0.357,0,0.646-0.313,0.646-0.704v-1.95\r\n\t\tC58.137,84.157,57.7,83.647,57.373,83.086z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M69.995,84.608v1.951c0,0.391,0.29,0.704,0.648,0.704c0.355,0,0.643-0.313,0.643-0.704v-3.472\r\n\t\tC70.96,83.647,70.521,84.157,69.995,84.608z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M70.869,63.825c0.003-0.002,0.004-0.008,0.007-0.011v-5.252v-2.935v-1.479c0-2.259-2.139-4.143-5.012-4.647\r\n\t\tv0.334c0.735,0.184,1.219,0.492,1.219,0.839c0,0.563-1.247,1.018-2.787,1.018c-1.538,0-2.787-0.455-2.787-1.018\r\n\t\tc0-0.351,0.494-0.662,1.241-0.843v-0.32c-2.845,0.519-4.955,2.394-4.955,4.637v1.479v2.935v4.648\r\n\t\tc-0.003-0.002-0.005-0.002-0.005-0.002l-0.001,17.482c0,2.641,2.926,4.782,6.54,4.782c3.608,0,6.54-2.142,6.54-4.782V63.825z\"/>\r\n</g>\r\n<path fill=\"none\" d=\"M40.581,42.204l-2.703-4.797h-3.066l6.012,10.111l-6.254,10.354h3.037l2.458-4.493\r\n\tc1.033-1.792,1.64-2.884,2.217-4.07h0.061c0.636,1.186,1.274,2.307,2.337,4.038l2.643,4.525h3.066l-6.377-10.506l6.225-9.959H47.17\r\n\tl-2.763,4.797c-0.76,1.306-1.276,2.248-1.852,3.462h-0.091C41.916,44.573,41.34,43.541,40.581,42.204z\"/>\r\n<path fill=\"none\" d=\"M42.555,45.666h-0.091c-0.548-1.093-1.124-2.125-1.883-3.462l-2.703-4.797h-3.066l6.012,10.111l-6.254,10.354\r\n\th3.037l2.458-4.493c1.033-1.792,1.64-2.884,2.217-4.07h0.061c0.636,1.186,1.274,2.307,2.337,4.038l2.643,4.525h3.066l-6.377-10.506\r\n\tl6.225-9.959H47.17l-2.763,4.797C43.647,43.51,43.131,44.452,42.555,45.666z\"/>\r\n<path fill=\"#FFFFFF\" d=\"M65.385,16.71v-1.685c0-0.31-0.144-0.592-0.374-0.794l-18.75-7.164c-0.006-0.001-0.01,0-0.015-0.001\r\n\tl-3.039-1.162C42.856,5.77,42.46,5.811,42.145,6.01c-0.311,0.202-0.501,0.538-0.501,0.898V7.56v8.511c0,0.02,0.01,0.036,0.012,0.055\r\n\th-0.506v0.014c-4.814,0.381-8.606,4.41-8.606,9.325v45.636c0,1.225,0.237,2.396,0.667,3.47h-2.402c-0.739,0-1.361,0.506-1.361,1.102\r\n\tv0.314v9.937c0,0.738,0.503,1.36,1.257,1.36c0.595,0,1.1-0.622,1.1-1.36v-8.997h2.777c1.712,2.149,4.354,3.528,7.318,3.528h1.089\r\n\tc2.964,0,5.603-1.379,7.317-3.528h2.778v8.997c0,0.738,0.503,1.36,1.257,1.36c0.596,0,1.1-0.622,1.1-1.36v-9.937v-0.314\r\n\tc0-0.596-0.597-1.102-1.336-1.102h-2.426c0.43-1.073,0.664-2.245,0.664-3.47V25.465c0-4.851-3.697-8.828-8.423-9.296\r\n\tc0-0.004,0.003-0.008,0.003-0.014v-2.938c0-0.002-0.002-0.005-0.002-0.008V8.512l0.778,0.296l2.274,0.869V9.674l15.361,5.868\r\n\tl0.778,0.297v26.435v7.95v0.023c0,0.599,0.507,1.084,1.139,1.084c0.627,0,1.135-0.485,1.135-1.084v-7.106l-0.015-0.004V16.704\r\n\tL65.385,16.71z M50.237,37.407l-6.225,9.959l6.377,10.506h-3.066l-2.643-4.525c-1.063-1.73-1.701-2.852-2.337-4.038h-0.061\r\n\tc-0.577,1.186-1.184,2.278-2.217,4.07l-2.458,4.493h-3.037l6.254-10.354l-6.012-10.111h3.066l2.703,4.797\r\n\tc0.759,1.336,1.335,2.369,1.883,3.462h0.091c0.576-1.214,1.092-2.156,1.852-3.462l2.763-4.797H50.237z M45.86,17.065\r\n\tc0,0.314-1.334,0.571-2.979,0.571c-1.644,0-2.978-0.257-2.978-0.571c0-0.239,0.757-0.442,1.833-0.528\r\n\tc0.16,0.42,0.566,0.721,1.052,0.721c0.491,0,0.898-0.307,1.057-0.731C45.014,16.604,45.86,16.814,45.86,17.065z\"/>\r\n</svg>\r\n";

},{}],367:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A653C\" d=\"M87.48,0H12.497C5.596,0,0,5.596,0,12.497v68.734v3.124v3.125c0,6.901,5.596,12.497,12.497,12.497H87.48\r\n\tc6.901,0,12.497-5.596,12.497-12.497v-3.049v-0.076v-3.124V12.497C99.978,5.596,94.382,0,87.48,0z\"/>\r\n<g opacity=\"0.4\">\r\n\t<defs>\r\n\t\t<path id=\"SVGID_1_\" opacity=\"0.4\" d=\"M100,87.503C100,94.405,94.405,100,87.503,100H12.497C5.595,100,0,94.405,0,87.503V12.497\r\n\t\t\tC0,5.595,5.595,0,12.497,0h75.006C94.405,0,100,5.595,100,12.497V87.503z\"/>\r\n\t</defs>\r\n\t<clipPath id=\"SVGID_2_\">\r\n\t\t<use xlink:href=\"#SVGID_1_\"  overflow=\"visible\"/>\r\n\t</clipPath>\r\n\t<polygon opacity=\"0.7\" clip-path=\"url(#SVGID_2_)\" fill=\"#2B4A35\" points=\"103.058,84 -5.554,84 7.543,102.924 114.559,103.616 \t\r\n\t\t\"/>\r\n</g>\r\n<path fill=\"#BED7BA\" d=\"M54.154,34.368L54.154,34.368c0,0,0.521,0.292,0.635,0.325c0.114,0.032,0.521,0.179,0.668,0.016\r\n\tc0.146-0.163,0.13-1.204,0-1.285c-0.131-0.082-0.277-0.342-0.538-0.245c-0.26,0.098-0.423-0.065-0.536,0.229\r\n\tc-0.114,0.292-0.196,0.585-0.196,0.585L54.154,34.368z\"/>\r\n<path fill=\"none\" d=\"M51.03,16.797v0.376c0-0.201,0.02-0.39,0.056-0.566C51.054,16.681,51.03,16.749,51.03,16.797z\"/>\r\n<path fill=\"none\" d=\"M52.038,15.622c-0.026,0-0.06,0.014-0.092,0.027c0.08-0.015,0.163-0.027,0.256-0.027H52.038z\"/>\r\n<g>\r\n\t<rect x=\"76.024\" y=\"71.859\" fill=\"#FFFFFF\" width=\"12.498\" height=\"7.29\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M78.394,35.793c-0.244,0.573-0.286,1.214-0.286,1.892V53.32v1.557v14.899h7.29v-5.207h2.083v-2.083h-2.083\r\n\t\tv-5.208h2.083v-1.04v-1.042h-2.083v-0.319V53.32v-2.29h2.083v-1.042v-1.042h-2.083v-4.166h2.083V43.74v-1.042h-2.083v-5.004v-0.016\r\n\t\tc0-0.674,0.039-1.315-0.207-1.885c-0.629-1.472-1.807-2.488-3.354-2.488C80.289,33.306,79.023,34.321,78.394,35.793z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M57.278,73.574v5.575h16.664v-8.332H59.806C59.049,71.824,58.203,72.746,57.278,73.574z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M53.113,79.149v-2.73c-0.999,0.503-2.043,0.917-3.125,1.243v1.487H53.113z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M49.664,32.905l4.491,0.022v0.398v1.042v8.585c0.734,0.406,1.458,0.865,2.15,1.375\r\n\t\tc0.156,0.116,0.303,0.239,0.454,0.357V30.037c-0.256-0.257-0.633-0.416-1.237-0.421l-4.127-0.026\r\n\t\tc-0.34-0.003-0.364-0.363-0.364-0.574V16.152v-0.021v-0.376c0-0.048,0.023-0.115,0.056-0.188c0.106-0.496,0.371-0.865,0.86-0.959\r\n\t\tc0.032-0.013,0.065-0.028,0.092-0.028h0.164h9.447c1.085-0.375,2.347-0.563,3.787-0.563c0.426,0,0.826,0.037,1.217,0.09\r\n\t\tc-0.002-0.074,0.001-0.153-0.002-0.226v-0.343h-0.016c-0.095-1.189-0.476-2.083-1.872-2.083H50.25\r\n\t\tc-2.133,0-2.343,2.167-2.343,4.299v13.26C47.906,31.176,47.58,32.884,49.664,32.905z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M12.497,75.998v3.151h3.125v-3.125h19.787v3.125h3.125v-3.151c2.919-0.264,5.207-2.714,5.207-5.7\r\n\t\tc0-3.164-2.565-5.729-5.728-5.729H26.036v-1.042h2.083v-2.083h-7.291v2.083h2.083v1.042h-9.894c-3.163,0-5.728,2.564-5.728,5.729\r\n\t\tC7.29,73.284,9.579,75.734,12.497,75.998z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M30.202,62.486h7.811c4.602,0,8.071,3.47,8.071,8.07c0,2.066-0.787,3.914-2.099,5.326\r\n\t\tc0.114,0.003,0.226,0.012,0.341,0.012c6.579,0,12.253-3.747,14.986-9.184c1.246-2.242,1.962-4.803,1.962-7.538\r\n\t\tc0-3.666-1.265-7.037-3.374-9.737c-0.885-1.134-1.967-2.146-3.141-3.012c-1.113-0.822-2.326-1.512-3.657-2.044\r\n\t\tc-1.33-0.582-2.752-0.988-4.237-1.211v-2.553h-5.207v2.573c-7.946,1.257-14.024,8.004-14.057,16.174h2.601V62.486z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M59.362,22.959v22.224v1.949c0.202,0.231,0.404,0.463,0.589,0.701c2.569,3.288,3.926,7.209,3.926,11.339\r\n\t\tc0,3.043-0.783,6.068-2.263,8.754c-0.139,0.277-0.292,0.542-0.444,0.809h9.647v-4.166h4.166v-3.125h-4.166v-4.166h4.166v-2.082\r\n\t\th-4.166V51.03h4.166v-2.083h-4.166v-1.554v-2.21V43.74h4.166v-2.083h-4.166V36.45h4.166v-2.083h-4.166v-1.042v-3.124h9.373v1.156\r\n\t\tc0.567-0.101,1.196-0.158,1.909-0.158c0.444,0,0.841,0.055,1.216,0.131c0.002-0.624,0.022-1.249,0-1.829V29.16h-0.017\r\n\t\tc-0.096-1.189-0.477-2.083-1.871-2.083h-10.61v-4.109v-0.019c0-0.962-0.347-6.329-5.381-6.329\r\n\t\tC60.747,16.62,59.362,18.807,59.362,22.959z\"/>\r\n\t<rect y=\"81.231\" fill=\"#FFFFFF\" width=\"99.978\" height=\"3.124\"/>\r\n</g>\r\n<path fill=\"#2B4A35\" d=\"M12.497,99.978H87.48c6.901,0,12.497-5.596,12.497-12.497v-3.049l-0.045-0.076H0v3.125\r\n\tC0,94.382,5.596,99.978,12.497,99.978z\"/>\r\n</svg>\r\n";

},{}],368:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#014C5D\" d=\"M87.684,0H12.797C5.904,0,0.316,5.588,0.316,12.481v68.646v3.12v3.12c0,6.893,5.588,12.481,12.481,12.481\r\n\th74.887c6.893,0,12.48-5.589,12.48-12.481v-3.045v-0.075v-3.12V12.481C100.164,5.588,94.576,0,87.684,0z\"/>\r\n<path fill=\"#143D48\" d=\"M100.136,84.275l0.013-3.668c0,0-0.081,0.032-0.187,0.073c-0.058,0.455-0.759,4.39-7.606,4.93\r\n\tc-5.56,0.44-10.246-4.063-15.952-3.805c-3.73,0.171-7.554,1.755-12.762,3.233c-1.867,0.529-7.742,2.434-14.171,2.328\r\n\tc-6.043-0.1-12.656-2.169-14.545-2.736c-4.51-1.349-7.976-2.673-11.362-2.825c-5.704-0.259-10.391,4.245-15.951,3.805\r\n\tc-4.936-0.388-6.675-2.537-7.285-3.881c-0.001,0-0.012-0.001-0.012-0.001v2.519v0.439v2.681c0,6.893,5.588,12.481,12.481,12.481\r\n\th74.887c6.893,0,12.48-5.589,12.48-12.481v-3.045L100.136,84.275z\"/>\r\n<path fill=\"#FFFFFD\" d=\"M7.613,85.61c5.56,0.44,10.247-4.063,15.951-3.805c3.386,0.152,6.852,1.477,11.362,2.825\r\n\tc1.889,0.567,8.501,2.637,14.545,2.736c6.429,0.105,12.304-1.799,14.171-2.328c5.208-1.479,9.031-3.063,12.762-3.233\r\n\tc5.706-0.259,10.393,4.245,15.952,3.805c6.848-0.54,7.549-4.475,7.606-4.93c0.004-0.027,0.006-0.045,0.006-0.045\r\n\tc-12.882,3.658-10.32-4.612-22.831-4.686c-12.231-0.07-13.563,5.505-27.152,5.834c-13.59-0.329-14.923-5.904-27.153-5.834\r\n\tC10.315,76.023,12.878,84.294,0,80.636c0,0,0.039,0.457,0.328,1.094C0.938,83.073,2.677,85.223,7.613,85.61z\"/>\r\n<polygon fill=\"none\" points=\"75.596,35.52 74.252,36.861 74.252,36.879 77.573,36.879 75.648,35.52 \"/>\r\n<polygon fill=\"none\" points=\"74.264,36.209 74.952,35.52 74.274,35.52 \"/>\r\n<polygon fill=\"none\" points=\"70.551,41.63 71.894,39.736 70.551,38.393 \"/>\r\n<polygon fill=\"none\" points=\"71.906,39.116 71.906,37.907 70.715,37.907 \"/>\r\n<polygon fill=\"none\" points=\"85.905,36.879 84.909,35.624 83.657,36.879 \"/>\r\n<polygon fill=\"none\" points=\"76.436,35.52 78.329,36.864 79.671,35.52 \"/>\r\n<rect x=\"63.949\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"84.379,35.52 81.143,35.52 83.036,36.864 \"/>\r\n<rect x=\"66.386\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"70.551,42.457 71.906,43.822 71.906,40.492 70.551,42.417 \"/>\r\n<polygon fill=\"none\" points=\"70.551,43.102 70.551,46.337 71.894,44.443 \"/>\r\n<polygon fill=\"none\" points=\"71.906,46.559 71.906,45.2 70.948,46.559 \"/>\r\n<path fill=\"none\" d=\"M71.811,31.545h-0.361c-0.022,0-0.039-0.013-0.057-0.018l-0.127,1.046h0.645L71.811,31.545z\"/>\r\n<polygon fill=\"none\" points=\"82.283,36.876 80.355,35.52 80.315,35.52 78.95,36.876 \"/>\r\n<rect x=\"68.396\" y=\"35.521\" fill=\"none\" width=\"1.452\" height=\"1.075\"/>\r\n<path fill=\"none\" d=\"M71.124,30.104l-4.085,4.126v0.822h0.61v-0.485c0-0.145,0.117-0.262,0.262-0.262h0.224\r\n\tc0.145,0,0.262,0.117,0.262,0.262v0.485h1.452v-2.217c0-0.144,0.118-0.262,0.262-0.262h0.717L71.124,30.104z\"/>\r\n<polygon fill=\"none\" points=\"50.352,30.024 49.446,31.167 50.276,32.345 51.177,31.066 \"/>\r\n<polygon fill=\"none\" points=\"50.363,35.357 51.266,34.454 50.276,33.048 49.356,34.352 \"/>\r\n<polygon fill=\"none\" points=\"51.271,42.085 51.196,42.158 51.826,42.158 51.739,40.318 50.661,41.446 \"/>\r\n<polygon fill=\"none\" points=\"71.769,31.122 71.623,29.646 71.442,31.122 71.449,31.122 \"/>\r\n<rect x=\"67.039\" y=\"35.521\" fill=\"none\" width=\"0.61\" height=\"1.075\"/>\r\n<path fill=\"none\" d=\"M72.757,32.604c0.85,0,1.542,0.695,1.542,1.546l-0.016,0.902h5.443L72.09,29.9l0.258,2.693L72.757,32.604z\"/>\r\n<path fill=\"none\" d=\"M70.456,33.256v2.563c0,0.147,0.119,0.264,0.264,0.264h1.548c0.848,0,1.537-0.375,1.537-1.711\r\n\tc0-1.168-0.588-1.331-1.436-1.376H70.72C70.575,32.995,70.456,33.112,70.456,33.256z\"/>\r\n<rect x=\"61.36\" y=\"64.171\" fill=\"none\" width=\"1.169\" height=\"2.301\"/>\r\n<rect x=\"33.951\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<rect x=\"26.287\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<rect x=\"65.871\" y=\"35.521\" fill=\"none\" width=\"0.422\" height=\"1.075\"/>\r\n<rect x=\"71.361\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"32.006,74.715 38.034,67.503 32.006,67.503 \"/>\r\n<rect x=\"36.388\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"50.38,41.152 51.563,39.914 50.38,38.474 49.196,39.914 \"/>\r\n<path fill=\"none\" d=\"M47.437,76.403H35.312c3.274,1.306,6.563,2.717,12.125,3.168V78.84V76.403z\"/>\r\n<path fill=\"none\" d=\"M51.106,79.662c6.446-0.309,10.004-1.845,13.549-3.259H51.106V79.662z\"/>\r\n<rect x=\"39.028\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<path fill=\"none\" d=\"M47.437,75.44l-6.08-7.826l-2.454,0.117l-6.376,7.626c0.224,0.076,0.446,0.154,0.666,0.234h14.244V75.44z\"/>\r\n<rect x=\"58.722\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"51.106,73.646 56.24,67.503 51.106,67.503 \"/>\r\n<rect x=\"54.103\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<rect x=\"51.463\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"47.437,74.116 47.437,67.503 42.298,67.503 \"/>\r\n<polygon fill=\"none\" points=\"66.251,74.9 66.251,67.503 60.504,67.503 \"/>\r\n<rect x=\"56.286\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"57.108,67.731 51.106,74.911 51.106,75.592 65.76,75.592 59.562,67.614 \"/>\r\n<rect x=\"43.798\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<rect x=\"41.362\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<rect x=\"49.026\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<rect x=\"46.438\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<rect x=\"69.025\" y=\"64.171\" fill=\"none\" width=\"1.168\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"38.198,21.121 38.017,21.356 37.968,22.434 38.198,22.136 \"/>\r\n<polygon fill=\"none\" points=\"38.198,19.564 38.09,19.703 38.031,21.033 38.198,20.816 \"/>\r\n<polygon fill=\"none\" points=\"38.198,25.948 37.787,26.48 37.707,28.305 38.198,27.666 \"/>\r\n<polygon fill=\"none\" points=\"38.198,23.918 37.883,24.325 37.805,26.078 38.198,25.568 \"/>\r\n<polygon fill=\"none\" points=\"38.198,18.042 38.164,18.087 38.104,19.38 38.198,19.26 \"/>\r\n<polygon fill=\"none\" points=\"40.463,36.357 39.315,35.208 39.315,37.994 40.621,39.301 \"/>\r\n<polygon fill=\"none\" points=\"40.648,39.821 39.315,38.487 39.315,41.569 40.824,43.079 \"/>\r\n<polygon fill=\"none\" points=\"38.198,17.305 38.178,17.764 38.198,17.737 \"/>\r\n<polygon fill=\"none\" points=\"40.853,43.644 39.315,42.105 39.315,44.256 40.887,44.256 \"/>\r\n<polygon fill=\"none\" points=\"41.069,47.673 39.315,47.673 39.315,47.961 41.185,49.833 \"/>\r\n<polygon fill=\"none\" points=\"41.217,50.439 39.315,48.536 39.315,51.836 41.293,51.836 \"/>\r\n<polygon fill=\"none\" points=\"50.778,42.158 50.38,41.74 49.98,42.158 \"/>\r\n<polygon fill=\"none\" points=\"38.198,48.631 36.71,50.561 36.653,51.836 38.198,51.836 \"/>\r\n<rect x=\"32.006\" y=\"59.315\" fill=\"none\" width=\"37.662\" height=\"1.03\"/>\r\n<polygon fill=\"none\" points=\"38.198,47.673 36.839,47.673 36.741,49.854 38.198,47.965 \"/>\r\n<rect x=\"31.363\" y=\"64.171\" fill=\"none\" width=\"1.167\" height=\"2.301\"/>\r\n<rect x=\"28.723\" y=\"64.171\" fill=\"none\" width=\"1.169\" height=\"2.301\"/>\r\n<polygon fill=\"none\" points=\"38.198,32.691 37.468,33.639 37.358,36.079 38.198,34.99 \"/>\r\n<polygon fill=\"none\" points=\"38.198,28.046 37.688,28.708 37.606,30.527 38.198,29.76 \"/>\r\n<polygon fill=\"none\" points=\"38.198,30.204 37.585,30.998 37.488,33.167 38.198,32.248 \"/>\r\n<polygon fill=\"none\" points=\"38.198,42.242 37.014,43.778 36.991,44.256 38.198,44.256 \"/>\r\n<polygon fill=\"none\" points=\"38.198,38.669 37.183,39.985 37.043,43.12 38.198,41.623 \"/>\r\n<polygon fill=\"none\" points=\"38.198,35.473 37.334,36.592 37.21,39.379 38.198,38.098 \"/>\r\n<polygon fill=\"none\" points=\"38.198,22.44 37.953,22.757 37.901,23.922 38.198,23.538 \"/>\r\n<polygon fill=\"none\" points=\"50.352,29.37 51.176,28.33 51.169,28.172 50.269,27.102 49.387,28.152 \"/>\r\n<polygon fill=\"none\" points=\"49.122,34.689 49.102,35.492 49.923,35.492 \"/>\r\n<polygon fill=\"none\" points=\"49.203,31.525 49.14,33.956 50.027,32.696 \"/>\r\n<polygon fill=\"none\" points=\"49.276,28.666 49.22,30.798 50.093,29.697 \"/>\r\n<polygon fill=\"none\" points=\"51.1,26.727 50.583,26.727 50.534,26.787 51.136,27.503 \"/>\r\n<polygon fill=\"none\" points=\"49.979,26.756 50.014,26.727 49.326,26.727 49.303,27.621 50.004,26.787 \"/>\r\n<polygon fill=\"none\" points=\"50.643,38.154 51.697,39.438 51.637,38.131 50.662,38.131 \"/>\r\n<polygon fill=\"none\" points=\"40.304,33.381 39.315,32.392 39.315,34.792 40.439,35.917 \"/>\r\n<polygon fill=\"none\" points=\"51.279,30.542 51.204,28.947 50.61,29.697 \"/>\r\n<polygon fill=\"none\" points=\"51.441,33.999 51.327,31.556 50.524,32.696 \"/>\r\n<polygon fill=\"none\" points=\"51.513,35.492 51.479,34.813 50.801,35.492 \"/>\r\n<polygon fill=\"none\" points=\"39.804,24.048 39.315,23.56 39.315,25.262 39.9,25.848 \"/>\r\n<polygon fill=\"none\" points=\"39.716,22.413 39.315,22.012 39.315,23.232 39.785,23.703 \"/>\r\n<polygon fill=\"none\" points=\"39.919,26.194 39.315,25.59 39.315,27.36 40.019,28.065 \"/>\r\n<polygon fill=\"none\" points=\"39.641,21.018 39.315,20.691 39.315,21.75 39.701,22.136 \"/>\r\n<polygon fill=\"none\" points=\"40.038,28.411 39.315,27.688 39.315,29.521 40.141,30.349 \"/>\r\n<polygon fill=\"none\" points=\"40.163,30.753 39.315,29.905 39.315,32.008 40.282,32.976 \"/>\r\n<polygon fill=\"none\" points=\"39.554,19.374 39.315,19.135 39.315,20.43 39.626,20.742 \"/>\r\n<polygon fill=\"none\" points=\"49.488,42.085 50.098,41.446 48.978,40.274 48.93,42.158 49.564,42.158 \"/>\r\n<polygon fill=\"none\" points=\"39.466,17.765 39.315,17.612 39.315,18.874 39.538,19.098 \"/>\r\n<polygon fill=\"none\" points=\"50.098,38.131 49.034,38.131 48.997,39.515 50.116,38.154 \"/>\r\n<polygon fill=\"none\" points=\"39.315,14.917 39.315,17.351 39.452,17.489 \"/>\r\n<image overflow=\"visible\" width=\"259\" height=\"314\" xlink:href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQcAAAE9CAYAAAAGSqdsAAAACXBIWXMAAC4jAAAuIwF4pT92AAAA\r\nGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAH/VJREFUeNrsnS90G0m2xks5AWIr\r\ntmLuRSsWsRGzFsUsZjGzWMziRfFDbqN10HrQeNA4aD3oOWgdNDKKB9mD4kFWkPWQxSym1ze6FZXL\r\n1eq/kqqrvt85fWy1WlJ3ddXX9966VSUEAACAGZPJpB5tm9EWoDQAeMozX4Uh+rMTbduoAgAAKQzN\r\naNuLtrtoO0KJAACkMBxF2/1kSgelAgCEQQrDAwvDLbsXAACPhaGuCQNxgpIBAMKwqwkDsYPSAcBv\r\ncdji4KPOBkoHAH+FoRVtVxMzLZQQAP66E8eTeBooJQD8FIcNpcsSlgMAGXnmqDBQF+VutM2zDgLc\r\nfgA8E4eIdrStJxwDywEAD8VhM9qSEpxe4vYD4BmRW/Flksw94g4A+CUMzUl6jlFiAPgjDp0M4nCP\r\nZCgA/Ik5ZBlMRb0Z+5FAtFEVAHBfHLJCw7ZDCAQA7rsV3Uk+zhCgBMBtcWhP8nOCOR4AcFccGglp\r\n0/N4wOxQADgac6jVaqPoz2XCYR+jbWzYT1bDJqoFAO4GJH+d895FtIXR9iHm/ReoFgC461o0eY5I\r\nk9vQ5WOCmEzK31CCADhqOUSuxTDGMriM3uvzMQO2InSGqBYAuJ3ncGKIPXzUxcLwuU+oFgA4LA5s\r\nGbzXLIGbhI/R++eoFgC4nyFJDf1nMeuZ0Cd/UZOe6Jj37JIAAFxHW8zmWHvvv0qg8ggJUAD4KxDU\r\nO9FU9t3zdiT3AwD8FYgev97haev3IAwAQCBIIDb5f1rsZhOuBABmap6JQyCmKdJj+Zd7NQAAnovD\r\nyZMCqNV6qAYAQBwmBnGooRoA8BTMBAUAgDgAACAOAICCPHf9Anni2Mac97vyfzliEwDggThE9MR0\r\n7cw4QuX/LqoEAJ4QWQafM8whiUxJABgfYg7Bgo4FAOJQcbJYA0ilBsAjcQAAQBwKA8sBAIiDkQBF\r\nAIAH4kCrX2X8CHorAPDEcoAlAADEwUgDtxgAiAPEBACIw8JYQxEAAHGA5QCAx+IQpDgGi9gAAHEw\r\nMkY1AABuRZIrgTwHACAORrciQHEAAHEwiQPGVgDgiTik6X34qr7AClgA+CEOafIWBqgGAMByMNFM\r\neA0AxMFT1rXXAYoEAIgDgTwHACAORj6gCADwTxzU+MEg5phr7TXGVwAg/EqfHuT4DAAQB0fJk7MA\r\nywEA4VfMYRSzv4NqAADEwcRrVAMAPBIHQxp03GK6F9prJEEB4LjlEKRs9Ifaa0wVB4Dj4tBMsBC+\r\nUavV9JmgMPAKAOFXzOEmxv0gERmgKgDgrzjEzRW5J+KDlQBAHDwgLubwg3gcnwhQLQBwWxz0ZKa4\r\nLsv34vHgK4gDAMKv3oqvpoNqtdqZiIlHAABx8MNyOJlz7J+oCgD4Iw46A9NOTpYaavswvgJAHHwX\r\nh4gd8TS3IUDVAL7z3KNrjUuf3hZPZ4OC5QBgOTh8bfrTfz/muA+wFADwSxzSjpE4FpgqDgCvxEHn\r\nwLSzVquRS3Gu7cbITABx8OQ6h5EInBdwSQCAODjKIOPxGJkJIA4OX5va45C0NsUAVQEAf8QhlWsw\r\nmUzakcsxgOUAgJ+Wg5y3wURIAqHtw2xQAOLgyXWSJbA35/1Qe43eCgBx8OQ6ycV4lVIYAADCn/Rp\r\ncjFo3oYnWZK1Wu06citIIF4Iy7oweQBYO+Xh1F2LoecA4pDQqHS34FJMMyGNKdQsEANFHGwZWxFk\r\nsGwuE1wnACAOBgvgd5plOhKAvJ9fpcWzLqaL/f4hprETOaMVdc/+KqbxkZekiajOADGHZPSuyHGO\r\nRmkD0gKiafVpfQ19klwSjRNUYwBxyE+a2aWHFltAI449vGah+8ACuC2Q6g3gVhRiEPdG5Gps8jyS\r\nXy22gGix31ds0fwcbUf8/yuBhC0AcSjkVowMiU6SdxyLGGui0TSshrUq1vmaKMZwyPGTMPr/r2K2\r\nSjhyMwDcigzmuOq7hzHH/k4CoTSyuO9YtdhdSGGgHdTDIqbD0K/l+RoWDwYA4mAQA5VetP095thD\r\nFogfEqyPVXPCgvAdHob+XjnfTVRpAHHIxg9KIxJaAxuyQHy0/Bo6MbNijy0WNABxsB4K4p3GvckC\r\ncWq55UA9EzvqjkgsWuwSSc5QpQHEIRtHPB3cPMYWxxx+5b9vqXeFhYFcJ8qI7KAag0Xgam9Fw2AZ\r\nZMWG6L+0Xk7ENA/jbbTtR8JA/2+Iad7DDR8X8HaNap2fqGypDHvKA+M4qj8jiIM75JmPYWzxddC5\r\nHYrZ6NJQTAeKUaV9L2bJUFhvozhbYjYGZ8yCcWJRtzbcijItB77B9ZgnhYzwDyy8jqZm/YR8ni/5\r\nPcqUPEV7Ls1q2GShVS03stZoQqAuLAf3kBZBXDcfmenfVtvWBmY1LL6W768plhKd9xhNuxRhIIuh\r\npZR1nevBG9ofHUNCfOaLFeGDOAw4O/JdzPtfpUCU4JossvLKAGTAcQb6ux3tvxSz1G90ZRYTBjWL\r\ndsBCccGvKUuVcmXa7GZcwq1ww3II5zScUApEkmuyQujcqRvzNVfaAzFbxm9fOdcATb2QMKi5LjeK\r\nSFAd+ZHr0ht2M3pYjb2aN/x2MuOet97EAB9PT4Mz7a3fLLiO3/hcjqLtjq9jh9+jdOlzfv+O/4a4\r\n+9mEIdquuOzo/neV+7/Hf//Lxza4DlGZP3AdO4w2dCVX7KarPPBNrMeJgyIQt5aKw516Hcr7HaVy\r\nQxyKCUObN/lA2eD/P2uf6yhi/cBiASuiouLwRU4bN08ctMb47XMWiYOswE3DMbsQh+LCwPulINwq\r\n5Xpniv+QBRdtfeV4WBEVFIf/xOxPEocHy8Th2PB+nSslxKGgMPB7O4rlcGWqI9p3kRtyDCuiuuJw\r\nmFMcJhZcx5XiGt3qTyau6HfzBASkEwZ+/1CxBPpKuTbmfCesiApVgIbW/sMM4nBimTjc86nI8zpX\r\nXCTqd/+s7P8ePAPZhYGP+Y8UWbYKpPC2U3w/rIgKVIJ2FnHQzMpQe6++4muRtJSKHbIASsGgJ9aW\r\nLUHUqgoDHyfFdkt73U35O7AiLK8IXZM4GERjYghI6eLQskEc+P8ttiTuuMI98P9d5ZohDjmFgY+V\r\nlkJHczN7Oepg5a0IL9KnlexCEzQRTBgTzKPP2bKKFM3VQJX2LW/Ej7VarZ/G7PVVGMTjBKdQnU2L\r\nRaCu3W9Cn3Kvy4seEZQ6PZg3BQDfE6o39Fs0VoPGwlB2JVmAZz5kV1bFcuixRXAfYznsssLTU+VU\r\ne6+74mvRczE6/CSSEfWmFme5Qg1IZzFwmZ2zC9DXApDy9a0WoOxzHQkzuBob7ALeIxZhnzjIhJWj\r\nGHGoKwJxZ7k4hIo4PKjmrhQM1IDUwUfdzfysCYVp+8Ll/sCvd9LEpTibdU+JYSAWsaKKsaXd9DsZ\r\n5Z+TPq0KhMqmLeKgRM8f2J994MraNgkJhCEx+Kg+RG75Cd9N2La4katp65spz6s+x4rAgLklVY49\r\nQ4ZkR21AMenTekLRN5fDAnG45ydPX+lmaypjQU7V7lsIQ+rgYzdvqjy7d33F4mhk+KzJighXHfz2\r\npYLoPQ57+pN4Tp5DN64bdIXi8EVxiT7zNGaygkozd0+6GxCGZGEoKg5KLEGykfGzJivilC0TWBFL\r\nFId2BnFo2SIOiht0p3RhbmjH9JQuzQcbcjOqIAwliUNdCVge5jxv3Yr4AitiueLQyCAOdYvEoZN0\r\nLny+JzblZqygnNqKMHxWYjBNbnyNRYgDf4fMg/jfAucvrYhTJdhphRXhYp7DowLNMnMwT7mm7mra\r\nch0RlzHnS4vqykV25Tnf+CIMYjoRi7QULiiPgbt4Qy5DykvYW/K9ElnqXPTnnPMo6L695o0mEP42\r\nNV10zA3EoRzWLP2uolC32VBL4qFK2fXUQpTC8ErZLROTKC7zRtm3aHEovEI7CQC7JyQEm3xd71gg\r\nKAHuLMXaKxCHBJpx5lucv0qTy5b9RCgReqKMZCMg94KfjnLquHd8niPhydT0McJANDhgG6j3UAZx\r\n09STnHVtHPMbebjkeznm61OtiDN+rwyGSWLjQ/r09ydvzP7vs08rjTGw6LzpfGj+wn1FIOgJ02Fh\r\nIEGg5f4oPXfDA2EIYoSBWOfy0Bt+WLY4sOsSaL+7KFdFLnvYLlEcaOLlw3kC4bo4DPhGboj42ad1\r\ngVDFob6Cii9/W/rRDa4QF1xJXvF5veAKfs1Pm7/y8R0lbjLSV+Z2gG6MMMgyM/VUbC/gPLaU+hH3\r\nu2WLxasSv2/M8Zhjb8WBo/f73MBMT4sDft80PX2wgorf4///opyD/uR7qVWaHSU+sq1YECQMu47d\r\nU3lPSCz74vGs4XJfoAnCQcz35BINTqp7Y/jdV4pIUNn/qYi53PdJpFtdrc6/0eDjf2XrsKM07o8i\r\nffC5rYiLdEHfUSA0eoCce+E7cF+x5Iq7+u4SZp+W/eRX2iSzkyWfezgpl98cvL+hNhTfNDy/m3QP\r\ntWM+J3UbcpdjS5mB+tHvarkWV/y6xe99UfbvmeYCNfzWrpIgdcTdsjJxSu3y3Exx7urs6nd8Dn29\r\n+7dylgO7BE3eqBBoQZFBiieL/D9gn51WK/rF9AFltat9gbUffOSbdZawcphcrPgHQx3pKFYDWQcH\r\nMoal9ED0ODZB7m3AXZR9kzCIx4Fmiicd8ipbAx4KTvVfdnnKoeDG9Ty14C29/55dCXJFf+JzJ7HY\r\nrdxKXjx1162SAdhNOF7nNMPs05ua5QHLwQ/LoSgPqsUQ54ooI4TlsPCelqSnDgCUFkMzxrLYYmvg\r\ngS2MY71tGCyGXW1pg55inYS6BVKFmEOzwNP8WlHdRNiC2BCz9RK/jfv3dQl2y2kbZmiS+1paI+kZ\r\nPl9mJmldtxgMdetSSXTaZitiTT712RqQFkNDsxj07yIL55StCPl96nqep0qs6pHFoPVOnHI5vOXP\r\n0zmc+BKQvMgRrR8aTM5rtEVrkJWbGtcL7T25T/fB92MadJnnREHJUYo5QG74WPnQeytm65++4f1D\r\n3jZSGK9DbtRNMVvPMxCzni3BLgR9f8fwfdf8HYESoOz7IA5lPPExY49dUEX/pDTuQLvflK34F/G4\r\nZ8qUwagfU9iSEfm6M+scOxgr1yR7KvJa2m/F0+nv9hLOQVpTZGW5Jw4lZakN0f6sF4dQqdBqXOWC\r\nzWK9oYYlNmaTJfB/OT73VZSQdp0ggGn5kzd5PU66FWWIwwDtz17YZ75UHgiP7h1P7qp/pm94kJTi\r\ntopp5N+lB4qz4lCmT6uaZMA9BiJfqvyAn9Lkq5+ZhMcVqiAORayBofKkiBvX304IWgZLvNaRYrk0\r\nxCx1eqTFQBrK9Y0N5zqAi5RogVDOAGVOqrkvVA8+Kq+7Yhrko/L8oInKteu9WK6Lg+oixA28CuVI\r\nx5j3lzm+oq8IgRy2+0HMeku+pbxq1/ez8lpW9AOPxOFSse6uleu+EbPRqnECQdmGemLctZLAFEpx\r\niPaFvgmoa25Fw+QicGLK25jPvJQVgQUid8yBE1biRkZeJ3Wr8vvX/F2yK+qM/Wiq6Lt8jUMxG304\r\nUirzL7LSe1SHDxRx6CuieZAkDvr9EdMApT5K11ucD0hy+uj+nM/Qk/eNKhBasKqe8ffjfutHkS1f\r\nQp9oRhU4Smhp8Xnvc9+0l7kYpkFDMkkoh8jsKwIxgji4bTk02Z1ocYMyNVw5OegbxZSc10jnUZ/j\r\nBmXNl2gqAtcVjzPnjsVsvMkrdo12hH1zUVRJZNTxNXI8whDi4C5b7DZ85Aa1b6gUQ2X24DfzGumK\r\naPF1UIWlYbtygo4BC9kaC8RAmtCU75EwOA0kC8Q6xMFtSBhuuEEN4/q2UwjEKqG8eRo5dyG0XHt2\r\ngcgc/onPW51DcSHiwLEPVTBHSVH7PJ+xyIKAONhICVNzUwU8SOOPGwTClvUfOixwxh4Vrswy1rGM\r\nVG/6LTUV94y3sj9jg0D8IjxOn7fdcsjqP+suwI9Zos6KQLwUs1F7NlSOy4RkmxMxmzVoGW6OOoPS\r\nIEVDb+b4zKrxPiD5zPLzM/n788xlPXh4nOOpMdR8zcCCcmglrOK0uUQRC1xvFMq6Fw2IQ4VICLTl\r\nXtBmDquuIBfsWoQxS8mTMMiejJslnHPDcWGQ+STrsBzcpYgw2BSlpicY9ba80gWChUFObfczC4mN\r\nT/cqCcqmmAV3vZ7Hw+XeikGBz361oBE02Prpc0JOQygL24hZwlWLhYFiJTuWNsZKuCKclSqtsI9c\r\nh9oQBzeol2Q5jHUfNOVUc8EiGhR3WZIg/FvMZvdZ44pLYy/mdtXCckjtTuxxmd6w2G4Ij3HNrQhW\r\n/L2NRTUo7q04ELOl8driae7DWIC89MRsRqb3NOcjYg52kzvlOMZkNO1PYzbakvMwMFg4I8P7izzf\r\nwNG2IKeCpyzUUwGsF4dSKiLP5RA3h56pF2BgW0Eo6w9If5iCZRRRVxdJGSoux6JYc7QtUF27FLP0\r\ndO+xPeZQxEz/qviSO2wymni0enWMONRXKAo9/lfO7zDm85uwayEHjNG5t5IsKBDLkN2JGxRFNcSh\r\nDBNcDnWOWyvzY4xALNyUZosmya3ZN5zDK0243nDlliLWME2RvsIpzaogVhTYPYckOCgOMSsDtcWs\r\na4qCef8yuRW6BbHEyh0I88zI84SpnmJf3Pd2V3R71tDUIA42xSfkXP2yu+/YJA5KN6H6RF5W3n9D\r\nLCYTb1Hfm5d6BeoPjf2g7uBjxBzcEwe9Aq6zYMjuvtGcIdu6QGAhm/nC4yJNtjIFBML9mEOL4w5h\r\nmiBTjAXheoMow0JzBRl7+i4QEAf71TwvFIB8nyUIN0cg4DO7L5TqfX9XIXdoYdie51CkUVIyy0nW\r\nD3FvRQjLwa+Yg3LfPyouhtcjM587VKl0c/csr9/IFsRQsVwgDh64IgbLsQlxcLMCbkU3upP0oZiu\r\nS2CPe7hqgYA4OMh2yuP2S7Rg6tCB6sMCcSSm0wV6e0+foSqUahY7Hbg0JZo5TNv3Sg9xKNcicL3x\r\nBD7cbE49fyvQW+EMCBraI5JVt45CFkKvE6FcGrK9tuBKg3iC466IMoJXrnZ1AXFwQxwaFp0LqGa5\r\n0bRwcnJZmpfT69mgEHNID+ZIcNgVUSaXpfv8SeRY88Q1nqPurhQyXT8or1+IcqPkQ67oiDkkQyN4\r\nKS9mIOyfsBfi4AFUEUPl9W7J4qB/v3UuAq/zaQNypjBKux/yeUlXtZ50ni6uau5yhmTZlB7T4PTu\r\ngdJQyl6fcVxypV2EaxVaUn/qSj0KFUtO3xdHD+LgrzgEAizCFdm27Hxfx4hi0nk6Jw7WBiQt7DpE\r\nHgVE1SueoVKBBYNeHrgVVlUq8rNN612axufPS3RZRxUBKS3dlmvT2j935MbUDQ3+xOD7mho7rYkY\r\nlyb7G56AsAJSsiXsCa5CHOa4IAN9erhIQHZiPkvJL8YJRbV+bkwVhzKYxw+IOVTwicaj7N7FvE37\r\nd1IEQNMESAPHGwDGl3hUNs6nT3NabDin4TbmCMSgoAUD/HFF/oA4VIMBC4NcQJdiDXGDaH6eIxAD\r\nPDXhiqTkBOKwPBpFxUHMFtCl1wcxxx4mCASsApjbicSssVppbA5IZmmMpnUy5QK6BK1fcW4aSMMD\r\nbA755RsRv6gJIvWwnrzCZnHIYjnoQkKDl7a5Qf+YZPLFCQSA9QRxcO+Jts0CQcOVD9OsXxEjEFhQ\r\ndfHW00C7j1Ww0AYQh+pCwkDZarRO5jCD36gLRF1zVRq0IC80olTUWFCrIlbbAcShugw5zpB5mq8E\r\ngSCz+hrtuTxXJCrvE0V8u1UQB/WcXcbVrkzqfTgtcPNJXEgg9HEXGJmJOIU3PHO0Ah7nXSdTE4gz\r\nVBEAcbCPLE/pNUPDLoMBqsh3kx9duRAHa7Ahs063PnxuIHAPIA6VtByW9bT3uYEgAcozCvVWsKlZ\r\nX2ZljJkFWD12mGVG44RjdUuhWWC25EaKz5Yd8KyXOLtzM8d11TN+phKWGdX7El1XN8VBTCfVbC35\r\nKR0mHBuIbJNuhBkaxHqBBpzmsy8WUIbhgsVh3nXVM36mKm4b1ftD18WhVlBBaaakLgww4Bn9yHL4\r\nBywHAIDJLcr6UBxVbeQmxAGA5bhrJAy7PokDDWySszxvo84AXywHkX1m8sotvFlUHE7ELOgEcQDA\r\nIQqJg9qd4/uKxABAHKZCQEOi2yg+ACAOOl0xm4INAABx+A4FZAIUHwDu8gxFAACAOAAAIA4AAIgD\r\nAADiAACAOAAAIA4AAIgDAADiAACAOAAAIA4AAIgDAADiAAAAEAcAAMQBAJCXvPM50Ey6H7R9mEMS\r\nAIfItajNZDKhyV70FYtuUZwAxFK5hXByWQ7RRY6iPyNNMHD7AXAIxBwAABAHAADEAQBQEFvWyryI\r\ntj5uB1gi+yiCaogDRXJD3A6wLCaTCcQBbgUAAOIAAHDOrWhHZl4PtwMAiIPOerS9wO0AAOKgY0rH\r\nBgCsEMQcAAAQBwAAxAEAAHEAAFgrDpPJJERRAuAWZfVWIBUVVJnBEn5j6Ks4AFBlDiAOT6mV8SUT\r\nTAMFKkwtAqXwFAQkAQDz3QqMbQC+UlbdjwyQE6csKqWAisweHaCKgQozKEkc/uaqOCBuAEAxcXAq\r\ndoGYAwDASNquTFrh6g9t38toa2r7qLvmU4rjsh67yt83/fZ2gXPMeuwn8bQbLO3vb2e4n9u457nK\r\n0ntxoAlgj7R9fzcUKvluYYrjsh67yt83/fZ2gXPMeuxJtF3m/P3tDPdzG/c8V1l6Lw6jyJ16FLSZ\r\nTCZjw3HjlMdlPXaVv2/67SLnmPXYYYHfz3I/cc/zlaWzIOYAAIA4AAAgDgAAiAMAAOIAAIA4AABW\r\nS9quzMZkMgm0fXXDcfWUx2U9dpW/b/rtIueY9dhmgd8vcizuOcQhFbTojL6uhKnwaF+Y4risx67y\r\n902/XeQcsx7bi7aNnL9f5Fjcc8/BwCsAympMGHgFAPABiAMAIDHm8KHgdxUZmGIaBVcmNLDmZcpj\r\nR7ypn1WDVqaRfUWhRYTbBT7/oeTzocFInZLKayCmA5lWfV9NmEa8AoM4hCsUB9MouLKoG65tqFSM\r\ncUJlp0byRjumz1tZ7BYUh7DkBvcvbZ9s4GnKi4Knr7VjzvgBUDadguJwIp6OeAVlMylGuMDz2o22\r\ne+W3Huj3qKsq2uopPk/HnWvn2y+zq4vPJzclngd19R1yGUnuom0nQ3m1o+1KO8XTaGsu4N52C9a7\r\nLlqup+IQfe8mV26Vo6wVNTq+E21ftO85jraGY+IQJ6T1guWe63sgDhCHhYgDVxz9CXaW9wlGMxQb\r\nKvyeK+IQI6THBcprz2CB9CAOEIeVigObtn3tNz7T/oImd2io8JtVFwe2jExCGhT4zgaLiwpZXx2I\r\nA8RhJeJATzr2cfVKubGg774qIjqrFofo4y1DTKXwNSnxGl2kz8uK10AcIA5Zn+5HizRn2Sr5XGbA\r\nbVXiwGJ3on3dbRnWkNaATfGaOsQB4rAUcWBh2NWE4YF937IDYRuG+MNh3t9ZhTjM65lYQN3oGQKd\r\nuxAHiMOyxGErpmeisaDr1YXoPq+FsiJxKKVnoqAQbUAcIA4LFYeyeyYyVHhTwK1ruziU3TNRIF5T\r\nNEgMcYA4JMYASu2ZyBhwK5wgtUxxWETPRMZ7VVqCFMQB4pD1aVRKz0TGxlYoQWpZ4hDTM7EUIZ1j\r\nteR2ZyAOEId5Zv1CeyYyBtxyJ0gtQxxieiaWKqTKuZSSIAVxgDjECcNSeiYynE/uBKlFi4NNQsrn\r\nU0qCFMQB4mD6raX2TBRwcVIlEy1SHGwTUi1eUyhBCuIAcTBViKX2TGQMuGVOkFqwOFgnpNq9zJ0g\r\nBXGAOOiNbyU9ExnKIXOC1KLEwWYh1eI1uRKkIA4QhySzfcPCssiUILUIcaiCkCpuz6F2nqkSpCAO\r\nEId5AbUtS8siU4JU2eJgQxdvjnjNWVYhgzh4Lg5zAmq7qwyopQy4pUqQKlMcbOuZyBivyZQgBXGA\r\nOJhyCI5sFgbl3FMlSJUlDrb2TGQor60sCVIQB4/FgYN7X8ocHr2igNvcBKkSxcHanokM7ljqBCmI\r\ng6fiENMt2LctoJayws9NkCpDHKrQM5GyvBoxmZwdiAPEIS5AdVXVm5mUIFVUHKrSM5GhvFppEqQg\r\nDp6JAz85jgxdW1sVL5/YBKkSxKEyPRMZyosa/u28BCmIg0fiEONzWt8zkaGM4hKkDguWX6V6JjKU\r\n144hQWoH4uCnOFS2ZyJDOe0ZEqQ+T8qhMj0TGeI1unDeSqsI4lCdG3llMANTi4MLPRMZAm7Hk/J5\r\nqFLPRMZ4jSlBqgVxWCzPS/yug2ijiklBoyZva8r/82iJ6ZqHLWUfrc14WKvVnFroNLqeET0N+VrX\r\nS/zqj1xeI8fKa8iWJdUlGWClngvqDj5HE66m2rd51p8dNg1PWfHvDQp+50rPRMaA25eSrIbKdfHm\r\nKC9TgtRZjrL6wj0fx5MlTI1XaWFelu/IFkXAT0z5d02zFgiyFP4ZPTFOPRDRXvTn32xxFeEfUXn1\r\nHS8rqkM0WnNfTFdOJ8bK/3GQJXUTbX+K6WrhN/x34JpVWklxMPndiki0+f+/8+v/ibbj6MaNPRAH\r\nqthkMr9NUcnnmd41Hyor15ujaNtOOJQa/R+KGHzbomIaoMlbLg6GBtJSxOKIhIEDkXUP7gFd50+K\r\nP52Hv3lUZ1tsbbViLITf+e81rINiPF/1CbCFcM2bCglDhxtN0/H7UFQEQ0/r71gTBNouXQvKems5\r\nJFgUbWV7wX/ruG3eI2MIl4ogwELwRRw0oWgqItFhoQhw+7xixHGEaykKkSBco1g8FwdNKFRrwpWE\r\nnxcFYw4fPKir0vW8htsAcUgSiYZD4kBddG8LfN75gCR6GpbP8wpXlhGbmpUnEroRGg6wjWcoAgAA\r\nxAEAAHEAAEAcAAAQBwAAxAEAAHEAAEAcAAAQBwAAxAEA4BzPUQRWMBDTCXXXtP0BigZAHPymzwIR\r\nQBwAAABYzf8LMAAjBZ+EmDX0swAAAABJRU5ErkJggg==\" transform=\"matrix(0.24 0 0 0.24 24.4927 4.3584)\">\r\n</image>\r\n</svg>\r\n";

},{}],369:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#87868A\" d=\"M87.5,0h-75C5.597,0,0,5.597,0,12.5v68.75v3.125V87.5C0,94.403,5.597,100,12.5,100h75\r\n\tc6.903,0,12.5-5.597,12.5-12.5v-3.05v-0.075V81.25V12.5C100,5.597,94.403,0,87.5,0z\"/>\r\n<g>\r\n\t<polygon fill=\"#FFFFFF\" points=\"31.938,75.387 80.157,75.387 39.272,64.817 \t\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M62.862,26.316c-3.225-4.659-6.419-6.866-9.354-7.633l11.216,40.351l1.564,2.226H41.752l-0.977,1.405\r\n\t\tl49.211,12.722h6.481L62.862,26.316z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M49.095,36.671l11.391,16.305l-9.621-34.612c-6.407,0.07-11.043,6.319-11.043,6.319L3.532,75.387\r\n\t\tl0.964-0.003l1.351-1.151l42.547-36.996L49.095,36.671z\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"45.243,43.236 8.305,75.355 24.205,75.239 \t\"/>\r\n</g>\r\n</svg>\r\n";

},{}],370:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  'area-trampa': _dereq_(359),
  'asignacion': _dereq_(360),
  'asignacion-tierra': _dereq_(361),
  'baterias': _dereq_(362),
  'bomba': _dereq_(363),
  'compresor': _dereq_(365),
  'cabezal_recoleccion': _dereq_(364),
  'default': _dereq_(369),
  'endulzadora': _dereq_(366),
  'entrega-cpg': _dereq_(367),
  'entrega-plataforma': _dereq_(368),
  'inyeccion': _dereq_(371),
  'mezcla': _dereq_(372),
  'mezcla-condensado': _dereq_(372),
  'mezcla-sin-condensado': _dereq_(372),
  'planta-liquidos': _dereq_(373),
  'planta-deshidratadora': _dereq_(374),
  'quemador': _dereq_(375),
  'temporal': _dereq_(376),
  'transporte-barco': _dereq_(377),
  'transporte': _dereq_(378),
  'transporte-ducto': _dereq_(378),
  'transporte-pipa': _dereq_(379)
};

},{"359":359,"360":360,"361":361,"362":362,"363":363,"364":364,"365":365,"366":366,"367":367,"368":368,"369":369,"371":371,"372":372,"373":373,"374":374,"375":375,"376":376,"377":377,"378":378,"379":379}],371:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<polygon fill=\"none\" points=\"51.681,56.941 51.681,52.188 51.681,29.593 48.321,29.593 48.321,56.941 48.379,56.941 48.379,66.834 \r\n\t51.681,66.834 \"/>\r\n<g>\r\n\t<path fill=\"#3A1B13\" d=\"M50.302,0.122c-27.448,0-49.697,22.25-49.697,49.698c0,5.98,1.072,11.705,3.009,17.014H24.39v-0.047h3.848\r\n\t\tV65.6h4.609v1.188h10.2v-4.866h-3.939v-9.966h3.939v-0.026h3.767V29.94h-1.84v-1.782h-0.013v-0.361h-0.215v0.141h-2.092v-0.141\r\n\t\tv-3.596H31.623v3.737h-2.093h-0.427H27.01h-0.041v-3.737H24.39v-3.303h2.579v-3.299h4.653v0.2v3.1h11.031v-3.1h2.092h0.215v-0.2\r\n\t\th0.013v-2.006h2.433v-2.592h1.16v-2.707h0.334l-5.42-5.281h-1.073c-0.437,0-0.792-0.358-0.792-0.792s0.356-0.792,0.792-0.792\r\n\t\th15.337c0.438,0,0.788,0.357,0.788,0.792s-0.395,0.792-0.83,0.792H56.63l-5.42,5.281h0.427v0.171h3.869v2.093h-3.869v0.443h1.217\r\n\t\tv2.592h2.258h0.003v2.093h-0.003v0.113h2.075h0.017v3.1h11.223v-3.299h4.653v0.2v3.1h8.906v3.303h-8.906v3.737h-2.092H70.56h-2.094\r\n\t\th-0.04v-3.737H57.203v3.737h-2.092v-0.141h-0.026v0.254h0.029v1.889h-2.042v21.989h4.345v0.026h4.173v9.966h-4.173v4.866h10.452\r\n\t\tV65.6h4.608v1.188h5.974v0.004h16.823h1.73C98.933,61.494,100,55.784,100,49.82C100,22.373,77.749,0.122,50.302,0.122z\"/>\r\n\t<polygon fill=\"#3A1B13\" points=\"48.321,56.941 48.379,56.941 48.379,66.834 51.681,66.834 51.681,56.941 51.681,52.188 \r\n\t\t51.681,29.593 48.321,29.593 \t\"/>\r\n\t<polygon fill=\"#3A1B13\" points=\"49.265,8.477 49.265,5.014 45.726,5.014 \t\"/>\r\n\t<polygon fill=\"#3A1B13\" points=\"50.85,5.014 50.85,8.48 54.389,5.014 \t\"/>\r\n</g>\r\n<polygon fill=\"none\" points=\"48.321,56.941 48.379,56.941 48.379,66.834 51.681,66.834 51.681,56.941 51.681,52.188 51.681,29.593 \r\n\t48.321,29.593 \"/>\r\n<g>\r\n\t<path fill=\"#A44C29\" d=\"M94.794,70.08H78.451v0.011h-5.974v1.477h-4.608v-1.477H57.417v28.914c6.602-0.951,12.781-3.2,18.278-6.479\r\n\t\th0.021c1.211-0.721,2.385-1.498,3.526-2.317c7.114-5.106,12.818-12.048,16.437-20.129H94.794z\"/>\r\n\t<path fill=\"#A44C29\" d=\"M32.847,70.123v1.444h-4.609v-1.444H5.052H4.946c3.617,8.063,9.312,14.988,16.416,20.086\r\n\t\tc1.14,0.819,2.314,1.597,3.524,2.317h0.022c5.123,3.056,10.845,5.2,16.942,6.252c0.042,0.006,0.082,0.014,0.124,0.02\r\n\t\tc0.358,0.062,0.712,0.133,1.073,0.187v-0.019V70.123h-0.219H32.847z\"/>\r\n\t<path fill=\"#A44C29\" d=\"M48.379,99.472c0.676,0.027,1.354,0.046,2.038,0.046c0.423,0,0.843-0.011,1.264-0.021v-0.002V85.321v-1.616\r\n\t\tV69.503v-1.614v-1.055h-3.302V99.472z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],372:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A653C\" d=\"M87.421,0.142H12.634c-6.884,0-12.465,5.581-12.465,12.464v68.555v3.116v3.116\r\n\tc0,6.884,5.581,12.465,12.465,12.465h74.787c6.884,0,12.465-5.581,12.465-12.465v-3.041v-0.075v-3.116V12.606\r\n\tC99.886,5.723,94.305,0.142,87.421,0.142z\"/>\r\n<path fill=\"#2B4A35\" d=\"M12.946,99.858h74.788c6.884,0,12.465-5.581,12.465-12.465v-3.041l-0.045-0.075H0.481v3.116\r\n\tC0.481,94.277,6.063,99.858,12.946,99.858z\"/>\r\n<rect x=\"0.481\" y=\"81.161\" fill=\"#FFFFFF\" width=\"99.717\" height=\"3.116\"/>\r\n<path fill=\"#FFFFFF\" d=\"M97.877,60.437v-2.218h-0.959v0.639h-0.471v-0.944c0-1.186-0.962-2.146-2.147-2.146\r\n\tc-1.187,0-2.146,0.961-2.146,2.146v2.573h-6.938l-0.496-1.073h0.388c0.342,0,0.615-0.275,0.615-0.616s-0.273-0.617-0.615-0.617\r\n\th-0.547V42.236h0.547c0.342,0,0.615-0.276,0.615-0.616c0-0.341-0.273-0.617-0.615-0.617h-0.547v-16.54h0.547\r\n\tc0.342,0,0.615-0.277,0.615-0.618c0-0.338-0.273-0.616-0.615-0.616H76.52c-0.342,0-0.616,0.277-0.616,0.616\r\n\tc0,0.341,0.274,0.618,0.616,0.618h0.497v16.54H76.52c-0.342,0-0.616,0.276-0.616,0.617c0,0.34,0.274,0.616,0.616,0.616h0.497V58.18\r\n\tH76.52c-0.342,0-0.616,0.276-0.616,0.617s0.274,0.616,0.616,0.616h0.337l-0.501,1.073H55.847l-0.498-1.073h0.389\r\n\tc0.34,0,0.615-0.275,0.615-0.616s-0.275-0.617-0.615-0.617h-0.548V42.236h0.548c0.34,0,0.615-0.276,0.615-0.616\r\n\tc0-0.341-0.275-0.617-0.615-0.617h-0.548v-5.319h1.614v1.501h1.477v-1.023l3.134,3.187v1.129c0,0.383,0.31,0.698,0.687,0.698h0.465\r\n\tc0.377,0,0.688-0.315,0.688-0.698v-14.46c0-0.384-0.311-0.698-0.688-0.698h-0.465c-0.377,0-0.687,0.314-0.687,0.698v1.13\r\n\tl-3.134,3.187v-1.024h-1.477v1.501h-1.614v-6.35h0.548c0.34,0,0.615-0.277,0.615-0.618c0-0.338-0.275-0.616-0.615-0.616h-8.588\r\n\tc-0.341,0-0.617,0.277-0.617,0.616c0,0.341,0.276,0.618,0.617,0.618h0.497v16.54h-0.497c-0.341,0-0.617,0.276-0.617,0.617\r\n\tc0,0.34,0.276,0.616,0.617,0.616h0.497V58.18h-0.497c-0.341,0-0.617,0.276-0.617,0.617s0.276,0.616,0.617,0.616h0.337l-0.5,1.073\r\n\tH23.614l-0.496-1.073h0.387c0.341,0,0.617-0.275,0.617-0.616s-0.276-0.617-0.617-0.617h-0.546V42.236h0.546\r\n\tc0.341,0,0.617-0.276,0.617-0.616c0-0.341-0.276-0.617-0.617-0.617h-0.546v-16.54h0.546c0.341,0,0.617-0.277,0.617-0.618\r\n\tc0-0.338-0.276-0.616-0.617-0.616h-8.587c-0.34,0-0.618,0.277-0.618,0.616c0,0.341,0.278,0.618,0.618,0.618h0.496v16.54h-0.496\r\n\tc-0.34,0-0.618,0.276-0.618,0.617c0,0.34,0.278,0.616,0.618,0.616h0.496V58.18h-0.496c-0.34,0-0.618,0.276-0.618,0.617\r\n\ts0.278,0.616,0.618,0.616h0.336l-0.5,1.073H7.383v-2.573c0-1.186-0.963-2.146-2.146-2.146c-1.186,0-2.148,0.961-2.148,2.146v0.944\r\n\th-0.47v-0.639H1.659v2.218h0.959v-0.636h0.47v5.021h-0.47v-0.639H1.659v2.219h0.959v-0.637h0.47v5.338h-0.47v-0.637H1.659v2.218\r\n\th0.959v-0.638h0.47v0.607c0,1.185,0.962,2.146,2.148,2.146c1.184,0,2.146-0.962,2.146-2.146v-2.465h84.77v2.465\r\n\tc0,1.185,0.96,2.146,2.146,2.146c1.186,0,2.147-0.962,2.147-2.146v-0.607h0.471v0.638h0.959v-2.218h-0.959v0.637h-0.471v-5.338\r\n\th0.471v0.637h0.959v-2.219h-0.959v0.639h-0.471v-5.021h0.471v0.636H97.877z M58.617,32.118l2.797-2.845v7.952l-2.806-2.854\r\n\tc0.106-0.335,0.166-0.724,0.166-1.141C58.774,32.826,58.718,32.446,58.617,32.118z\"/>\r\n</svg>\r\n";

},{}],373:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.493-0.052H12.454c-6.906,0-12.506,5.6-12.506,12.506V81.24v3.127v3.126\r\n\tc0,6.907,5.6,12.507,12.506,12.507h75.039C94.4,100,100,94.4,100,87.493v-3.051v-0.075V81.24V12.454\r\n\tC100,5.548,94.4-0.052,87.493-0.052z\"/>\r\n<rect x=\"-0.052\" y=\"81.24\" fill=\"#FFFFFF\" width=\"100.052\" height=\"3.127\"/>\r\n<path fill=\"#822424\" d=\"M12.454,100h75.039C94.4,100,100,94.4,100,87.493v-3.051l-0.045-0.075H-0.052v3.126\r\n\tC-0.052,94.4,5.548,100,12.454,100z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M23.363,64.57c-1.538-1.593-2.845-3.402-3.875-5.383v14.494h-3.715v2.742h11.141v-2.742h-3.551V64.57z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M42.899,71.351c-1.007,0.138-2.027,0.232-3.069,0.232c-0.273,0-0.535-0.033-0.806-0.043v2.142H35.31v2.742\r\n\t\th11.142v-2.742h-3.552V71.351z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M61.629,55.729c-0.856,2.637-2.183,5.06-3.874,7.184v10.77H54.04v2.742h11.142v-2.742h-3.553V55.729z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M43.384,16.925h31.001V35.84c0.085-0.023,0.189-0.055,0.27-0.074l1.136-0.186\r\n\t\tc0.276-0.035,0.407-0.045,0.54-0.05l0.569-0.011l1.76,0.185c0.328,0.066,0.59,0.134,0.849,0.211l0.689,0.309V14.02\r\n\t\tc0-1.605-1.302-2.906-2.907-2.906H40.477c-1.604,0-2.907,1.301-2.907,2.906v7.266h5.813V16.925z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M80.197,53.491l-0.248,0.093c-0.102,0.04-0.233,0.083-0.36,0.121l-0.206,0.101l-0.045-0.026l-0.218,0.059\r\n\t\tc-0.06,0.017-0.149,0.035-0.242,0.053l-1.296,0.2l-0.379,0.027c0,0-0.006,0-0.017,0.001c-0.018,0.003-0.041,0.004-0.075,0.004\r\n\t\tl-0.212,0.006l-0.095,0.001l-1.039-0.063c-0.288-0.032-0.466-0.058-0.639-0.089l-0.399-0.082c-0.093-0.02-0.221-0.052-0.343-0.089\r\n\t\tv19.874h-2.907v2.742h11.142v-2.742h-2.422V53.491z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M61.771,44.066h-0.88c-1.296-5.857-4.932-10.827-9.92-13.834v-7.688H29.035v7.484\r\n\t\tc-5.156,2.988-8.927,8.05-10.251,14.038h-1.217c-2.203,0-3.989,1.785-3.989,3.987c0,2.203,1.786,3.989,3.989,3.989h0.948\r\n\t\tc1.602,10.349,10.524,18.281,21.319,18.281c10.799,0,19.719-7.933,21.323-18.281h0.613c2.203,0,3.989-1.786,3.989-3.989\r\n\t\tC65.76,45.851,63.974,44.066,61.771,44.066z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M85.162,44.572c0-0.067-0.005-0.132-0.008-0.197c-0.005-0.108-0.018-0.217-0.028-0.328\r\n\t\tc-0.004-0.039-0.005-0.079-0.012-0.118c-0.002-0.038-0.004-0.071-0.01-0.107c-0.008-0.083-0.019-0.163-0.031-0.246\r\n\t\tc-0.009-0.077-0.022-0.153-0.035-0.23c-0.014-0.063-0.026-0.125-0.041-0.188c0-0.009-0.005-0.021-0.005-0.03\r\n\t\tc-0.007-0.026-0.01-0.056-0.018-0.083c-0.012-0.057-0.024-0.115-0.038-0.17c0-0.009-0.002-0.012-0.004-0.019\r\n\t\tc-0.009-0.04-0.02-0.077-0.029-0.113c-0.011-0.05-0.025-0.097-0.04-0.146c-0.003-0.025-0.013-0.05-0.02-0.076\r\n\t\tc-0.015-0.054-0.032-0.106-0.049-0.161c-0.004-0.008-0.007-0.019-0.009-0.029c-0.006-0.02-0.012-0.037-0.017-0.056\r\n\t\tc-0.032-0.098-0.067-0.198-0.102-0.296c-0.033-0.091-0.067-0.18-0.102-0.268c-0.016-0.039-0.033-0.075-0.05-0.115\r\n\t\tc-0.005-0.016-0.014-0.026-0.017-0.042c-0.015-0.032-0.03-0.069-0.045-0.104c-0.037-0.084-0.079-0.17-0.118-0.255\r\n\t\tc-0.041-0.085-0.083-0.171-0.129-0.253c-0.01-0.022-0.024-0.042-0.035-0.065c-0.013-0.02-0.021-0.039-0.03-0.055\r\n\t\tc-0.023-0.042-0.046-0.086-0.068-0.127c-0.075-0.131-0.151-0.258-0.234-0.384c-0.028-0.042-0.056-0.086-0.086-0.129\r\n\t\tc-0.007-0.013-0.017-0.024-0.024-0.036c-0.004-0.007-0.009-0.015-0.015-0.023c-0.047-0.067-0.093-0.133-0.141-0.197\r\n\t\tc-0.038-0.055-0.082-0.112-0.122-0.165s-0.086-0.103-0.125-0.154c-0.044-0.055-0.087-0.106-0.133-0.16\r\n\t\tc-0.032-0.041-0.063-0.079-0.094-0.117c-0.063-0.073-0.124-0.138-0.192-0.207c-0.051-0.058-0.105-0.114-0.161-0.168\r\n\t\tc-0.013-0.015-0.026-0.028-0.041-0.042c-0.061-0.061-0.125-0.127-0.191-0.186c-0.026-0.025-0.055-0.048-0.082-0.075\r\n\t\tc-0.087-0.077-0.175-0.153-0.266-0.229c-0.017-0.016-0.032-0.031-0.052-0.045c-0.007-0.006-0.015-0.014-0.021-0.019\r\n\t\tc-0.074-0.058-0.146-0.118-0.222-0.175c-0.072-0.054-0.145-0.108-0.22-0.163c-0.025-0.017-0.056-0.034-0.082-0.051\r\n\t\tc-0.124-0.086-0.257-0.166-0.386-0.246c-0.086-0.051-0.164-0.11-0.249-0.157c-0.058-0.033-0.117-0.066-0.175-0.1\r\n\t\tc-0.088-0.045-0.174-0.089-0.264-0.131c-0.077-0.039-0.158-0.079-0.237-0.115c-0.053-0.023-0.105-0.048-0.157-0.068\r\n\t\tc-0.008-0.004-0.016-0.006-0.022-0.009c-0.006-0.002-0.011-0.002-0.017-0.005c-0.047-0.023-0.096-0.041-0.146-0.064\r\n\t\tc-0.07-0.027-0.147-0.056-0.221-0.084c-0.094-0.034-0.186-0.064-0.274-0.095c-0.033-0.011-0.065-0.018-0.097-0.028\r\n\t\tc-0.01-0.003-0.021-0.005-0.035-0.011c-0.013-0.002-0.026-0.01-0.04-0.013c-0.229-0.07-0.465-0.13-0.7-0.181\r\n\t\tc-0.014-0.001-0.024-0.003-0.04-0.007c-0.001,0-0.001,0-0.003,0c-0.06-0.011-0.12-0.024-0.178-0.036\r\n\t\tc-0.121-0.021-0.243-0.042-0.365-0.059c-0.066-0.007-0.134-0.014-0.202-0.024c-0.023-0.002-0.047-0.004-0.071-0.006\r\n\t\tc-0.01-0.001-0.02-0.001-0.028-0.001c-0.117-0.012-0.234-0.023-0.354-0.031c-0.105-0.005-0.216-0.009-0.324-0.011\r\n\t\tc-0.053,0-0.104-0.002-0.154-0.002c-0.044,0-0.087,0-0.129,0.002c-0.098,0.002-0.199,0.004-0.299,0.01\r\n\t\tc-0.115,0.006-0.23,0.013-0.344,0.024c-0.023,0.003-0.042,0.006-0.063,0.008c-0.016,0-0.027,0.001-0.044,0.003\r\n\t\tc-0.046,0.005-0.09,0.008-0.135,0.016c-0.026,0-0.052,0.006-0.074,0.008c-0.024,0.001-0.048,0.005-0.071,0.008\r\n\t\tc-0.049,0.006-0.096,0.014-0.143,0.023c-0.007,0-0.013,0-0.016,0c-0.094,0.017-0.186,0.033-0.275,0.051\r\n\t\tc-0.024,0.006-0.048,0.01-0.07,0.015c-0.012,0.002-0.026,0.006-0.037,0.008c-0.048,0.009-0.093,0.017-0.139,0.028\r\n\t\tc-0.031,0.005-0.063,0.012-0.092,0.021c-0.17,0.04-0.338,0.084-0.503,0.136c-0.022,0.008-0.048,0.014-0.072,0.021\r\n\t\tc-0.056,0.02-0.113,0.037-0.17,0.057c-0.055,0.02-0.108,0.039-0.166,0.057c-0.112,0.041-0.223,0.086-0.334,0.134\r\n\t\tc-0.033,0.012-0.067,0.026-0.1,0.042c-0.009,0.002-0.019,0.005-0.028,0.008c-0.083,0.037-0.167,0.073-0.247,0.112\r\n\t\tc-0.084,0.038-0.162,0.078-0.245,0.122c-0.047,0.023-0.095,0.049-0.142,0.075c-0.025,0.011-0.047,0.026-0.07,0.038\r\n\t\tc-0.047,0.026-0.1,0.051-0.144,0.079c-0.151,0.086-0.302,0.179-0.447,0.276c-0.014,0.011-0.027,0.021-0.042,0.029\r\n\t\tc-0.018,0.012-0.033,0.023-0.051,0.034c-0.037,0.025-0.072,0.049-0.11,0.075c-0.007,0.006-0.016,0.013-0.026,0.016\r\n\t\tc-0.09,0.069-0.181,0.135-0.269,0.202c-0.059,0.046-0.117,0.096-0.177,0.143c-0.018,0.012-0.033,0.026-0.049,0.039\r\n\t\tc-0.019,0.018-0.04,0.032-0.059,0.047c-0.031,0.029-0.063,0.055-0.094,0.082c-0.043,0.039-0.088,0.077-0.134,0.118\r\n\t\tc-0.081,0.075-0.158,0.151-0.235,0.228c-0.026,0.024-0.049,0.044-0.072,0.069c-0.005,0.005-0.013,0.011-0.018,0.016\r\n\t\tc-0.049,0.049-0.099,0.097-0.144,0.147c-0.061,0.065-0.125,0.132-0.182,0.201c-0.052,0.059-0.104,0.119-0.153,0.18\r\n\t\tc-0.004,0.007-0.01,0.012-0.014,0.017c-0.008,0.012-0.018,0.021-0.027,0.032c-0.066,0.082-0.134,0.165-0.197,0.253\r\n\t\tc-0.07,0.09-0.139,0.186-0.202,0.28c-0.014,0.016-0.023,0.033-0.035,0.047c-0.016,0.025-0.031,0.052-0.05,0.077\r\n\t\tc-0.018,0.026-0.037,0.053-0.056,0.079c-0.044,0.068-0.09,0.137-0.128,0.208c-0.05,0.077-0.099,0.157-0.141,0.237\r\n\t\tc-0.021,0.036-0.039,0.072-0.059,0.107c-0.006,0.01-0.015,0.022-0.02,0.033c-0.01,0.015-0.018,0.033-0.026,0.05\r\n\t\tc-0.042,0.072-0.075,0.146-0.112,0.218c-0.034,0.066-0.065,0.13-0.092,0.196c-0.028,0.057-0.055,0.112-0.074,0.169\r\n\t\tc-0.009,0.014-0.015,0.029-0.021,0.044c-0.009,0.021-0.02,0.044-0.027,0.064c0,0.002,0,0.004-0.003,0.005\r\n\t\tc-0.029,0.066-0.055,0.135-0.084,0.201c-0.06,0.155-0.112,0.312-0.166,0.469c-0.006,0.019-0.009,0.038-0.017,0.057\r\n\t\tc0,0.004-0.002,0.011-0.005,0.017c-0.019,0.055-0.035,0.112-0.05,0.167c-0.01,0.026-0.017,0.051-0.02,0.076\r\n\t\tc-0.015,0.048-0.029,0.096-0.04,0.146c-0.011,0.036-0.021,0.073-0.029,0.113c-0.002,0.007-0.004,0.01-0.004,0.019\r\n\t\tc-0.016,0.055-0.027,0.113-0.04,0.17c-0.006,0.027-0.009,0.055-0.014,0.08c-0.006,0.013-0.008,0.026-0.011,0.039\r\n\t\tc-0.011,0.059-0.021,0.123-0.034,0.183c-0.015,0.077-0.029,0.153-0.038,0.23c-0.014,0.083-0.024,0.164-0.034,0.246\r\n\t\tc-0.004,0.031-0.004,0.062-0.008,0.092c-0.006,0.054-0.008,0.104-0.013,0.155c-0.009,0.103-0.021,0.204-0.026,0.305\r\n\t\tc-0.004,0.065-0.006,0.13-0.009,0.197c0,0.081-0.005,0.166-0.005,0.25c0,0.085,0.005,0.17,0.005,0.252\r\n\t\tc0.003,0.064,0.005,0.131,0.009,0.195c0.006,0.103,0.018,0.205,0.026,0.306c0.005,0.05,0.007,0.101,0.013,0.153\r\n\t\tc0.004,0.029,0.004,0.063,0.008,0.094c0.01,0.083,0.021,0.164,0.034,0.248c0.009,0.075,0.023,0.151,0.038,0.228\r\n\t\tc0.013,0.065,0.024,0.125,0.036,0.189c0.003,0.008,0.003,0.019,0.009,0.028c0.005,0.028,0.006,0.058,0.014,0.086\r\n\t\tc0.013,0.056,0.024,0.115,0.04,0.173c0,0.005,0.002,0.006,0.004,0.014c0.009,0.04,0.019,0.081,0.029,0.116l0.031,0.119\r\n\t\tc0.002,0.019,0.012,0.036,0.017,0.055c0.017,0.062,0.036,0.125,0.054,0.186c0.006,0.022,0.015,0.045,0.021,0.064\r\n\t\tc0.009,0.024,0.014,0.049,0.022,0.072c0,0.005,0.002,0.011,0.004,0.019c0.007,0.024,0.017,0.051,0.026,0.079\r\n\t\tc0.017,0.048,0.034,0.096,0.052,0.142c0.007,0.026,0.019,0.053,0.026,0.078c0.039,0.103,0.077,0.205,0.122,0.306\r\n\t\tc0.004,0.014,0.012,0.027,0.017,0.045c0.04,0.089,0.078,0.178,0.119,0.265c0.038,0.081,0.076,0.16,0.117,0.24\r\n\t\tc0.023,0.049,0.052,0.093,0.076,0.14c0.024,0.049,0.052,0.097,0.078,0.146c0.021,0.038,0.04,0.077,0.061,0.114\r\n\t\tc0.046,0.079,0.093,0.156,0.14,0.234c0.059,0.092,0.117,0.188,0.178,0.279c0.063,0.09,0.127,0.178,0.192,0.268\r\n\t\tc0.042,0.057,0.087,0.116,0.129,0.174c0.04,0.05,0.082,0.099,0.123,0.148c0.024,0.031,0.05,0.061,0.077,0.094\r\n\t\tc0.027,0.031,0.053,0.065,0.079,0.094c0.045,0.055,0.094,0.109,0.144,0.164c0.066,0.074,0.136,0.14,0.206,0.212\r\n\t\tc0.033,0.037,0.069,0.075,0.105,0.113c0.024,0.021,0.044,0.046,0.066,0.068c0.062,0.057,0.125,0.114,0.186,0.173\r\n\t\tc0.076,0.068,0.151,0.136,0.228,0.197c0.021,0.021,0.043,0.038,0.065,0.054c0.009,0.008,0.017,0.016,0.027,0.023\r\n\t\tc0.055,0.042,0.106,0.089,0.16,0.133c0.091,0.068,0.183,0.139,0.279,0.205c0.025,0.019,0.051,0.037,0.077,0.053\r\n\t\tc0.025,0.021,0.056,0.04,0.084,0.062c0.019,0.011,0.038,0.021,0.054,0.033c0.046,0.031,0.092,0.063,0.141,0.094\r\n\t\tc0.152,0.099,0.31,0.194,0.472,0.282c0.014,0.007,0.026,0.014,0.042,0.021c0.004,0.004,0.008,0.007,0.013,0.007\r\n\t\tc0.058,0.031,0.112,0.063,0.171,0.091c0.02,0.012,0.043,0.021,0.063,0.031c0.099,0.051,0.198,0.098,0.3,0.143\r\n\t\tc0,0,0,0.004,0.002,0.004c0.054,0.023,0.111,0.047,0.166,0.07c0.011,0.003,0.023,0.009,0.036,0.017\r\n\t\tc0.034,0.015,0.067,0.027,0.102,0.043c0.075,0.027,0.149,0.059,0.223,0.086c0.077,0.029,0.154,0.053,0.229,0.079\r\n\t\tc0.014,0.007,0.023,0.011,0.031,0.013c0.055,0.018,0.105,0.033,0.156,0.051c0.006,0,0.01,0,0.015,0.003\r\n\t\tc0.018,0.006,0.038,0.013,0.059,0.019c0.038,0.015,0.08,0.025,0.122,0.035c0.04,0.013,0.081,0.023,0.121,0.032\r\n\t\tc0.105,0.033,0.217,0.06,0.329,0.082c0.045,0.013,0.09,0.021,0.136,0.029c0.016,0.005,0.032,0.008,0.049,0.012\r\n\t\tc0.049,0.009,0.1,0.02,0.15,0.03c0.19,0.033,0.389,0.058,0.585,0.08c0.028,0.002,0.054,0.009,0.08,0.013\r\n\t\tc0.007,0,0.01,0,0.013,0.002c0.118,0.01,0.235,0.021,0.351,0.026c0.118,0.005,0.234,0.012,0.351,0.013\r\n\t\tc0.042,0.002,0.085,0.002,0.129,0.002c0.051,0,0.102-0.002,0.154-0.002c0.052,0,0.102-0.001,0.152-0.006\r\n\t\tc0.013,0,0.028,0,0.039-0.002c0.055-0.001,0.106-0.003,0.157-0.009c0.066-0.002,0.131-0.013,0.197-0.018\r\n\t\tc0.095-0.007,0.189-0.018,0.287-0.028c0.069-0.01,0.139-0.012,0.206-0.021c0.094-0.016,0.188-0.029,0.282-0.048\r\n\t\tc0.042-0.007,0.084-0.018,0.125-0.026c0.072-0.014,0.14-0.029,0.21-0.048c0.092-0.019,0.185-0.033,0.27-0.059\r\n\t\tc0.07-0.017,0.138-0.032,0.202-0.052c0.034-0.011,0.066-0.02,0.104-0.03c0.025-0.01,0.053-0.018,0.081-0.024\r\n\t\tc0.006-0.003,0.012-0.006,0.019-0.006c0.007-0.006,0.018-0.007,0.026-0.011c0.104-0.029,0.21-0.064,0.31-0.103\r\n\t\tc0.098-0.035,0.195-0.075,0.288-0.108c0.033-0.016,0.066-0.03,0.101-0.045c0.026-0.013,0.053-0.024,0.079-0.034\r\n\t\tc0.06-0.025,0.119-0.05,0.179-0.076c0.066-0.03,0.133-0.065,0.196-0.095c0.069-0.033,0.14-0.065,0.205-0.106\r\n\t\tc0.026-0.013,0.054-0.025,0.08-0.042c0.013-0.007,0.024-0.012,0.036-0.019c0.017-0.009,0.032-0.016,0.049-0.026\r\n\t\tc0.046-0.022,0.086-0.055,0.127-0.081c0.217-0.125,0.424-0.256,0.627-0.395c0.026-0.022,0.058-0.035,0.083-0.056\r\n\t\tc0.046-0.032,0.089-0.064,0.133-0.096c0.055-0.044,0.107-0.083,0.16-0.126c0.046-0.034,0.089-0.069,0.132-0.105\r\n\t\tc0.003-0.002,0.007-0.006,0.009-0.008c0.011-0.008,0.022-0.017,0.033-0.026c0.093-0.077,0.178-0.154,0.265-0.232\r\n\t\tc0.1-0.09,0.195-0.181,0.291-0.276c0.069-0.069,0.136-0.143,0.205-0.213c0.028-0.027,0.048-0.051,0.071-0.077\r\n\t\tc0.049-0.054,0.101-0.11,0.149-0.168c0.025-0.031,0.052-0.066,0.08-0.099c0.021-0.024,0.039-0.045,0.058-0.068\r\n\t\tc0.022-0.028,0.047-0.054,0.069-0.085c0.033-0.041,0.069-0.082,0.101-0.128c0.032-0.043,0.066-0.084,0.099-0.132\r\n\t\tc0.064-0.085,0.126-0.173,0.188-0.26c0.06-0.093,0.121-0.188,0.18-0.282c0.059-0.094,0.113-0.189,0.166-0.285\r\n\t\tc0.023-0.036,0.046-0.078,0.064-0.115c0.005-0.004,0.006-0.007,0.007-0.011c0.003-0.006,0.007-0.011,0.009-0.016\r\n\t\tc0.03-0.053,0.059-0.105,0.085-0.161c0.044-0.085,0.085-0.167,0.122-0.251c0.044-0.085,0.081-0.175,0.118-0.264\r\n\t\tc0.007-0.016,0.015-0.033,0.025-0.052c0-0.008,0.005-0.014,0.007-0.021c0.086-0.206,0.163-0.416,0.232-0.628\r\n\t\tc0.008-0.023,0.016-0.049,0.023-0.074c0.006-0.021,0.013-0.041,0.019-0.062c0.019-0.06,0.035-0.124,0.053-0.186\r\n\t\tc0.007-0.019,0.016-0.036,0.02-0.055l0.03-0.119c0.01-0.036,0.021-0.076,0.029-0.116c0.002-0.008,0.004-0.009,0.004-0.014\r\n\t\tc0.014-0.058,0.026-0.117,0.038-0.173c0.008-0.031,0.013-0.06,0.018-0.088c0-0.007,0.005-0.014,0.005-0.021\r\n\t\tc0.015-0.065,0.027-0.126,0.041-0.194c0.013-0.077,0.026-0.153,0.035-0.228c0.013-0.083,0.023-0.165,0.031-0.248\r\n\t\tc0.006-0.036,0.008-0.071,0.013-0.106c0.004-0.04,0.005-0.077,0.009-0.118c0.011-0.108,0.023-0.218,0.028-0.329\r\n\t\tc0.003-0.063,0.008-0.131,0.008-0.195c0.002-0.083,0.004-0.167,0.004-0.252C85.166,44.738,85.164,44.653,85.162,44.572z\r\n\t\t M73.079,39.434c0.008-0.005,0.013-0.008,0.017-0.013c0.206-0.144,0.422-0.27,0.644-0.387c0.136-0.071,0.272-0.143,0.414-0.206\r\n\t\tc0.026-0.012,0.057-0.025,0.084-0.037c0.177-0.076,0.353-0.145,0.536-0.205c0.007-0.004,0.01-0.004,0.016-0.005\r\n\t\tc0.397-0.131,0.811-0.223,1.234-0.275c0.011-0.002,0.024-0.002,0.035-0.004c0.209-0.024,0.426-0.04,0.644-0.042H76.7\r\n\t\tc0.042-0.005,0.085-0.005,0.129-0.005c0.051,0,0.102,0,0.154,0.005c0.658,0.013,1.29,0.125,1.884,0.321\r\n\t\tc0.017,0.003,0.03,0.009,0.042,0.013c0.187,0.063,0.367,0.132,0.545,0.21c0.017,0.006,0.031,0.013,0.049,0.021\r\n\t\tc0.354,0.158,0.691,0.35,1.009,0.563c0.02,0.015,0.041,0.026,0.06,0.042c0.02,0.011,0.035,0.024,0.052,0.038\r\n\t\tc0.149,0.105,0.295,0.215,0.436,0.334c0.002,0.001,0.008,0.005,0.009,0.007c0.002,0.002,0.004,0.002,0.006,0.004\r\n\t\tc0.006,0.005,0.012,0.013,0.018,0.017l-0.295,0.298l-0.109,0.107l-2.315,2.315l-0.39,0.39c-0.337-0.207-0.729-0.331-1.152-0.331\r\n\t\tc-0.023,0-0.044,0.001-0.063,0.001c0.008,0,0.016,0.002,0.021,0.002c-0.408,0.008-0.788,0.129-1.112,0.328l-0.39-0.39l-2.637-2.636\r\n\t\tl-0.083-0.083C72.73,39.689,72.9,39.558,73.079,39.434z M78.228,44.823c0,0.772-0.629,1.399-1.4,1.399\r\n\t\tc-0.772,0-1.396-0.626-1.396-1.399c0-0.773,0.624-1.399,1.396-1.399C77.599,43.423,78.228,44.049,78.228,44.823z M70.386,43.562\r\n\t\tc0.017-0.085,0.039-0.167,0.059-0.25c0.033-0.134,0.061-0.268,0.102-0.398c0.004-0.011,0.007-0.025,0.009-0.034\r\n\t\tc0.059-0.188,0.127-0.374,0.201-0.554c0.008-0.022,0.019-0.043,0.026-0.065c0.076-0.176,0.157-0.349,0.246-0.515\r\n\t\tc0.007-0.015,0.015-0.031,0.022-0.042c0.089-0.169,0.189-0.331,0.292-0.49c0.002-0.002,0.005-0.006,0.007-0.008\r\n\t\tc0.009-0.018,0.02-0.035,0.032-0.049c0.102-0.151,0.21-0.299,0.324-0.44c0.017-0.02,0.033-0.04,0.051-0.062\r\n\t\tc0.026-0.031,0.057-0.063,0.082-0.094l0.404,0.405l2.703,2.702c-0.119,0.195-0.212,0.409-0.265,0.638h-0.551h-3.272h-0.57\r\n\t\tC70.31,44.055,70.339,43.806,70.386,43.562z M72.244,48.679C72.243,48.679,72.243,48.679,72.244,48.679l-0.407,0.402\r\n\t\tc-0.023-0.028-0.054-0.058-0.078-0.089c-0.018-0.021-0.036-0.042-0.054-0.064c-0.115-0.141-0.224-0.289-0.325-0.442\r\n\t\tc-0.012-0.015-0.021-0.03-0.03-0.044c-0.002-0.002-0.003-0.004-0.005-0.004c-0.104-0.164-0.205-0.328-0.294-0.499\r\n\t\tc-0.008-0.01-0.016-0.022-0.022-0.035c-0.061-0.114-0.11-0.233-0.165-0.349c-0.05-0.11-0.1-0.221-0.144-0.335\r\n\t\tc-0.062-0.147-0.118-0.298-0.163-0.45c-0.004-0.013-0.007-0.026-0.011-0.04c-0.041-0.129-0.071-0.263-0.102-0.396\r\n\t\tc-0.02-0.082-0.042-0.165-0.059-0.249c-0.047-0.242-0.076-0.493-0.098-0.744h0.57v-0.001h3.272h0.551\r\n\t\tc0.053,0.23,0.145,0.442,0.265,0.637l-0.389,0.392L72.244,48.679z M80.607,50.189c-0.011,0.01-0.022,0.02-0.036,0.027\r\n\t\tc-0.014,0.01-0.026,0.019-0.042,0.026c-0.327,0.223-0.671,0.419-1.037,0.581c-0.007,0.006-0.016,0.008-0.023,0.014\r\n\t\tc-0.186,0.081-0.373,0.152-0.564,0.219c-0.009,0.001-0.017,0.003-0.024,0.007c-0.196,0.062-0.396,0.118-0.6,0.167h-0.002\r\n\t\tc-0.418,0.094-0.851,0.147-1.295,0.158c-0.053,0.002-0.104,0.002-0.154,0.002c-0.044,0-0.087,0-0.129-0.002h0.002\r\n\t\tc-0.219-0.005-0.438-0.021-0.65-0.046c-0.006,0-0.014,0-0.021-0.003c-0.42-0.05-0.825-0.141-1.218-0.265\r\n\t\tc-0.016-0.006-0.03-0.011-0.047-0.018c-0.175-0.057-0.348-0.124-0.517-0.195c-0.034-0.017-0.068-0.031-0.1-0.045\r\n\t\tc-0.141-0.062-0.277-0.133-0.412-0.206c-0.221-0.117-0.437-0.244-0.643-0.382c-0.001-0.005-0.006-0.009-0.009-0.009\r\n\t\tc-0.167-0.116-0.327-0.239-0.483-0.371c-0.002-0.001-0.002-0.003-0.004-0.003c-0.011-0.01-0.021-0.021-0.034-0.033l0.057-0.053\r\n\t\tl3.053-3.055c0.324,0.2,0.702,0.319,1.108,0.328c-0.005,0-0.012,0-0.018,0c0.02,0.002,0.04,0.004,0.063,0.004\r\n\t\tc0.424,0,0.815-0.125,1.152-0.332l0.39,0.391l2.72,2.719C80.935,49.949,80.774,50.072,80.607,50.189z M83.269,46.104\r\n\t\tc-0.005,0.018-0.007,0.035-0.012,0.049c-0.038,0.191-0.085,0.379-0.142,0.563c-0.004,0.019-0.008,0.034-0.013,0.049\r\n\t\tc-0.052,0.163-0.11,0.319-0.174,0.476c-0.027,0.072-0.058,0.145-0.088,0.216c-0.065,0.145-0.131,0.287-0.202,0.426\r\n\t\tc-0.007,0.01-0.011,0.02-0.019,0.029c-0.005,0.012-0.014,0.024-0.019,0.036c-0.057,0.104-0.119,0.204-0.181,0.304\r\n\t\tc-0.055,0.088-0.109,0.179-0.166,0.266c-0.083,0.119-0.17,0.234-0.259,0.35c-0.032,0.039-0.063,0.083-0.098,0.124\r\n\t\tc-0.026,0.032-0.056,0.061-0.083,0.09l-0.143-0.142l-0.258-0.261L79.1,46.368l-0.39-0.392c0.119-0.195,0.211-0.408,0.266-0.637\r\n\t\th0.552h3.273l0.567,0.001C83.347,45.599,83.317,45.855,83.269,46.104z M82.801,44.307h-3.273h-0.552\r\n\t\tc-0.055-0.229-0.146-0.441-0.266-0.635l0.39-0.393l2.313-2.311l0.286-0.288l0.116-0.117c0.022,0.022,0.045,0.047,0.065,0.07\r\n\t\tc0.048,0.058,0.091,0.115,0.139,0.174c0.078,0.104,0.156,0.209,0.23,0.318c0.063,0.094,0.123,0.191,0.182,0.289\r\n\t\tc0.057,0.091,0.115,0.182,0.164,0.276c0.008,0.016,0.018,0.029,0.024,0.044c0.008,0.011,0.013,0.022,0.02,0.033\r\n\t\tc0.083,0.157,0.159,0.319,0.229,0.483c0.013,0.032,0.028,0.065,0.039,0.094c0.07,0.177,0.137,0.354,0.194,0.535\r\n\t\tc0.005,0.019,0.009,0.036,0.015,0.053c0.055,0.186,0.1,0.369,0.14,0.556c0.004,0.02,0.007,0.037,0.012,0.056\r\n\t\tc0.049,0.25,0.078,0.506,0.1,0.764H82.801z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],374:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.525,0.305h-75.05c-6.908,0-12.508,5.601-12.508,12.508v68.795v3.127v3.128\r\n\tc0,6.907,5.601,12.508,12.508,12.508h75.05c6.907,0,12.508-5.601,12.508-12.508v-3.052v-0.076v-3.127V12.813\r\n\tC100.033,5.905,94.433,0.305,87.525,0.305z\"/>\r\n<path fill=\"#822424\" d=\"M12.475,100.371h75.05c6.907,0,12.508-5.601,12.508-12.508v-3.052l-0.045-0.076H-0.033v3.128\r\n\tC-0.033,94.771,5.567,100.371,12.475,100.371z\"/>\r\n<rect x=\"-0.033\" y=\"81.608\" fill=\"#FFFFFF\" width=\"100.066\" height=\"3.127\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M17.251,49.525c-0.804-0.168-1.41-0.881-1.41-1.734v-0.952c-2.807,0.217-4.512,0.849-4.512,1.31\r\n\t\tC11.329,48.684,13.616,49.443,17.251,49.525z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M55.505,48.539c0.058,0.002,0.114,0.004,0.173,0.006c0.602,0.013,1.213,0.021,1.831,0.023\r\n\t\tc0.067,0,0.131,0.002,0.198,0.002c0.006,0,0.011,0,0.017,0c0.008,0,0.014,0,0.021,0c10.235,0,18.532-1.762,18.532-3.938\r\n\t\tc0-2.054-7.405-3.738-16.852-3.918v3.781c0,1.021-0.833,1.852-1.857,1.852c-1.021,0-1.852-0.831-1.852-1.852l0.006-3.774\r\n\t\tc-8.878,0.205-15.859,1.742-16.452,3.65c-0.05,0.099-0.081,0.196-0.081,0.291c0,0.11,0.042,0.224,0.11,0.341\r\n\t\tC40.107,46.846,46.896,48.318,55.505,48.539z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M24.464,48.149c0-0.492-1.937-1.177-5.079-1.348v0.989c0,0.876-0.641,1.602-1.479,1.743\r\n\t\tC21.909,49.532,24.464,48.713,24.464,48.149z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M11.151,49.645v12.566c0,0.544,2.655,1.329,6.812,1.329s6.804-0.785,6.804-1.328c0-0.004,0-0.006,0-0.006\r\n\t\tV49.667c-1.134,0.844-4.433,1.163-6.797,1.163C15.587,50.83,12.095,50.505,11.151,49.645z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M49.217,13.797c4.046,0,6.625-0.875,6.625-1.479s-2.578-1.481-6.625-1.481\r\n\t\tc-4.042,0-6.623,0.876-6.623,1.481S45.175,13.797,49.217,13.797z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M39.235,47.113v27.447c0,1.651,7.242,4.051,18.577,4.051c11.336,0,18.554-2.398,18.554-4.051\r\n\t\tc0-0.016,0-0.019,0-0.017v-0.002V47.176c-3.096,2.573-12.089,3.548-18.536,3.548C51.332,50.725,41.814,49.733,39.235,47.113z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M80.197,57.575c-0.581,0-1.235-0.033-1.896-0.104v12.896c0.581,0.063,1.213,0.102,1.888,0.102\r\n\t\tc3.781,0,6.186-1.108,6.186-1.871c0-0.009,0-0.011,0-0.01V55.935C85.344,57.124,82.346,57.575,80.197,57.575z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M55.741,13.858c-1.102,0.967-4.298,1.333-6.589,1.333c-2.31,0-5.692-0.372-6.608-1.358v26.083\r\n\t\tc3.192-0.825,7.699-1.465,13.198-1.591V13.858z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M56.758,43.592v0.903c0,0.445,0.364,0.809,0.81,0.809c0.45,0,0.815-0.364,0.815-0.809v-0.902v-7.945\r\n\t\tc0.044-0.017,0.103-0.092,0.115-0.092l20.671-7.967v0.492v24.633v0.06c-0.301,0.017-0.591,0.04-0.867,0.07v3.218\r\n\t\tc0.562,0.06,1.172,0.096,1.83,0.096c3.553,0,5.819-1.011,5.819-1.705c0-0.65-1.997-1.563-5.158-1.681v-0.057V28.08v-1.004\r\n\t\tc-0.008-0.813-0.73-1.253-1.31-1.254c-0.169,0-0.342,0.031-0.51,0.1l-20.591,7.936l-0.477,0.184\r\n\t\tc-0.609,0.284-1.062,0.749-1.148,1.541c-0.003,0.027-0.014,0.049-0.016,0.077v0.563v0.092v4.808c0.006,0,0.01,0,0.016,0V43.592z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M40.319,34.328c-0.003,0.002-0.007,0.004-0.01,0.007v-2.354c0.002-0.013,0.01-0.027,0.01-0.041\r\n\t\tc0-0.007,0-0.008,0-0.008V18.576c-1.098,0.967-4.295,1.333-6.586,1.333c-2.31,0-5.692-0.373-6.608-1.358v13.39\r\n\t\tc0,0.01,0.007,0.021,0.008,0.033v2.338c-0.002-0.002-0.006-0.004-0.008-0.006l0.017,10.957l-9.007-3.218\r\n\t\tc-0.299-0.107-0.613-0.069-0.862,0.107c-0.248,0.175-0.389,0.457-0.389,0.775v4.864c0,0.404,0.326,0.73,0.73,0.73\r\n\t\tc0.404,0,0.729-0.326,0.729-0.73v-4.119l8.801,3.145l0.037,24.091c0,0.621,2.572,1.522,6.603,1.522\r\n\t\tc1.313,0,2.465-0.096,3.429-0.247v-29.38v-0.001c0,0.002,0-0.002,0-0.02c0-0.678,1.098-1.469,3.118-2.193L40.319,34.328z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M33.681,18.57c4.036,0,6.612-0.89,6.612-1.502c0-0.614-2.576-1.504-6.612-1.504\r\n\t\tc-4.037,0-6.612,0.891-6.612,1.504C27.068,17.681,29.644,18.57,33.681,18.57z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],375:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#3A1B13\" d=\"M79.127,90.559h0.007C91.764,81.494,100,66.692,100,49.958C100,22.367,77.633,0,50.041,0\r\n\tS0.083,22.367,0.083,49.958c0,16.734,8.235,31.536,20.866,40.6h0.007H79.127z\"/>\r\n<path fill=\"#A44C29\" d=\"M50.041,99.916c9.332,0,18.056-2.572,25.527-7.027H24.515C31.986,97.344,40.709,99.916,50.041,99.916z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M46.533,21.406c1.262-0.063,2.319-0.832,2.566-2.033c0.135-0.658,0.135-1.392-0.008-2.046\r\n\t\tc-0.212-0.961-0.612-1.881-0.919-2.823c-0.647-1.984-0.966-3.963,0.172-5.905c-0.036-0.019-0.07-0.038-0.106-0.058\r\n\t\tc-0.301,0.356-0.622,0.697-0.897,1.072c-1.009,1.374-1.432,2.933-1.478,4.623c-0.015,0.568-0.114,1.144-0.255,1.695\r\n\t\tc-0.109,0.427-0.459,0.583-0.854,0.492c-0.399-0.092-0.498-0.398-0.473-0.749c0.031-0.412,0.097-0.821,0.146-1.231\r\n\t\tc-0.222,0.334-0.403,0.689-0.537,1.063c-0.483,1.35-0.638,2.716-0.124,4.097C44.184,20.72,45.334,21.465,46.533,21.406z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M49.298,11.442c0.09-0.444,0.187-0.886,0.29-1.382c-0.53,0.637-0.919,1.285-1.069,2.066\r\n\t\tc-0.194,1.009,0.103,1.938,0.431,2.866c0.297,0.835,0.634,1.66,0.872,2.511c0.35,1.242,0.166,2.409-0.711,3.411\r\n\t\tc-0.12,0.138-0.267,0.253-0.4,0.378c0.397,0.043,0.751,0.026,1.098-0.026c1.4-0.21,2.505-1.165,2.774-2.425\r\n\t\tc0.293-1.375-0.125-2.555-1.067-3.562c-0.473-0.505-0.991-0.969-1.461-1.476C49.438,13.142,49.105,12.371,49.298,11.442z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M50.029,8.279c1.044-1.235,1.112-2.586,0.459-4.017c-0.069-0.152-0.159-0.294-0.198-0.366\r\n\t\tc0,0.625,0.048,1.298-0.013,1.964c-0.08,0.876-0.558,1.612-0.974,2.367c-0.328,0.598-0.61,1.223-0.912,1.837\r\n\t\tc0.028,0.006,0.057,0.013,0.086,0.021C48.994,9.482,49.518,8.885,50.029,8.279z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M79.127,90.559H52.291V75.374l-1.635-3.27V37.148h-1.24v-6.315h0.479c0.076,0,0.148-0.014,0.222-0.022\r\n\t\th2.579v-4.112h-3.28v-0.771h1.007v-2.875h-3.721v2.875h1.135v0.771h-3.301v4.112h2.599c0.073,0.009,0.146,0.022,0.222,0.022h0.479\r\n\t\tv6.315h-1.24v34.844h-0.169l-1.466,3.382v7.723h-1.22c-0.168,0-0.331,0.063-0.455,0.176l-8.028,7.286H20.956h-0.007\r\n\t\tc1.146,0.824,2.326,1.604,3.543,2.33h0.022h51.054h0.021c1.217-0.727,2.396-1.506,3.544-2.33H79.127z M44.961,90.559h-7.689\r\n\t\tl6.73-6.107h0.958V90.559z\"/>\r\n</g>\r\n</svg>\r\n";

},{}],376:[function(_dereq_,module,exports){
module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><path fill=\"#822424\" d=\"M87.5 0h-75C5.597 0 0 5.597 0 12.5v75C0 94.403 5.597 100 12.5 100h75c6.903 0 12.5-5.597 12.5-12.5v-75C100 5.597 94.403 0 87.5 0z\"/><g fill=\"#FFF\"><path d=\"M31.938 75.387h48.22L39.27 64.817M62.862 26.316c-3.225-4.658-6.42-6.866-9.354-7.632l11.216 40.35 1.564 2.226H41.752l-.977 1.405 49.21 12.722h6.482l-33.605-49.07z\"/><path d=\"M49.095 36.67l11.39 16.306-9.62-34.61c-6.407.068-11.043 6.317-11.043 6.317L3.532 75.387l.964-.003 1.35-1.15 42.548-36.997.7-.566z\"/><path d=\"M45.243 43.236L8.305 75.356l15.9-.117\"/></g></svg>";

},{}],377:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.597,0H12.784C5.898,0,0.315,5.583,0.315,12.469v68.578v3.117v3.117c0,6.886,5.583,12.469,12.469,12.469\r\n\th74.813c6.886,0,12.469-5.583,12.469-12.469v-3.042v-0.075v-3.117V12.469C100.065,5.583,94.482,0,87.597,0z\"/>\r\n<path fill=\"#822424\" d=\"M100.037,84.192l0.013-3.665c0,0-0.082,0.032-0.187,0.074c-0.058,0.454-0.759,4.385-7.599,4.924\r\n\tc-5.555,0.44-10.236-4.06-15.938-3.801c-3.726,0.171-7.545,1.754-12.748,3.23c-1.865,0.529-7.734,2.431-14.158,2.326\r\n\tc-6.038-0.1-12.643-2.167-14.531-2.733c-4.505-1.348-7.967-2.671-11.351-2.823c-5.698-0.259-10.38,4.241-15.935,3.801\r\n\tc-4.931-0.387-6.668-2.534-7.278-3.877c-0.001,0-0.012-0.001-0.012-0.001v2.517v0.438v2.679c0,6.886,5.583,12.469,12.469,12.469\r\n\th74.813c6.886,0,12.469-5.583,12.469-12.469v-3.042L100.037,84.192z\"/>\r\n<path fill=\"#FFFFFD\" d=\"M7.605,85.525c5.554,0.44,10.236-4.06,15.935-3.801c3.383,0.152,6.845,1.476,11.351,2.823\r\n\tc1.888,0.566,8.493,2.634,14.531,2.733c6.423,0.104,12.292-1.797,14.158-2.326c5.203-1.477,9.022-3.06,12.748-3.23\r\n\tc5.701-0.259,10.383,4.241,15.938,3.801c6.84-0.539,7.541-4.47,7.599-4.924c0.003-0.027,0.006-0.046,0.006-0.046\r\n\tC87,84.211,89.56,75.948,77.061,75.875c-12.22-0.07-13.55,5.5-27.125,5.828c-13.577-0.328-14.908-5.898-27.126-5.828\r\n\tC10.305,75.948,12.866,84.211,0,80.556c0,0,0.039,0.457,0.328,1.093C0.937,82.991,2.675,85.139,7.605,85.525z\"/>\r\n<rect x=\"63.886\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<rect x=\"66.32\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<rect x=\"61.3\" y=\"64.107\" fill=\"none\" width=\"1.168\" height=\"2.298\"/>\r\n<rect x=\"33.917\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<rect x=\"26.261\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<rect x=\"71.29\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<polygon fill=\"none\" points=\"31.975,74.641 37.997,67.437 31.975,67.437 \"/>\r\n<rect x=\"36.352\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<path fill=\"none\" d=\"M47.39,76.327H35.276c3.271,1.306,6.556,2.715,12.114,3.165v-0.73V76.327z\"/>\r\n<path fill=\"none\" d=\"M51.056,79.584c6.439-0.309,9.994-1.843,13.536-3.257H51.056V79.584z\"/>\r\n<rect x=\"38.989\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<path fill=\"none\" d=\"M47.39,75.365l-6.074-7.818l-2.452,0.118l-6.37,7.618c0.225,0.076,0.446,0.154,0.666,0.233h14.23V75.365z\"/>\r\n<rect x=\"58.663\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<polygon fill=\"none\" points=\"51.056,73.572 56.185,67.437 51.056,67.437 \"/>\r\n<rect x=\"54.05\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<rect x=\"51.412\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<polygon fill=\"none\" points=\"47.39,74.043 47.39,67.437 42.256,67.437 \"/>\r\n<polygon fill=\"none\" points=\"66.186,74.827 66.186,67.437 60.444,67.437 \"/>\r\n<rect x=\"56.23\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<polygon fill=\"none\" points=\"57.052,67.665 51.056,74.837 51.056,75.517 65.694,75.517 59.503,67.547 \"/>\r\n<rect x=\"43.755\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<rect x=\"41.321\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<rect x=\"48.978\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<rect x=\"46.393\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<rect x=\"68.958\" y=\"64.107\" fill=\"none\" width=\"1.165\" height=\"2.298\"/>\r\n<rect x=\"31.975\" y=\"59.257\" fill=\"none\" width=\"37.624\" height=\"1.029\"/>\r\n<rect x=\"31.332\" y=\"64.107\" fill=\"none\" width=\"1.166\" height=\"2.298\"/>\r\n<rect x=\"28.695\" y=\"64.107\" fill=\"none\" width=\"1.167\" height=\"2.298\"/>\r\n<path fill=\"#FFFFFF\" d=\"M50.709,32.083c2.741,0,5.476,0.664,7.914,1.919l4.188,2.155l-2.226-12.862\r\n\tc-0.118-0.688-0.716-1.19-1.414-1.19H54.63v-2.157h2.221c1.12,0,2.029-0.909,2.029-2.029c0-1.122-0.909-2.029-2.029-2.029H54.63\r\n\tv-0.215c0-0.793-0.642-1.435-1.435-1.435h-5.248c-0.794,0-1.435,0.642-1.435,1.435v0.215h-2.22c-1.121,0-2.029,0.907-2.029,2.029\r\n\tc0,1.12,0.908,2.029,2.029,2.029h2.22v2.157h-4.541c-0.698,0-1.295,0.501-1.414,1.19l-2.245,12.979l4.579-2.322\r\n\tC45.301,32.729,48.004,32.083,50.709,32.083z M48.948,23.591c0.73-0.985,1.47-1.782,1.477-1.789c0.038-0.041,0.09-0.063,0.146-0.063\r\n\tc0.055,0,0.108,0.022,0.146,0.063c0.007,0.007,0.747,0.803,1.476,1.789c0.998,1.344,1.503,2.388,1.503,3.101\r\n\tc0,1.724-1.402,3.125-3.125,3.125c-1.723,0-3.125-1.401-3.125-3.125C47.446,25.979,47.951,24.935,48.948,23.591z\"/>\r\n<path fill=\"#FFFFFF\" d=\"M73.61,45.997l-16.729-8.614c-1.402-0.721-2.899-1.173-4.424-1.372l-1.333,23.766\r\n\tc-0.02,0.351-0.318,0.619-0.669,0.599c-0.327-0.018-0.582-0.278-0.599-0.599l-1.331-23.689c-1.344,0.221-2.667,0.624-3.915,1.257\r\n\tl-17.07,8.656c-0.663,0.336-0.959,1.123-0.684,1.813L37.229,73.74c0.334,0.837,1.146,1.386,2.048,1.386h22.589\r\n\tc0.901,0,1.714-0.549,2.047-1.386l10.373-25.934C74.561,47.119,74.268,46.337,73.61,45.997z\"/>\r\n</svg>\r\n";

},{}],378:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.526,0H12.724C5.839,0,0.257,5.582,0.257,12.467v68.569v3.117v3.117c0,6.885,5.582,12.467,12.467,12.467\r\n\th74.803c6.886,0,12.468-5.582,12.468-12.467v-3.042v-0.075v-3.117V12.467C99.994,5.582,94.412,0,87.526,0z\"/>\r\n<path fill=\"#822424\" d=\"M12.724,99.737h74.803c6.886,0,12.468-5.582,12.468-12.467v-3.042l-0.045-0.075H0.257v3.117\r\n\tC0.257,94.155,5.839,99.737,12.724,99.737z\"/>\r\n<g>\r\n\t<rect x=\"0.257\" y=\"81.036\" fill=\"#FFFFFF\" width=\"99.737\" height=\"3.117\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M58.974,31.935h-3.908v-4.823h-3.893v-2.942c1.913-0.038,3.828-0.158,5.747-0.362\r\n\t\tc2.12-1.206,2.12-2.049,0-3.254c-1.919-0.205-3.834-0.325-5.747-0.362v-0.904h-2.557v0.904c-1.913,0.038-3.826,0.158-5.748,0.362\r\n\t\tc-2.12,1.205-2.12,2.048,0,3.254c1.921,0.204,3.835,0.325,5.748,0.362v2.942h-3.89v4.823h-3.91v2.799h18.158V31.935z\r\n\t\t M52.623,31.935h-5.457v-2.381h5.457V31.935z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M32.776,60.127h34.239v1.938h3.029V46.127h-3.029v1.898h-8.088c-1.199-0.024-2.166-1.006-2.166-2.209\r\n\t\tv-3.151c0-1.22,0.992-2.213,2.213-2.213v-3.155H40.815v3.155c1.222,0,2.215,0.993,2.215,2.213v3.151\r\n\t\tc0,1.203-0.97,2.186-2.169,2.209h-8.085v-1.899h-3.03v15.938h3.03V60.127z\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"24.149,62.064 27.179,62.064 27.179,46.127 24.149,46.127 24.149,48.025 0,48.025 0,60.127 \r\n\t\t24.149,60.127 \t\"/>\r\n\t<polygon fill=\"#FFFFFF\" points=\"75.64,48.025 75.64,46.127 72.61,46.127 72.61,62.064 75.64,62.064 75.64,60.127 100.077,60.127 \r\n\t\t100.077,48.025 \t\"/>\r\n</g>\r\n</svg>\r\n";

},{}],379:[function(_dereq_,module,exports){
module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"100px\" height=\"100px\" viewBox=\"0 0 100 100\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\">\r\n<path fill=\"#49494B\" d=\"M87.5,0h-75C5.597,0,0,5.597,0,12.5v68.75v3.125V87.5C0,94.403,5.597,100,12.5,100h75\r\n\tc6.903,0,12.5-5.597,12.5-12.5v-3.05v-0.075V81.25V12.5C100,5.597,94.403,0,87.5,0z\"/>\r\n<rect y=\"81.25\" fill=\"#FFFFFF\" width=\"100\" height=\"3.125\"/>\r\n<path fill=\"#822424\" d=\"M12.5,100h75c6.903,0,12.5-5.597,12.5-12.5v-3.05l-0.045-0.075H0V87.5C0,94.403,5.597,100,12.5,100z\"/>\r\n<g>\r\n\t<path fill=\"#FFFFFF\" d=\"M48.845,44.985c0.078-0.01,0.156-0.019,0.232-0.028c0.182-0.021,0.364-0.044,0.546-0.066\r\n\t\tc0.183-0.015,0.365-0.03,0.547-0.047c0.729-0.063,1.454-0.124,2.17-0.187c1.436-0.082,2.847-0.179,4.238-0.208\r\n\t\tc2.779-0.101,5.461-0.056,8.032-0.08c0.644-0.011,1.28-0.017,1.909-0.034c0.313-0.011,0.626-0.021,0.936-0.033\r\n\t\tc0.156-0.005,0.312-0.01,0.466-0.016c0.154-0.009,0.31-0.018,0.462-0.026c0.614-0.037,1.223-0.063,1.819-0.126\r\n\t\tc0.299-0.027,0.598-0.053,0.893-0.079c0.297-0.028,0.592-0.061,0.885-0.093c1.168-0.126,2.302-0.289,3.382-0.538\r\n\t\tc0.395-0.091,0.767-0.211,1.144-0.332c0.01-0.219,0.03-0.435,0.064-0.646h-3.167c-1.16,0.495-3.113,0.753-6.325,0.887\r\n\t\tc-0.465,0.019-0.953,0.036-1.457,0.051c-0.308,0.109-0.629,0.186-0.975,0.186h-5.728c-0.022,0-0.045-0.004-0.066-0.005\r\n\t\tc-2.773,0.091-5.99,0.241-9.763,0.532C49.036,44.404,48.952,44.699,48.845,44.985z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M75.449,43.771c-1.101,0.268-2.248,0.443-3.422,0.583c-0.295,0.034-0.586,0.071-0.885,0.102\r\n\t\tc-0.299,0.03-0.598,0.06-0.899,0.09c-0.603,0.068-1.215,0.102-1.833,0.146c-0.154,0.011-0.31,0.021-0.466,0.033\r\n\t\tc-0.154,0.006-0.31,0.012-0.466,0.019c-0.313,0.015-0.627,0.028-0.944,0.042c-0.633,0.023-1.27,0.035-1.914,0.053\r\n\t\tc-2.58,0.049-5.258,0.029-8.022,0.152c-1.381,0.04-2.785,0.147-4.211,0.24c-0.71,0.067-1.424,0.133-2.145,0.201\r\n\t\tc-0.18,0.017-0.361,0.034-0.542,0.052c-0.181,0.023-0.363,0.046-0.545,0.069c-0.204,0.026-0.408,0.052-0.612,0.078\r\n\t\tc-0.363,0.663-0.86,1.239-1.47,1.679c0.5-0.096,0.994-0.193,1.528-0.28c4.361-0.702,9.83-1.084,16.722-1.17\r\n\t\tc4.616-0.057,8.472-0.322,11.527-0.781c-0.197-0.502-0.31-1.045-0.336-1.609C76.164,43.58,75.812,43.684,75.449,43.771z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M35.378,55.804c-0.605-1.743-0.303-3.304,0.897-4.64c1.308-1.455,3.67-2.589,7.108-3.445\r\n\t\tc-0.941-0.124-1.787-0.469-2.48-0.974c-0.568,0.122-1.137,0.246-1.702,0.389c-1.478,0.375-2.95,0.819-4.363,1.391\r\n\t\tc-1.412,0.571-2.772,1.265-3.955,2.144c-1.183,0.876-2.172,1.947-2.826,3.165c-0.329,0.609-0.576,1.251-0.745,1.91\r\n\t\tc-0.17,0.663-0.26,1.328-0.291,2.022c-0.056,1.369,0.16,2.756,0.599,4.106c0.439,1.354,1.094,2.669,1.875,3.947\r\n\t\tc0.783,1.279,1.688,2.522,2.641,3.756c0.477,0.616,0.967,1.23,1.459,1.849c0.495,0.616,0.984,1.24,1.485,1.856\r\n\t\tc1.42,1.771,2.877,3.499,4.345,5.197h-0.993c-1.361-1.577-2.711-3.183-4.029-4.827c-0.507-0.619-0.992-1.24-1.486-1.856\r\n\t\tc-0.493-0.619-0.984-1.235-1.464-1.857c-0.96-1.244-1.879-2.508-2.676-3.817c-0.797-1.31-1.471-2.67-1.924-4.078\r\n\t\tc-0.454-1.405-0.675-2.86-0.611-4.297c0.034-0.707,0.133-1.438,0.316-2.134c0.182-0.701,0.45-1.386,0.805-2.034\r\n\t\tc0.705-1.303,1.772-2.444,3.026-3.363c1.254-0.923,2.676-1.64,4.136-2.22c1.461-0.582,2.969-1.029,4.476-1.402\r\n\t\tc0.453-0.112,0.906-0.205,1.359-0.302c-0.362-0.356-0.664-0.756-0.872-1.199c-8.493,1.052-14.58,3.013-18.598,5.561\r\n\t\tc-3.533,2.244-5.5,5.042-6.379,9.083c-0.62,2.849,0.285,6.375,1.837,10.49c1.125,2.98,3.096,5.889,4.588,8.283h39.208\r\n\t\tc-2.952-2.098-6.727-5.063-10.98-8.283C40.699,63.819,36.449,58.889,35.378,55.804z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M81.515,39.255c-2.199,0-3.983,1.783-3.983,3.982s1.784,3.982,3.983,3.982s3.983-1.783,3.983-3.982\r\n\t\tS83.714,39.255,81.515,39.255z M81.515,45.289c-1.134,0-2.053-0.918-2.053-2.052s0.919-2.053,2.053-2.053\r\n\t\tc1.133,0,2.053,0.919,2.053,2.053S82.647,45.289,81.515,45.289z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M40.169,43.237c0,2.199,1.783,3.982,3.982,3.982s3.983-1.783,3.983-3.982s-1.784-3.982-3.983-3.982\r\n\t\tS40.169,41.038,40.169,43.237z M46.204,43.237c0,1.133-0.919,2.052-2.053,2.052c-1.132,0-2.053-0.918-2.053-2.052\r\n\t\ts0.92-2.053,2.053-2.053C45.285,41.185,46.204,42.104,46.204,43.237z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M64.646,42.528c1.072,0,1.943-0.869,1.943-1.943v-2.072c0-1.073-0.871-1.943-1.943-1.943h-5.728\r\n\t\tc-1.072,0-1.94,0.87-1.94,1.943v2.072c0,1.074,0.868,1.943,1.94,1.943H64.646z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M42.875,35.179h23.734c3.602,0,6.521-2.919,6.521-6.52c0-3.602-2.919-6.521-6.521-6.521h-8.634v-0.707\r\n\t\th1.088c0.574,0,1.038-0.466,1.038-1.04s-0.464-1.039-1.038-1.039h-8.642c-0.574,0-1.039,0.465-1.039,1.039s0.465,1.04,1.039,1.04\r\n\t\th1.087v0.707h-8.633c-3.602,0-6.521,2.919-6.521,6.521C36.354,32.259,39.273,35.179,42.875,35.179z M53.764,26.428\r\n\t\tc0.674-0.908,1.355-1.643,1.363-1.65c0.034-0.038,0.083-0.059,0.134-0.059c0.052,0,0.101,0.021,0.135,0.059\r\n\t\tc0.006,0.007,0.689,0.742,1.363,1.65c0.919,1.24,1.386,2.203,1.386,2.861c0,1.59-1.294,2.884-2.884,2.884\r\n\t\tc-1.591,0-2.883-1.294-2.883-2.884C52.378,28.631,52.844,27.668,53.764,26.428z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M55.086,31.295c0.157,0,0.312-0.019,0.462-0.054c0.049-0.012,0.082-0.054,0.082-0.104\r\n\t\tc-0.003-0.049-0.037-0.091-0.084-0.101c-1.166-0.234-2.012-1.266-2.012-2.456c0-0.038,0.002-0.078,0.008-0.122\r\n\t\tc0.006-0.05-0.026-0.098-0.073-0.112c-0.049-0.014-0.102,0.008-0.124,0.054c-0.225,0.452-0.271,0.728-0.271,0.882\r\n\t\tC53.073,30.392,53.976,31.295,55.086,31.295z\"/>\r\n\t<path fill=\"#FFFFFF\" d=\"M88.416,30.735c-0.279-2.577-2.36-10.095-2.36-10.095c-0.321-1.07-0.869-1.942-1.941-1.942H76.57\r\n\t\tc-1.074,0-1.942,0.869-1.942,1.942v17.055h-6.075c-0.702,0-1.271,0.57-1.271,1.271v1.168c0,0.701,0.569,1.271,1.271,1.271h3.3\r\n\t\th4.718h0.031h0.197h0.138c0.79-1.76,2.554-2.988,4.608-2.988c2.053,0,3.816,1.228,4.608,2.988h0.321\r\n\t\tc1.072,0,1.941-0.87,1.941-1.942C88.416,39.462,88.518,31.667,88.416,30.735z M78.959,32.5h-1.979\r\n\t\tc-0.308,0-0.556-0.249-0.556-0.555c0-0.307,0.248-0.556,0.556-0.556h1.979c0.306,0,0.554,0.249,0.554,0.556\r\n\t\tC79.513,32.251,79.265,32.5,78.959,32.5z M85.866,28.822c0,0.674-0.547,1.222-1.223,1.222h-6.228c-0.676,0-1.223-0.547-1.223-1.222\r\n\t\tv-7.08c0-0.674,0.547-1.222,1.223-1.222h4.744c0.676,0,1.02,0.548,1.221,1.222c0,0,1.311,4.728,1.485,6.349\r\n\t\tC85.93,28.676,85.866,28.822,85.866,28.822z\"/>\r\n</g>\r\n<path fill=\"#FFFFFF\" d=\"M54.911,37.695H36.527c-0.701,0-1.271,0.57-1.271,1.271v1.168c0,0.701,0.57,1.271,1.271,1.271h3.02\r\n\tc0.79-1.76,2.554-2.988,4.608-2.988s3.818,1.228,4.608,2.988h6.148c0.702,0,1.27-0.57,1.27-1.271v-1.168\r\n\tC56.181,38.265,55.613,37.695,54.911,37.695z\"/>\r\n</svg>\r\n";

},{}],380:[function(_dereq_,module,exports){
'use strict';

/**
 * The node drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} nodesDict
 * @param {Canvas} canvas
 */

function Nodes(nodesDict, canvas) {

  this._nodes = nodesDict;
  this._canvas = canvas;

  this._init();
}

Nodes.$inject = ['d3polytree.nodes', 'canvas'];

module.exports = Nodes;

Nodes.prototype._init = function () {};

},{}],381:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: ['nodes'],
  nodes: ['type', _dereq_(380)]
};

},{"380":380}],382:[function(_dereq_,module,exports){
'use strict';

var d3js = _dereq_(388),
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

GridLines.$inject = ['d3polytree.options', 'canvas', 'eventBus'];

module.exports = GridLines;

GridLines.prototype._init = function () {
  var that = this;
  this._eventBus.on('canvas.resized', function () {
    that._draw();
  });
  this._draw();
};

GridLines.prototype._draw = function () {
  var svg = this._canvas.getDrawingLayer(),
      canvasSize = this._canvas.getSize(),
      that = this,
      svgTransform = this._canvas.getTransform(),
      scaleX = svgTransform.a,
      scaleY = svgTransform.d,
      translateX = svgTransform.e,
      translateY = svgTransform.f,
      height = canvasSize.height / scaleY,
      width = canvasSize.width / scaleX;

  // create the grid lines
  var horizontalLines = Math.ceil(height / this._options.gridSize);
  // remove previous lines
  if (_hLines) {
    _hLines.remove();
  }
  _hLines = svg // draw horizontal lines
  .selectAll('.hline').data(d3js.range(horizontalLines)).enter().append('line').attr('y1', function (d) {
    return d * that._options.gridSize + translateY * -1.0 / scaleY;
  }).attr('y2', function (d) {
    return d * that._options.gridSize + translateY * -1.0 / scaleY;
  }).attr('x1', translateX * -1.0 / scaleX).attr('x2', width + translateX * -1.0 / scaleX).style('stroke', this._options.gridLinesColor).style('stroke-width', this._options.gridLinesWidth + 'px').attr('class', 'gridline');

  var verticalLines = Math.ceil(width / this._options.gridSize);
  // remove previous lines
  if (_vLines) {
    _vLines.remove();
  }
  _vLines = svg // draw vertical lines
  .selectAll('.vline').data(d3js.range(verticalLines)).enter().append('line').attr('x1', function (d) {
    return d * that._options.gridSize + translateX * -1.0 / scaleX;
  }).attr('x2', function (d) {
    return d * that._options.gridSize + translateX * -1.0 / scaleX;
  }).attr('y1', translateY * -1.0 / scaleY).attr('y2', height + translateY * -1.0 / scaleY).style('stroke', this._options.gridLinesColor).style('stroke-width', this._options.gridLinesWidth + 'px');
};

},{"388":388}],383:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: ['gridLines'],
  gridLines: ['type', _dereq_(382)]
};

},{"382":382}],384:[function(_dereq_,module,exports){
'use strict';

var d3js = _dereq_(388),
    _tooltipHelper = _dereq_(401),
    _tooltip = null,
    isEmpty = _dereq_(655).isEmpty;

/**
 * The tooltip functionality.
 *
 * @class
 * @constructor
 *
 * @param {Canvas} Canvas
 * @param {EventBus} EventBus
 */
function Tooltip(canvas, eventBus) {
  d3js.functor = function functor(v) {
    // legacy function: https://bl.ocks.org/micahstubbs/f94ee71c353f0152da3bc2ee4351608d#d3-tip.js
    return typeof v === 'function' ? v : function () {
      return v;
    };
  };
  _tooltipHelper(d3js);
  _tooltip = d3js.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
    return isEmpty(d.label) ? '' : d.label;
  });
  canvas.getDrawingLayer().call(_tooltip);
  eventBus.on('groups.drawn', function (groups) {
    // show tooltip on groups
    groups.on('mouseover', function () {
      var transform = canvas.getTransform(),
          zoom = transform.a;
      if (zoom < 0.8) {
        _tooltip.show.apply(this, arguments);
      }
    }).on('mouseout', _tooltip.hide);
  });
}

Tooltip.$inject = ['canvas', 'eventBus'];

module.exports = Tooltip;

},{"388":388,"401":401,"655":655}],385:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: ['tooltip'],
  tooltip: ['type', _dereq_(384)]
};

},{"384":384}],386:[function(_dereq_,module,exports){
'use strict';

var d3js = _dereq_(388),
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

Zoom.$inject = ['d3polytree.options', 'canvas', 'gridLines'];

module.exports = Zoom;

Zoom.prototype.setZoom = function (translateX, translateY, scale) {
  if (_isZoomable === true) {
    // apply zoom
    _canvas.getDrawingLayer().attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
    if (_gridLines) {
      // re-draw grid lines
      _gridLines._draw();
    }
  }
};

Zoom.prototype.setZoomable = function (isZoomable) {
  _isZoomable = isZoomable;
};

var init = function init() {
  var drawingLayer = _canvas.getDrawingLayer();
  //var that = this;
  _zoom = d3js.zoom().scaleExtent([0.01, 10])
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
  drawingLayer = drawingLayer.call(_zoom).append('g');
  _canvas.setDrawingLayer(drawingLayer);
};

},{"388":388}],387:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: ['zoom'],
  zoom: ['type', _dereq_(386)]
};

},{"386":386}],388:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _d3Selection = _dereq_(399);

Object.defineProperty(exports, 'event', {
    enumerable: true,
    get: function get() {
        return _d3Selection.event;
    }
});
Object.defineProperty(exports, 'select', {
    enumerable: true,
    get: function get() {
        return _d3Selection.select;
    }
});
Object.defineProperty(exports, 'selection', {
    enumerable: true,
    get: function get() {
        return _d3Selection.selection;
    }
});
Object.defineProperty(exports, 'selectAll', {
    enumerable: true,
    get: function get() {
        return _d3Selection.selectAll;
    }
});
Object.defineProperty(exports, 'event', {
    enumerable: true,
    get: function get() {
        return _d3Selection.event;
    }
});

var _d3Array = _dereq_(392);

Object.defineProperty(exports, 'range', {
    enumerable: true,
    get: function get() {
        return _d3Array.range;
    }
});

var _d3Zoom = _dereq_(403);

Object.keys(_d3Zoom).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _d3Zoom[key];
        }
    });
});

var _d3Collection = _dereq_(393);

Object.defineProperty(exports, 'map', {
    enumerable: true,
    get: function get() {
        return _d3Collection.map;
    }
});

},{"392":392,"393":393,"399":399,"403":403}],389:[function(_dereq_,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,undefined)

},{}],390:[function(_dereq_,module,exports){
addEventListener.removeEventListener = removeEventListener
addEventListener.addEventListener = addEventListener

module.exports = addEventListener

var Events = null

function addEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.add(el, eventName, listener, useCapture)
}

function removeEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.rm(el, eventName, listener, useCapture)
}

function stdAttach(el, eventName, listener, useCapture) {
  el.addEventListener(eventName, listener, useCapture)
}

function stdDetach(el, eventName, listener, useCapture) {
  el.removeEventListener(eventName, listener, useCapture)
}

function oldIEAttach(el, eventName, listener, useCapture) {
  if(useCapture) {
    throw new Error('cannot useCapture in oldIE')
  }

  el.attachEvent('on' + eventName, listener)
}

function oldIEDetach(el, eventName, listener, useCapture) {
  el.detachEvent('on' + eventName, listener)
}

},{}],391:[function(_dereq_,module,exports){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

},{}],392:[function(_dereq_,module,exports){
// https://d3js.org/d3-array/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;

  function descending(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  function number(x) {
    return x === null ? NaN : +x;
  }

  function variance(array, f) {
    var n = array.length,
        m = 0,
        a,
        d,
        s = 0,
        i = -1,
        j = 0;

    if (f == null) {
      while (++i < n) {
        if (!isNaN(a = number(array[i]))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }

    else {
      while (++i < n) {
        if (!isNaN(a = number(f(array[i], i, array)))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }

    if (j > 1) return s / (j - 1);
  }

  function deviation(array, f) {
    var v = variance(array, f);
    return v ? Math.sqrt(v) : v;
  }

  function extent(array, f) {
    var i = -1,
        n = array.length,
        a,
        b,
        c;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }

    else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
      while (++i < n) if ((b = f(array[i], i, array)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }

    return [a, c];
  }

  var array = Array.prototype;

  var slice = array.slice;
  var map = array.map;

  function constant(x) {
    return function() {
      return x;
    };
  }

  function identity(x) {
    return x;
  }

  function range(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

    var i = -1,
        n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
        range = new Array(n);

    while (++i < n) {
      range[i] = start + i * step;
    }

    return range;
  }

  var e10 = Math.sqrt(50);
  var e5 = Math.sqrt(10);
  var e2 = Math.sqrt(2);
  function ticks(start, stop, count) {
    var step = tickStep(start, stop, count);
    return range(
      Math.ceil(start / step) * step,
      Math.floor(stop / step) * step + step / 2, // inclusive
      step
    );
  }

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;
    else if (error >= e5) step1 *= 5;
    else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }

  function sturges(values) {
    return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
  }

  function histogram() {
    var value = identity,
        domain = extent,
        threshold = sturges;

    function histogram(data) {
      var i,
          n = data.length,
          x,
          values = new Array(n);

      for (i = 0; i < n; ++i) {
        values[i] = value(data[i], i, data);
      }

      var xz = domain(values),
          x0 = xz[0],
          x1 = xz[1],
          tz = threshold(values, x0, x1);

      // Convert number of thresholds into uniform thresholds.
      if (!Array.isArray(tz)) tz = ticks(x0, x1, tz);

      // Remove any thresholds outside the domain.
      var m = tz.length;
      while (tz[0] <= x0) tz.shift(), --m;
      while (tz[m - 1] >= x1) tz.pop(), --m;

      var bins = new Array(m + 1),
          bin;

      // Initialize bins.
      for (i = 0; i <= m; ++i) {
        bin = bins[i] = [];
        bin.x0 = i > 0 ? tz[i - 1] : x0;
        bin.x1 = i < m ? tz[i] : x1;
      }

      // Assign data to bins by value, ignoring any outside the domain.
      for (i = 0; i < n; ++i) {
        x = values[i];
        if (x0 <= x && x <= x1) {
          bins[bisectRight(tz, x, 0, m)].push(data[i]);
        }
      }

      return bins;
    }

    histogram.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant(_), histogram) : value;
    };

    histogram.domain = function(_) {
      return arguments.length ? (domain = typeof _ === "function" ? _ : constant([_[0], _[1]]), histogram) : domain;
    };

    histogram.thresholds = function(_) {
      return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), histogram) : threshold;
    };

    return histogram;
  }

  function quantile(array, p, f) {
    if (f == null) f = number;
    if (!(n = array.length)) return;
    if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
    if (p >= 1) return +f(array[n - 1], n - 1, array);
    var n,
        h = (n - 1) * p,
        i = Math.floor(h),
        a = +f(array[i], i, array),
        b = +f(array[i + 1], i + 1, array);
    return a + (b - a) * (h - i);
  }

  function freedmanDiaconis(values, min, max) {
    values = map.call(values, number).sort(ascending);
    return Math.ceil((max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(values.length, -1 / 3)));
  }

  function scott(values, min, max) {
    return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(values.length, -1 / 3)));
  }

  function max(array, f) {
    var i = -1,
        n = array.length,
        a,
        b;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    }

    else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = f(array[i], i, array)) != null && b > a) a = b;
    }

    return a;
  }

  function mean(array, f) {
    var s = 0,
        n = array.length,
        a,
        i = -1,
        j = n;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number(array[i]))) s += a; else --j;
    }

    else {
      while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) s += a; else --j;
    }

    if (j) return s / j;
  }

  function median(array, f) {
    var numbers = [],
        n = array.length,
        a,
        i = -1;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
    }

    else {
      while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
    }

    return quantile(numbers.sort(ascending), 0.5);
  }

  function merge(arrays) {
    var n = arrays.length,
        m,
        i = -1,
        j = 0,
        merged,
        array;

    while (++i < n) j += arrays[i].length;
    merged = new Array(j);

    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }

    return merged;
  }

  function min(array, f) {
    var i = -1,
        n = array.length,
        a,
        b;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    }

    else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = f(array[i], i, array)) != null && a > b) a = b;
    }

    return a;
  }

  function pairs(array) {
    var i = 0, n = array.length - 1, p = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [p, p = array[++i]];
    return pairs;
  }

  function permute(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  }

  function scan(array, compare) {
    if (!(n = array.length)) return;
    var i = 0,
        n,
        j = 0,
        xi,
        xj = array[j];

    if (!compare) compare = ascending;

    while (++i < n) if (compare(xi = array[i], xj) < 0 || compare(xj, xj) !== 0) xj = xi, j = i;

    if (compare(xj, xj) === 0) return j;
  }

  function shuffle(array, i0, i1) {
    var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
        t,
        i;

    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0];
      array[m + i0] = array[i + i0];
      array[i + i0] = t;
    }

    return array;
  }

  function sum(array, f) {
    var s = 0,
        n = array.length,
        a,
        i = -1;

    if (f == null) {
      while (++i < n) if (a = +array[i]) s += a; // Note: zero and null are equivalent.
    }

    else {
      while (++i < n) if (a = +f(array[i], i, array)) s += a;
    }

    return s;
  }

  function transpose(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  }

  function length(d) {
    return d.length;
  }

  function zip() {
    return transpose(arguments);
  }

  exports.bisect = bisectRight;
  exports.bisectRight = bisectRight;
  exports.bisectLeft = bisectLeft;
  exports.ascending = ascending;
  exports.bisector = bisector;
  exports.descending = descending;
  exports.deviation = deviation;
  exports.extent = extent;
  exports.histogram = histogram;
  exports.thresholdFreedmanDiaconis = freedmanDiaconis;
  exports.thresholdScott = scott;
  exports.thresholdSturges = sturges;
  exports.max = max;
  exports.mean = mean;
  exports.median = median;
  exports.merge = merge;
  exports.min = min;
  exports.pairs = pairs;
  exports.permute = permute;
  exports.quantile = quantile;
  exports.range = range;
  exports.scan = scan;
  exports.shuffle = shuffle;
  exports.sum = sum;
  exports.ticks = ticks;
  exports.tickStep = tickStep;
  exports.transpose = transpose;
  exports.variance = variance;
  exports.zip = zip;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],393:[function(_dereq_,module,exports){
// https://d3js.org/d3-collection/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  var prefix = "$";

  function Map() {}

  Map.prototype = map.prototype = {
    constructor: Map,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map(object, f) {
    var map = new Map;

    // Copy constructor.
    if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function nest() {
    var keys = [],
        sortKeys = [],
        sortValues,
        rollup,
        nest;

    function apply(array, depth, createResult, setResult) {
      if (depth >= keys.length) return rollup != null
          ? rollup(array) : (sortValues != null
          ? array.sort(sortValues)
          : array);

      var i = -1,
          n = array.length,
          key = keys[depth++],
          keyValue,
          value,
          valuesByKey = map(),
          values,
          result = createResult();

      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
          values.push(value);
        } else {
          valuesByKey.set(keyValue, [value]);
        }
      }

      valuesByKey.each(function(values, key) {
        setResult(result, key, apply(values, depth, createResult, setResult));
      });

      return result;
    }

    function entries(map, depth) {
      if (++depth > keys.length) return map;
      var array, sortKey = sortKeys[depth - 1];
      if (rollup != null && depth >= keys.length) array = map.entries();
      else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
      return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
    }

    return nest = {
      object: function(array) { return apply(array, 0, createObject, setObject); },
      map: function(array) { return apply(array, 0, createMap, setMap); },
      entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
      key: function(d) { keys.push(d); return nest; },
      sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
      sortValues: function(order) { sortValues = order; return nest; },
      rollup: function(f) { rollup = f; return nest; }
    };
  }

  function createObject() {
    return {};
  }

  function setObject(object, key, value) {
    object[key] = value;
  }

  function createMap() {
    return map();
  }

  function setMap(map, key, value) {
    map.set(key, value);
  }

  function Set() {}

  var proto = map.prototype;

  Set.prototype = set.prototype = {
    constructor: Set,
    has: proto.has,
    add: function(value) {
      value += "";
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each
  };

  function set(object, f) {
    var set = new Set;

    // Copy constructor.
    if (object instanceof Set) object.each(function(value) { set.add(value); });

    // Otherwise, assume it’s an array.
    else if (object) {
      var i = -1, n = object.length;
      if (f == null) while (++i < n) set.add(object[i]);
      else while (++i < n) set.add(f(object[i], i, object));
    }

    return set;
  }

  function keys(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  }

  function values(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  }

  function entries(map) {
    var entries = [];
    for (var key in map) entries.push({key: key, value: map[key]});
    return entries;
  }

  exports.nest = nest;
  exports.set = set;
  exports.map = map;
  exports.keys = keys;
  exports.values = values;
  exports.entries = entries;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],394:[function(_dereq_,module,exports){
// https://d3js.org/d3-color/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reHex3 = /^#([0-9a-f]{3})$/;
  var reHex6 = /^#([0-9a-f]{6})$/;
  var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
  var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
  var reRgbaInteger = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var reRgbaPercent = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
  var reHslaPercent = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    displayable: function() {
      return this.rgb().displayable();
    },
    toString: function() {
      return this.rgb() + "";
    }
  });

  function color(format) {
    var m;
    format = (format + "").trim().toLowerCase();
    return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
        : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format])
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (0 <= this.r && this.r <= 255)
          && (0 <= this.g && this.g <= 255)
          && (0 <= this.b && this.b <= 255)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    toString: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  var Kn = 18;
  var Xn = 0.950470;
  var Yn = 1;
  var Zn = 1.088830;
  var t0 = 4 / 29;
  var t1 = 6 / 29;
  var t2 = 3 * t1 * t1;
  var t3 = t1 * t1 * t1;
  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) {
      var h = o.h * deg2rad;
      return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
    }
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var b = rgb2xyz(o.r),
        a = rgb2xyz(o.g),
        l = rgb2xyz(o.b),
        x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
        y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
        z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Lab, lab, extend(Color, {
    brighter: function(k) {
      return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker: function(k) {
      return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb: function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      y = Yn * lab2xyz(y);
      x = Xn * lab2xyz(x);
      z = Zn * lab2xyz(z);
      return new Rgb(
        xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }

  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }

  function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2xyz(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    var h = Math.atan2(o.b, o.a) * rad2deg;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hcl, hcl, extend(Color, {
    brighter: function(k) {
      return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
    },
    darker: function(k) {
      return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
    },
    rgb: function() {
      return labConvert(this).rgb();
    }
  }));

  var A = -0.14861;
  var B = +1.78277;
  var C = -0.29227;
  var D = -0.90649;
  var E = +1.97294;
  var ED = E * D;
  var EB = E * B;
  var BC_DA = B * C - D * A;
  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Cubehelix, cubehelix, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
          l = +this.l,
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity
      );
    }
  }));

  exports.color = color;
  exports.rgb = rgb;
  exports.hsl = hsl;
  exports.lab = lab;
  exports.hcl = hcl;
  exports.cubehelix = cubehelix;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],395:[function(_dereq_,module,exports){
// https://d3js.org/d3-dispatch/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  exports.dispatch = dispatch;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],396:[function(_dereq_,module,exports){
// https://d3js.org/d3-drag/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, _dereq_(395), _dereq_(399)) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-dispatch', 'd3-selection'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3));
}(this, function (exports,d3Dispatch,d3Selection) { 'use strict';

  function nopropagation() {
    d3Selection.event.stopImmediatePropagation();
  }

  function noevent() {
    d3Selection.event.preventDefault();
    d3Selection.event.stopImmediatePropagation();
  }

  function nodrag(view) {
    var root = view.document.documentElement,
        selection = d3Selection.select(view).on("dragstart.drag", noevent, true);
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", noevent, true);
    } else {
      root.__noselect = root.style.MozUserSelect;
      root.style.MozUserSelect = "none";
    }
  }

  function yesdrag(view, noclick) {
    var root = view.document.documentElement,
        selection = d3Selection.select(view).on("dragstart.drag", null);
    if (noclick) {
      selection.on("click.drag", noevent, true);
      setTimeout(function() { selection.on("click.drag", null); }, 0);
    }
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", null);
    } else {
      root.style.MozUserSelect = root.__noselect;
      delete root.__noselect;
    }
  }

  function constant(x) {
    return function() {
      return x;
    };
  }

  function DragEvent(target, type, subject, id, active, x, y, dx, dy, dispatch) {
    this.target = target;
    this.type = type;
    this.subject = subject;
    this.identifier = id;
    this.active = active;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this._ = dispatch;
  }

  DragEvent.prototype.on = function() {
    var value = this._.on.apply(this._, arguments);
    return value === this._ ? this : value;
  };

  // Ignore right-click, since that should open the context menu.
  function defaultFilter() {
    return !d3Selection.event.button;
  }

  function defaultContainer() {
    return this.parentNode;
  }

  function defaultSubject(d) {
    return d == null ? {x: d3Selection.event.x, y: d3Selection.event.y} : d;
  }

  function drag() {
    var filter = defaultFilter,
        container = defaultContainer,
        subject = defaultSubject,
        gestures = {},
        listeners = d3Dispatch.dispatch("start", "drag", "end"),
        active = 0,
        mousemoving,
        touchending;

    function drag(selection) {
      selection
          .on("mousedown.drag", mousedowned)
          .on("touchstart.drag", touchstarted)
          .on("touchmove.drag", touchmoved)
          .on("touchend.drag touchcancel.drag", touchended)
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }

    function mousedowned() {
      if (touchending || !filter.apply(this, arguments)) return;
      var gesture = beforestart("mouse", container.apply(this, arguments), d3Selection.mouse, this, arguments);
      if (!gesture) return;
      d3Selection.select(d3Selection.event.view).on("mousemove.drag", mousemoved, true).on("mouseup.drag", mouseupped, true);
      nodrag(d3Selection.event.view);
      nopropagation();
      mousemoving = false;
      gesture("start");
    }

    function mousemoved() {
      noevent();
      mousemoving = true;
      gestures.mouse("drag");
    }

    function mouseupped() {
      d3Selection.select(d3Selection.event.view).on("mousemove.drag mouseup.drag", null);
      yesdrag(d3Selection.event.view, mousemoving);
      noevent();
      gestures.mouse("end");
    }

    function touchstarted() {
      if (!filter.apply(this, arguments)) return;
      var touches = d3Selection.event.changedTouches,
          c = container.apply(this, arguments),
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = beforestart(touches[i].identifier, c, d3Selection.touch, this, arguments)) {
          nopropagation();
          gesture("start");
        }
      }
    }

    function touchmoved() {
      var touches = d3Selection.event.changedTouches,
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          noevent();
          gesture("drag");
        }
      }
    }

    function touchended() {
      var touches = d3Selection.event.changedTouches,
          n = touches.length, i, gesture;

      if (touchending) clearTimeout(touchending);
      touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          nopropagation();
          gesture("end");
        }
      }
    }

    function beforestart(id, container, point, that, args) {
      var p = point(container, id), s, dx, dy,
          sublisteners = listeners.copy();

      if (!d3Selection.customEvent(new DragEvent(drag, "beforestart", s, id, active, p[0], p[1], 0, 0, sublisteners), function() {
        if ((d3Selection.event.subject = s = subject.apply(that, args)) == null) return false;
        dx = s.x - p[0] || 0;
        dy = s.y - p[1] || 0;
        return true;
      })) return;

      return function gesture(type) {
        var p0 = p, n;
        switch (type) {
          case "start": gestures[id] = gesture, n = active++; break;
          case "end": delete gestures[id], --active; // nobreak
          case "drag": p = point(container, id), n = active; break;
        }
        d3Selection.customEvent(new DragEvent(drag, type, s, id, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], sublisteners), sublisteners.apply, sublisteners, [type, that, args]);
      };
    }

    drag.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), drag) : filter;
    };

    drag.container = function(_) {
      return arguments.length ? (container = typeof _ === "function" ? _ : constant(_), drag) : container;
    };

    drag.subject = function(_) {
      return arguments.length ? (subject = typeof _ === "function" ? _ : constant(_), drag) : subject;
    };

    drag.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? drag : value;
    };

    return drag;
  }

  exports.drag = drag;
  exports.dragDisable = nodrag;
  exports.dragEnable = yesdrag;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{"395":395,"399":399}],397:[function(_dereq_,module,exports){
// https://d3js.org/d3-ease/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  function linear(t) {
    return +t;
  }

  function quadIn(t) {
    return t * t;
  }

  function quadOut(t) {
    return t * (2 - t);
  }

  function quadInOut(t) {
    return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
  }

  function cubicIn(t) {
    return t * t * t;
  }

  function cubicOut(t) {
    return --t * t * t + 1;
  }

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var exponent = 3;

  var polyIn = (function custom(e) {
    e = +e;

    function polyIn(t) {
      return Math.pow(t, e);
    }

    polyIn.exponent = custom;

    return polyIn;
  })(exponent);

  var polyOut = (function custom(e) {
    e = +e;

    function polyOut(t) {
      return 1 - Math.pow(1 - t, e);
    }

    polyOut.exponent = custom;

    return polyOut;
  })(exponent);

  var polyInOut = (function custom(e) {
    e = +e;

    function polyInOut(t) {
      return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
    }

    polyInOut.exponent = custom;

    return polyInOut;
  })(exponent);

  var pi = Math.PI;
  var halfPi = pi / 2;
  function sinIn(t) {
    return 1 - Math.cos(t * halfPi);
  }

  function sinOut(t) {
    return Math.sin(t * halfPi);
  }

  function sinInOut(t) {
    return (1 - Math.cos(pi * t)) / 2;
  }

  function expIn(t) {
    return Math.pow(2, 10 * t - 10);
  }

  function expOut(t) {
    return 1 - Math.pow(2, -10 * t);
  }

  function expInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(2, 10 * t - 10) : 2 - Math.pow(2, 10 - 10 * t)) / 2;
  }

  function circleIn(t) {
    return 1 - Math.sqrt(1 - t * t);
  }

  function circleOut(t) {
    return Math.sqrt(1 - --t * t);
  }

  function circleInOut(t) {
    return ((t *= 2) <= 1 ? 1 - Math.sqrt(1 - t * t) : Math.sqrt(1 - (t -= 2) * t) + 1) / 2;
  }

  var b1 = 4 / 11;
  var b2 = 6 / 11;
  var b3 = 8 / 11;
  var b4 = 3 / 4;
  var b5 = 9 / 11;
  var b6 = 10 / 11;
  var b7 = 15 / 16;
  var b8 = 21 / 22;
  var b9 = 63 / 64;
  var b0 = 1 / b1 / b1;
  function bounceIn(t) {
    return 1 - bounceOut(1 - t);
  }

  function bounceOut(t) {
    return (t = +t) < b1 ? b0 * t * t : t < b3 ? b0 * (t -= b2) * t + b4 : t < b6 ? b0 * (t -= b5) * t + b7 : b0 * (t -= b8) * t + b9;
  }

  function bounceInOut(t) {
    return ((t *= 2) <= 1 ? 1 - bounceOut(1 - t) : bounceOut(t - 1) + 1) / 2;
  }

  var overshoot = 1.70158;

  var backIn = (function custom(s) {
    s = +s;

    function backIn(t) {
      return t * t * ((s + 1) * t - s);
    }

    backIn.overshoot = custom;

    return backIn;
  })(overshoot);

  var backOut = (function custom(s) {
    s = +s;

    function backOut(t) {
      return --t * t * ((s + 1) * t + s) + 1;
    }

    backOut.overshoot = custom;

    return backOut;
  })(overshoot);

  var backInOut = (function custom(s) {
    s = +s;

    function backInOut(t) {
      return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
    }

    backInOut.overshoot = custom;

    return backInOut;
  })(overshoot);

  var tau = 2 * Math.PI;
  var amplitude = 1;
  var period = 0.3;
  var elasticIn = (function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticIn(t) {
      return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
    }

    elasticIn.amplitude = function(a) { return custom(a, p * tau); };
    elasticIn.period = function(p) { return custom(a, p); };

    return elasticIn;
  })(amplitude, period);

  var elasticOut = (function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticOut(t) {
      return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
    }

    elasticOut.amplitude = function(a) { return custom(a, p * tau); };
    elasticOut.period = function(p) { return custom(a, p); };

    return elasticOut;
  })(amplitude, period);

  var elasticInOut = (function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticInOut(t) {
      return ((t = t * 2 - 1) < 0
          ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p)
          : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
    }

    elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
    elasticInOut.period = function(p) { return custom(a, p); };

    return elasticInOut;
  })(amplitude, period);

  exports.easeLinear = linear;
  exports.easeQuad = quadInOut;
  exports.easeQuadIn = quadIn;
  exports.easeQuadOut = quadOut;
  exports.easeQuadInOut = quadInOut;
  exports.easeCubic = cubicInOut;
  exports.easeCubicIn = cubicIn;
  exports.easeCubicOut = cubicOut;
  exports.easeCubicInOut = cubicInOut;
  exports.easePoly = polyInOut;
  exports.easePolyIn = polyIn;
  exports.easePolyOut = polyOut;
  exports.easePolyInOut = polyInOut;
  exports.easeSin = sinInOut;
  exports.easeSinIn = sinIn;
  exports.easeSinOut = sinOut;
  exports.easeSinInOut = sinInOut;
  exports.easeExp = expInOut;
  exports.easeExpIn = expIn;
  exports.easeExpOut = expOut;
  exports.easeExpInOut = expInOut;
  exports.easeCircle = circleInOut;
  exports.easeCircleIn = circleIn;
  exports.easeCircleOut = circleOut;
  exports.easeCircleInOut = circleInOut;
  exports.easeBounce = bounceOut;
  exports.easeBounceIn = bounceIn;
  exports.easeBounceOut = bounceOut;
  exports.easeBounceInOut = bounceInOut;
  exports.easeBack = backInOut;
  exports.easeBackIn = backIn;
  exports.easeBackOut = backOut;
  exports.easeBackInOut = backInOut;
  exports.easeElastic = elasticOut;
  exports.easeElasticIn = elasticIn;
  exports.easeElasticOut = elasticOut;
  exports.easeElasticInOut = elasticInOut;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],398:[function(_dereq_,module,exports){
// https://d3js.org/d3-interpolate/ Version 1.1.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, _dereq_(394)) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-color'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3));
}(this, function (exports,d3Color) { 'use strict';

  function basis(t1, v0, v1, v2, v3) {
    var t2 = t1 * t1, t3 = t2 * t1;
    return ((1 - 3 * t1 + 3 * t2 - t3) * v0
        + (4 - 6 * t2 + 3 * t3) * v1
        + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
        + t3 * v3) / 6;
  }

  function basis$1(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
          v1 = values[i],
          v2 = values[i + 1],
          v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
          v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  function basisClosed(values) {
    var n = values.length;
    return function(t) {
      var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
          v0 = values[(i + n - 1) % n],
          v1 = values[i % n],
          v2 = values[(i + 1) % n],
          v3 = values[(i + 2) % n];
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  function constant(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  var rgb$1 = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb(start, end) {
      var r = color((start = d3Color.rgb(start)).r, (end = d3Color.rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = color(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb.gamma = rgbGamma;

    return rgb;
  })(1);

  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length,
          r = new Array(n),
          g = new Array(n),
          b = new Array(n),
          i, color;
      for (i = 0; i < n; ++i) {
        color = d3Color.rgb(colors[i]);
        r[i] = color.r || 0;
        g[i] = color.g || 0;
        b[i] = color.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color.opacity = 1;
      return function(t) {
        color.r = r(t);
        color.g = g(t);
        color.b = b(t);
        return color + "";
      };
    };
  }

  var rgbBasis = rgbSpline(basis$1);
  var rgbBasisClosed = rgbSpline(basisClosed);

  function array(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(nb),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = value(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b -= a, function(t) {
      return d.setTime(a + b * t), d;
    };
  }

  function number(a, b) {
    return a = +a, b -= a, function(t) {
      return a + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = value(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function string(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: number(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function value(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant(b)
        : (t === "number" ? number
        : t === "string" ? ((c = d3Color.color(b)) ? (b = c, rgb$1) : string)
        : b instanceof d3Color.color ? rgb$1
        : b instanceof Date ? date
        : Array.isArray(b) ? array
        : isNaN(b) ? object
        : number)(a, b);
  }

  function round(a, b) {
    return a = +a, b -= a, function(t) {
      return Math.round(a + b * t);
    };
  }

  var degrees = 180 / Math.PI;

  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var cssNode;
  var cssRoot;
  var cssView;
  var svgNode;
  function parseCss(value) {
    if (value === "none") return identity;
    if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
    cssNode.style.transform = value;
    value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
    cssRoot.removeChild(cssNode);
    value = value.slice(7, -1).split(",");
    return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
  }

  function parseSvg(value) {
    if (value == null) return identity;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var rho = Math.SQRT2;
  var rho2 = 2;
  var rho4 = 4;
  var epsilon2 = 1e-12;
  function cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }

  function sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }

  function tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }

  // p0 = [ux0, uy0, w0]
  // p1 = [ux1, uy1, w1]
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
        ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
        dx = ux1 - ux0,
        dy = uy1 - uy0,
        d2 = dx * dx + dy * dy,
        i,
        S;

    // Special case for u0 ≅ u1.
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      }
    }

    // General case.
    else {
      var d1 = Math.sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
          r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S,
            coshr0 = cosh(r0),
            u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      }
    }

    i.duration = S * 1000;

    return i;
  }

  function hsl$1(hue) {
    return function(start, end) {
      var h = hue((start = d3Color.hsl(start)).h, (end = d3Color.hsl(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
  }

  var hsl$2 = hsl$1(hue);
  var hslLong = hsl$1(nogamma);

  function lab$1(start, end) {
    var l = nogamma((start = d3Color.lab(start)).l, (end = d3Color.lab(end)).l),
        a = nogamma(start.a, end.a),
        b = nogamma(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.l = l(t);
      start.a = a(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  function hcl$1(hue) {
    return function(start, end) {
      var h = hue((start = d3Color.hcl(start)).h, (end = d3Color.hcl(end)).h),
          c = nogamma(start.c, end.c),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.c = c(t);
        start.l = l(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
  }

  var hcl$2 = hcl$1(hue);
  var hclLong = hcl$1(nogamma);

  function cubehelix$1(hue) {
    return (function cubehelixGamma(y) {
      y = +y;

      function cubehelix(start, end) {
        var h = hue((start = d3Color.cubehelix(start)).h, (end = d3Color.cubehelix(end)).h),
            s = nogamma(start.s, end.s),
            l = nogamma(start.l, end.l),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.h = h(t);
          start.s = s(t);
          start.l = l(Math.pow(t, y));
          start.opacity = opacity(t);
          return start + "";
        };
      }

      cubehelix.gamma = cubehelixGamma;

      return cubehelix;
    })(1);
  }

  var cubehelix$2 = cubehelix$1(hue);
  var cubehelixLong = cubehelix$1(nogamma);

  function quantize(interpolator, n) {
    var samples = new Array(n);
    for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
    return samples;
  }

  exports.interpolate = value;
  exports.interpolateArray = array;
  exports.interpolateBasis = basis$1;
  exports.interpolateBasisClosed = basisClosed;
  exports.interpolateDate = date;
  exports.interpolateNumber = number;
  exports.interpolateObject = object;
  exports.interpolateRound = round;
  exports.interpolateString = string;
  exports.interpolateTransformCss = interpolateTransformCss;
  exports.interpolateTransformSvg = interpolateTransformSvg;
  exports.interpolateZoom = zoom;
  exports.interpolateRgb = rgb$1;
  exports.interpolateRgbBasis = rgbBasis;
  exports.interpolateRgbBasisClosed = rgbBasisClosed;
  exports.interpolateHsl = hsl$2;
  exports.interpolateHslLong = hslLong;
  exports.interpolateLab = lab$1;
  exports.interpolateHcl = hcl$2;
  exports.interpolateHclLong = hclLong;
  exports.interpolateCubehelix = cubehelix$2;
  exports.interpolateCubehelixLong = cubehelixLong;
  exports.quantize = quantize;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{"394":394}],399:[function(_dereq_,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"7":7}],400:[function(_dereq_,module,exports){
// https://d3js.org/d3-timer/ Version 1.0.2. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  var frame = 0;
  var timeout = 0;
  var interval = 0;
  var pokeDelay = 1000;
  var taskHead;
  var taskTail;
  var clockLast = 0;
  var clockNow = 0;
  var clockSkew = 0;
  var clock = typeof performance === "object" && performance.now ? performance : Date;
  var setFrame = typeof requestAnimationFrame === "function"
          ? (clock === Date ? function(f) { requestAnimationFrame(function() { f(clock.now()); }); } : requestAnimationFrame)
          : function(f) { setTimeout(f, 17); };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake(time) {
    clockNow = (clockLast = time || clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow;
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, delay);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout$1(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(function(elapsed) {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  function interval$1(callback, delay, time) {
    var t = new Timer, total = delay;
    if (delay == null) return t.restart(callback, delay, time), t;
    delay = +delay, time = time == null ? now() : +time;
    t.restart(function tick(elapsed) {
      elapsed += total;
      t.restart(tick, total += delay, time);
      callback(elapsed);
    }, delay, time);
    return t;
  }

  exports.now = now;
  exports.timer = timer;
  exports.timerFlush = timerFlush;
  exports.timeout = timeout$1;
  exports.interval = interval$1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],401:[function(_dereq_,module,exports){
// d3.tip
// Copyright (c) 2013 Justin Palmer
//
// Tooltips for d3.js SVG visualizations

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module with d3 as a dependency.
    define(['d3'], factory)
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = function(d3) {
      d3.tip = factory(d3)
      return d3.tip
    }
  } else {
    // Browser global.
    root.d3.tip = factory(root.d3)
  }
}(this, function (d3) {

  // Public - contructs a new tooltip
  //
  // Returns a tip
  return function() {
    var direction = d3_tip_direction,
        offset    = d3_tip_offset,
        html      = d3_tip_html,
        node      = initNode(),
        svg       = null,
        point     = null,
        target    = null

    function tip(vis) {
      svg = getSVGNode(vis)
      point = svg.createSVGPoint()
      document.body.appendChild(node)
    }

    // Public - show the tooltip on the screen
    //
    // Returns a tip
    tip.show = function() {
      var args = Array.prototype.slice.call(arguments)
      if(args[args.length - 1] instanceof SVGElement) target = args.pop()

      var content = html.apply(this, args),
          poffset = offset.apply(this, args),
          dir     = direction.apply(this, args),
          nodel   = getNodeEl(),
          i       = directions.length,
          coords,
          scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
          scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft

      nodel.html(content)
        .style({ opacity: 1, 'pointer-events': 'all' })

      while(i--) nodel.classed(directions[i], false)
      coords = direction_callbacks.get(dir).apply(this)
      nodel.classed(dir, true).style({
        top: (coords.top +  poffset[0]) + scrollTop + 'px',
        left: (coords.left + poffset[1]) + scrollLeft + 'px'
      })

      return tip
    }

    // Public - hide the tooltip
    //
    // Returns a tip
    tip.hide = function() {
      var nodel = getNodeEl()
      nodel.style({ opacity: 0, 'pointer-events': 'none' })
      return tip
    }

    // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
    //
    // n - name of the attribute
    // v - value of the attribute
    //
    // Returns tip or attribute value
    tip.attr = function(n, v) {
      if (arguments.length < 2 && typeof n === 'string') {
        return getNodeEl().attr(n)
      } else {
        var args =  Array.prototype.slice.call(arguments)
        d3.selection.prototype.attr.apply(getNodeEl(), args)
      }

      return tip
    }

    // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
    //
    // n - name of the property
    // v - value of the property
    //
    // Returns tip or style property value
    tip.style = function(n, v) {
      if (arguments.length < 2 && typeof n === 'string') {
        return getNodeEl().style(n)
      } else {
        var args =  Array.prototype.slice.call(arguments)
        d3.selection.prototype.style.apply(getNodeEl(), args)
      }

      return tip
    }

    // Public: Set or get the direction of the tooltip
    //
    // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
    //     sw(southwest), ne(northeast) or se(southeast)
    //
    // Returns tip or direction
    tip.direction = function(v) {
      if (!arguments.length) return direction
      direction = v == null ? v : d3.functor(v)

      return tip
    }

    // Public: Sets or gets the offset of the tip
    //
    // v - Array of [x, y] offset
    //
    // Returns offset or
    tip.offset = function(v) {
      if (!arguments.length) return offset
      offset = v == null ? v : d3.functor(v)

      return tip
    }

    // Public: sets or gets the html value of the tooltip
    //
    // v - String value of the tip
    //
    // Returns html value or tip
    tip.html = function(v) {
      if (!arguments.length) return html
      html = v == null ? v : d3.functor(v)

      return tip
    }

    // Public: destroys the tooltip and removes it from the DOM
    //
    // Returns a tip
    tip.destroy = function() {
      if(node) {
        getNodeEl().remove();
        node = null;
      }
      return tip;
    }

    function d3_tip_direction() { return 'n' }
    function d3_tip_offset() { return [0, 0] }
    function d3_tip_html() { return ' ' }

    var direction_callbacks = d3.map({
      n:  direction_n,
      s:  direction_s,
      e:  direction_e,
      w:  direction_w,
      nw: direction_nw,
      ne: direction_ne,
      sw: direction_sw,
      se: direction_se
    }),

    directions = direction_callbacks.keys()

    function direction_n() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.n.y - node.offsetHeight,
        left: bbox.n.x - node.offsetWidth / 2
      }
    }

    function direction_s() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.s.y,
        left: bbox.s.x - node.offsetWidth / 2
      }
    }

    function direction_e() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.e.y - node.offsetHeight / 2,
        left: bbox.e.x
      }
    }

    function direction_w() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.w.y - node.offsetHeight / 2,
        left: bbox.w.x - node.offsetWidth
      }
    }

    function direction_nw() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.nw.y - node.offsetHeight,
        left: bbox.nw.x - node.offsetWidth
      }
    }

    function direction_ne() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.ne.y - node.offsetHeight,
        left: bbox.ne.x
      }
    }

    function direction_sw() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.sw.y,
        left: bbox.sw.x - node.offsetWidth
      }
    }

    function direction_se() {
      var bbox = getScreenBBox()
      return {
        top:  bbox.se.y,
        left: bbox.e.x
      }
    }

    function initNode() {
      var node = d3.select(document.createElement('div'))
      node.style({
        position: 'absolute',
        top: 0,
        opacity: 0,
        'pointer-events': 'none',
        'box-sizing': 'border-box'
      })

      return node.node()
    }

    function getSVGNode(el) {
      el = el.node()
      if(el.tagName.toLowerCase() === 'svg')
        return el

      return el.ownerSVGElement
    }

    function getNodeEl() {
      if(node === null) {
        node = initNode();
        // re-add node to DOM
        document.body.appendChild(node);
      };
      return d3.select(node);
    }

    // Private - gets the screen coordinates of a shape
    //
    // Given a shape on the screen, will return an SVGPoint for the directions
    // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
    // sw(southwest).
    //
    //    +-+-+
    //    |   |
    //    +   +
    //    |   |
    //    +-+-+
    //
    // Returns an Object {n, s, e, w, nw, sw, ne, se}
    function getScreenBBox() {
      var targetel   = target || d3.event.target;

      while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
          targetel = targetel.parentNode;
      }

      var bbox       = {},
          matrix     = targetel.getScreenCTM(),
          tbbox      = targetel.getBBox(),
          width      = tbbox.width,
          height     = tbbox.height,
          x          = tbbox.x,
          y          = tbbox.y

      point.x = x
      point.y = y
      bbox.nw = point.matrixTransform(matrix)
      point.x += width
      bbox.ne = point.matrixTransform(matrix)
      point.y += height
      bbox.se = point.matrixTransform(matrix)
      point.x -= width
      bbox.sw = point.matrixTransform(matrix)
      point.y -= height / 2
      bbox.w  = point.matrixTransform(matrix)
      point.x += width
      bbox.e = point.matrixTransform(matrix)
      point.x -= width / 2
      point.y -= height / 2
      bbox.n = point.matrixTransform(matrix)
      point.y += height
      bbox.s = point.matrixTransform(matrix)

      return bbox
    }

    return tip
  };

}));

},{}],402:[function(_dereq_,module,exports){
// https://d3js.org/d3-transition/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, _dereq_(399), _dereq_(395), _dereq_(400), _dereq_(398), _dereq_(394), _dereq_(397)) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-selection', 'd3-dispatch', 'd3-timer', 'd3-interpolate', 'd3-color', 'd3-ease'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, function (exports,d3Selection,d3Dispatch,d3Timer,d3Interpolate,d3Color,d3Ease) { 'use strict';

  var emptyOn = d3Dispatch.dispatch("start", "end", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var ENDING = 4;
  var ENDED = 5;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
    return schedule;
  }

  function set(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
    return schedule;
  }

  function get(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
    return schedule;
  }

  function create(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = d3Timer.timer(schedule, 0, self.time);

    // If the delay is greater than this first sleep, sleep some more;
    // otherwise, start immediately.
    function schedule(elapsed) {
      self.state = SCHEDULED;
      if (self.delay <= elapsed) start(elapsed - self.delay);
      else self.timer.restart(start, self.delay, self.time);
    }

    function start(elapsed) {
      var i, j, n, o;

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // Interrupt the active transition, if any.
        // Dispatch the interrupt event.
        if (o.state === STARTED) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions. No interrupt event is dispatched
        // because the cancelled transitions never started. Note that this also
        // removes this transition from the pending list!
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see mbostock/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      d3Timer.timeout(function() {
        if (self.state === STARTED) {
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(null, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.state = ENDED;
        self.timer.stop();
        self.on.call("end", node, node.__data__, self.index, self.group);
        for (i in schedules) if (+i !== id) return void delete schedules[id];
        delete node.__transition;
      }
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state === STARTED;
      schedule.state = ENDED;
      schedule.timer.stop();
      if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? d3Interpolate.interpolateNumber
        : b instanceof d3Color.color ? d3Interpolate.interpolateRgb
        : (c = d3Color.color(b)) ? (b = c, d3Interpolate.interpolateRgb)
        : d3Interpolate.interpolateString)(a, b);
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, interpolate, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = this.getAttribute(name);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value1);
    };
  }

  function attrConstantNS(fullname, interpolate, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = this.getAttributeNS(fullname.space, fullname.local);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value1);
    };
  }

  function attrFunction(name, interpolate, value) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0, value1 = value(this);
      if (value1 == null) return void this.removeAttribute(name);
      value0 = this.getAttribute(name);
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value10 = value1);
    };
  }

  function attrFunctionNS(fullname, interpolate, value) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var value0, value1 = value(this);
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      value0 = this.getAttributeNS(fullname.space, fullname.local);
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value10 = value1);
    };
  }

  function transition_attr(name, value) {
    var fullname = d3Selection.namespace(name), i = fullname === "transform" ? d3Interpolate.interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
        : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
  }

  function attrTweenNS(fullname, value) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.setAttributeNS(fullname.space, fullname.local, i(t));
      };
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.setAttribute(name, i(t));
      };
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = d3Selection.namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get(this.node(), id).ease;
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = d3Selection.matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = d3Selection.selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = d3Selection.selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection = d3Selection.selection.prototype.constructor;

  function transition_selection() {
    return new Selection(this._groups, this._parents);
  }

  function styleRemove(name, interpolate) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var style = d3Selection.window(this).getComputedStyle(this, null),
          value0 = style.getPropertyValue(name),
          value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value10 = value1);
    };
  }

  function styleRemoveEnd(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, interpolate, value1) {
    var value00,
        interpolate0;
    return function() {
      var value0 = d3Selection.window(this).getComputedStyle(this, null).getPropertyValue(name);
      return value0 === value1 ? null
          : value0 === value00 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value1);
    };
  }

  function styleFunction(name, interpolate, value) {
    var value00,
        value10,
        interpolate0;
    return function() {
      var style = d3Selection.window(this).getComputedStyle(this, null),
          value0 = style.getPropertyValue(name),
          value1 = value(this);
      if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
      return value0 === value1 ? null
          : value0 === value00 && value1 === value10 ? interpolate0
          : interpolate0 = interpolate(value00 = value0, value10 = value1);
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? d3Interpolate.interpolateTransformCss : interpolate;
    return value == null ? this
            .styleTween(name, styleRemove(name, i))
            .on("end.style." + name, styleRemoveEnd(name))
        : this.styleTween(name, typeof value === "function"
            ? styleFunction(name, i, tweenValue(this, "style." + name, value))
            : styleConstant(name, i, value), priority);
  }

  function styleTween(name, value, priority) {
    function tween() {
      var node = this, i = value.apply(node, arguments);
      return i && function(t) {
        node.style.setProperty(name, i(t), priority);
      };
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction(tweenValue(this, "text", value))
        : textConstant(value == null ? "" : value + ""));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function transition(name) {
    return d3Selection.selection().transition(name);
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = d3Selection.selection.prototype;

  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease
  };

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: d3Ease.easeCubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        return defaultTiming.time = d3Timer.now(), defaultTiming;
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = d3Timer.now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  d3Selection.selection.prototype.interrupt = selection_interrupt;
  d3Selection.selection.prototype.transition = selection_transition;

  var root = [null];

  function active(node, name) {
    var schedules = node.__transition,
        schedule,
        i;

    if (schedules) {
      name = name == null ? null : name + "";
      for (i in schedules) {
        if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
          return new Transition([[node]], root, name, +i);
        }
      }
    }

    return null;
  }

  exports.transition = transition;
  exports.active = active;
  exports.interrupt = interrupt;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{"394":394,"395":395,"397":397,"398":398,"399":399,"400":400}],403:[function(_dereq_,module,exports){
// https://d3js.org/d3-zoom/ Version 1.0.3. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, _dereq_(395), _dereq_(396), _dereq_(398), _dereq_(399), _dereq_(402)) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-dispatch', 'd3-drag', 'd3-interpolate', 'd3-selection', 'd3-transition'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, function (exports,d3Dispatch,d3Drag,d3Interpolate,d3Selection,d3Transition) { 'use strict';

  function constant(x) {
    return function() {
      return x;
    };
  }

  function ZoomEvent(target, type, transform) {
    this.target = target;
    this.type = type;
    this.transform = transform;
  }

  function Transform(k, x, y) {
    this.k = k;
    this.x = x;
    this.y = y;
  }

  Transform.prototype = {
    constructor: Transform,
    scale: function(k) {
      return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
    },
    translate: function(x, y) {
      return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x) {
      return x * this.k + this.x;
    },
    applyY: function(y) {
      return y * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x) {
      return (x - this.x) / this.k;
    },
    invertY: function(y) {
      return (y - this.y) / this.k;
    },
    rescaleX: function(x) {
      return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
    },
    rescaleY: function(y) {
      return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };

  var identity = new Transform(1, 0, 0);

  transform.prototype = Transform.prototype;

  function transform(node) {
    return node.__zoom || identity;
  }

  function nopropagation() {
    d3Selection.event.stopImmediatePropagation();
  }

  function noevent() {
    d3Selection.event.preventDefault();
    d3Selection.event.stopImmediatePropagation();
  }

  // Ignore right-click, since that should open the context menu.
  function defaultFilter() {
    return !d3Selection.event.button;
  }

  function defaultExtent() {
    var e = this, w, h;
    if (e instanceof SVGElement) {
      e = e.ownerSVGElement || e;
      w = e.width.baseVal.value;
      h = e.height.baseVal.value;
    } else {
      w = e.clientWidth;
      h = e.clientHeight;
    }
    return [[0, 0], [w, h]];
  }

  function defaultTransform() {
    return this.__zoom || identity;
  }

  function zoom() {
    var filter = defaultFilter,
        extent = defaultExtent,
        k0 = 0,
        k1 = Infinity,
        x0 = -k1,
        x1 = k1,
        y0 = x0,
        y1 = x1,
        duration = 250,
        gestures = [],
        listeners = d3Dispatch.dispatch("start", "zoom", "end"),
        touchstarting,
        touchending,
        touchDelay = 500,
        wheelDelay = 150;

    function zoom(selection) {
      selection
          .on("wheel.zoom", wheeled)
          .on("mousedown.zoom", mousedowned)
          .on("dblclick.zoom", dblclicked)
          .on("touchstart.zoom", touchstarted)
          .on("touchmove.zoom", touchmoved)
          .on("touchend.zoom touchcancel.zoom", touchended)
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
          .property("__zoom", defaultTransform);
    }

    zoom.transform = function(collection, transform) {
      var selection = collection.selection ? collection.selection() : collection;
      selection.property("__zoom", defaultTransform);
      if (collection !== selection) {
        schedule(collection, transform);
      } else {
        selection.interrupt().each(function() {
          gesture(this, arguments)
              .start()
              .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
              .end();
        });
      }
    };

    zoom.scaleBy = function(selection, k) {
      zoom.scaleTo(selection, function() {
        var k0 = this.__zoom.k,
            k1 = typeof k === "function" ? k.apply(this, arguments) : k;
        return k0 * k1;
      });
    };

    zoom.scaleTo = function(selection, k) {
      zoom.transform(selection, function() {
        var e = extent.apply(this, arguments),
            t0 = this.__zoom,
            p0 = centroid(e),
            p1 = t0.invert(p0),
            k1 = typeof k === "function" ? k.apply(this, arguments) : k;
        return constrain(translate(scale(t0, k1), p0, p1), e);
      });
    };

    zoom.translateBy = function(selection, x, y) {
      zoom.transform(selection, function() {
        return constrain(this.__zoom.translate(
          typeof x === "function" ? x.apply(this, arguments) : x,
          typeof y === "function" ? y.apply(this, arguments) : y
        ), extent.apply(this, arguments));
      });
    };

    function scale(transform, k) {
      k = Math.max(k0, Math.min(k1, k));
      return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
    }

    function translate(transform, p0, p1) {
      var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
      return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
    }

    function constrain(transform, extent) {
      var dx = Math.min(0, transform.invertX(extent[0][0]) - x0) || Math.max(0, transform.invertX(extent[1][0]) - x1),
          dy = Math.min(0, transform.invertY(extent[0][1]) - y0) || Math.max(0, transform.invertY(extent[1][1]) - y1);
      return dx || dy ? transform.translate(dx, dy) : transform;
    }

    function centroid(extent) {
      return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
    }

    function schedule(transition, transform, center) {
      transition
          .on("start.zoom", function() { gesture(this, arguments).start(); })
          .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).end(); })
          .tween("zoom", function() {
            var that = this,
                args = arguments,
                g = gesture(that, args),
                e = extent.apply(that, args),
                p = center || centroid(e),
                w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
                a = that.__zoom,
                b = typeof transform === "function" ? transform.apply(that, args) : transform,
                i = d3Interpolate.interpolateZoom(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
            return function(t) {
              if (t === 1) t = b; // Avoid rounding error on end.
              else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
              g.zoom(null, t);
            };
          });
    }

    function gesture(that, args) {
      for (var i = 0, n = gestures.length, g; i < n; ++i) {
        if ((g = gestures[i]).that === that) {
          return g;
        }
      }
      return new Gesture(that, args);
    }

    function Gesture(that, args) {
      this.that = that;
      this.args = args;
      this.index = -1;
      this.active = 0;
      this.extent = extent.apply(that, args);
    }

    Gesture.prototype = {
      start: function() {
        if (++this.active === 1) {
          this.index = gestures.push(this) - 1;
          this.emit("start");
        }
        return this;
      },
      zoom: function(key, transform) {
        if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
        if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
        if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
        this.that.__zoom = transform;
        this.emit("zoom");
        return this;
      },
      end: function() {
        if (--this.active === 0) {
          gestures.splice(this.index, 1);
          this.index = -1;
          this.emit("end");
        }
        return this;
      },
      emit: function(type) {
        d3Selection.customEvent(new ZoomEvent(zoom, type, this.that.__zoom), listeners.apply, listeners, [type, this.that, this.args]);
      }
    };

    function wheeled() {
      if (!filter.apply(this, arguments)) return;
      var g = gesture(this, arguments),
          t = this.__zoom,
          k = Math.max(k0, Math.min(k1, t.k * Math.pow(2, -d3Selection.event.deltaY * (d3Selection.event.deltaMode ? 120 : 1) / 500))),
          p = d3Selection.mouse(this);

      // If the mouse is in the same location as before, reuse it.
      // If there were recent wheel events, reset the wheel idle timeout.
      if (g.wheel) {
        if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
          g.mouse[1] = t.invert(g.mouse[0] = p);
        }
        clearTimeout(g.wheel);
      }

      // If this wheel event won’t trigger a transform change, ignore it.
      else if (t.k === k) return;

      // Otherwise, capture the mouse point and location at the start.
      else {
        g.mouse = [p, t.invert(p)];
        d3Transition.interrupt(this);
        g.start();
      }

      noevent();
      g.wheel = setTimeout(wheelidled, wheelDelay);
      g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent));

      function wheelidled() {
        g.wheel = null;
        g.end();
      }
    }

    function mousedowned() {
      if (touchending || !filter.apply(this, arguments)) return;
      var g = gesture(this, arguments),
          v = d3Selection.select(d3Selection.event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
          p = d3Selection.mouse(this);

      d3Drag.dragDisable(d3Selection.event.view);
      nopropagation();
      g.mouse = [p, this.__zoom.invert(p)];
      d3Transition.interrupt(this);
      g.start();

      function mousemoved() {
        noevent();
        g.moved = true;
        g.zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = d3Selection.mouse(g.that), g.mouse[1]), g.extent));
      }

      function mouseupped() {
        v.on("mousemove.zoom mouseup.zoom", null);
        d3Drag.dragEnable(d3Selection.event.view, g.moved);
        noevent();
        g.end();
      }
    }

    function dblclicked() {
      if (!filter.apply(this, arguments)) return;
      var t0 = this.__zoom,
          p0 = d3Selection.mouse(this),
          p1 = t0.invert(p0),
          k1 = t0.k * (d3Selection.event.shiftKey ? 0.5 : 2),
          t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments));

      noevent();
      if (duration > 0) d3Selection.select(this).transition().duration(duration).call(schedule, t1, p0);
      else d3Selection.select(this).call(zoom.transform, t1);
    }

    function touchstarted() {
      if (!filter.apply(this, arguments)) return;
      var g = gesture(this, arguments),
          touches = d3Selection.event.changedTouches,
          n = touches.length, i, t, p;

      nopropagation();
      for (i = 0; i < n; ++i) {
        t = touches[i], p = d3Selection.touch(this, touches, t.identifier);
        p = [p, this.__zoom.invert(p), t.identifier];
        if (!g.touch0) g.touch0 = p;
        else if (!g.touch1) g.touch1 = p;
      }
      if (touchstarting) {
        touchstarting = clearTimeout(touchstarting);
        if (!g.touch1) return g.end(), dblclicked.apply(this, arguments);
      }
      if (d3Selection.event.touches.length === n) {
        touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
        d3Transition.interrupt(this);
        g.start();
      }
    }

    function touchmoved() {
      var g = gesture(this, arguments),
          touches = d3Selection.event.changedTouches,
          n = touches.length, i, t, p, l;

      noevent();
      if (touchstarting) touchstarting = clearTimeout(touchstarting);
      for (i = 0; i < n; ++i) {
        t = touches[i], p = d3Selection.touch(this, touches, t.identifier);
        if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
        else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
      }
      t = g.that.__zoom;
      if (g.touch1) {
        var p0 = g.touch0[0], l0 = g.touch0[1],
            p1 = g.touch1[0], l1 = g.touch1[1],
            dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
            dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
        t = scale(t, Math.sqrt(dp / dl));
        p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
      }
      else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
      else return;
      g.zoom("touch", constrain(translate(t, p, l), g.extent));
    }

    function touchended() {
      var g = gesture(this, arguments),
          touches = d3Selection.event.changedTouches,
          n = touches.length, i, t;

      nopropagation();
      if (touchending) clearTimeout(touchending);
      touchending = setTimeout(function() { touchending = null; }, touchDelay);
      for (i = 0; i < n; ++i) {
        t = touches[i];
        if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
        else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
      }
      if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
      if (!g.touch0) g.end();
    }

    zoom.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), zoom) : filter;
    };

    zoom.extent = function(_) {
      return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
    };

    zoom.scaleExtent = function(_) {
      return arguments.length ? (k0 = +_[0], k1 = +_[1], zoom) : [k0, k1];
    };

    zoom.translateExtent = function(_) {
      return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], zoom) : [[x0, y0], [x1, y1]];
    };

    zoom.duration = function(_) {
      return arguments.length ? (duration = +_, zoom) : duration;
    };

    zoom.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? zoom : value;
    };

    return zoom;
  }

  exports.zoom = zoom;
  exports.zoomTransform = transform;
  exports.zoomIdentity = identity;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{"395":395,"396":396,"398":398,"399":399,"402":402}],404:[function(_dereq_,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"12":12,"518":518,"564":564}],405:[function(_dereq_,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"13":13,"526":526,"527":527,"528":528,"529":529,"530":530}],406:[function(_dereq_,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"15":15,"545":545,"546":546,"547":547,"548":548,"549":549}],407:[function(_dereq_,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"17":17,"518":518,"564":564}],408:[function(_dereq_,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"18":18,"550":550,"551":551,"552":552,"553":553,"554":554}],409:[function(_dereq_,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"19":19,"518":518,"564":564}],410:[function(_dereq_,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"20":20,"518":518,"564":564}],411:[function(_dereq_,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"21":21,"408":408,"565":565,"566":566}],412:[function(_dereq_,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"22":22,"406":406,"569":569,"570":570,"571":571,"572":572,"573":573}],413:[function(_dereq_,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"23":23,"564":564}],414:[function(_dereq_,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"24":24,"564":564}],415:[function(_dereq_,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"25":25,"518":518,"564":564}],416:[function(_dereq_,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"26":26}],417:[function(_dereq_,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"27":27}],418:[function(_dereq_,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"28":28}],419:[function(_dereq_,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"29":29}],420:[function(_dereq_,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"30":30}],421:[function(_dereq_,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"31":31,"454":454}],422:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"32":32}],423:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33,"483":483,"536":536,"616":616,"617":617}],424:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"34":34}],425:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"35":35}],426:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"36":36}],427:[function(_dereq_,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"37":37}],428:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],429:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39,"596":596}],430:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"40":40,"596":596}],431:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"41":41,"596":596}],432:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"42":42,"596":596}],433:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"43":43,"502":502,"653":653}],434:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"44":44,"607":607}],435:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"45":45}],436:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"412":412,"419":419,"431":431,"433":433,"46":46,"494":494,"501":501,"503":503,"514":514,"522":522,"531":531,"532":532,"533":533,"535":535,"617":617,"622":622,"641":641,"653":653}],437:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],438:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48,"641":641}],439:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"411":411,"421":421,"422":422,"424":424,"486":486,"490":490,"50":50}],440:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"51":51}],441:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"52":52}],442:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"425":425,"53":53,"534":534}],443:[function(_dereq_,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"506":506,"54":54}],444:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"443":443,"55":55,"653":653}],445:[function(_dereq_,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"446":446,"56":56,"653":653}],446:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"506":506,"57":57}],447:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"420":420,"58":58,"630":630}],448:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"492":492,"538":538,"576":576,"59":59}],449:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"425":425,"60":60,"617":617}],450:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],451:[function(_dereq_,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"62":62}],452:[function(_dereq_,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"63":63}],453:[function(_dereq_,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"64":64}],454:[function(_dereq_,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"440":440,"463":463,"65":65}],455:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"444":444,"66":66}],456:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"418":418,"492":492,"538":538,"563":563,"576":576,"656":656,"67":67}],457:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"642":642,"68":68}],458:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"642":642,"69":69}],459:[function(_dereq_,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"460":460,"641":641,"642":642,"70":70}],460:[function(_dereq_,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"412":412,"510":510,"511":511,"512":512,"522":522,"535":535,"617":617,"649":649,"71":71}],461:[function(_dereq_,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"522":522,"642":642,"72":72}],462:[function(_dereq_,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"412":412,"459":459,"73":73}],463:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"74":74}],464:[function(_dereq_,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"535":535,"541":541,"577":577,"630":630,"641":641,"75":75}],465:[function(_dereq_,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"641":641,"76":76}],466:[function(_dereq_,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"522":522,"642":642,"77":77}],467:[function(_dereq_,module,exports){
arguments[4][78][0].apply(exports,arguments)
},{"632":632,"642":642,"78":78}],468:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"472":472,"473":473,"612":612,"617":617,"670":670,"79":79}],469:[function(_dereq_,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"542":542,"559":559,"80":80}],470:[function(_dereq_,module,exports){
arguments[4][81][0].apply(exports,arguments)
},{"542":542,"560":560,"641":641,"81":81}],471:[function(_dereq_,module,exports){
arguments[4][83][0].apply(exports,arguments)
},{"83":83}],472:[function(_dereq_,module,exports){
arguments[4][84][0].apply(exports,arguments)
},{"462":462,"517":517,"556":556,"84":84}],473:[function(_dereq_,module,exports){
arguments[4][85][0].apply(exports,arguments)
},{"459":459,"538":538,"543":543,"556":556,"576":576,"607":607,"611":611,"85":85}],474:[function(_dereq_,module,exports){
arguments[4][86][0].apply(exports,arguments)
},{"412":412,"419":419,"430":430,"470":470,"475":475,"617":617,"641":641,"649":649,"86":86}],475:[function(_dereq_,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"430":430,"436":436,"501":501,"616":616,"617":617,"620":620,"630":630,"641":641,"643":643,"649":649,"683":683,"87":87}],476:[function(_dereq_,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"477":477,"88":88}],477:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"89":89}],478:[function(_dereq_,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"90":90}],479:[function(_dereq_,module,exports){
arguments[4][91][0].apply(exports,arguments)
},{"448":448,"91":91}],480:[function(_dereq_,module,exports){
arguments[4][92][0].apply(exports,arguments)
},{"418":418,"92":92}],481:[function(_dereq_,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"431":431,"492":492,"536":536,"538":538,"576":576,"641":641,"93":93}],482:[function(_dereq_,module,exports){
arguments[4][95][0].apply(exports,arguments)
},{"95":95}],483:[function(_dereq_,module,exports){
arguments[4][96][0].apply(exports,arguments)
},{"96":96}],484:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"424":424,"97":97}],485:[function(_dereq_,module,exports){
arguments[4][98][0].apply(exports,arguments)
},{"413":413,"648":648,"98":98}],486:[function(_dereq_,module,exports){
arguments[4][99][0].apply(exports,arguments)
},{"99":99}],487:[function(_dereq_,module,exports){
arguments[4][100][0].apply(exports,arguments)
},{"100":100,"492":492,"538":538,"563":563,"576":576,"656":656}],488:[function(_dereq_,module,exports){
arguments[4][101][0].apply(exports,arguments)
},{"101":101,"448":448,"481":481}],489:[function(_dereq_,module,exports){
arguments[4][102][0].apply(exports,arguments)
},{"102":102,"424":424}],490:[function(_dereq_,module,exports){
arguments[4][103][0].apply(exports,arguments)
},{"103":103}],491:[function(_dereq_,module,exports){
arguments[4][104][0].apply(exports,arguments)
},{"104":104,"612":612}],492:[function(_dereq_,module,exports){
arguments[4][105][0].apply(exports,arguments)
},{"105":105,"575":575,"617":617}],493:[function(_dereq_,module,exports){
arguments[4][107][0].apply(exports,arguments)
},{"107":107,"414":414}],494:[function(_dereq_,module,exports){
arguments[4][108][0].apply(exports,arguments)
},{"108":108}],495:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109,"493":493}],496:[function(_dereq_,module,exports){
arguments[4][110][0].apply(exports,arguments)
},{"110":110,"416":416,"426":426,"555":555}],497:[function(_dereq_,module,exports){
arguments[4][111][0].apply(exports,arguments)
},{"111":111}],498:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"417":417,"426":426,"567":567}],499:[function(_dereq_,module,exports){
arguments[4][113][0].apply(exports,arguments)
},{"113":113,"413":413}],500:[function(_dereq_,module,exports){
arguments[4][114][0].apply(exports,arguments)
},{"114":114,"493":493}],501:[function(_dereq_,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"117":117}],502:[function(_dereq_,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"118":118,"431":431}],503:[function(_dereq_,module,exports){
arguments[4][119][0].apply(exports,arguments)
},{"119":119,"502":502,"520":520}],504:[function(_dereq_,module,exports){
arguments[4][120][0].apply(exports,arguments)
},{"120":120,"564":564}],505:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"480":480,"537":537}],506:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123}],507:[function(_dereq_,module,exports){
arguments[4][128][0].apply(exports,arguments)
},{"128":128,"455":455}],508:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131,"680":680}],509:[function(_dereq_,module,exports){
arguments[4][132][0].apply(exports,arguments)
},{"132":132,"484":484,"522":522,"555":555,"568":568}],510:[function(_dereq_,module,exports){
arguments[4][135][0].apply(exports,arguments)
},{"135":135,"411":411,"427":427}],511:[function(_dereq_,module,exports){
arguments[4][136][0].apply(exports,arguments)
},{"136":136,"413":413,"414":414,"510":510,"555":555,"567":567,"596":596}],512:[function(_dereq_,module,exports){
arguments[4][137][0].apply(exports,arguments)
},{"137":137,"653":653}],513:[function(_dereq_,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],514:[function(_dereq_,module,exports){
arguments[4][139][0].apply(exports,arguments)
},{"139":139,"449":449,"520":520,"653":653}],515:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"449":449,"521":521,"654":654}],516:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"539":539}],517:[function(_dereq_,module,exports){
arguments[4][145][0].apply(exports,arguments)
},{"145":145,"543":543,"653":653}],518:[function(_dereq_,module,exports){
arguments[4][146][0].apply(exports,arguments)
},{"146":146,"464":464,"523":523}],519:[function(_dereq_,module,exports){
arguments[4][147][0].apply(exports,arguments)
},{"147":147,"562":562}],520:[function(_dereq_,module,exports){
arguments[4][148][0].apply(exports,arguments)
},{"148":148,"562":562,"674":674}],521:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"425":425,"519":519,"520":520,"674":674}],522:[function(_dereq_,module,exports){
arguments[4][150][0].apply(exports,arguments)
},{"150":150,"404":404,"407":407,"409":409,"410":410,"415":415,"450":450,"577":577}],523:[function(_dereq_,module,exports){
arguments[4][151][0].apply(exports,arguments)
},{"151":151}],524:[function(_dereq_,module,exports){
arguments[4][153][0].apply(exports,arguments)
},{"153":153,"492":492,"536":536,"538":538,"576":576,"616":616,"617":617,"632":632}],525:[function(_dereq_,module,exports){
arguments[4][154][0].apply(exports,arguments)
},{"154":154}],526:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"558":558}],527:[function(_dereq_,module,exports){
arguments[4][156][0].apply(exports,arguments)
},{"156":156}],528:[function(_dereq_,module,exports){
arguments[4][157][0].apply(exports,arguments)
},{"157":157,"558":558}],529:[function(_dereq_,module,exports){
arguments[4][158][0].apply(exports,arguments)
},{"158":158,"558":558}],530:[function(_dereq_,module,exports){
arguments[4][159][0].apply(exports,arguments)
},{"159":159,"558":558}],531:[function(_dereq_,module,exports){
arguments[4][160][0].apply(exports,arguments)
},{"160":160}],532:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"493":493,"495":495,"496":496,"497":497,"498":498,"499":499,"500":500}],533:[function(_dereq_,module,exports){
arguments[4][162][0].apply(exports,arguments)
},{"162":162,"438":438,"519":519,"542":542}],534:[function(_dereq_,module,exports){
arguments[4][164][0].apply(exports,arguments)
},{"164":164,"413":413,"616":616,"617":617}],535:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165}],536:[function(_dereq_,module,exports){
arguments[4][166][0].apply(exports,arguments)
},{"166":166}],537:[function(_dereq_,module,exports){
arguments[4][167][0].apply(exports,arguments)
},{"167":167,"536":536,"596":596,"619":619,"641":641}],538:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"617":617,"648":648}],539:[function(_dereq_,module,exports){
arguments[4][169][0].apply(exports,arguments)
},{"169":169}],540:[function(_dereq_,module,exports){
arguments[4][171][0].apply(exports,arguments)
},{"171":171,"504":504,"630":630,"675":675}],541:[function(_dereq_,module,exports){
arguments[4][172][0].apply(exports,arguments)
},{"172":172,"504":504}],542:[function(_dereq_,module,exports){
arguments[4][173][0].apply(exports,arguments)
},{"173":173}],543:[function(_dereq_,module,exports){
arguments[4][174][0].apply(exports,arguments)
},{"174":174,"641":641}],544:[function(_dereq_,module,exports){
arguments[4][175][0].apply(exports,arguments)
},{"175":175}],545:[function(_dereq_,module,exports){
arguments[4][176][0].apply(exports,arguments)
},{"176":176}],546:[function(_dereq_,module,exports){
arguments[4][177][0].apply(exports,arguments)
},{"177":177,"432":432}],547:[function(_dereq_,module,exports){
arguments[4][178][0].apply(exports,arguments)
},{"178":178,"432":432}],548:[function(_dereq_,module,exports){
arguments[4][179][0].apply(exports,arguments)
},{"179":179,"432":432}],549:[function(_dereq_,module,exports){
arguments[4][180][0].apply(exports,arguments)
},{"180":180,"432":432}],550:[function(_dereq_,module,exports){
arguments[4][181][0].apply(exports,arguments)
},{"181":181,"405":405,"406":406,"407":407}],551:[function(_dereq_,module,exports){
arguments[4][182][0].apply(exports,arguments)
},{"182":182,"516":516}],552:[function(_dereq_,module,exports){
arguments[4][183][0].apply(exports,arguments)
},{"183":183,"516":516}],553:[function(_dereq_,module,exports){
arguments[4][184][0].apply(exports,arguments)
},{"184":184,"516":516}],554:[function(_dereq_,module,exports){
arguments[4][185][0].apply(exports,arguments)
},{"185":185,"516":516}],555:[function(_dereq_,module,exports){
arguments[4][186][0].apply(exports,arguments)
},{"186":186}],556:[function(_dereq_,module,exports){
arguments[4][187][0].apply(exports,arguments)
},{"187":187}],557:[function(_dereq_,module,exports){
arguments[4][189][0].apply(exports,arguments)
},{"189":189,"474":474,"641":641}],558:[function(_dereq_,module,exports){
arguments[4][191][0].apply(exports,arguments)
},{"191":191,"518":518}],559:[function(_dereq_,module,exports){
arguments[4][192][0].apply(exports,arguments)
},{"192":192,"562":562}],560:[function(_dereq_,module,exports){
arguments[4][193][0].apply(exports,arguments)
},{"193":193}],561:[function(_dereq_,module,exports){
arguments[4][194][0].apply(exports,arguments)
},{"194":194,"513":513}],562:[function(_dereq_,module,exports){
arguments[4][195][0].apply(exports,arguments)
},{"195":195}],563:[function(_dereq_,module,exports){
arguments[4][196][0].apply(exports,arguments)
},{"196":196,"448":448,"482":482}],564:[function(_dereq_,module,exports){
arguments[4][200][0].apply(exports,arguments)
},{"200":200,"513":513}],565:[function(_dereq_,module,exports){
arguments[4][201][0].apply(exports,arguments)
},{"201":201}],566:[function(_dereq_,module,exports){
arguments[4][202][0].apply(exports,arguments)
},{"202":202}],567:[function(_dereq_,module,exports){
arguments[4][204][0].apply(exports,arguments)
},{"204":204}],568:[function(_dereq_,module,exports){
arguments[4][205][0].apply(exports,arguments)
},{"205":205}],569:[function(_dereq_,module,exports){
arguments[4][207][0].apply(exports,arguments)
},{"207":207,"406":406}],570:[function(_dereq_,module,exports){
arguments[4][208][0].apply(exports,arguments)
},{"208":208}],571:[function(_dereq_,module,exports){
arguments[4][209][0].apply(exports,arguments)
},{"209":209}],572:[function(_dereq_,module,exports){
arguments[4][210][0].apply(exports,arguments)
},{"210":210}],573:[function(_dereq_,module,exports){
arguments[4][211][0].apply(exports,arguments)
},{"211":211,"406":406,"407":407,"408":408}],574:[function(_dereq_,module,exports){
arguments[4][212][0].apply(exports,arguments)
},{"212":212,"428":428,"525":525,"578":578}],575:[function(_dereq_,module,exports){
arguments[4][213][0].apply(exports,arguments)
},{"213":213,"661":661,"685":685}],576:[function(_dereq_,module,exports){
arguments[4][214][0].apply(exports,arguments)
},{"214":214,"648":648}],577:[function(_dereq_,module,exports){
arguments[4][215][0].apply(exports,arguments)
},{"215":215}],578:[function(_dereq_,module,exports){
arguments[4][216][0].apply(exports,arguments)
},{"216":216}],579:[function(_dereq_,module,exports){
arguments[4][221][0].apply(exports,arguments)
},{"221":221,"431":431,"502":502,"505":505,"542":542,"619":619,"653":653}],580:[function(_dereq_,module,exports){
arguments[4][222][0].apply(exports,arguments)
},{"222":222,"502":502,"505":505,"654":654}],581:[function(_dereq_,module,exports){
arguments[4][223][0].apply(exports,arguments)
},{"223":223,"502":502,"505":505,"654":654}],582:[function(_dereq_,module,exports){
arguments[4][224][0].apply(exports,arguments)
},{"224":224,"502":502,"505":505,"653":653}],583:[function(_dereq_,module,exports){
arguments[4][225][0].apply(exports,arguments)
},{"225":225,"434":434,"442":442,"480":480}],584:[function(_dereq_,module,exports){
arguments[4][229][0].apply(exports,arguments)
},{"229":229,"617":617}],585:[function(_dereq_,module,exports){
arguments[4][230][0].apply(exports,arguments)
},{"230":230,"436":436}],586:[function(_dereq_,module,exports){
arguments[4][231][0].apply(exports,arguments)
},{"231":231,"436":436}],587:[function(_dereq_,module,exports){
arguments[4][232][0].apply(exports,arguments)
},{"232":232,"436":436}],588:[function(_dereq_,module,exports){
arguments[4][233][0].apply(exports,arguments)
},{"233":233,"436":436}],589:[function(_dereq_,module,exports){
arguments[4][234][0].apply(exports,arguments)
},{"234":234,"437":437,"653":653}],590:[function(_dereq_,module,exports){
arguments[4][235][0].apply(exports,arguments)
},{"235":235}],591:[function(_dereq_,module,exports){
arguments[4][236][0].apply(exports,arguments)
},{"236":236,"433":433,"438":438}],592:[function(_dereq_,module,exports){
arguments[4][240][0].apply(exports,arguments)
},{"240":240,"418":418,"429":429,"480":480,"581":581}],593:[function(_dereq_,module,exports){
arguments[4][241][0].apply(exports,arguments)
},{"241":241,"418":418,"480":480,"557":557,"663":663}],594:[function(_dereq_,module,exports){
arguments[4][244][0].apply(exports,arguments)
},{"244":244,"681":681}],595:[function(_dereq_,module,exports){
arguments[4][245][0].apply(exports,arguments)
},{"245":245,"682":682}],596:[function(_dereq_,module,exports){
arguments[4][246][0].apply(exports,arguments)
},{"246":246}],597:[function(_dereq_,module,exports){
arguments[4][247][0].apply(exports,arguments)
},{"247":247,"580":580}],598:[function(_dereq_,module,exports){
arguments[4][248][0].apply(exports,arguments)
},{"248":248,"581":581}],599:[function(_dereq_,module,exports){
arguments[4][249][0].apply(exports,arguments)
},{"249":249,"441":441,"444":444,"468":468}],600:[function(_dereq_,module,exports){
arguments[4][250][0].apply(exports,arguments)
},{"250":250,"441":441,"445":445,"468":468}],601:[function(_dereq_,module,exports){
arguments[4][252][0].apply(exports,arguments)
},{"252":252,"443":443,"468":468,"654":654}],602:[function(_dereq_,module,exports){
arguments[4][253][0].apply(exports,arguments)
},{"253":253,"446":446,"468":468,"654":654}],603:[function(_dereq_,module,exports){
arguments[4][254][0].apply(exports,arguments)
},{"254":254,"444":444,"468":468}],604:[function(_dereq_,module,exports){
arguments[4][255][0].apply(exports,arguments)
},{"255":255,"445":445,"468":468}],605:[function(_dereq_,module,exports){
arguments[4][257][0].apply(exports,arguments)
},{"257":257,"447":447,"653":653}],606:[function(_dereq_,module,exports){
arguments[4][258][0].apply(exports,arguments)
},{"258":258,"447":447,"654":654}],607:[function(_dereq_,module,exports){
arguments[4][259][0].apply(exports,arguments)
},{"259":259,"448":448}],608:[function(_dereq_,module,exports){
arguments[4][260][0].apply(exports,arguments)
},{"260":260,"451":451,"508":508}],609:[function(_dereq_,module,exports){
arguments[4][261][0].apply(exports,arguments)
},{"261":261,"508":508}],610:[function(_dereq_,module,exports){
arguments[4][262][0].apply(exports,arguments)
},{"262":262,"452":452,"524":524}],611:[function(_dereq_,module,exports){
arguments[4][263][0].apply(exports,arguments)
},{"263":263,"453":453,"524":524}],612:[function(_dereq_,module,exports){
arguments[4][264][0].apply(exports,arguments)
},{"264":264}],613:[function(_dereq_,module,exports){
arguments[4][265][0].apply(exports,arguments)
},{"265":265,"507":507,"590":590,"612":612}],614:[function(_dereq_,module,exports){
arguments[4][266][0].apply(exports,arguments)
},{"266":266,"468":468,"507":507}],615:[function(_dereq_,module,exports){
arguments[4][267][0].apply(exports,arguments)
},{"267":267,"456":456,"480":480}],616:[function(_dereq_,module,exports){
arguments[4][268][0].apply(exports,arguments)
},{"268":268,"620":620}],617:[function(_dereq_,module,exports){
arguments[4][269][0].apply(exports,arguments)
},{"269":269}],618:[function(_dereq_,module,exports){
arguments[4][270][0].apply(exports,arguments)
},{"270":270,"457":457,"486":486,"561":561}],619:[function(_dereq_,module,exports){
arguments[4][271][0].apply(exports,arguments)
},{"271":271,"630":630,"632":632}],620:[function(_dereq_,module,exports){
arguments[4][272][0].apply(exports,arguments)
},{"272":272,"619":619,"642":642}],621:[function(_dereq_,module,exports){
arguments[4][273][0].apply(exports,arguments)
},{"273":273,"642":642}],622:[function(_dereq_,module,exports){
arguments[4][274][0].apply(exports,arguments)
},{"274":274,"564":564,"675":675}],623:[function(_dereq_,module,exports){
arguments[4][275][0].apply(exports,arguments)
},{"275":275,"458":458,"486":486,"561":561}],624:[function(_dereq_,module,exports){
arguments[4][276][0].apply(exports,arguments)
},{"276":276,"642":642,"643":643}],625:[function(_dereq_,module,exports){
arguments[4][277][0].apply(exports,arguments)
},{"277":277,"522":522,"542":542,"559":559,"616":616,"617":617,"619":619,"622":622}],626:[function(_dereq_,module,exports){
arguments[4][278][0].apply(exports,arguments)
},{"278":278,"459":459}],627:[function(_dereq_,module,exports){
arguments[4][279][0].apply(exports,arguments)
},{"279":279,"459":459}],628:[function(_dereq_,module,exports){
arguments[4][280][0].apply(exports,arguments)
},{"280":280,"642":642}],629:[function(_dereq_,module,exports){
arguments[4][281][0].apply(exports,arguments)
},{"281":281,"564":564}],630:[function(_dereq_,module,exports){
arguments[4][282][0].apply(exports,arguments)
},{"282":282,"641":641}],631:[function(_dereq_,module,exports){
arguments[4][283][0].apply(exports,arguments)
},{"283":283,"678":678}],632:[function(_dereq_,module,exports){
arguments[4][284][0].apply(exports,arguments)
},{"284":284}],633:[function(_dereq_,module,exports){
arguments[4][285][0].apply(exports,arguments)
},{"285":285,"461":461,"486":486,"561":561}],634:[function(_dereq_,module,exports){
arguments[4][286][0].apply(exports,arguments)
},{"286":286,"462":462,"517":517}],635:[function(_dereq_,module,exports){
arguments[4][287][0].apply(exports,arguments)
},{"287":287,"462":462,"517":517}],636:[function(_dereq_,module,exports){
arguments[4][288][0].apply(exports,arguments)
},{"288":288,"640":640}],637:[function(_dereq_,module,exports){
arguments[4][289][0].apply(exports,arguments)
},{"289":289,"464":464,"540":540}],638:[function(_dereq_,module,exports){
arguments[4][290][0].apply(exports,arguments)
},{"290":290}],639:[function(_dereq_,module,exports){
arguments[4][291][0].apply(exports,arguments)
},{"291":291}],640:[function(_dereq_,module,exports){
arguments[4][292][0].apply(exports,arguments)
},{"292":292,"642":642}],641:[function(_dereq_,module,exports){
arguments[4][293][0].apply(exports,arguments)
},{"293":293}],642:[function(_dereq_,module,exports){
arguments[4][294][0].apply(exports,arguments)
},{"294":294}],643:[function(_dereq_,module,exports){
arguments[4][295][0].apply(exports,arguments)
},{"295":295,"519":519,"535":535,"642":642}],644:[function(_dereq_,module,exports){
arguments[4][296][0].apply(exports,arguments)
},{"296":296,"465":465,"486":486,"561":561}],645:[function(_dereq_,module,exports){
arguments[4][297][0].apply(exports,arguments)
},{"297":297,"631":631}],646:[function(_dereq_,module,exports){
arguments[4][298][0].apply(exports,arguments)
},{"298":298,"466":466,"486":486,"561":561}],647:[function(_dereq_,module,exports){
arguments[4][299][0].apply(exports,arguments)
},{"299":299,"617":617,"642":642}],648:[function(_dereq_,module,exports){
arguments[4][300][0].apply(exports,arguments)
},{"300":300,"642":642}],649:[function(_dereq_,module,exports){
arguments[4][301][0].apply(exports,arguments)
},{"301":301,"467":467,"486":486,"561":561}],650:[function(_dereq_,module,exports){
arguments[4][302][0].apply(exports,arguments)
},{"302":302}],651:[function(_dereq_,module,exports){
arguments[4][303][0].apply(exports,arguments)
},{"303":303,"522":522,"642":642}],652:[function(_dereq_,module,exports){
arguments[4][304][0].apply(exports,arguments)
},{"304":304,"642":642}],653:[function(_dereq_,module,exports){
arguments[4][305][0].apply(exports,arguments)
},{"305":305,"423":423,"469":469,"619":619}],654:[function(_dereq_,module,exports){
arguments[4][306][0].apply(exports,arguments)
},{"306":306,"423":423,"470":470,"619":619}],655:[function(_dereq_,module,exports){
arguments[4][307][0].apply(exports,arguments)
},{"307":307,"584":584,"585":585,"586":586,"587":587,"588":588,"589":589,"596":596,"608":608,"609":609,"616":616,"617":617,"618":618,"619":619,"620":620,"621":621,"622":622,"623":623,"624":624,"625":625,"626":626,"627":627,"628":628,"629":629,"630":630,"631":631,"632":632,"633":633,"634":634,"635":635,"636":636,"637":637,"638":638,"639":639,"640":640,"641":641,"642":642,"643":643,"644":644,"645":645,"646":646,"647":647,"648":648,"649":649,"650":650,"651":651,"652":652,"657":657,"658":658,"676":676,"677":677,"678":678,"679":679,"680":680,"683":683,"684":684,"685":685}],656:[function(_dereq_,module,exports){
arguments[4][308][0].apply(exports,arguments)
},{"308":308}],657:[function(_dereq_,module,exports){
arguments[4][309][0].apply(exports,arguments)
},{"309":309,"471":471,"508":508}],658:[function(_dereq_,module,exports){
arguments[4][310][0].apply(exports,arguments)
},{"310":310,"508":508}],659:[function(_dereq_,module,exports){
arguments[4][311][0].apply(exports,arguments)
},{"311":311,"444":444,"468":468}],660:[function(_dereq_,module,exports){
arguments[4][312][0].apply(exports,arguments)
},{"312":312,"444":444,"468":468}],661:[function(_dereq_,module,exports){
arguments[4][313][0].apply(exports,arguments)
},{"313":313,"408":408}],662:[function(_dereq_,module,exports){
arguments[4][314][0].apply(exports,arguments)
},{"314":314,"474":474,"505":505}],663:[function(_dereq_,module,exports){
arguments[4][315][0].apply(exports,arguments)
},{"315":315,"474":474,"505":505}],664:[function(_dereq_,module,exports){
arguments[4][316][0].apply(exports,arguments)
},{"316":316}],665:[function(_dereq_,module,exports){
arguments[4][319][0].apply(exports,arguments)
},{"319":319,"579":579,"580":580,"581":581,"582":582,"583":583,"591":591,"592":592,"593":593,"594":594,"595":595,"597":597,"598":598,"599":599,"600":600,"601":601,"602":602,"603":603,"604":604,"605":605,"606":606,"607":607,"610":610,"611":611,"613":613,"614":614,"615":615,"653":653,"654":654,"659":659,"660":660,"662":662,"663":663,"666":666,"667":667,"668":668,"669":669,"671":671,"672":672,"673":673,"681":681,"682":682,"686":686,"687":687,"688":688,"689":689,"690":690,"691":691}],666:[function(_dereq_,module,exports){
arguments[4][320][0].apply(exports,arguments)
},{"320":320,"424":424,"439":439,"442":442,"476":476,"480":480,"515":515,"576":576}],667:[function(_dereq_,module,exports){
arguments[4][321][0].apply(exports,arguments)
},{"321":321,"468":468,"664":664,"669":669}],668:[function(_dereq_,module,exports){
arguments[4][326][0].apply(exports,arguments)
},{"326":326,"424":424,"442":442,"476":476,"480":480,"576":576}],669:[function(_dereq_,module,exports){
arguments[4][327][0].apply(exports,arguments)
},{"327":327,"468":468,"477":477,"515":515}],670:[function(_dereq_,module,exports){
arguments[4][328][0].apply(exports,arguments)
},{"328":328,"478":478,"479":479,"538":538,"576":576}],671:[function(_dereq_,module,exports){
arguments[4][331][0].apply(exports,arguments)
},{"331":331,"492":492,"538":538,"576":576,"630":630}],672:[function(_dereq_,module,exports){
arguments[4][332][0].apply(exports,arguments)
},{"332":332,"481":481}],673:[function(_dereq_,module,exports){
arguments[4][333][0].apply(exports,arguments)
},{"333":333,"481":481}],674:[function(_dereq_,module,exports){
arguments[4][335][0].apply(exports,arguments)
},{"335":335}],675:[function(_dereq_,module,exports){
arguments[4][336][0].apply(exports,arguments)
},{"336":336}],676:[function(_dereq_,module,exports){
arguments[4][338][0].apply(exports,arguments)
},{"338":338,"413":413,"501":501,"522":522,"544":544,"555":555,"567":567,"574":574,"619":619,"647":647,"690":690}],677:[function(_dereq_,module,exports){
arguments[4][339][0].apply(exports,arguments)
},{"339":339,"680":680}],678:[function(_dereq_,module,exports){
arguments[4][340][0].apply(exports,arguments)
},{"340":340,"677":677}],679:[function(_dereq_,module,exports){
arguments[4][341][0].apply(exports,arguments)
},{"341":341,"435":435,"678":678}],680:[function(_dereq_,module,exports){
arguments[4][342][0].apply(exports,arguments)
},{"342":342,"641":641,"648":648}],681:[function(_dereq_,module,exports){
arguments[4][343][0].apply(exports,arguments)
},{"343":343,"509":509,"653":653}],682:[function(_dereq_,module,exports){
arguments[4][344][0].apply(exports,arguments)
},{"344":344,"509":509,"654":654}],683:[function(_dereq_,module,exports){
arguments[4][345][0].apply(exports,arguments)
},{"345":345,"502":502,"654":654}],684:[function(_dereq_,module,exports){
arguments[4][346][0].apply(exports,arguments)
},{"346":346,"435":435,"678":678}],685:[function(_dereq_,module,exports){
arguments[4][347][0].apply(exports,arguments)
},{"347":347,"485":485}],686:[function(_dereq_,module,exports){
arguments[4][348][0].apply(exports,arguments)
},{"348":348,"419":419,"438":438,"444":444,"468":468,"519":519,"617":617,"630":630,"641":641,"649":649}],687:[function(_dereq_,module,exports){
arguments[4][350][0].apply(exports,arguments)
},{"350":350,"487":487}],688:[function(_dereq_,module,exports){
arguments[4][351][0].apply(exports,arguments)
},{"351":351,"488":488,"491":491}],689:[function(_dereq_,module,exports){
arguments[4][352][0].apply(exports,arguments)
},{"352":352,"488":488,"491":491}],690:[function(_dereq_,module,exports){
arguments[4][353][0].apply(exports,arguments)
},{"353":353,"489":489,"653":653}],691:[function(_dereq_,module,exports){
arguments[4][354][0].apply(exports,arguments)
},{"354":354,"489":489,"654":654}],692:[function(_dereq_,module,exports){
module.exports = _dereq_(391);
},{"391":391}]},{},[357])(357)
});
//# sourceMappingURL=d3-polytree-viewer.js.map