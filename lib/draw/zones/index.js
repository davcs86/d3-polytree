module.exports = {
  __init__: ['zones'],
  zones: ['type', require('./Zones')],
  __depends__: [
    require('../labels')
  ]
};
