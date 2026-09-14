'use strict';

var is = require('../../../../utils/modelUtils').is;

function gridFormatProps(group, element, entryFactory) {
  if (is(element, 'pfdn:Settings')) {
    group.entries.push(entryFactory.colorPicker({
      id: 'backgroundColor',
      label: 'Background color',
      modelProperty: 'backgroundColor'
    }));
    group.entries.push(entryFactory.colorPicker({
      id: 'grid.lineColor',
      label: 'Line color',
      modelProperty: 'grid.lineColor'
    }));
    group.entries.push(entryFactory.textField({
      id: 'grid.size',
      label: 'Square size',
      modelProperty: 'grid.size',
      type: 'number'
    }));
    group.entries.push(entryFactory.textField({
      id: 'grid.lineWidth',
      label: 'Line width',
      modelProperty: 'grid.lineWidth',
      type: 'number'
    }));
  }
}

module.exports = gridFormatProps;