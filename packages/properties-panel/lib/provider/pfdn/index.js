module.exports = {
  __init__: [ 'propertiesProvider' ],
  propertiesProvider: [ 'type', require('./PfdnPropertiesProvider') ],
  __depends__: [
    require('../../entryFactory')
  ]
};