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
 * @param {EventEmitter} eventBus
 * @param {IconLoader} iconLoader
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 * @param {DrawingRegistry} drawingRegistry
 */
function Nodes(nodes, canvas, eventBus, iconLoader, elementBuilder, elementRegistry, drawingRegistry) {
  
  this._iconLoader = iconLoader;
  BaseElement.call(this, 'node', nodes, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
  
}

inherits(Nodes, BaseElement);

Nodes.$inject = [
  'd3polytree.definitions.node',
  'canvas',
  'eventBus',
  'iconLoader',
  'elementBuilder',
  'elementRegistry',
  'drawingRegistry'
];

module.exports = Nodes;

Nodes.prototype._setElementsData = function () {
  return this._elementsContainer
    .selectAll('.' + this._className + 'Item')
    .data(this.getAll(), function (d) {
      if (!d.position){
        console.log(0);
      }
      return {
        'id_': d.id,
        'name_': d.name,
        'tag_': d.tag,
        'px_': d.position.x,
        'py_': d.position.y,
        't_': d.type,
        's_': d.size
      };
    });
};

Nodes.prototype._createElement = function (node, definition) {
  var that = this;

  var translate = 'translate(';

  translate += definition.position.x;
  translate += ',';
  translate += definition.position.y;
  translate += ')';

  node
    .attr('x', definition.position.x)
    .attr('y', definition.position.y)
    .attr('transform', translate);
  
  // draw the nodes icons
  node
    .select('.innerElement')
    .append('svg')
    .attr('width', definition.size)
    .attr('height', definition.size)
    .attr('viewBox', function (d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? that._iconLoader._processedIcons[d.type] :
        that._iconLoader._processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
    .attr('xlink:href', function (d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? '#' + d.type + '_icon_def' :
        '#default_icon_def';
    });
  
};

Nodes.prototype._updateElement = function (node, definition) {
  var that = this;

  var translate = 'translate(';

  translate += definition.position.x;
  translate += ',';
  translate += definition.position.y;
  translate += ')';

  node
    .attr('x', definition.position.x)
    .attr('y', definition.position.y)
    .attr('transform', translate);

  // node
  //   .attr('x', function (d) {
  //     return d.position.x;
  //   })
  //   .attr('y', function (d) {
  //     return d.position.y;
  //   })
  //   .attr('transform', function (d) {
  //     return 'translate(' + d.position.x + ',' + d.position.y + ')';
  //   });

  // draw the nodes icons
  node
    .select('.innerElement')
    .select('svg')
    .attr('width', definition.size)
    .attr('height', definition.size)
    .attr('viewBox', function (d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? that._iconLoader._processedIcons[d.type] :
        that._iconLoader._processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .select('use')
    .attr('xlink:href', function (d) {
      return (!isUndefined(that._iconLoader._processedIcons[d.type])) ? '#' + d.type + '_icon_def' :
        '#default_icon_def';
    });

};

Nodes.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .insert('g', '.label') // send to the background
    .attr('class', this._className);
};
