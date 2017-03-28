module.exports = {
  __init__: ['zoom'],
  zoom: ['type', require('./Zoom')],
  __depends__: [
    require('../../utils/calculateCenter')
  ]
};