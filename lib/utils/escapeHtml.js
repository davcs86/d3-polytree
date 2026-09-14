'use strict';

// Escape a value for safe interpolation into an HTML string. Used where an
// underlying API requires HTML markup (e.g. d3-tip's .html()), so that node
// labels and other data cannot inject markup into the host page.
function escapeHtml(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = escapeHtml;
