module.exports = {
  __init__: [ 'nodes' ],
  nodes: [ 'type', require('./Nodes') ],
  __depends__: [
    require('../iconLoader')
  ]
};