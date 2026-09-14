'use strict';

var is = require('../../../../utils/modelUtils').is,
    startCase = require('lodash/string').startCase,
    forIn = require('lodash/object').forIn;

function nodeFormatProps(group, element, entryFactory, icons) {
  var selOptions = [];
  forIn(icons, function(v, k){
    selOptions.push({
      value: k,
      name: startCase(k)
    });
  });
  if (is(element, 'pfdn:Node')) {
    group.entries.push(entryFactory.selectBox({
      id: 'type',
      label: 'Icon',
      modelProperty: 'type',
      allowEmpty: false,
      selectOptions: selOptions
    }));
    group.entries.push(entryFactory.textField({
      id: 'size',
      label: 'Size',
      modelProperty: 'size',
      type: 'number'
    }));
  }
}

module.exports = nodeFormatProps;