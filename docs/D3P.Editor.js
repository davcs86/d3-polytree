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
	
	var inherits = __webpack_require__(2);
	
	var Viewer = __webpack_require__(3).Viewer;
	
	
	/**
	 * An editor for node networks
	 *
	 * @param {Object} options
	 */
	function Editor(options) {
	  Viewer.call(this, options);
	}
	
	inherits(Editor, Viewer);
	
	module.exports = {Editor: Editor};
	
	Editor.prototype.createDiagram = function(){
	  return this.importNodes({});
	};
	
	Editor.prototype._interactionModules = [
	  __webpack_require__(792)
	  //require('./features/tooltip')
	];
	
	Editor.prototype._editionModules = [
	  //require('./features/palette')
	];
	
	Editor.prototype._modules = [].concat(
	  Editor.prototype._modules,
	  Editor.prototype._interactionModules,
	  Editor.prototype._editionModules
	);

/***/ },

/***/ 792:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'zoom' ],
	  zoom: [ 'type', __webpack_require__(793) ]
	};

/***/ },

/***/ 793:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3js = __webpack_require__(545),
	  _isZoomable = false,
	  _canvas = null,
	  _zoom = null,
	  _gridLines = null;
	
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
	function Zoom(options, canvas, gridLines) {
	  _canvas = canvas;
	  _gridLines = gridLines;
	
	  init.apply(this);
	
	  this.setZoomable(!!options.isZoomable);
	  this.setZoom(options.translateX, options.translateY, options.scale);
	}
	
	Zoom.$inject = [ 'd3polytree.options', 'canvas', 'gridLines' ];
	
	module.exports = Zoom;
	
	Zoom.prototype.setZoom = function(translateX, translateY, scale){
	  if (_isZoomable === true) {
	    // apply zoom
	    _canvas
	      .getDrawingLayer()
	      .attr('transform', 'translate(' + translateX + ', ' + translateY + ') scale(' + scale + ')');
	    if (_gridLines) {
	      // re-draw grid lines
	      _gridLines._draw();
	    }
	  }
	};
	
	Zoom.prototype.setZoomable = function(isZoomable){
	  _isZoomable = isZoomable;
	};
	
	var init = function(){
	  var drawingLayer = _canvas.getDrawingLayer();
	  var that = this;
	  _zoom = d3js
	    .zoom()
	    .scaleExtent([0.01, 10])
	    .on('zoom', function(){
	      if (!_isZoomable) return;
	      // on zoom event
	      var trans = d3js.event.transform;
	      that.setZoom(trans.x, trans.y, trans.k);
	    });
	
	  drawingLayer = drawingLayer
	    .call(_zoom)
	    .append('g');
	
	  _canvas.setDrawingLayer(drawingLayer);
	};

/***/ }

})
});
;
//# sourceMappingURL=D3P.Editor.js.map