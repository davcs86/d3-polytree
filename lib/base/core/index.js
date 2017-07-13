module.exports = {
  __init__: [ 'canvas' ],
  canvas: [ 'type', require('./Canvas') ],
  elementRegistry: [ 'type', require('./ElementRegistry') ],
  elementBuilder: [ 'type', require('./ElementBuilder') ],
  eventBus: ['type', require('eventemitter3')]
};