'use strict';

var notify = require('sweetalert'),
    isFunction = require('lodash/lang').isFunction;

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

Notifications.prototype.info = function (parameters, callback) {
  this.notify(parameters, 'info', callback);
};

Notifications.prototype.success = function (parameters, callback) {
  this.notify(parameters, 'success', callback);
};

Notifications.prototype.warning = function (parameters, callback) {
  this.notify(parameters, 'warning', callback);
};

Notifications.prototype.error = function (parameters, callback) {
  this.notify(parameters, 'error', callback);
};

Notifications.prototype.notify = function (parameters, type, callback) {
  if (type && type !== ''){
    parameters.type = type;
  }
  if (isFunction(callback)) {
    parameters.showCancelButton = true;
    parameters.confirmButtonColor = '#DD6B55';
    this._notify(parameters, callback);
  } else {
    this._notify(parameters);
  }
};

module.exports = Notifications;