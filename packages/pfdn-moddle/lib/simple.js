'use strict';

var assign = require('lodash/object').assign;

var PfdnModdle = require('./pfdn-moddle');

var packages = {
  pfdn: require('../resources/pfdn/json/pfdn.json'),
};

module.exports = function(additionalPackages, options) {
  return new PfdnModdle(assign({}, packages, additionalPackages), options);
};
