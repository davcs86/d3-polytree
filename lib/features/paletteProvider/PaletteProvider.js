'use strict';

/**
 * PaletteProvider description
 *
 * @class
 * @constructor
 *
 * @param d3polytree
 * @param {EventEmitter} eventBus
 * @param elementRegistry
 * @param localStorage
 * @param uploader
 * @param exporting
 * @param axes
 * @param selection
 * @param addNodeHandler
 * @param addLabelHandler
 * @param addLinkTool
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
                         addLabelHandler,
                         addLinkTool) {
  
  this._d3polytree = d3polytree;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._localStorage = localStorage;
  this._uploader = uploader;
  this._exporting = exporting;
  this._axes = axes;
  this._selection = selection;
  this._addNodeHandler = addNodeHandler;
  this._addLabelHandler = addLabelHandler;
  this._tools = {
    "addLinkTool": addLinkTool
  };
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
  'addLabelHandler',
  'addLinkTool'
];

module.exports = PaletteProvider;

PaletteProvider.prototype.getPaletteTools = function () {
  return this._tools;
};

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
            that._exporting.trigger('pfdn');
          }
        },
      },
      'export-svg': {
        title: 'Download as SVG image',
        group: 'file-export',
        iconClassName: 'icon-file-code',
        action: {
          click: function () {
            that._exporting.trigger('svg');
          }
        },
      },
      'export-png': {
        title: 'Download as PNG image',
        group: 'file-export',
        iconClassName: 'icon-image',
        action: {
          click: function () {
            that._exporting.trigger('png');
          }
        },
      },
      // 'search': {
      //   title: 'Search item',
      //   group: 'utils',
      //   iconClassName: 'icon-glass',
      //   action: {
      //     click: function () {
      //       console.log('click button');
      //     }
      //   },
      // },
      'new-connection': {
        title: 'New connection',
        group: 'drawing',
        iconClassName: 'icon-arrow',
        action: {
          click: function () {
            that._tools.addLinkTool.activate();
          }
        },
      },
      'new-label': {
        title: 'New label',
        group: 'drawing',
        iconClassName: 'icon-text',
        action: {
          click: function () {
            that._addLabelHandler.append();
          }
        },
      },
      'new-node': {
        title: 'New node',
        group: 'drawing',
        iconClassName: 'icon-check-empty',
        action: {
          click: function () {
            that._addNodeHandler.append();
          }
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
        group: 'settings',
        iconClassName: 'icon-grid',
        action: {
          click: function () {
            that._axes.toggleVisible();
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