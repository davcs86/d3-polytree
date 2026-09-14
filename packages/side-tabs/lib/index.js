module.exports = {
  __init__: ['sideTabs', 'sideTabsProvider'],
  sideTabs: ['type', require('./SideTabs')],
  sideTabsProvider: ['type', require('./SideTabsProvider')],
  __depends__: [
    //''
  ]
};
