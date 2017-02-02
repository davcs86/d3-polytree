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
	
	/**
	 *
	 * D3-based node directed network modeler.
	 *
	 * @license MIT
	 * @author David Castillo <davcs86@gmail.com>
	 *
	 */
	
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
	
	Editor.prototype.createDiagram = function () {
	  return this.importDiagram(this.initialDiagram);
	};
	
	Editor.prototype._interactionModules = [
	  __webpack_require__(852),
	  __webpack_require__(854)
	];
	
	Editor.prototype._editionModules = [
	  __webpack_require__(856),
	  __webpack_require__(868),
	  __webpack_require__(901),
	  __webpack_require__(906),
	  __webpack_require__(908),
	  __webpack_require__(910)
	];
	
	Editor.prototype._modules = [].concat(
	  Editor.prototype._modules,
	  Editor.prototype._interactionModules,
	  Editor.prototype._editionModules
	);
	
	Editor.prototype.initialDiagram = '<?xml version="1.0" encoding="UTF-8"?>' +
	  '<pfdn:diagram xmlns:pfdn="http://pfdn">' +
	  '<settings>' +
	  '    <author>No Author</author>' +
	  '    <name>No Name Diagram</name>' +
	  '    <zoom>' +
	  '        <offset x="0" y="0" />' +
	  '        <scale>1</scale>' +
	  '    </zoom>' +
	  '    <grid />' +
	  '</settings>' +
	  '<node id="node_1" label="label_1">' +
	  '    <position x="20" y="100" />' +
	  '</node>' +
	  '<label id="label_1" fontSize="12">' +
	  '    <position x="33" y="140" />' +
	  '    <text>Node 1</text>' +
	  '</label>' +
	  '</pfdn:diagram>';

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

/***/ 856:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['drag'],
	  drag: ['type', __webpack_require__(857)],
	  __depends__: [
	    __webpack_require__(862),
	    __webpack_require__(866)
	  ]
	};


/***/ },

/***/ 857:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(551),
	  forIn = __webpack_require__(6).forIn,
	  getLocalName = __webpack_require__(809);
	
	__webpack_require__(858);
	
	/**
	 * Drag description
	 *
	 * @class
	 * @constructor
	 *
	 * @param canvas
	 * @param {EventEmitter} eventBus
	 * @param elementRegistry
	 * @param selection
	 */
	
	function Drag(canvas, eventBus, elementRegistry, selection) {
	  
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	  this._elementRegistry = elementRegistry;
	  this._selection = selection;
	  
	  this._init();
	}
	
	Drag.$inject = [
	  'canvas',
	  'eventBus',
	  'elementRegistry',
	  'selection'
	];
	
	module.exports = Drag;
	
	Drag.prototype._applyOffset = function (elem, def, dX, dY) {
	  var x = (elem.attr('x') * 1.0) + dX,
	    y = (elem.attr('y') * 1.0) + dY,
	    translate = 'translate(' + x + ',' + y + ')';
	  elem
	    .attr('x', x)
	    .attr('y', y)
	    .attr('transform', translate);
	  // update business object
	  def.position.x = x;
	  def.position.y = y;
	  this._eventBus.emit(getLocalName(def) + ".moved", elem, def);
	};
	
	Drag.prototype._applyOffsetToSelected = function (dX, dY) {
	  var that = this;
	  forIn(this._selection._currentSelection, function (v) {
	    that._applyOffset(d3.select(v.element.node().parentNode), v.definition, dX, dY);
	  });
	};
	
	Drag.prototype._setElemToDrag = function (element) {
	  var that = this;
	  d3.select(element.node().parentNode).call(
	    d3.drag()
	      .on('start', function () {
	        if (!that._canvas.getRootLayer().classed('no-drag')) {
	          that._canvas.getRootLayer().classed('cursor-grabbing', true);
	          d3.event
	            .on('end', function () {
	              that._canvas.getRootLayer().classed('cursor-grabbing', false);
	            })
	            .on('drag', function () {
	              that._applyOffsetToSelected(d3.event.dx, d3.event.dy);
	            });
	        }
	      })
	  );
	};
	
	Drag.prototype._init = function () {
	  var that = this;
	  // set to drag outlined elements
	  this._eventBus.on('outline.created', function (element, definition) {
	    if (getLocalName(definition) !== 'link') {
	      that._setElemToDrag.apply(that, arguments);
	    }
	  });
	};

/***/ },

/***/ 858:
[929, 859],

/***/ 859:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".cursor-grabbing {\n  cursor: move; }\n", ""]);
	
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
	
	var d3 = __webpack_require__(551),
	  forEach = __webpack_require__(744).forEach,
	  getLocalName = __webpack_require__(809);
	
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
	
	Outline.prototype._getElemBBox = function (element) {
	  return element.node().getBBox();
	};
	
	Outline.prototype._createOutline = function (element, definition) {
	  // add the outline to every node created
	  var that = this,
	    type = getLocalName(definition),
	    elemSize = this._getElemBBox(element);
	  if (type === 'link'){
	    var x = Infinity,
	      y = Infinity;
	    forEach(definition.waypoint, function(v){
	      x = Math.min(x, v.x);
	      y = Math.min(y, v.y);
	    });
	  }
	  var outline = d3.select(element.node().parentNode)
	      .append('rect')
	      .attr('class', 'element-outline')
	      .attr('x', function () {
	        var rt = 0;
	        if (type === 'label') {
	          rt = elemSize.width / -2.0;
	        } else if (type === 'link') {
	          rt = x;
	        }
	        return rt;
	      })
	      .attr('y', function () {
	        var rt = 0;
	        if (type === 'label') {
	          rt = elemSize.height / -1.33333333;
	        } else if (type === 'link') {
	          rt = y;
	        }
	        return rt;
	      })
	      .attr('fill', 'none')
	      .attr('stroke', 'red')
	      .attr('stroke-width', 0)
	      .attr('stroke-dasharray', '3')
	      .attr('width', elemSize.width + 6)
	      .attr('height', elemSize.height + 6);
	  that._eventBus.emit('outline.created', element, definition, outline);
	};
	
	Outline.prototype._init = function () {
	  var that = this;
	  this._eventBus.on('node.created', function () {
	    that._createOutline.apply(that, arguments);
	  });
	  this._eventBus.on('label.created', function () {
	    that._createOutline.apply(that, arguments);
	  });
	  this._eventBus.on('zone.created', function () {
	    that._createOutline.apply(that, arguments);
	  });
	  this._eventBus.on('link.created', function () {
	    that._createOutline.apply(that, arguments);
	  });
	};

/***/ },

/***/ 864:
[929, 865],

/***/ 865:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".element > .element-outline {\n  stroke-width: 0; }\n\n.element.selected > .element-outline, .element:hover > .element-outline {\n  stroke-width: 1px; }\n", ""]);
	
	// exports


/***/ },

/***/ 866:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['selection'],
	  selection: ['type', __webpack_require__(867)],
	  __depends__: [
	    //
	  ]
	};


/***/ },

