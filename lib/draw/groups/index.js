module.exports = {
  __init__: [ 'groups' ],
  groups: [ 'type', require('./Groups') ],
  __depends__: [
    require('../nodes')
  ]
};
