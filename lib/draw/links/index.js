module.exports = {
  __init__: ['links'],
  links: ['type', require('./Links')],
  __depends__: [
    require('./../drawingRegistry'),
    require('../nodes'),
    require('../markers'),
    require('../labels'),
  ]
};