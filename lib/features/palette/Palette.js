'use strict';

var isFunction = require('lodash/lang').isFunction,
  forIn = require('lodash/object').forIn,
  domify = require('min-dom/lib/domify'),
  domQuery = require('min-dom/lib/query'),
  domAttr = require('min-dom/lib/attr'),
  domClear = require('min-dom/lib/clear'),
  domClasses = require('min-dom/lib/classes'),
  domDelegate = require('min-dom/lib/delegate'),
  domEvent = require('min-dom/lib/event')
;

require('../../../assets/font/css/pfdn-font-embedded.css');
require('../../../assets/font/css/pfdn-font-ie7-codes.css');
require('./style');

/**
 * Palette description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Palette(canvas, selection, paletteProvider) {
  
  this._canvas = canvas;
  this._selection = selection;
  this._paletteContainer = null;
  this._paletteProvider = paletteProvider;
  
  this._init();
}

Palette.$inject = [
  'canvas',
  'selection',
  'paletteProvider'
];

module.exports = Palette;

Palette.prototype._drawContainer = function () {
  var container = this._canvas.getContainer();
  
  this._paletteContainer = domify(Palette.HTML_MARKUP);
  
  container.insertBefore(this._paletteContainer, container.childNodes[0]);
  
  this._entriesContainer = domQuery('.pfdjs-entries', this._paletteContainer);
  
};

Palette.prototype._deactivateTools = function () {
  var tools = this._tools = this._paletteProvider.getPaletteTools();
  forIn(this._tools, function(v){
    v.deactivate.call(v);
  });
};

Palette.prototype._createDelegates = function () {
  var that = this;
  
  domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'click', function (event) {
    that.trigger('click', event);
    event.stopImmediatePropagation();
  });
  
  // // prevent drag propagation
  domEvent.bind(this._paletteContainer, 'mousedown', function(event) {
    that._deactivateTools();
  });
  //
  // // prevent drag propagation
  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'dragstart', function(event) {
  //   var rects = event.delegateTarget.getBoundingClientRect();
  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
  //   event.delta = {x: 0, y: 0};
  //
  //   that.trigger('dragstart', event);
  // });
  //
  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'dragend', function(event) {
  //   var rects = {left: event.pageX, top: event.pageY};
  //   event.delta = {x: rects.left - lastPosition.x, y: rects.top - lastPosition.y};
  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
  //
  //   that.trigger('dragend', event);
  // });
  //
  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'drag', function(event) {
  //   var rects = {left: event.pageX, top: event.pageY};
  //   event.delta = {x: rects.left - lastPosition.x, y: rects.top - lastPosition.y};
  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
  //
  //   that.trigger('drag', event);
  // });
  
};

Palette.prototype.trigger = function (action, event) {
  var entries = this._actions,
    entry,
    handler,
    originalEvent,
    button = event.delegateTarget || event.target;
  
  this._deactivateTools();
  
  if (!button) {
    return event.preventDefault();
  }
  
  entry = entries[domAttr(button, 'data-action')];
  
  // when user clicks on the palette and not on an action
  if (!entry) {
    return;
  }
  
  handler = entry.action;
  
  originalEvent = event.originalEvent || event;
  
  // simple action (via callback function)
  if (isFunction(handler)) {
    if (action === 'click') {
      handler(originalEvent);
    }
  } else {
    if (handler[action]) {
      handler[action](originalEvent);
    }
  }
  
  // if was click or drag finished, silence other actions
  if (action === 'click' || action === 'dragend') {
    event.preventDefault();
  }
};

Palette.prototype._drawEntry = function (entry, id) {
  
  var grouping = entry.group || 'default';
  
  var container = domQuery('[data-group=' + grouping + ']', this._entriesContainer);
  if (!container) {
    container = domify('<div class="pfdjs-entries-group" data-group="' + grouping + '"></div>');
    this._entriesContainer.appendChild(container);
  }
  var html = entry.html || '<div class="pfdjs-entry"></div>';
  
  var control = domify(html);
  container.appendChild(control);
  
  domAttr(control, 'data-action', id);
  
  if (entry.title) {
    domAttr(control, 'title', entry.title);
  }
  
  if (entry.className) {
    domClasses(control).add(entry.className);
  }
  
  if (entry.iconClassName) {
    control.appendChild(domify('<span class="' + entry.iconClassName + '"/>'));
  }
  
};

Palette.prototype._drawEntries = function () {
  var that = this,
    actions = this._actions = this._paletteProvider.getPaletteEntries();
  forIn(actions, function (action, id) {
    that._drawEntry.call(that, action, id);
  });
};

Palette.prototype._update = function () {
  if (this._paletteEntries) {
    domClear(this._paletteEntries);
  }
  this._drawEntries();
};

Palette.prototype._init = function () {
  this._drawContainer();
  this._update();
  this._createDelegates();
};

/* markup definition */

Palette.HTML_MARKUP =
  '<div class="pfdjs-palette">' +
  '  <div class="pfdjs-entries">' +
  '  </div>' +
  '</div>';