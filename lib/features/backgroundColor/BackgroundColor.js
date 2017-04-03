'use strict';

//var assign = require('lodash/object').assign;

/**
 * Sets the background color.
 *
 * @class
 * @constructor
 *
 * @param canvas
 * @param settings
 */
function BackgroundColor(canvas, settings) {
  this._canvas = canvas;
  this._settings = settings;
  this._bgRect = null;
  this._init();
}

BackgroundColor.$inject = [
  'canvas',
  'd3polytree.definitions.settings',
];

module.exports = BackgroundColor;

BackgroundColor.prototype.setColor = function (color) {
  if (this._bgRect){
    // update model
    this._settings.backgroundColor = color;
    this._refill();
  }
};

BackgroundColor.prototype._refill = function(){
  this._bgRect.attr('fill', this._settings.backgroundColor);
};

BackgroundColor.prototype._init = function(){
  this._bgRect = this._canvas.getRootLayer()
    .insert('rect', ':first-child')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', this._settings.backgroundColor);
};