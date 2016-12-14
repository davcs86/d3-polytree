'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  BaseElement = require('../baseElement'),
  inherits = require('inherits'),
  d3 = require('d3')
  ;

/**
 * The node drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Nodes} nodes
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {IconLoader} iconLoader
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Nodes(nodes, canvas, eventBus, iconLoader, elementBuilder, elementRegistry, labels) {

  this._iconLoader = iconLoader;
  this._labels = labels;
  BaseElement.call(this, 'node', nodes, canvas, eventBus, elementBuilder, elementRegistry);

}

inherits(Nodes, BaseElement);

Nodes.$inject = [
  'd3polytree.definitions.node',
  'canvas',
  'eventBus',
  'iconLoader',
  'elementBuilder',
  'elementRegistry',
  'labels'
];

module.exports = Nodes;

Nodes.prototype._createElement = function(node, definition){
  var that = this;

  d3.select(node.node().parentNode)
    // .attr('fx', function(d){
    //   console.log(d);
    //   return !isUndefined(d.position.x) ? d.position.x : d.x;
    // })
    // .attr('fy', function(d){
    //   return !isUndefined(d.position.y) ? d.position.y : d.y;
    // })
    .attr('transform', function(d){
      return 'translate(' + d.position.x + ',' + d.position.y + ')';
    });

  // draw the nodes icons
  node
    .append('svg')
    .attr('width', function(d){
      return !isUndefined(d.size) ? d.size : 50;
    })
    .attr('height', function(d){
      return !isUndefined(d.size) ? d.size : 50;
    })
    .attr('viewBox', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? that._iconLoader._processedIcons[d.type] :
        that._iconLoader._processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
    .attr('xlink:href', function(d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? '#'+d.type+'_icon_def' :
        '#default_icon_def';
    });

  // add the label
  this._labels.appendElement(definition.label);

};
