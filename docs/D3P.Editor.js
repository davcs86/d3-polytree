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
	  __init__: ['drag'],
	  drag: ['type', __webpack_require__(857)],
	  __depends__: [
	    __webpack_require__(862)
	  ]
	};


/***/ },

/***/ 857:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(555);
	
	__webpack_require__(858);
	
	/**
	 * Drag description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventBus} eventBus
	 */
	
	function Drag(canvas, eventBus, elementRegistry) {
	
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	  this._elementRegistry = elementRegistry;
	
	  this._init();
	}
	
	Drag.$inject = [
	  'canvas',
	  'eventBus',
	  'elementRegistry'
	];
	
	module.exports = Drag;
	
	Drag.prototype._setElemToDrag = function(element){
	  var that = this;
	  d3.select(element.node().parentNode).call(
	    d3.drag()
	      .subject(function(def) {
	         return d3.select(that._elementRegistry.get(def.id).node().parentNode);
	      })
	      .on('start', function(){
	        d3.event.subject.classed('cursor-grabbing', true);
	      })
	      .on('end', function(){
	        d3.event.subject.classed('cursor-grabbing', false);
	      })
	      .on('drag', function(def){
	        var elem = d3.event.subject,
	          x = (elem.attr('x')*1.0) + d3.event.dx,
	          y = (elem.attr('y')*1.0) + d3.event.dy,
	          translate = 'translate('+x+','+y+')';
	        elem
	          .attr('x', x)
	          .attr('y', y)
	          .attr('transform', translate);
	        // update business object
	        def.position.x = x;
	        def.position.y = y;
	        //
	      })
	  );
	};
	
	Drag.prototype._init = function () {
	  // set to drag outlined elements
	  this._eventBus.on('outline.created', this._setElemToDrag, this);
	};

/***/ },

/***/ 858:
[872, 859],

/***/ 859:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".cursor-grabbing {\n  cursor: -webkit-grabbing;\n  cursor: -moz-grabbing;\n  cursor: grabbing; }\n", ""]);
	
	// exports


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

/***/ 862:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['outline'],
	  outline: ['type', __webpack_require__(863)],
	  __depends__: [
	    //''
	  ]
	};


/***/ },

/***/ 863:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(555);
	
	__webpack_require__(864);
	
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
	
	Outline.prototype._createOutline = function(element, definition){
	  // add the outline to every node created
	  var that = this,
	    type = definition.$descriptor.ns.localName.toLowerCase(),
	    elemSize = this._getElemBBox(element),
	    outline = d3.select(element.node().parentNode)
	      .append('rect')
	      .attr('class', 'element-outline')
	      .attr('x', function(){
	        return (type === 'label')? elemSize.width / -2 : 0;
	      })
	      .attr('y', function(){
	        return (type === 'label')? elemSize.height / -1.33333333 : 0;
	      })
	      .attr('fill', 'none')
	      .attr('stroke', 'red')
	      //.attr('stroke-width', '1px')
	      .attr('stroke-dasharray', '3')
	      .attr('width', elemSize.width + 6)
	      .attr('height', elemSize.height + 6);
	    that._eventBus.emit('outline.created', outline);
	};
	
	Outline.prototype._init = function () {
	  this._eventBus.on('node.created', this._createOutline, this);
	  this._eventBus.on('label.created', this._createOutline, this);
	  this._eventBus.on('zone.created', this._createOutline, this);
	};

/***/ },

/***/ 864:
[872, 865],

/***/ 865:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".element > .element-outline {\n  stroke-width: 0; }\n\n.element.selected > .element-outline, .element:hover > .element-outline {\n  stroke-width: 1px; }\n", ""]);
	
	// exports


/***/ },

/***/ 872:
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(__webpack_module_template_argument_0__);
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

/***/ }

})
});
;
//# sourceMappingURL=D3P.Editor.js.map