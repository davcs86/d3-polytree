var Moddle = require('moddle');

var PfdnModdle = require('pfdn-moddle');

var metaModel = require('pfdn-moddle/resources/pfdn/json/pfdn');

var model = new Moddle({pfdn:metaModel});
var moddle = new PfdnModdle({pfdn:metaModel});

var taiga = model.create('pfdn:Diagram');

moddle.toXML(taiga, {}, function(){
  console.log(arguments);
});

module.export = PfdnModdle;