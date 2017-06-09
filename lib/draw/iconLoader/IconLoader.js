'use strict';

var forIn = require('lodash/object').forIn,
    xml2js = require('xml2js'),
    isUndefined = require('lodash/lang').isUndefined
    ;

/**
 * The icon loader module.
 *
 * @class
 * @constructor
 *
 * @param {Icons} icons
 * @param defs
 */
function IconLoader(icons, defs) {
  this._icons = icons;
  this._processedIcons = {};
  this._defs = defs;
  
  this._init();
}

IconLoader.$inject = ['icons', 'defs'];

module.exports = IconLoader;

IconLoader.prototype._createNode = function (iconKey, defsNode, parentNode, nodeObj, nodeType) {
  var that = this,
      attrs = nodeObj.$ || {},
      thisNode = {};
  
  if (isUndefined(attrs.id)) {
    thisNode = parentNode.append(nodeType);
    forIn(attrs, function (n, k) {
      thisNode.attr(k, n);
    });
  } else {
    thisNode = defsNode.append(nodeType);
    forIn(attrs, function (n, k) {
      thisNode.attr(k, n);
    });
    thisNode.attr('id', iconKey + '_' + attrs.id);
  }
  if (!isUndefined(attrs['xlink:href'])) {
    thisNode.attr('xlink:href', attrs['xlink:href'].replace('#', '#' + iconKey + '_'));
  }
  if (!isUndefined(attrs['clip-path'])) {
    thisNode.attr('clip-path', attrs['clip-path'].replace('#', '#' + iconKey + '_'));
  }
  
  forIn(nodeObj.$$, function (node) {
    if (node['#name'] === 'defs') {
      forIn(node.$$, function (nodeDef) {
        that._createNode(iconKey, defsNode, defsNode, nodeDef, nodeDef['#name']);
      });
    } else {
      that._createNode(iconKey, defsNode, thisNode, node, node['#name']);
    }
  });
  return thisNode;
};

IconLoader.prototype._init = function () {
  var iconObj = this._defs,
      that = this;
  var parser = new xml2js.Parser({normalizeTags: true, preserveChildrenOrder: true, explicitChildren: true});

  // create default icon if it isn't created
  if (isUndefined(that._icons['default'])) {
    that._icons['default'] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect rx="8" ry="8" width="100" height="100" fill="#888"/></svg>';
  }

  // create the icons definitions
  forIn(this._icons, function (icon, iconKey) {
    parser.parseString(icon, function (err, result) {
      if (!err) {
        var iconNode = that._createNode(iconKey, iconObj, iconObj, result.svg, 'symbol');
        iconNode.attr('id', iconKey + '_icon_def');
        that._processedIcons[iconKey] = result.svg.$.viewBox || '';
      }
    });
  });

};