/***/ 867:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(551),
	  forIn = __webpack_require__(6).forIn,
	  valuesIn = __webpack_require__(6).valuesIn,
	  getLocalName = __webpack_require__(809);
	
	/**
	 * Selection description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventEmitter} eventBus
	 * @param {Canvas} canvas
	 * @param {ElementRegistry} elementRegistry
	 */
	
	function Selection(eventBus, canvas, elementRegistry) {
	  
	  this._eventBus = eventBus;
	  this._canvas = canvas;
	  this._elementRegistry = elementRegistry;
	  this._currentSelection = {};
	  
	  this._init();
	}
	
	Selection.$inject = [
	  'eventBus',
	  'canvas',
	  'elementRegistry'
	];
	
	module.exports = Selection;
	
	Selection.prototype._unSelectElement = function (element, definition) {
	  delete this._currentSelection[definition.id];
	  d3.select(element.node().parentNode).classed('selected', false);
	};
	
	Selection.prototype._selectElement = function (element, definition, event) {
	  if (!event.ctrlKey) {
	    // overwrite the selected elements with the clicked element
	    this._unSelectAllElements();
	  }
	  // append the clicked element to the selected elements
	  d3.select(element.node().parentNode).classed('selected', true);
	  this._currentSelection[definition.id] = {
	    element: element,
	    definition: definition
	  };
	};
	
	Selection.prototype._unSelectAllElements = function () {
	  var that = this;
	  forIn(this._currentSelection, function (v) {
	    that._unSelectElement(v.element, v.definition);
	  });
	};
	
	Selection.prototype.deleteSelected = function () {
	  var that = this;
	  forIn(this._currentSelection, function (v) {
	    that._unSelectElement(v.element, v.definition);
	    that._eventBus.emit(getLocalName(v.definition) + '.deleted', v.element, v.definition);
	  });
	};
	
	Selection.prototype.getSelectedElements = function () {
	  return valuesIn(this._currentSelection);
	};
	
	Selection.prototype._init = function () {
	  var that = this;
	  this._eventBus.on('label.mousedown', function () {
	    that._selectElement.apply(that, arguments);
	  });
	  this._eventBus.on('link.mousedown', function () {
	    that._selectElement.apply(that, arguments);
	  });
	  this._eventBus.on('node.mousedown', function () {
	    that._selectElement.apply(that, arguments);
	  });
	  this._eventBus.on('zone.mousedown', function () {
	    that._selectElement.apply(that, arguments);
	  });
	  //TODO: Fix when user clicks the canvas, un-select all elements.
	};

/***/ },

/***/ 868:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['palette'],
	  palette: ['type', __webpack_require__(869)],
	  __depends__: [
	    __webpack_require__(887)
	  ]
	};


/***/ },

/***/ 869:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isFunction = __webpack_require__(560).isFunction,
	  forIn = __webpack_require__(6).forIn,
	  domify = __webpack_require__(870),
	  domQuery = __webpack_require__(4),
	  domAttr = __webpack_require__(872),
	  domClear = __webpack_require__(873),
	  domClasses = __webpack_require__(874),
	  domDelegate = __webpack_require__(877),
	  domEvent = __webpack_require__(618)
	;
	
	__webpack_require__(881);
	__webpack_require__(883);
	__webpack_require__(885);
	
	/**
	 * Palette description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Canvas} canvas
	 */
	
	function Palette(canvas, selection, paletteProvider) {
	  
	  this._canvas = canvas;
	  this._selection = selection;
	  this._paletteContainer = null;
	  this._paletteProvider = paletteProvider;
	  
	  this._init();
	}
	
	Palette.$inject = [
	  'canvas',
	  'selection',
	  'paletteProvider'
	];
	
	module.exports = Palette;
	
	Palette.prototype._drawContainer = function () {
	  var container = this._canvas.getContainer();
	  
	  this._paletteContainer = domify(Palette.HTML_MARKUP);
	  
	  container.insertBefore(this._paletteContainer, container.childNodes[0]);
	  
	  this._entriesContainer = domQuery('.pfdjs-entries', this._paletteContainer);
	  
	};
	
	Palette.prototype._deactivateTools = function () {
	  var tools = this._tools = this._paletteProvider.getPaletteTools();
	  forIn(this._tools, function(v){
	    v.deactivate.call(v);
	  });
	};
	
	Palette.prototype._createDelegates = function () {
	  var that = this;
	  
	  domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'click', function (event) {
	    that.trigger('click', event);
	    event.stopImmediatePropagation();
	  });
	  
	  // // prevent drag propagation
	  domEvent.bind(this._paletteContainer, 'mousedown', function(event) {
	    that._deactivateTools();
	  });
	  //
	  // // prevent drag propagation
	  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'dragstart', function(event) {
	  //   var rects = event.delegateTarget.getBoundingClientRect();
	  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
	  //   event.delta = {x: 0, y: 0};
	  //
	  //   that.trigger('dragstart', event);
	  // });
	  //
	  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'dragend', function(event) {
	  //   var rects = {left: event.pageX, top: event.pageY};
	  //   event.delta = {x: rects.left - lastPosition.x, y: rects.top - lastPosition.y};
	  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
	  //
	  //   that.trigger('dragend', event);
	  // });
	  //
	  // domDelegate.bind(this._paletteContainer, '.pfdjs-entry', 'drag', function(event) {
	  //   var rects = {left: event.pageX, top: event.pageY};
	  //   event.delta = {x: rects.left - lastPosition.x, y: rects.top - lastPosition.y};
	  //   event.lastPosition = lastPosition = {x: rects.left, y: rects.top };
	  //
	  //   that.trigger('drag', event);
	  // });
	  
	};
	
	Palette.prototype.trigger = function (action, event) {
	  var entries = this._actions,
	    entry,
	    handler,
	    originalEvent,
	    button = event.delegateTarget || event.target;
	  
	  this._deactivateTools();
	  
	  if (!button) {
	    return event.preventDefault();
	  }
	  
	  entry = entries[domAttr(button, 'data-action')];
	  
	  // when user clicks on the palette and not on an action
	  if (!entry) {
	    return;
	  }
	  
	  handler = entry.action;
	  
	  originalEvent = event.originalEvent || event;
	  
	  // simple action (via callback function)
	  if (isFunction(handler)) {
	    if (action === 'click') {
	      handler(originalEvent);
	    }
	  } else {
	    if (handler[action]) {
	      handler[action](originalEvent);
	    }
	  }
	  
	  // if was click or drag finished, silence other actions
	  if (action === 'click' || action === 'dragend') {
	    event.preventDefault();
	  }
	};
	
	Palette.prototype._drawEntry = function (entry, id) {
	  
	  var grouping = entry.group || 'default';
	  
	  var container = domQuery('[data-group=' + grouping + ']', this._entriesContainer);
	  if (!container) {
	    container = domify('<div class="pfdjs-entries-group" data-group="' + grouping + '"></div>');
	    this._entriesContainer.appendChild(container);
	  }
	  var html = entry.html || '<div class="pfdjs-entry"></div>';
	  
	  var control = domify(html);
	  container.appendChild(control);
	  
	  domAttr(control, 'data-action', id);
	  
	  if (entry.title) {
	    domAttr(control, 'title', entry.title);
	  }
	  
	  if (entry.className) {
	    domClasses(control).add(entry.className);
	  }
	  
	  if (entry.iconClassName) {
	    control.appendChild(domify('<span class="' + entry.iconClassName + '"/>'));
	  }
	  
	};
	
	Palette.prototype._drawEntries = function () {
	  var that = this,
	    actions = this._actions = this._paletteProvider.getPaletteEntries();
	  forIn(actions, function (action, id) {
	    that._drawEntry.call(that, action, id);
	  });
	};
	
	Palette.prototype._update = function () {
	  if (this._paletteEntries) {
	    domClear(this._paletteEntries);
	  }
	  this._drawEntries();
	};
	
	Palette.prototype._init = function () {
	  this._drawContainer();
	  this._update();
	  this._createDelegates();
	};
	
	/* markup definition */
	
	Palette.HTML_MARKUP =
	  '<div class="pfdjs-palette">' +
	  '  <div class="pfdjs-entries">' +
	  '  </div>' +
	  '</div>';

/***/ },

/***/ 870:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(871);

/***/ },

