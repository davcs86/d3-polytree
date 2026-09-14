'use strict';

require('empty-module');
var $ = require('jquery'),
    _get = require('lodash/object').get,
    _set = require('lodash/object').set;
require('spectrum-colorpicker');
require('spectrum-colorpicker/spectrum.css');

function ColorPickerEntryFactory(resource){
  var label = resource.label || resource.id;

  resource.html =
    '<div class="pfdjs-pp-field-wrapper" >' +
    '<label for="pfdjs-' + resource.id + '" >'+ label +'</label>' +
    '<input id="pfdjs-' + resource.id + '" type="text" class="hidden" name="' + resource.modelProperty+'" />' +
    '</div>';

  resource.get = function(element, formNode){
    var formControl = $(formNode).find('input');
    formControl.spectrum({
      color: _get(element, resource.modelProperty),
      showButtons: false,
      clickoutFiresChange: true,
      change: function(color){
        var props = {};
        _set(props, resource.modelProperty, color.toHexString());
        resource.set(element, props);
        resource.triggerUpdate(resource.modelProperty, element);
      }
    });
  };

  return resource;
}

module.exports = ColorPickerEntryFactory;