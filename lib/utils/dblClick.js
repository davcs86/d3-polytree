'use strict';

// based on http://bl.ocks.org/couchand/6394506

var d3js = require('d3');

function dblClick() {
  var event = d3js.dispatch('click', 'dblclick');
  function cc(selection) {
    var down,
      tolerance = 5,
      last,
      wait = null;
    // euclidean distance
    function dist(a, b) {
      return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
    }
    selection.on('mousedown', function() {
      down = d3js.mouse(document.body);
      last = +new Date();
    });
    selection.on('mouseup', function() {
      var data = this.__data__;
      if (dist(down, d3js.mouse(document.body)) <= tolerance) {
        if (wait) {
          window.clearTimeout(wait);
          wait = null;
          event.dblclick(d3js.event, data);
        } else {
          wait = window.setTimeout((function (e, d) {
            return function () {
              event.click(e, d);
              wait = null;
            };
          })(d3js.event, data), 300);
        }
      }
    });
  }
  return d3js.rebind(cc, event, 'on');
}

module.exports = dblClick;