/***/ 871:
/***/ function(module, exports) {

	
	/**
	 * Expose `parse`.
	 */
	
	module.exports = parse;
	
	/**
	 * Tests for browser support.
	 */
	
	var innerHTMLBug = false;
	var bugTestDiv;
	if (typeof document !== 'undefined') {
	  bugTestDiv = document.createElement('div');
	  // Setup
	  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
	  // Make sure that link elements get serialized correctly by innerHTML
	  // This requires a wrapper element in IE
	  innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
	  bugTestDiv = undefined;
	}
	
	/**
	 * Wrap map from jquery.
	 */
	
	var map = {
	  legend: [1, '<fieldset>', '</fieldset>'],
	  tr: [2, '<table><tbody>', '</tbody></table>'],
	  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	  // for script/link/style tags to work in IE6-8, you have to wrap
	  // in a div with a non-whitespace character in front, ha!
	  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
	};
	
	map.td =
	map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];
	
	map.option =
	map.optgroup = [1, '<select multiple="multiple">', '</select>'];
	
	map.thead =
	map.tbody =
	map.colgroup =
	map.caption =
	map.tfoot = [1, '<table>', '</table>'];
	
	map.polyline =
	map.ellipse =
	map.polygon =
	map.circle =
	map.text =
	map.line =
	map.path =
	map.rect =
	map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];
	
	/**
	 * Parse `html` and return a DOM Node instance, which could be a TextNode,
	 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
	 * instance, depending on the contents of the `html` string.
	 *
	 * @param {String} html - HTML string to "domify"
	 * @param {Document} doc - The `document` instance to create the Node for
	 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
	 * @api private
	 */
	
	function parse(html, doc) {
	  if ('string' != typeof html) throw new TypeError('String expected');
	
	  // default to the global `document` object
	  if (!doc) doc = document;
	
	  // tag name
	  var m = /<([\w:]+)/.exec(html);
	  if (!m) return doc.createTextNode(html);
	
	  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace
	
	  var tag = m[1];
	
	  // body support
	  if (tag == 'body') {
	    var el = doc.createElement('html');
	    el.innerHTML = html;
	    return el.removeChild(el.lastChild);
	  }
	
	  // wrap map
	  var wrap = map[tag] || map._default;
	  var depth = wrap[0];
	  var prefix = wrap[1];
	  var suffix = wrap[2];
	  var el = doc.createElement('div');
	  el.innerHTML = prefix + html + suffix;
	  while (depth--) el = el.lastChild;
	
	  // one element
	  if (el.firstChild == el.lastChild) {
	    return el.removeChild(el.firstChild);
	  }
	
	  // several elements
	  var fragment = doc.createDocumentFragment();
	  while (el.firstChild) {
	    fragment.appendChild(el.removeChild(el.firstChild));
	  }
	
	  return fragment;
	}


/***/ },

/***/ 872:
/***/ function(module, exports) {

	/**
	 * Set attribute `name` to `val`, or get attr `name`.
	 *
	 * @param {Element} el
	 * @param {String} name
	 * @param {String} [val]
	 * @api public
	 */
	
	module.exports = function(el, name, val) {
	  // get
	  if (arguments.length == 2) {
	    return el.getAttribute(name);
	  }
	
	  // remove
	  if (val === null) {
	    return el.removeAttribute(name);
	  }
	
	  // set
	  el.setAttribute(name, val);
	
	  return el;
	};

/***/ },

/***/ 873:
/***/ function(module, exports) {

	module.exports = function(el) {
	
	  var c;
	
	  while (el.childNodes.length) {
	    c = el.childNodes[0];
	    el.removeChild(c);
	  }
	
	  return el;
	};

/***/ },

/***/ 874:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(875);

/***/ },

/***/ 875:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var index = __webpack_require__(876);
	} catch (err) {
	  var index = __webpack_require__(876);
	}
	
	/**
	 * Whitespace regexp.
	 */
	
	var re = /\s+/;
	
	/**
	 * toString reference.
	 */
	
	var toString = Object.prototype.toString;
	
	/**
	 * Wrap `el` in a `ClassList`.
	 *
	 * @param {Element} el
	 * @return {ClassList}
	 * @api public
	 */
	
	module.exports = function(el){
	  return new ClassList(el);
	};
	
	/**
	 * Initialize a new ClassList for `el`.
	 *
	 * @param {Element} el
	 * @api private
	 */
	
	function ClassList(el) {
	  if (!el || !el.nodeType) {
	    throw new Error('A DOM element reference is required');
	  }
	  this.el = el;
	  this.list = el.classList;
	}
	
	/**
	 * Add class `name` if not already present.
	 *
	 * @param {String} name
	 * @return {ClassList}
	 * @api public
	 */
	
	ClassList.prototype.add = function(name){
	  // classList
	  if (this.list) {
	    this.list.add(name);
	    return this;
	  }
	
	  // fallback
	  var arr = this.array();
	  var i = index(arr, name);
	  if (!~i) arr.push(name);
	  this.el.className = arr.join(' ');
	  return this;
	};
	
	/**
	 * Remove class `name` when present, or
	 * pass a regular expression to remove
	 * any which match.
	 *
	 * @param {String|RegExp} name
	 * @return {ClassList}
	 * @api public
	 */
	
	ClassList.prototype.remove = function(name){
	  if ('[object RegExp]' == toString.call(name)) {
	    return this.removeMatching(name);
	  }
	
	  // classList
	  if (this.list) {
	    this.list.remove(name);
	    return this;
	  }
	
	  // fallback
	  var arr = this.array();
	  var i = index(arr, name);
	  if (~i) arr.splice(i, 1);
	  this.el.className = arr.join(' ');
	  return this;
	};
	
	/**
	 * Remove all classes matching `re`.
	 *
	 * @param {RegExp} re
	 * @return {ClassList}
	 * @api private
	 */
	
	ClassList.prototype.removeMatching = function(re){
	  var arr = this.array();
	  for (var i = 0; i < arr.length; i++) {
	    if (re.test(arr[i])) {
	      this.remove(arr[i]);
	    }
	  }
	  return this;
	};
	
	/**
	 * Toggle class `name`, can force state via `force`.
	 *
	 * For browsers that support classList, but do not support `force` yet,
	 * the mistake will be detected and corrected.
	 *
	 * @param {String} name
	 * @param {Boolean} force
	 * @return {ClassList}
	 * @api public
	 */
	
	ClassList.prototype.toggle = function(name, force){
	  // classList
	  if (this.list) {
	    if ("undefined" !== typeof force) {
	      if (force !== this.list.toggle(name, force)) {
	        this.list.toggle(name); // toggle again to correct
	      }
	    } else {
	      this.list.toggle(name);
	    }
	    return this;
	  }
	
	  // fallback
	  if ("undefined" !== typeof force) {
	    if (!force) {
	      this.remove(name);
	    } else {
	      this.add(name);
	    }
	  } else {
	    if (this.has(name)) {
	      this.remove(name);
	    } else {
	      this.add(name);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return an array of classes.
	 *
	 * @return {Array}
	 * @api public
	 */
	
	ClassList.prototype.array = function(){
	  var className = this.el.getAttribute('class') || '';
	  var str = className.replace(/^\s+|\s+$/g, '');
	  var arr = str.split(re);
	  if ('' === arr[0]) arr.shift();
	  return arr;
	};
	
	/**
	 * Check if class `name` is present.
	 *
	 * @param {String} name
	 * @return {ClassList}
	 * @api public
	 */
	
	ClassList.prototype.has =
	ClassList.prototype.contains = function(name){
	  return this.list
	    ? this.list.contains(name)
	    : !! ~index(this.array(), name);
	};


/***/ },

/***/ 876:
/***/ function(module, exports) {

	module.exports = function(arr, obj){
	  if (arr.indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};

/***/ },

/***/ 877:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(878);

/***/ },

/***/ 878:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var closest = __webpack_require__(879);
	} catch(err) {
	  var closest = __webpack_require__(879);
	}
	
	try {
	  var event = __webpack_require__(619);
	} catch(err) {
	  var event = __webpack_require__(619);
	}
	
	/**
	 * Delegate event `type` to `selector`
	 * and invoke `fn(e)`. A callback function
	 * is returned which may be passed to `.unbind()`.
	 *
	 * @param {Element} el
	 * @param {String} selector
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.bind = function(el, selector, type, fn, capture){
	  return event.bind(el, type, function(e){
	    var target = e.target || e.srcElement;
	    e.delegateTarget = closest(target, selector, true, el);
	    if (e.delegateTarget) fn.call(el, e);
	  }, capture);
	};
	
	/**
	 * Unbind event `type`'s callback `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @api public
	 */
	
	exports.unbind = function(el, type, fn, capture){
	  event.unbind(el, type, fn, capture);
	};


/***/ },

