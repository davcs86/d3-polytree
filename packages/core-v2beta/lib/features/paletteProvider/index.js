module.exports = {
  __init__: ['paletteProvider'],
  paletteProvider: ['type', require('./PaletteProvider')],
  __depends__: [
    require('./handlers/addNodeHandler'),
    require('./handlers/addLabelHandler'),
    require('./handlers/addLinkTool')
  ]
};
