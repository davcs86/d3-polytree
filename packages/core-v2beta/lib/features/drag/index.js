module.exports = {
  __init__: ['drag'],
  drag: ['type', require('./Drag')],
  __depends__: [
    require('../outline'),
    require('../selection')
  ]
};
