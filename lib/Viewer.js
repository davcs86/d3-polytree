'use strict';

var domQuery = require('min-dom/lib/query'),
  assign = require('lodash/object').assign,
  omit = require('lodash/object').omit,
  Deferred = require('Q').defer,
  Graph = require('d3-canvas'),
  isString = require('lodash/lang').isString,
  domEvent = require('min-dom/lib/event'),
  PfdnModdle = require('pfdn-moddle'),
  DEFAULT_OPTIONS = {
    container: 'body'
  };

function initListeners(graph, listeners) {
  var events = graph.get('eventBus');

  listeners.forEach(function(l) {
    events.on(l.event, l.callback, l.that);
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
    position: 'relative'
  });

  options.container = this.container = parent;

}

module.exports = {
  Viewer: Viewer
};

Viewer.prototype._init = function(graph) {
  var that = this;
  initListeners(graph, this.__listeners || []);
  domEvent.bind(window, 'resize', function(){
    that.get('canvas').resized();
  });
};

Viewer.prototype._createGraph = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);

  // add self as an available service
  modules.unshift({
    d3polytree: [ 'value', this ]
  });

  options = omit(options, 'additionalModules');

  this.options = options = assign(options, {
    canvas: assign({}, options.canvas, { container: this.container }),
    modules: modules
  });

  var graph = new Graph(options);
  this._init(graph);
  return graph;
};

Viewer.prototype.getModules = function() {
  return this._modules;
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
 * Import the diagram to draw.
 *
 * Once finished the viewer reports back the result to the
 * provided callback function with (err, warnings).
 *
 * @param {Object} Javascript object with the diagram definitions.
 */
Viewer.prototype.importDiagram = function(definitions){
  var that = this,
    deferResponse = Deferred();
  try {
    if (this.graph) {
      this.clear();
    }
    // create the moddle
    this.moddle = this._createModdle();
    // import the definitions
    this.moddle.fromXML(definitions, function(err, definitionsObj) {
      if (err){
        deferResponse.reject(err);
        return;
      }
      that.definitions = definitionsObj;
      that.graph = that._createGraph(that.options);
      deferResponse.resolve();
    });
  } catch(e){
    deferResponse.reject(e);
  }
  return deferResponse.promise;
};

/**
 * Register an event listener on the viewer
 *
 * Remove a previously added listener via {@link #off(event, callback, context)}.
 *
 * @param {String} event
 * @param {Function} callback
 * @param {Object} [that] context
 */
Viewer.prototype.on = function(event, callback, that) {
  var graph = this.graph,
    listeners = this.__listeners = this.__listeners || [];

  listeners.push({ event: event, callback: callback, that: that });

  if (graph) {
    return graph.get('eventBus').on(event, callback, that);
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


Viewer.prototype._createModdle = function() {
  var moddleOptions = assign({}, this._moddleExtensions, this.options.moddleExtensions);
  return new PfdnModdle(moddleOptions);
};

// modules the viewer is composed of
Viewer.prototype._modules = [
  require('./core')
];

// default moddle extensions the viewer is composed of
Viewer.prototype._moddleExtensions = {};