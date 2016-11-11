module.exports = {
  __init__: [ 'force' ],
  force: [ 'type', require('./Force') ],
  __depends__: [
    require('../nodes')
  ]
};