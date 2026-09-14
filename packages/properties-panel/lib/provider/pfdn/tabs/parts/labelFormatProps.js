'use strict';

var is = require('../../../../utils/modelUtils').is;

function labelFormatProps(group, element, entryFactory) {
  if (is(element, 'pfdn:Node') || is(element, 'pfdn:Link') ) {
    group.entries.push(entryFactory.textField({
      id: 'label.fontSize',
      label: 'Font size',
      modelProperty: 'label.fontSize',
      type: 'number'
    }));
    group.entries.push(entryFactory.colorPicker({
      id: 'label.color',
      label: 'Color',
      modelProperty: 'label.color'
    }));
  } else if (is(element, 'pfdn:Label')){
    group.entries.push(entryFactory.textField({
      id: 'fontSize',
      label: 'Font size',
      modelProperty: 'fontSize',
      type: 'number'
    }));
    group.entries.push(entryFactory.colorPicker({
      id: 'color',
      label: 'Color',
      modelProperty: 'color'
    }));
  }
}

module.exports = labelFormatProps;