'use strict';

var nodeFormatProps = require('./parts/nodeFormatProps'),
    linkFormatProps = require('./parts/linkFormatProps'),
    labelFormatProps = require('./parts/labelFormatProps'),
    gridFormatProps = require('./parts/gridFormatProps')
    ;

function formatTab(element, entryFactory, icons) {

  var elemFormatGroup = {
    id: 'elementFormat',
    label: 'Element format',
    entries: []
  };

  var labelFormatGroup = {
    id: 'labelFormat',
    label: 'Label format',
    entries: []
  };

  var gridFormatGroup = {
    id: 'gridFormat',
    label: 'Grid format',
    entries: []
  };

  nodeFormatProps(elemFormatGroup, element, entryFactory, icons);
  linkFormatProps(elemFormatGroup, element, entryFactory);
  labelFormatProps(labelFormatGroup, element, entryFactory);
  gridFormatProps(gridFormatGroup, element, entryFactory);

  return {
    id: 'format',
    label: 'Format',
    groups: [
      elemFormatGroup,
      labelFormatGroup,
      gridFormatGroup
    ]
  };

}

module.exports = formatTab;