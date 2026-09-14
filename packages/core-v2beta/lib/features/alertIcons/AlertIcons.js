'use strict';

var forIn = require('lodash/object').forIn,
    xml2js = require('xml2js'),
    _get = require('lodash/object').get
    ;

require('./style.scss');

/**
 * The alert icons module.
 *
 * @class
 * @constructor
 *
 * @param {IconLoader} iconLoader
 * @param {Defs} defs
 * @param {Notifications} notifications
 * @param drawingRegistry
 */
function AlertIcons(iconLoader, defs, notifications, drawingRegistry) {
  this._iconLoader = iconLoader;
  this._iconDefs = {};
  this._alerts = {};
  this._defs = defs;
  this._notifications = notifications;
  this._drawingRegistry = drawingRegistry;

  this._init();
}

AlertIcons.$inject = ['iconLoader', 'defs', 'notifications', 'drawingRegistry'];

module.exports = AlertIcons;

AlertIcons.prototype.clear = function(){
  var that = this;
  forIn(this._alerts, function(a){
    that._clearAlert(a);
  });
  this._alerts = {};
};

AlertIcons.prototype._clearAlert = function(alert) {
  alert.element.select('.innerElement').classed('blink', false);
  alert.selection.on('mousedown', null);
  alert.selection.remove();
};

AlertIcons.prototype.getAlert = function(nodeId){
  return _get(this._alerts, nodeId, false);
};

AlertIcons.prototype.removeAlert = function(nodeId){
  var alert = this.getAlert(nodeId);
  if (alert) {
    this._clearAlert(alert);
    delete this._alerts[nodeId];
  }
};

AlertIcons.prototype._createAlert = function(element, message, type){
  var that = this,
      selection = element
        .select('.innerElement')
        .append('svg')
        .attr('class', 'alertIcon')
        .attr('x', -2)
        .attr('y', -2)
        .attr('width', 10)
        .attr('height', 10)
        .attr('preserveAspectRatio', 'xMaxYMax meet');

  selection
    .append('use');

  var alert = {
    element: element,
    selection: selection,
    message: message,
    type: type
  };

  selection
    .on('mousedown', function(){
      that._notifications.notify({title: alert.type, text: alert.message}, alert.type);
    });

  return this._updateAlert(alert, message, type);
};

AlertIcons.prototype._updateAlert = function(alert, message, type){
  var that = this;
  alert.selection
    .attr('viewBox', function () {
      return that._iconDefs[type];
    })
    .select('use')
    .attr('xlink:href', function () {
      return '#' + type + '_alerticon_def';
    });
  alert.message = message.replace(/(<([^>]+)>)/ig, '');
  alert.type = type;
  alert.element.select('.innerElement').classed('blink', true);
  return alert;
};

AlertIcons.prototype.showAlert = function(nodeId, message, type){
  var element = this._drawingRegistry.get(nodeId);
  if (element){
    type = _get({'error': 'error', 'info': 'info', 'success': 'success', 'warning': 'warning'}, type, 'info');
    var alert = this.getAlert(nodeId);
    if (alert){
      // update alert
      alert = this._updateAlert(alert, message, type);
    } else {
      // create alert
      alert = this._createAlert(element, message, type);
    }
    this._alerts[nodeId] = alert;
  }
};

AlertIcons.prototype._init = function () {
  var iconObj = this._defs,
      that = this;
  var parser = new xml2js.Parser({normalizeTags: true, preserveChildrenOrder: true, explicitChildren: true});

  // create the icons definitions
  forIn(alertIconsTypes, function (icon, iconKey) {
    parser.parseString(icon, function (err, result) {
      if (!err) {
        var iconNode = that._iconLoader._createNode(iconKey, iconObj, iconObj, result.svg, 'symbol');
        iconNode.attr('id', iconKey + '_alerticon_def');
        that._iconDefs[iconKey] = result.svg.$.viewBox || '';
      }
    });
  });

};

var alertIconsTypes = {
  'error': require('./svg/error_icon.svg'),
  'info': require('./svg/info_icon.svg'),
  'success': require('./svg/success_icon.svg'),
  'warning': require('./svg/warning_icon.svg')
};