'use strict';

/**
 * Creates a <defs> element
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Defs(canvas){
  var svg = canvas.getSVG();
  return svg.append('defs');
}

Defs.$inject = ['canvas'];

module.exports = Defs;