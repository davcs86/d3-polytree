module.exports = {
  __init__: [ 'iconLoader' ],
  iconLoader: [ 'type', require('./IconLoader') ],
  __depends__: [
    require('../icons'),
    require('../../utils/defs')
  ]
};