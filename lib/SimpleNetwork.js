'use strict';

var assign = require('lodash/object').assign,
  //omit = require('lodash/object/omit'),
  isString = require('lodash/lang').isString,
  isNumber = require('lodash/lang').isNumber,
  d3js = require('d3');

var domify = require('min-dom/lib/domify'),
  domQuery = require('min-dom/lib/query');

var DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  position: 'relative',
  container: 'body'
};

/**
 * Ensure the passed argument is a proper unit (defaulting to px)
 */
function ensureUnit(val) {
  return val + (isNumber(val) ? 'px' : '');
}

function SimpleNetwork(options) {

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

  var container = this.container = domify('<div class="d3sn-container"></div>');
  parent.appendChild(container);

  assign(container.style, {
    width: ensureUnit(options.width),
    height: ensureUnit(options.height),
    position: options.position
  });

  /**
    * get the nodes
    * Node: {
    *     adjacencyList: [],
    *     label: ''
    *     iconType: 'box|process|field|exit'
    *     onClick: function(node, evt){},
    *     onHover: function(node, evt){}
    * }
    *
   **/

  this.nodes = options.nodes;
}

SimpleNetwork.prototype.initSVG = function(){
  this.SVG = d3js.select(this.container)
    .append('svg')
    .attr('onContextMenu', 'return false;')
    .attr('width', '100%')
    .attr('height', '100%');
};

SimpleNetwork.prototype.processNodes = function() {

};

SimpleNetwork.prototype.restart = function(reprocess){
  if (reprocess) {
    this.processNodes();
  }
  // create the nodes (with their coordinates)

  // create the links

  // set the events
  this.SVG.on('mousedown', function(){})
    .on('mousemove', function(){})
    .on('mouseup', function(){});
};

SimpleNetwork.prototype.init = function(){
  // init d3
  this.initSVG();
  // process the nodes
  this.restart(true);
};

module.exports = SimpleNetwork;