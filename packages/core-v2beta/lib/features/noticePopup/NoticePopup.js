'use strict';

var domify = require('min-dom').domify,
    domDelegate = require('min-dom').delegate;

require('./style.scss');

/**
 * Notice popup
 *
 * @class
 * @constructor
 *
 */

function NoticePopup(canvas, notifications) {
  this._canvas = canvas;
  this._notifications = notifications;

  this._init();
}

NoticePopup.$inject = [
  'canvas',
  'notifications'
];

module.exports = NoticePopup;

NoticePopup.prototype._init = function(){
  var popupBtn = domify('<div class="noticePopup"/>');
  this._canvas.getContainer().appendChild(popupBtn);

  var showNotice = function(){
    this._notifications.notify({
      title: 'D3-Polytree',
      text: 'More info about this project in <a href="https://github.com/davcs86/d3-polytree/tree/v2.0-beta/" target="_blank">https://github.com/davcs86/d3-polytree/tree/v2.0-beta/</a>',
      html: true
    });
  }.bind(this);
  domDelegate.bind(this._canvas.getContainer(), '.noticePopup', 'click', showNotice);
};