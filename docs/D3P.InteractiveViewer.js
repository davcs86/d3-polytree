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

	module.exports = __webpack_require__(794);


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

/***/ },

/***/ 794:
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
	  __webpack_require__(792),
	  __webpack_require__(795)
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ },

/***/ 795:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'tooltip' ],
	  tooltip: [ 'type', __webpack_require__(796) ]
	};

/***/ },

/***/ 796:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3js = __webpack_require__(545),
	  _d3tip = __webpack_require__(797),
	  _tooltip = null,
	  isEmpty = __webpack_require__(604).isEmpty;
	
	/**
	 * The tooltip functionality.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Canvas} Canvas
	 * @param {EventBus} EventBus
	 */
	function Tooltip(canvas, eventBus) {
	  d3js.functor = function functor(v) {
	    // legacy function: https://bl.ocks.org/micahstubbs/f94ee71c353f0152da3bc2ee4351608d#d3-tip.js
	    return typeof v === 'function' ? v : function() {
	      return v;
	    };
	  };
	  //_tooltipHelper(d3js);
	  _tooltip = _d3tip(d3js)
	    .attr('class', 'd3-tip')
	    .offset([-10, 0])
	    .html(function(d) {
	      return isEmpty(d.label)?'':d.label;
	    });
	  canvas.getDrawingLayer().call(_tooltip);
	  eventBus.on('groupLabel.mouseover', function(){
	    // show tooltip on groups
	    var zoom = canvas.getTransform().a;
	    if (zoom < 0.8){
	      _tooltip.show.apply(this, arguments);
	    }
	  });
	  eventBus.on('groupLabel.mouseout', function(){
	    _tooltip.hide();
	  });
	}
	
	Tooltip.$inject = [ 'canvas', 'eventBus' ];
	
	module.exports = Tooltip;

/***/ },

