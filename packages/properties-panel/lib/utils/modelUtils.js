'use strict';

function is(definition, elementType){
  return definition.$instanceOf(elementType);
}

module.exports = {
  is: is
};