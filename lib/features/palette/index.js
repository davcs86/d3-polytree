module.exports = {
  __init__: ['palette'],
  palette: ['type', require('./Palette')],
  __depends__: [
    require('../paletteProvider')
  ]
};
