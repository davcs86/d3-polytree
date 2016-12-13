module.exports = {
  __init__: ['mouseEvents'],
  mouseEvents: ['type', require('./MouseEvents')],
  __depends__: [
    require('../../draw/nodes')
  ]
};
