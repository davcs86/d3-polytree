'use strict';

var domify = require('min-dom/lib/domify'),
  assign = require('lodash/object').assign
;

/**
 * Exporting description
 *
 * @class
 * @constructor
 *
 * @param {d3polytree} d3polytree
 */

function Exporting(canvas, d3polytree) {
  
  this._canvas = canvas;
  this._d3polytree = d3polytree;
  this._init();
  
}

Exporting.$inject = [
  'canvas',
  'd3polytree'
];

module.exports = Exporting;

Exporting.prototype._encode = function (data) {
  return 'data:application/xml;charset=UTF-8,' +
    encodeURIComponent(data);
};

Exporting.prototype.trigger = function (fileType, options) {
  var fn, that = this;
  switch (fileType) {
    case 'pfdn':
      fn = this._d3polytree.exportDiagram;
      break;
    case 'svg':
      fn = this._d3polytree.exportSVG;
      break;
    default:
      throw new Error('Format not supported');
  }
  fn.call(this._d3polytree, options).then(function (str) {
    that._exporter.setAttribute('href', that._encode(str));
    that._exporter.setAttribute('download', 'diagram.' + fileType);
    that._exporter.click();
  }, function (e) {
    throw new Error(e);
  });
};

Exporting.prototype._init = function () {
  var container = this._canvas.getContainer();
  
  this._exporter = domify('<a/>');
  
  assign(this._exporter.style, {
    width: 1,
    height: 1,
    display: 'none',
    overflow: 'hidden'
  });
  
  container.insertBefore(this._exporter, container.childNodes[0]);
};