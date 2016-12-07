'use strict';

function Defs(canvas){
  var svg = canvas.getSVG();
  return svg.append('defs');
}

Defs.$inject = ['canvas'];

module.exports = Defs;