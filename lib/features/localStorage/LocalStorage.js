'use strict';

var ls = require('local-storage'),
    _done = false;

/**
 * LocalStorage description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 * @param d3polytree
 * @param notifications
 */

function LocalStorage(eventBus, d3polytree, notifications) {
  
  this._eventBus = eventBus;
  this._d3polytree = d3polytree;
  this._notifications = notifications;

  this._init();
}

LocalStorage.$inject = [
  'eventBus',
  'd3polytree',
  'notifications'
];

module.exports = LocalStorage;

LocalStorage.prototype.loadSaved = function () {
  if (_done) {
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

LocalStorage.prototype._init = function () {
  var that = this;
  this._eventBus.once('diagram.ready', function () {
    that.loadSaved.call(that);
  });
};

LocalStorage.prototype.save = function () {
  var that = this;
  this._d3polytree.exportDiagram()
    .then(function (diagram) {
      ls('diagram', diagram);
      that._notifications.success({title: 'Sucess', text: 'Diagram saved'});
    });
};
