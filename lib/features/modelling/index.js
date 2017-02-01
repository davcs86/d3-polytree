module.exports = {
  __init__: ['modelling'],
  modelling: ['type', require('./Modelling')],
  addNodeAction: ['type', require('./cmd/AddNodeAction')],
  __depends__: [
    require('../../draw/nodes')
  ]
};

