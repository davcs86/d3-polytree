module.exports = {
  __init__: ['calculateCenter'],
  calculateCenter: ['type', require('./CalculateCenter')],
  __depends__: [
    //require('../defs')
  ]
};
