'use strict';

var Ids = require('ids'),
    pickBy = require('lodash/object').pickBy,
    isObject = require('lodash/lang').isObject;

/**
 * ElementRegistry description
 *
 * @class
 * @constructor
 */

function ElementRegistry() {
  this._ids = new Ids([8, 24, 86]);
}

module.exports = ElementRegistry;

ElementRegistry.prototype.claim = function(id, element) {
  this._ids.claim(id, element);
};

ElementRegistry.prototype.claimId = function(element, prefix) {
  element.id = element.id || this._ids.nextPrefixed(prefix + '_', element);
  this._ids.claim(element.id, element);
};

ElementRegistry.prototype.unClaim = function(element) {
  this._ids.unclaim(element.id);
};

ElementRegistry.prototype.removeElement = function(element) {
  this.unClaim(element);
};

ElementRegistry.prototype.removeElementById = function(id) {
  this.unClaim({id: id});
};

ElementRegistry.prototype.get = function(id){
  return this._ids._seed.get(id) || false;
};

ElementRegistry.prototype.getAll = function(){
  return pickBy(this._ids._seed.hats || {}, isObject);
};