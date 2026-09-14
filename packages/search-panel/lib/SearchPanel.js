'use strict';

var domClear = require('min-dom/lib/clear'),
    domify = require('min-dom/lib/domify'),
    domDelegate = require('min-dom/lib/delegate'),
    domAttr = require('min-dom/lib/attr'),
    List = require('list.js')
;

require('./style.scss');

function SearchPanel(sideTabsProvider, eventBus){
  this._sideTabsProvider = sideTabsProvider;
  this._eventBus = eventBus;
  //this._elementsList = [];
  this._form = null;
  this._list = null;
  this._init();
}

SearchPanel.$inject = [
  'sideTabsProvider',
  'eventBus'
];

SearchPanel.prototype.addOrUpdateItem = function(values){
  if (this._list) {
    if (values && values.name !== '') {
      var item = this._list.get('id', values.id)[0];
      if (item) {
        // update
        item.values(values);
      } else {
        // add
        this._list.add(values);
      }

    }
  }
};

SearchPanel.prototype._init = function(){
  var that = this;
  this._registerSideTab();
  this._eventBus.on('node.created', function(element, definition){
    that.addOrUpdateItem({
      'id': definition.id,
      'name': definition.label ? definition.label.text: '',
      'elementType': 'Node',
      'elementSubType': definition.type,
      '__element': element,
      '__definition': definition
    });
  });
  this._eventBus.on('link.created', function(element, definition){
    that.addOrUpdateItem({
      'id': definition.id,
      'name': definition.label ? definition.label.text: '',
      'elementType': 'Connection',
      'elementSubType': '',
      '__element': element,
      '__definition': definition
    });
  });
  this._eventBus.on('node.deleted', function(element, definition){
    if (that._list) {
      that._list.remove('id', definition.id);
    }
  });
  this._eventBus.on('link.deleted', function(element, definition){
    if (that._list) {
      that._list.remove('id', definition.id);
    }
  });
};

SearchPanel.prototype._drawForm = function(content){
  var that = this;
  domClear(content);
  this._form = domify(SearchPanel.HTML_MARKUP);
  content.appendChild(this._form);
  var options = {
    indexAsync: true,
    valueNames: [
      'name',
      'elementType',
      'elementSubType',
      '__element',
      '__definition',
      { data: ['id'] },
    ],
    item: '<li data-id="true">' +
      '<h3 class="name"></h3>' +
      '<p><span class="elementType"></span>' +
      '&nbsp;&nbsp;<span class="elementSubType"></span></p>' +
      '</li>'
  };
  this._list = new List(this._form, options);
  this._list.alphabet = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvXxYyZz0123456789';
  domDelegate.bind(this._form, 'li', 'click', function (event) {
    var itemId = domAttr(event.delegateTarget, 'data-id');
    var item = that._list.get('id', itemId)[0];
    if (item) {
      var itemValues = item.values();
      that._eventBus.emit('zoom.to.element', itemValues.__element, itemValues.__definition);
      var clickEventName = itemValues.__definition.$descriptor.ns.localName.toLowerCase()+'.click';
      that._eventBus.emit(clickEventName, itemValues.__element, itemValues.__definition, null);
    }
    event.stopImmediatePropagation();
  });
};

SearchPanel.prototype._registerSideTab = function(){
  var that = this;
  this._sideTabsProvider.
    registerSideTab({
      title: 'Search element',
      iconClassName: 'icon-glass',
      action: {
        created: function (content) {
          that._drawForm(content);
        },
        click: function () {
          if (that._list) {
            that._list.sort('name', {order: 'asc'});
          }
        },
        // close: function () {
        //   console.log('search panel close');
        // }
      },
    }, 0);
};

/* markup definition */

SearchPanel.HTML_MARKUP =
  '<div id="pfdjs-searchpanel">' +
  '  <input class="search" placeholder="Search" />' +
  '  <ul class="list"></ul>' +
  '</div>';

module.exports = SearchPanel;