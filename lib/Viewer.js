'use strict';

var domify = require('min-dom/lib/domify'),
  domQuery = require('min-dom/lib/query')
  ;//domRemove = require('min-dom/lib/remove');

var assign = require('lodash/object').assign,
  omit = require('lodash/object').omit,
  Deferred = require('Q').defer,
  Graph = require('d3-canvas'),
  isString = require('lodash/lang').isString,
  isNumber = require('lodash/lang').isNumber,
  //lightBox = require('./utils/lightBox'),
  //dblClick = require('./utils/dblClick'),
  DEFAULT_OPTIONS = {
    width: '1300',
    height: '800',
    position: 'relative',
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
    groups: {}
  };
  //xml2js = require('xml2js'),
  //helper = require('./utils/helper');

/**
 * Ensure the passed argument is a proper unit (defaulting to px)
 */
function ensureUnit(val) {
  return val + (isNumber(val) ? 'px' : '');
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

  var container = this.container = domify('<div class="bjs-container"></div>');
  parent.appendChild(container);

  assign(container.style, {
    width: ensureUnit(options.width),
    height: ensureUnit(options.height),
    position: options.position,
    backgroundColor: options.bgColor
  });

  // this.nodes = cloneDeep(options.nodes);
  //
  // this.onNodeClick = function(evt, node){
  //   var cb = that.options.onNodeClick;
  //   if (cb !== undefined) {
  //     var cbPromise = cb.call(undefined, node);
  //     if (cbPromise !== undefined){
  //       cbPromise.then(
  //         function (content) {
  //           lightBox.open(content);
  //         },
  //         noop
  //       );
  //     }
  //   }
  // };
  // this.destroy();
  // // init the d3-tip plugin
  // tooltipHelper(d3js);
  // this.init(true);
}

module.exports = Viewer;

Viewer.prototype._createGraph = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);
  var icons = [].concat(options.icons || this.getIcons(), options.additionalIcons || []);

  // add self as an available service
  modules.unshift({
    d3polytree: [ 'value', this ]
  });

  options = omit(options, 'additionalModules');
  options = omit(options, 'additionalIcons');

  options = assign(options, {
    canvas: assign({}, options.canvas, { container: this.container }),
    icons: icons,
    modules: modules
  });

  var gg = new Graph(options);
  console.log(gg);
  return gg;
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

Viewer.prototype.importNodes = function(nodesDictionary){
  var deferResponse = Deferred();
  try {
    if (this.graph) {
      this.clear();
    }
    this.nodes = nodesDictionary;

    var graph = this.graph = this._createGraph(this.options);

    this._init(graph);
  } catch(e){
    deferResponse.reject(e);
  }
  return deferResponse.promise;
};

/**
 * Load the nodes to show in the diagram.
 *
 * Once finished the viewer reports back the result to the
 * provided callback function with (err, warnings).
 *
 * @param {Object} Javascript object with the nodes properties.
 */
Viewer.prototype.setNodes = function(nodesDictionary) {
  return this.importNodes(nodesDictionary);
};

// modules the viewer is composed of
Viewer.prototype._modules = [
  require('./core')
];

// icons the viewer has available
Viewer.prototype._icons = [
  require('./draw/icons')
];