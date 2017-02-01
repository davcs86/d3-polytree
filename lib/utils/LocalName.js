'use strict';

/**
 * Returns localName of a descriptor
 */

module.exports = function(elemDefinition){
  return elemDefinition.$descriptor.ns.localName.toLowerCase();
};