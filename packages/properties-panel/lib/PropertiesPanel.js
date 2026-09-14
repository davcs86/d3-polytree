'use strict';

var forEach = require('lodash/collection').forEach,
    forIn = require('lodash/object').forIn,
    debounce = require('lodash/function').debounce,
    _set = require('lodash/object').set,
    _get = require('lodash/object').get,
    domify = require('min-dom/lib/domify'),
    domQuery = require('min-dom/lib/query'),
    domAttr = require('min-dom/lib/attr'),
    domClear = require('min-dom/lib/clear'),
    scrollTabs = require('scroll-tabs'),
    domClasses = require('min-dom/lib/classes'),
    domDelegate = require('min-dom/lib/delegate'),
    $ = require('jquery')
    ;

require('./style/style.scss');

function PropertiesPanel(sideTabsProvider, eventBus, propertiesProvider, diagramSettings) {
  this._sideTabsProvider = sideTabsProvider;
  this._eventBus = eventBus;
  this._propertiesProvider = propertiesProvider;
  this._diagramSettings = diagramSettings;

  this._entries = {};
  this._init();
}

PropertiesPanel.$inject = [
  'sideTabsProvider',
  'eventBus',
  'propertiesProvider',
  'd3polytree.definitions.settings'
];

module.exports = PropertiesPanel;

PropertiesPanel.prototype._init = function(){
  this._registerSideTab();
  this._registerSelectionListener();
};


PropertiesPanel.prototype._handleChange = function(event){
  var entryId = $(event.delegateTarget).attr('name') || event.propertyId,
      newVal = $(event.delegateTarget).val() || _get(event.definition, event.propertyId) ,
      entry = this._entries[entryId];
  if (entry){
    var scope = entry.scope,
        props = {};
    _set(props, entryId, newVal);
    scope.set.call(scope, entry.definition, props);
    // update the drawing
    this._propertiesProvider.updateDrawing(entry.definition);
  }
};

PropertiesPanel.prototype._registerInputChangeHandlers = function(){
  var that = this;
  // debounce update only elements that are target of key events,
  // i.e. INPUT and TEXTAREA. SELECTs will trigger an immediate update anyway.
  domDelegate.bind(this._scrolltabsContainer, 'input, textarea', 'input', debounce(function(){
    that._handleChange.apply(that, arguments);
  }, 300));
  // domDelegate.bind(container, 'input, textarea, select', 'change', handleChange);
  domDelegate.bind(this._scrolltabsContainer, 'input, textarea, select', 'change', function(){
    that._handleChange.apply(that, arguments);
  });
  this._eventBus.on('PropertiesPanel.propertyChanged', function(propertyId, definition){
    that._handleChange.call(that, {definition: definition, propertyId: propertyId});
  });
};

PropertiesPanel.prototype._registerSelectionListener = function(){
  var that = this;
  this._eventBus.on('selection.changed', function(oldSelection, newSelection){
    var selected = that._diagramSettings;
    if (newSelection.length === 1 && (oldSelection.length !== 1 || oldSelection[0].definition.id !== newSelection[0].definition.id)){
      selected = newSelection[0].definition;
    }
    that._update(selected);
  });
};

PropertiesPanel.prototype._registerSideTab = function(){
  var that = this;
  this._sideTabsProvider.
    registerSideTab({
      title: 'Properties',
      iconClassName: 'icon-sliders',
      action: {
        created: function (content) {
          that._drawPanel(content);
        }//,
        // click: function () {
        //   console.log('that._reIndexItems();', arguments);
        // },
        // close: function () {
        //   console.log('search panel close');
        // }
      },
    }, 1);
};

PropertiesPanel.prototype._selectTab = function(tabId){
  var allTabs = domQuery.all('.tab-sheet', this._scrolltabsTabs);
  forEach(allTabs, function(t){
    domClasses(t).remove('tab-sheet-active');
  });
  var activeTab = domQuery('[data-tab-target="' + tabId + '"]', this._scrolltabsTabs);
  domClasses(activeTab).add('tab-sheet-active');

  var allContents = domQuery.all('.pfdjs-pp-content', this._scrolltabsContents);
  forEach(allContents, function(t){
    domClasses(t).remove('open');
  });
  var activeContent = domQuery('[data-tab-target="' + tabId + '"]', this._scrolltabsContents);
  domClasses(activeContent).add('open');
};

