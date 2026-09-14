'use strict';

var nameProps = require('./parts/nameProps')
    ;

function propertiesTab(element, entryFactory) {

  var generalGroup = {
    id: 'general',
    label: 'General',
    entries: []
  };

  nameProps(generalGroup, element, entryFactory);

  return {
    id: 'properties',
    label: 'Properties',
    groups: [
      generalGroup
    ]
  };

}

module.exports = propertiesTab;