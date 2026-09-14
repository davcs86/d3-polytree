module.exports = {
  __init__: ['modelling'],
  modelling: ['type', require('./Modelling')],
  __depends__: [
    require('./elements/labels'),
    require('./elements/links'),
    require('./elements/nodes'),
    require('./elements/zones'),
    require('../../draw/nodes')
  ]
};