PropertiesPanel.prototype._drawPanel = function(content){
  //
  this._drawContainer(content);
  this._update(this._diagramSettings);
};

PropertiesPanel.prototype._drawContainer = function(content){
  //
  var that = this;
  this._scrolltabsContainer = domify(PropertiesPanel.HTML_MARKUP);

  content.insertBefore(this._scrolltabsContainer, content.childNodes[0]);

  this._scrolltabsEntries = domQuery('.pfdjs-pp-tabs', this._scrolltabsContainer);
  this._scrolltabsTabs = domQuery('.tab-sheets', this._scrolltabsEntries);
  this._scrolltabsContents = domQuery('.pfdjs-pp-contents', this._scrolltabsContainer);

  domDelegate.bind(this._scrolltabsContainer, '.tab-sheet', 'click', function (event) {
    var tabId = domAttr(event.delegateTarget, 'data-tab-target');
    that._selectTab(tabId);
    event.stopImmediatePropagation();
  });
  this._registerInputChangeHandlers();

};

PropertiesPanel.prototype._update = function(definition){
  //
  if (this._scrolltabsEntries) {
    domClear(this._scrolltabsTabs);
    domClear(this._scrolltabsContents);
  }
  if (definition) {
    this._drawEntries(definition);
  }
};

PropertiesPanel.prototype._drawEntries = function(definition){
  var that = this,
      tabs = this._propertiesProvider.getTabs(definition),
      tabs2 = [];

  this._entries = [];
  // create the tabs
  forEach(tabs, function(t){
    var tabHasContent = false;
    var content = domify('<div class="pfdjs-pp-content" data-tab-target="'+t.id+'"></div>');
    // create the groups
    forEach(t.groups, function(g){
      var groupHasContent = g.entries.length > 0;
      var groupContent = domify('<div class="pfdjs-pp-content-group" data-group-target="'+g.id+'">' +
        '<div class="tab-content-group-title">' + g.label + '</div>' +
        '</div>');
      // create the entries
      forEach(g.entries, function(e){
        var entryContent = domify('<div>'+e.html+'</div>');
        groupContent.appendChild(entryContent);
        that._entries[e.id] ={
          scope: e,
          definition: definition,
          formNode: entryContent
        };
      });
      if (groupHasContent){
        content.appendChild(groupContent);
        tabHasContent = true;
      }
    });
    if (tabHasContent){
      that._scrolltabsContents.appendChild(content);
      tabs2.push(t);
    }
  });
  // fill entries
  forIn(this._entries, function(e){
    e.scope.get.call(e.scope, e.definition, e.formNode);
  });
  // draw the tabs
  var firstTab = null;
  forEach(tabs2, function(t){
    if (!firstTab){
      firstTab = t.id;
    }
    var tab = domify('<li class="tab-sheet" data-tab-target="'+t.id+'">'+
      '<a href="#">'+t.label+'</a>'+
      '</li>');
    that._scrolltabsTabs.appendChild(tab);
  });
  if (this._scTabs){
    // destroy the previous event listeners
    this._scTabs.removeAllListeners();
  }
  this._scTabs = new scrollTabs(
    this._scrolltabsEntries,
    {
      selectors: {
        tabsContainer: '.tab-sheets',
        tab: '.tab-sheet',
        ignore: '.tab-sheet-ignore',
        active: '.tab-sheet-active'
      }
    }
  );

  this._scTabs.on('scroll', function(newActiveTab){
    var tabId = domAttr(newActiveTab, 'data-tab-target');
    that._selectTab(tabId);
  });

  this._selectTab(firstTab);

};

/* markup definition */

PropertiesPanel.HTML_MARKUP =
  '<div id="pfdjs-pp-container">' +
  '  <div class="pfdjs-pp-tabs">' +
  '    <ul class="tab-sheets"></ul>' +
  '  </div>' +
  '  <div class="pfdjs-pp-contents">' +
  '  </div>' +
  '</div>';