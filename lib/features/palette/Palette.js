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

function Palette(canvas, paletteProvider) {

  this._canvas = canvas;
  this._paletteContainer = null;
  this._paletteProvider = paletteProvider;

  this._init();
}

Palette.$inject = [
  'canvas',
  'paletteProvider'
];

module.exports = Palette;

Palette.prototype._drawContainer = function () {
  var container = this._canvas.getContainer();

  this._paletteContainer = domify(Palette.HTML_MARKUP);

  container.insertBefore(this._paletteContainer, container.childNodes[0]);

  this._entriesContainer = domQuery('.pfdjs-entries', this._paletteContainer);

};

Palette.prototype._createDelegates = function(){
  var that = this;

  domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'click', function(event) {
    that.trigger('click', event);
  });

  // prevent drag propagation
  domEvent.bind(this._paletteContainer, 'mousedown', function(event) {
    event.stopPropagation();
  });

  // prevent drag propagation
  domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'dragstart', function(event) {
    that.trigger('dragstart', event);
  });

};

Palette.prototype.trigger = function(action, event) {
  var entries = this._actions,
    entry,
    handler,
    originalEvent,
    button = event.delegateTarget || event.target;

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

  // silence other actions
  event.preventDefault();
};

Palette.prototype._drawEntry = function(entry, id){

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

Palette.prototype._drawEntries = function() {
  var that = this,
    actions = this._actions = this._paletteProvider.getPaletteEntries();
  forIn(actions, function(action, id){
    that._drawEntry.call(that, action, id);
  });
};

Palette.prototype._update = function(){
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