'use strict';

var domify = require('min-dom').domify,
  domDelegate = require('min-dom').delegate
  ;

require('../../../assets/font/css/pfdn-font-embedded.css');
require('../../../assets/font/css/pfdn-font-ie7-codes.css');
require('./style');

/**
 * Palette description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Palette(canvas) {

  this._canvas = canvas;
  this._paletteContainer = null;

  this._init();
}

Palette.$inject = [
  'canvas'
];

module.exports = Palette;

Palette.prototype._drawContainer = function () {
  var container = this._canvas.getContainer();

  this._paletteContainer = domify(Palette.HTML_MARKUP);

  container.insertBefore(this._paletteContainer, container.childNodes[0]);
};

Palette.prototype._drawEntries = function() {

};

Palette.prototype._init = function () {
  this._drawContainer();
  this._drawEntries();
};

/* markup definition */

Palette.HTML_MARKUP =
  '<div class="pfdjs-palette">' +
  '  <div class="pfdjs-entries">' +
  '    <div class="pfdjs-entries-group">' +
  '       <div class="pfdjs-entry">' +
  '         <span class="icon-download"></span>' +
  '       </div>' +
  '       <div class="pfdjs-entry">' +
  '         <span class="icon-plus-circled"></span>' +
  '       </div>' +
  '    </div>' +
  '    <div class="pfdjs-entries-group"></div>' +
  '    <div class="pfdjs-entries-group"></div>' +
  '    <div class="pfdjs-entries-group"></div>' +
  '    <div class="pfdjs-entries-group"></div>' +
  '    <div class="pfdjs-entries-group"></div>' +
  '  </div>' +
  '  <div class="pfdjs-toggle"></div>' +
  '</div>';