module.exports = {
  __init__: [ 'markers' ],
  markers: [ 'type', require('./Markers') ],
  __depends__: [
    require('../../utils/defs')
  ]
};