export {
  mouse,
  select,
  selectAll
} from 'd3-selection';

import {selection as Selection, event} from 'd3-selection';

//prototype. delegated events
Selection.prototype.delegate = function(evt, targetselector, handler) {
  var self = this;
  return this.on(evt, function() {
    var eventTarget = event.target,
        target = self.selectAll(targetselector);
    target.each(function(){
      //only perform event handler if the eventTarget and intendedTarget match
      if (eventTarget === this) {
        handler.call(eventTarget, eventTarget.__data__);
      } else if (eventTarget.parentNode === this) {
        handler.call(eventTarget.parentNode, eventTarget.parentNode.__data__);
      }
    });
  });
};

export {
  Selection as selection,
  event
};


export {
  zoom,
  zoomIdentity
} from 'd3-zoom';

export {
  scaleLinear
} from 'd3-scale';

export {
  axisBottom,
  axisRight
} from 'd3-axis';

export {
  forceSimulation,
  forceLink
} from 'd3-force';

export {
  map
} from 'd3-collection';

export {
  drag
} from 'd3-drag';

