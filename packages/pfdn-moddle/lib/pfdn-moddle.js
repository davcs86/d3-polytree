'use strict';

var isString = require('lodash/lang').isString,
    isFunction = require('lodash/lang').isFunction,
    assign = require('lodash/object').assign,
    Moddle = require('moddle'),
    XmlReader = require('moddle-xml/lib/reader'),
    XmlWriter = require('moddle-xml/lib/writer');

/**
 * A sub class of {@link Moddle} with support for import and export of Process Flow Diagrams xml files.
 *
 * @class PfdnModdle
 * @extends Moddle
 *
 * @param {Object|Array} packages to use for instantiating the model
 * @param {Object} [options] additional options to pass over
 */
function PfdnModdle(packages, options) {
  Moddle.call(this, packages, options);
}

PfdnModdle.prototype = Object.create(Moddle.prototype);

module.exports = PfdnModdle;


/**
 * Instantiates a PFDN model tree from a given xml string.
 *
 * @param {String}   xmlStr
 * @param {String}   [typeName='pfdn:Diagram'] name of the root element
 * @param {Object}   [options]  options to pass to the underlying reader
 * @param {Function} done       callback that is invoked with (err, result, parseContext)
 *                              once the import completes
 */
PfdnModdle.prototype.fromXML = function(xmlStr, typeName, options, done) {

  if (!isString(typeName)) {
    done = options;
    options = typeName;
    typeName = 'pfdn:Diagram';
  }

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var reader = new XmlReader(assign({ model: this, lax: true }, options));
  var rootHandler = reader.handler(typeName);

  reader.fromXML(xmlStr, rootHandler, done);
};


/**
 * Serializes a PFDN object tree to XML.
 *
 * @param {String}   element    the root element, typically an instance of `pfdn:Diagram`
 * @param {Object}   [options]  to pass to the underlying writer
 * @param {Function} done       callback invoked with (err, xmlStr) once the import completes
 */
PfdnModdle.prototype.toXML = function(element, options, done) {

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var writer = new XmlWriter(options);
  try {
    var result = writer.toXML(element);
    done(null, result);
  } catch (e) {
    done(e);
  }
};