/***/ 879:
/***/ function(module, exports, __webpack_require__) {

	var matches = __webpack_require__(880)
	
	module.exports = function (element, selector, checkYoSelf, root) {
	  element = checkYoSelf ? {parentNode: element} : element
	
	  root = root || document
	
	  // Make sure `element !== document` and `element != null`
	  // otherwise we get an illegal invocation
	  while ((element = element.parentNode) && element !== document) {
	    if (matches(element, selector))
	      return element
	    // After `matches` on the edge case that
	    // the selector matches the root
	    // (when the root is not the document)
	    if (element === root)
	      return
	  }
	}


/***/ },

/***/ 880:
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var query = __webpack_require__(5);
	} catch (err) {
	  var query = __webpack_require__(5);
	}
	
	/**
	 * Element prototype.
	 */
	
	var proto = Element.prototype;
	
	/**
	 * Vendor function.
	 */
	
	var vendor = proto.matches
	  || proto.webkitMatchesSelector
	  || proto.mozMatchesSelector
	  || proto.msMatchesSelector
	  || proto.oMatchesSelector;
	
	/**
	 * Expose `match()`.
	 */
	
	module.exports = match;
	
	/**
	 * Match `el` to `selector`.
	 *
	 * @param {Element} el
	 * @param {String} selector
	 * @return {Boolean}
	 * @api public
	 */
	
	function match(el, selector) {
	  if (!el || el.nodeType !== 1) return false;
	  if (vendor) return vendor.call(el, selector);
	  var nodes = query.all(selector, el.parentNode);
	  for (var i = 0; i < nodes.length; ++i) {
	    if (nodes[i] == el) return true;
	  }
	  return false;
	}


/***/ },

/***/ 881:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(882);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(861)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./pfdn-font-embedded.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./pfdn-font-embedded.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 882:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, "/*@font-face {*/\r\n  /*font-family: 'pfdn-font';*/\r\n  /*src: url('../font/pfdn-font.eot?66654889');*/\r\n  /*src: url('../font/pfdn-font.eot?66654889#iefix') format('embedded-opentype'),*/\r\n       /*url('../font/pfdn-font.svg?66654889#pfdn-font') format('svg');*/\r\n  /*font-weight: normal;*/\r\n  /*font-style: normal;*/\r\n/*}*/\r\n@font-face {\r\n  font-family: 'pfdn-font';\r\n  src: url('data:application/octet-stream;base64,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') format('woff'),\r\n       url('data:application/octet-stream;base64,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') format('truetype');\r\n}\r\n/* Chrome hack: SVG is rendered more smooth in Windozze. 100% magic, uncomment if you need it. */\r\n/* Note, that will break hinting! In other OS-es font will be not as sharp as it could be */\r\n/*\r\n@media screen and (-webkit-min-device-pixel-ratio:0) {\r\n  @font-face {\r\n    font-family: 'pfdn-font';\r\n    src: url('../font/pfdn-font.svg?66654889#pfdn-font') format('svg');\r\n  }\r\n}\r\n*/\r\n \r\n [class^=\"icon-\"]:before, [class*=\" icon-\"]:before {\r\n  font-family: \"pfdn-font\";\r\n  font-style: normal;\r\n  font-weight: normal;\r\n  speak: none;\r\n \r\n  display: inline-block;\r\n  text-decoration: inherit;\r\n  width: 1em;\r\n  margin-right: .2em;\r\n  text-align: center;\r\n  /* opacity: .8; */\r\n \r\n  /* For safety - reset parent styles, that can break glyph codes*/\r\n  font-variant: normal;\r\n  text-transform: none;\r\n     \r\n  /* fix buttons height, for twitter bootstrap */\r\n  line-height: 1em;\r\n \r\n  /* Animation center compensation - margins should be symmetric */\r\n  /* remove if not needed */\r\n  margin-left: .2em;\r\n \r\n  /* you can be more comfortable with increased icons size */\r\n  /* font-size: 120%; */\r\n \r\n  /* Uncomment for 3D effect */\r\n  /* text-shadow: 1px 1px 1px rgba(127, 127, 127, 0.3); */\r\n}\r\n.icon-cog-outline:before { content: '\\E800'; } /* '' */\r\n.icon-cross:before { content: '\\E801'; } /* '' */\r\n.icon-download:before { content: '\\E802'; } /* '' */\r\n.icon-arrow:before { content: '\\E803'; } /* '' */\r\n.icon-trash:before { content: '\\E804'; } /* '' */\r\n.icon-text:before { content: '\\E805'; } /* '' */\r\n.icon-selection:before { content: '\\E806'; } /* '' */\r\n.icon-image:before { content: '\\E807'; } /* '' */\r\n.icon-glass:before { content: '\\E808'; } /* '' */\r\n.icon-grid:before { content: '\\E809'; } /* '' */\r\n.icon-doc:before { content: '\\E80A'; } /* '' */\r\n.icon-floppy:before { content: '\\E80B'; } /* '' */\r\n.icon-target:before { content: '\\E80C'; } /* '' */\r\n.icon-check-empty:before { content: '\\F096'; } /* '' */\r\n.icon-angle-double-left:before { content: '\\F100'; } /* '' */\r\n.icon-angle-double-right:before { content: '\\F101'; } /* '' */\r\n.icon-angle-double-up:before { content: '\\F102'; } /* '' */\r\n.icon-angle-double-down:before { content: '\\F103'; } /* '' */\r\n.icon-folder-open-empty:before { content: '\\F115'; } /* '' */\r\n.icon-mouse-pointer:before { content: '\\F245'; } /* '' */", ""]);
	
	// exports


/***/ },

/***/ 883:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(884);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(861)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js!./pfdn-font-ie7-codes.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js!./pfdn-font-ie7-codes.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 884:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, "\r\n.icon-cog-outline { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe800;&nbsp;'); }\r\n.icon-cross { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe801;&nbsp;'); }\r\n.icon-download { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe802;&nbsp;'); }\r\n.icon-arrow { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe803;&nbsp;'); }\r\n.icon-trash { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe804;&nbsp;'); }\r\n.icon-text { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe805;&nbsp;'); }\r\n.icon-selection { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe806;&nbsp;'); }\r\n.icon-image { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe807;&nbsp;'); }\r\n.icon-glass { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe808;&nbsp;'); }\r\n.icon-grid { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe809;&nbsp;'); }\r\n.icon-doc { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe80a;&nbsp;'); }\r\n.icon-floppy { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe80b;&nbsp;'); }\r\n.icon-target { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xe80c;&nbsp;'); }\r\n.icon-check-empty { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf096;&nbsp;'); }\r\n.icon-angle-double-left { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf100;&nbsp;'); }\r\n.icon-angle-double-right { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf101;&nbsp;'); }\r\n.icon-angle-double-up { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf102;&nbsp;'); }\r\n.icon-angle-double-down { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf103;&nbsp;'); }\r\n.icon-folder-open-empty { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf115;&nbsp;'); }\r\n.icon-mouse-pointer { *zoom: expression( this.runtimeStyle['zoom'] = '1', this.innerHTML = '&#xf245;&nbsp;'); }", ""]);
	
	// exports


/***/ },

/***/ 885:
[929, 886],

/***/ 886:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".pfdjs-palette {\n  position: absolute;\n  margin: 6px;\n  padding: 3px 6px;\n  background: #fafafa;\n  border: solid 1px #cccccc;\n  border-radius: 2px;\n  box-shadow: 0 1px 1px 0px rgba(0, 0, 0, 0.3);\n  z-index: 1; }\n  .pfdjs-palette .pfdjs-entries .pfdjs-entries-group {\n    margin-bottom: 3px;\n    margin-top: 3px;\n    height: 26px;\n    float: left; }\n    .pfdjs-palette .pfdjs-entries .pfdjs-entries-group .pfdjs-entry {\n      float: left;\n      width: 24px;\n      color: #333333;\n      padding: 3px;\n      font-size: 20px;\n      cursor: pointer; }\n      .pfdjs-palette .pfdjs-entries .pfdjs-entries-group .pfdjs-entry:hover {\n        color: rgba(255, 72, 0, 0.79); }\n  .pfdjs-palette .pfdjs-entries .pfdjs-entries-group:not(:last-of-type) {\n    border-right: 1px solid #cccccc;\n    padding-right: 8px; }\n", ""]);
	
	// exports


/***/ },

