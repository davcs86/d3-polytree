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
return webpackJsonpD3P([1],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(852);


/***/ },

/***/ 852:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2);
	
	var Viewer = __webpack_require__(3).Viewer;
	
	
	/**
	 * A viewer that includes user interactions
	 *
	 * @param {Object} options
	 */
	function InteractiveViewer(options) {
	  Viewer.call(this, options);
	}
	
	inherits(InteractiveViewer, Viewer);
	
	module.exports = {InteractiveViewer: InteractiveViewer};
	
	InteractiveViewer.prototype._interactionModules = [
	  __webpack_require__(853),
	  //require('./features/tooltip')
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ },

/***/ 853:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'zoomScroll' ],
	  zoomScroll: [ 'type', __webpack_require__(854) ]
	};

/***/ },

/***/ 854:
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


/***/ }

})
});
;
//# sourceMappingURL=D3P.InteractiveViewer.js.map