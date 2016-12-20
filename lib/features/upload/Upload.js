'use strict';

var domify = require('min-dom/lib/domify'),
  assign = require('lodash/object').assign,
  domEvent = require('min-dom/lib/event')
  ;

/**
 * Upload description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function Upload(canvas, d3polytree) {

  this._canvas = canvas;
  this._d3polytree = d3polytree;

  this._init();
}

Upload.$inject = [
  'canvas',
  'd3polytree'
];

module.exports = Upload;

Upload.prototype._init = function () {
  var that = this,
    container = this._canvas.getContainer();

  this._fileInput = domify('<input type="file" />');

  assign(this._fileInput.style, {
    width: 1,
    height: 1,
    display: 'none',
    overflow: 'hidden'
  });

  container.insertBefore(this._fileInput, container.childNodes[0]);

  domEvent.bind(this._fileInput, 'change', function(e) {
    that._openFile(e.target.files[0], that._openDiagram, that);
  });

};

Upload.prototype.openDialog = function() {
  this._fileInput.click();
};

Upload.prototype._openDiagram = function(diagram){
  this._d3polytree.importDiagram(diagram);
};

Upload.prototype._openFile = function(file, callback, context){
  // check file api availability
  if (!window.FileReader) {
    return window.alert(
      'Looks like you use an older browser that does not support upload. ' +
      'Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.');
  }

  // no file chosen
  if (!file) {
    return;
  }

  var reader = new FileReader();

  reader.onload = function(e) {
    var xml = e.target.result;
    callback.call(context, xml);
  };

  reader.readAsText(file);
};