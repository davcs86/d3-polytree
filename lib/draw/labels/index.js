module.exports = {
  __init__: ['labels'],
  labels: ['type', require('./Labels')],
  __depends__: [
    require('./../drawingRegistry')
  ]
};
