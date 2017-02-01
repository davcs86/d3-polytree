'use strict';

var assign = require('lodash/object').assign;

/**
 * Sets the background color.
 *
 * @class
 * @constructor
 *
 * @param {DOMElement} parent
 */
function BackgroundColor(parent, settings, s) {
  this._parent = parent;
  this._settings = settings;
  this.setColor(settings.backgroundColor);
}

BackgroundColor.$inject = [ 'd3polytree.container', 'd3polytree.definitions.settings', 'd3polytree.definitions'];

module.exports = BackgroundColor;

BackgroundColor.prototype.setColor = function(color){
  assign(this._parent.style, {'background-color': color});
  this._settings.backgroundColor = color;
};