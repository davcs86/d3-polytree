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

	module.exports = __webpack_require__(438);


/***/ },

/***/ 436:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'zoom' ],
	  zoom: [ 'type', __webpack_require__(437) ]
	};

/***/ },

/***/ 437:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(313),
	  isUndefined = __webpack_require__(255).isUndefined,
	  _isZoomable = false,
	  _zoom = null
	  ;
	
	/**
	 * The zoom functionality.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Object} options
	 * @param {Canvas} canvas
	 * @param {GridLines} gridLines
	 */
	function Zoom(options, canvas, eventBus) {
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	
	  init.apply(this, [options.translateX, options.translateY, options.scale]);
	
	  this.setZoomable(!!options.isZoomable);
	  this.setZoom(options.translateX, options.translateY, options.scale, options.scale);
	}
	
	Zoom.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];
	
	module.exports = Zoom;
	
	Zoom.prototype.setZoom = function(translateX, translateY, scale){
	  if (_isZoomable === true) {
	
	    var currentTransform = this._canvas.getTransform();
	
	    translateX = !isUndefined(translateX) ? translateX : currentTransform.e;
	
	    translateY = !isUndefined(translateY) ? translateY : currentTransform.f;
	
	    scale = !isUndefined(scale) ? scale : currentTransform.a;
	
	    // apply transform
	    this._canvas.getDrawingLayer()
	      .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
	
	    this._eventBus.emit('canvas.zoomed');
	  }
	};
	
	Zoom.prototype.setZoomable = function(isZoomable){
	  _isZoomable = isZoomable;
	};
	
	var init = function(tX, tY, s){
	  var drawingLayer = this._canvas.getDrawingLayer();
	  var that = this;
	  _zoom = d3
	    .zoom()
	    .scaleExtent([0.1, 15])
	    .on('zoom', function(){
	      if (!_isZoomable) return true;
	      // on zoom event
	      var trans = d3.event.transform;
	      that.setZoom(trans.x, trans.y, trans.k);
	    });
	
	  drawingLayer = drawingLayer
	    .call(_zoom)
	    .call(_zoom.transform, d3.zoomIdentity
	      .translate(tX, tY)
	      .scale(s))
	    .append('g');
	
	  this._canvas.setDrawingLayer(drawingLayer);
	};

/***/ },

/***/ 438:
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
	  __webpack_require__(436),
	  //require('./features/tooltip')
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ }

})
});
;
//# sourceMappingURL=D3P.InteractiveViewer.js.map