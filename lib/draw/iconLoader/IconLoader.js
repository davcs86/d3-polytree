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
 * @param {Canvas} canvas
 */
function IconLoader(icons, canvas) {
  this._icons = icons;
  this._canvas = canvas;
  this._processedIcons = {};

  this._init();
}

IconLoader.$inject = [ 'icons', 'canvas' ];

module.exports = IconLoader;

IconLoader.prototype._createNode = function(iconKey, defsNode, parentNode, nodeObj, nodeType) {
  var that = this,
    attrs = nodeObj.$ || {},
    thisNode = {};

  if (isUndefined(attrs.id)) {
    thisNode = parentNode.append(nodeType);
    forIn(attrs, function(n, k){
      thisNode.attr(k, n);
    });
  } else {
    thisNode = defsNode.append(nodeType);
    forIn(attrs, function(n, k){
      thisNode.attr(k, n);
    });
    thisNode.attr('id', iconKey + '_' + attrs.id);
  }
  if (!isUndefined(attrs['xlink:href'])) {
    thisNode.attr('xlink:href', attrs['xlink:href'].replace('#','#'+iconKey+'_'));
  }
  if (!isUndefined(attrs['clip-path'])) {
    thisNode.attr('clip-path', attrs['clip-path'].replace('#','#'+iconKey+'_'));
  }

  forIn(nodeObj.$$, function(node){
    if (node['#name']=='defs'){
      forIn(node.$$, function (nodeDef){
        that._createNode(iconKey, defsNode, defsNode, nodeDef, nodeDef['#name']);
      });
    } else {
      that._createNode(iconKey, defsNode, thisNode, node, node['#name']);
    }
  });
  return thisNode;
};

IconLoader.prototype._init = function() {
  var svg = this._canvas.getSVG(),
    iconObj = svg.append('defs'),
    that = this;

  // create the icons definitions
  forIn(this._icons, function(icon, iconKey){
    var parser = new xml2js.Parser({normalizeTags: true, preserveChildrenOrder: true, explicitChildren: true });
    parser.parseString(icon, function (err, result) {
      if (!err){
        var iconNode = that._createNode(iconKey, iconObj, iconObj, result.svg, 'symbol');
        iconNode.attr('id', iconKey + '_icon_def');
        that._processedIcons[iconKey] = result.svg.$.viewBox || '';
      }
    });
  });
};