/***/ 887:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['paletteProvider'],
	  paletteProvider: ['type', __webpack_require__(888)],
	  __depends__: [
	    __webpack_require__(889),
	    __webpack_require__(893),
	    __webpack_require__(895)
	  ]
	};


/***/ },

/***/ 888:
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * PaletteProvider description
	 *
	 * @class
	 * @constructor
	 *
	 * @param d3polytree
	 * @param {EventEmitter} eventBus
	 * @param elementRegistry
	 * @param localStorage
	 * @param uploader
	 * @param exporting
	 * @param axes
	 * @param selection
	 * @param addNodeHandler
	 * @param addLabelHandler
	 * @param addLinkTool
	 */
	
	function PaletteProvider(d3polytree,
	                         eventBus,
	                         elementRegistry,
	                         localStorage,
	                         uploader,
	                         exporting,
	                         axes,
	                         selection,
	                         addNodeHandler,
	                         addLabelHandler,
	                         addLinkTool) {
	  
	  this._d3polytree = d3polytree;
	  this._eventBus = eventBus;
	  this._elementRegistry = elementRegistry;
	  this._localStorage = localStorage;
	  this._uploader = uploader;
	  this._exporting = exporting;
	  this._axes = axes;
	  this._selection = selection;
	  this._addNodeHandler = addNodeHandler;
	  this._addLabelHandler = addLabelHandler;
	  this._tools = {
	    addLinkTool
	  };
	}
	
	PaletteProvider.$inject = [
	  'd3polytree',
	  'eventBus',
	  'elementRegistry',
	  'localStorage',
	  'upload',
	  'exporting',
	  'axes',
	  'selection',
	  'addNodeHandler',
	  'addLabelHandler',
	  'addLinkTool'
	];
	
	module.exports = PaletteProvider;
	
	PaletteProvider.prototype.getPaletteTools = function () {
	  return this._tools;
	};
	
	PaletteProvider.prototype.getPaletteEntries = function () {
	  var that = this,
	    actions = {
	      'new': {
	        title: 'New diagram',
	        group: 'file-ops',
	        iconClassName: 'icon-doc',
	        action: {
	          click: function () {
	            that._d3polytree.createDiagram();
	          }
	        },
	      },
	      'save': {
	        title: 'Save diagram',
	        group: 'file-ops',
	        iconClassName: 'icon-floppy',
	        action: {
	          click: function () {
	            that._localStorage.save();
	          }
	        }
	      },
	      'open': {
	        title: 'Open diagram',
	        group: 'file-ops',
	        iconClassName: 'icon-folder-open-empty',
	        action: {
	          click: function () {
	            that._uploader.openDialog();
	          }
	        },
	      },
	      'download': {
	        title: 'Download diagram',
	        group: 'file-ops',
	        iconClassName: 'icon-download',
	        action: {
	          click: function () {
	            that._exporting.trigger('pfdn');
	          }
	        },
	      },
	      'export-svg': {
	        title: 'Download as SVG image',
	        group: 'file-ops',
	        iconClassName: 'icon-image',
	        action: {
	          click: function () {
	            that._exporting.trigger('svg');
	          }
	        },
	      },
	      'search': {
	        title: 'Search item',
	        group: 'utils',
	        iconClassName: 'icon-glass',
	        action: {
	          click: function () {
	            console.log('click button');
	          }
	        },
	      },
	      'delete-item': {
	        title: 'Delete selected item(s)',
	        group: 'utils',
	        iconClassName: 'icon-trash',
	        action: {
	          click: function () {
	            that._selection.deleteSelected();
	          }
	        },
	      },
	      'toggle-grid': {
	        title: 'Show/hide grid',
	        group: 'utils',
	        iconClassName: 'icon-grid',
	        action: {
	          click: function () {
	            that._axes.toggleVisible();
	          }
	        },
	      },
	      'new-connection': {
	        title: 'New connection',
	        group: 'drawing',
	        iconClassName: 'icon-arrow',
	        action: {
	          click: function () {
	            that._tools.addLinkTool.activate();
	          }
	        },
	      },
	      'new-label': {
	        title: 'New label',
	        group: 'drawing',
	        iconClassName: 'icon-text',
	        action: {
	          click: function () {
	            that._addLabelHandler.append();
	          }
	        },
	      },
	      'new-node': {
	        title: 'New node',
	        group: 'drawing',
	        iconClassName: 'icon-check-empty',
	        action: {
	          click: function () {
	            that._addNodeHandler.append();
	          }
	        },
	      },
	      'settings': {
	        title: 'Settings',
	        group: 'settings',
	        iconClassName: 'icon-cog-outline',
	        action: {
	          click: function () {
	            console.log('click button');
	          },
	          dragstart: function () {
	            console.log('drag button');
	          },
	        },
	      }
	    };
	  
	  return actions;
	};

/***/ },

/***/ 889:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['addNodeHandler'],
	  addNodeHandler: ['type', __webpack_require__(890)],
	  __depends__: [
	    //
	  ]
	};


/***/ },

/***/ 890:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  baseAddHandler = __webpack_require__(891);
	
	function AddNodeHandler(elementRegistry, selection, canvas, modelling, moddle, nodes) {
	  baseAddHandler.call(this, 'node', elementRegistry, selection, canvas, modelling);
	  this._moddle = moddle;
	  this._nodes = nodes;
	}
	
	AddNodeHandler.$inject = [
	  'elementRegistry',
	  'selection',
	  'canvas',
	  'modelling',
	  'd3polytree.moddle',
	  'nodes'
	];
	
	module.exports = AddNodeHandler;
	
	inherits(AddNodeHandler, baseAddHandler);


/***/ },

/***/ 891:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(892);

/***/ },

/***/ 892:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(551),
	  valuesIn = __webpack_require__(6).valuesIn,
	  isUndefined = __webpack_require__(560).isUndefined;
	
	function BaseAddHandler(className, elementRegistry, selection, canvas, modelling) {
	  this._className = className;
	  this._elementRegistry = elementRegistry;
	  this._selection = selection;
	  this._canvas = canvas;
	  this._modelling = modelling;
	}
	
	module.exports = BaseAddHandler;
	
	BaseAddHandler.prototype._getElemOfReference = function () {
	  var elements = valuesIn(this._elementRegistry.getAll()),
	    pointOfRef = false;
	  
	  if (elements.length > 0) {
	    pointOfRef = d3.select(elements[0].node().parentNode);
	  } else {
	    pointOfRef = this._canvas.getDrawingLayer();
	  }
	  
	  return pointOfRef;
	};
	
	BaseAddHandler.prototype._calculatePosition = function () {
	  var elemOfRef = this._getElemOfReference(),
	    position = this._canvas.getContainer().getBoundingClientRect(),
	    dLayerRect = elemOfRef.node().getBoundingClientRect(),
	    elemOfRefTransform = this._canvas.getTransform(elemOfRef),
	    canvasTransform = this._canvas.getTransform(),
	    translateX = elemOfRefTransform.e,
	    translateY = elemOfRefTransform.f,
	    scale = canvasTransform.a;
	  
	  return {
	    x: -1.0 * (dLayerRect.left - (translateX * scale) - (position.left + (position.width / 2))) / scale,
	    y: -1.0 * (dLayerRect.top - (translateY * scale) - (position.top + (position.height / 2))) / scale
	  };
	};
	
	BaseAddHandler.prototype._create = function () {
	  return this._modelling.doAction(this._className, 'create', [].slice.call(arguments));
	};
	
	BaseAddHandler.prototype.append = function (parameters) {
	  parameters = isUndefined(parameters) ? {} : parameters;
	  parameters.position = this._calculatePosition();
	  var newElementDef = this._create(parameters),
	    newElement = this._elementRegistry.get(newElementDef.id);
	  // select it
	  this._selection._selectElement(newElement, newElementDef, {});
	};

/***/ },

/***/ 893:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['addLabelHandler'],
	  addLabelHandler: ['type', __webpack_require__(894)],
	  __depends__: [
	    //
	  ]
	};


/***/ },

