'use strict';

/**
 * Labels description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Labels(canvas) {
  var that = this;

  this._canvas = canvas;

  this._init();
}

Labels.$inject = [
  'canvas'
];

module.exports = Labels;

Labels.prototype._init = function () {

};