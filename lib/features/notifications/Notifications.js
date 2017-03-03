'use strict';

var notify = require('Notify');

require('./style.scss');

/**
 * Notification description
 *
 * @class
 * @constructor
 *
 */

function Notifications() {
  this._notify = notify;
}

module.exports = Notifications;

Notifications.prototype.setTopCenter = function(parameters){
  parameters.position = parameters.position || 'topCenter';
};

Notifications.prototype.info = function (parameters) {
  this.setTopCenter(parameters);
  console.log(parameters);
  this._notify.info(parameters);
};

Notifications.prototype.success = function (parameters) {
  this.setTopCenter(parameters);
  console.log(parameters);
  this._notify.success(parameters);
};

Notifications.prototype.warning = function (parameters) {
  this._notify.warning(parameters);
};

Notifications.prototype.error = function (parameters) {
  this._notify.error(parameters);
};

Notifications.prototype.notify = function (parameters) {
  this._notify.notify(parameters);
};

module.exports = Notifications;