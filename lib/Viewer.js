'use strict';

var assign = require('lodash/object').assign,
  isString = require('lodash/lang').isString,
  isUndefined = require('lodash/lang').isUndefined,
  cloneDeep = require('lodash/lang').cloneDeep,
  toSafeInteger = require('lodash/lang').toSafeInteger,
  forIn = require('lodash/object').forIn,
  forEach = require('lodash/collection').forEach,
  keys = require('lodash/object').keys,
  values = require('lodash/object').values,
  noop = require('lodash/util').noop,
  d3js = require('d3'),
  lightBox = require('./utils/lightBox'),
  dblClick = require('./utils/dblClick'),
  domQuery = require('min-dom/lib/query'),
  tooltipHelper = require('d3-tip'),
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
  },
  xml2js = require('xml2js'),
  rawIcons = require('./icons'),
  processedIcons = {},
  helper = require('./utils/helper');

require('./utils/styles.scss');

function SimpleNetwork(options) {
  var that = this;

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

  this.container = parent;
  this.container.style.backgroundColor = this.options.bgColor;

  this.nodes = cloneDeep(options.nodes);

  this.onNodeClick = function(evt, node){
    var cb = that.options.onNodeClick;
    if (cb !== undefined) {
      var cbPromise = cb.call(undefined, node);
      if (cbPromise !== undefined){
        cbPromise.then(
          function (content) {
            lightBox.open(content);
          },
          noop
        );
      }
    }
  };
  this.destroy();
  // init the d3-tip plugin
  tooltipHelper(d3js);
  this.init(true);
}