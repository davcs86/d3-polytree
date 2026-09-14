'use strict';

var domify = require('min-dom/lib/domify'),
    assign = require('lodash/object').assign,
    Promise = require('q').Promise
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
  return new Promise(function(resolve){
    resolve('data:application/xml;base64,' + btoa( unescape( encodeURIComponent(data))));
  });
};

Exporting.prototype._svgToImage = function (data) {
  var that = this;
  //console.log(data);
  return new Promise(function(resolve) {

    var imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var bBox = that._canvas.getSVG().node().parentNode;
    var width = bBox.offsetWidth;
    var height = bBox.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = function () {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };

    image.src = imgSrc;
  });
};

Exporting.prototype.trigger = function (fileType, options) {
  var fn, fnEncode, that = this;
  if (fileType === 'pfdn') {
    fn = this._d3polytree.exportDiagram;
    fnEncode = this._encode;
  } else if (fileType === 'svg') {
    fn = this._d3polytree.exportSVG;
    fnEncode = this._encode;
  } else if (fileType === 'png') {
    fn = this._d3polytree.exportSVG;
    fnEncode = this._svgToImage;
  } else {
    console.error('Format not supported');
  }
  fn.call(this._d3polytree, options).then(function (str) {
    fnEncode.call(that, str).then(function(exportStr){
      that._exporter.setAttribute('href', exportStr);
      that._exporter.setAttribute('download', 'diagram.' + fileType);
      that._exporter.click();
    });
  }, function (e) {
    console.error(e);
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