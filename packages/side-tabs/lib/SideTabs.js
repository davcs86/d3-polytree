'use strict';

var forEach = require('lodash/collection').forEach,
    isFunction = require('lodash/lang').isFunction,
    isUndefined = require('lodash/lang').isUndefined,
    toSafeInteger = require('lodash/lang').toSafeInteger,
    domify = require('min-dom/lib/domify'),
    domQuery = require('min-dom/lib/query'),
    domAttr = require('min-dom/lib/attr'),
    domClear = require('min-dom/lib/clear'),
    domClasses = require('min-dom/lib/classes'),
    domDelegate = require('min-dom/lib/delegate')
;

require('./style.scss');

function SideTabs(canvas, sideTabsProvider, eventBus) {
  this._canvas = canvas;
  this._sideTabsProvider = sideTabsProvider;
  this._eventBus = eventBus;
  this._init();
}

SideTabs.$inject = [
  'canvas',
  'sideTabsProvider',
  'eventBus'
];


SideTabs.prototype._init = function () {
  var that = this;
  this._drawContainer();
  this._update();
  this._eventBus.on('sidetab.registered', function () {
    that._update();
  });
  this._createDelegates();
};

SideTabs.prototype._createDelegates = function () {
  // create delegates
  var that = this;

  domDelegate.bind(this._sidetabsEntries, '.pfdjs-st-tab', 'click', function (event) {
    that.trigger('click', event);
    event.stopImmediatePropagation();
  });

  domDelegate.bind(this._sidetabsContents, '.icon-cancel', 'click', function (event) {
    that.trigger('close', event);
    event.stopImmediatePropagation();
  });

};

SideTabs.prototype._readjustTabs = function(id) {
  var that = this;
  if (isUndefined(id)){
    id = null;
    domClasses(this._sidetabsContainer).remove('open');
  } else {
    id = toSafeInteger(id);
    domClasses(this._sidetabsContainer).add('open');
  }
  forEach(this._actions, function (action, n) {
    var tab = domQuery('[data-action="' + n + '"]', that._sidetabsEntries);
    var content = domQuery('.pfdjs-st-content[data-action="' + n + '"]', that._sidetabsContents);
    if (n === id) {
      domClasses(tab).add('active');
      domClasses(content).remove('hidden');
    } else {
      domClasses(tab).remove('active');
      domClasses(content).add('hidden');
    }
  });
};

SideTabs.prototype.trigger = function (action, event, targetId) {
  var entries = this._actions,
      entry,
      handler,
      content,
      button = event ? (event.delegateTarget || event.target) : false;

  if (!button && action !== 'created') {
    return event.preventDefault();
  }

  var id = button ? domAttr(button, 'data-action') : targetId;

  entry = entries[id];

  if (!entry) {
    return;
  }

  if (action === 'click'){
    this._readjustTabs(id);
  } else if (action === 'close'){
    this._readjustTabs();
  }

  handler = entry.action;

  content = domQuery('.pfdjs-st-content[data-action="' + id + '"] > .content-body', this._sidetabsContents);

  // simple action (via callback function)
  if (isFunction(handler)) {
    if (action === 'click') {
      handler(content);
    }
  } else {
    if (handler[action]) {
      handler[action](content);
    }
  }

};

SideTabs.prototype._drawContainer = function () {
  var container = this._canvas.getContainer();

  this._sidetabsContainer = domify(SideTabs.HTML_MARKUP);

  container.insertBefore(this._sidetabsContainer, container.childNodes[0]);

  this._sidetabsEntries = domQuery('.pfdjs-st-tabs', this._sidetabsContainer);
  this._sidetabsContents = domQuery('.pfdjs-st-contents', this._sidetabsContainer);
};

SideTabs.prototype._drawEntry = function (entry, id) {

  // draw tab

  var control = domify('<div class="pfdjs-st-tab"></div>');
  this._sidetabsEntries.appendChild(control);

  domAttr(control, 'data-action', id);

  if (entry.title) {
    domAttr(control, 'title', entry.title);
  }

  if (entry.iconClassName) {
    control.appendChild(domify('<span class="' + entry.iconClassName + '"/>'));
  }

  // draw container
  control = domify('<div class="pfdjs-st-content hidden">' +
    '  <div class="content-title">' +
    '    <span class="content-title-span">' + entry.title + '</span>' +
    '    <span class="icon-cancel" title="Close"></span>' +
    '    <span>&nbsp;</span>' +
    '  </div>' +
    '  <div class="content-body" ></div>' +
    '</div>');
  this._sidetabsContents.appendChild(control);

  domAttr(control, 'data-action', id);

  // close button
  control = domQuery('.icon-cancel', control);
  domAttr(control, 'data-action', id);

  this.trigger('created', null, id);

};

SideTabs.prototype._drawEntries = function () {
  var that = this,
      actions = this._actions = this._sideTabsProvider.getSideTabsEntries();
  forEach(actions, function (action, n) {
    that._drawEntry.call(that, action, n);
  });
};

SideTabs.prototype._update = function () {
  if (this._sidetabsEntries) {
    domClear(this._sidetabsEntries);
    domClear(this._sidetabsContents);
  }
  this._drawEntries();
};

/* markup definition */

SideTabs.HTML_MARKUP =
  '<div class="pfdjs-st-container">' +
  '  <div class="pfdjs-st-tabs">' +
  '  </div>' +
  '  <div class="pfdjs-st-contents">' +
  '  </div>' +
  '</div>';

module.exports = SideTabs;