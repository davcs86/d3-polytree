'use strict';

var cloneDeep = require('lodash/lang').cloneDeep
//   forIn = require('lodash/object').forIn,
//   forEach = require('lodash/collection').forEach,
//   isUndefined = require('lodash/lang').isUndefined
;

/**
 * The groups processing module.
 *
 * @class
 * @constructor
 *
 * @param {Object} groupsDict
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 */
function Groups(groupsDict, canvas, eventBus) {
  this._groups = cloneDeep(groupsDict);
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._init();
}

Groups.$inject = [
  'd3polytree.groups', 'canvas', 'eventBus'
];

module.exports = Groups;

Groups.prototype._init = function(){

};