
require('../../assets/font/css/pfdn-font-embedded.css');
require('../../assets/font/css/pfdn-font-ie7-codes.css');
require('./style.scss');

module.exports = {
  __depends__: [
    require('../draw/nodes'),
    require('../draw/links'),
    require('../features/zoom'),
    require('../features/backgroundColor')
  ]
};