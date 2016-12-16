'use strict';

/**
 * PaletteProvider description
 *
 * @class
 * @constructor
 *
 * @param {EventBus} eventBus
 */

function PaletteProvider(eventBus) {

  this._eventBus = eventBus;

}

PaletteProvider.$inject = [
  'eventBus'
];

module.exports = PaletteProvider;

PaletteProvider.prototype.getPaletteEntries = function () {
  var actions = {

    'new': {
      title: 'New diagram',
      group: 'file-ops',
      iconClassName: 'icon-doc',
      action: {
        click: function(){
          console.log('click button');
        },
        drag: function(){
          console.log('drag button');
        },
      }
    }

  };

  return actions;
};