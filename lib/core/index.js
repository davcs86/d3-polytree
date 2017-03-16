require('./style.scss');

module.exports = {
  __depends__: [
    require('../draw/force'),
    require('../features/zoom'),
    require('../features/backgroundColor')
  ]
};