/***/ 894:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  baseAddHandler = __webpack_require__(891);
	
	function AddLabelHandler(elementRegistry, selection, canvas, modelling, moddle, labels) {
	  baseAddHandler.call(this, 'label', elementRegistry, selection, canvas, modelling);
	  this._moddle = moddle;
	  this._labels = labels;
	}
	
	AddLabelHandler.$inject = [
	  'elementRegistry',
	  'selection',
	  'canvas',
	  'modelling',
	  'd3polytree.moddle',
	  'labels'
	];
	
	module.exports = AddLabelHandler;
	
	inherits(AddLabelHandler, baseAddHandler);


/***/ },

/***/ 895:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['addLinkTool'],
	  addLinkTool: ['type', __webpack_require__(896)],
	  __depends__: [
	    //
	  ]
	};


/***/ },

/***/ 896:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Promise = __webpack_require__(244).Promise,
	  inherits = __webpack_require__(2),
	  ITool = __webpack_require__(897),
	  d3 = __webpack_require__(551);
	
	__webpack_require__(899);
	
	function AddLinkTool(eventBus, elementRegistry, selection, drag, canvas, modelling) {
	  ITool.call(this);
	  this._eventBus = eventBus;
	  this._elementRegistry = elementRegistry;
	  this._selection = selection;
	  this._drag = drag;
	  this._canvas = canvas;
	  this._modelling = modelling;
	  
	  this._selectedNodes = [];
	  this._fakeLink = this._canvas.getDrawingLayer()
	    .insert('path', '.node') // send under the nodes layer
	    .attr('class', 'fake-link')
	    .attr('d', 'M0,0L0,0')
	    .style('stroke', 'black')
	    .style('fill', 'none');
	}
	
	AddLinkTool.$inject = [
	  'eventBus',
	  'elementRegistry',
	  'selection',
	  'drag',
	  'canvas',
	  'modelling'
	];
	
	module.exports = AddLinkTool;
	
	inherits(AddLinkTool, ITool);
	
	AddLinkTool.prototype._registerEvent = function () {
	  var that = this;
	  this._eventBus.once('node.mousedown', 100, function (element, definition, event) {
	    if (!that.active) return;
	    return Promise(function (resolve, reject) {
	      event.stopImmediatePropagation();
	      reject();
	      if (that._selectedNodes.length === 0 ||
	        (that._selectedNodes.length === 1 && that._selectedNodes[0]['element'] !== element)) {
	        // set the selected node
	        that._selectedNodes.push({element, definition});
	      }
	      if (that._selectedNodes.length === 2) {
	        // create link
	        that._appendLink();
	        // deactivate
	        that.deactivate();
	      } else {
	        if (that._selectedNodes.length === 1) {
	          // append the fake link
	          that._showFakeLink();
	        }
	        // register event
	        that._registerEvent();
	      }
	    });
	  });
	};
	
	AddLinkTool.prototype._showFakeLink = function () {
	  // get the first node
	  var sourceElemDef = this._selectedNodes[0]['definition'],
	    x = sourceElemDef.position.x,
	    y = sourceElemDef.position.y;
	  
	  this._fakeLink
	    .attr('d', 'M' + x + ',' + y + 'L' + x + ',' + y);
	};
	
	AddLinkTool.prototype._resetFakeLink = function () {
	  // return to original position
	  this._fakeLink
	    .attr('d', 'M0,0L0,0');
	};
	
	AddLinkTool.prototype._registerMouseMoveEvent = function () {
	  var that = this;
	  this._canvas.getRootLayer().on('mousemove', function () {
	    if (!that.active) return;
	    if (that._selectedNodes.length === 1) {
	      // move the fake link
	      var sourceElemDef = that._selectedNodes[0]['definition'],
	        dL = that._canvas.getDrawingLayer().node(),
	        x = sourceElemDef.position.x + (sourceElemDef.size / 2),
	        y = sourceElemDef.position.y + (sourceElemDef.size / 2),
	        x1 = d3.mouse(dL)[0],
	        y1 = d3.mouse(dL)[1];
	      
	      that._fakeLink
	        .attr('d', 'M' + x + ',' + y + 'L' + x1 + ',' + y1);
	    }
	  });
	};
	
	AddLinkTool.prototype._appendLink = function () {
	  // create link
	  this._modelling.doAction(
	    'link',
	    'create',
	    [this._selectedNodes[0]['definition'], this._selectedNodes[1]['definition']]
	  );
	};
	
	AddLinkTool.prototype.deactivate = function () {
	  this.active = false;
	  // remove class
	  this._canvas.getRootLayer().classed('no-drag', false);
	  this._canvas.getRootLayer().classed('cursor-add-link', false);
	  // reset the fake link
	  this._resetFakeLink();
	};
	
	AddLinkTool.prototype.activate = function () {
	  this.active = true;
	  this._selectedNodes = [];
	  this._canvas.getRootLayer().classed('no-drag', true);
	  this._canvas.getRootLayer().classed('cursor-add-link', true);
	  this._registerMouseMoveEvent();
	  this._registerEvent();
	};
	


/***/ },

/***/ 897:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(898);

/***/ },

/***/ 898:
/***/ function(module, exports) {

	'use strict';
	
	function ITool() {
	}
	
	ITool.$inject = [
	];
	
	module.exports = ITool;
	
	ITool.prototype.activate = function(){
	  console.error('This method must be implemented');
	};
	
	ITool.prototype.deactivate = function(){
	  console.error('This method must be implemented');
	};

/***/ },

/***/ 899:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(900);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(861)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../../../node_modules/css-loader/index.js!./../../../../../node_modules/sass-loader/index.js!./style.scss", function() {
				var newContent = require("!!./../../../../../node_modules/css-loader/index.js!./../../../../../node_modules/sass-loader/index.js!./style.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 900:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(860)();
	// imports
	
	
	// module
	exports.push([module.id, ".cursor-add-link .zone, .cursor-add-link .label, .cursor-add-link .link {\n  opacity: 0.1; }\n\n.cursor-add-link .fake-link {\n  display: block; }\n\n.fake-link {\n  display: none; }\n", ""]);
	
	// exports


/***/ },

/***/ 901:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['localStorage'],
	  localStorage: ['type', __webpack_require__(902)],
	  __depends__: [
	    //''
	  ]
	};


/***/ },

/***/ 902:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var ls = __webpack_require__(903),
	  _done = false;
	
	/**
	 * LocalStorage description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventBus} eventBus
	 */
	
	function LocalStorage(eventBus, d3polytree) {
	  
	  this._eventBus = eventBus;
	  this._d3polytree = d3polytree;
	  
	  this._init();
	}
	
	LocalStorage.$inject = [
	  'eventBus',
	  'd3polytree'
	];
	
	module.exports = LocalStorage;
	
	LocalStorage.prototype.loadSaved = function () {
	  if (_done) {
	    return;
	  } else {
	    _done = true;
	  }
	  var diagram = ls('diagram');
	  if (!diagram) {
	    diagram = this._d3polytree.initialDiagram;
	  }
	  this._d3polytree.importDiagram(diagram);
	};
	
	LocalStorage.prototype._init = function () {
	  var that = this;
	  this._eventBus.once('diagram.ready', function () {
	    that.loadSaved.call(that);
	  });
	};
	
	LocalStorage.prototype.save = function () {
	  this._d3polytree.exportDiagram()
	    .then(function (diagram) {
	      ls('diagram', diagram);
	    });
	};


/***/ },

/***/ 903:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var stub = __webpack_require__(904);
	var tracking = __webpack_require__(905);
	var ls = 'localStorage' in global && global.localStorage ? global.localStorage : stub;
	
	function accessor (key, value) {
	  if (arguments.length === 1) {
	    return get(key);
	  }
	  return set(key, value);
	}
	
	function get (key) {
	  return JSON.parse(ls.getItem(key));
	}
	
	function set (key, value) {
	  try {
	    ls.setItem(key, JSON.stringify(value));
	    return true;
	  } catch (e) {
	    return false;
	  }
	}
	
	function remove (key) {
	  return ls.removeItem(key);
	}
	
	function clear () {
	  return ls.clear();
	}
	
	accessor.set = set;
	accessor.get = get;
	accessor.remove = remove;
	accessor.clear = clear;
	accessor.on = tracking.on;
	accessor.off = tracking.off;
	
	module.exports = accessor;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },

