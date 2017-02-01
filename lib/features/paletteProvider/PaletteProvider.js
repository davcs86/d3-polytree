'use strict';

var d3 = require('d3');

/**
 * PaletteProvider description
 *
 * @class
 * @constructor
 *
 * @param {EventEmitter} eventBus
 */

function PaletteProvider(d3polytree,
                         eventBus,
                         elementRegistry,
                         localStorage,
                         uploader,
                         exporting,
                         axes,
                         selection,
                         addNodeHandler,
                         drag) {

  this._d3polytree = d3polytree;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._localStorage = localStorage;
  this._uploader = uploader;
  this._exporting = exporting;
  this._axes = axes;
  this._selection = selection;
  this._addNodeHandler = addNodeHandler;
  this._drag = drag;

}

PaletteProvider.$inject = [
  'd3polytree',
  'eventBus',
  'elementRegistry',
  'localStorage',
  'upload',
  'exporting',
  'axes',
  'selection',
  'addNodeHandler',
  'drag'
];

module.exports = PaletteProvider;

PaletteProvider.prototype.getPaletteEntries = function () {
  var that = this,
    actions = {
      'new': {
        title: 'New diagram',
        group: 'file-ops',
        iconClassName: 'icon-doc',
        action: {
          click: function () {
            that._d3polytree.createDiagram();
          }
        },
      },
      'save': {
        title: 'Save diagram',
        group: 'file-ops',
        iconClassName: 'icon-floppy',
        action: {
          click: function () {
            that._localStorage.save();
          }
        }
      },
      'open': {
        title: 'Open diagram',
        group: 'file-ops',
        iconClassName: 'icon-folder-open-empty',
        action: {
          click: function () {
            that._uploader.openDialog();
          }
        },
      },
      'download': {
        title: 'Download diagram',
        group: 'file-ops',
        iconClassName: 'icon-download',
        action: {
          click: function () {
            that._exporting.trigger('xml');
          }
        },
      },
      'export-svg': {
        title: 'Download as SVG image',
        group: 'file-ops',
        iconClassName: 'icon-image',
        action: {
          click: function () {
            that._exporting.trigger('svg');
          }
        },
      },
      'search': {
        title: 'Search item',
        group: 'utils',
        iconClassName: 'icon-glass',
        action: {
          click: function () {
            console.log('click button');
          },
          dragstart: function () {
            console.log('drag button');
          },
        },
      },
      'delete-item': {
        title: 'Delete selected item(s)',
        group: 'utils',
        iconClassName: 'icon-trash',
        action: {
          click: function () {
            that._selection.deleteSelected();
          }
        },
      },
      'toggle-grid': {
        title: 'Show/hide grid',
        group: 'utils',
        iconClassName: 'icon-grid',
        action: {
          click: function () {
            that._axes.toggleVisible();
          }
        },
      },
      'new-connection': {
        title: 'New connection',
        group: 'drawing',
        iconClassName: 'icon-arrow',
        action: {
          click: function () {
            console.log('click button');
          }
        },
      },
      'new-label': {
        title: 'New label',
        group: 'drawing',
        iconClassName: 'icon-text',
        action: {
          click: function () {
            console.log('click button');
          },
          dragstart: function () {
            console.log('drag button');
          },
        },
      },
      'new-node': {
        title: 'New node',
        group: 'drawing',
        iconClassName: 'icon-check-empty',
        action: {
          dragstart: function (evt) {
            that._addNodeHandler.addNode({x: evt.lastPosition.x, y: evt.lastPosition.y});
          },
          drag: function (evt) {
            that._addNodeHandler.moveNodes(evt.delta);
          },
          dragend: function (evt) {
            that._addNodeHandler.moveNodes(evt.delta);
          }
        },
      },
      'settings': {
        title: 'Settings',
        group: 'settings',
        iconClassName: 'icon-cog-outline',
        action: {
          click: function () {
            console.log('click button');
          },
          dragstart: function () {
            console.log('drag button');
          },
        },
      }
    };

  return actions;
};