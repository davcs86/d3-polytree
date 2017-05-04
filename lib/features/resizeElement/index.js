module.exports = {
  __init__: ['resizeElement'],
  resizeElement: ['type', require('./ResizeElement')],
  __depends__: [
    require('../outline')
  ]
};
