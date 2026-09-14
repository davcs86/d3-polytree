module.exports = {
  __init__: ['addNodeHandler'],
  addNodeHandler: ['type', require('./AddNodeHandler')],
  __depends__: [
    require('../../../../utils/calculateCenter')
  ]
};
