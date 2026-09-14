module.exports = {
  __init__: ['selection'],
  selection: ['type', require('./Selection')],
  __depends__: [
    require('./../mouseEvents')
  ]
};
