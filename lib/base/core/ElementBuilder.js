'use strict';

/**
 * ElementBuilder description
 *
 * @class
 * @constructor
 *
 */

function ElementBuilder(elementRegistry) {
  this._elementRegistry = elementRegistry;
}

ElementBuilder.$inject = [
  'elementRegistry'
];

module.exports = ElementBuilder;

ElementBuilder.prototype.create = function(definition, prefix, builder, builderContext){
  if (prefix!=='') {
    this._elementRegistry.claimId(definition, prefix);
    builder.call(builderContext, definition);
  }
};