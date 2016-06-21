'use strict';

var domify = require('min-dom/lib/domify');

var domDelegate = require('min-dom/lib/delegate');

function css(attrs) {
  return attrs.join(';');
}

var LIGHTBOX_STYLES = css([
  'z-index: 1001',
  'position: fixed',
  'top: 0',
  'left: 0',
  'right: 0',
  'bottom: 0'
]);

var BACKDROP_STYLES = css([
  'width: 100%',
  'height: 100%',
  'background: rgba(0,0,0,0.3)'
]);

var NOTICE_STYLES = css([
  'position: absolute',
  'left: 50%',
  'top: 50%',
  'margin: -12.5% -13% !important',
  'width: 26% !important',
  'height: 50%',
  'overflow-y: auto',
  'text-align: center',
  'padding: 10px',
  'background: white',
  'border: solid 1px #AAA',
  'border-radius: 3px',
  'font-family: Helvetica, Arial, sans-serif',
  'font-size: 14px',
  'line-height: 1.2em'
]);

var LIGHTBOX_MARKUP =
  '<div style="' + LIGHTBOX_STYLES + '">' +
    '<div class="backdrop" style="' + BACKDROP_STYLES + '"></div>' +
    '<div class="notice" style="' + NOTICE_STYLES + '">{0}</div>' +
  '</div>';


var lightBox;

function open(content) {
  if (!lightBox) {
    lightBox = domify(LIGHTBOX_MARKUP.replace('{0}', content));

    domDelegate.bind(lightBox, '.backdrop', 'click', function() {
      document.body.removeChild(lightBox);
      lightBox = false;
    });
  }
  document.body.appendChild(lightBox);
}

module.exports.open = open;