/***/ 904:
/***/ function(module, exports) {

	'use strict';
	
	var ms = {};
	
	function getItem (key) {
	  return key in ms ? ms[key] : null;
	}
	
	function setItem (key, value) {
	  ms[key] = value;
	  return true;
	}
	
	function removeItem (key) {
	  var found = key in ms;
	  if (found) {
	    return delete ms[key];
	  }
	  return false;
	}
	
	function clear () {
	  ms = {};
	  return true;
	}
	
	module.exports = {
	  getItem: getItem,
	  setItem: setItem,
	  removeItem: removeItem,
	  clear: clear
	};


/***/ },

/***/ 905:
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var listeners = {};
	var listening = false;
	
	function listen () {
	  if (global.addEventListener) {
	    global.addEventListener('storage', change, false);
	  } else if (global.attachEvent) {
	    global.attachEvent('onstorage', change);
	  } else {
	    global.onstorage = change;
	  }
	}
	
	function change (e) {
	  if (!e) {
	    e = global.event;
	  }
	  var all = listeners[e.key];
	  if (all) {
	    all.forEach(fire);
	  }
	
	  function fire (listener) {
	    listener(JSON.parse(e.newValue), JSON.parse(e.oldValue), e.url || e.uri);
	  }
	}
	
	function on (key, fn) {
	  if (listeners[key]) {
	    listeners[key].push(fn);
	  } else {
	    listeners[key] = [fn];
	  }
	  if (listening === false) {
	    listen();
	  }
	}
	
	function off (key, fn) {
	  var ns = listeners[key];
	  if (ns.length > 1) {
	    ns.splice(ns.indexOf(fn), 1);
	  } else {
	    listeners[key] = [];
	  }
	}
	
	module.exports = {
	  on: on,
	  off: off
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },

/***/ 906:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['upload'],
	  upload: ['type', __webpack_require__(907)],
	  __depends__: [
	    //''
	  ]
	};


/***/ },

/***/ 907:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var domify = __webpack_require__(870),
	  assign = __webpack_require__(6).assign,
	  domEvent = __webpack_require__(618)
	;
	
	/**
	 * Upload description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventBus} eventBus
	 */
	
	function Upload(canvas, d3polytree) {
	  
	  this._canvas = canvas;
	  this._d3polytree = d3polytree;
	  
	  this._init();
	}
	
	Upload.$inject = [
	  'canvas',
	  'd3polytree'
	];
	
	module.exports = Upload;
	
	Upload.prototype._init = function () {
	  var that = this,
	    container = this._canvas.getContainer();
	  
	  this._fileInput = domify('<input type="file" />');
	  
	  assign(this._fileInput.style, {
	    width: 1,
	    height: 1,
	    display: 'none',
	    overflow: 'hidden'
	  });
	  
	  container.insertBefore(this._fileInput, container.childNodes[0]);
	  
	  domEvent.bind(this._fileInput, 'change', function (e) {
	    that._openFile(e.target.files[0], that._openDiagram, that);
	  });
	  
	};
	
	Upload.prototype.openDialog = function () {
	  this._fileInput.click();
	};
	
	Upload.prototype._openDiagram = function (diagram) {
	  this._d3polytree.importDiagram(diagram);
	};
	
	Upload.prototype._openFile = function (file, callback, context) {
	  // check file api availability
	  if (!window.FileReader) {
	    return window.alert(
	      'Looks like you use an older browser that does not support upload. ' +
	      'Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.');
	  }
	  
	  // no file chosen
	  if (!file) {
	    return;
	  }
	  
	  var reader = new FileReader();
	  
	  reader.onload = function (e) {
	    var xml = e.target.result;
	    callback.call(context, xml);
	  };
	  
	  reader.readAsText(file);
	};

/***/ },

/***/ 908:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['exporting'],
	  exporting: ['type', __webpack_require__(909)],
	  __depends__: [
	    //''
	  ]
	};


/***/ },

/***/ 909:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var domify = __webpack_require__(870),
	  assign = __webpack_require__(6).assign
	;
	
	/**
	 * Exporting description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {d3polytree} d3polytree
	 */
	
	function Exporting(canvas, d3polytree) {
	  
	  this._canvas = canvas;
	  this._d3polytree = d3polytree;
	  this._init();
	  
	}
	
	Exporting.$inject = [
	  'canvas',
	  'd3polytree'
	];
	
	module.exports = Exporting;
	
	Exporting.prototype._encode = function (data) {
	  return 'data:application/xml;charset=UTF-8,' +
	    encodeURIComponent(data);
	};
	
	Exporting.prototype.trigger = function (fileType, options) {
	  var fn, that = this;
	  switch (fileType) {
	    case 'pfdn':
	      fn = this._d3polytree.exportDiagram;
	      break;
	    case 'svg':
	      fn = this._d3polytree.exportSVG;
	      break;
	    default:
	      throw new Error('Format not supported');
	  }
	  fn.call(this._d3polytree, options).then(function (str) {
	    that._exporter.setAttribute('href', that._encode(str));
	    that._exporter.setAttribute('download', 'diagram.' + fileType);
	    that._exporter.click();
	  }, function (e) {
	    throw new Error(e);
	  });
	};
	
	Exporting.prototype._init = function () {
	  var container = this._canvas.getContainer();
	  
	  this._exporter = domify('<a/>');
	  
	  assign(this._exporter.style, {
	    width: 1,
	    height: 1,
	    display: 'none',
	    overflow: 'hidden'
	  });
	  
	  container.insertBefore(this._exporter, container.childNodes[0]);
	};

/***/ },

/***/ 910:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['modelling'],
	  modelling: ['type', __webpack_require__(911)],
	  __depends__: [
	    __webpack_require__(912),
	    __webpack_require__(917),
	    __webpack_require__(919),
	    __webpack_require__(921),
	    __webpack_require__(740)
	  ]
	};
	


/***/ },

