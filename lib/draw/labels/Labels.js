'use strict';

var isUndefined = require('lodash/lang').isUndefined,
  _labels = {};

/**
 * Labels description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Labels(canvas, eventBus) {
  var that = this;

  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

Labels.$inject = [
  'canvas'
];

module.exports = Labels;

Labels.prototype._init = function () {
  var that = this;
  this._eventBus.on('canvas.resized', function(){
    that._draw();
  })
};

Labels.prototype._drawLabel = function (label){
  if (isUndefined(_labels[label])){
    // f=draw the
  }
};