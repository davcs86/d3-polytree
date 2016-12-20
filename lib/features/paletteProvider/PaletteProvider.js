'use strict';

/**
 * PaletteProvider description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function PaletteProvider(d3polytree, eventBus, localStorage, uploader, exporting) {

  this._d3polytree = d3polytree;
  this._eventBus = eventBus;
  this._localStorage = localStorage;
  this._uploader = uploader;
  this._exporting = exporting;

}

PaletteProvider.$inject = [
  'd3polytree',
  'eventBus',
  'localStorage',
  'upload',
  'exporting'
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
        click: function(){
          that._localStorage.save();
        }
      }
    },
    'open': {
      title: 'Open diagram',
      group: 'file-ops',
      iconClassName: 'icon-folder-open-empty',
      action: {
        click: function(){
          that._uploader.openDialog();
        }
      },
    },
    'download': {
      title: 'Download diagram',
      group: 'file-ops',
      iconClassName: 'icon-download',
      action: {
        click: function(){
          that._exporting.trigger('xml');
        }
      },
    },
    'export-svg': {
      title: 'Download as SVG image',
      group: 'file-ops',
      iconClassName: 'icon-image',
      action: {
        click: function(){
          that._exporting.trigger('svg');
        }
      },
    },
    'search': {
      title: 'Search item',
      group: 'utils',
      iconClassName: 'icon-glass',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'delete-item': {
      title: 'Delete selected item',
      group: 'utils',
      iconClassName: 'icon-trash',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'toggle-grid': {
      title: 'Show/hide grid',
      group: 'utils',
      iconClassName: 'icon-grid',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'new-connection': {
      title: 'New connection',
      group: 'drawing',
      iconClassName: 'icon-arrow',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'new-label': {
      title: 'New label',
      group: 'drawing',
      iconClassName: 'icon-text',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'new-node': {
      title: 'New node',
      group: 'drawing',
      iconClassName: 'icon-check-empty',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    },
    'settings': {
      title: 'Settings',
      group: 'settings',
      iconClassName: 'icon-cog-outline',
      action: {
        click: function(){
          console.log('click button');
        },
        dragstart: function(){
          console.log('drag button');
        },
      },
    }
  };

  return actions;
};