/***/ 911:
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Updates model
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventEmitter} eventBus
	 * @param {ModdleElement} definitions
	 * @param modellingNodes
	 * @param modellingLabels
	 * @param modellingZones
	 * @param modellingLinks
	 */
	
	function Modelling(eventBus, definitions, modellingNodes, modellingLabels, modellingZones, modellingLinks) {
	  this._eventBus = eventBus;
	  this._definitions = definitions;
	  
	  this._elements = {
	    'label': modellingLabels,
	    'node': modellingNodes,
	    'zone': modellingZones,
	    'link': modellingLinks,
	  };
	  
	  this._init();
	}
	
	module.exports = Modelling;
	
	Modelling.$inject = [
	  'eventBus',
	  'd3polytree.definitions',
	  'modellingNodes',
	  'modellingLabels',
	  'modellingZones',
	  'modellingLinks'
	];
	
	Modelling.prototype.doAction = function(elementClassName, action, parameters){
	  var actionElem = this._elements[elementClassName];
	  if (actionElem){
	    var actionFunc = actionElem[action];
	    if (actionFunc){
	      return actionFunc.apply(actionElem, parameters);
	    }
	  }
	  return null;
	};
	
	Modelling.prototype._init = function () {
	  var that = this;
	  
	  this._eventBus.on('label.created', function () {
	    that.doAction.apply(that, ['label', 'saveToModel', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('link.created', function () {
	    that.doAction.apply(that, ['link', 'saveToModel', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('node.created', function () {
	    that.doAction.apply(that, ['node', 'saveToModel', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('zone.created', function () {
	    that.doAction.apply(that, ['zone', 'saveToModel', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('label.deleted', function () {
	    that.doAction.apply(that, ['label', 'delete', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('link.deleted', function () {
	    that.doAction.apply(that, ['link', 'delete', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('node.deleted', function () {
	    console.log(arguments);
	    that.doAction.apply(that, ['node', 'delete', [].slice.call(arguments)]);
	  });
	  
	  this._eventBus.on('zone.deleted', function () {
	    that.doAction.apply(that, ['zone', 'delete', [].slice.call(arguments)]);
	  });
	};


/***/ },

/***/ 912:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['modellingLabels'],
	  modellingLabels: ['type', __webpack_require__(913)],
	  __depends__: [
	  ]
	};

/***/ },

/***/ 913:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  base = __webpack_require__(914),
	  isUndefined = __webpack_require__(560).isUndefined;
	
	function Labels(definitions, moddle, labels) {
	  base.call(this, definitions, labels);
	  this._moddle = moddle;
	  this._labels = labels;
	}
	
	Labels.$inject = [
	  'd3polytree.definitions',
	  'd3polytree.moddle',
	  'labels'
	];
	
	module.exports = Labels;
	
	inherits(Labels, base);
	
	Labels.prototype.create = function (parameters) {
	  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
	  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position),
	    newNodeDef = this._moddle.create('pfdn:Label', {position: newNodePosDef});
	  this._labels._builder(newNodeDef);
	  newNodeDef.set('text', newNodeDef.id);
	  // return the element
	  return newNodeDef;
	};

/***/ },

/***/ 914:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(915);


/***/ },

/***/ 915:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var getLocalName = __webpack_require__(809),
	  collections = __webpack_require__(916);
	
	/**
	 * Updates element's model
	 *
	 * @class
	 * @constructor
	 *
	 * @param {ModdleElement} definitions
	 */
	
	function Base(definitions, elements) {
	  this._definitions = definitions;
	  this._elements = elements;
	}
	
	module.exports = Base;
	
	Base.prototype.create = function () {
	  console.error('This method must be implemented');
	};
	
	Base.prototype.saveToModel = function (element, definition) {
	  var localName = getLocalName(definition);
	  collections.add(this._definitions.get(localName), definition);
	};
	
	Base.prototype.delete = function (element, definition) {
	  console.log(arguments);
	  var localName = getLocalName(definition);
	  collections.remove(this._definitions.get(localName), definition);
	  this._elements.removeElement.apply(this._elements, arguments);
	};

/***/ },

/***/ 916:
/***/ function(module, exports) {

	'use strict';
	
	// from https://github.com/bpmn-io/diagram-js/blob/master/lib/util/Collections.js (BPMN.io License)
	
	/**
	 * Failsafe remove an element from a collection
	 *
	 * @param  {Array<Object>} [collection]
	 * @param  {Object} [element]
	 *
	 * @return {Number} the previous index of the element
	 */
	module.exports.remove = function (collection, element) {
	  
	  if (!collection || !element) {
	    return -1;
	  }
	  
	  var idx = collection.indexOf(element);
	  
	  if (idx !== -1) {
	    collection.splice(idx, 1);
	  }
	  
	  return idx;
	};
	
	/**
	 * Fail save add an element to the given connection, ensuring
	 * it does not yet exist.
	 *
	 * @param {Array<Object>} collection
	 * @param {Object} element
	 * @param {Number} idx
	 */
	module.exports.add = function (collection, element, idx) {
	  
	  if (!collection || !element) {
	    return;
	  }
	  
	  if (typeof idx !== 'number') {
	    idx = -1;
	  }
	  
	  var currentIdx = collection.indexOf(element);
	  
	  if (currentIdx !== -1) {
	    
	    if (currentIdx === idx) {
	      // nothing to do, position has not changed
	      return;
	    } else {
	      
	      if (idx !== -1) {
	        // remove from current position
	        collection.splice(currentIdx, 1);
	      } else {
	        // already exists in collection
	        return;
	      }
	    }
	  }
	  
	  if (idx !== -1) {
	    // insert at specified position
	    collection.splice(idx, 0, element);
	  } else {
	    // push to end
	    collection.push(element);
	  }
	};
	
	
	/**
	 * Fail save get the index of an element in a collection.
	 *
	 * @param {Array<Object>} collection
	 * @param {Object} element
	 *
	 * @return {Number} the index or -1 if collection or element do
	 *                  not exist or the element is not contained.
	 */
	module.exports.indexOf = function (collection, element) {
	  
	  if (!collection || !element) {
	    return -1;
	  }
	  
	  return collection.indexOf(element);
	};

/***/ },

/***/ 917:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['modellingLinks'],
	  modellingLinks: ['type', __webpack_require__(918)],
	  __depends__: [
	  ]
	};

/***/ },

/***/ 918:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  base = __webpack_require__(914),
	  forEach = __webpack_require__(744).forEach;
	
	function Links(definitions, moddle, links, eventBus) {
	  base.call(this, definitions, links);
	  this._moddle = moddle;
	  this._links = links;
	  this._eventBus = eventBus;
	  this.init();
	}
	
	Links.$inject = [
	  'd3polytree.definitions',
	  'd3polytree.moddle',
	  'links',
	  'eventBus'
	];
	
	module.exports = Links;
	
	inherits(Links, base);
	
	Links.prototype.create = function (nodeADef, nodeBDef) {
	  var x = nodeADef.position.x + (nodeADef.size / 2),
	    y = nodeADef.position.y + (nodeADef.size / 2),
	    x1 = nodeBDef.position.x + (nodeBDef.size / 2),
	    y1 = nodeBDef.position.y + (nodeBDef.size / 2);
	  
	  var waypoint1 = this._moddle.create('pfdn:Coordinates', {x, y}),
	    waypoint2 = this._moddle.create('pfdn:Coordinates', {x: x1, y: y1}),
	    newLinkDef = this._moddle.create('pfdn:Link', {
	      source: nodeADef,
	      target: nodeBDef,
	      waypoint: [
	        waypoint1,
	        waypoint2
	      ]
	    });
	  this._links._builder(newLinkDef);
	  // return the element
	  return newLinkDef;
	};
	
	Links.prototype.init = function () {
	  var that = this;
	  this._eventBus.on('node.moved', function (element, definition) {
	    that.updateNodeLinks(element, definition);
	  });
	};
	
	Links.prototype.updateNodeLinks = function(element, definition){
	  // update the positions of the links related to the node.
	  console.log('updateNodeLinks');
	  var predecessorList = [],
	    sucessorList = [];
	  
	  forEach(this._links.getAll(), function(v){
	    console.log(v);
	    if (v.target === definition){
	      predecessorList.push({link: v, node: v.source});
	    }
	    if (v.source === definition){
	      sucessorList.push({link: v, node: v.target});
	    }
	  });
	  console.log(predecessorList);
	  console.log(sucessorList);
	  
	};


/***/ },

/***/ 919:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['modellingNodes'],
	  modellingNodes: ['type', __webpack_require__(920)],
	  __depends__: [
	  ]
	};

/***/ },

/***/ 920:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  base = __webpack_require__(914),
	  isUndefined = __webpack_require__(560).isUndefined;
	
	function Nodes(definitions, moddle, nodes) {
	  base.call(this, definitions, nodes);
	  this._moddle = moddle;
	  this._nodes = nodes;
	}
	
	Nodes.$inject = [
	  'd3polytree.definitions',
	  'd3polytree.moddle',
	  'nodes'
	];
	
	module.exports = Nodes;
	
	inherits(Nodes, base);
	
	Nodes.prototype.create = function (parameters) {
	  parameters.type = isUndefined(parameters.type) ? 'default' : parameters.type;
	  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
	  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position),
	    newNodeDef = this._moddle.create('pfdn:Node', {type: parameters.type, position: newNodePosDef});
	  this._nodes._builder(newNodeDef);
	  // return the element
	  return newNodeDef;
	};

/***/ },

/***/ 921:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['modellingZones'],
	  modellingZones: ['type', __webpack_require__(922)],
	  __depends__: [
	  ]
	};

/***/ },

/***/ 922:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var inherits = __webpack_require__(2),
	  base = __webpack_require__(914)//,
	  ;//isUndefined = require('lodash/lang').isUndefined;
	
	function Zones(definitions, moddle, zones) {
	  base.call(this, definitions, zones);
	  this._moddle = moddle;
	  this._zones = zones;
	}
	
	Zones.$inject = [
	  'd3polytree.definitions',
	  'd3polytree.moddle',
	  'zones'
	];
	
	module.exports = Zones;
	
	inherits(Zones, base);
	
	Zones.prototype.create = function () {
	  console.error("TODO: Do it!");
	};

/***/ },

/***/ 929:
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