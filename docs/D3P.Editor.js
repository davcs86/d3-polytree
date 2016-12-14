(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["D3P"] = factory();
	else
		root["D3P"] = factory();
})(this, function() {
return webpackJsonpD3P([0],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },

/***/ 1:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  Viewer = __webpack_require__(3).Viewer;
	
	/**
	 * An editor for node networks
	 *
	 * @param {Object} options
	 */
	function Editor(options) {
	  Viewer.call(this, options);
	}
	
	inherits(Editor, Viewer);
	
	module.exports = {
	  Editor: Editor
	};
	
	Editor.prototype.createDiagram = function(){
	  return this.importNodes({});
	};
	
	Editor.prototype._interactionModules = [
	  __webpack_require__(852),
	  __webpack_require__(854)
	];
	
	Editor.prototype._editionModules = [
	  __webpack_require__(856)
	];
	
	Editor.prototype._modules = [].concat(
	  Editor.prototype._modules,
	  Editor.prototype._interactionModules,
	  Editor.prototype._editionModules
	);

/***/ },

/***/ 852:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'zoomScroll' ],
	  zoomScroll: [ 'type', __webpack_require__(853) ]
	};

/***/ },

/***/ 853:
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Enables the zoom.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Zoom} zoom
	 */
	function ZoomScroll(zoom) {
	  zoom.setZoomable(true);
	}
	
	ZoomScroll.$inject = [ 'zoom' ];
	
	module.exports = ZoomScroll;


/***/ },

/***/ 854:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['mouseEvents'],
	  mouseEvents: ['type', __webpack_require__(855)],
	  __depends__: [
	    __webpack_require__(741)
	  ]
	};


/***/ },

/***/ 855:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(555);
	
	/**
	 * MouseEvents description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Canvas} canvas
	 */
	
	function MouseEvents(eventBus)
	{
	  this._eventBus = eventBus;
	
	  this._init();
	}
	
	MouseEvents.$inject = [
	  'eventBus'
	];
	
	module.exports = MouseEvents;
	
	MouseEvents.prototype._addListeners = function(element, definition){
	  var type = definition.$descriptor.ns.localName.toLowerCase(),
	    that = this
	    ;
	  element.on('mouseenter', function () {
	    that._eventBus.emit(type + '.mouseenter', element, definition, d3.event);
	  });
	  element.on('mouseover', function () {
	    that._eventBus.emit(type + '.mouseover', element, definition, d3.event);
	  });
	  element.on('mousedown', function () {
	    that._eventBus.emit(type + '.mousedown', element, definition, d3.event);
	  });
	  element.on('mouseup', function () {
	    that._eventBus.emit(type + '.mouseup', element, definition, d3.event);
	  });
	  element.on('click', function () {
	    that._eventBus.emit(type + '.click', element, definition, d3.event);
	  });
	  element.on('dblclick', function () {
	    that._eventBus.emit(type + '.dblclick', element, definition, d3.event);
	  });
	  element.on('mouseleave', function () {
	    that._eventBus.emit(type + '.mouseleave', element, definition, d3.event);
	  });
	  element.on('mouseout', function () {
	    that._eventBus.emit(type + '.mouseout', element, definition, d3.event);
	  });
	  element.on('contextmenu', function () {
	    that._eventBus.emit(type + '.contextmenu', element, definition, d3.event);
	  });
	};
	
	MouseEvents.prototype._init = function () {
	  this._eventBus.on('label.created', this._addListeners, this);
	  this._eventBus.on('link.created', this._addListeners, this);
	  this._eventBus.on('node.created', this._addListeners, this);
	  this._eventBus.on('zone.created', this._addListeners, this);
	};

/***/ },

/***/ 856:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['outline'],
	  outline: ['type', __webpack_require__(857)],
	  __depends__: [
	    //''
	  ]
	};


/***/ },

/***/ 857:
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Outline description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Canvas} canvas
	 */
	
	function Outline(canvas, eventBus) {
	
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	
	  this._init();
	}
	
	Outline.$inject = [
	  'canvas',
	  'eventBus',
	];
	
	module.exports = Outline;
	
	Outline.prototype._getElemBBox = function(element){
	  return element.node().getBBox();
	};
	
	Outline.prototype._init = function () {
	  this._eventBus.on('node.created', function(element){
	    // add the outline to every node created
	    var elemSize = this._getElemBBox(element);
	    element
	      .append('rect')
	      .attr('class', 'element-outline')
	      .attr('x', 0)
	      .attr('y', 0)
	      .attr('fill', "green")
	      .attr('width', elemSize.width)
	      .style('height', elemSize.height);
	  }, this);
	};

/***/ }

})
});
;
//# sourceMappingURL=D3P.Editor.js.map