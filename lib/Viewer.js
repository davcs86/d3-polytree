'use strict';

var domQuery = require('min-dom/lib/query'),
  assign = require('lodash/object').assign,
  omit = require('lodash/object').omit,
  Deferred = require('Q').defer,
  Graph = require('d3-canvas'),
  isString = require('lodash/lang').isString,
  eventListener = require('add-event-listener'),
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

  listeners.forEach(function(l) {
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

module.exports = {Viewer: Viewer};

Viewer.prototype._init = function(graph) {
  var that = this;
  initListeners(graph, this.__listeners || []);
  eventListener(window, 'resize', function(){
    that.get('canvas').resized();
  });
};


Viewer.prototype._createGraph = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);
  var icons = [].concat(options.icons || this.getIcons(), options.additionalIcons || []);

  // add self as an available service
  modules.unshift({
    d3polytree: [ 'value', this ]
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

Viewer.prototype.getModules = function() {
  return this._modules;
};

Viewer.prototype.getIcons = function() {
  return this._icons;
};

/**
 * Remove all drawn elements from the viewer.
 *
 * After calling this method the viewer can still
 * be reused for opening another nodes.
 */
Viewer.prototype.clear = function() {
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
Viewer.prototype.get = function(name) {

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
Viewer.prototype.importNodes = function(nodesDictionary){
  var deferResponse = Deferred();
  try {
    if (this.graph) {
      this.clear();
    }
    this.nodes = nodesDictionary;

    this.graph = this._createGraph(this.options);

    //this._init(graph);
    deferResponse.resolve();
  } catch(e){
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
Viewer.prototype.on = function(event, priority, callback, that) {
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
Viewer.prototype.off = function(event, callback) {
  var filter,
    graph = this.graph;

  if (callback) {
    filter = function(l) {
      return !(l.event === event && l.callback === callback);
    };
  } else {
    filter = function(l) {
      return l.event !== event;
    };
  }

  this.__listeners = (this.__listeners || []).filter(filter);

  if (graph) {
    graph.get('eventBus').off(event, callback);
  }
};


// modules the viewer is composed of
Viewer.prototype._modules = [
  require('./core')
];

// icons the viewer has available
Viewer.prototype._icons = require('./draw/icons');