'use strict';

var isUndefined = require('lodash/lang').isUndefined;

function SideTabsProvider(eventBus){
  this._registeredSideTabs = [];
  this._eventBus = eventBus;
  this._init();
}

SideTabsProvider.$inject = [
  'eventBus'
];

SideTabsProvider.prototype._init = function(){
  this._setDefaultTabs();
};

SideTabsProvider.prototype._setDefaultTabs = function(){
  this._registeredSideTabs = [];
};

SideTabsProvider.prototype.registerSideTab = function(sideTab, index){
  if (isUndefined(index)){
    this._registeredSideTabs.push(sideTab);
  } else {
    this._registeredSideTabs.splice(index, 0, sideTab);
  }
  this._eventBus.emit('sidetab.registered', sideTab);
};

SideTabsProvider.prototype.getSideTabsEntries = function(){
  return this._registeredSideTabs;
};

module.exports = SideTabsProvider;