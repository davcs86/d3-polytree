'use strict';

var is = require('../../../../utils/modelUtils').is;

function nameProps(group, element, entryFactory) {
  if (is(element, 'pfdn:Node')) {
    group.entries.push(entryFactory.textField({
      id: 'name',
      label: 'Name',
      modelProperty: 'name'
    }));
    group.entries.push(entryFactory.textField({
      id: 'tag',
      label: 'Tag',
      modelProperty: 'tag'
    }));
    group.entries.push(entryFactory.textField({
      id: 'label.text',
      label: 'Diagram label',
      modelProperty: 'label.text'
    }));
  } else if (is(element, 'pfdn:Settings')) {
    group.entries.push(entryFactory.textField({
      id: 'name',
      label: 'Diagram name',
      modelProperty: 'name'
    }));
    group.entries.push(entryFactory.textField({
      id: 'author',
      label: 'Author\'s name',
      modelProperty: 'author'
    }));
  } else if (is(element, 'pfdn:Link')){
    group.entries.push(entryFactory.textField({
      id: 'label.text',
      label: 'Diagram label',
      modelProperty: 'label.text'
    }));
  } else if (is(element, 'pfdn:Label')){
    group.entries.push(entryFactory.textField({
      id: 'text',
      label: 'Label',
      modelProperty: 'text'
    }));
  }
}

module.exports = nameProps;