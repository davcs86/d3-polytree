module.exports = {
  __init__: [ 'links' ],
  links: [ 'type', require('./Links') ],
  __depends__: [
    require('../nodes'),
    require('../markers')
  ]
};