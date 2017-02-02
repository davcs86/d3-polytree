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

	module.exports = __webpack_require__(923);


/***/ },

/***/ 852:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['zoomScroll'],
	  zoomScroll: ['type', __webpack_require__(853)]
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
	
	ZoomScroll.$inject = ['zoom'];
	
	module.exports = ZoomScroll;


/***/ },

/***/ 854:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['mouseEvents'],
	  mouseEvents: ['type', __webpack_require__(855)],
	  __depends__: [
	    __webpack_require__(740)
	  ]
	};


/***/ },

/***/ 855:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(551),
	  getLocalName = __webpack_require__(809);
	
	/**
	 * MouseEvents description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventEmitter} eventBus
	 */
	
	function MouseEvents(eventBus) {
	  
	  this._eventBus = eventBus;
	  this._init();
	}
	
	MouseEvents.$inject = [
	  'eventBus'
	];
	
	module.exports = MouseEvents;
	
	MouseEvents.prototype._addListeners = function (element, definition) {
	  var type = getLocalName(definition),
	    that = this
	  ;
	  d3.select(element.node().parentNode).on('mouseenter', function () {
	    that._eventBus.emit(type + '.mouseenter', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('mouseover', function () {
	    that._eventBus.emit(type + '.mouseover', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('mousedown', function () {
	    that._eventBus.emit(type + '.mousedown', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('mouseup', function () {
	    that._eventBus.emit(type + '.mouseup', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('click', function () {
	    that._eventBus.emit(type + '.click', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('dblclick', function () {
	    that._eventBus.emit(type + '.dblclick', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('mouseleave', function () {
	    that._eventBus.emit(type + '.mouseleave', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('mouseout', function () {
	    that._eventBus.emit(type + '.mouseout', element, definition, d3.event);
	  });
	  d3.select(element.node().parentNode).on('contextmenu', function () {
	    that._eventBus.emit(type + '.contextmenu', element, definition, d3.event);
	  });
	};
	
	MouseEvents.prototype._init = function () {
	  var that = this;
	  this._eventBus.on('label.created', function () {
	    that._addListeners.apply(that, arguments);
	  });
	  this._eventBus.on('link.created', function () {
	    that._addListeners.apply(that, arguments);
	  });
	  this._eventBus.on('node.created', function () {
	    that._addListeners.apply(that, arguments);
	  });
	  this._eventBus.on('zone.created', function () {
	    that._addListeners.apply(that, arguments);
	  });
	};

/***/ },

/***/ 860:
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];
	
		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
	
		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },

/***/ 861:
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];
	
	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();
	
		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}
	
	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}
	
	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}
	
	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	var replaceText = (function () {
		var textStore = [];
	
		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}
	
	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}
	
		var blob = new Blob([css], { type: "text/css" });
	
		var oldSrc = linkElement.href;
	
		linkElement.href = URL.createObjectURL(blob);
	
		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },

/***/ 923:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  Viewer = __webpack_require__(3).Viewer;
	
	/**
	 * A viewer that includes user interactions
	 *
	 * @param {Object} options
	 */
	function InteractiveViewer(options) {
	  Viewer.call(this, options);
	}
	
	inherits(InteractiveViewer, Viewer);
	
	module.exports = {
	  InteractiveViewer: InteractiveViewer
	};
	
	InteractiveViewer.prototype._interactionModules = [
	  __webpack_require__(852),
	  __webpack_require__(854),
	  __webpack_require__(924)
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ },

/***/ 924:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['tooltip'],
	  tooltip: ['type', __webpack_require__(925)],
	  __depends__: [
	    //
	  ]
	};

/***/ },

/***/ 925:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(551),
	  _d3tip = __webpack_require__(926),
	  _tooltip = null,
	  isFunction = __webpack_require__(560).isFunction
	;
	
	__webpack_require__(927);
	
	/**
	 * The tooltip functionality.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Function} tooltip
	 * @param {Canvas} canvas
	 * @param {EventEmitter} eventBus
	 */
	function Tooltip(tooltip, canvas, eventBus) {
	  if (isFunction(tooltip)) {
	    _tooltip = _d3tip(d3)
	      .attr('class', 'd3-tip')
	      .offset([-10, 0])
	      .html(function () {
	        return tooltip.apply(this, arguments);
	      });
	    
	    canvas.getSVG().call(_tooltip);
	    
	    eventBus.on('node.mouseover', function () {
	      // show tooltip on nodes
	      var zoom = canvas.getTransform().a;
	      if (zoom < 0.8) {
	        _tooltip.show.apply(this, arguments);
	      }
	    });
	    eventBus.on('node.mouseout', function () {
	      _tooltip.hide();
	    });
	  }
	}
	
	Tooltip.$inject = [
	  'd3polytree.options.tooltip',
	  'canvas',
	  'eventBus'
	];
	
	module.exports = Tooltip;

/***/ },

/***/ 926:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// d3.tip
	// Copyright (c) 2013 Justin Palmer
	//
	// Tooltips for d3.js SVG visualizations
	
	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module with d3 as a dependency.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(551)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else if (typeof module === 'object' && module.exports) {
	    // CommonJS
	    var d3 = require('d3')
	    module.exports = factory(d3)
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
	        .style('opacity', 1).style('pointer-events', 'all')
	
	      while(i--) nodel.classed(directions[i], false)
	      coords = direction_callbacks.get(dir).apply(this)
	      nodel.classed(dir, true)
	      	.style('top', (coords.top +  poffset[0]) + scrollTop + 'px')
	      	.style('left', (coords.left + poffset[1]) + scrollLeft + 'px')
	
	      return tip;
	    };
	
	    // Public - hide the tooltip
	    //
	    // Returns a tip
	    tip.hide = function() {
	      var nodel = getNodeEl()
	      nodel.style('opacity', 0).style('pointer-events', 'none')
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
	        var args = Array.prototype.slice.call(arguments)
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
	      direction = v == null ? v : functor(v)
	
	      return tip
	    }
	
	    // Public: Sets or gets the offset of the tip
	    //
	    // v - Array of [x, y] offset
	    //
	    // Returns offset or
	    tip.offset = function(v) {
	      if (!arguments.length) return offset
	      offset = v == null ? v : functor(v)
	
	      return tip
	    }
	
	    // Public: sets or gets the html value of the tooltip
	    //
	    // v - String value of the tip
	    //
	    // Returns html value or tip
	    tip.html = function(v) {
	      if (!arguments.length) return html
	      html = v == null ? v : functor(v)
	
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
	      var node = d3.select(document.createElement('div'));
	      node.style('position', 'absolute').style('top', 0).style('opacity', 0)
	      	.style('pointer-events', 'none').style('box-sizing', 'border-box')
	
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
	    
	    // Private - replace D3JS 3.X d3.functor() function
	    function functor(v) {
	    	return typeof v === "function" ? v : function() {
	        return v
	    	}
	    }
	
	    return tip
	  };
	
	}));


/***/ },

/***/ 927:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(928);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(861)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./../../../node_modules/sass-loader/index.js!./style.scss", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./../../../node_modules/sass-loader/index.js!./style.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 928:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".d3-tip {\n  line-height: 1;\n  font-weight: bold;\n  padding: 12px;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  border-radius: 2px;\n  pointer-events: none; }\n\n/* Creates a small triangle extender for the tooltip */\n.d3-tip:after {\n  box-sizing: border-box;\n  display: inline;\n  font-size: 10px;\n  width: 100%;\n  line-height: 1;\n  color: rgba(0, 0, 0, 0.8);\n  position: absolute;\n  pointer-events: none; }\n\n/* Northward tooltips */\n.d3-tip.n:after {\n  content: \"\\25BC\";\n  margin: -1px 0 0 0;\n  top: 100%;\n  left: 0;\n  text-align: center; }\n\n/* Eastward tooltips */\n.d3-tip.e:after {\n  content: \"\\25C0\";\n  margin: -4px 0 0 0;\n  top: 50%;\n  left: -8px; }\n\n/* Southward tooltips */\n.d3-tip.s:after {\n  content: \"\\25B2\";\n  margin: 0 0 1px 0;\n  top: -8px;\n  left: 0;\n  text-align: center; }\n\n/* Westward tooltips */\n.d3-tip.w:after {\n  content: \"\\25B6\";\n  margin: -4px 0 0 -1px;\n  top: 50%;\n  left: 100%; }\n", ""]);
	
	// exports


/***/ }

})
});
;
//# sourceMappingURL=D3P.InteractiveViewer.js.map