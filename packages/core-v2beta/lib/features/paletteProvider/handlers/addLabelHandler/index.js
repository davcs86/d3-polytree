module.exports = {
  __init__: ['addLabelHandler'],
  addLabelHandler: ['type', require('./AddLabelHandler')],
  __depends__: [
    require('../../../../utils/calculateCenter')
  ]
};
