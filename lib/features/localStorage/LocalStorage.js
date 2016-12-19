'use strict';

var ls = require('local-storage'),
  _done = false;

/**
 * LocalStorage description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function LocalStorage(eventBus, d3polytree) {

  this._eventBus = eventBus;
  this._d3polytree = d3polytree;

  this._init();
}

LocalStorage.$inject = [
  'eventBus',
  'd3polytree'
];

module.exports = LocalStorage;

LocalStorage.prototype.loadSaved = function () {
  if (_done){
    return;
  } else {
    _done = true;
  }
  var diagram = ls('diagram');
  if (!diagram) {
    diagram = this._d3polytree.initialDiagram;
  }
  this._d3polytree.importDiagram(diagram);
};

LocalStorage.prototype._init = function(){
  this._eventBus.once('diagram.ready', this.loadSaved, this);
};

LocalStorage.prototype.save = function () {
  this._d3polytree.exportDiagram()
    .then(function(diagram){
      ls('diagram', diagram);
    });
};
