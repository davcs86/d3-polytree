'use strict';

var Promise = require('Q').Promise,
  inherits = require('inherits'),
  ITool = require('../ITool'),
  d3 = require('d3');

require('./style');

function AddLinkTool(eventBus, elementRegistry, selection, drag, canvas, modelling) {
  ITool.call(this);
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._selection = selection;
  this._drag = drag;
  this._canvas = canvas;
  this._modelling = modelling;
  
  this._selectedNodes = [];
  this._fakeLink = this._canvas.getDrawingLayer()
    .insert('path', '.node') // send under the nodes layer
    .attr('class', 'fake-link')
    .attr('d', 'M0,0L0,0')
    .style('stroke', 'black')
    .style('fill', 'none');
}

AddLinkTool.$inject = [
  'eventBus',
  'elementRegistry',
  'selection',
  'drag',
  'canvas',
  'modelling'
];

module.exports = AddLinkTool;

inherits(AddLinkTool, ITool);

AddLinkTool.prototype._registerEvent = function () {
  var that = this;
  this._eventBus.once('node.mousedown', 100, function (element, definition, event) {
    if (!that.active) return;
    return Promise(function (resolve, reject) {
      event.stopImmediatePropagation();
      reject();
      if (that._selectedNodes.length === 0 ||
        (that._selectedNodes.length === 1 && that._selectedNodes[0]['element'] !== element)) {
        // set the selected node
        that._selectedNodes.push({element, definition});
      }
      if (that._selectedNodes.length === 2) {
        // create link
        that._appendLink();
        // deactivate
        that.deactivate();
      } else {
        if (that._selectedNodes.length === 1) {
          // append the fake link
          that._showFakeLink();
        }
        // register event
        that._registerEvent();
      }
    });
  });
};

AddLinkTool.prototype._showFakeLink = function () {
  // get the first node
  var sourceElemDef = this._selectedNodes[0]['definition'],
    x = sourceElemDef.position.x,
    y = sourceElemDef.position.y;
  
  this._fakeLink
    .attr('d', 'M' + x + ',' + y + 'L' + x + ',' + y);
};

AddLinkTool.prototype._resetFakeLink = function () {
  // return to original position
  this._fakeLink
    .attr('d', 'M0,0L0,0');
};

AddLinkTool.prototype._registerMouseMoveEvent = function () {
  var that = this;
  this._canvas.getRootLayer().on('mousemove', function () {
    if (!that.active) return;
    if (that._selectedNodes.length === 1) {
      // move the fake link
      var sourceElemDef = that._selectedNodes[0]['definition'],
        dL = that._canvas.getDrawingLayer().node(),
        x = sourceElemDef.position.x + (sourceElemDef.size / 2),
        y = sourceElemDef.position.y + (sourceElemDef.size / 2),
        x1 = d3.mouse(dL)[0],
        y1 = d3.mouse(dL)[1];
      
      that._fakeLink
        .attr('d', 'M' + x + ',' + y + 'L' + x1 + ',' + y1);
    }
  });
};

AddLinkTool.prototype._appendLink = function () {
  // create link
  this._modelling.doAction(
    'link',
    'create',
    [this._selectedNodes[0]['definition'], this._selectedNodes[1]['definition']]
  );
};

AddLinkTool.prototype.deactivate = function () {
  this.active = false;
  // remove class
  this._canvas.getRootLayer().classed('no-drag', false);
  this._canvas.getRootLayer().classed('cursor-add-link', false);
  // reset the fake link
  this._resetFakeLink();
};

AddLinkTool.prototype.activate = function () {
  this.active = true;
  this._selectedNodes = [];
  this._canvas.getRootLayer().classed('no-drag', true);
  this._canvas.getRootLayer().classed('cursor-add-link', true);
  this._registerMouseMoveEvent();
  this._registerEvent();
};

