'use strict';

// input entities
var textInputField = require('./TextInputEntryFactory'),
    colorPickerField = require('./ColorPickerEntryFactory'),
    selectBoxField = require('./SelectEntryFactory'),
    spreadsheetField = require('./SpreadsheetEntryFactory'),
    _get = require('lodash/object').get,
    _set = require('lodash/object').set,
    _assign = require('lodash/object').assign,
    $ = require('jquery')
    ;

// helpers ////////////////////////////////////////

function ensureNotNull(prop) {
  if (!prop) {
    throw new Error(prop + ' must be set.');
  }

  return prop;
}

function EntryFactory(eventBus) {
  this._eventBus = eventBus;
}

EntryFactory.$inject = [
  'eventBus'
];

/**
 * sets the default parameters which are needed to create an entry
 *
 * @param options
 * @returns {{id: *, description: (*|string), get: (*|Function), set: (*|Function),
 *            validate: (*|Function), html: string}}
 */
EntryFactory.prototype.setDefaultParameters = function (options) {

  var eventBus = this._eventBus;

  // default method to fetch the current value of the input field
  var defaultGet = function (element, formNode) {
    var res = {},
        prop = ensureNotNull(options.modelProperty),
        propVal = _get(element, prop);

    _set(res, prop, propVal);
    $(formNode).find('input').val(propVal);

    return res;
  };

  // default method to set a new value to the input field
  var defaultSet = function (element, values) {
    var prop = ensureNotNull(options.modelProperty);

    _set(element, prop, _get(values, prop));
    return true;
  };

  // default validation method
  var defaultValidate = function () {
    return {};
  };

  var triggerUpdate = function (propertyId, element) {
    eventBus.emit('PropertiesPanel.propertyChanged', propertyId, element);
  };

  return _assign({
    html: '',
    description: '',
    get: defaultGet,
    set: defaultSet,
    validate: defaultValidate,
  },
  options, {
    triggerUpdate: triggerUpdate
  });
};


/**
 * Generates an text input entry object for a property panel.
 * options are:
 * - id: id of the entry - String
 *
 * - description: description of the property - String
 *
 * - label: label for the input field - String
 *
 * - set: setter method - Function
 *
 * - get: getter method - Function
 *
 * - validate: validation method - Function
 *
 * - modelProperty: name of the model property - String
 *
 * @param options
 * @returns the propertyPanel entry resource object
 */

EntryFactory.prototype.textField = function (options) {
  return textInputField(this.setDefaultParameters(options));
};

EntryFactory.prototype.selectBox = function (options) {
  return selectBoxField(this.setDefaultParameters(options));
};

EntryFactory.prototype.colorPicker = function (options) {
  return colorPickerField(this.setDefaultParameters(options));
};

EntryFactory.prototype.spreadsheet = function (options) {
  return spreadsheetField(this.setDefaultParameters(options));
};

module.exports = EntryFactory;