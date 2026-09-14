'use strict';

var forEach = require('lodash/collection').forEach,
  forIn = require('lodash/object').forIn;

// Build the per-node attached-data table as DOM nodes. Using textContent
// (never innerHTML or string concatenation) makes header cells, attached-data
// keys and values inert, closing the XSS vector present in the previous
// string-built `.html()` implementation while keeping identical markup/classes.
function cell(tag, text, className) {
  var el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  el.textContent = text === undefined || text === null ? '' : String(text);
  return el;
}

function attachedDataTable(d, tableHeaders) {
  var attachedData = (d && d.attachedData) || {};

  var table = document.createElement('table');
  table.className = 'table table-striped table-condensed table-bordered';

  var thead = document.createElement('thead');
  var headRow = document.createElement('tr');
  forEach(tableHeaders, function (v) {
    headRow.appendChild(cell('th', v));
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  forIn(attachedData, function (v, k) {
    var row = document.createElement('tr');
    row.appendChild(cell('td', k + ':'));
    forEach(v, function (vv) {
      row.appendChild(cell('td', vv, 'text-right'));
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  return table;
}

module.exports = attachedDataTable;
