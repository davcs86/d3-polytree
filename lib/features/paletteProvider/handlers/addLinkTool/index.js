module.exports = {
  __init__: ['addLinkTool'],
  addLinkTool: ['type', require('./AddLinkTool')],
  __depends__: [
    require('../../../../utils/calculateCenter')
  ]
};
