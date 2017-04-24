'use strict';

var valuesIn = require('lodash/object').valuesIn;

/**
 * DrawingRegistry description
 *
 * @class
 * @constructor
 */

function DrawingRegistry() {
  this._drawings = {};
}

module.exports = DrawingRegistry;

DrawingRegistry.prototype.set = function(id, drawing) {
  this._drawings[id] = drawing;
};

DrawingRegistry.prototype.remove = function(id) {
  delete this._drawings[id];
};

DrawingRegistry.prototype.get = function(id){
  return this._drawings[id] || false;
};

DrawingRegistry.prototype.getAll = function(){
  return valuesIn(this._drawings);
};