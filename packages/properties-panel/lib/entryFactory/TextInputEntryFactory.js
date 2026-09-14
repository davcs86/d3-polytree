'use strict';

function TextInputEntryFactory(resource){
  var label = resource.label || resource.id,
      type = resource.type || 'text';

  resource.html =
    '<div class="pfdjs-pp-field-wrapper" >' +
    '<label for="pfdjs-' + resource.id + '" >'+ label +'</label>' +
    '<input id="pfdjs-' + resource.id + '" type="' + type + '" name="' + resource.modelProperty+'" />' +
    '</div>';

  return resource;
}

module.exports = TextInputEntryFactory;