/***/ 797:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// d3.tip
	// Copyright (c) 2013 Justin Palmer
	//
	// Tooltips for d3.js SVG visualizations
	
	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module with d3 as a dependency.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(545)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else if (typeof module === 'object' && module.exports) {
	    // CommonJS
	    module.exports = function(d3) {
	      d3.tip = factory(d3)
	      return d3.tip
	    }
	  } else {
	    // Browser global.
	    root.d3.tip = factory(root.d3)
	  }
	}(this, function (d3) {
	
	  // Public - contructs a new tooltip
	  //
	  // Returns a tip
	  return function() {
	    var direction = d3_tip_direction,
	        offset    = d3_tip_offset,
	        html      = d3_tip_html,
	        node      = initNode(),
	        svg       = null,
	        point     = null,
	        target    = null
	
	    function tip(vis) {
	      svg = getSVGNode(vis)
	      point = svg.createSVGPoint()
	      document.body.appendChild(node)
	    }
	
	    // Public - show the tooltip on the screen
	    //
	    // Returns a tip
	    tip.show = function() {
	      var args = Array.prototype.slice.call(arguments)
	      if(args[args.length - 1] instanceof SVGElement) target = args.pop()
	
	      var content = html.apply(this, args),
	          poffset = offset.apply(this, args),
	          dir     = direction.apply(this, args),
	          nodel   = getNodeEl(),
	          i       = directions.length,
	          coords,
	          scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
	          scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
	
	      nodel.html(content)
	        .style({ opacity: 1, 'pointer-events': 'all' })
	
	      while(i--) nodel.classed(directions[i], false)
	      coords = direction_callbacks.get(dir).apply(this)
	      nodel.classed(dir, true).style({
	        top: (coords.top +  poffset[0]) + scrollTop + 'px',
	        left: (coords.left + poffset[1]) + scrollLeft + 'px'
	      })
	
	      return tip
	    }
	
	    // Public - hide the tooltip
	    //
	    // Returns a tip
	    tip.hide = function() {
	      var nodel = getNodeEl()
	      nodel.style({ opacity: 0, 'pointer-events': 'none' })
	      return tip
	    }
	
	    // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
	    //
	    // n - name of the attribute
	    // v - value of the attribute
	    //
	    // Returns tip or attribute value
	    tip.attr = function(n, v) {
	      if (arguments.length < 2 && typeof n === 'string') {
	        return getNodeEl().attr(n)
	      } else {
	        var args =  Array.prototype.slice.call(arguments)
	        d3.selection.prototype.attr.apply(getNodeEl(), args)
	      }
	
	      return tip
	    }
	
	    // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
	    //
	    // n - name of the property
	    // v - value of the property
	    //
	    // Returns tip or style property value
	    tip.style = function(n, v) {
	      if (arguments.length < 2 && typeof n === 'string') {
	        return getNodeEl().style(n)
	      } else {
	        var args =  Array.prototype.slice.call(arguments)
	        d3.selection.prototype.style.apply(getNodeEl(), args)
	      }
	
	      return tip
	    }
	
	    // Public: Set or get the direction of the tooltip
	    //
	    // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
	    //     sw(southwest), ne(northeast) or se(southeast)
	    //
	    // Returns tip or direction
	    tip.direction = function(v) {
	      if (!arguments.length) return direction
	      direction = v == null ? v : d3.functor(v)
	
	      return tip
	    }
	
	    // Public: Sets or gets the offset of the tip
	    //
	    // v - Array of [x, y] offset
	    //
	    // Returns offset or
	    tip.offset = function(v) {
	      if (!arguments.length) return offset
	      offset = v == null ? v : d3.functor(v)
	
	      return tip
	    }
	
	    // Public: sets or gets the html value of the tooltip
	    //
	    // v - String value of the tip
	    //
	    // Returns html value or tip
	    tip.html = function(v) {
	      if (!arguments.length) return html
	      html = v == null ? v : d3.functor(v)
	
	      return tip
	    }
	
	    // Public: destroys the tooltip and removes it from the DOM
	    //
	    // Returns a tip
	    tip.destroy = function() {
	      if(node) {
	        getNodeEl().remove();
	        node = null;
	      }
	      return tip;
	    }
	
	    function d3_tip_direction() { return 'n' }
	    function d3_tip_offset() { return [0, 0] }
	    function d3_tip_html() { return ' ' }
	
	    var direction_callbacks = d3.map({
	      n:  direction_n,
	      s:  direction_s,
	      e:  direction_e,
	      w:  direction_w,
	      nw: direction_nw,
	      ne: direction_ne,
	      sw: direction_sw,
	      se: direction_se
	    }),
	
	    directions = direction_callbacks.keys()
	
	    function direction_n() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.n.y - node.offsetHeight,
	        left: bbox.n.x - node.offsetWidth / 2
	      }
	    }
	
	    function direction_s() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.s.y,
	        left: bbox.s.x - node.offsetWidth / 2
	      }
	    }
	
	    function direction_e() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.e.y - node.offsetHeight / 2,
	        left: bbox.e.x
	      }
	    }
	
	    function direction_w() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.w.y - node.offsetHeight / 2,
	        left: bbox.w.x - node.offsetWidth
	      }
	    }
	
	    function direction_nw() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.nw.y - node.offsetHeight,
	        left: bbox.nw.x - node.offsetWidth
	      }
	    }
	
	    function direction_ne() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.ne.y - node.offsetHeight,
	        left: bbox.ne.x
	      }
	    }
	
	    function direction_sw() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.sw.y,
	        left: bbox.sw.x - node.offsetWidth
	      }
	    }
	
	    function direction_se() {
	      var bbox = getScreenBBox()
	      return {
	        top:  bbox.se.y,
	        left: bbox.e.x
	      }
	    }
	
	    function initNode() {
	      var node = d3.select(document.createElement('div'))
	      node.style({
	        position: 'absolute',
	        top: 0,
	        opacity: 0,
	        'pointer-events': 'none',
	        'box-sizing': 'border-box'
	      })
	
	      return node.node()
	    }
	
	    function getSVGNode(el) {
	      el = el.node()
	      if(el.tagName.toLowerCase() === 'svg')
	        return el
	
	      return el.ownerSVGElement
	    }
	
	    function getNodeEl() {
	      if(node === null) {
	        node = initNode();
	        // re-add node to DOM
	        document.body.appendChild(node);
	      };
	      return d3.select(node);
	    }
	
	    // Private - gets the screen coordinates of a shape
	    //
	    // Given a shape on the screen, will return an SVGPoint for the directions
	    // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
	    // sw(southwest).
	    //
	    //    +-+-+
	    //    |   |
	    //    +   +
	    //    |   |
	    //    +-+-+
	    //
	    // Returns an Object {n, s, e, w, nw, sw, ne, se}
	    function getScreenBBox() {
	      var targetel   = target || d3.event.target;
	
	      while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
	          targetel = targetel.parentNode;
	      }
	
	      var bbox       = {},
	          matrix     = targetel.getScreenCTM(),
	          tbbox      = targetel.getBBox(),
	          width      = tbbox.width,
	          height     = tbbox.height,
	          x          = tbbox.x,
	          y          = tbbox.y
	
	      point.x = x
	      point.y = y
	      bbox.nw = point.matrixTransform(matrix)
	      point.x += width
	      bbox.ne = point.matrixTransform(matrix)
	      point.y += height
	      bbox.se = point.matrixTransform(matrix)
	      point.x -= width
	      bbox.sw = point.matrixTransform(matrix)
	      point.y -= height / 2
	      bbox.w  = point.matrixTransform(matrix)
	      point.x += width
	      bbox.e = point.matrixTransform(matrix)
	      point.x -= width / 2
	      point.y -= height / 2
	      bbox.n = point.matrixTransform(matrix)
	      point.y += height
	      bbox.s = point.matrixTransform(matrix)
	
	      return bbox
	    }
	
	    return tip
	  };
	
	}));


/***/ }

})
});
;
//# sourceMappingURL=D3P.InteractiveViewer.js.map