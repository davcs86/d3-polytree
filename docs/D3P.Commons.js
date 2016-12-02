/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonpD3P"];
/******/ 	window["webpackJsonpD3P"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		4:0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);
/******/
/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;
/******/
/******/ 			script.src = __webpack_require__.p + "" + chunkId + ".D3P." + ({"0":"Editor","1":"InteractiveViewer","2":"Viewer"}[chunkId]||chunkId) + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */,
/* 2 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var domQuery = __webpack_require__(4),
	  assign = __webpack_require__(6).assign,
	  omit = __webpack_require__(6).omit,
	  Deferred = __webpack_require__(244).defer,
	  Graph = __webpack_require__(247),
	  isString = __webpack_require__(255).isString,
	  eventListener = __webpack_require__(315),
	  //isNumber = require('lodash/lang').isNumber,
	  DEFAULT_OPTIONS = {
	    container: 'body'
	  };
	  //helper = require('./utils/helper');
	
	/**
	 * Ensure the passed argument is a proper unit (defaulting to px)
	 */
	// function ensureUnit(val) {
	//   return val + (isNumber(val) ? 'px' : '');
	// }
	
	function initListeners(graph, listeners) {
	  var events = graph.get('eventBus');
	
	  listeners.forEach(function(l) {
	    events.on(l.event, l.callback, l.that);
	  });
	}
	
	function Viewer(options) {
	  //var that = this;
	
	  this.options = options = assign({}, DEFAULT_OPTIONS, options || {});
	
	  var parent = options.container;
	
	  // support jquery element
	  // unwrap it if passed
	  if (parent.get) {
	    parent = parent.get(0);
	  }
	
	  // support selector
	  if (isString(parent)) {
	    parent = domQuery(parent);
	  }
	
	  assign(parent.style, {
	    position: 'relative'//,
	    //backgroundColor: options.bgColor
	  });
	
	  options.container = this.container = parent;
	
	}
	
	module.exports = {Viewer: Viewer};
	
	Viewer.prototype._init = function(graph) {
	  var that = this;
	  initListeners(graph, this.__listeners || []);
	  eventListener(window, 'resize', function(){
	    that.get('canvas').resized();
	  });
	};
	
	
	Viewer.prototype._createGraph = function(options) {
	
	  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);
	
	  // add self as an available service
	  modules.unshift({
	    polytree: [ 'value', this ]
	  });
	
	  options = omit(options, 'additionalModules');
	
	  this.options = options = assign(options, {
	    canvas: assign({}, options.canvas, { container: this.container }),
	    modules: modules
	  });
	
	  var graph = new Graph(options);
	  this._init(graph);
	  return graph;
	};
	
	Viewer.prototype.getModules = function() {
	  return this._modules;
	};
	
	/**
	 * Remove all drawn elements from the viewer.
	 *
	 * After calling this method the viewer can still
	 * be reused for opening another nodes.
	 */
	Viewer.prototype.clear = function() {
	  var graph = this.graph;
	  if (graph) {
	    graph.destroy();
	  }
	};
	
	/**
	 * Get a named graph service.
	 *
	 * @example
	 *
	 * @param {String} name
	 *
	 * @return {Object} graph service instance
	 */
	Viewer.prototype.get = function(name) {
	
	  if (!this.graph) {
	    throw new Error('no graph loaded');
	  }
	
	  return this.graph.get(name);
	};
	
	/**
	 * Import the diagram to draw.
	 *
	 * Once finished the viewer reports back the result to the
	 * provided callback function with (err, warnings).
	 *
	 * @param {Object} Javascript object with the diagram definitions.
	 */
	Viewer.prototype.importDiagram = function(definitions){
	  var that = this,
	    deferResponse = Deferred();
	  try {
	    if (this.graph) {
	      this.clear();
	    }
	
	    // create the moddle
	    //this.moddle = this._createModdle();
	
	    // import the definitions
	    this.moddle.fromXML(definitions, function(err, definitionsObj) {
	      if (err){
	        deferResponse.reject(err);
	        return;
	      }
	      that.definitions = definitionsObj;
	      that.graph = that._createGraph(that.options);
	      deferResponse.resolve();
	    });
	  } catch(e){
	    deferResponse.reject(e);
	  }
	  return deferResponse.promise;
	};
	
	/**
	 * Register an event listener on the viewer
	 *
	 * Remove a previously added listener via {@link #off(event, callback, context)}.
	 *
	 * @param {String} event
	 * @param {Function} callback
	 * @param {Object} [that] context
	 */
	Viewer.prototype.on = function(event, callback, that) {
	  var graph = this.graph,
	    listeners = this.__listeners = this.__listeners || [];
	
	  listeners.push({ event: event, callback: callback, that: that });
	
	  if (graph) {
	    return graph.get('eventBus').on(event, callback, that);
	  }
	};
	
	/**
	 * De-register an event callback
	 *
	 * @param {String} event
	 * @param {Function} callback
	 */
	Viewer.prototype.off = function(event, callback) {
	  var filter,
	    graph = this.graph;
	
	  if (callback) {
	    filter = function(l) {
	      return !(l.event === event && l.callback === callback);
	    };
	  } else {
	    filter = function(l) {
	      return l.event !== event;
	    };
	  }
	
	  this.__listeners = (this.__listeners || []).filter(filter);
	
	  if (graph) {
	    graph.get('eventBus').off(event, callback);
	  }
	};
	
	
	// modules the viewer is composed of
	Viewer.prototype._modules = [
	  __webpack_require__(316)
	];


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(5);

/***/ },
/* 5 */
/***/ function(module, exports) {

	function one(selector, el) {
	  return el.querySelector(selector);
	}
	
	exports = module.exports = function(selector, el){
	  el = el || document;
	  return one(selector, el);
	};
	
	exports.all = function(selector, el){
	  el = el || document;
	  return el.querySelectorAll(selector);
	};
	
	exports.engine = function(obj){
	  if (!obj.one) throw new Error('.one callback required');
	  if (!obj.all) throw new Error('.all callback required');
	  one = obj.one;
	  exports.all = obj.all;
	  return exports;
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  'assign': __webpack_require__(7),
	  'assignIn': __webpack_require__(58),
	  'assignInWith': __webpack_require__(62),
	  'assignWith': __webpack_require__(63),
	  'at': __webpack_require__(64),
	  'create': __webpack_require__(106),
	  'defaults': __webpack_require__(109),
	  'defaultsDeep': __webpack_require__(111),
	  'entries': __webpack_require__(135),
	  'entriesIn': __webpack_require__(146),
	  'extend': __webpack_require__(148),
	  'extendWith': __webpack_require__(149),
	  'findKey': __webpack_require__(150),
	  'findLastKey': __webpack_require__(177),
	  'forIn': __webpack_require__(180),
	  'forInRight': __webpack_require__(182),
	  'forOwn': __webpack_require__(183),
	  'forOwnRight': __webpack_require__(184),
	  'functions': __webpack_require__(185),
	  'functionsIn': __webpack_require__(188),
	  'get': __webpack_require__(66),
	  'has': __webpack_require__(189),
	  'hasIn': __webpack_require__(171),
	  'invert': __webpack_require__(191),
	  'invertBy': __webpack_require__(194),
	  'invoke': __webpack_require__(195),
	  'keys': __webpack_require__(41),
	  'keysIn': __webpack_require__(59),
	  'mapKeys': __webpack_require__(200),
	  'mapValues': __webpack_require__(201),
	  'merge': __webpack_require__(202),
	  'mergeWith': __webpack_require__(134),
	  'omit': __webpack_require__(203),
	  'omitBy': __webpack_require__(226),
	  'pick': __webpack_require__(231),
	  'pickBy': __webpack_require__(228),
	  'result': __webpack_require__(233),
	  'set': __webpack_require__(234),
	  'setWith': __webpack_require__(235),
	  'toPairs': __webpack_require__(136),
	  'toPairsIn': __webpack_require__(147),
	  'transform': __webpack_require__(236),
	  'unset': __webpack_require__(237),
	  'update': __webpack_require__(238),
	  'updateWith': __webpack_require__(240),
	  'values': __webpack_require__(241),
	  'valuesIn': __webpack_require__(243)
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var assignValue = __webpack_require__(8),
	    copyObject = __webpack_require__(26),
	    createAssigner = __webpack_require__(27),
	    isArrayLike = __webpack_require__(37),
	    isPrototype = __webpack_require__(40),
	    keys = __webpack_require__(41);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Assigns own enumerable string keyed properties of source objects to the
	 * destination object. Source objects are applied from left to right.
	 * Subsequent sources overwrite property assignments of previous sources.
	 *
	 * **Note:** This method mutates `object` and is loosely based on
	 * [`Object.assign`](https://mdn.io/Object/assign).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.10.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @see _.assignIn
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * function Bar() {
	 *   this.c = 3;
	 * }
	 *
	 * Foo.prototype.b = 2;
	 * Bar.prototype.d = 4;
	 *
	 * _.assign({ 'a': 0 }, new Foo, new Bar);
	 * // => { 'a': 1, 'c': 3 }
	 */
	var assign = createAssigner(function(object, source) {
	  if (isPrototype(source) || isArrayLike(source)) {
	    copyObject(source, keys(source), object);
	    return;
	  }
	  for (var key in source) {
	    if (hasOwnProperty.call(source, key)) {
	      assignValue(object, key, source[key]);
	    }
	  }
	});
	
	module.exports = assign;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    eq = __webpack_require__(25);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    baseAssignValue(object, key, value);
	  }
	}
	
	module.exports = assignValue;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var defineProperty = __webpack_require__(10);
	
	/**
	 * The base implementation of `assignValue` and `assignMergeValue` without
	 * value checks.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function baseAssignValue(object, key, value) {
	  if (key == '__proto__' && defineProperty) {
	    defineProperty(object, key, {
	      'configurable': true,
	      'enumerable': true,
	      'value': value,
	      'writable': true
	    });
	  } else {
	    object[key] = value;
	  }
	}
	
	module.exports = baseAssignValue;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11);
	
	var defineProperty = (function() {
	  try {
	    var func = getNative(Object, 'defineProperty');
	    func({}, '', {});
	    return func;
	  } catch (e) {}
	}());
	
	module.exports = defineProperty;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsNative = __webpack_require__(12),
	    getValue = __webpack_require__(24);
	
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}
	
	module.exports = getNative;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(13),
	    isMasked = __webpack_require__(21),
	    isObject = __webpack_require__(20),
	    toSource = __webpack_require__(23);
	
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	
	/** Used for built-in method references. */
	var funcProto = Function.prototype,
	    objectProto = Object.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}
	
	module.exports = baseIsNative;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObject = __webpack_require__(20);
	
	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}
	
	module.exports = isFunction;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15),
	    getRawTag = __webpack_require__(18),
	    objectToString = __webpack_require__(19);
	
	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';
	
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
	
	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  value = Object(value);
	  return (symToStringTag && symToStringTag in value)
	    ? getRawTag(value)
	    : objectToString(value);
	}
	
	module.exports = baseGetTag;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(16);
	
	/** Built-in value references. */
	var Symbol = root.Symbol;
	
	module.exports = Symbol;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var freeGlobal = __webpack_require__(17);
	
	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();
	
	module.exports = root;


/***/ },
/* 17 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
	
	module.exports = freeGlobal;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;
	
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
	
	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];
	
	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}
	
	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}
	
	module.exports = getRawTag;


/***/ },
/* 19 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;
	
	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}
	
	module.exports = objectToString;


/***/ },
/* 20 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}
	
	module.exports = isObject;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var coreJsData = __webpack_require__(22);
	
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());
	
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}
	
	module.exports = isMasked;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(16);
	
	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];
	
	module.exports = coreJsData;


/***/ },
/* 23 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var funcProto = Function.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}
	
	module.exports = toSource;


/***/ },
/* 24 */
/***/ function(module, exports) {

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}
	
	module.exports = getValue;


/***/ },
/* 25 */
/***/ function(module, exports) {

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}
	
	module.exports = eq;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var assignValue = __webpack_require__(8),
	    baseAssignValue = __webpack_require__(9);
	
	/**
	 * Copies properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Array} props The property identifiers to copy.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Function} [customizer] The function to customize copied values.
	 * @returns {Object} Returns `object`.
	 */
	function copyObject(source, props, object, customizer) {
	  var isNew = !object;
	  object || (object = {});
	
	  var index = -1,
	      length = props.length;
	
	  while (++index < length) {
	    var key = props[index];
	
	    var newValue = customizer
	      ? customizer(object[key], source[key], key, object, source)
	      : undefined;
	
	    if (newValue === undefined) {
	      newValue = source[key];
	    }
	    if (isNew) {
	      baseAssignValue(object, key, newValue);
	    } else {
	      assignValue(object, key, newValue);
	    }
	  }
	  return object;
	}
	
	module.exports = copyObject;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var baseRest = __webpack_require__(28),
	    isIterateeCall = __webpack_require__(36);
	
	/**
	 * Creates a function like `_.assign`.
	 *
	 * @private
	 * @param {Function} assigner The function to assign values.
	 * @returns {Function} Returns the new assigner function.
	 */
	function createAssigner(assigner) {
	  return baseRest(function(object, sources) {
	    var index = -1,
	        length = sources.length,
	        customizer = length > 1 ? sources[length - 1] : undefined,
	        guard = length > 2 ? sources[2] : undefined;
	
	    customizer = (assigner.length > 3 && typeof customizer == 'function')
	      ? (length--, customizer)
	      : undefined;
	
	    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
	      customizer = length < 3 ? undefined : customizer;
	      length = 1;
	    }
	    object = Object(object);
	    while (++index < length) {
	      var source = sources[index];
	      if (source) {
	        assigner(object, source, index, customizer);
	      }
	    }
	    return object;
	  });
	}
	
	module.exports = createAssigner;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(29),
	    overRest = __webpack_require__(30),
	    setToString = __webpack_require__(32);
	
	/**
	 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 */
	function baseRest(func, start) {
	  return setToString(overRest(func, start, identity), func + '');
	}
	
	module.exports = baseRest;


/***/ },
/* 29 */
/***/ function(module, exports) {

	/**
	 * This method returns the first argument it receives.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 *
	 * console.log(_.identity(object) === object);
	 * // => true
	 */
	function identity(value) {
	  return value;
	}
	
	module.exports = identity;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var apply = __webpack_require__(31);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * A specialized version of `baseRest` which transforms the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @param {Function} transform The rest array transform.
	 * @returns {Function} Returns the new function.
	 */
	function overRest(func, start, transform) {
	  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);
	
	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    index = -1;
	    var otherArgs = Array(start + 1);
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = transform(array);
	    return apply(func, this, otherArgs);
	  };
	}
	
	module.exports = overRest;


/***/ },
/* 31 */
/***/ function(module, exports) {

	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {Array} args The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  switch (args.length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}
	
	module.exports = apply;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var baseSetToString = __webpack_require__(33),
	    shortOut = __webpack_require__(35);
	
	/**
	 * Sets the `toString` method of `func` to return `string`.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var setToString = shortOut(baseSetToString);
	
	module.exports = setToString;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var constant = __webpack_require__(34),
	    defineProperty = __webpack_require__(10),
	    identity = __webpack_require__(29);
	
	/**
	 * The base implementation of `setToString` without support for hot loop shorting.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var baseSetToString = !defineProperty ? identity : function(func, string) {
	  return defineProperty(func, 'toString', {
	    'configurable': true,
	    'enumerable': false,
	    'value': constant(string),
	    'writable': true
	  });
	};
	
	module.exports = baseSetToString;


/***/ },
/* 34 */
/***/ function(module, exports) {

	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new constant function.
	 * @example
	 *
	 * var objects = _.times(2, _.constant({ 'a': 1 }));
	 *
	 * console.log(objects);
	 * // => [{ 'a': 1 }, { 'a': 1 }]
	 *
	 * console.log(objects[0] === objects[1]);
	 * // => true
	 */
	function constant(value) {
	  return function() {
	    return value;
	  };
	}
	
	module.exports = constant;


/***/ },
/* 35 */
/***/ function(module, exports) {

	/** Used to detect hot functions by number of calls within a span of milliseconds. */
	var HOT_COUNT = 800,
	    HOT_SPAN = 16;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeNow = Date.now;
	
	/**
	 * Creates a function that'll short out and invoke `identity` instead
	 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
	 * milliseconds.
	 *
	 * @private
	 * @param {Function} func The function to restrict.
	 * @returns {Function} Returns the new shortable function.
	 */
	function shortOut(func) {
	  var count = 0,
	      lastCalled = 0;
	
	  return function() {
	    var stamp = nativeNow(),
	        remaining = HOT_SPAN - (stamp - lastCalled);
	
	    lastCalled = stamp;
	    if (remaining > 0) {
	      if (++count >= HOT_COUNT) {
	        return arguments[0];
	      }
	    } else {
	      count = 0;
	    }
	    return func.apply(undefined, arguments);
	  };
	}
	
	module.exports = shortOut;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var eq = __webpack_require__(25),
	    isArrayLike = __webpack_require__(37),
	    isIndex = __webpack_require__(39),
	    isObject = __webpack_require__(20);
	
	/**
	 * Checks if the given arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
	 *  else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number'
	        ? (isArrayLike(object) && isIndex(index, object.length))
	        : (type == 'string' && index in object)
	      ) {
	    return eq(object[index], value);
	  }
	  return false;
	}
	
	module.exports = isIterateeCall;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(13),
	    isLength = __webpack_require__(38);
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}
	
	module.exports = isArrayLike;


/***/ },
/* 38 */
/***/ function(module, exports) {

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	module.exports = isLength;


/***/ },
/* 39 */
/***/ function(module, exports) {

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}
	
	module.exports = isIndex;


/***/ },
/* 40 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
	
	  return value === proto;
	}
	
	module.exports = isPrototype;


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var arrayLikeKeys = __webpack_require__(42),
	    baseKeys = __webpack_require__(55),
	    isArrayLike = __webpack_require__(37);
	
	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	
	module.exports = keys;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var baseTimes = __webpack_require__(43),
	    isArguments = __webpack_require__(44),
	    isArray = __webpack_require__(47),
	    isBuffer = __webpack_require__(48),
	    isIndex = __webpack_require__(39),
	    isTypedArray = __webpack_require__(51);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;
	
	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = arrayLikeKeys;


/***/ },
/* 43 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);
	
	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}
	
	module.exports = baseTimes;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsArguments = __webpack_require__(45),
	    isObjectLike = __webpack_require__(46);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};
	
	module.exports = isArguments;


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';
	
	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag;
	}
	
	module.exports = baseIsArguments;


/***/ },
/* 46 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}
	
	module.exports = isObjectLike;


/***/ },
/* 47 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	module.exports = isArray;


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var root = __webpack_require__(16),
	    stubFalse = __webpack_require__(50);
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
	
	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;
	
	module.exports = isBuffer;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(49)(module)))

/***/ },
/* 49 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 50 */
/***/ function(module, exports) {

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}
	
	module.exports = stubFalse;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsTypedArray = __webpack_require__(52),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	
	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	
	module.exports = isTypedArray;


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isLength = __webpack_require__(38),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;
	
	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}
	
	module.exports = baseIsTypedArray;


/***/ },
/* 53 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}
	
	module.exports = baseUnary;


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var freeGlobal = __webpack_require__(17);
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;
	
	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());
	
	module.exports = nodeUtil;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(49)(module)))

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var isPrototype = __webpack_require__(40),
	    nativeKeys = __webpack_require__(56);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = baseKeys;


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var overArg = __webpack_require__(57);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = overArg(Object.keys, Object);
	
	module.exports = nativeKeys;


/***/ },
/* 57 */
/***/ function(module, exports) {

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}
	
	module.exports = overArg;


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    createAssigner = __webpack_require__(27),
	    keysIn = __webpack_require__(59);
	
	/**
	 * This method is like `_.assign` except that it iterates over own and
	 * inherited source properties.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @alias extend
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @see _.assign
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * function Bar() {
	 *   this.c = 3;
	 * }
	 *
	 * Foo.prototype.b = 2;
	 * Bar.prototype.d = 4;
	 *
	 * _.assignIn({ 'a': 0 }, new Foo, new Bar);
	 * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
	 */
	var assignIn = createAssigner(function(object, source) {
	  copyObject(source, keysIn(source), object);
	});
	
	module.exports = assignIn;


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var arrayLikeKeys = __webpack_require__(42),
	    baseKeysIn = __webpack_require__(60),
	    isArrayLike = __webpack_require__(37);
	
	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
	}
	
	module.exports = keysIn;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20),
	    isPrototype = __webpack_require__(40),
	    nativeKeysIn = __webpack_require__(61);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeysIn(object) {
	  if (!isObject(object)) {
	    return nativeKeysIn(object);
	  }
	  var isProto = isPrototype(object),
	      result = [];
	
	  for (var key in object) {
	    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = baseKeysIn;


/***/ },
/* 61 */
/***/ function(module, exports) {

	/**
	 * This function is like
	 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * except that it includes inherited enumerable properties.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function nativeKeysIn(object) {
	  var result = [];
	  if (object != null) {
	    for (var key in Object(object)) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	module.exports = nativeKeysIn;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    createAssigner = __webpack_require__(27),
	    keysIn = __webpack_require__(59);
	
	/**
	 * This method is like `_.assignIn` except that it accepts `customizer`
	 * which is invoked to produce the assigned values. If `customizer` returns
	 * `undefined`, assignment is handled by the method instead. The `customizer`
	 * is invoked with five arguments: (objValue, srcValue, key, object, source).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @alias extendWith
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} sources The source objects.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 * @see _.assignWith
	 * @example
	 *
	 * function customizer(objValue, srcValue) {
	 *   return _.isUndefined(objValue) ? srcValue : objValue;
	 * }
	 *
	 * var defaults = _.partialRight(_.assignInWith, customizer);
	 *
	 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
	 * // => { 'a': 1, 'b': 2 }
	 */
	var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
	  copyObject(source, keysIn(source), object, customizer);
	});
	
	module.exports = assignInWith;


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    createAssigner = __webpack_require__(27),
	    keys = __webpack_require__(41);
	
	/**
	 * This method is like `_.assign` except that it accepts `customizer`
	 * which is invoked to produce the assigned values. If `customizer` returns
	 * `undefined`, assignment is handled by the method instead. The `customizer`
	 * is invoked with five arguments: (objValue, srcValue, key, object, source).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} sources The source objects.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 * @see _.assignInWith
	 * @example
	 *
	 * function customizer(objValue, srcValue) {
	 *   return _.isUndefined(objValue) ? srcValue : objValue;
	 * }
	 *
	 * var defaults = _.partialRight(_.assignWith, customizer);
	 *
	 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
	 * // => { 'a': 1, 'b': 2 }
	 */
	var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
	  copyObject(source, keys(source), object, customizer);
	});
	
	module.exports = assignWith;


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var baseAt = __webpack_require__(65),
	    flatRest = __webpack_require__(101);
	
	/**
	 * Creates an array of values corresponding to `paths` of `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.0.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {...(string|string[])} [paths] The property paths to pick.
	 * @returns {Array} Returns the picked values.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
	 *
	 * _.at(object, ['a[0].b.c', 'a[1]']);
	 * // => [3, 4]
	 */
	var at = flatRest(baseAt);
	
	module.exports = at;


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var get = __webpack_require__(66);
	
	/**
	 * The base implementation of `_.at` without support for individual paths.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {string[]} paths The property paths to pick.
	 * @returns {Array} Returns the picked elements.
	 */
	function baseAt(object, paths) {
	  var index = -1,
	      length = paths.length,
	      result = Array(length),
	      skip = object == null;
	
	  while (++index < length) {
	    result[index] = skip ? undefined : get(object, paths[index]);
	  }
	  return result;
	}
	
	module.exports = baseAt;


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(67);
	
	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	  var result = object == null ? undefined : baseGet(object, path);
	  return result === undefined ? defaultValue : result;
	}
	
	module.exports = get;


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var castPath = __webpack_require__(68),
	    toKey = __webpack_require__(100);
	
	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	  path = castPath(path, object);
	
	  var index = 0,
	      length = path.length;
	
	  while (object != null && index < length) {
	    object = object[toKey(path[index++])];
	  }
	  return (index && index == length) ? object : undefined;
	}
	
	module.exports = baseGet;


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(47),
	    isKey = __webpack_require__(69),
	    stringToPath = __webpack_require__(71),
	    toString = __webpack_require__(97);
	
	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (isArray(value)) {
	    return value;
	  }
	  return isKey(value, object) ? [value] : stringToPath(toString(value));
	}
	
	module.exports = castPath;


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(47),
	    isSymbol = __webpack_require__(70);
	
	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;
	
	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray(value)) {
	    return false;
	  }
	  var type = typeof value;
	  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	      value == null || isSymbol(value)) {
	    return true;
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object));
	}
	
	module.exports = isKey;


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var symbolTag = '[object Symbol]';
	
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike(value) && baseGetTag(value) == symbolTag);
	}
	
	module.exports = isSymbol;


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var memoizeCapped = __webpack_require__(72);
	
	/** Used to match property names within property paths. */
	var reLeadingDot = /^\./,
	    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	
	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;
	
	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = memoizeCapped(function(string) {
	  var result = [];
	  if (reLeadingDot.test(string)) {
	    result.push('');
	  }
	  string.replace(rePropName, function(match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	});
	
	module.exports = stringToPath;


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var memoize = __webpack_require__(73);
	
	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;
	
	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
	  var result = memoize(func, function(key) {
	    if (cache.size === MAX_MEMOIZE_SIZE) {
	      cache.clear();
	    }
	    return key;
	  });
	
	  var cache = result.cache;
	  return result;
	}
	
	module.exports = memoizeCapped;


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var MapCache = __webpack_require__(74);
	
	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';
	
	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  var memoized = function() {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;
	
	    if (cache.has(key)) {
	      return cache.get(key);
	    }
	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result) || cache;
	    return result;
	  };
	  memoized.cache = new (memoize.Cache || MapCache);
	  return memoized;
	}
	
	// Expose `MapCache`.
	memoize.Cache = MapCache;
	
	module.exports = memoize;


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var mapCacheClear = __webpack_require__(75),
	    mapCacheDelete = __webpack_require__(91),
	    mapCacheGet = __webpack_require__(94),
	    mapCacheHas = __webpack_require__(95),
	    mapCacheSet = __webpack_require__(96);
	
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	
	module.exports = MapCache;


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var Hash = __webpack_require__(76),
	    ListCache = __webpack_require__(83),
	    Map = __webpack_require__(90);
	
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}
	
	module.exports = mapCacheClear;


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var hashClear = __webpack_require__(77),
	    hashDelete = __webpack_require__(79),
	    hashGet = __webpack_require__(80),
	    hashHas = __webpack_require__(81),
	    hashSet = __webpack_require__(82);
	
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	
	module.exports = Hash;


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(78);
	
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}
	
	module.exports = hashClear;


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11);
	
	/* Built-in method references that are verified to be native. */
	var nativeCreate = getNative(Object, 'create');
	
	module.exports = nativeCreate;


/***/ },
/* 79 */
/***/ function(module, exports) {

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}
	
	module.exports = hashDelete;


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(78);
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}
	
	module.exports = hashGet;


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(78);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
	}
	
	module.exports = hashHas;


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(78);
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}
	
	module.exports = hashSet;


/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var listCacheClear = __webpack_require__(84),
	    listCacheDelete = __webpack_require__(85),
	    listCacheGet = __webpack_require__(87),
	    listCacheHas = __webpack_require__(88),
	    listCacheSet = __webpack_require__(89);
	
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	
	module.exports = ListCache;


/***/ },
/* 84 */
/***/ function(module, exports) {

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}
	
	module.exports = listCacheClear;


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(86);
	
	/** Used for built-in method references. */
	var arrayProto = Array.prototype;
	
	/** Built-in value references. */
	var splice = arrayProto.splice;
	
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}
	
	module.exports = listCacheDelete;


/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var eq = __webpack_require__(25);
	
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}
	
	module.exports = assocIndexOf;


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(86);
	
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  return index < 0 ? undefined : data[index][1];
	}
	
	module.exports = listCacheGet;


/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(86);
	
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}
	
	module.exports = listCacheHas;


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(86);
	
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}
	
	module.exports = listCacheSet;


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11),
	    root = __webpack_require__(16);
	
	/* Built-in method references that are verified to be native. */
	var Map = getNative(root, 'Map');
	
	module.exports = Map;


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(92);
	
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}
	
	module.exports = mapCacheDelete;


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var isKeyable = __webpack_require__(93);
	
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}
	
	module.exports = getMapData;


/***/ },
/* 93 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}
	
	module.exports = isKeyable;


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(92);
	
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}
	
	module.exports = mapCacheGet;


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(92);
	
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}
	
	module.exports = mapCacheHas;


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(92);
	
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;
	
	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}
	
	module.exports = mapCacheSet;


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(98);
	
	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	  return value == null ? '' : baseToString(value);
	}
	
	module.exports = toString;


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15),
	    arrayMap = __webpack_require__(99),
	    isArray = __webpack_require__(47),
	    isSymbol = __webpack_require__(70);
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;
	
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolToString = symbolProto ? symbolProto.toString : undefined;
	
	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }
	  if (isArray(value)) {
	    // Recursively convert values (susceptible to call stack limits).
	    return arrayMap(value, baseToString) + '';
	  }
	  if (isSymbol(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}
	
	module.exports = baseToString;


/***/ },
/* 99 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      result = Array(length);
	
	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}
	
	module.exports = arrayMap;


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var isSymbol = __webpack_require__(70);
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;
	
	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (typeof value == 'string' || isSymbol(value)) {
	    return value;
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}
	
	module.exports = toKey;


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var flatten = __webpack_require__(102),
	    overRest = __webpack_require__(30),
	    setToString = __webpack_require__(32);
	
	/**
	 * A specialized version of `baseRest` which flattens the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @returns {Function} Returns the new function.
	 */
	function flatRest(func) {
	  return setToString(overRest(func, undefined, flatten), func + '');
	}
	
	module.exports = flatRest;


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(103);
	
	/**
	 * Flattens `array` a single level deep.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {Array} array The array to flatten.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * _.flatten([1, [2, [3, [4]], 5]]);
	 * // => [1, 2, [3, [4]], 5]
	 */
	function flatten(array) {
	  var length = array == null ? 0 : array.length;
	  return length ? baseFlatten(array, 1) : [];
	}
	
	module.exports = flatten;


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var arrayPush = __webpack_require__(104),
	    isFlattenable = __webpack_require__(105);
	
	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {number} depth The maximum recursion depth.
	 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
	 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, depth, predicate, isStrict, result) {
	  var index = -1,
	      length = array.length;
	
	  predicate || (predicate = isFlattenable);
	  result || (result = []);
	
	  while (++index < length) {
	    var value = array[index];
	    if (depth > 0 && predicate(value)) {
	      if (depth > 1) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, depth - 1, predicate, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}
	
	module.exports = baseFlatten;


/***/ },
/* 104 */
/***/ function(module, exports) {

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;
	
	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}
	
	module.exports = arrayPush;


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15),
	    isArguments = __webpack_require__(44),
	    isArray = __webpack_require__(47);
	
	/** Built-in value references. */
	var spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;
	
	/**
	 * Checks if `value` is a flattenable `arguments` object or array.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
	 */
	function isFlattenable(value) {
	  return isArray(value) || isArguments(value) ||
	    !!(spreadableSymbol && value && value[spreadableSymbol]);
	}
	
	module.exports = isFlattenable;


/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssign = __webpack_require__(107),
	    baseCreate = __webpack_require__(108);
	
	/**
	 * Creates an object that inherits from the `prototype` object. If a
	 * `properties` object is given, its own enumerable string keyed properties
	 * are assigned to the created object.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.3.0
	 * @category Object
	 * @param {Object} prototype The object to inherit from.
	 * @param {Object} [properties] The properties to assign to the object.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * function Shape() {
	 *   this.x = 0;
	 *   this.y = 0;
	 * }
	 *
	 * function Circle() {
	 *   Shape.call(this);
	 * }
	 *
	 * Circle.prototype = _.create(Shape.prototype, {
	 *   'constructor': Circle
	 * });
	 *
	 * var circle = new Circle;
	 * circle instanceof Circle;
	 * // => true
	 *
	 * circle instanceof Shape;
	 * // => true
	 */
	function create(prototype, properties) {
	  var result = baseCreate(prototype);
	  return properties == null ? result : baseAssign(result, properties);
	}
	
	module.exports = create;


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    keys = __webpack_require__(41);
	
	/**
	 * The base implementation of `_.assign` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssign(object, source) {
	  return object && copyObject(source, keys(source), object);
	}
	
	module.exports = baseAssign;


/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20);
	
	/** Built-in value references. */
	var objectCreate = Object.create;
	
	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} proto The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate = (function() {
	  function object() {}
	  return function(proto) {
	    if (!isObject(proto)) {
	      return {};
	    }
	    if (objectCreate) {
	      return objectCreate(proto);
	    }
	    object.prototype = proto;
	    var result = new object;
	    object.prototype = undefined;
	    return result;
	  };
	}());
	
	module.exports = baseCreate;


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var apply = __webpack_require__(31),
	    assignInDefaults = __webpack_require__(110),
	    assignInWith = __webpack_require__(62),
	    baseRest = __webpack_require__(28);
	
	/**
	 * Assigns own and inherited enumerable string keyed properties of source
	 * objects to the destination object for all destination properties that
	 * resolve to `undefined`. Source objects are applied from left to right.
	 * Once a property is set, additional values of the same property are ignored.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @see _.defaultsDeep
	 * @example
	 *
	 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
	 * // => { 'a': 1, 'b': 2 }
	 */
	var defaults = baseRest(function(args) {
	  args.push(undefined, assignInDefaults);
	  return apply(assignInWith, undefined, args);
	});
	
	module.exports = defaults;


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var eq = __webpack_require__(25);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used by `_.defaults` to customize its `_.assignIn` use.
	 *
	 * @private
	 * @param {*} objValue The destination value.
	 * @param {*} srcValue The source value.
	 * @param {string} key The key of the property to assign.
	 * @param {Object} object The parent object of `objValue`.
	 * @returns {*} Returns the value to assign.
	 */
	function assignInDefaults(objValue, srcValue, key, object) {
	  if (objValue === undefined ||
	      (eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key))) {
	    return srcValue;
	  }
	  return objValue;
	}
	
	module.exports = assignInDefaults;


/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var apply = __webpack_require__(31),
	    baseRest = __webpack_require__(28),
	    mergeDefaults = __webpack_require__(112),
	    mergeWith = __webpack_require__(134);
	
	/**
	 * This method is like `_.defaults` except that it recursively assigns
	 * default properties.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.10.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @see _.defaults
	 * @example
	 *
	 * _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
	 * // => { 'a': { 'b': 2, 'c': 3 } }
	 */
	var defaultsDeep = baseRest(function(args) {
	  args.push(undefined, mergeDefaults);
	  return apply(mergeWith, undefined, args);
	});
	
	module.exports = defaultsDeep;


/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var baseMerge = __webpack_require__(113),
	    isObject = __webpack_require__(20);
	
	/**
	 * Used by `_.defaultsDeep` to customize its `_.merge` use.
	 *
	 * @private
	 * @param {*} objValue The destination value.
	 * @param {*} srcValue The source value.
	 * @param {string} key The key of the property to merge.
	 * @param {Object} object The parent object of `objValue`.
	 * @param {Object} source The parent object of `srcValue`.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 * @returns {*} Returns the value to assign.
	 */
	function mergeDefaults(objValue, srcValue, key, object, source, stack) {
	  if (isObject(objValue) && isObject(srcValue)) {
	    // Recursively merge objects and arrays (susceptible to call stack limits).
	    stack.set(srcValue, objValue);
	    baseMerge(objValue, srcValue, undefined, mergeDefaults, stack);
	    stack['delete'](srcValue);
	  }
	  return objValue;
	}
	
	module.exports = mergeDefaults;


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var Stack = __webpack_require__(114),
	    assignMergeValue = __webpack_require__(120),
	    baseFor = __webpack_require__(121),
	    baseMergeDeep = __webpack_require__(123),
	    isObject = __webpack_require__(20),
	    keysIn = __webpack_require__(59);
	
	/**
	 * The base implementation of `_.merge` without support for multiple sources.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} [customizer] The function to customize merged values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMerge(object, source, srcIndex, customizer, stack) {
	  if (object === source) {
	    return;
	  }
	  baseFor(source, function(srcValue, key) {
	    if (isObject(srcValue)) {
	      stack || (stack = new Stack);
	      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
	    }
	    else {
	      var newValue = customizer
	        ? customizer(object[key], srcValue, (key + ''), object, source, stack)
	        : undefined;
	
	      if (newValue === undefined) {
	        newValue = srcValue;
	      }
	      assignMergeValue(object, key, newValue);
	    }
	  }, keysIn);
	}
	
	module.exports = baseMerge;


/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var ListCache = __webpack_require__(83),
	    stackClear = __webpack_require__(115),
	    stackDelete = __webpack_require__(116),
	    stackGet = __webpack_require__(117),
	    stackHas = __webpack_require__(118),
	    stackSet = __webpack_require__(119);
	
	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new ListCache(entries);
	  this.size = data.size;
	}
	
	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;
	
	module.exports = Stack;


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	var ListCache = __webpack_require__(83);
	
	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	  this.size = 0;
	}
	
	module.exports = stackClear;


/***/ },
/* 116 */
/***/ function(module, exports) {

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);
	
	  this.size = data.size;
	  return result;
	}
	
	module.exports = stackDelete;


/***/ },
/* 117 */
/***/ function(module, exports) {

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}
	
	module.exports = stackGet;


/***/ },
/* 118 */
/***/ function(module, exports) {

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}
	
	module.exports = stackHas;


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	var ListCache = __webpack_require__(83),
	    Map = __webpack_require__(90),
	    MapCache = __webpack_require__(74);
	
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	
	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache) {
	    var pairs = data.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}
	
	module.exports = stackSet;


/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    eq = __webpack_require__(25);
	
	/**
	 * This function is like `assignValue` except that it doesn't assign
	 * `undefined` values.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignMergeValue(object, key, value) {
	  if ((value !== undefined && !eq(object[key], value)) ||
	      (value === undefined && !(key in object))) {
	    baseAssignValue(object, key, value);
	  }
	}
	
	module.exports = assignMergeValue;


/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	var createBaseFor = __webpack_require__(122);
	
	/**
	 * The base implementation of `baseForOwn` which iterates over `object`
	 * properties returned by `keysFunc` and invokes `iteratee` for each property.
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseFor = createBaseFor();
	
	module.exports = baseFor;


/***/ },
/* 122 */
/***/ function(module, exports) {

	/**
	 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseFor(fromRight) {
	  return function(object, iteratee, keysFunc) {
	    var index = -1,
	        iterable = Object(object),
	        props = keysFunc(object),
	        length = props.length;
	
	    while (length--) {
	      var key = props[fromRight ? length : ++index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  };
	}
	
	module.exports = createBaseFor;


/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	var assignMergeValue = __webpack_require__(120),
	    cloneBuffer = __webpack_require__(124),
	    cloneTypedArray = __webpack_require__(125),
	    copyArray = __webpack_require__(128),
	    initCloneObject = __webpack_require__(129),
	    isArguments = __webpack_require__(44),
	    isArray = __webpack_require__(47),
	    isArrayLikeObject = __webpack_require__(131),
	    isBuffer = __webpack_require__(48),
	    isFunction = __webpack_require__(13),
	    isObject = __webpack_require__(20),
	    isPlainObject = __webpack_require__(132),
	    isTypedArray = __webpack_require__(51),
	    toPlainObject = __webpack_require__(133);
	
	/**
	 * A specialized version of `baseMerge` for arrays and objects which performs
	 * deep merges and tracks traversed objects enabling objects with circular
	 * references to be merged.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {string} key The key of the value to merge.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} mergeFunc The function to merge values.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
	  var objValue = object[key],
	      srcValue = source[key],
	      stacked = stack.get(srcValue);
	
	  if (stacked) {
	    assignMergeValue(object, key, stacked);
	    return;
	  }
	  var newValue = customizer
	    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
	    : undefined;
	
	  var isCommon = newValue === undefined;
	
	  if (isCommon) {
	    var isArr = isArray(srcValue),
	        isBuff = !isArr && isBuffer(srcValue),
	        isTyped = !isArr && !isBuff && isTypedArray(srcValue);
	
	    newValue = srcValue;
	    if (isArr || isBuff || isTyped) {
	      if (isArray(objValue)) {
	        newValue = objValue;
	      }
	      else if (isArrayLikeObject(objValue)) {
	        newValue = copyArray(objValue);
	      }
	      else if (isBuff) {
	        isCommon = false;
	        newValue = cloneBuffer(srcValue, true);
	      }
	      else if (isTyped) {
	        isCommon = false;
	        newValue = cloneTypedArray(srcValue, true);
	      }
	      else {
	        newValue = [];
	      }
	    }
	    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
	      newValue = objValue;
	      if (isArguments(objValue)) {
	        newValue = toPlainObject(objValue);
	      }
	      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
	        newValue = initCloneObject(srcValue);
	      }
	    }
	    else {
	      isCommon = false;
	    }
	  }
	  if (isCommon) {
	    // Recursively merge objects and arrays (susceptible to call stack limits).
	    stack.set(srcValue, newValue);
	    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
	    stack['delete'](srcValue);
	  }
	  assignMergeValue(object, key, newValue);
	}
	
	module.exports = baseMergeDeep;


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var root = __webpack_require__(16);
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined,
	    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;
	
	/**
	 * Creates a clone of  `buffer`.
	 *
	 * @private
	 * @param {Buffer} buffer The buffer to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Buffer} Returns the cloned buffer.
	 */
	function cloneBuffer(buffer, isDeep) {
	  if (isDeep) {
	    return buffer.slice();
	  }
	  var length = buffer.length,
	      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
	
	  buffer.copy(result);
	  return result;
	}
	
	module.exports = cloneBuffer;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(49)(module)))

/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	var cloneArrayBuffer = __webpack_require__(126);
	
	/**
	 * Creates a clone of `typedArray`.
	 *
	 * @private
	 * @param {Object} typedArray The typed array to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned typed array.
	 */
	function cloneTypedArray(typedArray, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}
	
	module.exports = cloneTypedArray;


/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var Uint8Array = __webpack_require__(127);
	
	/**
	 * Creates a clone of `arrayBuffer`.
	 *
	 * @private
	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function cloneArrayBuffer(arrayBuffer) {
	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
	  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
	  return result;
	}
	
	module.exports = cloneArrayBuffer;


/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(16);
	
	/** Built-in value references. */
	var Uint8Array = root.Uint8Array;
	
	module.exports = Uint8Array;


/***/ },
/* 128 */
/***/ function(module, exports) {

	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function copyArray(source, array) {
	  var index = -1,
	      length = source.length;
	
	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}
	
	module.exports = copyArray;


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	var baseCreate = __webpack_require__(108),
	    getPrototype = __webpack_require__(130),
	    isPrototype = __webpack_require__(40);
	
	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  return (typeof object.constructor == 'function' && !isPrototype(object))
	    ? baseCreate(getPrototype(object))
	    : {};
	}
	
	module.exports = initCloneObject;


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	var overArg = __webpack_require__(57);
	
	/** Built-in value references. */
	var getPrototype = overArg(Object.getPrototypeOf, Object);
	
	module.exports = getPrototype;


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	var isArrayLike = __webpack_require__(37),
	    isObjectLike = __webpack_require__(46);
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	module.exports = isArrayLikeObject;


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    getPrototype = __webpack_require__(130),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var objectTag = '[object Object]';
	
	/** Used for built-in method references. */
	var funcProto = Function.prototype,
	    objectProto = Object.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/** Used to infer the `Object` constructor. */
	var objectCtorString = funcToString.call(Object);
	
	/**
	 * Checks if `value` is a plain object, that is, an object created by the
	 * `Object` constructor or one with a `[[Prototype]]` of `null`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.8.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * _.isPlainObject(new Foo);
	 * // => false
	 *
	 * _.isPlainObject([1, 2, 3]);
	 * // => false
	 *
	 * _.isPlainObject({ 'x': 0, 'y': 0 });
	 * // => true
	 *
	 * _.isPlainObject(Object.create(null));
	 * // => true
	 */
	function isPlainObject(value) {
	  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
	    return false;
	  }
	  var proto = getPrototype(value);
	  if (proto === null) {
	    return true;
	  }
	  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
	  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
	    funcToString.call(Ctor) == objectCtorString;
	}
	
	module.exports = isPlainObject;


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Converts `value` to a plain object flattening inherited enumerable string
	 * keyed properties of `value` to own properties of the plain object.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {Object} Returns the converted plain object.
	 * @example
	 *
	 * function Foo() {
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.assign({ 'a': 1 }, new Foo);
	 * // => { 'a': 1, 'b': 2 }
	 *
	 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	 * // => { 'a': 1, 'b': 2, 'c': 3 }
	 */
	function toPlainObject(value) {
	  return copyObject(value, keysIn(value));
	}
	
	module.exports = toPlainObject;


/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	var baseMerge = __webpack_require__(113),
	    createAssigner = __webpack_require__(27);
	
	/**
	 * This method is like `_.merge` except that it accepts `customizer` which
	 * is invoked to produce the merged values of the destination and source
	 * properties. If `customizer` returns `undefined`, merging is handled by the
	 * method instead. The `customizer` is invoked with six arguments:
	 * (objValue, srcValue, key, object, source, stack).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} sources The source objects.
	 * @param {Function} customizer The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * function customizer(objValue, srcValue) {
	 *   if (_.isArray(objValue)) {
	 *     return objValue.concat(srcValue);
	 *   }
	 * }
	 *
	 * var object = { 'a': [1], 'b': [2] };
	 * var other = { 'a': [3], 'b': [4] };
	 *
	 * _.mergeWith(object, other, customizer);
	 * // => { 'a': [1, 3], 'b': [2, 4] }
	 */
	var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
	  baseMerge(object, source, srcIndex, customizer);
	});
	
	module.exports = mergeWith;


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(136);


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var createToPairs = __webpack_require__(137),
	    keys = __webpack_require__(41);
	
	/**
	 * Creates an array of own enumerable string keyed-value pairs for `object`
	 * which can be consumed by `_.fromPairs`. If `object` is a map or set, its
	 * entries are returned.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @alias entries
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the key-value pairs.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.toPairs(new Foo);
	 * // => [['a', 1], ['b', 2]] (iteration order is not guaranteed)
	 */
	var toPairs = createToPairs(keys);
	
	module.exports = toPairs;


/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var baseToPairs = __webpack_require__(138),
	    getTag = __webpack_require__(139),
	    mapToArray = __webpack_require__(144),
	    setToPairs = __webpack_require__(145);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    setTag = '[object Set]';
	
	/**
	 * Creates a `_.toPairs` or `_.toPairsIn` function.
	 *
	 * @private
	 * @param {Function} keysFunc The function to get the keys of a given object.
	 * @returns {Function} Returns the new pairs function.
	 */
	function createToPairs(keysFunc) {
	  return function(object) {
	    var tag = getTag(object);
	    if (tag == mapTag) {
	      return mapToArray(object);
	    }
	    if (tag == setTag) {
	      return setToPairs(object);
	    }
	    return baseToPairs(object, keysFunc(object));
	  };
	}
	
	module.exports = createToPairs;


/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99);
	
	/**
	 * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
	 * of key-value pairs for `object` corresponding to the property names of `props`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array} props The property names to get values for.
	 * @returns {Object} Returns the key-value pairs.
	 */
	function baseToPairs(object, props) {
	  return arrayMap(props, function(key) {
	    return [key, object[key]];
	  });
	}
	
	module.exports = baseToPairs;


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var DataView = __webpack_require__(140),
	    Map = __webpack_require__(90),
	    Promise = __webpack_require__(141),
	    Set = __webpack_require__(142),
	    WeakMap = __webpack_require__(143),
	    baseGetTag = __webpack_require__(14),
	    toSource = __webpack_require__(23);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    setTag = '[object Set]',
	    weakMapTag = '[object WeakMap]';
	
	var dataViewTag = '[object DataView]';
	
	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);
	
	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;
	
	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = baseGetTag(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : '';
	
	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}
	
	module.exports = getTag;


/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11),
	    root = __webpack_require__(16);
	
	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView');
	
	module.exports = DataView;


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11),
	    root = __webpack_require__(16);
	
	/* Built-in method references that are verified to be native. */
	var Promise = getNative(root, 'Promise');
	
	module.exports = Promise;


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11),
	    root = __webpack_require__(16);
	
	/* Built-in method references that are verified to be native. */
	var Set = getNative(root, 'Set');
	
	module.exports = Set;


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(11),
	    root = __webpack_require__(16);
	
	/* Built-in method references that are verified to be native. */
	var WeakMap = getNative(root, 'WeakMap');
	
	module.exports = WeakMap;


/***/ },
/* 144 */
/***/ function(module, exports) {

	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);
	
	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}
	
	module.exports = mapToArray;


/***/ },
/* 145 */
/***/ function(module, exports) {

	/**
	 * Converts `set` to its value-value pairs.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the value-value pairs.
	 */
	function setToPairs(set) {
	  var index = -1,
	      result = Array(set.size);
	
	  set.forEach(function(value) {
	    result[++index] = [value, value];
	  });
	  return result;
	}
	
	module.exports = setToPairs;


/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(147);


/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	var createToPairs = __webpack_require__(137),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Creates an array of own and inherited enumerable string keyed-value pairs
	 * for `object` which can be consumed by `_.fromPairs`. If `object` is a map
	 * or set, its entries are returned.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @alias entriesIn
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the key-value pairs.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.toPairsIn(new Foo);
	 * // => [['a', 1], ['b', 2], ['c', 3]] (iteration order is not guaranteed)
	 */
	var toPairsIn = createToPairs(keysIn);
	
	module.exports = toPairsIn;


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(58);


/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(62);


/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	var baseFindKey = __webpack_require__(151),
	    baseForOwn = __webpack_require__(152),
	    baseIteratee = __webpack_require__(153);
	
	/**
	 * This method is like `_.find` except that it returns the key of the first
	 * element `predicate` returns truthy for instead of the element itself.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.1.0
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {string|undefined} Returns the key of the matched element,
	 *  else `undefined`.
	 * @example
	 *
	 * var users = {
	 *   'barney':  { 'age': 36, 'active': true },
	 *   'fred':    { 'age': 40, 'active': false },
	 *   'pebbles': { 'age': 1,  'active': true }
	 * };
	 *
	 * _.findKey(users, function(o) { return o.age < 40; });
	 * // => 'barney' (iteration order is not guaranteed)
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.findKey(users, { 'age': 1, 'active': true });
	 * // => 'pebbles'
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.findKey(users, ['active', false]);
	 * // => 'fred'
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.findKey(users, 'active');
	 * // => 'barney'
	 */
	function findKey(object, predicate) {
	  return baseFindKey(object, baseIteratee(predicate, 3), baseForOwn);
	}
	
	module.exports = findKey;


/***/ },
/* 151 */
/***/ function(module, exports) {

	/**
	 * The base implementation of methods like `_.findKey` and `_.findLastKey`,
	 * without support for iteratee shorthands, which iterates over `collection`
	 * using `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @returns {*} Returns the found element or its key, else `undefined`.
	 */
	function baseFindKey(collection, predicate, eachFunc) {
	  var result;
	  eachFunc(collection, function(value, key, collection) {
	    if (predicate(value, key, collection)) {
	      result = key;
	      return false;
	    }
	  });
	  return result;
	}
	
	module.exports = baseFindKey;


/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(121),
	    keys = __webpack_require__(41);
	
	/**
	 * The base implementation of `_.forOwn` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwn(object, iteratee) {
	  return object && baseFor(object, iteratee, keys);
	}
	
	module.exports = baseForOwn;


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	var baseMatches = __webpack_require__(154),
	    baseMatchesProperty = __webpack_require__(170),
	    identity = __webpack_require__(29),
	    isArray = __webpack_require__(47),
	    property = __webpack_require__(174);
	
	/**
	 * The base implementation of `_.iteratee`.
	 *
	 * @private
	 * @param {*} [value=_.identity] The value to convert to an iteratee.
	 * @returns {Function} Returns the iteratee.
	 */
	function baseIteratee(value) {
	  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
	  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
	  if (typeof value == 'function') {
	    return value;
	  }
	  if (value == null) {
	    return identity;
	  }
	  if (typeof value == 'object') {
	    return isArray(value)
	      ? baseMatchesProperty(value[0], value[1])
	      : baseMatches(value);
	  }
	  return property(value);
	}
	
	module.exports = baseIteratee;


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(155),
	    getMatchData = __webpack_require__(167),
	    matchesStrictComparable = __webpack_require__(169);
	
	/**
	 * The base implementation of `_.matches` which doesn't clone `source`.
	 *
	 * @private
	 * @param {Object} source The object of property values to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function baseMatches(source) {
	  var matchData = getMatchData(source);
	  if (matchData.length == 1 && matchData[0][2]) {
	    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
	  }
	  return function(object) {
	    return object === source || baseIsMatch(object, source, matchData);
	  };
	}
	
	module.exports = baseMatches;


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	var Stack = __webpack_require__(114),
	    baseIsEqual = __webpack_require__(156);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;
	
	/**
	 * The base implementation of `_.isMatch` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @param {Array} matchData The property names, values, and compare flags to match.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, source, matchData, customizer) {
	  var index = matchData.length,
	      length = index,
	      noCustomizer = !customizer;
	
	  if (object == null) {
	    return !length;
	  }
	  object = Object(object);
	  while (index--) {
	    var data = matchData[index];
	    if ((noCustomizer && data[2])
	          ? data[1] !== object[data[0]]
	          : !(data[0] in object)
	        ) {
	      return false;
	    }
	  }
	  while (++index < length) {
	    data = matchData[index];
	    var key = data[0],
	        objValue = object[key],
	        srcValue = data[1];
	
	    if (noCustomizer && data[2]) {
	      if (objValue === undefined && !(key in object)) {
	        return false;
	      }
	    } else {
	      var stack = new Stack;
	      if (customizer) {
	        var result = customizer(objValue, srcValue, key, object, source, stack);
	      }
	      if (!(result === undefined
	            ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
	            : result
	          )) {
	        return false;
	      }
	    }
	  }
	  return true;
	}
	
	module.exports = baseIsMatch;


/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqualDeep = __webpack_require__(157),
	    isObject = __webpack_require__(20),
	    isObjectLike = __webpack_require__(46);
	
	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Unordered comparison
	 *  2 - Partial comparison
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, bitmask, customizer, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}
	
	module.exports = baseIsEqual;


/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	var Stack = __webpack_require__(114),
	    equalArrays = __webpack_require__(158),
	    equalByTag = __webpack_require__(164),
	    equalObjects = __webpack_require__(166),
	    getTag = __webpack_require__(139),
	    isArray = __webpack_require__(47),
	    isBuffer = __webpack_require__(48),
	    isTypedArray = __webpack_require__(51);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    objectTag = '[object Object]';
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = arrayTag,
	      othTag = arrayTag;
	
	  if (!objIsArr) {
	    objTag = getTag(object);
	    objTag = objTag == argsTag ? objectTag : objTag;
	  }
	  if (!othIsArr) {
	    othTag = getTag(other);
	    othTag = othTag == argsTag ? objectTag : othTag;
	  }
	  var objIsObj = objTag == objectTag,
	      othIsObj = othTag == objectTag,
	      isSameTag = objTag == othTag;
	
	  if (isSameTag && isBuffer(object)) {
	    if (!isBuffer(other)) {
	      return false;
	    }
	    objIsArr = true;
	    objIsObj = false;
	  }
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new Stack);
	    return (objIsArr || isTypedArray(object))
	      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
	      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
	  }
	  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');
	
	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;
	
	      stack || (stack = new Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new Stack);
	  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}
	
	module.exports = baseIsEqualDeep;


/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	var SetCache = __webpack_require__(159),
	    arraySome = __webpack_require__(162),
	    cacheHas = __webpack_require__(163);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;
	
	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      arrLength = array.length,
	      othLength = other.length;
	
	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(array);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;
	
	  stack.set(array, other);
	  stack.set(other, array);
	
	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];
	
	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!arraySome(other, function(othValue, othIndex) {
	            if (!cacheHas(seen, othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
	              return seen.push(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, bitmask, customizer, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}
	
	module.exports = equalArrays;


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var MapCache = __webpack_require__(74),
	    setCacheAdd = __webpack_require__(160),
	    setCacheHas = __webpack_require__(161);
	
	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;
	
	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}
	
	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;
	
	module.exports = SetCache;


/***/ },
/* 160 */
/***/ function(module, exports) {

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}
	
	module.exports = setCacheAdd;


/***/ },
/* 161 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}
	
	module.exports = setCacheHas;


/***/ },
/* 162 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.some` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}
	
	module.exports = arraySome;


/***/ },
/* 163 */
/***/ function(module, exports) {

	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
	  return cache.has(key);
	}
	
	module.exports = cacheHas;


/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15),
	    Uint8Array = __webpack_require__(127),
	    eq = __webpack_require__(25),
	    equalArrays = __webpack_require__(158),
	    mapToArray = __webpack_require__(144),
	    setToArray = __webpack_require__(165);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;
	
	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]';
	
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
	
	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
	  switch (tag) {
	    case dataViewTag:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;
	
	    case arrayBufferTag:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
	        return false;
	      }
	      return true;
	
	    case boolTag:
	    case dateTag:
	    case numberTag:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq(+object, +other);
	
	    case errorTag:
	      return object.name == other.name && object.message == other.message;
	
	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');
	
	    case mapTag:
	      var convert = mapToArray;
	
	    case setTag:
	      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
	      convert || (convert = setToArray);
	
	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= COMPARE_UNORDERED_FLAG;
	
	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
	      stack['delete'](object);
	      return result;
	
	    case symbolTag:
	      if (symbolValueOf) {
	        return symbolValueOf.call(object) == symbolValueOf.call(other);
	      }
	  }
	  return false;
	}
	
	module.exports = equalByTag;


/***/ },
/* 165 */
/***/ function(module, exports) {

	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);
	
	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}
	
	module.exports = setToArray;


/***/ },
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	var keys = __webpack_require__(41);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      objProps = keys(object),
	      objLength = objProps.length,
	      othProps = keys(other),
	      othLength = othProps.length;
	
	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(object);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);
	
	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];
	
	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;
	
	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}
	
	module.exports = equalObjects;


/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	var isStrictComparable = __webpack_require__(168),
	    keys = __webpack_require__(41);
	
	/**
	 * Gets the property names, values, and compare flags of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the match data of `object`.
	 */
	function getMatchData(object) {
	  var result = keys(object),
	      length = result.length;
	
	  while (length--) {
	    var key = result[length],
	        value = object[key];
	
	    result[length] = [key, value, isStrictComparable(value)];
	  }
	  return result;
	}
	
	module.exports = getMatchData;


/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20);
	
	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && !isObject(value);
	}
	
	module.exports = isStrictComparable;


/***/ },
/* 169 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `matchesProperty` for source values suitable
	 * for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @param {*} srcValue The value to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function matchesStrictComparable(key, srcValue) {
	  return function(object) {
	    if (object == null) {
	      return false;
	    }
	    return object[key] === srcValue &&
	      (srcValue !== undefined || (key in Object(object)));
	  };
	}
	
	module.exports = matchesStrictComparable;


/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(156),
	    get = __webpack_require__(66),
	    hasIn = __webpack_require__(171),
	    isKey = __webpack_require__(69),
	    isStrictComparable = __webpack_require__(168),
	    matchesStrictComparable = __webpack_require__(169),
	    toKey = __webpack_require__(100);
	
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;
	
	/**
	 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
	 *
	 * @private
	 * @param {string} path The path of the property to get.
	 * @param {*} srcValue The value to match.
	 * @returns {Function} Returns the new spec function.
	 */
	function baseMatchesProperty(path, srcValue) {
	  if (isKey(path) && isStrictComparable(srcValue)) {
	    return matchesStrictComparable(toKey(path), srcValue);
	  }
	  return function(object) {
	    var objValue = get(object, path);
	    return (objValue === undefined && objValue === srcValue)
	      ? hasIn(object, path)
	      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
	  };
	}
	
	module.exports = baseMatchesProperty;


/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	var baseHasIn = __webpack_require__(172),
	    hasPath = __webpack_require__(173);
	
	/**
	 * Checks if `path` is a direct or inherited property of `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 * @example
	 *
	 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
	 *
	 * _.hasIn(object, 'a');
	 * // => true
	 *
	 * _.hasIn(object, 'a.b');
	 * // => true
	 *
	 * _.hasIn(object, ['a', 'b']);
	 * // => true
	 *
	 * _.hasIn(object, 'b');
	 * // => false
	 */
	function hasIn(object, path) {
	  return object != null && hasPath(object, path, baseHasIn);
	}
	
	module.exports = hasIn;


/***/ },
/* 172 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.hasIn` without support for deep paths.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {Array|string} key The key to check.
	 * @returns {boolean} Returns `true` if `key` exists, else `false`.
	 */
	function baseHasIn(object, key) {
	  return object != null && key in Object(object);
	}
	
	module.exports = baseHasIn;


/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	var castPath = __webpack_require__(68),
	    isArguments = __webpack_require__(44),
	    isArray = __webpack_require__(47),
	    isIndex = __webpack_require__(39),
	    isLength = __webpack_require__(38),
	    toKey = __webpack_require__(100);
	
	/**
	 * Checks if `path` exists on `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @param {Function} hasFunc The function to check properties.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 */
	function hasPath(object, path, hasFunc) {
	  path = castPath(path, object);
	
	  var index = -1,
	      length = path.length,
	      result = false;
	
	  while (++index < length) {
	    var key = toKey(path[index]);
	    if (!(result = object != null && hasFunc(object, key))) {
	      break;
	    }
	    object = object[key];
	  }
	  if (result || ++index != length) {
	    return result;
	  }
	  length = object == null ? 0 : object.length;
	  return !!length && isLength(length) && isIndex(key, length) &&
	    (isArray(object) || isArguments(object));
	}
	
	module.exports = hasPath;


/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	var baseProperty = __webpack_require__(175),
	    basePropertyDeep = __webpack_require__(176),
	    isKey = __webpack_require__(69),
	    toKey = __webpack_require__(100);
	
	/**
	 * Creates a function that returns the value at `path` of a given object.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 * @example
	 *
	 * var objects = [
	 *   { 'a': { 'b': 2 } },
	 *   { 'a': { 'b': 1 } }
	 * ];
	 *
	 * _.map(objects, _.property('a.b'));
	 * // => [2, 1]
	 *
	 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
	 * // => [1, 2]
	 */
	function property(path) {
	  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
	}
	
	module.exports = property;


/***/ },
/* 175 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	module.exports = baseProperty;


/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(67);
	
	/**
	 * A specialized version of `baseProperty` which supports deep paths.
	 *
	 * @private
	 * @param {Array|string} path The path of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 */
	function basePropertyDeep(path) {
	  return function(object) {
	    return baseGet(object, path);
	  };
	}
	
	module.exports = basePropertyDeep;


/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	var baseFindKey = __webpack_require__(151),
	    baseForOwnRight = __webpack_require__(178),
	    baseIteratee = __webpack_require__(153);
	
	/**
	 * This method is like `_.findKey` except that it iterates over elements of
	 * a collection in the opposite order.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {string|undefined} Returns the key of the matched element,
	 *  else `undefined`.
	 * @example
	 *
	 * var users = {
	 *   'barney':  { 'age': 36, 'active': true },
	 *   'fred':    { 'age': 40, 'active': false },
	 *   'pebbles': { 'age': 1,  'active': true }
	 * };
	 *
	 * _.findLastKey(users, function(o) { return o.age < 40; });
	 * // => returns 'pebbles' assuming `_.findKey` returns 'barney'
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.findLastKey(users, { 'age': 36, 'active': true });
	 * // => 'barney'
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.findLastKey(users, ['active', false]);
	 * // => 'fred'
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.findLastKey(users, 'active');
	 * // => 'pebbles'
	 */
	function findLastKey(object, predicate) {
	  return baseFindKey(object, baseIteratee(predicate, 3), baseForOwnRight);
	}
	
	module.exports = findLastKey;


/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	var baseForRight = __webpack_require__(179),
	    keys = __webpack_require__(41);
	
	/**
	 * The base implementation of `_.forOwnRight` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwnRight(object, iteratee) {
	  return object && baseForRight(object, iteratee, keys);
	}
	
	module.exports = baseForOwnRight;


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	var createBaseFor = __webpack_require__(122);
	
	/**
	 * This function is like `baseFor` except that it iterates over properties
	 * in the opposite order.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseForRight = createBaseFor(true);
	
	module.exports = baseForRight;


/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	var baseFor = __webpack_require__(121),
	    castFunction = __webpack_require__(181),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Iterates over own and inherited enumerable string keyed properties of an
	 * object and invokes `iteratee` for each property. The iteratee is invoked
	 * with three arguments: (value, key, object). Iteratee functions may exit
	 * iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forInRight
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forIn(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a', 'b', then 'c' (iteration order is not guaranteed).
	 */
	function forIn(object, iteratee) {
	  return object == null
	    ? object
	    : baseFor(object, castFunction(iteratee), keysIn);
	}
	
	module.exports = forIn;


/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(29);
	
	/**
	 * Casts `value` to `identity` if it's not a function.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Function} Returns cast function.
	 */
	function castFunction(value) {
	  return typeof value == 'function' ? value : identity;
	}
	
	module.exports = castFunction;


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	var baseForRight = __webpack_require__(179),
	    castFunction = __webpack_require__(181),
	    keysIn = __webpack_require__(59);
	
	/**
	 * This method is like `_.forIn` except that it iterates over properties of
	 * `object` in the opposite order.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forIn
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forInRight(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'c', 'b', then 'a' assuming `_.forIn` logs 'a', 'b', then 'c'.
	 */
	function forInRight(object, iteratee) {
	  return object == null
	    ? object
	    : baseForRight(object, castFunction(iteratee), keysIn);
	}
	
	module.exports = forInRight;


/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(152),
	    castFunction = __webpack_require__(181);
	
	/**
	 * Iterates over own enumerable string keyed properties of an object and
	 * invokes `iteratee` for each property. The iteratee is invoked with three
	 * arguments: (value, key, object). Iteratee functions may exit iteration
	 * early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forOwnRight
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forOwn(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
	 */
	function forOwn(object, iteratee) {
	  return object && baseForOwn(object, castFunction(iteratee));
	}
	
	module.exports = forOwn;


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwnRight = __webpack_require__(178),
	    castFunction = __webpack_require__(181);
	
	/**
	 * This method is like `_.forOwn` except that it iterates over properties of
	 * `object` in the opposite order.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 * @see _.forOwn
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.forOwnRight(new Foo, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'b' then 'a' assuming `_.forOwn` logs 'a' then 'b'.
	 */
	function forOwnRight(object, iteratee) {
	  return object && baseForOwnRight(object, castFunction(iteratee));
	}
	
	module.exports = forOwnRight;


/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	var baseFunctions = __webpack_require__(186),
	    keys = __webpack_require__(41);
	
	/**
	 * Creates an array of function property names from own enumerable properties
	 * of `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the function names.
	 * @see _.functionsIn
	 * @example
	 *
	 * function Foo() {
	 *   this.a = _.constant('a');
	 *   this.b = _.constant('b');
	 * }
	 *
	 * Foo.prototype.c = _.constant('c');
	 *
	 * _.functions(new Foo);
	 * // => ['a', 'b']
	 */
	function functions(object) {
	  return object == null ? [] : baseFunctions(object, keys(object));
	}
	
	module.exports = functions;


/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	var arrayFilter = __webpack_require__(187),
	    isFunction = __webpack_require__(13);
	
	/**
	 * The base implementation of `_.functions` which creates an array of
	 * `object` function property names filtered from `props`.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Array} props The property names to filter.
	 * @returns {Array} Returns the function names.
	 */
	function baseFunctions(object, props) {
	  return arrayFilter(props, function(key) {
	    return isFunction(object[key]);
	  });
	}
	
	module.exports = baseFunctions;


/***/ },
/* 187 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];
	
	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}
	
	module.exports = arrayFilter;


/***/ },
/* 188 */
/***/ function(module, exports, __webpack_require__) {

	var baseFunctions = __webpack_require__(186),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Creates an array of function property names from own and inherited
	 * enumerable properties of `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to inspect.
	 * @returns {Array} Returns the function names.
	 * @see _.functions
	 * @example
	 *
	 * function Foo() {
	 *   this.a = _.constant('a');
	 *   this.b = _.constant('b');
	 * }
	 *
	 * Foo.prototype.c = _.constant('c');
	 *
	 * _.functionsIn(new Foo);
	 * // => ['a', 'b', 'c']
	 */
	function functionsIn(object) {
	  return object == null ? [] : baseFunctions(object, keysIn(object));
	}
	
	module.exports = functionsIn;


/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

	var baseHas = __webpack_require__(190),
	    hasPath = __webpack_require__(173);
	
	/**
	 * Checks if `path` is a direct property of `object`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path to check.
	 * @returns {boolean} Returns `true` if `path` exists, else `false`.
	 * @example
	 *
	 * var object = { 'a': { 'b': 2 } };
	 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
	 *
	 * _.has(object, 'a');
	 * // => true
	 *
	 * _.has(object, 'a.b');
	 * // => true
	 *
	 * _.has(object, ['a', 'b']);
	 * // => true
	 *
	 * _.has(other, 'a');
	 * // => false
	 */
	function has(object, path) {
	  return object != null && hasPath(object, path, baseHas);
	}
	
	module.exports = has;


/***/ },
/* 190 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * The base implementation of `_.has` without support for deep paths.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {Array|string} key The key to check.
	 * @returns {boolean} Returns `true` if `key` exists, else `false`.
	 */
	function baseHas(object, key) {
	  return object != null && hasOwnProperty.call(object, key);
	}
	
	module.exports = baseHas;


/***/ },
/* 191 */
/***/ function(module, exports, __webpack_require__) {

	var constant = __webpack_require__(34),
	    createInverter = __webpack_require__(192),
	    identity = __webpack_require__(29);
	
	/**
	 * Creates an object composed of the inverted keys and values of `object`.
	 * If `object` contains duplicate values, subsequent values overwrite
	 * property assignments of previous values.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.7.0
	 * @category Object
	 * @param {Object} object The object to invert.
	 * @returns {Object} Returns the new inverted object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2, 'c': 1 };
	 *
	 * _.invert(object);
	 * // => { '1': 'c', '2': 'b' }
	 */
	var invert = createInverter(function(result, value, key) {
	  result[value] = key;
	}, constant(identity));
	
	module.exports = invert;


/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

	var baseInverter = __webpack_require__(193);
	
	/**
	 * Creates a function like `_.invertBy`.
	 *
	 * @private
	 * @param {Function} setter The function to set accumulator values.
	 * @param {Function} toIteratee The function to resolve iteratees.
	 * @returns {Function} Returns the new inverter function.
	 */
	function createInverter(setter, toIteratee) {
	  return function(object, iteratee) {
	    return baseInverter(object, setter, toIteratee(iteratee), {});
	  };
	}
	
	module.exports = createInverter;


/***/ },
/* 193 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(152);
	
	/**
	 * The base implementation of `_.invert` and `_.invertBy` which inverts
	 * `object` with values transformed by `iteratee` and set by `setter`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} setter The function to set `accumulator` values.
	 * @param {Function} iteratee The iteratee to transform values.
	 * @param {Object} accumulator The initial inverted object.
	 * @returns {Function} Returns `accumulator`.
	 */
	function baseInverter(object, setter, iteratee, accumulator) {
	  baseForOwn(object, function(value, key, object) {
	    setter(accumulator, iteratee(value), key, object);
	  });
	  return accumulator;
	}
	
	module.exports = baseInverter;


/***/ },
/* 194 */
/***/ function(module, exports, __webpack_require__) {

	var baseIteratee = __webpack_require__(153),
	    createInverter = __webpack_require__(192);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * This method is like `_.invert` except that the inverted object is generated
	 * from the results of running each element of `object` thru `iteratee`. The
	 * corresponding inverted value of each inverted key is an array of keys
	 * responsible for generating the inverted value. The iteratee is invoked
	 * with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.1.0
	 * @category Object
	 * @param {Object} object The object to invert.
	 * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
	 * @returns {Object} Returns the new inverted object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2, 'c': 1 };
	 *
	 * _.invertBy(object);
	 * // => { '1': ['a', 'c'], '2': ['b'] }
	 *
	 * _.invertBy(object, function(value) {
	 *   return 'group' + value;
	 * });
	 * // => { 'group1': ['a', 'c'], 'group2': ['b'] }
	 */
	var invertBy = createInverter(function(result, value, key) {
	  if (hasOwnProperty.call(result, value)) {
	    result[value].push(key);
	  } else {
	    result[value] = [key];
	  }
	}, baseIteratee);
	
	module.exports = invertBy;


/***/ },
/* 195 */
/***/ function(module, exports, __webpack_require__) {

	var baseInvoke = __webpack_require__(196),
	    baseRest = __webpack_require__(28);
	
	/**
	 * Invokes the method at `path` of `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the method to invoke.
	 * @param {...*} [args] The arguments to invoke the method with.
	 * @returns {*} Returns the result of the invoked method.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': [1, 2, 3, 4] } }] };
	 *
	 * _.invoke(object, 'a[0].b.c.slice', 1, 3);
	 * // => [2, 3]
	 */
	var invoke = baseRest(baseInvoke);
	
	module.exports = invoke;


/***/ },
/* 196 */
/***/ function(module, exports, __webpack_require__) {

	var apply = __webpack_require__(31),
	    castPath = __webpack_require__(68),
	    last = __webpack_require__(197),
	    parent = __webpack_require__(198),
	    toKey = __webpack_require__(100);
	
	/**
	 * The base implementation of `_.invoke` without support for individual
	 * method arguments.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the method to invoke.
	 * @param {Array} args The arguments to invoke the method with.
	 * @returns {*} Returns the result of the invoked method.
	 */
	function baseInvoke(object, path, args) {
	  path = castPath(path, object);
	  object = parent(object, path);
	  var func = object == null ? object : object[toKey(last(path))];
	  return func == null ? undefined : apply(func, object, args);
	}
	
	module.exports = baseInvoke;


/***/ },
/* 197 */
/***/ function(module, exports) {

	/**
	 * Gets the last element of `array`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {Array} array The array to query.
	 * @returns {*} Returns the last element of `array`.
	 * @example
	 *
	 * _.last([1, 2, 3]);
	 * // => 3
	 */
	function last(array) {
	  var length = array == null ? 0 : array.length;
	  return length ? array[length - 1] : undefined;
	}
	
	module.exports = last;


/***/ },
/* 198 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(67),
	    baseSlice = __webpack_require__(199);
	
	/**
	 * Gets the parent value at `path` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array} path The path to get the parent value of.
	 * @returns {*} Returns the parent value.
	 */
	function parent(object, path) {
	  return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
	}
	
	module.exports = parent;


/***/ },
/* 199 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.slice` without an iteratee call guard.
	 *
	 * @private
	 * @param {Array} array The array to slice.
	 * @param {number} [start=0] The start position.
	 * @param {number} [end=array.length] The end position.
	 * @returns {Array} Returns the slice of `array`.
	 */
	function baseSlice(array, start, end) {
	  var index = -1,
	      length = array.length;
	
	  if (start < 0) {
	    start = -start > length ? 0 : (length + start);
	  }
	  end = end > length ? length : end;
	  if (end < 0) {
	    end += length;
	  }
	  length = start > end ? 0 : ((end - start) >>> 0);
	  start >>>= 0;
	
	  var result = Array(length);
	  while (++index < length) {
	    result[index] = array[index + start];
	  }
	  return result;
	}
	
	module.exports = baseSlice;


/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    baseForOwn = __webpack_require__(152),
	    baseIteratee = __webpack_require__(153);
	
	/**
	 * The opposite of `_.mapValues`; this method creates an object with the
	 * same values as `object` and keys generated by running each own enumerable
	 * string keyed property of `object` thru `iteratee`. The iteratee is invoked
	 * with three arguments: (value, key, object).
	 *
	 * @static
	 * @memberOf _
	 * @since 3.8.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns the new mapped object.
	 * @see _.mapValues
	 * @example
	 *
	 * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
	 *   return key + value;
	 * });
	 * // => { 'a1': 1, 'b2': 2 }
	 */
	function mapKeys(object, iteratee) {
	  var result = {};
	  iteratee = baseIteratee(iteratee, 3);
	
	  baseForOwn(object, function(value, key, object) {
	    baseAssignValue(result, iteratee(value, key, object), value);
	  });
	  return result;
	}
	
	module.exports = mapKeys;


/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    baseForOwn = __webpack_require__(152),
	    baseIteratee = __webpack_require__(153);
	
	/**
	 * Creates an object with the same keys as `object` and values generated
	 * by running each own enumerable string keyed property of `object` thru
	 * `iteratee`. The iteratee is invoked with three arguments:
	 * (value, key, object).
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Object} Returns the new mapped object.
	 * @see _.mapKeys
	 * @example
	 *
	 * var users = {
	 *   'fred':    { 'user': 'fred',    'age': 40 },
	 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
	 * };
	 *
	 * _.mapValues(users, function(o) { return o.age; });
	 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.mapValues(users, 'age');
	 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	 */
	function mapValues(object, iteratee) {
	  var result = {};
	  iteratee = baseIteratee(iteratee, 3);
	
	  baseForOwn(object, function(value, key, object) {
	    baseAssignValue(result, key, iteratee(value, key, object));
	  });
	  return result;
	}
	
	module.exports = mapValues;


/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

	var baseMerge = __webpack_require__(113),
	    createAssigner = __webpack_require__(27);
	
	/**
	 * This method is like `_.assign` except that it recursively merges own and
	 * inherited enumerable string keyed properties of source objects into the
	 * destination object. Source properties that resolve to `undefined` are
	 * skipped if a destination value exists. Array and plain object properties
	 * are merged recursively. Other objects and value types are overridden by
	 * assignment. Source objects are applied from left to right. Subsequent
	 * sources overwrite property assignments of previous sources.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.5.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = {
	 *   'a': [{ 'b': 2 }, { 'd': 4 }]
	 * };
	 *
	 * var other = {
	 *   'a': [{ 'c': 3 }, { 'e': 5 }]
	 * };
	 *
	 * _.merge(object, other);
	 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
	 */
	var merge = createAssigner(function(object, source, srcIndex) {
	  baseMerge(object, source, srcIndex);
	});
	
	module.exports = merge;


/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99),
	    baseClone = __webpack_require__(204),
	    baseUnset = __webpack_require__(225),
	    castPath = __webpack_require__(68),
	    copyObject = __webpack_require__(26),
	    flatRest = __webpack_require__(101),
	    getAllKeysIn = __webpack_require__(214);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_FLAT_FLAG = 2,
	    CLONE_SYMBOLS_FLAG = 4;
	
	/**
	 * The opposite of `_.pick`; this method creates an object composed of the
	 * own and inherited enumerable property paths of `object` that are not omitted.
	 *
	 * **Note:** This method is considerably slower than `_.pick`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {...(string|string[])} [paths] The property paths to omit.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.omit(object, ['a', 'c']);
	 * // => { 'b': '2' }
	 */
	var omit = flatRest(function(object, paths) {
	  var result = {};
	  if (object == null) {
	    return result;
	  }
	  var isDeep = false;
	  paths = arrayMap(paths, function(path) {
	    path = castPath(path, object);
	    isDeep || (isDeep = path.length > 1);
	    return path;
	  });
	  copyObject(object, getAllKeysIn(object), result);
	  if (isDeep) {
	    result = baseClone(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG);
	  }
	  var length = paths.length;
	  while (length--) {
	    baseUnset(result, paths[length]);
	  }
	  return result;
	});
	
	module.exports = omit;


/***/ },
/* 204 */
/***/ function(module, exports, __webpack_require__) {

	var Stack = __webpack_require__(114),
	    arrayEach = __webpack_require__(205),
	    assignValue = __webpack_require__(8),
	    baseAssign = __webpack_require__(107),
	    baseAssignIn = __webpack_require__(206),
	    cloneBuffer = __webpack_require__(124),
	    copyArray = __webpack_require__(128),
	    copySymbols = __webpack_require__(207),
	    copySymbolsIn = __webpack_require__(210),
	    getAllKeys = __webpack_require__(212),
	    getAllKeysIn = __webpack_require__(214),
	    getTag = __webpack_require__(139),
	    initCloneArray = __webpack_require__(215),
	    initCloneByTag = __webpack_require__(216),
	    initCloneObject = __webpack_require__(129),
	    isArray = __webpack_require__(47),
	    isBuffer = __webpack_require__(48),
	    isObject = __webpack_require__(20),
	    keys = __webpack_require__(41);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_FLAT_FLAG = 2,
	    CLONE_SYMBOLS_FLAG = 4;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] =
	cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
	cloneableTags[boolTag] = cloneableTags[dateTag] =
	cloneableTags[float32Tag] = cloneableTags[float64Tag] =
	cloneableTags[int8Tag] = cloneableTags[int16Tag] =
	cloneableTags[int32Tag] = cloneableTags[mapTag] =
	cloneableTags[numberTag] = cloneableTags[objectTag] =
	cloneableTags[regexpTag] = cloneableTags[setTag] =
	cloneableTags[stringTag] = cloneableTags[symbolTag] =
	cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] =
	cloneableTags[weakMapTag] = false;
	
	/**
	 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
	 * traversed objects.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Deep clone
	 *  2 - Flatten inherited properties
	 *  4 - Clone symbols
	 * @param {Function} [customizer] The function to customize cloning.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The parent object of `value`.
	 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, bitmask, customizer, key, object, stack) {
	  var result,
	      isDeep = bitmask & CLONE_DEEP_FLAG,
	      isFlat = bitmask & CLONE_FLAT_FLAG,
	      isFull = bitmask & CLONE_SYMBOLS_FLAG;
	
	  if (customizer) {
	    result = object ? customizer(value, key, object, stack) : customizer(value);
	  }
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject(value)) {
	    return value;
	  }
	  var isArr = isArray(value);
	  if (isArr) {
	    result = initCloneArray(value);
	    if (!isDeep) {
	      return copyArray(value, result);
	    }
	  } else {
	    var tag = getTag(value),
	        isFunc = tag == funcTag || tag == genTag;
	
	    if (isBuffer(value)) {
	      return cloneBuffer(value, isDeep);
	    }
	    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	      result = (isFlat || isFunc) ? {} : initCloneObject(value);
	      if (!isDeep) {
	        return isFlat
	          ? copySymbolsIn(value, baseAssignIn(result, value))
	          : copySymbols(value, baseAssign(result, value));
	      }
	    } else {
	      if (!cloneableTags[tag]) {
	        return object ? value : {};
	      }
	      result = initCloneByTag(value, tag, baseClone, isDeep);
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stack || (stack = new Stack);
	  var stacked = stack.get(value);
	  if (stacked) {
	    return stacked;
	  }
	  stack.set(value, result);
	
	  var keysFunc = isFull
	    ? (isFlat ? getAllKeysIn : getAllKeys)
	    : (isFlat ? keysIn : keys);
	
	  var props = isArr ? undefined : keysFunc(value);
	  arrayEach(props || value, function(subValue, key) {
	    if (props) {
	      key = subValue;
	      subValue = value[key];
	    }
	    // Recursively populate clone (susceptible to call stack limits).
	    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
	  });
	  return result;
	}
	
	module.exports = baseClone;


/***/ },
/* 205 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}
	
	module.exports = arrayEach;


/***/ },
/* 206 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    keysIn = __webpack_require__(59);
	
	/**
	 * The base implementation of `_.assignIn` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssignIn(object, source) {
	  return object && copyObject(source, keysIn(source), object);
	}
	
	module.exports = baseAssignIn;


/***/ },
/* 207 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    getSymbols = __webpack_require__(208);
	
	/**
	 * Copies own symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbols(source, object) {
	  return copyObject(source, getSymbols(source), object);
	}
	
	module.exports = copySymbols;


/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	var overArg = __webpack_require__(57),
	    stubArray = __webpack_require__(209);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols;
	
	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;
	
	module.exports = getSymbols;


/***/ },
/* 209 */
/***/ function(module, exports) {

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}
	
	module.exports = stubArray;


/***/ },
/* 210 */
/***/ function(module, exports, __webpack_require__) {

	var copyObject = __webpack_require__(26),
	    getSymbolsIn = __webpack_require__(211);
	
	/**
	 * Copies own and inherited symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbolsIn(source, object) {
	  return copyObject(source, getSymbolsIn(source), object);
	}
	
	module.exports = copySymbolsIn;


/***/ },
/* 211 */
/***/ function(module, exports, __webpack_require__) {

	var arrayPush = __webpack_require__(104),
	    getPrototype = __webpack_require__(130),
	    getSymbols = __webpack_require__(208),
	    stubArray = __webpack_require__(209);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols;
	
	/**
	 * Creates an array of the own and inherited enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
	  var result = [];
	  while (object) {
	    arrayPush(result, getSymbols(object));
	    object = getPrototype(object);
	  }
	  return result;
	};
	
	module.exports = getSymbolsIn;


/***/ },
/* 212 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetAllKeys = __webpack_require__(213),
	    getSymbols = __webpack_require__(208),
	    keys = __webpack_require__(41);
	
	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}
	
	module.exports = getAllKeys;


/***/ },
/* 213 */
/***/ function(module, exports, __webpack_require__) {

	var arrayPush = __webpack_require__(104),
	    isArray = __webpack_require__(47);
	
	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}
	
	module.exports = baseGetAllKeys;


/***/ },
/* 214 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetAllKeys = __webpack_require__(213),
	    getSymbolsIn = __webpack_require__(211),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Creates an array of own and inherited enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeysIn(object) {
	  return baseGetAllKeys(object, keysIn, getSymbolsIn);
	}
	
	module.exports = getAllKeysIn;


/***/ },
/* 215 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = array.constructor(length);
	
	  // Add properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}
	
	module.exports = initCloneArray;


/***/ },
/* 216 */
/***/ function(module, exports, __webpack_require__) {

	var cloneArrayBuffer = __webpack_require__(126),
	    cloneDataView = __webpack_require__(217),
	    cloneMap = __webpack_require__(218),
	    cloneRegExp = __webpack_require__(221),
	    cloneSet = __webpack_require__(222),
	    cloneSymbol = __webpack_require__(224),
	    cloneTypedArray = __webpack_require__(125);
	
	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, cloneFunc, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag:
	      return cloneArrayBuffer(object);
	
	    case boolTag:
	    case dateTag:
	      return new Ctor(+object);
	
	    case dataViewTag:
	      return cloneDataView(object, isDeep);
	
	    case float32Tag: case float64Tag:
	    case int8Tag: case int16Tag: case int32Tag:
	    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	      return cloneTypedArray(object, isDeep);
	
	    case mapTag:
	      return cloneMap(object, isDeep, cloneFunc);
	
	    case numberTag:
	    case stringTag:
	      return new Ctor(object);
	
	    case regexpTag:
	      return cloneRegExp(object);
	
	    case setTag:
	      return cloneSet(object, isDeep, cloneFunc);
	
	    case symbolTag:
	      return cloneSymbol(object);
	  }
	}
	
	module.exports = initCloneByTag;


/***/ },
/* 217 */
/***/ function(module, exports, __webpack_require__) {

	var cloneArrayBuffer = __webpack_require__(126);
	
	/**
	 * Creates a clone of `dataView`.
	 *
	 * @private
	 * @param {Object} dataView The data view to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned data view.
	 */
	function cloneDataView(dataView, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
	  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}
	
	module.exports = cloneDataView;


/***/ },
/* 218 */
/***/ function(module, exports, __webpack_require__) {

	var addMapEntry = __webpack_require__(219),
	    arrayReduce = __webpack_require__(220),
	    mapToArray = __webpack_require__(144);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1;
	
	/**
	 * Creates a clone of `map`.
	 *
	 * @private
	 * @param {Object} map The map to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned map.
	 */
	function cloneMap(map, isDeep, cloneFunc) {
	  var array = isDeep ? cloneFunc(mapToArray(map), CLONE_DEEP_FLAG) : mapToArray(map);
	  return arrayReduce(array, addMapEntry, new map.constructor);
	}
	
	module.exports = cloneMap;


/***/ },
/* 219 */
/***/ function(module, exports) {

	/**
	 * Adds the key-value `pair` to `map`.
	 *
	 * @private
	 * @param {Object} map The map to modify.
	 * @param {Array} pair The key-value pair to add.
	 * @returns {Object} Returns `map`.
	 */
	function addMapEntry(map, pair) {
	  // Don't return `map.set` because it's not chainable in IE 11.
	  map.set(pair[0], pair[1]);
	  return map;
	}
	
	module.exports = addMapEntry;


/***/ },
/* 220 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.reduce` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initAccum] Specify using the first element of `array` as
	 *  the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initAccum) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  if (initAccum && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}
	
	module.exports = arrayReduce;


/***/ },
/* 221 */
/***/ function(module, exports) {

	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;
	
	/**
	 * Creates a clone of `regexp`.
	 *
	 * @private
	 * @param {Object} regexp The regexp to clone.
	 * @returns {Object} Returns the cloned regexp.
	 */
	function cloneRegExp(regexp) {
	  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
	  result.lastIndex = regexp.lastIndex;
	  return result;
	}
	
	module.exports = cloneRegExp;


/***/ },
/* 222 */
/***/ function(module, exports, __webpack_require__) {

	var addSetEntry = __webpack_require__(223),
	    arrayReduce = __webpack_require__(220),
	    setToArray = __webpack_require__(165);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1;
	
	/**
	 * Creates a clone of `set`.
	 *
	 * @private
	 * @param {Object} set The set to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned set.
	 */
	function cloneSet(set, isDeep, cloneFunc) {
	  var array = isDeep ? cloneFunc(setToArray(set), CLONE_DEEP_FLAG) : setToArray(set);
	  return arrayReduce(array, addSetEntry, new set.constructor);
	}
	
	module.exports = cloneSet;


/***/ },
/* 223 */
/***/ function(module, exports) {

	/**
	 * Adds `value` to `set`.
	 *
	 * @private
	 * @param {Object} set The set to modify.
	 * @param {*} value The value to add.
	 * @returns {Object} Returns `set`.
	 */
	function addSetEntry(set, value) {
	  // Don't return `set.add` because it's not chainable in IE 11.
	  set.add(value);
	  return set;
	}
	
	module.exports = addSetEntry;


/***/ },
/* 224 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15);
	
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
	
	/**
	 * Creates a clone of the `symbol` object.
	 *
	 * @private
	 * @param {Object} symbol The symbol object to clone.
	 * @returns {Object} Returns the cloned symbol object.
	 */
	function cloneSymbol(symbol) {
	  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
	}
	
	module.exports = cloneSymbol;


/***/ },
/* 225 */
/***/ function(module, exports, __webpack_require__) {

	var castPath = __webpack_require__(68),
	    last = __webpack_require__(197),
	    parent = __webpack_require__(198),
	    toKey = __webpack_require__(100);
	
	/**
	 * The base implementation of `_.unset`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The property path to unset.
	 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
	 */
	function baseUnset(object, path) {
	  path = castPath(path, object);
	  object = parent(object, path);
	  return object == null || delete object[toKey(last(path))];
	}
	
	module.exports = baseUnset;


/***/ },
/* 226 */
/***/ function(module, exports, __webpack_require__) {

	var baseIteratee = __webpack_require__(153),
	    negate = __webpack_require__(227),
	    pickBy = __webpack_require__(228);
	
	/**
	 * The opposite of `_.pickBy`; this method creates an object composed of
	 * the own and inherited enumerable string keyed properties of `object` that
	 * `predicate` doesn't return truthy for. The predicate is invoked with two
	 * arguments: (value, key).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {Function} [predicate=_.identity] The function invoked per property.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.omitBy(object, _.isNumber);
	 * // => { 'b': '2' }
	 */
	function omitBy(object, predicate) {
	  return pickBy(object, negate(baseIteratee(predicate)));
	}
	
	module.exports = omitBy;


/***/ },
/* 227 */
/***/ function(module, exports) {

	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';
	
	/**
	 * Creates a function that negates the result of the predicate `func`. The
	 * `func` predicate is invoked with the `this` binding and arguments of the
	 * created function.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Function
	 * @param {Function} predicate The predicate to negate.
	 * @returns {Function} Returns the new negated function.
	 * @example
	 *
	 * function isEven(n) {
	 *   return n % 2 == 0;
	 * }
	 *
	 * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
	 * // => [1, 3, 5]
	 */
	function negate(predicate) {
	  if (typeof predicate != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  return function() {
	    var args = arguments;
	    switch (args.length) {
	      case 0: return !predicate.call(this);
	      case 1: return !predicate.call(this, args[0]);
	      case 2: return !predicate.call(this, args[0], args[1]);
	      case 3: return !predicate.call(this, args[0], args[1], args[2]);
	    }
	    return !predicate.apply(this, args);
	  };
	}
	
	module.exports = negate;


/***/ },
/* 228 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99),
	    baseIteratee = __webpack_require__(153),
	    basePickBy = __webpack_require__(229),
	    getAllKeysIn = __webpack_require__(214);
	
	/**
	 * Creates an object composed of the `object` properties `predicate` returns
	 * truthy for. The predicate is invoked with two arguments: (value, key).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {Function} [predicate=_.identity] The function invoked per property.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.pickBy(object, _.isNumber);
	 * // => { 'a': 1, 'c': 3 }
	 */
	function pickBy(object, predicate) {
	  if (object == null) {
	    return {};
	  }
	  var props = arrayMap(getAllKeysIn(object), function(prop) {
	    return [prop];
	  });
	  predicate = baseIteratee(predicate);
	  return basePickBy(object, props, function(value, path) {
	    return predicate(value, path[0]);
	  });
	}
	
	module.exports = pickBy;


/***/ },
/* 229 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(67),
	    baseSet = __webpack_require__(230),
	    castPath = __webpack_require__(68);
	
	/**
	 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} paths The property paths to pick.
	 * @param {Function} predicate The function invoked per property.
	 * @returns {Object} Returns the new object.
	 */
	function basePickBy(object, paths, predicate) {
	  var index = -1,
	      length = paths.length,
	      result = {};
	
	  while (++index < length) {
	    var path = paths[index],
	        value = baseGet(object, path);
	
	    if (predicate(value, path)) {
	      baseSet(result, castPath(path, object), value);
	    }
	  }
	  return result;
	}
	
	module.exports = basePickBy;


/***/ },
/* 230 */
/***/ function(module, exports, __webpack_require__) {

	var assignValue = __webpack_require__(8),
	    castPath = __webpack_require__(68),
	    isIndex = __webpack_require__(39),
	    isObject = __webpack_require__(20),
	    toKey = __webpack_require__(100);
	
	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	  if (!isObject(object)) {
	    return object;
	  }
	  path = castPath(path, object);
	
	  var index = -1,
	      length = path.length,
	      lastIndex = length - 1,
	      nested = object;
	
	  while (nested != null && ++index < length) {
	    var key = toKey(path[index]),
	        newValue = value;
	
	    if (index != lastIndex) {
	      var objValue = nested[key];
	      newValue = customizer ? customizer(objValue, key, nested) : undefined;
	      if (newValue === undefined) {
	        newValue = isObject(objValue)
	          ? objValue
	          : (isIndex(path[index + 1]) ? [] : {});
	      }
	    }
	    assignValue(nested, key, newValue);
	    nested = nested[key];
	  }
	  return object;
	}
	
	module.exports = baseSet;


/***/ },
/* 231 */
/***/ function(module, exports, __webpack_require__) {

	var basePick = __webpack_require__(232),
	    flatRest = __webpack_require__(101);
	
	/**
	 * Creates an object composed of the picked `object` properties.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The source object.
	 * @param {...(string|string[])} [paths] The property paths to pick.
	 * @returns {Object} Returns the new object.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': '2', 'c': 3 };
	 *
	 * _.pick(object, ['a', 'c']);
	 * // => { 'a': 1, 'c': 3 }
	 */
	var pick = flatRest(function(object, paths) {
	  return object == null ? {} : basePick(object, paths);
	});
	
	module.exports = pick;


/***/ },
/* 232 */
/***/ function(module, exports, __webpack_require__) {

	var basePickBy = __webpack_require__(229),
	    hasIn = __webpack_require__(171);
	
	/**
	 * The base implementation of `_.pick` without support for individual
	 * property identifiers.
	 *
	 * @private
	 * @param {Object} object The source object.
	 * @param {string[]} paths The property paths to pick.
	 * @returns {Object} Returns the new object.
	 */
	function basePick(object, paths) {
	  object = Object(object);
	  return basePickBy(object, paths, function(value, path) {
	    return hasIn(object, path);
	  });
	}
	
	module.exports = basePick;


/***/ },
/* 233 */
/***/ function(module, exports, __webpack_require__) {

	var castPath = __webpack_require__(68),
	    isFunction = __webpack_require__(13),
	    toKey = __webpack_require__(100);
	
	/**
	 * This method is like `_.get` except that if the resolved value is a
	 * function it's invoked with the `this` binding of its parent object and
	 * its result is returned.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to resolve.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
	 *
	 * _.result(object, 'a[0].b.c1');
	 * // => 3
	 *
	 * _.result(object, 'a[0].b.c2');
	 * // => 4
	 *
	 * _.result(object, 'a[0].b.c3', 'default');
	 * // => 'default'
	 *
	 * _.result(object, 'a[0].b.c3', _.constant('default'));
	 * // => 'default'
	 */
	function result(object, path, defaultValue) {
	  path = castPath(path, object);
	
	  var index = -1,
	      length = path.length;
	
	  // Ensure the loop is entered when path is empty.
	  if (!length) {
	    length = 1;
	    object = undefined;
	  }
	  while (++index < length) {
	    var value = object == null ? undefined : object[toKey(path[index])];
	    if (value === undefined) {
	      index = length;
	      value = defaultValue;
	    }
	    object = isFunction(value) ? value.call(object) : value;
	  }
	  return object;
	}
	
	module.exports = result;


/***/ },
/* 234 */
/***/ function(module, exports, __webpack_require__) {

	var baseSet = __webpack_require__(230);
	
	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */
	function set(object, path, value) {
	  return object == null ? object : baseSet(object, path, value);
	}
	
	module.exports = set;


/***/ },
/* 235 */
/***/ function(module, exports, __webpack_require__) {

	var baseSet = __webpack_require__(230);
	
	/**
	 * This method is like `_.set` except that it accepts `customizer` which is
	 * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
	 * path creation is handled by the method instead. The `customizer` is invoked
	 * with three arguments: (nsValue, key, nsObject).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = {};
	 *
	 * _.setWith(object, '[0][1]', 'a', Object);
	 * // => { '0': { '1': 'a' } }
	 */
	function setWith(object, path, value, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return object == null ? object : baseSet(object, path, value, customizer);
	}
	
	module.exports = setWith;


/***/ },
/* 236 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(205),
	    baseCreate = __webpack_require__(108),
	    baseForOwn = __webpack_require__(152),
	    baseIteratee = __webpack_require__(153),
	    getPrototype = __webpack_require__(130),
	    isArray = __webpack_require__(47),
	    isBuffer = __webpack_require__(48),
	    isFunction = __webpack_require__(13),
	    isObject = __webpack_require__(20),
	    isTypedArray = __webpack_require__(51);
	
	/**
	 * An alternative to `_.reduce`; this method transforms `object` to a new
	 * `accumulator` object which is the result of running each of its own
	 * enumerable string keyed properties thru `iteratee`, with each invocation
	 * potentially mutating the `accumulator` object. If `accumulator` is not
	 * provided, a new object with the same `[[Prototype]]` will be used. The
	 * iteratee is invoked with four arguments: (accumulator, value, key, object).
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.3.0
	 * @category Object
	 * @param {Object} object The object to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The custom accumulator value.
	 * @returns {*} Returns the accumulated value.
	 * @example
	 *
	 * _.transform([2, 3, 4], function(result, n) {
	 *   result.push(n *= n);
	 *   return n % 2 == 0;
	 * }, []);
	 * // => [4, 9]
	 *
	 * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
	 *   (result[value] || (result[value] = [])).push(key);
	 * }, {});
	 * // => { '1': ['a', 'c'], '2': ['b'] }
	 */
	function transform(object, iteratee, accumulator) {
	  var isArr = isArray(object),
	      isArrLike = isArr || isBuffer(object) || isTypedArray(object);
	
	  iteratee = baseIteratee(iteratee, 4);
	  if (accumulator == null) {
	    var Ctor = object && object.constructor;
	    if (isArrLike) {
	      accumulator = isArr ? new Ctor : [];
	    }
	    else if (isObject(object)) {
	      accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
	    }
	    else {
	      accumulator = {};
	    }
	  }
	  (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object) {
	    return iteratee(accumulator, value, index, object);
	  });
	  return accumulator;
	}
	
	module.exports = transform;


/***/ },
/* 237 */
/***/ function(module, exports, __webpack_require__) {

	var baseUnset = __webpack_require__(225);
	
	/**
	 * Removes the property at `path` of `object`.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to unset.
	 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 7 } }] };
	 * _.unset(object, 'a[0].b.c');
	 * // => true
	 *
	 * console.log(object);
	 * // => { 'a': [{ 'b': {} }] };
	 *
	 * _.unset(object, ['a', '0', 'b', 'c']);
	 * // => true
	 *
	 * console.log(object);
	 * // => { 'a': [{ 'b': {} }] };
	 */
	function unset(object, path) {
	  return object == null ? true : baseUnset(object, path);
	}
	
	module.exports = unset;


/***/ },
/* 238 */
/***/ function(module, exports, __webpack_require__) {

	var baseUpdate = __webpack_require__(239),
	    castFunction = __webpack_require__(181);
	
	/**
	 * This method is like `_.set` except that accepts `updater` to produce the
	 * value to set. Use `_.updateWith` to customize `path` creation. The `updater`
	 * is invoked with one argument: (value).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.6.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {Function} updater The function to produce the updated value.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.update(object, 'a[0].b.c', function(n) { return n * n; });
	 * console.log(object.a[0].b.c);
	 * // => 9
	 *
	 * _.update(object, 'x[0].y.z', function(n) { return n ? n + 1 : 0; });
	 * console.log(object.x[0].y.z);
	 * // => 0
	 */
	function update(object, path, updater) {
	  return object == null ? object : baseUpdate(object, path, castFunction(updater));
	}
	
	module.exports = update;


/***/ },
/* 239 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(67),
	    baseSet = __webpack_require__(230);
	
	/**
	 * The base implementation of `_.update`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to update.
	 * @param {Function} updater The function to produce the updated value.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseUpdate(object, path, updater, customizer) {
	  return baseSet(object, path, updater(baseGet(object, path)), customizer);
	}
	
	module.exports = baseUpdate;


/***/ },
/* 240 */
/***/ function(module, exports, __webpack_require__) {

	var baseUpdate = __webpack_require__(239),
	    castFunction = __webpack_require__(181);
	
	/**
	 * This method is like `_.update` except that it accepts `customizer` which is
	 * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
	 * path creation is handled by the method instead. The `customizer` is invoked
	 * with three arguments: (nsValue, key, nsObject).
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.6.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {Function} updater The function to produce the updated value.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = {};
	 *
	 * _.updateWith(object, '[0][1]', _.constant('a'), Object);
	 * // => { '0': { '1': 'a' } }
	 */
	function updateWith(object, path, updater, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
	}
	
	module.exports = updateWith;


/***/ },
/* 241 */
/***/ function(module, exports, __webpack_require__) {

	var baseValues = __webpack_require__(242),
	    keys = __webpack_require__(41);
	
	/**
	 * Creates an array of the own enumerable string keyed property values of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property values.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.values(new Foo);
	 * // => [1, 2] (iteration order is not guaranteed)
	 *
	 * _.values('hi');
	 * // => ['h', 'i']
	 */
	function values(object) {
	  return object == null ? [] : baseValues(object, keys(object));
	}
	
	module.exports = values;


/***/ },
/* 242 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99);
	
	/**
	 * The base implementation of `_.values` and `_.valuesIn` which creates an
	 * array of `object` property values corresponding to the property names
	 * of `props`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array} props The property names to get values for.
	 * @returns {Object} Returns the array of property values.
	 */
	function baseValues(object, props) {
	  return arrayMap(props, function(key) {
	    return object[key];
	  });
	}
	
	module.exports = baseValues;


/***/ },
/* 243 */
/***/ function(module, exports, __webpack_require__) {

	var baseValues = __webpack_require__(242),
	    keysIn = __webpack_require__(59);
	
	/**
	 * Creates an array of the own and inherited enumerable string keyed property
	 * values of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property values.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.valuesIn(new Foo);
	 * // => [1, 2, 3] (iteration order is not guaranteed)
	 */
	function valuesIn(object) {
	  return object == null ? [] : baseValues(object, keysIn(object));
	}
	
	module.exports = valuesIn;


/***/ },
/* 244 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate) {// vim:ts=4:sts=4:sw=4:
	/*!
	 *
	 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
	 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
	 *
	 * With parts by Tyler Close
	 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
	 * at http://www.opensource.org/licenses/mit-license.html
	 * Forked at ref_send.js version: 2009-05-11
	 *
	 * With parts by Mark Miller
	 * Copyright (C) 2011 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 */
	
	(function (definition) {
	    "use strict";
	
	    // This file will function properly as a <script> tag, or a module
	    // using CommonJS and NodeJS or RequireJS module formats.  In
	    // Common/Node/RequireJS, the module exports the Q API and when
	    // executed as a simple <script>, it creates a Q global instead.
	
	    // Montage Require
	    if (typeof bootstrap === "function") {
	        bootstrap("promise", definition);
	
	    // CommonJS
	    } else if (true) {
	        module.exports = definition();
	
	    // RequireJS
	    } else if (typeof define === "function" && define.amd) {
	        define(definition);
	
	    // SES (Secure EcmaScript)
	    } else if (typeof ses !== "undefined") {
	        if (!ses.ok()) {
	            return;
	        } else {
	            ses.makeQ = definition;
	        }
	
	    // <script>
	    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
	        // Prefer window over self for add-on scripts. Use self for
	        // non-windowed contexts.
	        var global = typeof window !== "undefined" ? window : self;
	
	        // Get the `window` object, save the previous Q global
	        // and initialize Q as a global.
	        var previousQ = global.Q;
	        global.Q = definition();
	
	        // Add a noConflict function so Q can be removed from the
	        // global namespace.
	        global.Q.noConflict = function () {
	            global.Q = previousQ;
	            return this;
	        };
	
	    } else {
	        throw new Error("This environment was not anticipated by Q. Please file a bug.");
	    }
	
	})(function () {
	"use strict";
	
	var hasStacks = false;
	try {
	    throw new Error();
	} catch (e) {
	    hasStacks = !!e.stack;
	}
	
	// All code after this point will be filtered from stack traces reported
	// by Q.
	var qStartingLine = captureLine();
	var qFileName;
	
	// shims
	
	// used for fallback in "allResolved"
	var noop = function () {};
	
	// Use the fastest possible means to execute a task in a future turn
	// of the event loop.
	var nextTick =(function () {
	    // linked list of tasks (single, with head node)
	    var head = {task: void 0, next: null};
	    var tail = head;
	    var flushing = false;
	    var requestTick = void 0;
	    var isNodeJS = false;
	    // queue for late tasks, used by unhandled rejection tracking
	    var laterQueue = [];
	
	    function flush() {
	        /* jshint loopfunc: true */
	        var task, domain;
	
	        while (head.next) {
	            head = head.next;
	            task = head.task;
	            head.task = void 0;
	            domain = head.domain;
	
	            if (domain) {
	                head.domain = void 0;
	                domain.enter();
	            }
	            runSingle(task, domain);
	
	        }
	        while (laterQueue.length) {
	            task = laterQueue.pop();
	            runSingle(task);
	        }
	        flushing = false;
	    }
	    // runs a single function in the async queue
	    function runSingle(task, domain) {
	        try {
	            task();
	
	        } catch (e) {
	            if (isNodeJS) {
	                // In node, uncaught exceptions are considered fatal errors.
	                // Re-throw them synchronously to interrupt flushing!
	
	                // Ensure continuation if the uncaught exception is suppressed
	                // listening "uncaughtException" events (as domains does).
	                // Continue in next event to avoid tick recursion.
	                if (domain) {
	                    domain.exit();
	                }
	                setTimeout(flush, 0);
	                if (domain) {
	                    domain.enter();
	                }
	
	                throw e;
	
	            } else {
	                // In browsers, uncaught exceptions are not fatal.
	                // Re-throw them asynchronously to avoid slow-downs.
	                setTimeout(function () {
	                    throw e;
	                }, 0);
	            }
	        }
	
	        if (domain) {
	            domain.exit();
	        }
	    }
	
	    nextTick = function (task) {
	        tail = tail.next = {
	            task: task,
	            domain: isNodeJS && process.domain,
	            next: null
	        };
	
	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };
	
	    if (typeof process === "object" &&
	        process.toString() === "[object process]" && process.nextTick) {
	        // Ensure Q is in a real Node environment, with a `process.nextTick`.
	        // To see through fake Node environments:
	        // * Mocha test runner - exposes a `process` global without a `nextTick`
	        // * Browserify - exposes a `process.nexTick` function that uses
	        //   `setTimeout`. In this case `setImmediate` is preferred because
	        //    it is faster. Browserify's `process.toString()` yields
	        //   "[object Object]", while in a real Node environment
	        //   `process.nextTick()` yields "[object process]".
	        isNodeJS = true;
	
	        requestTick = function () {
	            process.nextTick(flush);
	        };
	
	    } else if (typeof setImmediate === "function") {
	        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
	        if (typeof window !== "undefined") {
	            requestTick = setImmediate.bind(window, flush);
	        } else {
	            requestTick = function () {
	                setImmediate(flush);
	            };
	        }
	
	    } else if (typeof MessageChannel !== "undefined") {
	        // modern browsers
	        // http://www.nonblocking.io/2011/06/windownexttick.html
	        var channel = new MessageChannel();
	        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
	        // working message ports the first time a page loads.
	        channel.port1.onmessage = function () {
	            requestTick = requestPortTick;
	            channel.port1.onmessage = flush;
	            flush();
	        };
	        var requestPortTick = function () {
	            // Opera requires us to provide a message payload, regardless of
	            // whether we use it.
	            channel.port2.postMessage(0);
	        };
	        requestTick = function () {
	            setTimeout(flush, 0);
	            requestPortTick();
	        };
	
	    } else {
	        // old browsers
	        requestTick = function () {
	            setTimeout(flush, 0);
	        };
	    }
	    // runs a task after all other tasks have been run
	    // this is useful for unhandled rejection tracking that needs to happen
	    // after all `then`d tasks have been run.
	    nextTick.runAfter = function (task) {
	        laterQueue.push(task);
	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };
	    return nextTick;
	})();
	
	// Attempt to make generics safe in the face of downstream
	// modifications.
	// There is no situation where this is necessary.
	// If you need a security guarantee, these primordials need to be
	// deeply frozen anyway, and if you don’t need a security guarantee,
	// this is just plain paranoid.
	// However, this **might** have the nice side-effect of reducing the size of
	// the minified code by reducing x.call() to merely x()
	// See Mark Miller’s explanation of what this does.
	// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
	var call = Function.call;
	function uncurryThis(f) {
	    return function () {
	        return call.apply(f, arguments);
	    };
	}
	// This is equivalent, but slower:
	// uncurryThis = Function_bind.bind(Function_bind.call);
	// http://jsperf.com/uncurrythis
	
	var array_slice = uncurryThis(Array.prototype.slice);
	
	var array_reduce = uncurryThis(
	    Array.prototype.reduce || function (callback, basis) {
	        var index = 0,
	            length = this.length;
	        // concerning the initial value, if one is not provided
	        if (arguments.length === 1) {
	            // seek to the first value in the array, accounting
	            // for the possibility that is is a sparse array
	            do {
	                if (index in this) {
	                    basis = this[index++];
	                    break;
	                }
	                if (++index >= length) {
	                    throw new TypeError();
	                }
	            } while (1);
	        }
	        // reduce
	        for (; index < length; index++) {
	            // account for the possibility that the array is sparse
	            if (index in this) {
	                basis = callback(basis, this[index], index);
	            }
	        }
	        return basis;
	    }
	);
	
	var array_indexOf = uncurryThis(
	    Array.prototype.indexOf || function (value) {
	        // not a very good shim, but good enough for our one use of it
	        for (var i = 0; i < this.length; i++) {
	            if (this[i] === value) {
	                return i;
	            }
	        }
	        return -1;
	    }
	);
	
	var array_map = uncurryThis(
	    Array.prototype.map || function (callback, thisp) {
	        var self = this;
	        var collect = [];
	        array_reduce(self, function (undefined, value, index) {
	            collect.push(callback.call(thisp, value, index, self));
	        }, void 0);
	        return collect;
	    }
	);
	
	var object_create = Object.create || function (prototype) {
	    function Type() { }
	    Type.prototype = prototype;
	    return new Type();
	};
	
	var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
	
	var object_keys = Object.keys || function (object) {
	    var keys = [];
	    for (var key in object) {
	        if (object_hasOwnProperty(object, key)) {
	            keys.push(key);
	        }
	    }
	    return keys;
	};
	
	var object_toString = uncurryThis(Object.prototype.toString);
	
	function isObject(value) {
	    return value === Object(value);
	}
	
	// generator related shims
	
	// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
	function isStopIteration(exception) {
	    return (
	        object_toString(exception) === "[object StopIteration]" ||
	        exception instanceof QReturnValue
	    );
	}
	
	// FIXME: Remove this helper and Q.return once ES6 generators are in
	// SpiderMonkey.
	var QReturnValue;
	if (typeof ReturnValue !== "undefined") {
	    QReturnValue = ReturnValue;
	} else {
	    QReturnValue = function (value) {
	        this.value = value;
	    };
	}
	
	// long stack traces
	
	var STACK_JUMP_SEPARATOR = "From previous event:";
	
	function makeStackTraceLong(error, promise) {
	    // If possible, transform the error stack trace by removing Node and Q
	    // cruft, then concatenating with the stack trace of `promise`. See #57.
	    if (hasStacks &&
	        promise.stack &&
	        typeof error === "object" &&
	        error !== null &&
	        error.stack &&
	        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
	    ) {
	        var stacks = [];
	        for (var p = promise; !!p; p = p.source) {
	            if (p.stack) {
	                stacks.unshift(p.stack);
	            }
	        }
	        stacks.unshift(error.stack);
	
	        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
	        error.stack = filterStackString(concatedStacks);
	    }
	}
	
	function filterStackString(stackString) {
	    var lines = stackString.split("\n");
	    var desiredLines = [];
	    for (var i = 0; i < lines.length; ++i) {
	        var line = lines[i];
	
	        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
	            desiredLines.push(line);
	        }
	    }
	    return desiredLines.join("\n");
	}
	
	function isNodeFrame(stackLine) {
	    return stackLine.indexOf("(module.js:") !== -1 ||
	           stackLine.indexOf("(node.js:") !== -1;
	}
	
	function getFileNameAndLineNumber(stackLine) {
	    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
	    // In IE10 function name can have spaces ("Anonymous function") O_o
	    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
	    if (attempt1) {
	        return [attempt1[1], Number(attempt1[2])];
	    }
	
	    // Anonymous functions: "at filename:lineNumber:columnNumber"
	    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
	    if (attempt2) {
	        return [attempt2[1], Number(attempt2[2])];
	    }
	
	    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
	    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
	    if (attempt3) {
	        return [attempt3[1], Number(attempt3[2])];
	    }
	}
	
	function isInternalFrame(stackLine) {
	    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
	
	    if (!fileNameAndLineNumber) {
	        return false;
	    }
	
	    var fileName = fileNameAndLineNumber[0];
	    var lineNumber = fileNameAndLineNumber[1];
	
	    return fileName === qFileName &&
	        lineNumber >= qStartingLine &&
	        lineNumber <= qEndingLine;
	}
	
	// discover own file name and line number range for filtering stack
	// traces
	function captureLine() {
	    if (!hasStacks) {
	        return;
	    }
	
	    try {
	        throw new Error();
	    } catch (e) {
	        var lines = e.stack.split("\n");
	        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
	        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
	        if (!fileNameAndLineNumber) {
	            return;
	        }
	
	        qFileName = fileNameAndLineNumber[0];
	        return fileNameAndLineNumber[1];
	    }
	}
	
	function deprecate(callback, name, alternative) {
	    return function () {
	        if (typeof console !== "undefined" &&
	            typeof console.warn === "function") {
	            console.warn(name + " is deprecated, use " + alternative +
	                         " instead.", new Error("").stack);
	        }
	        return callback.apply(callback, arguments);
	    };
	}
	
	// end of shims
	// beginning of real work
	
	/**
	 * Constructs a promise for an immediate reference, passes promises through, or
	 * coerces promises from different systems.
	 * @param value immediate reference or promise
	 */
	function Q(value) {
	    // If the object is already a Promise, return it directly.  This enables
	    // the resolve function to both be used to created references from objects,
	    // but to tolerably coerce non-promises to promises.
	    if (value instanceof Promise) {
	        return value;
	    }
	
	    // assimilate thenables
	    if (isPromiseAlike(value)) {
	        return coerce(value);
	    } else {
	        return fulfill(value);
	    }
	}
	Q.resolve = Q;
	
	/**
	 * Performs a task in a future turn of the event loop.
	 * @param {Function} task
	 */
	Q.nextTick = nextTick;
	
	/**
	 * Controls whether or not long stack traces will be on
	 */
	Q.longStackSupport = false;
	
	// enable long stacks if Q_DEBUG is set
	if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
	    Q.longStackSupport = true;
	}
	
	/**
	 * Constructs a {promise, resolve, reject} object.
	 *
	 * `resolve` is a callback to invoke with a more resolved value for the
	 * promise. To fulfill the promise, invoke `resolve` with any value that is
	 * not a thenable. To reject the promise, invoke `resolve` with a rejected
	 * thenable, or invoke `reject` with the reason directly. To resolve the
	 * promise to another thenable, thus putting it in the same state, invoke
	 * `resolve` with that other thenable.
	 */
	Q.defer = defer;
	function defer() {
	    // if "messages" is an "Array", that indicates that the promise has not yet
	    // been resolved.  If it is "undefined", it has been resolved.  Each
	    // element of the messages array is itself an array of complete arguments to
	    // forward to the resolved promise.  We coerce the resolution value to a
	    // promise using the `resolve` function because it handles both fully
	    // non-thenable values and other thenables gracefully.
	    var messages = [], progressListeners = [], resolvedPromise;
	
	    var deferred = object_create(defer.prototype);
	    var promise = object_create(Promise.prototype);
	
	    promise.promiseDispatch = function (resolve, op, operands) {
	        var args = array_slice(arguments);
	        if (messages) {
	            messages.push(args);
	            if (op === "when" && operands[1]) { // progress operand
	                progressListeners.push(operands[1]);
	            }
	        } else {
	            Q.nextTick(function () {
	                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
	            });
	        }
	    };
	
	    // XXX deprecated
	    promise.valueOf = function () {
	        if (messages) {
	            return promise;
	        }
	        var nearerValue = nearer(resolvedPromise);
	        if (isPromise(nearerValue)) {
	            resolvedPromise = nearerValue; // shorten chain
	        }
	        return nearerValue;
	    };
	
	    promise.inspect = function () {
	        if (!resolvedPromise) {
	            return { state: "pending" };
	        }
	        return resolvedPromise.inspect();
	    };
	
	    if (Q.longStackSupport && hasStacks) {
	        try {
	            throw new Error();
	        } catch (e) {
	            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
	            // accessor around; that causes memory leaks as per GH-111. Just
	            // reify the stack trace as a string ASAP.
	            //
	            // At the same time, cut off the first line; it's always just
	            // "[object Promise]\n", as per the `toString`.
	            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
	        }
	    }
	
	    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
	    // consolidating them into `become`, since otherwise we'd create new
	    // promises with the lines `become(whatever(value))`. See e.g. GH-252.
	
	    function become(newPromise) {
	        resolvedPromise = newPromise;
	        promise.source = newPromise;
	
	        array_reduce(messages, function (undefined, message) {
	            Q.nextTick(function () {
	                newPromise.promiseDispatch.apply(newPromise, message);
	            });
	        }, void 0);
	
	        messages = void 0;
	        progressListeners = void 0;
	    }
	
	    deferred.promise = promise;
	    deferred.resolve = function (value) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(Q(value));
	    };
	
	    deferred.fulfill = function (value) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(fulfill(value));
	    };
	    deferred.reject = function (reason) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(reject(reason));
	    };
	    deferred.notify = function (progress) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        array_reduce(progressListeners, function (undefined, progressListener) {
	            Q.nextTick(function () {
	                progressListener(progress);
	            });
	        }, void 0);
	    };
	
	    return deferred;
	}
	
	/**
	 * Creates a Node-style callback that will resolve or reject the deferred
	 * promise.
	 * @returns a nodeback
	 */
	defer.prototype.makeNodeResolver = function () {
	    var self = this;
	    return function (error, value) {
	        if (error) {
	            self.reject(error);
	        } else if (arguments.length > 2) {
	            self.resolve(array_slice(arguments, 1));
	        } else {
	            self.resolve(value);
	        }
	    };
	};
	
	/**
	 * @param resolver {Function} a function that returns nothing and accepts
	 * the resolve, reject, and notify functions for a deferred.
	 * @returns a promise that may be resolved with the given resolve and reject
	 * functions, or rejected by a thrown exception in resolver
	 */
	Q.Promise = promise; // ES6
	Q.promise = promise;
	function promise(resolver) {
	    if (typeof resolver !== "function") {
	        throw new TypeError("resolver must be a function.");
	    }
	    var deferred = defer();
	    try {
	        resolver(deferred.resolve, deferred.reject, deferred.notify);
	    } catch (reason) {
	        deferred.reject(reason);
	    }
	    return deferred.promise;
	}
	
	promise.race = race; // ES6
	promise.all = all; // ES6
	promise.reject = reject; // ES6
	promise.resolve = Q; // ES6
	
	// XXX experimental.  This method is a way to denote that a local value is
	// serializable and should be immediately dispatched to a remote upon request,
	// instead of passing a reference.
	Q.passByCopy = function (object) {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return object;
	};
	
	Promise.prototype.passByCopy = function () {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return this;
	};
	
	/**
	 * If two promises eventually fulfill to the same value, promises that value,
	 * but otherwise rejects.
	 * @param x {Any*}
	 * @param y {Any*}
	 * @returns {Any*} a promise for x and y if they are the same, but a rejection
	 * otherwise.
	 *
	 */
	Q.join = function (x, y) {
	    return Q(x).join(y);
	};
	
	Promise.prototype.join = function (that) {
	    return Q([this, that]).spread(function (x, y) {
	        if (x === y) {
	            // TODO: "===" should be Object.is or equiv
	            return x;
	        } else {
	            throw new Error("Can't join: not the same: " + x + " " + y);
	        }
	    });
	};
	
	/**
	 * Returns a promise for the first of an array of promises to become settled.
	 * @param answers {Array[Any*]} promises to race
	 * @returns {Any*} the first promise to be settled
	 */
	Q.race = race;
	function race(answerPs) {
	    return promise(function (resolve, reject) {
	        // Switch to this once we can assume at least ES5
	        // answerPs.forEach(function (answerP) {
	        //     Q(answerP).then(resolve, reject);
	        // });
	        // Use this in the meantime
	        for (var i = 0, len = answerPs.length; i < len; i++) {
	            Q(answerPs[i]).then(resolve, reject);
	        }
	    });
	}
	
	Promise.prototype.race = function () {
	    return this.then(Q.race);
	};
	
	/**
	 * Constructs a Promise with a promise descriptor object and optional fallback
	 * function.  The descriptor contains methods like when(rejected), get(name),
	 * set(name, value), post(name, args), and delete(name), which all
	 * return either a value, a promise for a value, or a rejection.  The fallback
	 * accepts the operation name, a resolver, and any further arguments that would
	 * have been forwarded to the appropriate method above had a method been
	 * provided with the proper name.  The API makes no guarantees about the nature
	 * of the returned object, apart from that it is usable whereever promises are
	 * bought and sold.
	 */
	Q.makePromise = Promise;
	function Promise(descriptor, fallback, inspect) {
	    if (fallback === void 0) {
	        fallback = function (op) {
	            return reject(new Error(
	                "Promise does not support operation: " + op
	            ));
	        };
	    }
	    if (inspect === void 0) {
	        inspect = function () {
	            return {state: "unknown"};
	        };
	    }
	
	    var promise = object_create(Promise.prototype);
	
	    promise.promiseDispatch = function (resolve, op, args) {
	        var result;
	        try {
	            if (descriptor[op]) {
	                result = descriptor[op].apply(promise, args);
	            } else {
	                result = fallback.call(promise, op, args);
	            }
	        } catch (exception) {
	            result = reject(exception);
	        }
	        if (resolve) {
	            resolve(result);
	        }
	    };
	
	    promise.inspect = inspect;
	
	    // XXX deprecated `valueOf` and `exception` support
	    if (inspect) {
	        var inspected = inspect();
	        if (inspected.state === "rejected") {
	            promise.exception = inspected.reason;
	        }
	
	        promise.valueOf = function () {
	            var inspected = inspect();
	            if (inspected.state === "pending" ||
	                inspected.state === "rejected") {
	                return promise;
	            }
	            return inspected.value;
	        };
	    }
	
	    return promise;
	}
	
	Promise.prototype.toString = function () {
	    return "[object Promise]";
	};
	
	Promise.prototype.then = function (fulfilled, rejected, progressed) {
	    var self = this;
	    var deferred = defer();
	    var done = false;   // ensure the untrusted promise makes at most a
	                        // single call to one of the callbacks
	
	    function _fulfilled(value) {
	        try {
	            return typeof fulfilled === "function" ? fulfilled(value) : value;
	        } catch (exception) {
	            return reject(exception);
	        }
	    }
	
	    function _rejected(exception) {
	        if (typeof rejected === "function") {
	            makeStackTraceLong(exception, self);
	            try {
	                return rejected(exception);
	            } catch (newException) {
	                return reject(newException);
	            }
	        }
	        return reject(exception);
	    }
	
	    function _progressed(value) {
	        return typeof progressed === "function" ? progressed(value) : value;
	    }
	
	    Q.nextTick(function () {
	        self.promiseDispatch(function (value) {
	            if (done) {
	                return;
	            }
	            done = true;
	
	            deferred.resolve(_fulfilled(value));
	        }, "when", [function (exception) {
	            if (done) {
	                return;
	            }
	            done = true;
	
	            deferred.resolve(_rejected(exception));
	        }]);
	    });
	
	    // Progress propagator need to be attached in the current tick.
	    self.promiseDispatch(void 0, "when", [void 0, function (value) {
	        var newValue;
	        var threw = false;
	        try {
	            newValue = _progressed(value);
	        } catch (e) {
	            threw = true;
	            if (Q.onerror) {
	                Q.onerror(e);
	            } else {
	                throw e;
	            }
	        }
	
	        if (!threw) {
	            deferred.notify(newValue);
	        }
	    }]);
	
	    return deferred.promise;
	};
	
	Q.tap = function (promise, callback) {
	    return Q(promise).tap(callback);
	};
	
	/**
	 * Works almost like "finally", but not called for rejections.
	 * Original resolution value is passed through callback unaffected.
	 * Callback may return a promise that will be awaited for.
	 * @param {Function} callback
	 * @returns {Q.Promise}
	 * @example
	 * doSomething()
	 *   .then(...)
	 *   .tap(console.log)
	 *   .then(...);
	 */
	Promise.prototype.tap = function (callback) {
	    callback = Q(callback);
	
	    return this.then(function (value) {
	        return callback.fcall(value).thenResolve(value);
	    });
	};
	
	/**
	 * Registers an observer on a promise.
	 *
	 * Guarantees:
	 *
	 * 1. that fulfilled and rejected will be called only once.
	 * 2. that either the fulfilled callback or the rejected callback will be
	 *    called, but not both.
	 * 3. that fulfilled and rejected will not be called in this turn.
	 *
	 * @param value      promise or immediate reference to observe
	 * @param fulfilled  function to be called with the fulfilled value
	 * @param rejected   function to be called with the rejection exception
	 * @param progressed function to be called on any progress notifications
	 * @return promise for the return value from the invoked callback
	 */
	Q.when = when;
	function when(value, fulfilled, rejected, progressed) {
	    return Q(value).then(fulfilled, rejected, progressed);
	}
	
	Promise.prototype.thenResolve = function (value) {
	    return this.then(function () { return value; });
	};
	
	Q.thenResolve = function (promise, value) {
	    return Q(promise).thenResolve(value);
	};
	
	Promise.prototype.thenReject = function (reason) {
	    return this.then(function () { throw reason; });
	};
	
	Q.thenReject = function (promise, reason) {
	    return Q(promise).thenReject(reason);
	};
	
	/**
	 * If an object is not a promise, it is as "near" as possible.
	 * If a promise is rejected, it is as "near" as possible too.
	 * If it’s a fulfilled promise, the fulfillment value is nearer.
	 * If it’s a deferred promise and the deferred has been resolved, the
	 * resolution is "nearer".
	 * @param object
	 * @returns most resolved (nearest) form of the object
	 */
	
	// XXX should we re-do this?
	Q.nearer = nearer;
	function nearer(value) {
	    if (isPromise(value)) {
	        var inspected = value.inspect();
	        if (inspected.state === "fulfilled") {
	            return inspected.value;
	        }
	    }
	    return value;
	}
	
	/**
	 * @returns whether the given object is a promise.
	 * Otherwise it is a fulfilled value.
	 */
	Q.isPromise = isPromise;
	function isPromise(object) {
	    return object instanceof Promise;
	}
	
	Q.isPromiseAlike = isPromiseAlike;
	function isPromiseAlike(object) {
	    return isObject(object) && typeof object.then === "function";
	}
	
	/**
	 * @returns whether the given object is a pending promise, meaning not
	 * fulfilled or rejected.
	 */
	Q.isPending = isPending;
	function isPending(object) {
	    return isPromise(object) && object.inspect().state === "pending";
	}
	
	Promise.prototype.isPending = function () {
	    return this.inspect().state === "pending";
	};
	
	/**
	 * @returns whether the given object is a value or fulfilled
	 * promise.
	 */
	Q.isFulfilled = isFulfilled;
	function isFulfilled(object) {
	    return !isPromise(object) || object.inspect().state === "fulfilled";
	}
	
	Promise.prototype.isFulfilled = function () {
	    return this.inspect().state === "fulfilled";
	};
	
	/**
	 * @returns whether the given object is a rejected promise.
	 */
	Q.isRejected = isRejected;
	function isRejected(object) {
	    return isPromise(object) && object.inspect().state === "rejected";
	}
	
	Promise.prototype.isRejected = function () {
	    return this.inspect().state === "rejected";
	};
	
	//// BEGIN UNHANDLED REJECTION TRACKING
	
	// This promise library consumes exceptions thrown in handlers so they can be
	// handled by a subsequent promise.  The exceptions get added to this array when
	// they are created, and removed when they are handled.  Note that in ES6 or
	// shimmed environments, this would naturally be a `Set`.
	var unhandledReasons = [];
	var unhandledRejections = [];
	var reportedUnhandledRejections = [];
	var trackUnhandledRejections = true;
	
	function resetUnhandledRejections() {
	    unhandledReasons.length = 0;
	    unhandledRejections.length = 0;
	
	    if (!trackUnhandledRejections) {
	        trackUnhandledRejections = true;
	    }
	}
	
	function trackRejection(promise, reason) {
	    if (!trackUnhandledRejections) {
	        return;
	    }
	    if (typeof process === "object" && typeof process.emit === "function") {
	        Q.nextTick.runAfter(function () {
	            if (array_indexOf(unhandledRejections, promise) !== -1) {
	                process.emit("unhandledRejection", reason, promise);
	                reportedUnhandledRejections.push(promise);
	            }
	        });
	    }
	
	    unhandledRejections.push(promise);
	    if (reason && typeof reason.stack !== "undefined") {
	        unhandledReasons.push(reason.stack);
	    } else {
	        unhandledReasons.push("(no stack) " + reason);
	    }
	}
	
	function untrackRejection(promise) {
	    if (!trackUnhandledRejections) {
	        return;
	    }
	
	    var at = array_indexOf(unhandledRejections, promise);
	    if (at !== -1) {
	        if (typeof process === "object" && typeof process.emit === "function") {
	            Q.nextTick.runAfter(function () {
	                var atReport = array_indexOf(reportedUnhandledRejections, promise);
	                if (atReport !== -1) {
	                    process.emit("rejectionHandled", unhandledReasons[at], promise);
	                    reportedUnhandledRejections.splice(atReport, 1);
	                }
	            });
	        }
	        unhandledRejections.splice(at, 1);
	        unhandledReasons.splice(at, 1);
	    }
	}
	
	Q.resetUnhandledRejections = resetUnhandledRejections;
	
	Q.getUnhandledReasons = function () {
	    // Make a copy so that consumers can't interfere with our internal state.
	    return unhandledReasons.slice();
	};
	
	Q.stopUnhandledRejectionTracking = function () {
	    resetUnhandledRejections();
	    trackUnhandledRejections = false;
	};
	
	resetUnhandledRejections();
	
	//// END UNHANDLED REJECTION TRACKING
	
	/**
	 * Constructs a rejected promise.
	 * @param reason value describing the failure
	 */
	Q.reject = reject;
	function reject(reason) {
	    var rejection = Promise({
	        "when": function (rejected) {
	            // note that the error has been handled
	            if (rejected) {
	                untrackRejection(this);
	            }
	            return rejected ? rejected(reason) : this;
	        }
	    }, function fallback() {
	        return this;
	    }, function inspect() {
	        return { state: "rejected", reason: reason };
	    });
	
	    // Note that the reason has not been handled.
	    trackRejection(rejection, reason);
	
	    return rejection;
	}
	
	/**
	 * Constructs a fulfilled promise for an immediate reference.
	 * @param value immediate reference
	 */
	Q.fulfill = fulfill;
	function fulfill(value) {
	    return Promise({
	        "when": function () {
	            return value;
	        },
	        "get": function (name) {
	            return value[name];
	        },
	        "set": function (name, rhs) {
	            value[name] = rhs;
	        },
	        "delete": function (name) {
	            delete value[name];
	        },
	        "post": function (name, args) {
	            // Mark Miller proposes that post with no name should apply a
	            // promised function.
	            if (name === null || name === void 0) {
	                return value.apply(void 0, args);
	            } else {
	                return value[name].apply(value, args);
	            }
	        },
	        "apply": function (thisp, args) {
	            return value.apply(thisp, args);
	        },
	        "keys": function () {
	            return object_keys(value);
	        }
	    }, void 0, function inspect() {
	        return { state: "fulfilled", value: value };
	    });
	}
	
	/**
	 * Converts thenables to Q promises.
	 * @param promise thenable promise
	 * @returns a Q promise
	 */
	function coerce(promise) {
	    var deferred = defer();
	    Q.nextTick(function () {
	        try {
	            promise.then(deferred.resolve, deferred.reject, deferred.notify);
	        } catch (exception) {
	            deferred.reject(exception);
	        }
	    });
	    return deferred.promise;
	}
	
	/**
	 * Annotates an object such that it will never be
	 * transferred away from this process over any promise
	 * communication channel.
	 * @param object
	 * @returns promise a wrapping of that object that
	 * additionally responds to the "isDef" message
	 * without a rejection.
	 */
	Q.master = master;
	function master(object) {
	    return Promise({
	        "isDef": function () {}
	    }, function fallback(op, args) {
	        return dispatch(object, op, args);
	    }, function () {
	        return Q(object).inspect();
	    });
	}
	
	/**
	 * Spreads the values of a promised array of arguments into the
	 * fulfillment callback.
	 * @param fulfilled callback that receives variadic arguments from the
	 * promised array
	 * @param rejected callback that receives the exception if the promise
	 * is rejected.
	 * @returns a promise for the return value or thrown exception of
	 * either callback.
	 */
	Q.spread = spread;
	function spread(value, fulfilled, rejected) {
	    return Q(value).spread(fulfilled, rejected);
	}
	
	Promise.prototype.spread = function (fulfilled, rejected) {
	    return this.all().then(function (array) {
	        return fulfilled.apply(void 0, array);
	    }, rejected);
	};
	
	/**
	 * The async function is a decorator for generator functions, turning
	 * them into asynchronous generators.  Although generators are only part
	 * of the newest ECMAScript 6 drafts, this code does not cause syntax
	 * errors in older engines.  This code should continue to work and will
	 * in fact improve over time as the language improves.
	 *
	 * ES6 generators are currently part of V8 version 3.19 with the
	 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
	 * for longer, but under an older Python-inspired form.  This function
	 * works on both kinds of generators.
	 *
	 * Decorates a generator function such that:
	 *  - it may yield promises
	 *  - execution will continue when that promise is fulfilled
	 *  - the value of the yield expression will be the fulfilled value
	 *  - it returns a promise for the return value (when the generator
	 *    stops iterating)
	 *  - the decorated function returns a promise for the return value
	 *    of the generator or the first rejected promise among those
	 *    yielded.
	 *  - if an error is thrown in the generator, it propagates through
	 *    every following yield until it is caught, or until it escapes
	 *    the generator function altogether, and is translated into a
	 *    rejection for the promise returned by the decorated generator.
	 */
	Q.async = async;
	function async(makeGenerator) {
	    return function () {
	        // when verb is "send", arg is a value
	        // when verb is "throw", arg is an exception
	        function continuer(verb, arg) {
	            var result;
	
	            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
	            // engine that has a deployed base of browsers that support generators.
	            // However, SM's generators use the Python-inspired semantics of
	            // outdated ES6 drafts.  We would like to support ES6, but we'd also
	            // like to make it possible to use generators in deployed browsers, so
	            // we also support Python-style generators.  At some point we can remove
	            // this block.
	
	            if (typeof StopIteration === "undefined") {
	                // ES6 Generators
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    return reject(exception);
	                }
	                if (result.done) {
	                    return Q(result.value);
	                } else {
	                    return when(result.value, callback, errback);
	                }
	            } else {
	                // SpiderMonkey Generators
	                // FIXME: Remove this case when SM does ES6 generators.
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    if (isStopIteration(exception)) {
	                        return Q(exception.value);
	                    } else {
	                        return reject(exception);
	                    }
	                }
	                return when(result, callback, errback);
	            }
	        }
	        var generator = makeGenerator.apply(this, arguments);
	        var callback = continuer.bind(continuer, "next");
	        var errback = continuer.bind(continuer, "throw");
	        return callback();
	    };
	}
	
	/**
	 * The spawn function is a small wrapper around async that immediately
	 * calls the generator and also ends the promise chain, so that any
	 * unhandled errors are thrown instead of forwarded to the error
	 * handler. This is useful because it's extremely common to run
	 * generators at the top-level to work with libraries.
	 */
	Q.spawn = spawn;
	function spawn(makeGenerator) {
	    Q.done(Q.async(makeGenerator)());
	}
	
	// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
	/**
	 * Throws a ReturnValue exception to stop an asynchronous generator.
	 *
	 * This interface is a stop-gap measure to support generator return
	 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
	 * generators like Chromium 29, just use "return" in your generator
	 * functions.
	 *
	 * @param value the return value for the surrounding generator
	 * @throws ReturnValue exception with the value.
	 * @example
	 * // ES6 style
	 * Q.async(function* () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      return foo + bar;
	 * })
	 * // Older SpiderMonkey style
	 * Q.async(function () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      Q.return(foo + bar);
	 * })
	 */
	Q["return"] = _return;
	function _return(value) {
	    throw new QReturnValue(value);
	}
	
	/**
	 * The promised function decorator ensures that any promise arguments
	 * are settled and passed as values (`this` is also settled and passed
	 * as a value).  It will also ensure that the result of a function is
	 * always a promise.
	 *
	 * @example
	 * var add = Q.promised(function (a, b) {
	 *     return a + b;
	 * });
	 * add(Q(a), Q(B));
	 *
	 * @param {function} callback The function to decorate
	 * @returns {function} a function that has been decorated.
	 */
	Q.promised = promised;
	function promised(callback) {
	    return function () {
	        return spread([this, all(arguments)], function (self, args) {
	            return callback.apply(self, args);
	        });
	    };
	}
	
	/**
	 * sends a message to a value in a future turn
	 * @param object* the recipient
	 * @param op the name of the message operation, e.g., "when",
	 * @param args further arguments to be forwarded to the operation
	 * @returns result {Promise} a promise for the result of the operation
	 */
	Q.dispatch = dispatch;
	function dispatch(object, op, args) {
	    return Q(object).dispatch(op, args);
	}
	
	Promise.prototype.dispatch = function (op, args) {
	    var self = this;
	    var deferred = defer();
	    Q.nextTick(function () {
	        self.promiseDispatch(deferred.resolve, op, args);
	    });
	    return deferred.promise;
	};
	
	/**
	 * Gets the value of a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to get
	 * @return promise for the property value
	 */
	Q.get = function (object, key) {
	    return Q(object).dispatch("get", [key]);
	};
	
	Promise.prototype.get = function (key) {
	    return this.dispatch("get", [key]);
	};
	
	/**
	 * Sets the value of a property in a future turn.
	 * @param object    promise or immediate reference for object object
	 * @param name      name of property to set
	 * @param value     new value of property
	 * @return promise for the return value
	 */
	Q.set = function (object, key, value) {
	    return Q(object).dispatch("set", [key, value]);
	};
	
	Promise.prototype.set = function (key, value) {
	    return this.dispatch("set", [key, value]);
	};
	
	/**
	 * Deletes a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to delete
	 * @return promise for the return value
	 */
	Q.del = // XXX legacy
	Q["delete"] = function (object, key) {
	    return Q(object).dispatch("delete", [key]);
	};
	
	Promise.prototype.del = // XXX legacy
	Promise.prototype["delete"] = function (key) {
	    return this.dispatch("delete", [key]);
	};
	
	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param value     a value to post, typically an array of
	 *                  invocation arguments for promises that
	 *                  are ultimately backed with `resolve` values,
	 *                  as opposed to those backed with URLs
	 *                  wherein the posted value can be any
	 *                  JSON serializable object.
	 * @return promise for the return value
	 */
	// bound locally because it is used by other methods
	Q.mapply = // XXX As proposed by "Redsandro"
	Q.post = function (object, name, args) {
	    return Q(object).dispatch("post", [name, args]);
	};
	
	Promise.prototype.mapply = // XXX As proposed by "Redsandro"
	Promise.prototype.post = function (name, args) {
	    return this.dispatch("post", [name, args]);
	};
	
	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param ...args   array of invocation arguments
	 * @return promise for the return value
	 */
	Q.send = // XXX Mark Miller's proposed parlance
	Q.mcall = // XXX As proposed by "Redsandro"
	Q.invoke = function (object, name /*...args*/) {
	    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
	};
	
	Promise.prototype.send = // XXX Mark Miller's proposed parlance
	Promise.prototype.mcall = // XXX As proposed by "Redsandro"
	Promise.prototype.invoke = function (name /*...args*/) {
	    return this.dispatch("post", [name, array_slice(arguments, 1)]);
	};
	
	/**
	 * Applies the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param args      array of application arguments
	 */
	Q.fapply = function (object, args) {
	    return Q(object).dispatch("apply", [void 0, args]);
	};
	
	Promise.prototype.fapply = function (args) {
	    return this.dispatch("apply", [void 0, args]);
	};
	
	/**
	 * Calls the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q["try"] =
	Q.fcall = function (object /* ...args*/) {
	    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
	};
	
	Promise.prototype.fcall = function (/*...args*/) {
	    return this.dispatch("apply", [void 0, array_slice(arguments)]);
	};
	
	/**
	 * Binds the promised function, transforming return values into a fulfilled
	 * promise and thrown errors into a rejected one.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q.fbind = function (object /*...args*/) {
	    var promise = Q(object);
	    var args = array_slice(arguments, 1);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	Promise.prototype.fbind = function (/*...args*/) {
	    var promise = this;
	    var args = array_slice(arguments);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	
	/**
	 * Requests the names of the owned properties of a promised
	 * object in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @return promise for the keys of the eventually settled object
	 */
	Q.keys = function (object) {
	    return Q(object).dispatch("keys", []);
	};
	
	Promise.prototype.keys = function () {
	    return this.dispatch("keys", []);
	};
	
	/**
	 * Turns an array of promises into a promise for an array.  If any of
	 * the promises gets rejected, the whole array is rejected immediately.
	 * @param {Array*} an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns a promise for an array of the corresponding values
	 */
	// By Mark Miller
	// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
	Q.all = all;
	function all(promises) {
	    return when(promises, function (promises) {
	        var pendingCount = 0;
	        var deferred = defer();
	        array_reduce(promises, function (undefined, promise, index) {
	            var snapshot;
	            if (
	                isPromise(promise) &&
	                (snapshot = promise.inspect()).state === "fulfilled"
	            ) {
	                promises[index] = snapshot.value;
	            } else {
	                ++pendingCount;
	                when(
	                    promise,
	                    function (value) {
	                        promises[index] = value;
	                        if (--pendingCount === 0) {
	                            deferred.resolve(promises);
	                        }
	                    },
	                    deferred.reject,
	                    function (progress) {
	                        deferred.notify({ index: index, value: progress });
	                    }
	                );
	            }
	        }, void 0);
	        if (pendingCount === 0) {
	            deferred.resolve(promises);
	        }
	        return deferred.promise;
	    });
	}
	
	Promise.prototype.all = function () {
	    return all(this);
	};
	
	/**
	 * Returns the first resolved promise of an array. Prior rejected promises are
	 * ignored.  Rejects only if all promises are rejected.
	 * @param {Array*} an array containing values or promises for values
	 * @returns a promise fulfilled with the value of the first resolved promise,
	 * or a rejected promise if all promises are rejected.
	 */
	Q.any = any;
	
	function any(promises) {
	    if (promises.length === 0) {
	        return Q.resolve();
	    }
	
	    var deferred = Q.defer();
	    var pendingCount = 0;
	    array_reduce(promises, function (prev, current, index) {
	        var promise = promises[index];
	
	        pendingCount++;
	
	        when(promise, onFulfilled, onRejected, onProgress);
	        function onFulfilled(result) {
	            deferred.resolve(result);
	        }
	        function onRejected() {
	            pendingCount--;
	            if (pendingCount === 0) {
	                deferred.reject(new Error(
	                    "Can't get fulfillment value from any promise, all " +
	                    "promises were rejected."
	                ));
	            }
	        }
	        function onProgress(progress) {
	            deferred.notify({
	                index: index,
	                value: progress
	            });
	        }
	    }, undefined);
	
	    return deferred.promise;
	}
	
	Promise.prototype.any = function () {
	    return any(this);
	};
	
	/**
	 * Waits for all promises to be settled, either fulfilled or
	 * rejected.  This is distinct from `all` since that would stop
	 * waiting at the first rejection.  The promise returned by
	 * `allResolved` will never be rejected.
	 * @param promises a promise for an array (or an array) of promises
	 * (or values)
	 * @return a promise for an array of promises
	 */
	Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
	function allResolved(promises) {
	    return when(promises, function (promises) {
	        promises = array_map(promises, Q);
	        return when(all(array_map(promises, function (promise) {
	            return when(promise, noop, noop);
	        })), function () {
	            return promises;
	        });
	    });
	}
	
	Promise.prototype.allResolved = function () {
	    return allResolved(this);
	};
	
	/**
	 * @see Promise#allSettled
	 */
	Q.allSettled = allSettled;
	function allSettled(promises) {
	    return Q(promises).allSettled();
	}
	
	/**
	 * Turns an array of promises into a promise for an array of their states (as
	 * returned by `inspect`) when they have all settled.
	 * @param {Array[Any*]} values an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns {Array[State]} an array of states for the respective values.
	 */
	Promise.prototype.allSettled = function () {
	    return this.then(function (promises) {
	        return all(array_map(promises, function (promise) {
	            promise = Q(promise);
	            function regardless() {
	                return promise.inspect();
	            }
	            return promise.then(regardless, regardless);
	        }));
	    });
	};
	
	/**
	 * Captures the failure of a promise, giving an oportunity to recover
	 * with a callback.  If the given promise is fulfilled, the returned
	 * promise is fulfilled.
	 * @param {Any*} promise for something
	 * @param {Function} callback to fulfill the returned promise if the
	 * given promise is rejected
	 * @returns a promise for the return value of the callback
	 */
	Q.fail = // XXX legacy
	Q["catch"] = function (object, rejected) {
	    return Q(object).then(void 0, rejected);
	};
	
	Promise.prototype.fail = // XXX legacy
	Promise.prototype["catch"] = function (rejected) {
	    return this.then(void 0, rejected);
	};
	
	/**
	 * Attaches a listener that can respond to progress notifications from a
	 * promise's originating deferred. This listener receives the exact arguments
	 * passed to ``deferred.notify``.
	 * @param {Any*} promise for something
	 * @param {Function} callback to receive any progress notifications
	 * @returns the given promise, unchanged
	 */
	Q.progress = progress;
	function progress(object, progressed) {
	    return Q(object).then(void 0, void 0, progressed);
	}
	
	Promise.prototype.progress = function (progressed) {
	    return this.then(void 0, void 0, progressed);
	};
	
	/**
	 * Provides an opportunity to observe the settling of a promise,
	 * regardless of whether the promise is fulfilled or rejected.  Forwards
	 * the resolution to the returned promise when the callback is done.
	 * The callback can return a promise to defer completion.
	 * @param {Any*} promise
	 * @param {Function} callback to observe the resolution of the given
	 * promise, takes no arguments.
	 * @returns a promise for the resolution of the given promise when
	 * ``fin`` is done.
	 */
	Q.fin = // XXX legacy
	Q["finally"] = function (object, callback) {
	    return Q(object)["finally"](callback);
	};
	
	Promise.prototype.fin = // XXX legacy
	Promise.prototype["finally"] = function (callback) {
	    callback = Q(callback);
	    return this.then(function (value) {
	        return callback.fcall().then(function () {
	            return value;
	        });
	    }, function (reason) {
	        // TODO attempt to recycle the rejection with "this".
	        return callback.fcall().then(function () {
	            throw reason;
	        });
	    });
	};
	
	/**
	 * Terminates a chain of promises, forcing rejections to be
	 * thrown as exceptions.
	 * @param {Any*} promise at the end of a chain of promises
	 * @returns nothing
	 */
	Q.done = function (object, fulfilled, rejected, progress) {
	    return Q(object).done(fulfilled, rejected, progress);
	};
	
	Promise.prototype.done = function (fulfilled, rejected, progress) {
	    var onUnhandledError = function (error) {
	        // forward to a future turn so that ``when``
	        // does not catch it and turn it into a rejection.
	        Q.nextTick(function () {
	            makeStackTraceLong(error, promise);
	            if (Q.onerror) {
	                Q.onerror(error);
	            } else {
	                throw error;
	            }
	        });
	    };
	
	    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
	    var promise = fulfilled || rejected || progress ?
	        this.then(fulfilled, rejected, progress) :
	        this;
	
	    if (typeof process === "object" && process && process.domain) {
	        onUnhandledError = process.domain.bind(onUnhandledError);
	    }
	
	    promise.then(void 0, onUnhandledError);
	};
	
	/**
	 * Causes a promise to be rejected if it does not get fulfilled before
	 * some milliseconds time out.
	 * @param {Any*} promise
	 * @param {Number} milliseconds timeout
	 * @param {Any*} custom error message or Error object (optional)
	 * @returns a promise for the resolution of the given promise if it is
	 * fulfilled before the timeout, otherwise rejected.
	 */
	Q.timeout = function (object, ms, error) {
	    return Q(object).timeout(ms, error);
	};
	
	Promise.prototype.timeout = function (ms, error) {
	    var deferred = defer();
	    var timeoutId = setTimeout(function () {
	        if (!error || "string" === typeof error) {
	            error = new Error(error || "Timed out after " + ms + " ms");
	            error.code = "ETIMEDOUT";
	        }
	        deferred.reject(error);
	    }, ms);
	
	    this.then(function (value) {
	        clearTimeout(timeoutId);
	        deferred.resolve(value);
	    }, function (exception) {
	        clearTimeout(timeoutId);
	        deferred.reject(exception);
	    }, deferred.notify);
	
	    return deferred.promise;
	};
	
	/**
	 * Returns a promise for the given value (or promised value), some
	 * milliseconds after it resolved. Passes rejections immediately.
	 * @param {Any*} promise
	 * @param {Number} milliseconds
	 * @returns a promise for the resolution of the given promise after milliseconds
	 * time has elapsed since the resolution of the given promise.
	 * If the given promise rejects, that is passed immediately.
	 */
	Q.delay = function (object, timeout) {
	    if (timeout === void 0) {
	        timeout = object;
	        object = void 0;
	    }
	    return Q(object).delay(timeout);
	};
	
	Promise.prototype.delay = function (timeout) {
	    return this.then(function (value) {
	        var deferred = defer();
	        setTimeout(function () {
	            deferred.resolve(value);
	        }, timeout);
	        return deferred.promise;
	    });
	};
	
	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided as an array, and returns a promise.
	 *
	 *      Q.nfapply(FS.readFile, [__filename])
	 *      .then(function (content) {
	 *      })
	 *
	 */
	Q.nfapply = function (callback, args) {
	    return Q(callback).nfapply(args);
	};
	
	Promise.prototype.nfapply = function (args) {
	    var deferred = defer();
	    var nodeArgs = array_slice(args);
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided individually, and returns a promise.
	 * @example
	 * Q.nfcall(FS.readFile, __filename)
	 * .then(function (content) {
	 * })
	 *
	 */
	Q.nfcall = function (callback /*...args*/) {
	    var args = array_slice(arguments, 1);
	    return Q(callback).nfapply(args);
	};
	
	Promise.prototype.nfcall = function (/*...args*/) {
	    var nodeArgs = array_slice(arguments);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Wraps a NodeJS continuation passing function and returns an equivalent
	 * version that returns a promise.
	 * @example
	 * Q.nfbind(FS.readFile, __filename)("utf-8")
	 * .then(console.log)
	 * .done()
	 */
	Q.nfbind =
	Q.denodeify = function (callback /*...args*/) {
	    var baseArgs = array_slice(arguments, 1);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        Q(callback).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};
	
	Promise.prototype.nfbind =
	Promise.prototype.denodeify = function (/*...args*/) {
	    var args = array_slice(arguments);
	    args.unshift(this);
	    return Q.denodeify.apply(void 0, args);
	};
	
	Q.nbind = function (callback, thisp /*...args*/) {
	    var baseArgs = array_slice(arguments, 2);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        function bound() {
	            return callback.apply(thisp, arguments);
	        }
	        Q(bound).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};
	
	Promise.prototype.nbind = function (/*thisp, ...args*/) {
	    var args = array_slice(arguments, 0);
	    args.unshift(this);
	    return Q.nbind.apply(void 0, args);
	};
	
	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback with a given array of arguments, plus a provided callback.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param {Array} args arguments to pass to the method; the callback
	 * will be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nmapply = // XXX As proposed by "Redsandro"
	Q.npost = function (object, name, args) {
	    return Q(object).npost(name, args);
	};
	
	Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
	Promise.prototype.npost = function (name, args) {
	    var nodeArgs = array_slice(args || []);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback, forwarding the given variadic arguments, plus a provided
	 * callback argument.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param ...args arguments to pass to the method; the callback will
	 * be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nsend = // XXX Based on Mark Miller's proposed "send"
	Q.nmcall = // XXX Based on "Redsandro's" proposal
	Q.ninvoke = function (object, name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 2);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
	Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
	Promise.prototype.ninvoke = function (name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 1);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * If a function would like to support both Node continuation-passing-style and
	 * promise-returning-style, it can end its internal promise chain with
	 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
	 * elects to use a nodeback, the result will be sent there.  If they do not
	 * pass a nodeback, they will receive the result promise.
	 * @param object a result (or a promise for a result)
	 * @param {Function} nodeback a Node.js-style callback
	 * @returns either the promise or nothing
	 */
	Q.nodeify = nodeify;
	function nodeify(object, nodeback) {
	    return Q(object).nodeify(nodeback);
	}
	
	Promise.prototype.nodeify = function (nodeback) {
	    if (nodeback) {
	        this.then(function (value) {
	            Q.nextTick(function () {
	                nodeback(null, value);
	            });
	        }, function (error) {
	            Q.nextTick(function () {
	                nodeback(error);
	            });
	        });
	    } else {
	        return this;
	    }
	};
	
	Q.noConflict = function() {
	    throw new Error("Q.noConflict only works when Q is used as a global");
	};
	
	// All code before this point will be filtered from stack traces.
	var qEndingLine = captureLine();
	
	return Q;
	
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(245), __webpack_require__(246).setImmediate))

/***/ },
/* 245 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 246 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(245).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;
	
	// DOM APIs, for completeness
	
	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };
	
	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};
	
	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};
	
	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};
	
	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);
	
	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};
	
	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
	
	  immediateIds[id] = true;
	
	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });
	
	  return id;
	};
	
	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(246).setImmediate, __webpack_require__(246).clearImmediate))

/***/ },
/* 247 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(248);

/***/ },
/* 248 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var di = __webpack_require__(249);
	
	/**
	 * Bootstrap an injector from a list of modules, instantiating a number of default components
	 *
	 * @ignore
	 * @param {Array<didi.Module>} bootstrapModules
	 *
	 * @return {didi.Injector} a injector to use to access the components
	 */
	function bootstrap(bootstrapModules) {
	
	  var modules = [],
	    components = [];
	
	  function hasModule(m) {
	    return modules.indexOf(m) >= 0;
	  }
	
	  function addModule(m) {
	    modules.push(m);
	  }
	
	  function visit(m) {
	    if (hasModule(m)) {
	      return;
	    }
	
	    (m.__depends__ || []).forEach(visit);
	
	    if (hasModule(m)) {
	      return;
	    }
	
	    addModule(m);
	
	    (m.__init__ || []).forEach(function(c) {
	      components.push(c);
	    });
	  }
	
	  bootstrapModules.forEach(visit);
	
	  var injector = new di.Injector(modules);
	
	  components.forEach(function(c) {
	
	    try {
	      // eagerly resolve component (fn or string)
	      injector[typeof c === 'string' ? 'get' : 'invoke'](c);
	    } catch (e) {
	      console.error('Failed to instantiate component');
	      console.error(e.stack);
	
	      throw e;
	    }
	  });
	
	  return injector;
	}
	
	/**
	 * Creates an injector from passed options.
	 *
	 * @ignore
	 * @param  {Object} options
	 * @return {didi.Injector}
	 */
	function createInjector(options) {
	
	  options = options || {};
	
	  var configModule = {
	    'config': ['value', options]
	  };
	
	  var coreModule = __webpack_require__(253);
	
	  var modules = [ configModule, coreModule ].concat(options.modules || []);
	
	  return bootstrap(modules);
	}
	
	
	/**
	 * The main diagram-js entry point that bootstraps the diagram with the given
	 * configuration.
	 *
	 * To register extensions with the diagram, pass them as Array<didi.Module> to the constructor.
	 *
	 * @class djs.D3Canvas
	 * @memberOf djs
	 * @constructor
	 *
	 * @example
	 *
	 * <caption>Creating a plug-in that logs whenever a shape is added to the canvas.</caption>
	 *
	 * // plug-in implemenentation
	 * function MyLoggingPlugin(eventBus) {
	 *   eventBus.on('shape.added', function(event) {
	 *     console.log('shape ', event.shape, ' was added to the diagram');
	 *   });
	 * }
	 *
	 * // export as module
	 * module.exports = {
	 *   __init__: [ 'myLoggingPlugin' ],
	 *     myLoggingPlugin: [ 'type', MyLoggingPlugin ]
	 * };
	 *
	 *
	 * // instantiate the diagram with the new plug-in
	 *
	 * var diagram = new Diagram({ modules: [ require('path-to-my-logging-plugin') ] });
	 *
	 * diagram.invoke([ 'canvas', function(canvas) {
	 *   // add shape to drawing canvas
	 *   canvas.addShape({ x: 10, y: 10 });
	 * });
	 *
	 * // 'shape ... was added to the diagram' logged to console
	 *
	 * @param {Object} options
	 * @param {Array<didi.Module>} [options.modules] external modules to instantiate with the diagram
	 * @param {didi.Injector} [injector] an (optional) injector to bootstrap the diagram with
	 */
	function D3Canvas(options, injector) {
	
	  // create injector unless explicitly specified
	  this.injector = injector = injector || createInjector(options);
	
	  // API
	
	  /**
	   * Resolves a diagram service
	   *
	   * @method D3Canvas#get
	   *
	   * @param {String} name the name of the diagram service to be retrieved
	   * @param {Boolean} [strict=true] if false, resolve missing services to null
	   */
	  this.get = injector.get;
	
	  /**
	   * Executes a function into which diagram services are injected
	   *
	   * @method D3Canvas#invoke
	   *
	   * @param {Function|Object[]} fn the function to resolve
	   * @param {Object} locals a number of locals to use to resolve certain dependencies
	   */
	  this.invoke = injector.invoke;
	
	  // init
	
	  // indicate via event
	
	
	  /**
	   * An event indicating that all plug-ins are loaded.
	   *
	   * Use this event to fire other events to interested plug-ins
	   *
	   * @memberOf D3Canvas
	   *
	   * @event diagram.init
	   *
	   * @example
	   *
	   * eventBus.on('diagram.init', function() {
	   *   eventBus.emit('my-custom-event', { foo: 'BAR' });
	   * });
	   *
	   * @type {Object}
	   */
	  this.get('eventBus').emit('d3canvas.init');
	}
	
	module.exports = D3Canvas;
	
	/**
	 * Destroys the D3Canvas
	 *
	 * @method  D3Canvas#destroy
	 */
	D3Canvas.prototype.destroy = function() {
	  this.get('eventBus').emit('d3canvas.destroy');
	};
	
	/**
	 * Clear the diagram, removing all contents.
	 */
	D3Canvas.prototype.clear = function() {
	  this.get('eventBus').emit('d3canvas.clear');
	};

/***/ },
/* 249 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  annotate: __webpack_require__(250).annotate,
	  Module: __webpack_require__(251),
	  Injector: __webpack_require__(252)
	};


/***/ },
/* 250 */
/***/ function(module, exports) {

	
	var isArray = function(obj) {
	  return Object.prototype.toString.call(obj) === '[object Array]';
	};
	
	var annotate = function() {
	  var args = Array.prototype.slice.call(arguments);
	  
	  if (args.length === 1 && isArray(args[0])) {
	    args = args[0];
	  }
	
	  var fn = args.pop();
	
	  fn.$inject = args;
	
	  return fn;
	};
	
	
	// Current limitations:
	// - can't put into "function arg" comments
	// function /* (no parenthesis like this) */ (){}
	// function abc( /* xx (no parenthesis like this) */ a, b) {}
	//
	// Just put the comment before function or inside:
	// /* (((this is fine))) */ function(a, b) {}
	// function abc(a) { /* (((this is fine))) */}
	
	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
	var FN_ARG = /\/\*([^\*]*)\*\//m;
	
	var parse = function(fn) {
	  if (typeof fn !== 'function') {
	    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
	  }
	
	  var match = fn.toString().match(FN_ARGS);
	  return match[1] && match[1].split(',').map(function(arg) {
	    match = arg.match(FN_ARG);
	    return match ? match[1].trim() : arg.trim();
	  }) || [];
	};
	
	
	exports.annotate = annotate;
	exports.parse = parse;
	exports.isArray = isArray;


/***/ },
/* 251 */
/***/ function(module, exports) {

	var Module = function() {
	  var providers = [];
	
	  this.factory = function(name, factory) {
	    providers.push([name, 'factory', factory]);
	    return this;
	  };
	
	  this.value = function(name, value) {
	    providers.push([name, 'value', value]);
	    return this;
	  };
	
	  this.type = function(name, type) {
	    providers.push([name, 'type', type]);
	    return this;
	  };
	
	  this.forEach = function(iterator) {
	    providers.forEach(iterator);
	  };
	};
	
	module.exports = Module;


/***/ },
/* 252 */
/***/ function(module, exports, __webpack_require__) {

	var Module = __webpack_require__(251);
	var autoAnnotate = __webpack_require__(250).parse;
	var annotate = __webpack_require__(250).annotate;
	var isArray = __webpack_require__(250).isArray;
	
	
	var Injector = function(modules, parent) {
	  parent = parent || {
	    get: function(name, strict) {
	      currentlyResolving.push(name);
	
	      if (strict === false) {
	        return null;
	      } else {
	        throw error('No provider for "' + name + '"!');
	      }
	    }
	  };
	
	  var currentlyResolving = [];
	  var providers = this._providers = Object.create(parent._providers || null);
	  var instances = this._instances = Object.create(null);
	
	  var self = instances.injector = this;
	
	  var error = function(msg) {
	    var stack = currentlyResolving.join(' -> ');
	    currentlyResolving.length = 0;
	    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
	  };
	
	  /**
	   * Return a named service.
	   *
	   * @param {String} name
	   * @param {Boolean} [strict=true] if false, resolve missing services to null
	   *
	   * @return {Object}
	   */
	  var get = function(name, strict) {
	    if (!providers[name] && name.indexOf('.') !== -1) {
	      var parts = name.split('.');
	      var pivot = get(parts.shift());
	
	      while(parts.length) {
	        pivot = pivot[parts.shift()];
	      }
	
	      return pivot;
	    }
	
	    if (Object.hasOwnProperty.call(instances, name)) {
	      return instances[name];
	    }
	
	    if (Object.hasOwnProperty.call(providers, name)) {
	      if (currentlyResolving.indexOf(name) !== -1) {
	        currentlyResolving.push(name);
	        throw error('Cannot resolve circular dependency!');
	      }
	
	      currentlyResolving.push(name);
	      instances[name] = providers[name][0](providers[name][1]);
	      currentlyResolving.pop();
	
	      return instances[name];
	    }
	
	    return parent.get(name, strict);
	  };
	
	  var instantiate = function(Type) {
	    var instance = Object.create(Type.prototype);
	    var returned = invoke(Type, instance);
	
	    return typeof returned === 'object' ? returned : instance;
	  };
	
	  var invoke = function(fn, context) {
	    if (typeof fn !== 'function') {
	      if (isArray(fn)) {
	        fn = annotate(fn.slice());
	      } else {
	        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
	      }
	    }
	
	    var inject = fn.$inject && fn.$inject || autoAnnotate(fn);
	    var dependencies = inject.map(function(dep) {
	      return get(dep);
	    });
	
	    // TODO(vojta): optimize without apply
	    return fn.apply(context, dependencies);
	  };
	
	
	  var createPrivateInjectorFactory = function(privateChildInjector) {
	    return annotate(function(key) {
	      return privateChildInjector.get(key);
	    });
	  };
	
	  var createChild = function(modules, forceNewInstances) {
	    if (forceNewInstances && forceNewInstances.length) {
	      var fromParentModule = Object.create(null);
	      var matchedScopes = Object.create(null);
	
	      var privateInjectorsCache = [];
	      var privateChildInjectors = [];
	      var privateChildFactories = [];
	
	      var provider;
	      var cacheIdx;
	      var privateChildInjector;
	      var privateChildInjectorFactory;
	      for (var name in providers) {
	        provider = providers[name];
	
	        if (forceNewInstances.indexOf(name) !== -1) {
	          if (provider[2] === 'private') {
	            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
	            if (cacheIdx === -1) {
	              privateChildInjector = provider[3].createChild([], forceNewInstances);
	              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
	              privateInjectorsCache.push(provider[3]);
	              privateChildInjectors.push(privateChildInjector);
	              privateChildFactories.push(privateChildInjectorFactory);
	              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
	            } else {
	              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
	            }
	          } else {
	            fromParentModule[name] = [provider[2], provider[1]];
	          }
	          matchedScopes[name] = true;
	        }
	
	        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
	          /*jshint -W083 */
	          forceNewInstances.forEach(function(scope) {
	            if (provider[1].$scope.indexOf(scope) !== -1) {
	              fromParentModule[name] = [provider[2], provider[1]];
	              matchedScopes[scope] = true;
	            }
	          });
	        }
	      }
	
	      forceNewInstances.forEach(function(scope) {
	        if (!matchedScopes[scope]) {
	          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
	        }
	      });
	
	      modules.unshift(fromParentModule);
	    }
	
	    return new Injector(modules, self);
	  };
	
	  var factoryMap = {
	    factory: invoke,
	    type: instantiate,
	    value: function(value) {
	      return value;
	    }
	  };
	
	  modules.forEach(function(module) {
	
	    function arrayUnwrap(type, value) {
	      if (type !== 'value' && isArray(value)) {
	        value = annotate(value.slice());
	      }
	
	      return value;
	    }
	
	    // TODO(vojta): handle wrong inputs (modules)
	    if (module instanceof Module) {
	      module.forEach(function(provider) {
	        var name = provider[0];
	        var type = provider[1];
	        var value = provider[2];
	
	        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
	      });
	    } else if (typeof module === 'object') {
	      if (module.__exports__) {
	        var clonedModule = Object.keys(module).reduce(function(m, key) {
	          if (key.substring(0, 2) !== '__') {
	            m[key] = module[key];
	          }
	          return m;
	        }, Object.create(null));
	
	        var privateInjector = new Injector((module.__modules__ || []).concat([clonedModule]), self);
	        var getFromPrivateInjector = annotate(function(key) {
	          return privateInjector.get(key);
	        });
	        module.__exports__.forEach(function(key) {
	          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
	        });
	      } else {
	        Object.keys(module).forEach(function(name) {
	          if (module[name][2] === 'private') {
	            providers[name] = module[name];
	            return;
	          }
	
	          var type = module[name][0];
	          var value = module[name][1];
	
	          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
	        });
	      }
	    }
	  });
	
	  // public API
	  this.get = get;
	  this.invoke = invoke;
	  this.instantiate = instantiate;
	  this.createChild = createChild;
	};
	
	module.exports = Injector;


/***/ },
/* 253 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'canvas' ],
	  canvas: [ 'type', __webpack_require__(254) ],
	  eventBus: [
	    'type', __webpack_require__(314)
	  ]
	};

/***/ },
/* 254 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isNumber = __webpack_require__(255).isNumber,
	  assign = __webpack_require__(6).assign,
	  isEmpty = __webpack_require__(255).isEmpty/*,
	  forEach = require('lodash/collection').forEach,
	  every = require('lodash/collection').every,
	  debounce = require('lodash/function').debounce*/;
	
	// var Collections = require('../util/Collections'),
	//   Elements = require('../util/Elements');
	
	var d3js = __webpack_require__(313);
	
	// function round(number, resolution) {
	//   return Math.round(number * resolution) / resolution;
	// }
	
	function ensurePx(number) {
	  return isNumber(number) ? number + 'px' : number;
	}
	
	/**
	 * Creates a HTML container element for a SVG element with
	 * the given configuration
	 *
	 * @param  {Object} options
	 * @return {HTMLElement} the container element
	 */
	function createContainer(options) {
	
	  options = assign({}, { width: '100%', height: '100%' }, options);
	
	  var container = options.container || document.body;
	
	  // create a <div> around the svg element with the respective size
	  // this way we can always get the correct container size
	  // (this is impossible for <svg> elements at the moment)
	  var parent = document.createElement('div');
	  parent.setAttribute('class', 'djs-container');
	
	  assign(parent.style, {
	    position: 'absolute',
	    overflow: 'hidden',
	    width: ensurePx(options.width),
	    height: ensurePx(options.height)
	  });
	
	  container.appendChild(parent);
	
	  return parent;
	}
	
	// function createGroup(parent, cls) {
	//   return parent.group().attr({ 'class' : cls });
	// }
	//
	// var BASE_LAYER = 'base';
	//
	//
	// var REQUIRED_MODEL_ATTRS = {
	//   shape: [ 'x', 'y', 'width', 'height' ],
	//   connection: [ 'waypoints' ]
	// };
	
	/**
	 * The main drawing canvas.
	 *
	 * @class
	 * @constructor
	 *
	 * @emits Canvas#canvas.init
	 *
	 * @param {Object} config
	 * @param {EventBus} eventBus
	 */
	function Canvas(config, eventBus) {
	
	  this._eventBus = eventBus;
	
	  this._init(config || {});
	}
	
	Canvas.$inject = [ 'config', 'eventBus' ];
	
	module.exports = Canvas;
	
	
	Canvas.prototype._init = function(config) {
	
	  var eventBus = this._eventBus;
	
	  // Creates a <svg> element that is wrapped into a <div>.
	  // This way we are always able to correctly figure out the size of the svg element
	  // by querying the parent node.
	  //
	  // (It is not possible to get the size of a svg element cross browser @ 2014-04-01)
	  //
	  // <div class="djs-container" style="width: {desired-width}, height: {desired-height}">
	  //   <svg width="100%" height="100%">
	  //    ...
	  //   </svg>
	  // </div>
	
	  // html container
	  var container = this._container = createContainer(config),
	    svg = this._drawingLayer = this._svg = d3js.select(container)
	      .append('svg');
	
	  svg.attr('fill', 'transparent')
	    .attr('width', '100%')
	    .attr('height', '100%')
	    .attr('pointer-events', 'all');
	
	  // debounce canvas.viewbox.changed events
	  // for smoother diagram interaction
	  // if (config.deferUpdate !== false) {
	  //   this._viewboxChanged = debounce(this._viewboxChanged, 300);
	  // }
	
	  eventBus.on('d3canvas.init', function() {
	
	    /**
	     * An event indicating that the canvas is ready to be drawn on.
	     *
	     * @memberOf Canvas
	     *
	     * @event canvas.init
	     *
	     * @type {Object}
	     * @property {Snap<SVGSVGElement>} svg the created svg element
	     */
	    eventBus.emit('canvas.init', {
	      svg: svg
	    });
	
	    // fire this in order for certain components to check
	    // if they need to be adjusted due the canvas size
	    this.resized();
	
	  }, this);
	
	  eventBus.on('d3canvas.destroy', 500, this._destroy, this);
	  eventBus.on('d3canvas.clear', 500, this._clear, this);
	};
	
	Canvas.prototype._destroy = function() {
	  this._eventBus.emit('canvas.destroy', {
	    svg: this._svg
	  });
	
	  var parent = this._container.parentNode;
	
	  if (parent) {
	    parent.removeChild(this._container);
	  }
	
	  delete this._svg;
	  delete this._container;
	};
	
	Canvas.prototype._clear = function() {
	
	  //var self = this;
	
	  //var allElements = this._elementRegistry.getAll();
	
	  // remove all elements
	  /*allElements.forEach(function(element) {
	    var type = Elements.getType(element);
	
	    if (type === 'root') {
	      self.setRootElement(null, true);
	    } else {
	      self._removeElement(element, type);
	    }
	  });*/
	
	  // force recomputation of view box
	  //delete this._cachedViewbox;
	};
	
	/**
	 * Returns the default layer on which
	 * all elements are drawn.
	 *
	 * @returns {Snap<SVGGroup>}
	 */
	// Canvas.prototype.getDefaultLayer = function() {
	//   return this.getLayer(BASE_LAYER);
	// };
	
	/**
	 * Returns a layer that is used to draw elements
	 * or annotations on it.
	 *
	 * @param  {String} name
	 *
	 * @returns {Snap<SVGGroup>}
	 */
	// Canvas.prototype.getLayer = function(name) {
	//
	//   if (!name) {
	//     throw new Error('must specify a name');
	//   }
	//
	//   var layer = this._layers[name];
	//   if (!layer) {
	//     layer = this._layers[name] = createGroup(this._viewport, 'layer-' + name);
	//   }
	//
	//   return layer;
	// };
	
	
	/**
	 * Returns the html element that encloses the
	 * drawing canvas.
	 *
	 * @return {DOMNode}
	 */
	Canvas.prototype.getContainer = function() {
	  return this._container;
	};
	
	/**
	 * Returns the drawing canvas.
	 *
	 * @return {DOMNode}
	 */
	Canvas.prototype.getSVG = function() {
	  return this._svg;
	};
	
	/**
	 * Returns the drawing layer.
	 *
	 * @return {DOMNode}
	 */
	Canvas.prototype.getDrawingLayer = function() {
	  return this._drawingLayer;
	};
	
	/**
	 * Sets the drawing layer.
	 *
	 */
	Canvas.prototype.setDrawingLayer = function(drawingLayer) {
	  this._drawingLayer = drawingLayer;
	};
	
	/**
	 * Returns the drawing layer's transform matrix.
	 *
	 * @return {Object}
	 */
	Canvas.prototype.getTransform = function() {
	  var transform = this._drawingLayer.attr('transform');
	
	  // Create a dummy g for calculation purposes only. This will never
	  // be appended to the DOM and will be discarded once this function
	  // returns.
	
	  if (isEmpty(transform)){
	    // return default transform
	    return {
	      // scale
	      a: 1,
	      d: 1,
	      // translate
	      e: 0,
	      f: 0
	    };
	  } else {
	    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	
	    // Set the transform attribute to the provided string value.
	    g.setAttributeNS(null, 'transform', transform);
	
	    return g.transform.baseVal.consolidate().matrix;
	  }
	};
	
	/////////////// markers ///////////////////////////////////
	
	// Canvas.prototype._updateMarker = function(element, marker, add) {
	//   var container;
	//
	//   if (!element.id) {
	//     element = this._elementRegistry.get(element);
	//   }
	//
	//   // we need to access all
	//   container = this._elementRegistry._elements[element.id];
	//
	//   if (!container) {
	//     return;
	//   }
	//
	//   forEach([ container.gfx, container.secondaryGfx ], function(gfx) {
	//     if (gfx) {
	//       // invoke either addClass or removeClass based on mode
	//       gfx[add ? 'addClass' : 'removeClass'](marker);
	//     }
	//   });
	//
	//   /**
	//    * An event indicating that a marker has been updated for an element
	//    *
	//    * @event element.marker.update
	//    * @type {Object}
	//    * @property {djs.model.Element} element the shape
	//    * @property {Object} gfx the graphical representation of the shape
	//    * @property {String} marker
	//    * @property {Boolean} add true if the marker was added, false if it got removed
	//    */
	//   this._eventBus.emit('element.marker.update', { element: element, gfx: container.gfx, marker: marker, add: !!add });
	// };
	
	
	/**
	 * Adds a marker to an element (basically a css class).
	 *
	 * Fires the element.marker.update event, making it possible to
	 * integrate extension into the marker life-cycle, too.
	 *
	 * @example
	 * canvas.addMarker('foo', 'some-marker');
	 *
	 * var fooGfx = canvas.getGraphics('foo');
	 *
	 * fooGfx; // <g class="... some-marker"> ... </g>
	 *
	 * @param {String|djs.model.Base} element
	 * @param {String} marker
	 */
	// Canvas.prototype.addMarker = function(element, marker) {
	//   this._updateMarker(element, marker, true);
	// };
	
	
	/**
	 * Remove a marker from an element.
	 *
	 * Fires the element.marker.update event, making it possible to
	 * integrate extension into the marker life-cycle, too.
	 *
	 * @param  {String|djs.model.Base} element
	 * @param  {String} marker
	 */
	// Canvas.prototype.removeMarker = function(element, marker) {
	//   this._updateMarker(element, marker, false);
	// };
	
	/**
	 * Check the existence of a marker on element.
	 *
	 * @param  {String|djs.model.Base} element
	 * @param  {String} marker
	 */
	// Canvas.prototype.hasMarker = function(element, marker) {
	//   if (!element.id) {
	//     element = this._elementRegistry.get(element);
	//   }
	//
	//   var gfx = this.getGraphics(element);
	//
	//   return gfx && gfx.hasClass(marker);
	// };
	
	/**
	 * Toggles a marker on an element.
	 *
	 * Fires the element.marker.update event, making it possible to
	 * integrate extension into the marker life-cycle, too.
	 *
	 * @param  {String|djs.model.Base} element
	 * @param  {String} marker
	 */
	// Canvas.prototype.toggleMarker = function(element, marker) {
	//   if (this.hasMarker(element, marker)) {
	//     this.removeMarker(element, marker);
	//   } else {
	//     this.addMarker(element, marker);
	//   }
	// };
	
	// Canvas.prototype.getRootElement = function() {
	//   if (!this._rootElement) {
	//     this.setRootElement({ id: '__implicitroot', children: [] });
	//   }
	//
	//   return this._rootElement;
	// };
	
	
	
	//////////////// root element handling ///////////////////////////
	
	/**
	 * Sets a given element as the new root element for the canvas
	 * and returns the new root element.
	 *
	 * @param {Object|djs.model.Root} element
	 * @param {Boolean} [override] whether to override the current root element, if any
	 *
	 * @return {Object|djs.model.Root} new root element
	 */
	// Canvas.prototype.setRootElement = function(element, override) {
	//
	//   if (element) {
	//     this._ensureValid('root', element);
	//   }
	//
	//   var currentRoot = this._rootElement,
	//     elementRegistry = this._elementRegistry,
	//     eventBus = this._eventBus;
	//
	//   if (currentRoot) {
	//     if (!override) {
	//       throw new Error('rootElement already set, need to specify override');
	//     }
	//
	//     // simulate element remove event sequence
	//     eventBus.emit('root.remove', { element: currentRoot });
	//     eventBus.emit('root.removed', { element: currentRoot });
	//
	//     elementRegistry.remove(currentRoot);
	//   }
	//
	//   if (element) {
	//     var gfx = this.getDefaultLayer();
	//
	//     // resemble element add event sequence
	//     eventBus.emit('root.add', { element: element });
	//
	//     elementRegistry.add(element, gfx, this._svg);
	//
	//     eventBus.emit('root.added', { element: element, gfx: gfx });
	//   }
	//
	//   this._rootElement = element;
	//
	//   return element;
	// };
	
	
	
	///////////// add functionality ///////////////////////////////
	
	// Canvas.prototype._ensureValid = function(type, element) {
	//   if (!element.id) {
	//     throw new Error('element must have an id');
	//   }
	//
	//   if (this._elementRegistry.get(element.id)) {
	//     throw new Error('element with id ' + element.id + ' already exists');
	//   }
	//
	//   var requiredAttrs = REQUIRED_MODEL_ATTRS[type];
	//
	//   var valid = every(requiredAttrs, function(attr) {
	//     return typeof element[attr] !== 'undefined';
	//   });
	//
	//   if (!valid) {
	//     throw new Error(
	//       'must supply { ' + requiredAttrs.join(', ') + ' } with ' + type);
	//   }
	// };
	
	// Canvas.prototype._setParent = function(element, parent, parentIndex) {
	//   Collections.add(parent.children, element, parentIndex);
	//   element.parent = parent;
	// };
	
	/**
	 * Adds an element to the canvas.
	 *
	 * This wires the parent <-> child relationship between the element and
	 * a explicitly specified parent or an implicit root element.
	 *
	 * During add it emits the events
	 *
	 *  * <{type}.add> (element, parent)
	 *  * <{type}.added> (element, gfx)
	 *
	 * Extensions may hook into these events to perform their magic.
	 *
	 * @param {String} type
	 * @param {Object|djs.model.Base} element
	 * @param {Object|djs.model.Base} [parent]
	 * @param {Number} [parentIndex]
	 *
	 * @return {Object|djs.model.Base} the added element
	 */
	// Canvas.prototype._addElement = function(type, element, parent, parentIndex) {
	//
	//   parent = parent || this.getRootElement();
	//
	//   var eventBus = this._eventBus,
	//     graphicsFactory = this._graphicsFactory;
	//
	//   this._ensureValid(type, element);
	//
	//   eventBus.emit(type + '.add', { element: element, parent: parent });
	//
	//   this._setParent(element, parent, parentIndex);
	//
	//   // create graphics
	//   var gfx = graphicsFactory.create(type, element);
	//
	//   this._elementRegistry.add(element, gfx);
	//
	//   // update its visual
	//   graphicsFactory.update(type, element, gfx);
	//
	//   eventBus.emit(type + '.added', { element: element, gfx: gfx });
	//
	//   return element;
	// };
	
	/**
	 * Adds a shape to the canvas
	 *
	 * @param {Object|djs.model.Shape} shape to add to the diagram
	 * @param {djs.model.Base} [parent]
	 * @param {Number} [parentIndex]
	 *
	 * @return {djs.model.Shape} the added shape
	 */
	// Canvas.prototype.addShape = function(shape, parent, parentIndex) {
	//   return this._addElement('shape', shape, parent, parentIndex);
	// };
	
	/**
	 * Adds a connection to the canvas
	 *
	 * @param {Object|djs.model.Connection} connection to add to the diagram
	 * @param {djs.model.Base} [parent]
	 * @param {Number} [parentIndex]
	 *
	 * @return {djs.model.Connection} the added connection
	 */
	// Canvas.prototype.addConnection = function(connection, parent, parentIndex) {
	//   return this._addElement('connection', connection, parent, parentIndex);
	// };
	
	
	/**
	 * Internal remove element
	 */
	// Canvas.prototype._removeElement = function(element, type) {
	//
	//   var elementRegistry = this._elementRegistry,
	//     graphicsFactory = this._graphicsFactory,
	//     eventBus = this._eventBus;
	//
	//   element = elementRegistry.get(element.id || element);
	//
	//   if (!element) {
	//     // element was removed already
	//     return;
	//   }
	//
	//   eventBus.emit(type + '.remove', { element: element });
	//
	//   graphicsFactory.remove(element);
	//
	//   // unset parent <-> child relationship
	//   Collections.remove(element.parent && element.parent.children, element);
	//   element.parent = null;
	//
	//   eventBus.emit(type + '.removed', { element: element });
	//
	//   elementRegistry.remove(element);
	//
	//   return element;
	// };
	
	
	/**
	 * Removes a shape from the canvas
	 *
	 * @param {String|djs.model.Shape} shape or shape id to be removed
	 *
	 * @return {djs.model.Shape} the removed shape
	 */
	// Canvas.prototype.removeShape = function(shape) {
	//
	//   /**
	//    * An event indicating that a shape is about to be removed from the canvas.
	//    *
	//    * @memberOf Canvas
	//    *
	//    * @event shape.remove
	//    * @type {Object}
	//    * @property {djs.model.Shape} element the shape descriptor
	//    * @property {Object} gfx the graphical representation of the shape
	//    */
	//
	//   /**
	//    * An event indicating that a shape has been removed from the canvas.
	//    *
	//    * @memberOf Canvas
	//    *
	//    * @event shape.removed
	//    * @type {Object}
	//    * @property {djs.model.Shape} element the shape descriptor
	//    * @property {Object} gfx the graphical representation of the shape
	//    */
	//   return this._removeElement(shape, 'shape');
	// };
	
	
	/**
	 * Removes a connection from the canvas
	 *
	 * @param {String|djs.model.Connection} connection or connection id to be removed
	 *
	 * @return {djs.model.Connection} the removed connection
	 */
	// Canvas.prototype.removeConnection = function(connection) {
	//
	//   /**
	//    * An event indicating that a connection is about to be removed from the canvas.
	//    *
	//    * @memberOf Canvas
	//    *
	//    * @event connection.remove
	//    * @type {Object}
	//    * @property {djs.model.Connection} element the connection descriptor
	//    * @property {Object} gfx the graphical representation of the connection
	//    */
	//
	//   /**
	//    * An event indicating that a connection has been removed from the canvas.
	//    *
	//    * @memberOf Canvas
	//    *
	//    * @event connection.removed
	//    * @type {Object}
	//    * @property {djs.model.Connection} element the connection descriptor
	//    * @property {Object} gfx the graphical representation of the connection
	//    */
	//   return this._removeElement(connection, 'connection');
	// };
	
	
	/**
	 * Return the graphical object underlaying a certain diagram element
	 *
	 * @param {String|djs.model.Base} element descriptor of the element
	 * @param {Boolean} [secondary=false] whether to return the secondary connected element
	 *
	 * @return {SVGElement}
	 */
	// Canvas.prototype.getGraphics = function(element, secondary) {
	//   return this._elementRegistry.getGraphics(element, secondary);
	// };
	
	
	/**
	 * Perform a viewbox update via a given change function.
	 *
	 * @param {Function} changeFn
	 */
	// Canvas.prototype._changeViewbox = function(changeFn) {
	//
	//   // notify others of the upcoming viewbox change
	//   this._eventBus.emit('canvas.viewbox.changing');
	//
	//   // perform actual change
	//   changeFn.apply(this);
	//
	//   // reset the cached viewbox so that
	//   // a new get operation on viewbox or zoom
	//   // triggers a viewbox re-computation
	//   this._cachedViewbox = null;
	//
	//   // notify others of the change; this step
	//   // may or may not be debounced
	//   this._viewboxChanged();
	// };
	//
	// Canvas.prototype._viewboxChanged = function() {
	//   this._eventBus.emit('canvas.viewbox.changed', { viewbox: this.viewbox() });
	// };
	
	
	/**
	 * Gets or sets the view box of the canvas, i.e. the
	 * area that is currently displayed.
	 *
	 * The getter may return a cached viewbox (if it is currently
	 * changing). To force a recomputation, pass `false` as the first argument.
	 *
	 * @example
	 *
	 * canvas.viewbox({ x: 100, y: 100, width: 500, height: 500 })
	 *
	 * // sets the visible area of the diagram to (100|100) -> (600|100)
	 * // and and scales it according to the diagram width
	 *
	 * var viewbox = canvas.viewbox(); // pass `false` to force recomputing the box.
	 *
	 * console.log(viewbox);
	 * // {
	 * //   inner: Dimensions,
	 * //   outer: Dimensions,
	 * //   scale,
	 * //   x, y,
	 * //   width, height
	 * // }
	 *
	 * @param  {Object} [box] the new view box to set
	 * @param  {Number} box.x the top left X coordinate of the canvas visible in view box
	 * @param  {Number} box.y the top left Y coordinate of the canvas visible in view box
	 * @param  {Number} box.width the visible width
	 * @param  {Number} box.height
	 *
	 * @return {Object} the current view box
	 */
	// Canvas.prototype.viewbox = function(box) {
	//
	//   if (box === undefined && this._cachedViewbox) {
	//     return this._cachedViewbox;
	//   }
	//
	//   var viewport = this._viewport,
	//     innerBox,
	//     outerBox = this.getSize(),
	//     matrix,
	//     scale,
	//     x, y;
	//
	//   if (!box) {
	//     // compute the inner box based on the
	//     // diagrams default layer. This allows us to exclude
	//     // external components, such as overlays
	//     innerBox = this.getDefaultLayer().getBBox(true);
	//
	//     matrix = viewport.transform().localMatrix;
	//     scale = round(matrix.a, 1000);
	//
	//     x = round(-matrix.e || 0, 1000);
	//     y = round(-matrix.f || 0, 1000);
	//
	//     box = this._cachedViewbox = {
	//       x: x ? x / scale : 0,
	//       y: y ? y / scale : 0,
	//       width: outerBox.width / scale,
	//       height: outerBox.height / scale,
	//       scale: scale,
	//       inner: {
	//         width: innerBox.width,
	//         height: innerBox.height,
	//         x: innerBox.x,
	//         y: innerBox.y
	//       },
	//       outer: outerBox
	//     };
	//
	//     return box;
	//   } else {
	//
	//     this._changeViewbox(function() {
	//       scale = Math.min(outerBox.width / box.width, outerBox.height / box.height);
	//
	//       matrix = new Snap.Matrix().scale(scale).translate(-box.x, -box.y);
	//       viewport.transform(matrix);
	//     });
	//   }
	//
	//   return box;
	// };
	
	
	/**
	 * Gets or sets the scroll of the canvas.
	 *
	 * @param {Object} [delta] the new scroll to apply.
	 *
	 * @param {Number} [delta.dx]
	 * @param {Number} [delta.dy]
	 */
	// Canvas.prototype.scroll = function(delta) {
	//
	//   var node = this._viewport.node;
	//   var matrix = node.getCTM();
	//
	//   if (delta) {
	//     this._changeViewbox(function() {
	//       delta = assign({ dx: 0, dy: 0 }, delta || {});
	//
	//       matrix = this._svg.node.createSVGMatrix().translate(delta.dx, delta.dy).multiply(matrix);
	//
	//       setCTM(node, matrix);
	//     });
	//   }
	//
	//   return { x: matrix.e, y: matrix.f };
	// };
	
	
	/**
	 * Gets or sets the current zoom of the canvas, optionally zooming
	 * to the specified position.
	 *
	 * The getter may return a cached zoom level. Call it with `false` as
	 * the first argument to force recomputation of the current level.
	 *
	 * @param {String|Number} [newScale] the new zoom level, either a number, i.e. 0.9,
	 *                                   or `fit-viewport` to adjust the size to fit the current viewport
	 * @param {String|Point} [center] the reference point { x: .., y: ..} to zoom to, 'auto' to zoom into mid or null
	 *
	 * @return {Number} the current scale
	 */
	// Canvas.prototype.zoom = function(newScale, center) {
	//
	//   if (!newScale) {
	//     return this.viewbox(newScale).scale;
	//   }
	//
	//   if (newScale === 'fit-viewport') {
	//     return this._fitViewport(center);
	//   }
	//
	//   var outer,
	//     matrix;
	//
	//   this._changeViewbox(function() {
	//
	//     if (typeof center !== 'object') {
	//       outer = this.viewbox().outer;
	//
	//       center = {
	//         x: outer.width / 2,
	//         y: outer.height / 2
	//       };
	//     }
	//
	//     matrix = this._setZoom(newScale, center);
	//   });
	//
	//   return round(matrix.a, 1000);
	// };
	//
	// function setCTM(node, m) {
	//   var mstr = 'matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + m.e + ',' + m.f + ')';
	//   node.setAttribute('transform', mstr);
	// }
	//
	// Canvas.prototype._fitViewport = function(center) {
	//
	//   var vbox = this.viewbox(),
	//     outer = vbox.outer,
	//     inner = vbox.inner,
	//     newScale,
	//     newViewbox;
	//
	//   // display the complete diagram without zooming in.
	//   // instead of relying on internal zoom, we perform a
	//   // hard reset on the canvas viewbox to realize this
	//   //
	//   // if diagram does not need to be zoomed in, we focus it around
	//   // the diagram origin instead
	//
	//   if (inner.x >= 0 &&
	//     inner.y >= 0 &&
	//     inner.x + inner.width <= outer.width &&
	//     inner.y + inner.height <= outer.height &&
	//     !center) {
	//
	//     newViewbox = {
	//       x: 0,
	//       y: 0,
	//       width: Math.max(inner.width + inner.x, outer.width),
	//       height: Math.max(inner.height + inner.y, outer.height)
	//     };
	//   } else {
	//
	//     newScale = Math.min(1, outer.width / inner.width, outer.height / inner.height);
	//     newViewbox = {
	//       x: inner.x + (center ? inner.width / 2 - outer.width / newScale / 2 : 0),
	//       y: inner.y + (center ? inner.height / 2 - outer.height / newScale / 2 : 0),
	//       width: outer.width / newScale,
	//       height: outer.height / newScale
	//     };
	//   }
	//
	//   this.viewbox(newViewbox);
	//
	//   return this.viewbox(false).scale;
	// };
	//
	//
	// Canvas.prototype._setZoom = function(scale, center) {
	//
	//   var svg = this._svg.node,
	//     viewport = this._viewport.node;
	//
	//   var matrix = svg.createSVGMatrix();
	//   var point = svg.createSVGPoint();
	//
	//   var centerPoint,
	//     originalPoint,
	//     currentMatrix,
	//     scaleMatrix,
	//     newMatrix;
	//
	//   currentMatrix = viewport.getCTM();
	//
	//
	//   var currentScale = currentMatrix.a;
	//
	//   if (center) {
	//     centerPoint = assign(point, center);
	//
	//     // revert applied viewport transformations
	//     originalPoint = centerPoint.matrixTransform(currentMatrix.inverse());
	//
	//     // create scale matrix
	//     scaleMatrix = matrix
	//       .translate(originalPoint.x, originalPoint.y)
	//       .scale(1 / currentScale * scale)
	//       .translate(-originalPoint.x, -originalPoint.y);
	//
	//     newMatrix = currentMatrix.multiply(scaleMatrix);
	//   } else {
	//     newMatrix = matrix.scale(scale);
	//   }
	//
	//   setCTM(this._viewport.node, newMatrix);
	//
	//   return newMatrix;
	// };
	//
	//
	/**
	 * Returns the size of the canvas
	 *
	 * @return {Dimensions}
	 */
	Canvas.prototype.getSize = function() {
	  return {
	    width: this._container.clientWidth,
	    height: this._container.clientHeight
	  };
	};
	//
	//
	// /**
	//  * Return the absolute bounding box for the given element
	//  *
	//  * The absolute bounding box may be used to display overlays in the
	//  * callers (browser) coordinate system rather than the zoomed in/out
	//  * canvas coordinates.
	//  *
	//  * @param  {ElementDescriptor} element
	//  * @return {Bounds} the absolute bounding box
	//  */
	// Canvas.prototype.getAbsoluteBBox = function(element) {
	//   var vbox = this.viewbox();
	//   var bbox;
	//
	//   // connection
	//   // use svg bbox
	//   if (element.waypoints) {
	//     var gfx = this.getGraphics(element);
	//
	//     var transformBBox = gfx.getBBox(true);
	//     bbox = gfx.getBBox();
	//
	//     bbox.x -= transformBBox.x;
	//     bbox.y -= transformBBox.y;
	//
	//     bbox.width += 2 * transformBBox.x;
	//     bbox.height +=  2 * transformBBox.y;
	//   }
	//   // shapes
	//   // use data
	//   else {
	//     bbox = element;
	//   }
	//
	//   var x = bbox.x * vbox.scale - vbox.x * vbox.scale;
	//   var y = bbox.y * vbox.scale - vbox.y * vbox.scale;
	//
	//   var width = bbox.width * vbox.scale;
	//   var height = bbox.height * vbox.scale;
	//
	//   return {
	//     x: x,
	//     y: y,
	//     width: width,
	//     height: height
	//   };
	// };
	//
	/**
	 * Fires an event in order other modules can react to the
	 * canvas resizing
	 */
	Canvas.prototype.resized = function() {
	  this._eventBus.emit('canvas.resized');
	};

/***/ },
/* 255 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  'castArray': __webpack_require__(256),
	  'clone': __webpack_require__(257),
	  'cloneDeep': __webpack_require__(258),
	  'cloneDeepWith': __webpack_require__(259),
	  'cloneWith': __webpack_require__(260),
	  'conformsTo': __webpack_require__(261),
	  'eq': __webpack_require__(25),
	  'gt': __webpack_require__(263),
	  'gte': __webpack_require__(267),
	  'isArguments': __webpack_require__(44),
	  'isArray': __webpack_require__(47),
	  'isArrayBuffer': __webpack_require__(268),
	  'isArrayLike': __webpack_require__(37),
	  'isArrayLikeObject': __webpack_require__(131),
	  'isBoolean': __webpack_require__(270),
	  'isBuffer': __webpack_require__(48),
	  'isDate': __webpack_require__(271),
	  'isElement': __webpack_require__(273),
	  'isEmpty': __webpack_require__(274),
	  'isEqual': __webpack_require__(275),
	  'isEqualWith': __webpack_require__(276),
	  'isError': __webpack_require__(277),
	  'isFinite': __webpack_require__(278),
	  'isFunction': __webpack_require__(13),
	  'isInteger': __webpack_require__(279),
	  'isLength': __webpack_require__(38),
	  'isMap': __webpack_require__(282),
	  'isMatch': __webpack_require__(284),
	  'isMatchWith': __webpack_require__(285),
	  'isNaN': __webpack_require__(286),
	  'isNative': __webpack_require__(288),
	  'isNil': __webpack_require__(290),
	  'isNull': __webpack_require__(291),
	  'isNumber': __webpack_require__(287),
	  'isObject': __webpack_require__(20),
	  'isObjectLike': __webpack_require__(46),
	  'isPlainObject': __webpack_require__(132),
	  'isRegExp': __webpack_require__(292),
	  'isSafeInteger': __webpack_require__(294),
	  'isSet': __webpack_require__(295),
	  'isString': __webpack_require__(297),
	  'isSymbol': __webpack_require__(70),
	  'isTypedArray': __webpack_require__(51),
	  'isUndefined': __webpack_require__(298),
	  'isWeakMap': __webpack_require__(299),
	  'isWeakSet': __webpack_require__(300),
	  'lt': __webpack_require__(301),
	  'lte': __webpack_require__(303),
	  'toArray': __webpack_require__(304),
	  'toFinite': __webpack_require__(281),
	  'toInteger': __webpack_require__(280),
	  'toLength': __webpack_require__(310),
	  'toNumber': __webpack_require__(266),
	  'toPlainObject': __webpack_require__(133),
	  'toSafeInteger': __webpack_require__(312),
	  'toString': __webpack_require__(97)
	};


/***/ },
/* 256 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(47);
	
	/**
	 * Casts `value` as an array if it's not one.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.4.0
	 * @category Lang
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast array.
	 * @example
	 *
	 * _.castArray(1);
	 * // => [1]
	 *
	 * _.castArray({ 'a': 1 });
	 * // => [{ 'a': 1 }]
	 *
	 * _.castArray('abc');
	 * // => ['abc']
	 *
	 * _.castArray(null);
	 * // => [null]
	 *
	 * _.castArray(undefined);
	 * // => [undefined]
	 *
	 * _.castArray();
	 * // => []
	 *
	 * var array = [1, 2, 3];
	 * console.log(_.castArray(array) === array);
	 * // => true
	 */
	function castArray() {
	  if (!arguments.length) {
	    return [];
	  }
	  var value = arguments[0];
	  return isArray(value) ? value : [value];
	}
	
	module.exports = castArray;


/***/ },
/* 257 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(204);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_SYMBOLS_FLAG = 4;
	
	/**
	 * Creates a shallow clone of `value`.
	 *
	 * **Note:** This method is loosely based on the
	 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
	 * and supports cloning arrays, array buffers, booleans, date objects, maps,
	 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
	 * arrays. The own enumerable properties of `arguments` objects are cloned
	 * as plain objects. An empty object is returned for uncloneable values such
	 * as error objects, functions, DOM nodes, and WeakMaps.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to clone.
	 * @returns {*} Returns the cloned value.
	 * @see _.cloneDeep
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var shallow = _.clone(objects);
	 * console.log(shallow[0] === objects[0]);
	 * // => true
	 */
	function clone(value) {
	  return baseClone(value, CLONE_SYMBOLS_FLAG);
	}
	
	module.exports = clone;


/***/ },
/* 258 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(204);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_SYMBOLS_FLAG = 4;
	
	/**
	 * This method is like `_.clone` except that it recursively clones `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.0.0
	 * @category Lang
	 * @param {*} value The value to recursively clone.
	 * @returns {*} Returns the deep cloned value.
	 * @see _.clone
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var deep = _.cloneDeep(objects);
	 * console.log(deep[0] === objects[0]);
	 * // => false
	 */
	function cloneDeep(value) {
	  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
	}
	
	module.exports = cloneDeep;


/***/ },
/* 259 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(204);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_SYMBOLS_FLAG = 4;
	
	/**
	 * This method is like `_.cloneWith` except that it recursively clones `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to recursively clone.
	 * @param {Function} [customizer] The function to customize cloning.
	 * @returns {*} Returns the deep cloned value.
	 * @see _.cloneWith
	 * @example
	 *
	 * function customizer(value) {
	 *   if (_.isElement(value)) {
	 *     return value.cloneNode(true);
	 *   }
	 * }
	 *
	 * var el = _.cloneDeepWith(document.body, customizer);
	 *
	 * console.log(el === document.body);
	 * // => false
	 * console.log(el.nodeName);
	 * // => 'BODY'
	 * console.log(el.childNodes.length);
	 * // => 20
	 */
	function cloneDeepWith(value, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
	}
	
	module.exports = cloneDeepWith;


/***/ },
/* 260 */
/***/ function(module, exports, __webpack_require__) {

	var baseClone = __webpack_require__(204);
	
	/** Used to compose bitmasks for cloning. */
	var CLONE_SYMBOLS_FLAG = 4;
	
	/**
	 * This method is like `_.clone` except that it accepts `customizer` which
	 * is invoked to produce the cloned value. If `customizer` returns `undefined`,
	 * cloning is handled by the method instead. The `customizer` is invoked with
	 * up to four arguments; (value [, index|key, object, stack]).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to clone.
	 * @param {Function} [customizer] The function to customize cloning.
	 * @returns {*} Returns the cloned value.
	 * @see _.cloneDeepWith
	 * @example
	 *
	 * function customizer(value) {
	 *   if (_.isElement(value)) {
	 *     return value.cloneNode(false);
	 *   }
	 * }
	 *
	 * var el = _.cloneWith(document.body, customizer);
	 *
	 * console.log(el === document.body);
	 * // => false
	 * console.log(el.nodeName);
	 * // => 'BODY'
	 * console.log(el.childNodes.length);
	 * // => 0
	 */
	function cloneWith(value, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return baseClone(value, CLONE_SYMBOLS_FLAG, customizer);
	}
	
	module.exports = cloneWith;


/***/ },
/* 261 */
/***/ function(module, exports, __webpack_require__) {

	var baseConformsTo = __webpack_require__(262),
	    keys = __webpack_require__(41);
	
	/**
	 * Checks if `object` conforms to `source` by invoking the predicate
	 * properties of `source` with the corresponding property values of `object`.
	 *
	 * **Note:** This method is equivalent to `_.conforms` when `source` is
	 * partially applied.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.14.0
	 * @category Lang
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property predicates to conform to.
	 * @returns {boolean} Returns `true` if `object` conforms, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 *
	 * _.conformsTo(object, { 'b': function(n) { return n > 1; } });
	 * // => true
	 *
	 * _.conformsTo(object, { 'b': function(n) { return n > 2; } });
	 * // => false
	 */
	function conformsTo(object, source) {
	  return source == null || baseConformsTo(object, source, keys(source));
	}
	
	module.exports = conformsTo;


/***/ },
/* 262 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.conformsTo` which accepts `props` to check.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property predicates to conform to.
	 * @returns {boolean} Returns `true` if `object` conforms, else `false`.
	 */
	function baseConformsTo(object, source, props) {
	  var length = props.length;
	  if (object == null) {
	    return !length;
	  }
	  object = Object(object);
	  while (length--) {
	    var key = props[length],
	        predicate = source[key],
	        value = object[key];
	
	    if ((value === undefined && !(key in object)) || !predicate(value)) {
	      return false;
	    }
	  }
	  return true;
	}
	
	module.exports = baseConformsTo;


/***/ },
/* 263 */
/***/ function(module, exports, __webpack_require__) {

	var baseGt = __webpack_require__(264),
	    createRelationalOperation = __webpack_require__(265);
	
	/**
	 * Checks if `value` is greater than `other`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.9.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is greater than `other`,
	 *  else `false`.
	 * @see _.lt
	 * @example
	 *
	 * _.gt(3, 1);
	 * // => true
	 *
	 * _.gt(3, 3);
	 * // => false
	 *
	 * _.gt(1, 3);
	 * // => false
	 */
	var gt = createRelationalOperation(baseGt);
	
	module.exports = gt;


/***/ },
/* 264 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.gt` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is greater than `other`,
	 *  else `false`.
	 */
	function baseGt(value, other) {
	  return value > other;
	}
	
	module.exports = baseGt;


/***/ },
/* 265 */
/***/ function(module, exports, __webpack_require__) {

	var toNumber = __webpack_require__(266);
	
	/**
	 * Creates a function that performs a relational operation on two values.
	 *
	 * @private
	 * @param {Function} operator The function to perform the operation.
	 * @returns {Function} Returns the new relational operation function.
	 */
	function createRelationalOperation(operator) {
	  return function(value, other) {
	    if (!(typeof value == 'string' && typeof other == 'string')) {
	      value = toNumber(value);
	      other = toNumber(other);
	    }
	    return operator(value, other);
	  };
	}
	
	module.exports = createRelationalOperation;


/***/ },
/* 266 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(20),
	    isSymbol = __webpack_require__(70);
	
	/** Used as references for various `Number` constants. */
	var NAN = 0 / 0;
	
	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;
	
	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
	
	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;
	
	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;
	
	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;
	
	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol(value)) {
	    return NAN;
	  }
	  if (isObject(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}
	
	module.exports = toNumber;


/***/ },
/* 267 */
/***/ function(module, exports, __webpack_require__) {

	var createRelationalOperation = __webpack_require__(265);
	
	/**
	 * Checks if `value` is greater than or equal to `other`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.9.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is greater than or equal to
	 *  `other`, else `false`.
	 * @see _.lte
	 * @example
	 *
	 * _.gte(3, 1);
	 * // => true
	 *
	 * _.gte(3, 3);
	 * // => true
	 *
	 * _.gte(1, 3);
	 * // => false
	 */
	var gte = createRelationalOperation(function(value, other) {
	  return value >= other;
	});
	
	module.exports = gte;


/***/ },
/* 268 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsArrayBuffer = __webpack_require__(269),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer;
	
	/**
	 * Checks if `value` is classified as an `ArrayBuffer` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
	 * @example
	 *
	 * _.isArrayBuffer(new ArrayBuffer(2));
	 * // => true
	 *
	 * _.isArrayBuffer(new Array(2));
	 * // => false
	 */
	var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;
	
	module.exports = isArrayBuffer;


/***/ },
/* 269 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	var arrayBufferTag = '[object ArrayBuffer]';
	
	/**
	 * The base implementation of `_.isArrayBuffer` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
	 */
	function baseIsArrayBuffer(value) {
	  return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
	}
	
	module.exports = baseIsArrayBuffer;


/***/ },
/* 270 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]';
	
	/**
	 * Checks if `value` is classified as a boolean primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
	 * @example
	 *
	 * _.isBoolean(false);
	 * // => true
	 *
	 * _.isBoolean(null);
	 * // => false
	 */
	function isBoolean(value) {
	  return value === true || value === false ||
	    (isObjectLike(value) && baseGetTag(value) == boolTag);
	}
	
	module.exports = isBoolean;


/***/ },
/* 271 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsDate = __webpack_require__(272),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsDate = nodeUtil && nodeUtil.isDate;
	
	/**
	 * Checks if `value` is classified as a `Date` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
	 * @example
	 *
	 * _.isDate(new Date);
	 * // => true
	 *
	 * _.isDate('Mon April 23 2012');
	 * // => false
	 */
	var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
	
	module.exports = isDate;


/***/ },
/* 272 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var dateTag = '[object Date]';
	
	/**
	 * The base implementation of `_.isDate` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
	 */
	function baseIsDate(value) {
	  return isObjectLike(value) && baseGetTag(value) == dateTag;
	}
	
	module.exports = baseIsDate;


/***/ },
/* 273 */
/***/ function(module, exports, __webpack_require__) {

	var isObjectLike = __webpack_require__(46),
	    isPlainObject = __webpack_require__(132);
	
	/**
	 * Checks if `value` is likely a DOM element.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
	 * @example
	 *
	 * _.isElement(document.body);
	 * // => true
	 *
	 * _.isElement('<body>');
	 * // => false
	 */
	function isElement(value) {
	  return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
	}
	
	module.exports = isElement;


/***/ },
/* 274 */
/***/ function(module, exports, __webpack_require__) {

	var baseKeys = __webpack_require__(55),
	    getTag = __webpack_require__(139),
	    isArguments = __webpack_require__(44),
	    isArray = __webpack_require__(47),
	    isArrayLike = __webpack_require__(37),
	    isBuffer = __webpack_require__(48),
	    isPrototype = __webpack_require__(40),
	    isTypedArray = __webpack_require__(51);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    setTag = '[object Set]';
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Checks if `value` is an empty object, collection, map, or set.
	 *
	 * Objects are considered empty if they have no own enumerable string keyed
	 * properties.
	 *
	 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
	 * jQuery-like collections are considered empty if they have a `length` of `0`.
	 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
	 * @example
	 *
	 * _.isEmpty(null);
	 * // => true
	 *
	 * _.isEmpty(true);
	 * // => true
	 *
	 * _.isEmpty(1);
	 * // => true
	 *
	 * _.isEmpty([1, 2, 3]);
	 * // => false
	 *
	 * _.isEmpty({ 'a': 1 });
	 * // => false
	 */
	function isEmpty(value) {
	  if (value == null) {
	    return true;
	  }
	  if (isArrayLike(value) &&
	      (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
	        isBuffer(value) || isTypedArray(value) || isArguments(value))) {
	    return !value.length;
	  }
	  var tag = getTag(value);
	  if (tag == mapTag || tag == setTag) {
	    return !value.size;
	  }
	  if (isPrototype(value)) {
	    return !baseKeys(value).length;
	  }
	  for (var key in value) {
	    if (hasOwnProperty.call(value, key)) {
	      return false;
	    }
	  }
	  return true;
	}
	
	module.exports = isEmpty;


/***/ },
/* 275 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(156);
	
	/**
	 * Performs a deep comparison between two values to determine if they are
	 * equivalent.
	 *
	 * **Note:** This method supports comparing arrays, array buffers, booleans,
	 * date objects, error objects, maps, numbers, `Object` objects, regexes,
	 * sets, strings, symbols, and typed arrays. `Object` objects are compared
	 * by their own, not inherited, enumerable properties. Functions and DOM
	 * nodes are **not** supported.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.isEqual(object, other);
	 * // => true
	 *
	 * object === other;
	 * // => false
	 */
	function isEqual(value, other) {
	  return baseIsEqual(value, other);
	}
	
	module.exports = isEqual;


/***/ },
/* 276 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsEqual = __webpack_require__(156);
	
	/**
	 * This method is like `_.isEqual` except that it accepts `customizer` which
	 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
	 * are handled by the method instead. The `customizer` is invoked with up to
	 * six arguments: (objValue, othValue [, index|key, object, other, stack]).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * function isGreeting(value) {
	 *   return /^h(?:i|ello)$/.test(value);
	 * }
	 *
	 * function customizer(objValue, othValue) {
	 *   if (isGreeting(objValue) && isGreeting(othValue)) {
	 *     return true;
	 *   }
	 * }
	 *
	 * var array = ['hello', 'goodbye'];
	 * var other = ['hi', 'goodbye'];
	 *
	 * _.isEqualWith(array, other, customizer);
	 * // => true
	 */
	function isEqualWith(value, other, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  var result = customizer ? customizer(value, other) : undefined;
	  return result === undefined ? baseIsEqual(value, other, undefined, customizer) : !!result;
	}
	
	module.exports = isEqualWith;


/***/ },
/* 277 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46),
	    isPlainObject = __webpack_require__(132);
	
	/** `Object#toString` result references. */
	var domExcTag = '[object DOMException]',
	    errorTag = '[object Error]';
	
	/**
	 * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
	 * `SyntaxError`, `TypeError`, or `URIError` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
	 * @example
	 *
	 * _.isError(new Error);
	 * // => true
	 *
	 * _.isError(Error);
	 * // => false
	 */
	function isError(value) {
	  if (!isObjectLike(value)) {
	    return false;
	  }
	  var tag = baseGetTag(value);
	  return tag == errorTag || tag == domExcTag ||
	    (typeof value.message == 'string' && typeof value.name == 'string' && !isPlainObject(value));
	}
	
	module.exports = isError;


/***/ },
/* 278 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(16);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsFinite = root.isFinite;
	
	/**
	 * Checks if `value` is a finite primitive number.
	 *
	 * **Note:** This method is based on
	 * [`Number.isFinite`](https://mdn.io/Number/isFinite).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
	 * @example
	 *
	 * _.isFinite(3);
	 * // => true
	 *
	 * _.isFinite(Number.MIN_VALUE);
	 * // => true
	 *
	 * _.isFinite(Infinity);
	 * // => false
	 *
	 * _.isFinite('3');
	 * // => false
	 */
	function isFinite(value) {
	  return typeof value == 'number' && nativeIsFinite(value);
	}
	
	module.exports = isFinite;


/***/ },
/* 279 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(280);
	
	/**
	 * Checks if `value` is an integer.
	 *
	 * **Note:** This method is based on
	 * [`Number.isInteger`](https://mdn.io/Number/isInteger).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an integer, else `false`.
	 * @example
	 *
	 * _.isInteger(3);
	 * // => true
	 *
	 * _.isInteger(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isInteger(Infinity);
	 * // => false
	 *
	 * _.isInteger('3');
	 * // => false
	 */
	function isInteger(value) {
	  return typeof value == 'number' && value == toInteger(value);
	}
	
	module.exports = isInteger;


/***/ },
/* 280 */
/***/ function(module, exports, __webpack_require__) {

	var toFinite = __webpack_require__(281);
	
	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3.2);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3.2');
	 * // => 3
	 */
	function toInteger(value) {
	  var result = toFinite(value),
	      remainder = result % 1;
	
	  return result === result ? (remainder ? result - remainder : result) : 0;
	}
	
	module.exports = toInteger;


/***/ },
/* 281 */
/***/ function(module, exports, __webpack_require__) {

	var toNumber = __webpack_require__(266);
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0,
	    MAX_INTEGER = 1.7976931348623157e+308;
	
	/**
	 * Converts `value` to a finite number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.12.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted number.
	 * @example
	 *
	 * _.toFinite(3.2);
	 * // => 3.2
	 *
	 * _.toFinite(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toFinite(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toFinite('3.2');
	 * // => 3.2
	 */
	function toFinite(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber(value);
	  if (value === INFINITY || value === -INFINITY) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  return value === value ? value : 0;
	}
	
	module.exports = toFinite;


/***/ },
/* 282 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMap = __webpack_require__(283),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsMap = nodeUtil && nodeUtil.isMap;
	
	/**
	 * Checks if `value` is classified as a `Map` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 * @example
	 *
	 * _.isMap(new Map);
	 * // => true
	 *
	 * _.isMap(new WeakMap);
	 * // => false
	 */
	var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
	
	module.exports = isMap;


/***/ },
/* 283 */
/***/ function(module, exports, __webpack_require__) {

	var getTag = __webpack_require__(139),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]';
	
	/**
	 * The base implementation of `_.isMap` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 */
	function baseIsMap(value) {
	  return isObjectLike(value) && getTag(value) == mapTag;
	}
	
	module.exports = baseIsMap;


/***/ },
/* 284 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(155),
	    getMatchData = __webpack_require__(167);
	
	/**
	 * Performs a partial deep comparison between `object` and `source` to
	 * determine if `object` contains equivalent property values.
	 *
	 * **Note:** This method is equivalent to `_.matches` when `source` is
	 * partially applied.
	 *
	 * Partial comparisons will match empty array and empty object `source`
	 * values against any array or object value, respectively. See `_.isEqual`
	 * for a list of supported value comparisons.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 *
	 * _.isMatch(object, { 'b': 2 });
	 * // => true
	 *
	 * _.isMatch(object, { 'b': 1 });
	 * // => false
	 */
	function isMatch(object, source) {
	  return object === source || baseIsMatch(object, source, getMatchData(source));
	}
	
	module.exports = isMatch;


/***/ },
/* 285 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsMatch = __webpack_require__(155),
	    getMatchData = __webpack_require__(167);
	
	/**
	 * This method is like `_.isMatch` except that it accepts `customizer` which
	 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
	 * are handled by the method instead. The `customizer` is invoked with five
	 * arguments: (objValue, srcValue, index|key, object, source).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 * @example
	 *
	 * function isGreeting(value) {
	 *   return /^h(?:i|ello)$/.test(value);
	 * }
	 *
	 * function customizer(objValue, srcValue) {
	 *   if (isGreeting(objValue) && isGreeting(srcValue)) {
	 *     return true;
	 *   }
	 * }
	 *
	 * var object = { 'greeting': 'hello' };
	 * var source = { 'greeting': 'hi' };
	 *
	 * _.isMatchWith(object, source, customizer);
	 * // => true
	 */
	function isMatchWith(object, source, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return baseIsMatch(object, source, getMatchData(source), customizer);
	}
	
	module.exports = isMatchWith;


/***/ },
/* 286 */
/***/ function(module, exports, __webpack_require__) {

	var isNumber = __webpack_require__(287);
	
	/**
	 * Checks if `value` is `NaN`.
	 *
	 * **Note:** This method is based on
	 * [`Number.isNaN`](https://mdn.io/Number/isNaN) and is not the same as
	 * global [`isNaN`](https://mdn.io/isNaN) which returns `true` for
	 * `undefined` and other non-number values.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 * @example
	 *
	 * _.isNaN(NaN);
	 * // => true
	 *
	 * _.isNaN(new Number(NaN));
	 * // => true
	 *
	 * isNaN(undefined);
	 * // => true
	 *
	 * _.isNaN(undefined);
	 * // => false
	 */
	function isNaN(value) {
	  // An `NaN` primitive is the only value that is not equal to itself.
	  // Perform the `toStringTag` check first to avoid errors with some
	  // ActiveX objects in IE.
	  return isNumber(value) && value != +value;
	}
	
	module.exports = isNaN;


/***/ },
/* 287 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var numberTag = '[object Number]';
	
	/**
	 * Checks if `value` is classified as a `Number` primitive or object.
	 *
	 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
	 * classified as numbers, use the `_.isFinite` method.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
	 * @example
	 *
	 * _.isNumber(3);
	 * // => true
	 *
	 * _.isNumber(Number.MIN_VALUE);
	 * // => true
	 *
	 * _.isNumber(Infinity);
	 * // => true
	 *
	 * _.isNumber('3');
	 * // => false
	 */
	function isNumber(value) {
	  return typeof value == 'number' ||
	    (isObjectLike(value) && baseGetTag(value) == numberTag);
	}
	
	module.exports = isNumber;


/***/ },
/* 288 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsNative = __webpack_require__(12),
	    isMaskable = __webpack_require__(289);
	
	/** Error message constants. */
	var CORE_ERROR_TEXT = 'Unsupported core-js use. Try https://npms.io/search?q=ponyfill.';
	
	/**
	 * Checks if `value` is a pristine native function.
	 *
	 * **Note:** This method can't reliably detect native functions in the presence
	 * of the core-js package because core-js circumvents this kind of detection.
	 * Despite multiple requests, the core-js maintainer has made it clear: any
	 * attempt to fix the detection will be obstructed. As a result, we're left
	 * with little choice but to throw an error. Unfortunately, this also affects
	 * packages, like [babel-polyfill](https://www.npmjs.com/package/babel-polyfill),
	 * which rely on core-js.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 * @example
	 *
	 * _.isNative(Array.prototype.push);
	 * // => true
	 *
	 * _.isNative(_);
	 * // => false
	 */
	function isNative(value) {
	  if (isMaskable(value)) {
	    throw new Error(CORE_ERROR_TEXT);
	  }
	  return baseIsNative(value);
	}
	
	module.exports = isNative;


/***/ },
/* 289 */
/***/ function(module, exports, __webpack_require__) {

	var coreJsData = __webpack_require__(22),
	    isFunction = __webpack_require__(13),
	    stubFalse = __webpack_require__(50);
	
	/**
	 * Checks if `func` is capable of being masked.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `func` is maskable, else `false`.
	 */
	var isMaskable = coreJsData ? isFunction : stubFalse;
	
	module.exports = isMaskable;


/***/ },
/* 290 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is `null` or `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
	 * @example
	 *
	 * _.isNil(null);
	 * // => true
	 *
	 * _.isNil(void 0);
	 * // => true
	 *
	 * _.isNil(NaN);
	 * // => false
	 */
	function isNil(value) {
	  return value == null;
	}
	
	module.exports = isNil;


/***/ },
/* 291 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is `null`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
	 * @example
	 *
	 * _.isNull(null);
	 * // => true
	 *
	 * _.isNull(void 0);
	 * // => false
	 */
	function isNull(value) {
	  return value === null;
	}
	
	module.exports = isNull;


/***/ },
/* 292 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsRegExp = __webpack_require__(293),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsRegExp = nodeUtil && nodeUtil.isRegExp;
	
	/**
	 * Checks if `value` is classified as a `RegExp` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
	 * @example
	 *
	 * _.isRegExp(/abc/);
	 * // => true
	 *
	 * _.isRegExp('/abc/');
	 * // => false
	 */
	var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;
	
	module.exports = isRegExp;


/***/ },
/* 293 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var regexpTag = '[object RegExp]';
	
	/**
	 * The base implementation of `_.isRegExp` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
	 */
	function baseIsRegExp(value) {
	  return isObjectLike(value) && baseGetTag(value) == regexpTag;
	}
	
	module.exports = baseIsRegExp;


/***/ },
/* 294 */
/***/ function(module, exports, __webpack_require__) {

	var isInteger = __webpack_require__(279);
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Checks if `value` is a safe integer. An integer is safe if it's an IEEE-754
	 * double precision number which isn't the result of a rounded unsafe integer.
	 *
	 * **Note:** This method is based on
	 * [`Number.isSafeInteger`](https://mdn.io/Number/isSafeInteger).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a safe integer, else `false`.
	 * @example
	 *
	 * _.isSafeInteger(3);
	 * // => true
	 *
	 * _.isSafeInteger(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isSafeInteger(Infinity);
	 * // => false
	 *
	 * _.isSafeInteger('3');
	 * // => false
	 */
	function isSafeInteger(value) {
	  return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
	}
	
	module.exports = isSafeInteger;


/***/ },
/* 295 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsSet = __webpack_require__(296),
	    baseUnary = __webpack_require__(53),
	    nodeUtil = __webpack_require__(54);
	
	/* Node.js helper references. */
	var nodeIsSet = nodeUtil && nodeUtil.isSet;
	
	/**
	 * Checks if `value` is classified as a `Set` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 * @example
	 *
	 * _.isSet(new Set);
	 * // => true
	 *
	 * _.isSet(new WeakSet);
	 * // => false
	 */
	var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
	
	module.exports = isSet;


/***/ },
/* 296 */
/***/ function(module, exports, __webpack_require__) {

	var getTag = __webpack_require__(139),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var setTag = '[object Set]';
	
	/**
	 * The base implementation of `_.isSet` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 */
	function baseIsSet(value) {
	  return isObjectLike(value) && getTag(value) == setTag;
	}
	
	module.exports = baseIsSet;


/***/ },
/* 297 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isArray = __webpack_require__(47),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var stringTag = '[object String]';
	
	/**
	 * Checks if `value` is classified as a `String` primitive or object.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
	 * @example
	 *
	 * _.isString('abc');
	 * // => true
	 *
	 * _.isString(1);
	 * // => false
	 */
	function isString(value) {
	  return typeof value == 'string' ||
	    (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
	}
	
	module.exports = isString;


/***/ },
/* 298 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is `undefined`.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
	 * @example
	 *
	 * _.isUndefined(void 0);
	 * // => true
	 *
	 * _.isUndefined(null);
	 * // => false
	 */
	function isUndefined(value) {
	  return value === undefined;
	}
	
	module.exports = isUndefined;


/***/ },
/* 299 */
/***/ function(module, exports, __webpack_require__) {

	var getTag = __webpack_require__(139),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var weakMapTag = '[object WeakMap]';
	
	/**
	 * Checks if `value` is classified as a `WeakMap` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a weak map, else `false`.
	 * @example
	 *
	 * _.isWeakMap(new WeakMap);
	 * // => true
	 *
	 * _.isWeakMap(new Map);
	 * // => false
	 */
	function isWeakMap(value) {
	  return isObjectLike(value) && getTag(value) == weakMapTag;
	}
	
	module.exports = isWeakMap;


/***/ },
/* 300 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(14),
	    isObjectLike = __webpack_require__(46);
	
	/** `Object#toString` result references. */
	var weakSetTag = '[object WeakSet]';
	
	/**
	 * Checks if `value` is classified as a `WeakSet` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a weak set, else `false`.
	 * @example
	 *
	 * _.isWeakSet(new WeakSet);
	 * // => true
	 *
	 * _.isWeakSet(new Set);
	 * // => false
	 */
	function isWeakSet(value) {
	  return isObjectLike(value) && baseGetTag(value) == weakSetTag;
	}
	
	module.exports = isWeakSet;


/***/ },
/* 301 */
/***/ function(module, exports, __webpack_require__) {

	var baseLt = __webpack_require__(302),
	    createRelationalOperation = __webpack_require__(265);
	
	/**
	 * Checks if `value` is less than `other`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.9.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is less than `other`,
	 *  else `false`.
	 * @see _.gt
	 * @example
	 *
	 * _.lt(1, 3);
	 * // => true
	 *
	 * _.lt(3, 3);
	 * // => false
	 *
	 * _.lt(3, 1);
	 * // => false
	 */
	var lt = createRelationalOperation(baseLt);
	
	module.exports = lt;


/***/ },
/* 302 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.lt` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is less than `other`,
	 *  else `false`.
	 */
	function baseLt(value, other) {
	  return value < other;
	}
	
	module.exports = baseLt;


/***/ },
/* 303 */
/***/ function(module, exports, __webpack_require__) {

	var createRelationalOperation = __webpack_require__(265);
	
	/**
	 * Checks if `value` is less than or equal to `other`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.9.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if `value` is less than or equal to
	 *  `other`, else `false`.
	 * @see _.gte
	 * @example
	 *
	 * _.lte(1, 3);
	 * // => true
	 *
	 * _.lte(3, 3);
	 * // => true
	 *
	 * _.lte(3, 1);
	 * // => false
	 */
	var lte = createRelationalOperation(function(value, other) {
	  return value <= other;
	});
	
	module.exports = lte;


/***/ },
/* 304 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(15),
	    copyArray = __webpack_require__(128),
	    getTag = __webpack_require__(139),
	    isArrayLike = __webpack_require__(37),
	    isString = __webpack_require__(297),
	    iteratorToArray = __webpack_require__(305),
	    mapToArray = __webpack_require__(144),
	    setToArray = __webpack_require__(165),
	    stringToArray = __webpack_require__(306),
	    values = __webpack_require__(241);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    setTag = '[object Set]';
	
	/** Built-in value references. */
	var symIterator = Symbol ? Symbol.iterator : undefined;
	
	/**
	 * Converts `value` to an array.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {Array} Returns the converted array.
	 * @example
	 *
	 * _.toArray({ 'a': 1, 'b': 2 });
	 * // => [1, 2]
	 *
	 * _.toArray('abc');
	 * // => ['a', 'b', 'c']
	 *
	 * _.toArray(1);
	 * // => []
	 *
	 * _.toArray(null);
	 * // => []
	 */
	function toArray(value) {
	  if (!value) {
	    return [];
	  }
	  if (isArrayLike(value)) {
	    return isString(value) ? stringToArray(value) : copyArray(value);
	  }
	  if (symIterator && value[symIterator]) {
	    return iteratorToArray(value[symIterator]());
	  }
	  var tag = getTag(value),
	      func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);
	
	  return func(value);
	}
	
	module.exports = toArray;


/***/ },
/* 305 */
/***/ function(module, exports) {

	/**
	 * Converts `iterator` to an array.
	 *
	 * @private
	 * @param {Object} iterator The iterator to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function iteratorToArray(iterator) {
	  var data,
	      result = [];
	
	  while (!(data = iterator.next()).done) {
	    result.push(data.value);
	  }
	  return result;
	}
	
	module.exports = iteratorToArray;


/***/ },
/* 306 */
/***/ function(module, exports, __webpack_require__) {

	var asciiToArray = __webpack_require__(307),
	    hasUnicode = __webpack_require__(308),
	    unicodeToArray = __webpack_require__(309);
	
	/**
	 * Converts `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function stringToArray(string) {
	  return hasUnicode(string)
	    ? unicodeToArray(string)
	    : asciiToArray(string);
	}
	
	module.exports = stringToArray;


/***/ },
/* 307 */
/***/ function(module, exports) {

	/**
	 * Converts an ASCII `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function asciiToArray(string) {
	  return string.split('');
	}
	
	module.exports = asciiToArray;


/***/ },
/* 308 */
/***/ function(module, exports) {

	/** Used to compose unicode character classes. */
	var rsAstralRange = '\\ud800-\\udfff',
	    rsComboMarksRange = '\\u0300-\\u036f',
	    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange = '\\u20d0-\\u20ff',
	    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
	    rsVarRange = '\\ufe0e\\ufe0f';
	
	/** Used to compose unicode capture groups. */
	var rsZWJ = '\\u200d';
	
	/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
	var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');
	
	/**
	 * Checks if `string` contains Unicode symbols.
	 *
	 * @private
	 * @param {string} string The string to inspect.
	 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
	 */
	function hasUnicode(string) {
	  return reHasUnicode.test(string);
	}
	
	module.exports = hasUnicode;


/***/ },
/* 309 */
/***/ function(module, exports) {

	/** Used to compose unicode character classes. */
	var rsAstralRange = '\\ud800-\\udfff',
	    rsComboMarksRange = '\\u0300-\\u036f',
	    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange = '\\u20d0-\\u20ff',
	    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
	    rsVarRange = '\\ufe0e\\ufe0f';
	
	/** Used to compose unicode capture groups. */
	var rsAstral = '[' + rsAstralRange + ']',
	    rsCombo = '[' + rsComboRange + ']',
	    rsFitz = '\\ud83c[\\udffb-\\udfff]',
	    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
	    rsNonAstral = '[^' + rsAstralRange + ']',
	    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
	    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
	    rsZWJ = '\\u200d';
	
	/** Used to compose unicode regexes. */
	var reOptMod = rsModifier + '?',
	    rsOptVar = '[' + rsVarRange + ']?',
	    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
	    rsSeq = rsOptVar + reOptMod + rsOptJoin,
	    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
	
	/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
	var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');
	
	/**
	 * Converts a Unicode `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	function unicodeToArray(string) {
	  return string.match(reUnicode) || [];
	}
	
	module.exports = unicodeToArray;


/***/ },
/* 310 */
/***/ function(module, exports, __webpack_require__) {

	var baseClamp = __webpack_require__(311),
	    toInteger = __webpack_require__(280);
	
	/** Used as references for the maximum length and index of an array. */
	var MAX_ARRAY_LENGTH = 4294967295;
	
	/**
	 * Converts `value` to an integer suitable for use as the length of an
	 * array-like object.
	 *
	 * **Note:** This method is based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toLength(3.2);
	 * // => 3
	 *
	 * _.toLength(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toLength(Infinity);
	 * // => 4294967295
	 *
	 * _.toLength('3.2');
	 * // => 3
	 */
	function toLength(value) {
	  return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
	}
	
	module.exports = toLength;


/***/ },
/* 311 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.clamp` which doesn't coerce arguments.
	 *
	 * @private
	 * @param {number} number The number to clamp.
	 * @param {number} [lower] The lower bound.
	 * @param {number} upper The upper bound.
	 * @returns {number} Returns the clamped number.
	 */
	function baseClamp(number, lower, upper) {
	  if (number === number) {
	    if (upper !== undefined) {
	      number = number <= upper ? number : upper;
	    }
	    if (lower !== undefined) {
	      number = number >= lower ? number : lower;
	    }
	  }
	  return number;
	}
	
	module.exports = baseClamp;


/***/ },
/* 312 */
/***/ function(module, exports, __webpack_require__) {

	var baseClamp = __webpack_require__(311),
	    toInteger = __webpack_require__(280);
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Converts `value` to a safe integer. A safe integer can be compared and
	 * represented correctly.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toSafeInteger(3.2);
	 * // => 3
	 *
	 * _.toSafeInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toSafeInteger(Infinity);
	 * // => 9007199254740991
	 *
	 * _.toSafeInteger('3.2');
	 * // => 3
	 */
	function toSafeInteger(value) {
	  return baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
	}
	
	module.exports = toSafeInteger;


/***/ },
/* 313 */
/***/ function(module, exports, __webpack_require__) {

	!function(t,n){ true?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.d3=t.d3||{})}(this,function(t){"use strict";function n(t){return function(){var n=this.ownerDocument,e=this.namespaceURI;return e===kr&&n.documentElement.namespaceURI===kr?n.createElement(t):n.createElementNS(e,t)}}function e(t){return function(){return this.ownerDocument.createElementNS(t.space,t.local)}}function r(t,n,e){return t=i(t,n,e),function(n){var e=n.relatedTarget;e&&(e===this||8&e.compareDocumentPosition(this))||t.call(this,n)}}function i(n,e,r){return function(i){var o=t.event;t.event=i;try{n.call(this,this.__data__,e,r)}finally{t.event=o}}}function o(t){return t.trim().split(/^|\s+/).map(function(t){var n="",e=t.indexOf(".");return e>=0&&(n=t.slice(e+1),t=t.slice(0,e)),{type:t,name:n}})}function u(t){return function(){var n=this.__on;if(n){for(var e,r=0,i=-1,o=n.length;r<o;++r)e=n[r],t.type&&e.type!==t.type||e.name!==t.name?n[++i]=e:this.removeEventListener(e.type,e.listener,e.capture);++i?n.length=i:delete this.__on}}}function a(t,n,e){var o=Dr.hasOwnProperty(t.type)?r:i;return function(r,i,u){var a,s=this.__on,c=o(n,i,u);if(s)for(var l=0,h=s.length;l<h;++l)if((a=s[l]).type===t.type&&a.name===t.name)return this.removeEventListener(a.type,a.listener,a.capture),this.addEventListener(a.type,a.listener=c,a.capture=e),void(a.value=n);this.addEventListener(t.type,c,e),a={type:t.type,name:t.name,value:n,listener:c,capture:e},s?s.push(a):this.__on=[a]}}function s(n,e,r,i){var o=t.event;n.sourceEvent=t.event,t.event=n;try{return e.apply(r,i)}finally{t.event=o}}function c(){}function l(){return[]}function h(t,n){this.ownerDocument=t.ownerDocument,this.namespaceURI=t.namespaceURI,this._next=null,this._parent=t,this.__data__=n}function f(t,n,e,r,i,o){for(var u,a=0,s=n.length,c=o.length;a<c;++a)(u=n[a])?(u.__data__=o[a],r[a]=u):e[a]=new h(t,o[a]);for(;a<s;++a)(u=n[a])&&(i[a]=u)}function p(t,n,e,r,i,o,u){var a,s,c,l={},f=n.length,p=o.length,d=new Array(f);for(a=0;a<f;++a)(s=n[a])&&(d[a]=c=Rr+u.call(s,s.__data__,a,n),c in l?i[a]=s:l[c]=s);for(a=0;a<p;++a)c=Rr+u.call(t,o[a],a,o),(s=l[c])?(r[a]=s,s.__data__=o[a],l[c]=null):e[a]=new h(t,o[a]);for(a=0;a<f;++a)(s=n[a])&&l[d[a]]===s&&(i[a]=s)}function d(t,n){return t<n?-1:t>n?1:t>=n?0:NaN}function g(t){return function(){this.removeAttribute(t)}}function v(t){return function(){this.removeAttributeNS(t.space,t.local)}}function y(t,n){return function(){this.setAttribute(t,n)}}function m(t,n){return function(){this.setAttributeNS(t.space,t.local,n)}}function _(t,n){return function(){var e=n.apply(this,arguments);null==e?this.removeAttribute(t):this.setAttribute(t,e)}}function w(t,n){return function(){var e=n.apply(this,arguments);null==e?this.removeAttributeNS(t.space,t.local):this.setAttributeNS(t.space,t.local,e)}}function x(t){return function(){this.style.removeProperty(t)}}function M(t,n,e){return function(){this.style.setProperty(t,n,e)}}function b(t,n,e){return function(){var r=n.apply(this,arguments);null==r?this.style.removeProperty(t):this.style.setProperty(t,r,e)}}function k(t){return function(){delete this[t]}}function T(t,n){return function(){this[t]=n}}function N(t,n){return function(){var e=n.apply(this,arguments);null==e?delete this[t]:this[t]=e}}function A(t){return t.trim().split(/^|\s+/)}function C(t){return t.classList||new S(t)}function S(t){this._node=t,this._names=A(t.getAttribute("class")||"")}function z(t,n){for(var e=C(t),r=-1,i=n.length;++r<i;)e.add(n[r])}function U(t,n){for(var e=C(t),r=-1,i=n.length;++r<i;)e.remove(n[r])}function D(t){return function(){z(this,t)}}function E(t){return function(){U(this,t)}}function Y(t,n){return function(){(n.apply(this,arguments)?z:U)(this,t)}}function F(){this.textContent=""}function P(t){return function(){this.textContent=t}}function H(t){return function(){var n=t.apply(this,arguments);this.textContent=null==n?"":n}}function q(){this.innerHTML=""}function L(t){return function(){this.innerHTML=t}}function X(t){return function(){var n=t.apply(this,arguments);this.innerHTML=null==n?"":n}}function I(){this.nextSibling&&this.parentNode.appendChild(this)}function O(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}function j(){return null}function V(){var t=this.parentNode;t&&t.removeChild(this)}function $(t,n,e){var r=oi(t),i=r.CustomEvent;i?i=new i(n,e):(i=r.document.createEvent("Event"),e?(i.initEvent(n,e.bubbles,e.cancelable),i.detail=e.detail):i.initEvent(n,!1,!1)),t.dispatchEvent(i)}function R(t,n){return function(){return $(this,t,n)}}function B(t,n){return function(){return $(this,t,n.apply(this,arguments))}}function Z(t,n){this._groups=t,this._parents=n}function W(){return new Z([[document.documentElement]],mi)}function G(){for(var t,n=0,e=arguments.length,r={};n<e;++n){if(!(t=arguments[n]+"")||t in r)throw new Error("illegal type: "+t);r[t]=[]}return new J(r)}function J(t){this._=t}function K(t,n){return t.trim().split(/^|\s+/).map(function(t){var e="",r=t.indexOf(".");if(r>=0&&(e=t.slice(r+1),t=t.slice(0,r)),t&&!n.hasOwnProperty(t))throw new Error("unknown type: "+t);return{type:t,name:e}})}function Q(t,n){for(var e,r=0,i=t.length;r<i;++r)if((e=t[r]).name===n)return e.value}function tt(t,n,e){for(var r=0,i=t.length;r<i;++r)if(t[r].name===n){t[r]=Mi,t=t.slice(0,r).concat(t.slice(r+1));break}return null!=e&&t.push({name:n,value:e}),t}function nt(t,n){var e=t.document.documentElement,r=_i(t).on("dragstart.drag",null);n&&(r.on("click.drag",bi,!0),setTimeout(function(){r.on("click.drag",null)},0)),"onselectstart"in e?r.on("selectstart.drag",null):(e.style.MozUserSelect=e.__noselect,delete e.__noselect)}function et(t,n,e,r,i,o,u,a,s,c){this.target=t,this.type=n,this.subject=e,this.identifier=r,this.active=i,this.x=o,this.y=u,this.dx=a,this.dy=s,this._=c}function rt(t,n){var e=Object.create(t.prototype);for(var r in n)e[r]=n[r];return e}function it(){}function ot(t){var n;return t=(t+"").trim().toLowerCase(),(n=Ui.exec(t))?(n=parseInt(n[1],16),new lt(n>>8&15|n>>4&240,n>>4&15|240&n,(15&n)<<4|15&n,1)):(n=Di.exec(t))?ut(parseInt(n[1],16)):(n=Ei.exec(t))?new lt(n[1],n[2],n[3],1):(n=Yi.exec(t))?new lt(255*n[1]/100,255*n[2]/100,255*n[3]/100,1):(n=Fi.exec(t))?at(n[1],n[2],n[3],n[4]):(n=Pi.exec(t))?at(255*n[1]/100,255*n[2]/100,255*n[3]/100,n[4]):(n=Hi.exec(t))?ht(n[1],n[2]/100,n[3]/100,1):(n=qi.exec(t))?ht(n[1],n[2]/100,n[3]/100,n[4]):Li.hasOwnProperty(t)?ut(Li[t]):"transparent"===t?new lt(NaN,NaN,NaN,0):null}function ut(t){return new lt(t>>16&255,t>>8&255,255&t,1)}function at(t,n,e,r){return r<=0&&(t=n=e=NaN),new lt(t,n,e,r)}function st(t){return t instanceof it||(t=ot(t)),t?(t=t.rgb(),new lt(t.r,t.g,t.b,t.opacity)):new lt}function ct(t,n,e,r){return 1===arguments.length?st(t):new lt(t,n,e,null==r?1:r)}function lt(t,n,e,r){this.r=+t,this.g=+n,this.b=+e,this.opacity=+r}function ht(t,n,e,r){return r<=0?t=n=e=NaN:e<=0||e>=1?t=n=NaN:n<=0&&(t=NaN),new dt(t,n,e,r)}function ft(t){if(t instanceof dt)return new dt(t.h,t.s,t.l,t.opacity);if(t instanceof it||(t=ot(t)),!t)return new dt;if(t instanceof dt)return t;t=t.rgb();var n=t.r/255,e=t.g/255,r=t.b/255,i=Math.min(n,e,r),o=Math.max(n,e,r),u=NaN,a=o-i,s=(o+i)/2;return a?(u=n===o?(e-r)/a+6*(e<r):e===o?(r-n)/a+2:(n-e)/a+4,a/=s<.5?o+i:2-o-i,u*=60):a=s>0&&s<1?0:u,new dt(u,a,s,t.opacity)}function pt(t,n,e,r){return 1===arguments.length?ft(t):new dt(t,n,e,null==r?1:r)}function dt(t,n,e,r){this.h=+t,this.s=+n,this.l=+e,this.opacity=+r}function gt(t,n,e){return 255*(t<60?n+(e-n)*t/60:t<180?e:t<240?n+(e-n)*(240-t)/60:n)}function vt(t){if(t instanceof mt)return new mt(t.l,t.a,t.b,t.opacity);if(t instanceof Tt){var n=t.h*Xi;return new mt(t.l,Math.cos(n)*t.c,Math.sin(n)*t.c,t.opacity)}t instanceof lt||(t=st(t));var e=Mt(t.r),r=Mt(t.g),i=Mt(t.b),o=_t((.4124564*e+.3575761*r+.1804375*i)/ji),u=_t((.2126729*e+.7151522*r+.072175*i)/Vi),a=_t((.0193339*e+.119192*r+.9503041*i)/$i);return new mt(116*u-16,500*(o-u),200*(u-a),t.opacity)}function yt(t,n,e,r){return 1===arguments.length?vt(t):new mt(t,n,e,null==r?1:r)}function mt(t,n,e,r){this.l=+t,this.a=+n,this.b=+e,this.opacity=+r}function _t(t){return t>Wi?Math.pow(t,1/3):t/Zi+Ri}function wt(t){return t>Bi?t*t*t:Zi*(t-Ri)}function xt(t){return 255*(t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055)}function Mt(t){return(t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function bt(t){if(t instanceof Tt)return new Tt(t.h,t.c,t.l,t.opacity);t instanceof mt||(t=vt(t));var n=Math.atan2(t.b,t.a)*Ii;return new Tt(n<0?n+360:n,Math.sqrt(t.a*t.a+t.b*t.b),t.l,t.opacity)}function kt(t,n,e,r){return 1===arguments.length?bt(t):new Tt(t,n,e,null==r?1:r)}function Tt(t,n,e,r){this.h=+t,this.c=+n,this.l=+e,this.opacity=+r}function Nt(t){if(t instanceof Ct)return new Ct(t.h,t.s,t.l,t.opacity);t instanceof lt||(t=st(t));var n=t.r/255,e=t.g/255,r=t.b/255,i=(ro*r+no*n-eo*e)/(ro+no-eo),o=r-i,u=(to*(e-i)-Ki*o)/Qi,a=Math.sqrt(u*u+o*o)/(to*i*(1-i)),s=a?Math.atan2(u,o)*Ii-120:NaN;return new Ct(s<0?s+360:s,a,i,t.opacity)}function At(t,n,e,r){return 1===arguments.length?Nt(t):new Ct(t,n,e,null==r?1:r)}function Ct(t,n,e,r){this.h=+t,this.s=+n,this.l=+e,this.opacity=+r}function St(t,n){return function(e){return t+e*n}}function zt(t,n,e){return t=Math.pow(t,e),n=Math.pow(n,e)-t,e=1/e,function(r){return Math.pow(t+r*n,e)}}function Ut(t,n){var e=n-t;return e?St(t,e>180||e<-180?e-360*Math.round(e/360):e):so(isNaN(t)?n:t)}function Dt(t){return 1===(t=+t)?Et:function(n,e){return e-n?zt(n,e,t):so(isNaN(n)?e:n)}}function Et(t,n){var e=n-t;return e?St(t,e):so(isNaN(t)?n:t)}function Yt(t){return function(){return t}}function Ft(t){return function(n){return t(n)+""}}function Pt(t){return"none"===t?xo:(io||(io=document.createElement("DIV"),oo=document.documentElement,uo=document.defaultView),io.style.transform=t,t=uo.getComputedStyle(oo.appendChild(io),null).getPropertyValue("transform"),oo.removeChild(io),t=t.slice(7,-1).split(","),Mo(+t[0],+t[1],+t[2],+t[3],+t[4],+t[5]))}function Ht(t){return null==t?xo:(ao||(ao=document.createElementNS("http://www.w3.org/2000/svg","g")),ao.setAttribute("transform",t),(t=ao.transform.baseVal.consolidate())?(t=t.matrix,Mo(t.a,t.b,t.c,t.d,t.e,t.f)):xo)}function qt(t,n,e,r){function i(t){return t.length?t.pop()+" ":""}function o(t,r,i,o,u,a){if(t!==i||r!==o){var s=u.push("translate(",null,n,null,e);a.push({i:s-4,x:fo(t,i)},{i:s-2,x:fo(r,o)})}else(i||o)&&u.push("translate("+i+n+o+e)}function u(t,n,e,o){t!==n?(t-n>180?n+=360:n-t>180&&(t+=360),o.push({i:e.push(i(e)+"rotate(",null,r)-2,x:fo(t,n)})):n&&e.push(i(e)+"rotate("+n+r)}function a(t,n,e,o){t!==n?o.push({i:e.push(i(e)+"skewX(",null,r)-2,x:fo(t,n)}):n&&e.push(i(e)+"skewX("+n+r)}function s(t,n,e,r,o,u){if(t!==e||n!==r){var a=o.push(i(o)+"scale(",null,",",null,")");u.push({i:a-4,x:fo(t,e)},{i:a-2,x:fo(n,r)})}else 1===e&&1===r||o.push(i(o)+"scale("+e+","+r+")")}return function(n,e){var r=[],i=[];return n=t(n),e=t(e),o(n.translateX,n.translateY,e.translateX,e.translateY,r,i),u(n.rotate,e.rotate,r,i),a(n.skewX,e.skewX,r,i),s(n.scaleX,n.scaleY,e.scaleX,e.scaleY,r,i),n=e=null,function(t){for(var n,e=-1,o=i.length;++e<o;)r[(n=i[e]).i]=n.x(t);return r.join("")}}}function Lt(t){return((t=Math.exp(t))+1/t)/2}function Xt(t){return((t=Math.exp(t))-1/t)/2}function It(t){return((t=Math.exp(2*t))-1)/(t+1)}function Ot(t){return function n(e){function r(n,r){var i=t((n=At(n)).h,(r=At(r)).h),o=Et(n.s,r.s),u=Et(n.l,r.l),a=Et(n.opacity,r.opacity);return function(t){return n.h=i(t),n.s=o(t),n.l=u(Math.pow(t,e)),n.opacity=a(t),n+""}}return e=+e,r.gamma=n,r}(1)}function jt(){return qo||(Io(Vt),qo=Xo.now()+Lo)}function Vt(){qo=0}function $t(){this._call=this._time=this._next=null}function Rt(t,n,e){var r=new $t;return r.restart(t,n,e),r}function Bt(){jt(),++Eo;for(var t,n=zo;n;)(t=qo-n._time)>=0&&n._call.call(null,t),n=n._next;--Eo}function Zt(){qo=(Ho=Xo.now())+Lo,Eo=Yo=0;try{Bt()}finally{Eo=0,Gt(),qo=0}}function Wt(){var t=Xo.now(),n=t-Ho;n>Po&&(Lo-=n,Ho=t)}function Gt(){for(var t,n,e=zo,r=1/0;e;)e._call?(r>e._time&&(r=e._time),t=e,e=e._next):(n=e._next,e._next=null,e=t?t._next=n:zo=n);Uo=t,Jt(r)}function Jt(t){if(!Eo){Yo&&(Yo=clearTimeout(Yo));var n=t-qo;n>24?(t<1/0&&(Yo=setTimeout(Zt,n)),Fo&&(Fo=clearInterval(Fo))):(Fo||(Fo=setInterval(Wt,Po)),Eo=1,Io(Zt))}}function Kt(t,n){var e=t.__transition;if(!e||!(e=e[n])||e.state>$o)throw new Error("too late");return e}function Qt(t,n){var e=t.__transition;if(!e||!(e=e[n])||e.state>Bo)throw new Error("too late");return e}function tn(t,n){var e=t.__transition;if(!e||!(e=e[n]))throw new Error("too late");return e}function nn(t,n,e){function r(t){e.state=Ro,e.timer.restart(i,e.delay,e.time),e.delay<=t&&i(t-e.delay)}function i(r){var c,l,h,f;if(e.state!==Ro)return u();for(c in s)if(f=s[c],f.name===e.name){if(f.state===Zo)return Oo(i);f.state===Wo?(f.state=Jo,f.timer.stop(),f.on.call("interrupt",t,t.__data__,f.index,f.group),delete s[c]):+c<n&&(f.state=Jo,f.timer.stop(),delete s[c])}if(Oo(function(){e.state===Zo&&(e.state=Wo,e.timer.restart(o,e.delay,e.time),o(r))}),e.state=Bo,e.on.call("start",t,t.__data__,e.index,e.group),e.state===Bo){for(e.state=Zo,a=new Array(h=e.tween.length),c=0,l=-1;c<h;++c)(f=e.tween[c].value.call(t,t.__data__,e.index,e.group))&&(a[++l]=f);a.length=l+1}}function o(n){for(var r=n<e.duration?e.ease.call(null,n/e.duration):(e.timer.restart(u),e.state=Go,1),i=-1,o=a.length;++i<o;)a[i].call(null,r);e.state===Go&&(e.on.call("end",t,t.__data__,e.index,e.group),u())}function u(){e.state=Jo,e.timer.stop(),delete s[n];for(var r in s)return;delete t.__transition}var a,s=t.__transition;s[n]=e,e.timer=Rt(r,0,e.time)}function en(t,n){var e,r;return function(){var i=Qt(this,t),o=i.tween;if(o!==e){r=e=o;for(var u=0,a=r.length;u<a;++u)if(r[u].name===n){r=r.slice(),r.splice(u,1);break}}i.tween=r}}function rn(t,n,e){var r,i;if("function"!=typeof e)throw new Error;return function(){var o=Qt(this,t),u=o.tween;if(u!==r){i=(r=u).slice();for(var a={name:n,value:e},s=0,c=i.length;s<c;++s)if(i[s].name===n){i[s]=a;break}s===c&&i.push(a)}o.tween=i}}function on(t,n,e){var r=t._id;return t.each(function(){var t=Qt(this,r);(t.value||(t.value={}))[n]=e.apply(this,arguments)}),function(t){return tn(t,r).value[n]}}function un(t){return function(){this.removeAttribute(t)}}function an(t){return function(){this.removeAttributeNS(t.space,t.local)}}function sn(t,n,e){var r,i;return function(){var o=this.getAttribute(t);return o===e?null:o===r?i:i=n(r=o,e)}}function cn(t,n,e){var r,i;return function(){var o=this.getAttributeNS(t.space,t.local);return o===e?null:o===r?i:i=n(r=o,e)}}function ln(t,n,e){var r,i,o;return function(){var u,a=e(this);return null==a?void this.removeAttribute(t):(u=this.getAttribute(t),u===a?null:u===r&&a===i?o:o=n(r=u,i=a))}}function hn(t,n,e){var r,i,o;return function(){var u,a=e(this);return null==a?void this.removeAttributeNS(t.space,t.local):(u=this.getAttributeNS(t.space,t.local),u===a?null:u===r&&a===i?o:o=n(r=u,i=a))}}function fn(t,n){function e(){var e=this,r=n.apply(e,arguments);return r&&function(n){e.setAttributeNS(t.space,t.local,r(n))}}return e._value=n,e}function pn(t,n){function e(){var e=this,r=n.apply(e,arguments);return r&&function(n){e.setAttribute(t,r(n))}}return e._value=n,e}function dn(t,n){return function(){Kt(this,t).delay=+n.apply(this,arguments)}}function gn(t,n){return n=+n,function(){Kt(this,t).delay=n}}function vn(t,n){return function(){Qt(this,t).duration=+n.apply(this,arguments)}}function yn(t,n){return n=+n,function(){Qt(this,t).duration=n}}function mn(t,n){if("function"!=typeof n)throw new Error;return function(){Qt(this,t).ease=n}}function _n(t){return(t+"").trim().split(/^|\s+/).every(function(t){var n=t.indexOf(".");return n>=0&&(t=t.slice(0,n)),!t||"start"===t})}function wn(t,n,e){var r,i,o=_n(n)?Kt:Qt;return function(){var u=o(this,t),a=u.on;a!==r&&(i=(r=a).copy()).on(n,e),u.on=i}}function xn(t){return function(){var n=this.parentNode;for(var e in this.__transition)if(+e!==t)return;n&&n.removeChild(this)}}function Mn(t,n){var e,r,i;return function(){var o=oi(this).getComputedStyle(this,null),u=o.getPropertyValue(t),a=(this.style.removeProperty(t),o.getPropertyValue(t));return u===a?null:u===e&&a===r?i:i=n(e=u,r=a)}}function bn(t){return function(){this.style.removeProperty(t)}}function kn(t,n,e){var r,i;return function(){var o=oi(this).getComputedStyle(this,null).getPropertyValue(t);return o===e?null:o===r?i:i=n(r=o,e)}}function Tn(t,n,e){var r,i,o;return function(){var u=oi(this).getComputedStyle(this,null),a=u.getPropertyValue(t),s=e(this);return null==s&&(this.style.removeProperty(t),s=u.getPropertyValue(t)),a===s?null:a===r&&s===i?o:o=n(r=a,i=s)}}function Nn(t,n,e){function r(){var r=this,i=n.apply(r,arguments);return i&&function(n){r.style.setProperty(t,i(n),e)}}return r._value=n,r}function An(t){return function(){this.textContent=t}}function Cn(t){return function(){var n=t(this);this.textContent=null==n?"":n}}function Sn(t,n,e,r){this._groups=t,this._parents=n,this._name=e,this._id=r}function zn(t){return W().transition(t)}function Un(){return++wu}function Dn(t){return((t*=2)<=1?t*t*t:(t-=2)*t*t+2)/2}function En(t,n){for(var e;!(e=t.__transition)||!(e=e[n]);)if(!(t=t.parentNode))return Cu.time=jt(),Cu;return e}function Yn(t,n,e){this.target=t,this.type=n,this.transform=e}function Fn(t,n,e){this.k=t,this.x=n,this.y=e}function Pn(){t.event.stopImmediatePropagation()}function Hn(){return!t.event.button}function qn(){var t,n,e=this;return e instanceof SVGElement?(e=e.ownerSVGElement||e,t=e.width.baseVal.value,n=e.height.baseVal.value):(t=e.clientWidth,n=e.clientHeight),[[0,0],[t,n]]}function Ln(){return this.__zoom||Uu}function Xn(t){return function(n,e){return Yu(t(n),e)}}function In(t,n,e){var r=Math.abs(n-t)/Math.max(0,e),i=Math.pow(10,Math.floor(Math.log(r)/Math.LN10)),o=r/i;return o>=Xu?i*=10:o>=Iu?i*=5:o>=Ou&&(i*=2),n<t?-i:i}function On(){}function jn(t,n){var e=new On;if(t instanceof On)t.each(function(t,n){e.set(n,t)});else if(Array.isArray(t)){var r,i=-1,o=t.length;if(null==n)for(;++i<o;)e.set(i,t[i]);else for(;++i<o;)e.set(n(r=t[i],i,t),r)}else if(t)for(var u in t)e.set(u,t[u]);return e}function Vn(){}function $n(t,n){var e=new Vn;if(t instanceof Vn)t.each(function(t){e.add(t)});else if(t){var r=-1,i=t.length;if(null==n)for(;++r<i;)e.add(t[r]);else for(;++r<i;)e.add(n(t[r],r,t))}return e}function Rn(t,n){return(n-=t=+t)?function(e){return(e-t)/n}:Gu(n)}function Bn(t){return function(n,e){var r=t(n=+n,e=+e);return function(t){return t<=n?0:t>=e?1:r(t)}}}function Zn(t){return function(n,e){var r=t(n=+n,e=+e);return function(t){return t<=0?n:t>=1?e:r(t)}}}function Wn(t,n,e,r){var i=t[0],o=t[1],u=n[0],a=n[1];return o<i?(i=e(o,i),u=r(a,u)):(i=e(i,o),u=r(u,a)),function(t){return u(i(t))}}function Gn(t,n,e,r){var i=Math.min(t.length,n.length)-1,o=new Array(i),u=new Array(i),a=-1;for(t[i]<t[0]&&(t=t.slice().reverse(),n=n.slice().reverse());++a<i;)o[a]=e(t[a],t[a+1]),u[a]=r(n[a],n[a+1]);return function(n){var e=Hu(t,n,1,i)-1;return u[e](o[e](n))}}function Jn(t,n){return n.domain(t.domain()).range(t.range()).interpolate(t.interpolate()).clamp(t.clamp())}function Kn(t,n){function e(){return i=Math.min(a.length,s.length)>2?Gn:Wn,o=u=null,r}function r(n){return(o||(o=i(a,s,l?Bn(t):t,c)))(+n)}var i,o,u,a=Ku,s=Ku,c=mo,l=!1;return r.invert=function(t){return(u||(u=i(s,a,Rn,l?Zn(n):n)))(+t)},r.domain=function(t){return arguments.length?(a=Zu.call(t,Ju),e()):a.slice()},r.range=function(t){return arguments.length?(s=Wu.call(t),e()):s.slice()},r.rangeRound=function(t){return s=Wu.call(t),c=_o,e()},r.clamp=function(t){return arguments.length?(l=!!t,e()):l},r.interpolate=function(t){return arguments.length?(c=t,e()):c},e()}function Qn(t){if(!(n=ua.exec(t)))throw new Error("invalid format: "+t);var n,e=n[1]||" ",r=n[2]||">",i=n[3]||"-",o=n[4]||"",u=!!n[5],a=n[6]&&+n[6],s=!!n[7],c=n[8]&&+n[8].slice(1),l=n[9]||"";"n"===l?(s=!0,l="g"):oa[l]||(l=""),(u||"0"===e&&"="===r)&&(u=!0,e="0",r="="),this.fill=e,this.align=r,this.sign=i,this.symbol=o,this.zero=u,this.width=a,this.comma=s,this.precision=c,this.type=l}function te(t){return t}function ne(t){return sa=fa(t),ca=sa.format,la=sa.formatPrefix,sa}function ee(t){var n=t.domain;return t.ticks=function(t){var e=n();return ju(e[0],e[e.length-1],null==t?10:t)},t.tickFormat=function(t,e){return va(n(),t,e)},t.nice=function(e){var r=n(),i=r.length-1,o=null==e?10:e,u=r[0],a=r[i],s=In(u,a,o);return s&&(s=In(Math.floor(u/s)*s,Math.ceil(a/s)*s,o),r[0]=Math.floor(u/s)*s,r[i]=Math.ceil(a/s)*s,n(r)),t},t}function re(){var t=Kn(Rn,fo);return t.copy=function(){return Jn(t,re())},ee(t)}function ie(t,n,e,r){function i(n){return t(n=new Date(+n)),n}return i.floor=i,i.ceil=function(e){return t(e=new Date(e-1)),n(e,1),t(e),e},i.round=function(t){var n=i(t),e=i.ceil(t);return t-n<e-t?n:e},i.offset=function(t,e){return n(t=new Date(+t),null==e?1:Math.floor(e)),t},i.range=function(e,r,o){var u=[];if(e=i.ceil(e),o=null==o?1:Math.floor(o),!(e<r&&o>0))return u;do u.push(new Date(+e));while(n(e,o),t(e),e<r);return u},i.filter=function(e){return ie(function(n){if(n>=n)for(;t(n),!e(n);)n.setTime(n-1)},function(t,r){if(t>=t)for(;--r>=0;)for(;n(t,1),!e(t););})},e&&(i.count=function(n,r){return ya.setTime(+n),ma.setTime(+r),t(ya),t(ma),Math.floor(e(ya,ma))},i.every=function(t){return t=Math.floor(t),isFinite(t)&&t>0?t>1?i.filter(r?function(n){return r(n)%t===0}:function(n){return i.count(0,n)%t===0}):i:null}),i}function oe(t){return ie(function(n){n.setDate(n.getDate()-(n.getDay()+7-t)%7),n.setHours(0,0,0,0)},function(t,n){t.setDate(t.getDate()+7*n)},function(t,n){return(n-t-(n.getTimezoneOffset()-t.getTimezoneOffset())*xa)/ka})}function ue(t){return ie(function(n){n.setUTCDate(n.getUTCDate()-(n.getUTCDay()+7-t)%7),n.setUTCHours(0,0,0,0)},function(t,n){t.setUTCDate(t.getUTCDate()+7*n)},function(t,n){return(n-t)/ka})}function ae(t){if(0<=t.y&&t.y<100){var n=new Date(-1,t.m,t.d,t.H,t.M,t.S,t.L);return n.setFullYear(t.y),n}return new Date(t.y,t.m,t.d,t.H,t.M,t.S,t.L)}function se(t){if(0<=t.y&&t.y<100){var n=new Date(Date.UTC(-1,t.m,t.d,t.H,t.M,t.S,t.L));return n.setUTCFullYear(t.y),n}return new Date(Date.UTC(t.y,t.m,t.d,t.H,t.M,t.S,t.L))}function ce(t){return{y:t,m:0,d:1,H:0,M:0,S:0,L:0}}function le(t){function n(t,n){return function(e){var r,i,o,u=[],a=-1,s=0,c=t.length;for(e instanceof Date||(e=new Date(+e));++a<c;)37===t.charCodeAt(a)&&(u.push(t.slice(s,a)),null!=(i=qa[r=t.charAt(++a)])?r=t.charAt(++a):i="e"===r?" ":"0",(o=n[r])&&(r=o(e,i)),u.push(r),s=a+1);return u.push(t.slice(s,a)),u.join("")}}function e(t,n){return function(e){var i=ce(1900),o=r(i,t,e+="",0);if(o!=e.length)return null;if("p"in i&&(i.H=i.H%12+12*i.p),"W"in i||"U"in i){"w"in i||(i.w="W"in i?1:0);var u="Z"in i?se(ce(i.y)).getUTCDay():n(ce(i.y)).getDay();i.m=0,i.d="W"in i?(i.w+6)%7+7*i.W-(u+5)%7:i.w+7*i.U-(u+6)%7}return"Z"in i?(i.H+=i.Z/100|0,i.M+=i.Z%100,se(i)):n(i)}}function r(t,n,e,r){for(var i,o,u=0,a=n.length,s=e.length;u<a;){if(r>=s)return-1;if(i=n.charCodeAt(u++),37===i){if(i=n.charAt(u++),o=O[i in qa?n.charAt(u++):i],!o||(r=o(t,e,r))<0)return-1}else if(i!=e.charCodeAt(r++))return-1}return r}function i(t,n,e){var r=z.exec(n.slice(e));return r?(t.p=U[r[0].toLowerCase()],e+r[0].length):-1}function o(t,n,e){var r=Y.exec(n.slice(e));return r?(t.w=F[r[0].toLowerCase()],e+r[0].length):-1}function u(t,n,e){var r=D.exec(n.slice(e));return r?(t.w=E[r[0].toLowerCase()],e+r[0].length):-1}function a(t,n,e){var r=q.exec(n.slice(e));return r?(t.m=L[r[0].toLowerCase()],e+r[0].length):-1}function s(t,n,e){var r=P.exec(n.slice(e));return r?(t.m=H[r[0].toLowerCase()],e+r[0].length):-1}function c(t,n,e){return r(t,M,n,e)}function l(t,n,e){return r(t,b,n,e)}function h(t,n,e){return r(t,k,n,e)}function f(t){return A[t.getDay()]}function p(t){return N[t.getDay()]}function d(t){return S[t.getMonth()]}function g(t){return C[t.getMonth()]}function v(t){return T[+(t.getHours()>=12)]}function y(t){return A[t.getUTCDay()]}function m(t){return N[t.getUTCDay()]}function _(t){return S[t.getUTCMonth()]}function w(t){return C[t.getUTCMonth()]}function x(t){return T[+(t.getUTCHours()>=12)]}var M=t.dateTime,b=t.date,k=t.time,T=t.periods,N=t.days,A=t.shortDays,C=t.months,S=t.shortMonths,z=pe(T),U=de(T),D=pe(N),E=de(N),Y=pe(A),F=de(A),P=pe(C),H=de(C),q=pe(S),L=de(S),X={a:f,A:p,b:d,B:g,c:null,d:Se,e:Se,H:ze,I:Ue,j:De,L:Ee,m:Ye,M:Fe,p:v,S:Pe,U:He,w:qe,W:Le,x:null,X:null,y:Xe,Y:Ie,Z:Oe,"%":rr},I={a:y,A:m,b:_,B:w,c:null,d:je,e:je,H:Ve,I:$e,j:Re,L:Be,m:Ze,M:We,p:x,S:Ge,U:Je,w:Ke,W:Qe,x:null,X:null,y:tr,Y:nr,Z:er,"%":rr},O={a:o,A:u,b:a,B:s,c:c,d:Me,e:Me,H:ke,I:ke,j:be,L:Ae,m:xe,M:Te,p:i,S:Ne,U:ve,w:ge,W:ye,x:l,X:h,y:_e,Y:me,Z:we,"%":Ce};return X.x=n(b,X),X.X=n(k,X),X.c=n(M,X),I.x=n(b,I),I.X=n(k,I),I.c=n(M,I),{format:function(t){var e=n(t+="",X);return e.toString=function(){return t},e},parse:function(t){var n=e(t+="",ae);return n.toString=function(){return t},n},utcFormat:function(t){var e=n(t+="",I);return e.toString=function(){return t},e},utcParse:function(t){var n=e(t,se);return n.toString=function(){return t},n}}}function he(t,n,e){var r=t<0?"-":"",i=(r?-t:t)+"",o=i.length;return r+(o<e?new Array(e-o+1).join(n)+i:i)}function fe(t){return t.replace(Ia,"\\$&")}function pe(t){return new RegExp("^(?:"+t.map(fe).join("|")+")","i")}function de(t){for(var n={},e=-1,r=t.length;++e<r;)n[t[e].toLowerCase()]=e;return n}function ge(t,n,e){var r=La.exec(n.slice(e,e+1));return r?(t.w=+r[0],e+r[0].length):-1}function ve(t,n,e){var r=La.exec(n.slice(e));return r?(t.U=+r[0],e+r[0].length):-1}function ye(t,n,e){var r=La.exec(n.slice(e));return r?(t.W=+r[0],e+r[0].length):-1}function me(t,n,e){var r=La.exec(n.slice(e,e+4));return r?(t.y=+r[0],e+r[0].length):-1}function _e(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.y=+r[0]+(+r[0]>68?1900:2e3),e+r[0].length):-1}function we(t,n,e){var r=/^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(n.slice(e,e+6));return r?(t.Z=r[1]?0:-(r[2]+(r[3]||"00")),e+r[0].length):-1}function xe(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.m=r[0]-1,e+r[0].length):-1}function Me(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.d=+r[0],e+r[0].length):-1}function be(t,n,e){var r=La.exec(n.slice(e,e+3));return r?(t.m=0,t.d=+r[0],e+r[0].length):-1}function ke(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.H=+r[0],e+r[0].length):-1}function Te(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.M=+r[0],e+r[0].length):-1}function Ne(t,n,e){var r=La.exec(n.slice(e,e+2));return r?(t.S=+r[0],e+r[0].length):-1}function Ae(t,n,e){var r=La.exec(n.slice(e,e+3));return r?(t.L=+r[0],e+r[0].length):-1}function Ce(t,n,e){var r=Xa.exec(n.slice(e,e+1));return r?e+r[0].length:-1}function Se(t,n){return he(t.getDate(),n,2)}function ze(t,n){return he(t.getHours(),n,2)}function Ue(t,n){return he(t.getHours()%12||12,n,2)}function De(t,n){return he(1+Ta.count(Ca(t),t),n,3)}function Ee(t,n){return he(t.getMilliseconds(),n,3)}function Ye(t,n){return he(t.getMonth()+1,n,2)}function Fe(t,n){return he(t.getMinutes(),n,2)}function Pe(t,n){return he(t.getSeconds(),n,2)}function He(t,n){return he(Na.count(Ca(t),t),n,2)}function qe(t){return t.getDay()}function Le(t,n){return he(Aa.count(Ca(t),t),n,2)}function Xe(t,n){return he(t.getFullYear()%100,n,2)}function Ie(t,n){return he(t.getFullYear()%1e4,n,4)}function Oe(t){var n=t.getTimezoneOffset();return(n>0?"-":(n*=-1,"+"))+he(n/60|0,"0",2)+he(n%60,"0",2)}function je(t,n){return he(t.getUTCDate(),n,2)}function Ve(t,n){return he(t.getUTCHours(),n,2)}function $e(t,n){return he(t.getUTCHours()%12||12,n,2)}function Re(t,n){return he(1+Sa.count(Da(t),t),n,3)}function Be(t,n){return he(t.getUTCMilliseconds(),n,3)}function Ze(t,n){return he(t.getUTCMonth()+1,n,2)}function We(t,n){return he(t.getUTCMinutes(),n,2)}function Ge(t,n){return he(t.getUTCSeconds(),n,2)}function Je(t,n){return he(za.count(Da(t),t),n,2)}function Ke(t){return t.getUTCDay()}function Qe(t,n){return he(Ua.count(Da(t),t),n,2)}function tr(t,n){return he(t.getUTCFullYear()%100,n,2)}function nr(t,n){return he(t.getUTCFullYear()%1e4,n,4)}function er(){return"+0000"}function rr(){return"%"}function ir(t){return Ea=le(t),Ya=Ea.format,Fa=Ea.parse,Pa=Ea.utcFormat,Ha=Ea.utcParse,Ea}function or(t){return t.toISOString()}function ur(t){var n=new Date(t);return isNaN(n)?null:n}function ar(t,n,e){var r=t(e);return"translate("+(isFinite(r)?r:n(e))+",0)"}function sr(t,n,e){var r=t(e);return"translate(0,"+(isFinite(r)?r:n(e))+")"}function cr(t){var n=t.bandwidth()/2;return t.round()&&(n=Math.round(n)),function(e){return t(e)+n}}function lr(){return!this.__axis}function hr(t,n){function e(e){var c,l=null==i?n.ticks?n.ticks.apply(n,r):n.domain():i,h=null==o?n.tickFormat?n.tickFormat.apply(n,r):$a:o,f=Math.max(u,0)+s,p=t===Ra||t===Za?ar:sr,d=n.range(),g=d[0]+.5,v=d[d.length-1]+.5,y=(n.bandwidth?cr:$a)(n.copy()),m=e.selection?e.selection():e,_=m.selectAll(".domain").data([null]),w=m.selectAll(".tick").data(l,n).order(),x=w.exit(),M=w.enter().append("g").attr("class","tick"),b=w.select("line"),k=w.select("text"),T=t===Ra||t===Wa?-1:1,N=t===Wa||t===Ba?(c="x","y"):(c="y","x");_=_.merge(_.enter().insert("path",".tick").attr("class","domain").attr("stroke","#000")),w=w.merge(M),b=b.merge(M.append("line").attr("stroke","#000").attr(c+"2",T*u).attr(N+"1",.5).attr(N+"2",.5)),k=k.merge(M.append("text").attr("fill","#000").attr(c,T*f).attr(N,.5).attr("dy",t===Ra?"0em":t===Za?"0.71em":"0.32em")),e!==m&&(_=_.transition(e),w=w.transition(e),b=b.transition(e),k=k.transition(e),x=x.transition(e).attr("opacity",Ga).attr("transform",function(t){return p(y,this.parentNode.__axis||y,t)}),M.attr("opacity",Ga).attr("transform",function(t){return p(this.parentNode.__axis||y,y,t)})),x.remove(),_.attr("d",t===Wa||t==Ba?"M"+T*a+","+g+"H0.5V"+v+"H"+T*a:"M"+g+","+T*a+"V0.5H"+v+"V"+T*a),w.attr("opacity",1).attr("transform",function(t){return p(y,y,t)}),b.attr(c+"2",T*u),k.attr(c,T*f).text(h),m.filter(lr).attr("fill","none").attr("font-size",10).attr("font-family","sans-serif").attr("text-anchor",t===Ba?"start":t===Wa?"end":"middle"),m.each(function(){this.__axis=y})}var r=[],i=null,o=null,u=6,a=6,s=3;return e.scale=function(t){return arguments.length?(n=t,e):n},e.ticks=function(){return r=Va.call(arguments),e},e.tickArguments=function(t){return arguments.length?(r=null==t?[]:Va.call(t),e):r.slice()},e.tickValues=function(t){return arguments.length?(i=null==t?null:Va.call(t),e):i&&i.slice()},e.tickFormat=function(t){return arguments.length?(o=t,e):o},e.tickSize=function(t){return arguments.length?(u=a=+t,e):u},e.tickSizeInner=function(t){return arguments.length?(u=+t,e):u},e.tickSizeOuter=function(t){return arguments.length?(a=+t,e):a},e.tickPadding=function(t){return arguments.length?(s=+t,e):s},e}function fr(t){return hr(Ba,t)}function pr(t){return hr(Za,t)}function dr(t,n,e,r){if(isNaN(n)||isNaN(e))return t;var i,o,u,a,s,c,l,h,f,p=t._root,d={data:r},g=t._x0,v=t._y0,y=t._x1,m=t._y1;if(!p)return t._root=d,t;for(;p.length;)if((c=n>=(o=(g+y)/2))?g=o:y=o,(l=e>=(u=(v+m)/2))?v=u:m=u,i=p,!(p=p[h=l<<1|c]))return i[h]=d,t;if(a=+t._x.call(null,p.data),s=+t._y.call(null,p.data),n===a&&e===s)return d.next=p,i?i[h]=d:t._root=d,t;do i=i?i[h]=new Array(4):t._root=new Array(4),(c=n>=(o=(g+y)/2))?g=o:y=o,(l=e>=(u=(v+m)/2))?v=u:m=u;while((h=l<<1|c)===(f=(s>=u)<<1|a>=o));return i[f]=p,i[h]=d,t}function gr(t){var n,e,r,i,o=t.length,u=new Array(o),a=new Array(o),s=1/0,c=1/0,l=-(1/0),h=-(1/0);for(e=0;e<o;++e)isNaN(r=+this._x.call(null,n=t[e]))||isNaN(i=+this._y.call(null,n))||(u[e]=r,a[e]=i,r<s&&(s=r),r>l&&(l=r),i<c&&(c=i),i>h&&(h=i));for(l<s&&(s=this._x0,l=this._x1),h<c&&(c=this._y0,h=this._y1),this.cover(s,c).cover(l,h),e=0;e<o;++e)dr(this,u[e],a[e],t[e]);return this}function vr(t){for(var n=0,e=t.length;n<e;++n)this.remove(t[n]);return this}function yr(t){return t[0]}function mr(t){return t[1]}function _r(t,n,e){var r=new wr(null==n?yr:n,null==e?mr:e,NaN,NaN,NaN,NaN);return null==t?r:r.addAll(t)}function wr(t,n,e,r,i,o){this._x=t,this._y=n,this._x0=e,this._y0=r,this._x1=i,this._y1=o,this._root=void 0}function xr(t){for(var n={data:t.data},e=n;t=t.next;)e=e.next={data:t.data};return n;
	}function Mr(t){return t.index}function br(t,n){var e=t.get(n);if(!e)throw new Error("missing: "+n);return e}var kr="http://www.w3.org/1999/xhtml",Tr={svg:"http://www.w3.org/2000/svg",xhtml:kr,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"},Nr=function(t){var n=t+="",e=n.indexOf(":");return e>=0&&"xmlns"!==(n=t.slice(0,e))&&(t=t.slice(e+1)),Tr.hasOwnProperty(n)?{space:Tr[n],local:t}:t},Ar=function(t){var r=Nr(t);return(r.local?e:n)(r)},Cr=function(t){return function(){return this.matches(t)}};if("undefined"!=typeof document){var Sr=document.documentElement;if(!Sr.matches){var zr=Sr.webkitMatchesSelector||Sr.msMatchesSelector||Sr.mozMatchesSelector||Sr.oMatchesSelector;Cr=function(t){return function(){return zr.call(this,t)}}}}var Ur=Cr,Dr={};if(t.event=null,"undefined"!=typeof document){var Er=document.documentElement;"onmouseenter"in Er||(Dr={mouseenter:"mouseover",mouseleave:"mouseout"})}var Yr=function(t,n,e){var r,i,s=o(t+""),c=s.length;{if(!(arguments.length<2)){for(l=n?a:u,null==e&&(e=!1),r=0;r<c;++r)this.each(l(s[r],n,e));return this}var l=this.node().__on;if(l)for(var h,f=0,p=l.length;f<p;++f)for(r=0,h=l[f];r<c;++r)if((i=s[r]).type===h.type&&i.name===h.name)return h.value}},Fr=function(){for(var n,e=t.event;n=e.sourceEvent;)e=n;return e},Pr=function(t,n){var e=t.ownerSVGElement||t;if(e.createSVGPoint){var r=e.createSVGPoint();return r.x=n.clientX,r.y=n.clientY,r=r.matrixTransform(t.getScreenCTM().inverse()),[r.x,r.y]}var i=t.getBoundingClientRect();return[n.clientX-i.left-t.clientLeft,n.clientY-i.top-t.clientTop]},Hr=function(t){var n=Fr();return n.changedTouches&&(n=n.changedTouches[0]),Pr(t,n)},qr=function(t){return null==t?c:function(){return this.querySelector(t)}},Lr=function(t){"function"!=typeof t&&(t=qr(t));for(var n=this._groups,e=n.length,r=new Array(e),i=0;i<e;++i)for(var o,u,a=n[i],s=a.length,c=r[i]=new Array(s),l=0;l<s;++l)(o=a[l])&&(u=t.call(o,o.__data__,l,a))&&("__data__"in o&&(u.__data__=o.__data__),c[l]=u);return new Z(r,this._parents)},Xr=function(t){return null==t?l:function(){return this.querySelectorAll(t)}},Ir=function(t){"function"!=typeof t&&(t=Xr(t));for(var n=this._groups,e=n.length,r=[],i=[],o=0;o<e;++o)for(var u,a=n[o],s=a.length,c=0;c<s;++c)(u=a[c])&&(r.push(t.call(u,u.__data__,c,a)),i.push(u));return new Z(r,i)},Or=function(t){"function"!=typeof t&&(t=Ur(t));for(var n=this._groups,e=n.length,r=new Array(e),i=0;i<e;++i)for(var o,u=n[i],a=u.length,s=r[i]=[],c=0;c<a;++c)(o=u[c])&&t.call(o,o.__data__,c,u)&&s.push(o);return new Z(r,this._parents)},jr=function(t){return new Array(t.length)},Vr=function(){return new Z(this._enter||this._groups.map(jr),this._parents)};h.prototype={constructor:h,appendChild:function(t){return this._parent.insertBefore(t,this._next)},insertBefore:function(t,n){return this._parent.insertBefore(t,n)},querySelector:function(t){return this._parent.querySelector(t)},querySelectorAll:function(t){return this._parent.querySelectorAll(t)}};var $r=function(t){return function(){return t}},Rr="$",Br=function(t,n){if(!t)return g=new Array(this.size()),c=-1,this.each(function(t){g[++c]=t}),g;var e=n?p:f,r=this._parents,i=this._groups;"function"!=typeof t&&(t=$r(t));for(var o=i.length,u=new Array(o),a=new Array(o),s=new Array(o),c=0;c<o;++c){var l=r[c],h=i[c],d=h.length,g=t.call(l,l&&l.__data__,c,r),v=g.length,y=a[c]=new Array(v),m=u[c]=new Array(v),_=s[c]=new Array(d);e(l,h,y,m,_,g,n);for(var w,x,M=0,b=0;M<v;++M)if(w=y[M]){for(M>=b&&(b=M+1);!(x=m[b])&&++b<v;);w._next=x||null}}return u=new Z(u,r),u._enter=a,u._exit=s,u},Zr=function(){return new Z(this._exit||this._groups.map(jr),this._parents)},Wr=function(t){for(var n=this._groups,e=t._groups,r=n.length,i=e.length,o=Math.min(r,i),u=new Array(r),a=0;a<o;++a)for(var s,c=n[a],l=e[a],h=c.length,f=u[a]=new Array(h),p=0;p<h;++p)(s=c[p]||l[p])&&(f[p]=s);for(;a<r;++a)u[a]=n[a];return new Z(u,this._parents)},Gr=function(){for(var t=this._groups,n=-1,e=t.length;++n<e;)for(var r,i=t[n],o=i.length-1,u=i[o];--o>=0;)(r=i[o])&&(u&&u!==r.nextSibling&&u.parentNode.insertBefore(r,u),u=r);return this},Jr=function(t){function n(n,e){return n&&e?t(n.__data__,e.__data__):!n-!e}t||(t=d);for(var e=this._groups,r=e.length,i=new Array(r),o=0;o<r;++o){for(var u,a=e[o],s=a.length,c=i[o]=new Array(s),l=0;l<s;++l)(u=a[l])&&(c[l]=u);c.sort(n)}return new Z(i,this._parents).order()},Kr=function(){var t=arguments[0];return arguments[0]=this,t.apply(null,arguments),this},Qr=function(){var t=new Array(this.size()),n=-1;return this.each(function(){t[++n]=this}),t},ti=function(){for(var t=this._groups,n=0,e=t.length;n<e;++n)for(var r=t[n],i=0,o=r.length;i<o;++i){var u=r[i];if(u)return u}return null},ni=function(){var t=0;return this.each(function(){++t}),t},ei=function(){return!this.node()},ri=function(t){for(var n=this._groups,e=0,r=n.length;e<r;++e)for(var i,o=n[e],u=0,a=o.length;u<a;++u)(i=o[u])&&t.call(i,i.__data__,u,o);return this},ii=function(t,n){var e=Nr(t);if(arguments.length<2){var r=this.node();return e.local?r.getAttributeNS(e.space,e.local):r.getAttribute(e)}return this.each((null==n?e.local?v:g:"function"==typeof n?e.local?w:_:e.local?m:y)(e,n))},oi=function(t){return t.ownerDocument&&t.ownerDocument.defaultView||t.document&&t||t.defaultView},ui=function(t,n,e){var r;return arguments.length>1?this.each((null==n?x:"function"==typeof n?b:M)(t,n,null==e?"":e)):oi(r=this.node()).getComputedStyle(r,null).getPropertyValue(t)},ai=function(t,n){return arguments.length>1?this.each((null==n?k:"function"==typeof n?N:T)(t,n)):this.node()[t]};S.prototype={add:function(t){var n=this._names.indexOf(t);n<0&&(this._names.push(t),this._node.setAttribute("class",this._names.join(" ")))},remove:function(t){var n=this._names.indexOf(t);n>=0&&(this._names.splice(n,1),this._node.setAttribute("class",this._names.join(" ")))},contains:function(t){return this._names.indexOf(t)>=0}};var si=function(t,n){var e=A(t+"");if(arguments.length<2){for(var r=C(this.node()),i=-1,o=e.length;++i<o;)if(!r.contains(e[i]))return!1;return!0}return this.each(("function"==typeof n?Y:n?D:E)(e,n))},ci=function(t){return arguments.length?this.each(null==t?F:("function"==typeof t?H:P)(t)):this.node().textContent},li=function(t){return arguments.length?this.each(null==t?q:("function"==typeof t?X:L)(t)):this.node().innerHTML},hi=function(){return this.each(I)},fi=function(){return this.each(O)},pi=function(t){var n="function"==typeof t?t:Ar(t);return this.select(function(){return this.appendChild(n.apply(this,arguments))})},di=function(t,n){var e="function"==typeof t?t:Ar(t),r=null==n?j:"function"==typeof n?n:qr(n);return this.select(function(){return this.insertBefore(e.apply(this,arguments),r.apply(this,arguments)||null)})},gi=function(){return this.each(V)},vi=function(t){return arguments.length?this.property("__data__",t):this.node().__data__},yi=function(t,n){return this.each(("function"==typeof n?B:R)(t,n))},mi=[null];Z.prototype=W.prototype={constructor:Z,select:Lr,selectAll:Ir,filter:Or,data:Br,enter:Vr,exit:Zr,merge:Wr,order:Gr,sort:Jr,call:Kr,nodes:Qr,node:ti,size:ni,empty:ei,each:ri,attr:ii,style:ui,property:ai,classed:si,text:ci,html:li,raise:hi,lower:fi,append:pi,insert:di,remove:gi,datum:vi,on:Yr,dispatch:yi};var _i=function(t){return"string"==typeof t?new Z([[document.querySelector(t)]],[document.documentElement]):new Z([[t]],mi)},wi=function(t){return"string"==typeof t?new Z([document.querySelectorAll(t)],[document.documentElement]):new Z([null==t?[]:t],mi)},xi=function(t,n,e){arguments.length<3&&(e=n,n=Fr().changedTouches);for(var r,i=0,o=n?n.length:0;i<o;++i)if((r=n[i]).identifier===e)return Pr(t,r);return null},Mi={value:function(){}};J.prototype=G.prototype={constructor:J,on:function(t,n){var e,r=this._,i=K(t+"",r),o=-1,u=i.length;{if(!(arguments.length<2)){if(null!=n&&"function"!=typeof n)throw new Error("invalid callback: "+n);for(;++o<u;)if(e=(t=i[o]).type)r[e]=tt(r[e],t.name,n);else if(null==n)for(e in r)r[e]=tt(r[e],t.name,null);return this}for(;++o<u;)if((e=(t=i[o]).type)&&(e=Q(r[e],t.name)))return e}},copy:function(){var t={},n=this._;for(var e in n)t[e]=n[e].slice();return new J(t)},call:function(t,n){if((e=arguments.length-2)>0)for(var e,r,i=new Array(e),o=0;o<e;++o)i[o]=arguments[o+2];if(!this._.hasOwnProperty(t))throw new Error("unknown type: "+t);for(r=this._[t],o=0,e=r.length;o<e;++o)r[o].value.apply(n,i)},apply:function(t,n,e){if(!this._.hasOwnProperty(t))throw new Error("unknown type: "+t);for(var r=this._[t],i=0,o=r.length;i<o;++i)r[i].value.apply(n,e)}};var bi=function(){t.event.preventDefault(),t.event.stopImmediatePropagation()},ki=function(t){var n=t.document.documentElement,e=_i(t).on("dragstart.drag",bi,!0);"onselectstart"in n?e.on("selectstart.drag",bi,!0):(n.__noselect=n.style.MozUserSelect,n.style.MozUserSelect="none")};et.prototype.on=function(){var t=this._.on.apply(this._,arguments);return t===this._?this:t};var Ti=function(t,n,e){t.prototype=n.prototype=e,e.constructor=t},Ni=.7,Ai=1/Ni,Ci="\\s*([+-]?\\d+)\\s*",Si="\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",zi="\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",Ui=/^#([0-9a-f]{3})$/,Di=/^#([0-9a-f]{6})$/,Ei=new RegExp("^rgb\\("+[Ci,Ci,Ci]+"\\)$"),Yi=new RegExp("^rgb\\("+[zi,zi,zi]+"\\)$"),Fi=new RegExp("^rgba\\("+[Ci,Ci,Ci,Si]+"\\)$"),Pi=new RegExp("^rgba\\("+[zi,zi,zi,Si]+"\\)$"),Hi=new RegExp("^hsl\\("+[Si,zi,zi]+"\\)$"),qi=new RegExp("^hsla\\("+[Si,zi,zi,Si]+"\\)$"),Li={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};Ti(it,ot,{displayable:function(){return this.rgb().displayable()},toString:function(){return this.rgb()+""}}),Ti(lt,ct,rt(it,{brighter:function(t){return t=null==t?Ai:Math.pow(Ai,t),new lt(this.r*t,this.g*t,this.b*t,this.opacity)},darker:function(t){return t=null==t?Ni:Math.pow(Ni,t),new lt(this.r*t,this.g*t,this.b*t,this.opacity)},rgb:function(){return this},displayable:function(){return 0<=this.r&&this.r<=255&&0<=this.g&&this.g<=255&&0<=this.b&&this.b<=255&&0<=this.opacity&&this.opacity<=1},toString:function(){var t=this.opacity;return t=isNaN(t)?1:Math.max(0,Math.min(1,t)),(1===t?"rgb(":"rgba(")+Math.max(0,Math.min(255,Math.round(this.r)||0))+", "+Math.max(0,Math.min(255,Math.round(this.g)||0))+", "+Math.max(0,Math.min(255,Math.round(this.b)||0))+(1===t?")":", "+t+")")}})),Ti(dt,pt,rt(it,{brighter:function(t){return t=null==t?Ai:Math.pow(Ai,t),new dt(this.h,this.s,this.l*t,this.opacity)},darker:function(t){return t=null==t?Ni:Math.pow(Ni,t),new dt(this.h,this.s,this.l*t,this.opacity)},rgb:function(){var t=this.h%360+360*(this.h<0),n=isNaN(t)||isNaN(this.s)?0:this.s,e=this.l,r=e+(e<.5?e:1-e)*n,i=2*e-r;return new lt(gt(t>=240?t-240:t+120,i,r),gt(t,i,r),gt(t<120?t+240:t-120,i,r),this.opacity)},displayable:function(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1}}));var Xi=Math.PI/180,Ii=180/Math.PI,Oi=18,ji=.95047,Vi=1,$i=1.08883,Ri=4/29,Bi=6/29,Zi=3*Bi*Bi,Wi=Bi*Bi*Bi;Ti(mt,yt,rt(it,{brighter:function(t){return new mt(this.l+Oi*(null==t?1:t),this.a,this.b,this.opacity)},darker:function(t){return new mt(this.l-Oi*(null==t?1:t),this.a,this.b,this.opacity)},rgb:function(){var t=(this.l+16)/116,n=isNaN(this.a)?t:t+this.a/500,e=isNaN(this.b)?t:t-this.b/200;return t=Vi*wt(t),n=ji*wt(n),e=$i*wt(e),new lt(xt(3.2404542*n-1.5371385*t-.4985314*e),xt(-.969266*n+1.8760108*t+.041556*e),xt(.0556434*n-.2040259*t+1.0572252*e),this.opacity)}})),Ti(Tt,kt,rt(it,{brighter:function(t){return new Tt(this.h,this.c,this.l+Oi*(null==t?1:t),this.opacity)},darker:function(t){return new Tt(this.h,this.c,this.l-Oi*(null==t?1:t),this.opacity)},rgb:function(){return vt(this).rgb()}}));var Gi=-.14861,Ji=1.78277,Ki=-.29227,Qi=-.90649,to=1.97294,no=to*Qi,eo=to*Ji,ro=Ji*Ki-Qi*Gi;Ti(Ct,At,rt(it,{brighter:function(t){return t=null==t?Ai:Math.pow(Ai,t),new Ct(this.h,this.s,this.l*t,this.opacity)},darker:function(t){return t=null==t?Ni:Math.pow(Ni,t),new Ct(this.h,this.s,this.l*t,this.opacity)},rgb:function(){var t=isNaN(this.h)?0:(this.h+120)*Xi,n=+this.l,e=isNaN(this.s)?0:this.s*n*(1-n),r=Math.cos(t),i=Math.sin(t);return new lt(255*(n+e*(Gi*r+Ji*i)),255*(n+e*(Ki*r+Qi*i)),255*(n+e*(to*r)),this.opacity)}}));var io,oo,uo,ao,so=function(t){return function(){return t}},co=function t(n){function e(t,n){var e=r((t=ct(t)).r,(n=ct(n)).r),i=r(t.g,n.g),o=r(t.b,n.b),u=r(t.opacity,n.opacity);return function(n){return t.r=e(n),t.g=i(n),t.b=o(n),t.opacity=u(n),t+""}}var r=Dt(n);return e.gamma=t,e}(1),lo=function(t,n){var e,r=n?n.length:0,i=t?Math.min(r,t.length):0,o=new Array(r),u=new Array(r);for(e=0;e<i;++e)o[e]=mo(t[e],n[e]);for(;e<r;++e)u[e]=n[e];return function(t){for(e=0;e<i;++e)u[e]=o[e](t);return u}},ho=function(t,n){var e=new Date;return t=+t,n-=t,function(r){return e.setTime(t+n*r),e}},fo=function(t,n){return t=+t,n-=t,function(e){return t+n*e}},po=function(t,n){var e,r={},i={};null!==t&&"object"==typeof t||(t={}),null!==n&&"object"==typeof n||(n={});for(e in n)e in t?r[e]=mo(t[e],n[e]):i[e]=n[e];return function(t){for(e in r)i[e]=r[e](t);return i}},go=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,vo=new RegExp(go.source,"g"),yo=function(t,n){var e,r,i,o=go.lastIndex=vo.lastIndex=0,u=-1,a=[],s=[];for(t+="",n+="";(e=go.exec(t))&&(r=vo.exec(n));)(i=r.index)>o&&(i=n.slice(o,i),a[u]?a[u]+=i:a[++u]=i),(e=e[0])===(r=r[0])?a[u]?a[u]+=r:a[++u]=r:(a[++u]=null,s.push({i:u,x:fo(e,r)})),o=vo.lastIndex;return o<n.length&&(i=n.slice(o),a[u]?a[u]+=i:a[++u]=i),a.length<2?s[0]?Ft(s[0].x):Yt(n):(n=s.length,function(t){for(var e,r=0;r<n;++r)a[(e=s[r]).i]=e.x(t);return a.join("")})},mo=function(t,n){var e,r=typeof n;return null==n||"boolean"===r?so(n):("number"===r?fo:"string"===r?(e=ot(n))?(n=e,co):yo:n instanceof ot?co:n instanceof Date?ho:Array.isArray(n)?lo:isNaN(n)?po:fo)(t,n)},_o=function(t,n){return t=+t,n-=t,function(e){return Math.round(t+n*e)}},wo=180/Math.PI,xo={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1},Mo=function(t,n,e,r,i,o){var u,a,s;return(u=Math.sqrt(t*t+n*n))&&(t/=u,n/=u),(s=t*e+n*r)&&(e-=t*s,r-=n*s),(a=Math.sqrt(e*e+r*r))&&(e/=a,r/=a,s/=a),t*r<n*e&&(t=-t,n=-n,s=-s,u=-u),{translateX:i,translateY:o,rotate:Math.atan2(n,t)*wo,skewX:Math.atan(s)*wo,scaleX:u,scaleY:a}},bo=qt(Pt,"px, ","px)","deg)"),ko=qt(Ht,", ",")",")"),To=Math.SQRT2,No=2,Ao=4,Co=1e-12,So=function(t,n){var e,r,i=t[0],o=t[1],u=t[2],a=n[0],s=n[1],c=n[2],l=a-i,h=s-o,f=l*l+h*h;if(f<Co)r=Math.log(c/u)/To,e=function(t){return[i+t*l,o+t*h,u*Math.exp(To*t*r)]};else{var p=Math.sqrt(f),d=(c*c-u*u+Ao*f)/(2*u*No*p),g=(c*c-u*u-Ao*f)/(2*c*No*p),v=Math.log(Math.sqrt(d*d+1)-d),y=Math.log(Math.sqrt(g*g+1)-g);r=(y-v)/To,e=function(t){var n=t*r,e=Lt(v),a=u/(No*p)*(e*It(To*n+v)-Xt(v));return[i+a*l,o+a*h,u*e/Lt(To*n+v)]}}return e.duration=1e3*r,e};Ot(Ut);var zo,Uo,Do=Ot(Et),Eo=0,Yo=0,Fo=0,Po=1e3,Ho=0,qo=0,Lo=0,Xo="object"==typeof performance&&performance.now?performance:Date,Io="function"==typeof requestAnimationFrame?requestAnimationFrame:function(t){setTimeout(t,17)};$t.prototype=Rt.prototype={constructor:$t,restart:function(t,n,e){if("function"!=typeof t)throw new TypeError("callback is not a function");e=(null==e?jt():+e)+(null==n?0:+n),this._next||Uo===this||(Uo?Uo._next=this:zo=this,Uo=this),this._call=t,this._time=e,Jt()},stop:function(){this._call&&(this._call=null,this._time=1/0,Jt())}};var Oo=function(t,n,e){var r=new $t;return n=null==n?0:+n,r.restart(function(e){r.stop(),t(e+n)},n,e),r},jo=G("start","end","interrupt"),Vo=[],$o=0,Ro=1,Bo=2,Zo=3,Wo=4,Go=5,Jo=6,Ko=function(t,n,e,r,i,o){var u=t.__transition;if(u){if(e in u)return}else t.__transition={};nn(t,e,{name:n,index:r,group:i,on:jo,tween:Vo,time:o.time,delay:o.delay,duration:o.duration,ease:o.ease,timer:null,state:$o})},Qo=function(t,n){var e,r,i,o=t.__transition,u=!0;if(o){n=null==n?null:n+"";for(i in o)(e=o[i]).name===n?(r=e.state>Bo&&e.state<Go,e.state=Jo,e.timer.stop(),r&&e.on.call("interrupt",t,t.__data__,e.index,e.group),delete o[i]):u=!1;u&&delete t.__transition}},tu=function(t){return this.each(function(){Qo(this,t)})},nu=function(t,n){var e=this._id;if(t+="",arguments.length<2){for(var r,i=tn(this.node(),e).tween,o=0,u=i.length;o<u;++o)if((r=i[o]).name===t)return r.value;return null}return this.each((null==n?en:rn)(e,t,n))},eu=function(t,n){var e;return("number"==typeof n?fo:n instanceof ot?co:(e=ot(n))?(n=e,co):yo)(t,n)},ru=function(t,n){var e=Nr(t),r="transform"===e?ko:eu;return this.attrTween(t,"function"==typeof n?(e.local?hn:ln)(e,r,on(this,"attr."+t,n)):null==n?(e.local?an:un)(e):(e.local?cn:sn)(e,r,n))},iu=function(t,n){var e="attr."+t;if(arguments.length<2)return(e=this.tween(e))&&e._value;if(null==n)return this.tween(e,null);if("function"!=typeof n)throw new Error;var r=Nr(t);return this.tween(e,(r.local?fn:pn)(r,n))},ou=function(t){var n=this._id;return arguments.length?this.each(("function"==typeof t?dn:gn)(n,t)):tn(this.node(),n).delay},uu=function(t){var n=this._id;return arguments.length?this.each(("function"==typeof t?vn:yn)(n,t)):tn(this.node(),n).duration},au=function(t){var n=this._id;return arguments.length?this.each(mn(n,t)):tn(this.node(),n).ease},su=function(t){"function"!=typeof t&&(t=Ur(t));for(var n=this._groups,e=n.length,r=new Array(e),i=0;i<e;++i)for(var o,u=n[i],a=u.length,s=r[i]=[],c=0;c<a;++c)(o=u[c])&&t.call(o,o.__data__,c,u)&&s.push(o);return new Sn(r,this._parents,this._name,this._id)},cu=function(t){if(t._id!==this._id)throw new Error;for(var n=this._groups,e=t._groups,r=n.length,i=e.length,o=Math.min(r,i),u=new Array(r),a=0;a<o;++a)for(var s,c=n[a],l=e[a],h=c.length,f=u[a]=new Array(h),p=0;p<h;++p)(s=c[p]||l[p])&&(f[p]=s);for(;a<r;++a)u[a]=n[a];return new Sn(u,this._parents,this._name,this._id)},lu=function(t,n){var e=this._id;return arguments.length<2?tn(this.node(),e).on.on(t):this.each(wn(e,t,n))},hu=function(){return this.on("end.remove",xn(this._id))},fu=function(t){var n=this._name,e=this._id;"function"!=typeof t&&(t=qr(t));for(var r=this._groups,i=r.length,o=new Array(i),u=0;u<i;++u)for(var a,s,c=r[u],l=c.length,h=o[u]=new Array(l),f=0;f<l;++f)(a=c[f])&&(s=t.call(a,a.__data__,f,c))&&("__data__"in a&&(s.__data__=a.__data__),h[f]=s,Ko(h[f],n,e,f,h,tn(a,e)));return new Sn(o,this._parents,n,e)},pu=function(t){var n=this._name,e=this._id;"function"!=typeof t&&(t=Xr(t));for(var r=this._groups,i=r.length,o=[],u=[],a=0;a<i;++a)for(var s,c=r[a],l=c.length,h=0;h<l;++h)if(s=c[h]){for(var f,p=t.call(s,s.__data__,h,c),d=tn(s,e),g=0,v=p.length;g<v;++g)(f=p[g])&&Ko(f,n,e,g,p,d);o.push(p),u.push(s)}return new Sn(o,u,n,e)},du=W.prototype.constructor,gu=function(){return new du(this._groups,this._parents)},vu=function(t,n,e){var r="transform"==(t+="")?bo:eu;return null==n?this.styleTween(t,Mn(t,r)).on("end.style."+t,bn(t)):this.styleTween(t,"function"==typeof n?Tn(t,r,on(this,"style."+t,n)):kn(t,r,n),e)},yu=function(t,n,e){var r="style."+(t+="");if(arguments.length<2)return(r=this.tween(r))&&r._value;if(null==n)return this.tween(r,null);if("function"!=typeof n)throw new Error;return this.tween(r,Nn(t,n,null==e?"":e))},mu=function(t){return this.tween("text","function"==typeof t?Cn(on(this,"text",t)):An(null==t?"":t+""))},_u=function(){for(var t=this._name,n=this._id,e=Un(),r=this._groups,i=r.length,o=0;o<i;++o)for(var u,a=r[o],s=a.length,c=0;c<s;++c)if(u=a[c]){var l=tn(u,n);Ko(u,t,e,c,a,{time:l.time+l.delay+l.duration,delay:0,duration:l.duration,ease:l.ease})}return new Sn(r,this._parents,t,e)},wu=0,xu=W.prototype;Sn.prototype=zn.prototype={constructor:Sn,select:fu,selectAll:pu,filter:su,merge:cu,selection:gu,transition:_u,call:xu.call,nodes:xu.nodes,node:xu.node,size:xu.size,empty:xu.empty,each:xu.each,on:lu,attr:ru,attrTween:iu,style:vu,styleTween:yu,text:mu,remove:hu,tween:nu,delay:ou,duration:uu,ease:au};var Mu=3,bu=(function t(n){function e(t){return Math.pow(t,n)}return n=+n,e.exponent=t,e}(Mu),function t(n){function e(t){return 1-Math.pow(1-t,n)}return n=+n,e.exponent=t,e}(Mu),function t(n){function e(t){return((t*=2)<=1?Math.pow(t,n):2-Math.pow(2-t,n))/2}return n=+n,e.exponent=t,e}(Mu),4/11),ku=1.70158,Tu=(function t(n){function e(t){return t*t*((n+1)*t-n)}return n=+n,e.overshoot=t,e}(ku),function t(n){function e(t){return--t*t*((n+1)*t+n)+1}return n=+n,e.overshoot=t,e}(ku),function t(n){function e(t){return((t*=2)<1?t*t*((n+1)*t-n):(t-=2)*t*((n+1)*t+n)+2)/2}return n=+n,e.overshoot=t,e}(ku),2*Math.PI),Nu=1,Au=.3,Cu=(function t(n,e){function r(t){return n*Math.pow(2,10*--t)*Math.sin((i-t)/e)}var i=Math.asin(1/(n=Math.max(1,n)))*(e/=Tu);return r.amplitude=function(n){return t(n,e*Tu)},r.period=function(e){return t(n,e)},r}(Nu,Au),function t(n,e){function r(t){return 1-n*Math.pow(2,-10*(t=+t))*Math.sin((t+i)/e)}var i=Math.asin(1/(n=Math.max(1,n)))*(e/=Tu);return r.amplitude=function(n){return t(n,e*Tu)},r.period=function(e){return t(n,e)},r}(Nu,Au),function t(n,e){function r(t){return((t=2*t-1)<0?n*Math.pow(2,10*t)*Math.sin((i-t)/e):2-n*Math.pow(2,-10*t)*Math.sin((i+t)/e))/2}var i=Math.asin(1/(n=Math.max(1,n)))*(e/=Tu);return r.amplitude=function(n){return t(n,e*Tu)},r.period=function(e){return t(n,e)},r}(Nu,Au),{time:null,delay:0,duration:250,ease:Dn}),Su=function(t){var n,e;t instanceof Sn?(n=t._id,t=t._name):(n=Un(),(e=Cu).time=jt(),t=null==t?null:t+"");for(var r=this._groups,i=r.length,o=0;o<i;++o)for(var u,a=r[o],s=a.length,c=0;c<s;++c)(u=a[c])&&Ko(u,t,n,c,a,e||En(u,n));return new Sn(r,this._parents,t,n)};W.prototype.interrupt=tu,W.prototype.transition=Su;var zu=function(t){return function(){return t}};Fn.prototype={constructor:Fn,scale:function(t){return 1===t?this:new Fn(this.k*t,this.x,this.y)},translate:function(t,n){return 0===t&0===n?this:new Fn(this.k,this.x+this.k*t,this.y+this.k*n)},apply:function(t){return[t[0]*this.k+this.x,t[1]*this.k+this.y]},applyX:function(t){return t*this.k+this.x},applyY:function(t){return t*this.k+this.y},invert:function(t){return[(t[0]-this.x)/this.k,(t[1]-this.y)/this.k]},invertX:function(t){return(t-this.x)/this.k},invertY:function(t){return(t-this.y)/this.k},rescaleX:function(t){return t.copy().domain(t.range().map(this.invertX,this).map(t.invert,t))},rescaleY:function(t){return t.copy().domain(t.range().map(this.invertY,this).map(t.invert,t))},toString:function(){return"translate("+this.x+","+this.y+") scale("+this.k+")"}};var Uu=new Fn(1,0,0),Du=function(){t.event.preventDefault(),t.event.stopImmediatePropagation()},Eu=function(){function n(t){t.on("wheel.zoom",l).on("mousedown.zoom",h).on("dblclick.zoom",f).on("touchstart.zoom",p).on("touchmove.zoom",d).on("touchend.zoom touchcancel.zoom",g).style("-webkit-tap-highlight-color","rgba(0,0,0,0)").property("__zoom",Ln)}function e(t,n){return n=Math.max(w,Math.min(x,n)),n===t.k?t:new Fn(n,t.x,t.y)}function r(t,n,e){var r=n[0]-e[0]*t.k,i=n[1]-e[1]*t.k;return r===t.x&&i===t.y?t:new Fn(t.k,r,i)}function i(t,n){var e=t.invertX(n[0][0])-M,r=t.invertX(n[1][0])-b,i=t.invertY(n[0][1])-k,o=t.invertY(n[1][1])-T;return t.translate(r>e?(e+r)/2:Math.min(0,e)||Math.max(0,r),o>i?(i+o)/2:Math.min(0,i)||Math.max(0,o))}function o(t){return[(+t[0][0]+ +t[1][0])/2,(+t[0][1]+ +t[1][1])/2]}function u(t,n,e){t.on("start.zoom",function(){a(this,arguments).start()}).on("interrupt.zoom end.zoom",function(){a(this,arguments).end()}).tween("zoom",function(){var t=this,r=arguments,i=a(t,r),u=_.apply(t,r),s=e||o(u),c=Math.max(u[1][0]-u[0][0],u[1][1]-u[0][1]),l=t.__zoom,h="function"==typeof n?n.apply(t,r):n,f=A(l.invert(s).concat(c/l.k),h.invert(s).concat(c/h.k));return function(t){if(1===t)t=h;else{var n=f(t),e=c/n[2];t=new Fn(e,s[0]-n[0]*e,s[1]-n[1]*e)}i.zoom(null,t)}})}function a(t,n){for(var e,r=0,i=C.length;r<i;++r)if((e=C[r]).that===t)return e;return new c(t,n)}function c(t,n){this.that=t,this.args=n,this.index=-1,this.active=0,this.extent=_.apply(t,n)}function l(){function n(){o.wheel=null,o.end()}if(m.apply(this,arguments)){var o=a(this,arguments),u=this.__zoom,s=Math.max(w,Math.min(x,u.k*Math.pow(2,-t.event.deltaY*(t.event.deltaMode?120:1)/500))),c=Hr(this);if(o.wheel)o.mouse[0][0]===c[0]&&o.mouse[0][1]===c[1]||(o.mouse[1]=u.invert(o.mouse[0]=c)),clearTimeout(o.wheel);else{if(u.k===s)return;o.mouse=[c,u.invert(c)],Qo(this),o.start()}Du(),o.wheel=setTimeout(n,U),o.zoom("mouse",i(r(e(u,s),o.mouse[0],o.mouse[1]),o.extent))}}function h(){function n(){Du(),o.moved=!0,o.zoom("mouse",i(r(o.that.__zoom,o.mouse[0]=Hr(o.that),o.mouse[1]),o.extent))}function e(){u.on("mousemove.zoom mouseup.zoom",null),nt(t.event.view,o.moved),Du(),o.end()}if(!y&&m.apply(this,arguments)){var o=a(this,arguments),u=_i(t.event.view).on("mousemove.zoom",n,!0).on("mouseup.zoom",e,!0),s=Hr(this);ki(t.event.view),Pn(),o.mouse=[s,this.__zoom.invert(s)],Qo(this),o.start()}}function f(){if(m.apply(this,arguments)){var o=this.__zoom,a=Hr(this),s=o.invert(a),c=o.k*(t.event.shiftKey?.5:2),l=i(r(e(o,c),a,s),_.apply(this,arguments));Du(),N>0?_i(this).transition().duration(N).call(u,l,a):_i(this).call(n.transform,l)}}function p(){if(m.apply(this,arguments)){var n,e,r,i,o=a(this,arguments),u=t.event.changedTouches,s=u.length;for(Pn(),e=0;e<s;++e)r=u[e],i=xi(this,u,r.identifier),i=[i,this.__zoom.invert(i),r.identifier],o.touch0?o.touch1||(o.touch1=i):(o.touch0=i,n=!0);return v&&(v=clearTimeout(v),!o.touch1)?(o.end(),i=_i(this).on("dblclick.zoom"),void(i&&i.apply(this,arguments))):void(n&&(v=setTimeout(function(){v=null},z),Qo(this),o.start()))}}function d(){var n,o,u,s,c=a(this,arguments),l=t.event.changedTouches,h=l.length;for(Du(),v&&(v=clearTimeout(v)),n=0;n<h;++n)o=l[n],u=xi(this,l,o.identifier),c.touch0&&c.touch0[2]===o.identifier?c.touch0[0]=u:c.touch1&&c.touch1[2]===o.identifier&&(c.touch1[0]=u);if(o=c.that.__zoom,c.touch1){var f=c.touch0[0],p=c.touch0[1],d=c.touch1[0],g=c.touch1[1],y=(y=d[0]-f[0])*y+(y=d[1]-f[1])*y,m=(m=g[0]-p[0])*m+(m=g[1]-p[1])*m;o=e(o,Math.sqrt(y/m)),u=[(f[0]+d[0])/2,(f[1]+d[1])/2],s=[(p[0]+g[0])/2,(p[1]+g[1])/2]}else{if(!c.touch0)return;u=c.touch0[0],s=c.touch0[1]}c.zoom("touch",i(r(o,u,s),c.extent))}function g(){var n,e,r=a(this,arguments),i=t.event.changedTouches,o=i.length;for(Pn(),y&&clearTimeout(y),y=setTimeout(function(){y=null},z),n=0;n<o;++n)e=i[n],r.touch0&&r.touch0[2]===e.identifier?delete r.touch0:r.touch1&&r.touch1[2]===e.identifier&&delete r.touch1;r.touch1&&!r.touch0&&(r.touch0=r.touch1,delete r.touch1),r.touch0||r.end()}var v,y,m=Hn,_=qn,w=0,x=1/0,M=-x,b=x,k=M,T=b,N=250,A=So,C=[],S=G("start","zoom","end"),z=500,U=150;return n.transform=function(t,n){var e=t.selection?t.selection():t;e.property("__zoom",Ln),t!==e?u(t,n):e.interrupt().each(function(){a(this,arguments).start().zoom(null,"function"==typeof n?n.apply(this,arguments):n).end()})},n.scaleBy=function(t,e){n.scaleTo(t,function(){var t=this.__zoom.k,n="function"==typeof e?e.apply(this,arguments):e;return t*n})},n.scaleTo=function(t,u){n.transform(t,function(){var t=_.apply(this,arguments),n=this.__zoom,a=o(t),s=n.invert(a),c="function"==typeof u?u.apply(this,arguments):u;return i(r(e(n,c),a,s),t)})},n.translateBy=function(t,e,r){n.transform(t,function(){return i(this.__zoom.translate("function"==typeof e?e.apply(this,arguments):e,"function"==typeof r?r.apply(this,arguments):r),_.apply(this,arguments))})},c.prototype={start:function(){return 1===++this.active&&(this.index=C.push(this)-1,this.emit("start")),this},zoom:function(t,n){return this.mouse&&"mouse"!==t&&(this.mouse[1]=n.invert(this.mouse[0])),this.touch0&&"touch"!==t&&(this.touch0[1]=n.invert(this.touch0[0])),this.touch1&&"touch"!==t&&(this.touch1[1]=n.invert(this.touch1[0])),this.that.__zoom=n,this.emit("zoom"),this},end:function(){return 0===--this.active&&(C.splice(this.index,1),this.index=-1,this.emit("end")),this},emit:function(t){s(new Yn(n,t,this.that.__zoom),S.apply,S,[t,this.that,this.args])}},n.filter=function(t){return arguments.length?(m="function"==typeof t?t:zu(!!t),n):m},n.extent=function(t){return arguments.length?(_="function"==typeof t?t:zu([[+t[0][0],+t[0][1]],[+t[1][0],+t[1][1]]]),n):_},n.scaleExtent=function(t){return arguments.length?(w=+t[0],x=+t[1],n):[w,x]},n.translateExtent=function(t){return arguments.length?(M=+t[0][0],b=+t[1][0],k=+t[0][1],T=+t[1][1],n):[[M,k],[b,T]]},n.duration=function(t){return arguments.length?(N=+t,n):N},n.interpolate=function(t){return arguments.length?(A=t,n):A},n.on=function(){var t=S.on.apply(S,arguments);return t===S?n:t},n},Yu=function(t,n){return t<n?-1:t>n?1:t>=n?0:NaN},Fu=function(t){return 1===t.length&&(t=Xn(t)),{left:function(n,e,r,i){for(null==r&&(r=0),null==i&&(i=n.length);r<i;){var o=r+i>>>1;t(n[o],e)<0?r=o+1:i=o}return r},right:function(n,e,r,i){for(null==r&&(r=0),null==i&&(i=n.length);r<i;){var o=r+i>>>1;t(n[o],e)>0?i=o:r=o+1}return r}}},Pu=Fu(Yu),Hu=Pu.right,qu=Array.prototype,Lu=(qu.slice,qu.map,function(t,n,e){t=+t,n=+n,e=(i=arguments.length)<2?(n=t,t=0,1):i<3?1:+e;for(var r=-1,i=0|Math.max(0,Math.ceil((n-t)/e)),o=new Array(i);++r<i;)o[r]=t+r*e;return o}),Xu=Math.sqrt(50),Iu=Math.sqrt(10),Ou=Math.sqrt(2),ju=function(t,n,e){var r=In(t,n,e);return Lu(Math.ceil(t/r)*r,Math.floor(n/r)*r+r/2,r)},Vu="$";On.prototype=jn.prototype={constructor:On,has:function(t){return Vu+t in this},get:function(t){return this[Vu+t]},set:function(t,n){return this[Vu+t]=n,this},remove:function(t){var n=Vu+t;return n in this&&delete this[n]},clear:function(){for(var t in this)t[0]===Vu&&delete this[t]},keys:function(){var t=[];for(var n in this)n[0]===Vu&&t.push(n.slice(1));return t},values:function(){var t=[];for(var n in this)n[0]===Vu&&t.push(this[n]);return t},entries:function(){
	var t=[];for(var n in this)n[0]===Vu&&t.push({key:n.slice(1),value:this[n]});return t},size:function(){var t=0;for(var n in this)n[0]===Vu&&++t;return t},empty:function(){for(var t in this)if(t[0]===Vu)return!1;return!0},each:function(t){for(var n in this)n[0]===Vu&&t(this[n],n.slice(1),this)}};var $u=jn.prototype;Vn.prototype=$n.prototype={constructor:Vn,has:$u.has,add:function(t){return t+="",this[Vu+t]=t,this},remove:$u.remove,clear:$u.clear,values:$u.keys,size:$u.size,empty:$u.empty,each:$u.each};var Ru,Bu=Array.prototype,Zu=Bu.map,Wu=Bu.slice,Gu=function(t){return function(){return t}},Ju=function(t){return+t},Ku=[0,1],Qu=function(t,n){if((e=(t=n?t.toExponential(n-1):t.toExponential()).indexOf("e"))<0)return null;var e,r=t.slice(0,e);return[r.length>1?r[0]+r.slice(2):r,+t.slice(e+1)]},ta=function(t){return t=Qu(Math.abs(t)),t?t[1]:NaN},na=function(t,n){return function(e,r){for(var i=e.length,o=[],u=0,a=t[0],s=0;i>0&&a>0&&(s+a+1>r&&(a=Math.max(1,r-s)),o.push(e.substring(i-=a,i+a)),!((s+=a+1)>r));)a=t[u=(u+1)%t.length];return o.reverse().join(n)}},ea=function(t,n){t=t.toPrecision(n);t:for(var e,r=t.length,i=1,o=-1;i<r;++i)switch(t[i]){case".":o=e=i;break;case"0":0===o&&(o=i),e=i;break;case"e":break t;default:o>0&&(o=0)}return o>0?t.slice(0,o)+t.slice(e+1):t},ra=function(t,n){var e=Qu(t,n);if(!e)return t+"";var r=e[0],i=e[1],o=i-(Ru=3*Math.max(-8,Math.min(8,Math.floor(i/3))))+1,u=r.length;return o===u?r:o>u?r+new Array(o-u+1).join("0"):o>0?r.slice(0,o)+"."+r.slice(o):"0."+new Array(1-o).join("0")+Qu(t,Math.max(0,n+o-1))[0]},ia=function(t,n){var e=Qu(t,n);if(!e)return t+"";var r=e[0],i=e[1];return i<0?"0."+new Array(-i).join("0")+r:r.length>i+1?r.slice(0,i+1)+"."+r.slice(i+1):r+new Array(i-r.length+2).join("0")},oa={"":ea,"%":function(t,n){return(100*t).toFixed(n)},b:function(t){return Math.round(t).toString(2)},c:function(t){return t+""},d:function(t){return Math.round(t).toString(10)},e:function(t,n){return t.toExponential(n)},f:function(t,n){return t.toFixed(n)},g:function(t,n){return t.toPrecision(n)},o:function(t){return Math.round(t).toString(8)},p:function(t,n){return ia(100*t,n)},r:ia,s:ra,X:function(t){return Math.round(t).toString(16).toUpperCase()},x:function(t){return Math.round(t).toString(16)}},ua=/^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i,aa=function(t){return new Qn(t)};Qn.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?"0":"")+(null==this.width?"":Math.max(1,0|this.width))+(this.comma?",":"")+(null==this.precision?"":"."+Math.max(0,0|this.precision))+this.type};var sa,ca,la,ha=["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"],fa=function(t){function n(t){function n(t){var n,i,s,m=d,_=g;if("c"===p)_=v(t)+_,t="";else{t=+t;var w=(t<0||1/t<0)&&(t*=-1,!0);if(t=v(t,f),w)for(n=-1,i=t.length,w=!1;++n<i;)if(s=t.charCodeAt(n),48<s&&s<58||"x"===p&&96<s&&s<103||"X"===p&&64<s&&s<71){w=!0;break}if(m=(w?"("===a?a:"-":"-"===a||"("===a?"":a)+m,_=_+("s"===p?ha[8+Ru/3]:"")+(w&&"("===a?")":""),y)for(n=-1,i=t.length;++n<i;)if(s=t.charCodeAt(n),48>s||s>57){_=(46===s?o+t.slice(n+1):t.slice(n))+_,t=t.slice(0,n);break}}h&&!c&&(t=r(t,1/0));var x=m.length+t.length+_.length,M=x<l?new Array(l-x+1).join(e):"";switch(h&&c&&(t=r(M+t,M.length?l-_.length:1/0),M=""),u){case"<":return m+t+_+M;case"=":return m+M+t+_;case"^":return M.slice(0,x=M.length>>1)+m+t+_+M.slice(x)}return M+m+t+_}t=aa(t);var e=t.fill,u=t.align,a=t.sign,s=t.symbol,c=t.zero,l=t.width,h=t.comma,f=t.precision,p=t.type,d="$"===s?i[0]:"#"===s&&/[boxX]/.test(p)?"0"+p.toLowerCase():"",g="$"===s?i[1]:/[%p]/.test(p)?"%":"",v=oa[p],y=!p||/[defgprs%]/.test(p);return f=null==f?p?6:12:/[gprs]/.test(p)?Math.max(1,Math.min(21,f)):Math.max(0,Math.min(20,f)),n.toString=function(){return t+""},n}function e(t,e){var r=n((t=aa(t),t.type="f",t)),i=3*Math.max(-8,Math.min(8,Math.floor(ta(e)/3))),o=Math.pow(10,-i),u=ha[8+i/3];return function(t){return r(o*t)+u}}var r=t.grouping&&t.thousands?na(t.grouping,t.thousands):te,i=t.currency,o=t.decimal;return{format:n,formatPrefix:e}};ne({decimal:".",thousands:",",grouping:[3],currency:["$",""]});var pa=function(t){return Math.max(0,-ta(Math.abs(t)))},da=function(t,n){return Math.max(0,3*Math.max(-8,Math.min(8,Math.floor(ta(n)/3)))-ta(Math.abs(t)))},ga=function(t,n){return t=Math.abs(t),n=Math.abs(n)-t,Math.max(0,ta(n)-ta(t))+1},va=function(t,n,e){var r,i=t[0],o=t[t.length-1],u=In(i,o,null==n?10:n);switch(e=aa(null==e?",f":e),e.type){case"s":var a=Math.max(Math.abs(i),Math.abs(o));return null!=e.precision||isNaN(r=da(u,a))||(e.precision=r),la(e,a);case"":case"e":case"g":case"p":case"r":null!=e.precision||isNaN(r=ga(u,Math.max(Math.abs(i),Math.abs(o))))||(e.precision=r-("e"===e.type));break;case"f":case"%":null!=e.precision||isNaN(r=pa(u))||(e.precision=r-2*("%"===e.type))}return ca(e)},ya=new Date,ma=new Date,_a=ie(function(){},function(t,n){t.setTime(+t+n)},function(t,n){return n-t});_a.every=function(t){return t=Math.floor(t),isFinite(t)&&t>0?t>1?ie(function(n){n.setTime(Math.floor(n/t)*t)},function(n,e){n.setTime(+n+e*t)},function(n,e){return(e-n)/t}):_a:null};var wa=1e3,xa=6e4,Ma=36e5,ba=864e5,ka=6048e5,Ta=(ie(function(t){t.setTime(Math.floor(t/wa)*wa)},function(t,n){t.setTime(+t+n*wa)},function(t,n){return(n-t)/wa},function(t){return t.getUTCSeconds()}),ie(function(t){t.setTime(Math.floor(t/xa)*xa)},function(t,n){t.setTime(+t+n*xa)},function(t,n){return(n-t)/xa},function(t){return t.getMinutes()}),ie(function(t){var n=t.getTimezoneOffset()*xa%Ma;n<0&&(n+=Ma),t.setTime(Math.floor((+t-n)/Ma)*Ma+n)},function(t,n){t.setTime(+t+n*Ma)},function(t,n){return(n-t)/Ma},function(t){return t.getHours()}),ie(function(t){t.setHours(0,0,0,0)},function(t,n){t.setDate(t.getDate()+n)},function(t,n){return(n-t-(n.getTimezoneOffset()-t.getTimezoneOffset())*xa)/ba},function(t){return t.getDate()-1})),Na=oe(0),Aa=oe(1),Ca=(oe(2),oe(3),oe(4),oe(5),oe(6),ie(function(t){t.setDate(1),t.setHours(0,0,0,0)},function(t,n){t.setMonth(t.getMonth()+n)},function(t,n){return n.getMonth()-t.getMonth()+12*(n.getFullYear()-t.getFullYear())},function(t){return t.getMonth()}),ie(function(t){t.setMonth(0,1),t.setHours(0,0,0,0)},function(t,n){t.setFullYear(t.getFullYear()+n)},function(t,n){return n.getFullYear()-t.getFullYear()},function(t){return t.getFullYear()}));Ca.every=function(t){return isFinite(t=Math.floor(t))&&t>0?ie(function(n){n.setFullYear(Math.floor(n.getFullYear()/t)*t),n.setMonth(0,1),n.setHours(0,0,0,0)},function(n,e){n.setFullYear(n.getFullYear()+e*t)}):null};var Sa=(ie(function(t){t.setUTCSeconds(0,0)},function(t,n){t.setTime(+t+n*xa)},function(t,n){return(n-t)/xa},function(t){return t.getUTCMinutes()}),ie(function(t){t.setUTCMinutes(0,0,0)},function(t,n){t.setTime(+t+n*Ma)},function(t,n){return(n-t)/Ma},function(t){return t.getUTCHours()}),ie(function(t){t.setUTCHours(0,0,0,0)},function(t,n){t.setUTCDate(t.getUTCDate()+n)},function(t,n){return(n-t)/ba},function(t){return t.getUTCDate()-1})),za=ue(0),Ua=ue(1),Da=(ue(2),ue(3),ue(4),ue(5),ue(6),ie(function(t){t.setUTCDate(1),t.setUTCHours(0,0,0,0)},function(t,n){t.setUTCMonth(t.getUTCMonth()+n)},function(t,n){return n.getUTCMonth()-t.getUTCMonth()+12*(n.getUTCFullYear()-t.getUTCFullYear())},function(t){return t.getUTCMonth()}),ie(function(t){t.setUTCMonth(0,1),t.setUTCHours(0,0,0,0)},function(t,n){t.setUTCFullYear(t.getUTCFullYear()+n)},function(t,n){return n.getUTCFullYear()-t.getUTCFullYear()},function(t){return t.getUTCFullYear()}));Da.every=function(t){return isFinite(t=Math.floor(t))&&t>0?ie(function(n){n.setUTCFullYear(Math.floor(n.getUTCFullYear()/t)*t),n.setUTCMonth(0,1),n.setUTCHours(0,0,0,0)},function(n,e){n.setUTCFullYear(n.getUTCFullYear()+e*t)}):null};var Ea,Ya,Fa,Pa,Ha,qa={"-":"",_:" ",0:"0"},La=/^\s*\d+/,Xa=/^%/,Ia=/[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;ir({dateTime:"%x, %X",date:"%-m/%-d/%Y",time:"%-I:%M:%S %p",periods:["AM","PM"],days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]});var Oa="%Y-%m-%dT%H:%M:%S.%LZ",ja=(Date.prototype.toISOString?or:Pa(Oa),+new Date("2000-01-01T00:00:00.000Z")?ur:Ha(Oa),function(t){return t.match(/.{6}/g).map(function(t){return"#"+t})});ja("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf"),ja("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6"),ja("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9"),ja("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5"),Do(At(300,.5,0),At(-240,.5,1));var Va=(Do(At(-100,.75,.35),At(80,1.5,.8)),Do(At(260,.75,.35),At(80,1.5,.8)),At(),Array.prototype.slice),$a=function(t){return t},Ra=1,Ba=2,Za=3,Wa=4,Ga=1e-6,Ja=function(t){return function(){return t}},Ka=function(){return 1e-6*(Math.random()-.5)},Qa=function(t){var n=+this._x.call(null,t),e=+this._y.call(null,t);return dr(this.cover(n,e),n,e,t)},ts=function(t,n){if(isNaN(t=+t)||isNaN(n=+n))return this;var e=this._x0,r=this._y0,i=this._x1,o=this._y1;if(isNaN(e))i=(e=Math.floor(t))+1,o=(r=Math.floor(n))+1;else{if(!(e>t||t>i||r>n||n>o))return this;var u,a,s=i-e,c=this._root;switch(a=(n<(r+o)/2)<<1|t<(e+i)/2){case 0:do u=new Array(4),u[a]=c,c=u;while(s*=2,i=e+s,o=r+s,t>i||n>o);break;case 1:do u=new Array(4),u[a]=c,c=u;while(s*=2,e=i-s,o=r+s,e>t||n>o);break;case 2:do u=new Array(4),u[a]=c,c=u;while(s*=2,i=e+s,r=o-s,t>i||r>n);break;case 3:do u=new Array(4),u[a]=c,c=u;while(s*=2,e=i-s,r=o-s,e>t||r>n)}this._root&&this._root.length&&(this._root=c)}return this._x0=e,this._y0=r,this._x1=i,this._y1=o,this},ns=function(){var t=[];return this.visit(function(n){if(!n.length)do t.push(n.data);while(n=n.next)}),t},es=function(t){return arguments.length?this.cover(+t[0][0],+t[0][1]).cover(+t[1][0],+t[1][1]):isNaN(this._x0)?void 0:[[this._x0,this._y0],[this._x1,this._y1]]},rs=function(t,n,e,r,i){this.node=t,this.x0=n,this.y0=e,this.x1=r,this.y1=i},is=function(t,n,e){var r,i,o,u,a,s,c,l=this._x0,h=this._y0,f=this._x1,p=this._y1,d=[],g=this._root;for(g&&d.push(new rs(g,l,h,f,p)),null==e?e=1/0:(l=t-e,h=n-e,f=t+e,p=n+e,e*=e);s=d.pop();)if(!(!(g=s.node)||(i=s.x0)>f||(o=s.y0)>p||(u=s.x1)<l||(a=s.y1)<h))if(g.length){var v=(i+u)/2,y=(o+a)/2;d.push(new rs(g[3],v,y,u,a),new rs(g[2],i,y,v,a),new rs(g[1],v,o,u,y),new rs(g[0],i,o,v,y)),(c=(n>=y)<<1|t>=v)&&(s=d[d.length-1],d[d.length-1]=d[d.length-1-c],d[d.length-1-c]=s)}else{var m=t-+this._x.call(null,g.data),_=n-+this._y.call(null,g.data),w=m*m+_*_;if(w<e){var x=Math.sqrt(e=w);l=t-x,h=n-x,f=t+x,p=n+x,r=g.data}}return r},os=function(t){if(isNaN(o=+this._x.call(null,t))||isNaN(u=+this._y.call(null,t)))return this;var n,e,r,i,o,u,a,s,c,l,h,f,p=this._root,d=this._x0,g=this._y0,v=this._x1,y=this._y1;if(!p)return this;if(p.length)for(;;){if((c=o>=(a=(d+v)/2))?d=a:v=a,(l=u>=(s=(g+y)/2))?g=s:y=s,n=p,!(p=p[h=l<<1|c]))return this;if(!p.length)break;(n[h+1&3]||n[h+2&3]||n[h+3&3])&&(e=n,f=h)}for(;p.data!==t;)if(r=p,!(p=p.next))return this;return(i=p.next)&&delete p.next,r?(i?r.next=i:delete r.next,this):n?(i?n[h]=i:delete n[h],(p=n[0]||n[1]||n[2]||n[3])&&p===(n[3]||n[2]||n[1]||n[0])&&!p.length&&(e?e[f]=p:this._root=p),this):(this._root=i,this)},us=function(){return this._root},as=function(){var t=0;return this.visit(function(n){if(!n.length)do++t;while(n=n.next)}),t},ss=function(t){var n,e,r,i,o,u,a=[],s=this._root;for(s&&a.push(new rs(s,this._x0,this._y0,this._x1,this._y1));n=a.pop();)if(!t(s=n.node,r=n.x0,i=n.y0,o=n.x1,u=n.y1)&&s.length){var c=(r+o)/2,l=(i+u)/2;(e=s[3])&&a.push(new rs(e,c,l,o,u)),(e=s[2])&&a.push(new rs(e,r,l,c,u)),(e=s[1])&&a.push(new rs(e,c,i,o,l)),(e=s[0])&&a.push(new rs(e,r,i,c,l))}return this},cs=function(t){var n,e=[],r=[];for(this._root&&e.push(new rs(this._root,this._x0,this._y0,this._x1,this._y1));n=e.pop();){var i=n.node;if(i.length){var o,u=n.x0,a=n.y0,s=n.x1,c=n.y1,l=(u+s)/2,h=(a+c)/2;(o=i[0])&&e.push(new rs(o,u,a,l,h)),(o=i[1])&&e.push(new rs(o,l,a,s,h)),(o=i[2])&&e.push(new rs(o,u,h,l,c)),(o=i[3])&&e.push(new rs(o,l,h,s,c))}r.push(n)}for(;n=r.pop();)t(n.node,n.x0,n.y0,n.x1,n.y1);return this},ls=function(t){return arguments.length?(this._x=t,this):this._x},hs=function(t){return arguments.length?(this._y=t,this):this._y},fs=_r.prototype=wr.prototype;fs.copy=function(){var t,n,e=new wr(this._x,this._y,this._x0,this._y0,this._x1,this._y1),r=this._root;if(!r)return e;if(!r.length)return e._root=xr(r),e;for(t=[{source:r,target:e._root=new Array(4)}];r=t.pop();)for(var i=0;i<4;++i)(n=r.source[i])&&(n.length?t.push({source:n,target:r.target[i]=new Array(4)}):r.target[i]=xr(n));return e},fs.add=Qa,fs.addAll=gr,fs.cover=ts,fs.data=ns,fs.extent=es,fs.find=is,fs.remove=os,fs.removeAll=vr,fs.root=us,fs.size=as,fs.visit=ss,fs.visitAfter=cs,fs.x=ls,fs.y=hs;var ps=function(t){function n(t){return 1/Math.min(c[t.source.index],c[t.target.index])}function e(n){for(var e=0,r=t.length;e<d;++e)for(var i,o,s,c,h,f,p,g=0;g<r;++g)i=t[g],o=i.source,s=i.target,c=s.x+s.vx-o.x-o.vx||Ka(),h=s.y+s.vy-o.y-o.vy||Ka(),f=Math.sqrt(c*c+h*h),f=(f-a[g])/f*n*u[g],c*=f,h*=f,s.vx-=c*(p=l[g]),s.vy-=h*p,o.vx+=c*(p=1-p),o.vy+=h*p}function r(){if(s){var n,e,r=s.length,f=t.length,p=jn(s,h);for(n=0,c=new Array(r);n<f;++n)e=t[n],e.index=n,"object"!=typeof e.source&&(e.source=br(p,e.source)),"object"!=typeof e.target&&(e.target=br(p,e.target)),c[e.source.index]=(c[e.source.index]||0)+1,c[e.target.index]=(c[e.target.index]||0)+1;for(n=0,l=new Array(f);n<f;++n)e=t[n],l[n]=c[e.source.index]/(c[e.source.index]+c[e.target.index]);u=new Array(f),i(),a=new Array(f),o()}}function i(){if(s)for(var n=0,e=t.length;n<e;++n)u[n]=+f(t[n],n,t)}function o(){if(s)for(var n=0,e=t.length;n<e;++n)a[n]=+p(t[n],n,t)}var u,a,s,c,l,h=Mr,f=n,p=Ja(30),d=1;return null==t&&(t=[]),e.initialize=function(t){s=t,r()},e.links=function(n){return arguments.length?(t=n,r(),e):t},e.id=function(t){return arguments.length?(h=t,e):h},e.iterations=function(t){return arguments.length?(d=+t,e):d},e.strength=function(t){return arguments.length?(f="function"==typeof t?t:Ja(+t),i(),e):f},e.distance=function(t){return arguments.length?(p="function"==typeof t?t:Ja(+t),o(),e):p},e},ds=10,gs=Math.PI*(3-Math.sqrt(5)),vs=function(t){function n(){e(),p.call("tick",o),u<a&&(f.stop(),p.call("end",o))}function e(){var n,e,r=t.length;for(u+=(c-u)*s,h.each(function(t){t(u)}),n=0;n<r;++n)e=t[n],null==e.fx?e.x+=e.vx*=l:(e.x=e.fx,e.vx=0),null==e.fy?e.y+=e.vy*=l:(e.y=e.fy,e.vy=0)}function r(){for(var n,e=0,r=t.length;e<r;++e){if(n=t[e],n.index=e,isNaN(n.x)||isNaN(n.y)){var i=ds*Math.sqrt(e),o=e*gs;n.x=i*Math.cos(o),n.y=i*Math.sin(o)}(isNaN(n.vx)||isNaN(n.vy))&&(n.vx=n.vy=0)}}function i(n){return n.initialize&&n.initialize(t),n}var o,u=1,a=.001,s=1-Math.pow(a,1/300),c=0,l=.6,h=jn(),f=Rt(n),p=G("tick","end");return null==t&&(t=[]),r(),o={tick:e,restart:function(){return f.restart(n),o},stop:function(){return f.stop(),o},nodes:function(n){return arguments.length?(t=n,r(),h.each(i),o):t},alpha:function(t){return arguments.length?(u=+t,o):u},alphaMin:function(t){return arguments.length?(a=+t,o):a},alphaDecay:function(t){return arguments.length?(s=+t,o):+s},alphaTarget:function(t){return arguments.length?(c=+t,o):c},velocityDecay:function(t){return arguments.length?(l=1-t,o):1-l},force:function(t,n){return arguments.length>1?(null==n?h.remove(t):h.set(t,i(n)),o):h.get(t)},find:function(n,e,r){var i,o,u,a,s,c=0,l=t.length;for(null==r?r=1/0:r*=r,c=0;c<l;++c)a=t[c],i=n-a.x,o=e-a.y,u=i*i+o*o,u<r&&(s=a,r=u);return s},on:function(t,n){return arguments.length>1?(p.on(t,n),o):p.on(t)}}};t.select=_i,t.selection=W,t.selectAll=wi,t.zoom=Eu,t.zoomIdentity=Uu,t.scaleLinear=re,t.axisBottom=pr,t.axisRight=fr,t.forceSimulation=vs,t.forceLink=ps,t.map=jn,Object.defineProperty(t,"__esModule",{value:!0})});

/***/ },
/* 314 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';
	
	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @api private
	 */
	function Events() {}
	
	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);
	
	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}
	
	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {Mixed} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}
	
	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}
	
	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;
	
	  if (this._eventsCount === 0) return names;
	
	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }
	
	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }
	
	  return names;
	};
	
	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Boolean} exists Only check if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events[evt];
	
	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];
	
	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }
	
	  return ee;
	};
	
	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) return false;
	
	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;
	
	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
	
	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }
	
	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }
	
	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;
	
	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
	
	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }
	
	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }
	
	  return true;
	};
	
	/**
	 * Add a listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];
	
	  return this;
	};
	
	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];
	
	  return this;
	};
	
	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {Mixed} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) return this;
	  if (!fn) {
	    if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	    return this;
	  }
	
	  var listeners = this._events[evt];
	
	  if (listeners.fn) {
	    if (
	         listeners.fn === fn
	      && (!once || listeners.once)
	      && (!context || listeners.context === context)
	    ) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	           listeners[i].fn !== fn
	        || (once && !listeners[i].once)
	        || (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }
	
	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	  }
	
	  return this;
	};
	
	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {String|Symbol} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;
	
	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }
	
	  return this;
	};
	
	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	
	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};
	
	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;
	
	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;
	
	//
	// Expose the module.
	//
	if (true) {
	  module.exports = EventEmitter;
	}


/***/ },
/* 315 */
/***/ function(module, exports) {

	addEventListener.removeEventListener = removeEventListener
	addEventListener.addEventListener = addEventListener
	
	module.exports = addEventListener
	
	var Events = null
	
	function addEventListener(el, eventName, listener, useCapture) {
	  Events = Events || (
	    document.addEventListener ?
	    {add: stdAttach, rm: stdDetach} :
	    {add: oldIEAttach, rm: oldIEDetach}
	  )
	  
	  return Events.add(el, eventName, listener, useCapture)
	}
	
	function removeEventListener(el, eventName, listener, useCapture) {
	  Events = Events || (
	    document.addEventListener ?
	    {add: stdAttach, rm: stdDetach} :
	    {add: oldIEAttach, rm: oldIEDetach}
	  )
	  
	  return Events.rm(el, eventName, listener, useCapture)
	}
	
	function stdAttach(el, eventName, listener, useCapture) {
	  el.addEventListener(eventName, listener, useCapture)
	}
	
	function stdDetach(el, eventName, listener, useCapture) {
	  el.removeEventListener(eventName, listener, useCapture)
	}
	
	function oldIEAttach(el, eventName, listener, useCapture) {
	  if(useCapture) {
	    throw new Error('cannot useCapture in oldIE')
	  }
	
	  el.attachEvent('on' + eventName, listener)
	}
	
	function oldIEDetach(el, eventName, listener, useCapture) {
	  el.detachEvent('on' + eventName, listener)
	}


/***/ },
/* 316 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __depends__: [
	    __webpack_require__(317),
	    __webpack_require__(434)
	  ]
	};

/***/ },
/* 317 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'groups' ],
	  groups: [ 'type', __webpack_require__(318) ],
	  __depends__: [
	    __webpack_require__(319)
	  ]
	};


/***/ },
/* 318 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var /*d3 = require('d3'),*/
	  //forIn = require('lodash/object').forIn,
	  values = __webpack_require__(6).values,
	  //isUndefined = require('lodash/lang').isUndefined,
	  //_groupsArray = [],
	  _groupContainer = null,
	  _groupContainers = null
	  ;
	
	/**
	 * The groups processing module.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Object} groupsDict
	 * @param {Canvas} canvas
	 * @param {EventBus} eventBus
	 * @param {Nodes} nodes
	 */
	function Groups(canvas, eventBus, nodes) {
	  this._groups = {};
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	  this._nodes = nodes;
	  this._init();
	}
	
	Groups.$inject = [
	  'canvas', 'eventBus', 'nodes'
	];
	
	module.exports = Groups;
	
	Groups.prototype._init = function(){
	  var that = this;
	  this._eventBus.on('force.init', function(){
	    that._draw();
	  });
	  this._eventBus.on('canvas.resized', function(){
	    that._draw();
	  });
	};
	
	Groups.prototype._draw = function(){
	  this._drawContainer();
	  //this._drawGroups();
	  //this._drawLabels();
	};
	
	Groups.prototype._drawContainer = function(){
	  if (_groupContainer){
	    _groupContainer.remove();
	  }
	  _groupContainer = this._canvas
	    .getDrawingLayer()
	    .insert('g', ':first-child')
	    .attr('class', 'groups');
	  console.log(_groupContainer);
	};
	
	Groups.prototype._drawGroups = function(groupsDict){
	  var that = this;
	
	  if (groupsDict){
	    this.groups = values(groupsDict);
	  }
	
	  this.groups = _groupContainers
	    .append('rect')
	    .attr('coords', function(d) {
	      d.coords = that._calculateGroupBoundaries(d.nodes, d.label);
	      return 1;
	    })
	    .attr('x', function (d) {
	      return d.coords.x;
	    })
	    .attr('y', function (d) {
	      return d.coords.y;
	    })
	    .attr('width', function (d) {
	      return d.coords.width;
	    })
	    .attr('height', function (d) {
	      return d.coords.height;
	    })
	    .attr('rx', function () {
	      return '5';
	    })
	    .style('fill', function(d){
	      return d.color;
	    })
	    .style('stroke', function(d){
	      return d.color;
	    })
	    .style('stroke-width', '2px')
	    .style('fill-opacity', '0.3');
	};
	
	// Groups.prototype._drawLabels = function(){
	//   var that = this;
	//   this.groupLabels = _groupContainers
	//     .append('text')
	//     .attr('x', function (d) {
	//       return d.coords.x + 3;
	//     })
	//     .attr('y', function (d) {
	//       return d.coords.y + 10;
	//     })
	//     .style('font-size', '8px')
	//     .style('font-weight', 'bold')
	//     .style('fill', function(d){
	//       return d.color;
	//     })
	//     .text(function(d){
	//       return isUndefined(d.label) ? null : d.label;
	//     })
	//     .on('mouseover', function(){
	//       that._eventBus.emit('groupLabel.mouseover');
	//     })
	//     .on('mouseout', function(){
	//       that._eventBus.emit('groupLabel.mouseout');
	//     });
	// };
	//
	// Groups.prototype._calculateGroupBoundaries = function(groupNodes, label){
	//   var that = this,
	//     xArr = [],
	//     yArr = [],
	//     hasLabel = !isUndefined(label);
	//   forIn(groupNodes, function(n, k){
	//     var pos = that._nodesDict[k].position;
	//     if (isUndefined(pos)){
	//       pos = {x: 0, y: 0};
	//     }
	//     xArr.push(pos.x);
	//     yArr.push(pos.y);
	//   });
	//   var x = d3.min(xArr) - 32,
	//     width = d3.max(xArr) - x + 32,
	//     y = d3.min(yArr) - 32 - (hasLabel ? 6 : 0),
	//     height = d3.max(yArr) - y + 42;
	//   return {
	//     x: x,
	//     y: y,
	//     width: width,
	//     height: height
	//   };
	//};

/***/ },
/* 319 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'nodes' ],
	  nodes: [ 'type', __webpack_require__(320) ],
	  __depends__: [
	    __webpack_require__(386),
	    __webpack_require__(432)
	  ]
	};

/***/ },
/* 320 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var cloneDeep = __webpack_require__(255).cloneDeep,
	  forIn = __webpack_require__(6).forIn,
	  forEach = __webpack_require__(321).forEach,
	  isUndefined = __webpack_require__(255).isUndefined,
	  _nodes = null,
	  _nodesContainer = null
	  ;
	
	/**
	 * The node processing & drawing module.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Object} nodesDict
	 * @param {Canvas} canvas
	 * @param {EventBus} eventBus
	 */
	function Nodes(nodesDict, canvas, eventBus, iconLoader) {
	  var that = this;
	
	  this._nodesDict = cloneDeep(nodesDict);
	  this._nodes = [];
	  this._links = [];
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	  this._iconLoader = iconLoader;
	
	  this._init();
	  this._eventBus.on('force.init', function(){
	    that._draw();
	  });
	  this._eventBus.on('canvas.resized', function(){
	    that._draw();
	  });
	}
	
	Nodes.$inject = [ 'd3polytree.nodes', 'canvas', 'eventBus', 'iconLoader' ];
	
	module.exports = Nodes;
	
	Nodes.prototype._draw = function() {
	  var that = this;
	  if (_nodesContainer){
	    // delete previous nodes
	    _nodesContainer.remove();
	  }
	  _nodesContainer = this._canvas.getDrawingLayer()
	    .append('g')
	    .attr('class', 'nodes');
	  // draw the nodes wraps
	  _nodes = _nodesContainer
	    .selectAll('.node')
	    .data(this._nodes)
	    .enter()
	    .append('g')
	    .attr('class', 'node')
	    .attr('node-id', function(d){
	      return d.nodeId;
	    })
	    .attr('x', function(d){
	      return !isUndefined(d.fx) ? d.fx : d.x;
	    })
	    .attr('y', function(d){
	      return !isUndefined(d.fy) ? d.fy : d.y;
	    })
	    .attr('transform', function(d){
	      return 'translate(' + d.x + ',' + d.y + ')';
	    });
	  _nodes.on('mouseover', function(){
	    console.log('node mouseover');
	  });
	  // draw the nodes icons
	  _nodes
	    .append('svg')
	    .attr('width', function(d){
	      return !isUndefined(d.width) ? d.width : 50;
	    })
	    .attr('height', function(d){
	      return !isUndefined(d.height) ? d.height : 50;
	    })
	    // .attr('x', function(d){
	    //   return -1.0 * (!isUndefined(d.width) ? d.width : 50) / 2.0;
	    // })
	    // .attr('y', function(d){
	    //   return -1.0 * (!isUndefined(d.height) ? d.height : 50) / 2.0;
	    // })
	    .attr('viewBox', function(d) {
	      return (!isUndefined(that._iconLoader._processedIcons[d.iconType])) ? that._iconLoader._processedIcons[d.iconType] :
	        that._iconLoader._processedIcons['default'];
	    })
	    .attr('preserveAspectRatio', 'xMaxYMax meet')
	    .append('use')
	    .attr('xlink:href', function(d) {
	      return (!isUndefined(that._iconLoader._processedIcons[d.iconType])) ? '#'+d.iconType+'_icon_def' :
	        '#default_icon_def';
	    });
	};
	
	Nodes.prototype._init = function() {
	  var that = this;
	  forIn(this._nodesDict, function(n, k){
	    // create the nodes
	    var newNode = {
	      id: k,
	      nodeId: k,
	      label: n.label,
	      adjacencyList: n.adjacencyList,
	      positionX: n.positionX,
	      positionY: n.positionY,
	      iconType: n.iconType || 'default'
	    };
	    if (!isUndefined(newNode.positionX) && !isUndefined(newNode.positionY)){
	      newNode.fx = newNode.positionX;
	      newNode.fy = newNode.positionY;
	    }
	    that._nodes.push(newNode);
	    that._nodesDict[k] = newNode;
	    // create the links
	    forEach(newNode.adjacencyList, function(n, k){
	      that._links.push({
	        source: newNode.id,
	        target: k,
	        label: n.label
	      });
	    });
	  });
	};

/***/ },
/* 321 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  'countBy': __webpack_require__(322),
	  'each': __webpack_require__(328),
	  'eachRight': __webpack_require__(330),
	  'every': __webpack_require__(334),
	  'filter': __webpack_require__(337),
	  'find': __webpack_require__(339),
	  'findLast': __webpack_require__(343),
	  'flatMap': __webpack_require__(345),
	  'flatMapDeep': __webpack_require__(348),
	  'flatMapDepth': __webpack_require__(349),
	  'forEach': __webpack_require__(329),
	  'forEachRight': __webpack_require__(331),
	  'groupBy': __webpack_require__(350),
	  'includes': __webpack_require__(351),
	  'invokeMap': __webpack_require__(355),
	  'keyBy': __webpack_require__(356),
	  'map': __webpack_require__(346),
	  'orderBy': __webpack_require__(357),
	  'partition': __webpack_require__(362),
	  'reduce': __webpack_require__(363),
	  'reduceRight': __webpack_require__(365),
	  'reject': __webpack_require__(367),
	  'sample': __webpack_require__(368),
	  'sampleSize': __webpack_require__(372),
	  'shuffle': __webpack_require__(376),
	  'size': __webpack_require__(379),
	  'some': __webpack_require__(383),
	  'sortBy': __webpack_require__(385)
	};


/***/ },
/* 322 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    createAggregator = __webpack_require__(323);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Creates an object composed of keys generated from the results of running
	 * each element of `collection` thru `iteratee`. The corresponding value of
	 * each key is the number of times the key was returned by `iteratee`. The
	 * iteratee is invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.5.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
	 * @returns {Object} Returns the composed aggregate object.
	 * @example
	 *
	 * _.countBy([6.1, 4.2, 6.3], Math.floor);
	 * // => { '4': 1, '6': 2 }
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.countBy(['one', 'two', 'three'], 'length');
	 * // => { '3': 2, '5': 1 }
	 */
	var countBy = createAggregator(function(result, value, key) {
	  if (hasOwnProperty.call(result, key)) {
	    ++result[key];
	  } else {
	    baseAssignValue(result, key, 1);
	  }
	});
	
	module.exports = countBy;


/***/ },
/* 323 */
/***/ function(module, exports, __webpack_require__) {

	var arrayAggregator = __webpack_require__(324),
	    baseAggregator = __webpack_require__(325),
	    baseIteratee = __webpack_require__(153),
	    isArray = __webpack_require__(47);
	
	/**
	 * Creates a function like `_.groupBy`.
	 *
	 * @private
	 * @param {Function} setter The function to set accumulator values.
	 * @param {Function} [initializer] The accumulator object initializer.
	 * @returns {Function} Returns the new aggregator function.
	 */
	function createAggregator(setter, initializer) {
	  return function(collection, iteratee) {
	    var func = isArray(collection) ? arrayAggregator : baseAggregator,
	        accumulator = initializer ? initializer() : {};
	
	    return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
	  };
	}
	
	module.exports = createAggregator;


/***/ },
/* 324 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `baseAggregator` for arrays.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} setter The function to set `accumulator` values.
	 * @param {Function} iteratee The iteratee to transform keys.
	 * @param {Object} accumulator The initial aggregated object.
	 * @returns {Function} Returns `accumulator`.
	 */
	function arrayAggregator(array, setter, iteratee, accumulator) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  while (++index < length) {
	    var value = array[index];
	    setter(accumulator, value, iteratee(value), array);
	  }
	  return accumulator;
	}
	
	module.exports = arrayAggregator;


/***/ },
/* 325 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(326);
	
	/**
	 * Aggregates elements of `collection` on `accumulator` with keys transformed
	 * by `iteratee` and values set by `setter`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} setter The function to set `accumulator` values.
	 * @param {Function} iteratee The iteratee to transform keys.
	 * @param {Object} accumulator The initial aggregated object.
	 * @returns {Function} Returns `accumulator`.
	 */
	function baseAggregator(collection, setter, iteratee, accumulator) {
	  baseEach(collection, function(value, key, collection) {
	    setter(accumulator, value, iteratee(value), collection);
	  });
	  return accumulator;
	}
	
	module.exports = baseAggregator;


/***/ },
/* 326 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwn = __webpack_require__(152),
	    createBaseEach = __webpack_require__(327);
	
	/**
	 * The base implementation of `_.forEach` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 */
	var baseEach = createBaseEach(baseForOwn);
	
	module.exports = baseEach;


/***/ },
/* 327 */
/***/ function(module, exports, __webpack_require__) {

	var isArrayLike = __webpack_require__(37);
	
	/**
	 * Creates a `baseEach` or `baseEachRight` function.
	 *
	 * @private
	 * @param {Function} eachFunc The function to iterate over a collection.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseEach(eachFunc, fromRight) {
	  return function(collection, iteratee) {
	    if (collection == null) {
	      return collection;
	    }
	    if (!isArrayLike(collection)) {
	      return eachFunc(collection, iteratee);
	    }
	    var length = collection.length,
	        index = fromRight ? length : -1,
	        iterable = Object(collection);
	
	    while ((fromRight ? index-- : ++index < length)) {
	      if (iteratee(iterable[index], index, iterable) === false) {
	        break;
	      }
	    }
	    return collection;
	  };
	}
	
	module.exports = createBaseEach;


/***/ },
/* 328 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(329);


/***/ },
/* 329 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEach = __webpack_require__(205),
	    baseEach = __webpack_require__(326),
	    castFunction = __webpack_require__(181),
	    isArray = __webpack_require__(47);
	
	/**
	 * Iterates over elements of `collection` and invokes `iteratee` for each element.
	 * The iteratee is invoked with three arguments: (value, index|key, collection).
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * **Note:** As with other "Collections" methods, objects with a "length"
	 * property are iterated like arrays. To avoid this behavior use `_.forIn`
	 * or `_.forOwn` for object iteration.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @alias each
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 * @see _.forEachRight
	 * @example
	 *
	 * _.forEach([1, 2], function(value) {
	 *   console.log(value);
	 * });
	 * // => Logs `1` then `2`.
	 *
	 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
	 *   console.log(key);
	 * });
	 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
	 */
	function forEach(collection, iteratee) {
	  var func = isArray(collection) ? arrayEach : baseEach;
	  return func(collection, castFunction(iteratee));
	}
	
	module.exports = forEach;


/***/ },
/* 330 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(331);


/***/ },
/* 331 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEachRight = __webpack_require__(332),
	    baseEachRight = __webpack_require__(333),
	    castFunction = __webpack_require__(181),
	    isArray = __webpack_require__(47);
	
	/**
	 * This method is like `_.forEach` except that it iterates over elements of
	 * `collection` from right to left.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @alias eachRight
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 * @see _.forEach
	 * @example
	 *
	 * _.forEachRight([1, 2], function(value) {
	 *   console.log(value);
	 * });
	 * // => Logs `2` then `1`.
	 */
	function forEachRight(collection, iteratee) {
	  var func = isArray(collection) ? arrayEachRight : baseEachRight;
	  return func(collection, castFunction(iteratee));
	}
	
	module.exports = forEachRight;


/***/ },
/* 332 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.forEachRight` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEachRight(array, iteratee) {
	  var length = array == null ? 0 : array.length;
	
	  while (length--) {
	    if (iteratee(array[length], length, array) === false) {
	      break;
	    }
	  }
	  return array;
	}
	
	module.exports = arrayEachRight;


/***/ },
/* 333 */
/***/ function(module, exports, __webpack_require__) {

	var baseForOwnRight = __webpack_require__(178),
	    createBaseEach = __webpack_require__(327);
	
	/**
	 * The base implementation of `_.forEachRight` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array|Object} Returns `collection`.
	 */
	var baseEachRight = createBaseEach(baseForOwnRight, true);
	
	module.exports = baseEachRight;


/***/ },
/* 334 */
/***/ function(module, exports, __webpack_require__) {

	var arrayEvery = __webpack_require__(335),
	    baseEvery = __webpack_require__(336),
	    baseIteratee = __webpack_require__(153),
	    isArray = __webpack_require__(47),
	    isIterateeCall = __webpack_require__(36);
	
	/**
	 * Checks if `predicate` returns truthy for **all** elements of `collection`.
	 * Iteration is stopped once `predicate` returns falsey. The predicate is
	 * invoked with three arguments: (value, index|key, collection).
	 *
	 * **Note:** This method returns `true` for
	 * [empty collections](https://en.wikipedia.org/wiki/Empty_set) because
	 * [everything is true](https://en.wikipedia.org/wiki/Vacuous_truth) of
	 * elements of empty collections.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	 * @returns {boolean} Returns `true` if all elements pass the predicate check,
	 *  else `false`.
	 * @example
	 *
	 * _.every([true, 1, null, 'yes'], Boolean);
	 * // => false
	 *
	 * var users = [
	 *   { 'user': 'barney', 'age': 36, 'active': false },
	 *   { 'user': 'fred',   'age': 40, 'active': false }
	 * ];
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.every(users, { 'user': 'barney', 'active': false });
	 * // => false
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.every(users, ['active', false]);
	 * // => true
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.every(users, 'active');
	 * // => false
	 */
	function every(collection, predicate, guard) {
	  var func = isArray(collection) ? arrayEvery : baseEvery;
	  if (guard && isIterateeCall(collection, predicate, guard)) {
	    predicate = undefined;
	  }
	  return func(collection, baseIteratee(predicate, 3));
	}
	
	module.exports = every;


/***/ },
/* 335 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.every` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if all elements pass the predicate check,
	 *  else `false`.
	 */
	function arrayEvery(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  while (++index < length) {
	    if (!predicate(array[index], index, array)) {
	      return false;
	    }
	  }
	  return true;
	}
	
	module.exports = arrayEvery;


/***/ },
/* 336 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(326);
	
	/**
	 * The base implementation of `_.every` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if all elements pass the predicate check,
	 *  else `false`
	 */
	function baseEvery(collection, predicate) {
	  var result = true;
	  baseEach(collection, function(value, index, collection) {
	    result = !!predicate(value, index, collection);
	    return result;
	  });
	  return result;
	}
	
	module.exports = baseEvery;


/***/ },
/* 337 */
/***/ function(module, exports, __webpack_require__) {

	var arrayFilter = __webpack_require__(187),
	    baseFilter = __webpack_require__(338),
	    baseIteratee = __webpack_require__(153),
	    isArray = __webpack_require__(47);
	
	/**
	 * Iterates over elements of `collection`, returning an array of all elements
	 * `predicate` returns truthy for. The predicate is invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * **Note:** Unlike `_.remove`, this method returns a new array.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 * @see _.reject
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney', 'age': 36, 'active': true },
	 *   { 'user': 'fred',   'age': 40, 'active': false }
	 * ];
	 *
	 * _.filter(users, function(o) { return !o.active; });
	 * // => objects for ['fred']
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.filter(users, { 'age': 36, 'active': true });
	 * // => objects for ['barney']
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.filter(users, ['active', false]);
	 * // => objects for ['fred']
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.filter(users, 'active');
	 * // => objects for ['barney']
	 */
	function filter(collection, predicate) {
	  var func = isArray(collection) ? arrayFilter : baseFilter;
	  return func(collection, baseIteratee(predicate, 3));
	}
	
	module.exports = filter;


/***/ },
/* 338 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(326);
	
	/**
	 * The base implementation of `_.filter` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function baseFilter(collection, predicate) {
	  var result = [];
	  baseEach(collection, function(value, index, collection) {
	    if (predicate(value, index, collection)) {
	      result.push(value);
	    }
	  });
	  return result;
	}
	
	module.exports = baseFilter;


/***/ },
/* 339 */
/***/ function(module, exports, __webpack_require__) {

	var createFind = __webpack_require__(340),
	    findIndex = __webpack_require__(341);
	
	/**
	 * Iterates over elements of `collection`, returning the first element
	 * `predicate` returns truthy for. The predicate is invoked with three
	 * arguments: (value, index|key, collection).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=0] The index to search from.
	 * @returns {*} Returns the matched element, else `undefined`.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'age': 36, 'active': true },
	 *   { 'user': 'fred',    'age': 40, 'active': false },
	 *   { 'user': 'pebbles', 'age': 1,  'active': true }
	 * ];
	 *
	 * _.find(users, function(o) { return o.age < 40; });
	 * // => object for 'barney'
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.find(users, { 'age': 1, 'active': true });
	 * // => object for 'pebbles'
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.find(users, ['active', false]);
	 * // => object for 'fred'
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.find(users, 'active');
	 * // => object for 'barney'
	 */
	var find = createFind(findIndex);
	
	module.exports = find;


/***/ },
/* 340 */
/***/ function(module, exports, __webpack_require__) {

	var baseIteratee = __webpack_require__(153),
	    isArrayLike = __webpack_require__(37),
	    keys = __webpack_require__(41);
	
	/**
	 * Creates a `_.find` or `_.findLast` function.
	 *
	 * @private
	 * @param {Function} findIndexFunc The function to find the collection index.
	 * @returns {Function} Returns the new find function.
	 */
	function createFind(findIndexFunc) {
	  return function(collection, predicate, fromIndex) {
	    var iterable = Object(collection);
	    if (!isArrayLike(collection)) {
	      var iteratee = baseIteratee(predicate, 3);
	      collection = keys(collection);
	      predicate = function(key) { return iteratee(iterable[key], key, iterable); };
	    }
	    var index = findIndexFunc(collection, predicate, fromIndex);
	    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
	  };
	}
	
	module.exports = createFind;


/***/ },
/* 341 */
/***/ function(module, exports, __webpack_require__) {

	var baseFindIndex = __webpack_require__(342),
	    baseIteratee = __webpack_require__(153),
	    toInteger = __webpack_require__(280);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * This method is like `_.find` except that it returns the index of the first
	 * element `predicate` returns truthy for instead of the element itself.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.1.0
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=0] The index to search from.
	 * @returns {number} Returns the index of the found element, else `-1`.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'active': false },
	 *   { 'user': 'fred',    'active': false },
	 *   { 'user': 'pebbles', 'active': true }
	 * ];
	 *
	 * _.findIndex(users, function(o) { return o.user == 'barney'; });
	 * // => 0
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.findIndex(users, { 'user': 'fred', 'active': false });
	 * // => 1
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.findIndex(users, ['active', false]);
	 * // => 0
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.findIndex(users, 'active');
	 * // => 2
	 */
	function findIndex(array, predicate, fromIndex) {
	  var length = array == null ? 0 : array.length;
	  if (!length) {
	    return -1;
	  }
	  var index = fromIndex == null ? 0 : toInteger(fromIndex);
	  if (index < 0) {
	    index = nativeMax(length + index, 0);
	  }
	  return baseFindIndex(array, baseIteratee(predicate, 3), index);
	}
	
	module.exports = findIndex;


/***/ },
/* 342 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.findIndex` and `_.findLastIndex` without
	 * support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 1 : -1);
	
	  while ((fromRight ? index-- : ++index < length)) {
	    if (predicate(array[index], index, array)) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	module.exports = baseFindIndex;


/***/ },
/* 343 */
/***/ function(module, exports, __webpack_require__) {

	var createFind = __webpack_require__(340),
	    findLastIndex = __webpack_require__(344);
	
	/**
	 * This method is like `_.find` except that it iterates over elements of
	 * `collection` from right to left.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=collection.length-1] The index to search from.
	 * @returns {*} Returns the matched element, else `undefined`.
	 * @example
	 *
	 * _.findLast([1, 2, 3, 4], function(n) {
	 *   return n % 2 == 1;
	 * });
	 * // => 3
	 */
	var findLast = createFind(findLastIndex);
	
	module.exports = findLast;


/***/ },
/* 344 */
/***/ function(module, exports, __webpack_require__) {

	var baseFindIndex = __webpack_require__(342),
	    baseIteratee = __webpack_require__(153),
	    toInteger = __webpack_require__(280);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max,
	    nativeMin = Math.min;
	
	/**
	 * This method is like `_.findIndex` except that it iterates over elements
	 * of `collection` from right to left.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param {number} [fromIndex=array.length-1] The index to search from.
	 * @returns {number} Returns the index of the found element, else `-1`.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'active': true },
	 *   { 'user': 'fred',    'active': false },
	 *   { 'user': 'pebbles', 'active': false }
	 * ];
	 *
	 * _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
	 * // => 2
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.findLastIndex(users, { 'user': 'barney', 'active': true });
	 * // => 0
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.findLastIndex(users, ['active', false]);
	 * // => 2
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.findLastIndex(users, 'active');
	 * // => 0
	 */
	function findLastIndex(array, predicate, fromIndex) {
	  var length = array == null ? 0 : array.length;
	  if (!length) {
	    return -1;
	  }
	  var index = length - 1;
	  if (fromIndex !== undefined) {
	    index = toInteger(fromIndex);
	    index = fromIndex < 0
	      ? nativeMax(length + index, 0)
	      : nativeMin(index, length - 1);
	  }
	  return baseFindIndex(array, baseIteratee(predicate, 3), index, true);
	}
	
	module.exports = findLastIndex;


/***/ },
/* 345 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(103),
	    map = __webpack_require__(346);
	
	/**
	 * Creates a flattened array of values by running each element in `collection`
	 * thru `iteratee` and flattening the mapped results. The iteratee is invoked
	 * with three arguments: (value, index|key, collection).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * function duplicate(n) {
	 *   return [n, n];
	 * }
	 *
	 * _.flatMap([1, 2], duplicate);
	 * // => [1, 1, 2, 2]
	 */
	function flatMap(collection, iteratee) {
	  return baseFlatten(map(collection, iteratee), 1);
	}
	
	module.exports = flatMap;


/***/ },
/* 346 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99),
	    baseIteratee = __webpack_require__(153),
	    baseMap = __webpack_require__(347),
	    isArray = __webpack_require__(47);
	
	/**
	 * Creates an array of values by running each element in `collection` thru
	 * `iteratee`. The iteratee is invoked with three arguments:
	 * (value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	 *
	 * The guarded methods are:
	 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
	 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
	 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
	 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 * @example
	 *
	 * function square(n) {
	 *   return n * n;
	 * }
	 *
	 * _.map([4, 8], square);
	 * // => [16, 64]
	 *
	 * _.map({ 'a': 4, 'b': 8 }, square);
	 * // => [16, 64] (iteration order is not guaranteed)
	 *
	 * var users = [
	 *   { 'user': 'barney' },
	 *   { 'user': 'fred' }
	 * ];
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.map(users, 'user');
	 * // => ['barney', 'fred']
	 */
	function map(collection, iteratee) {
	  var func = isArray(collection) ? arrayMap : baseMap;
	  return func(collection, baseIteratee(iteratee, 3));
	}
	
	module.exports = map;


/***/ },
/* 347 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(326),
	    isArrayLike = __webpack_require__(37);
	
	/**
	 * The base implementation of `_.map` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function baseMap(collection, iteratee) {
	  var index = -1,
	      result = isArrayLike(collection) ? Array(collection.length) : [];
	
	  baseEach(collection, function(value, key, collection) {
	    result[++index] = iteratee(value, key, collection);
	  });
	  return result;
	}
	
	module.exports = baseMap;


/***/ },
/* 348 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(103),
	    map = __webpack_require__(346);
	
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;
	
	/**
	 * This method is like `_.flatMap` except that it recursively flattens the
	 * mapped results.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.7.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * function duplicate(n) {
	 *   return [[[n, n]]];
	 * }
	 *
	 * _.flatMapDeep([1, 2], duplicate);
	 * // => [1, 1, 2, 2]
	 */
	function flatMapDeep(collection, iteratee) {
	  return baseFlatten(map(collection, iteratee), INFINITY);
	}
	
	module.exports = flatMapDeep;


/***/ },
/* 349 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(103),
	    map = __webpack_require__(346),
	    toInteger = __webpack_require__(280);
	
	/**
	 * This method is like `_.flatMap` except that it recursively flattens the
	 * mapped results up to `depth` times.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.7.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {number} [depth=1] The maximum recursion depth.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * function duplicate(n) {
	 *   return [[[n, n]]];
	 * }
	 *
	 * _.flatMapDepth([1, 2], duplicate, 2);
	 * // => [[1, 1], [2, 2]]
	 */
	function flatMapDepth(collection, iteratee, depth) {
	  depth = depth === undefined ? 1 : toInteger(depth);
	  return baseFlatten(map(collection, iteratee), depth);
	}
	
	module.exports = flatMapDepth;


/***/ },
/* 350 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    createAggregator = __webpack_require__(323);
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Creates an object composed of keys generated from the results of running
	 * each element of `collection` thru `iteratee`. The order of grouped values
	 * is determined by the order they occur in `collection`. The corresponding
	 * value of each key is an array of elements responsible for generating the
	 * key. The iteratee is invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
	 * @returns {Object} Returns the composed aggregate object.
	 * @example
	 *
	 * _.groupBy([6.1, 4.2, 6.3], Math.floor);
	 * // => { '4': [4.2], '6': [6.1, 6.3] }
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.groupBy(['one', 'two', 'three'], 'length');
	 * // => { '3': ['one', 'two'], '5': ['three'] }
	 */
	var groupBy = createAggregator(function(result, value, key) {
	  if (hasOwnProperty.call(result, key)) {
	    result[key].push(value);
	  } else {
	    baseAssignValue(result, key, [value]);
	  }
	});
	
	module.exports = groupBy;


/***/ },
/* 351 */
/***/ function(module, exports, __webpack_require__) {

	var baseIndexOf = __webpack_require__(352),
	    isArrayLike = __webpack_require__(37),
	    isString = __webpack_require__(297),
	    toInteger = __webpack_require__(280),
	    values = __webpack_require__(241);
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * Checks if `value` is in `collection`. If `collection` is a string, it's
	 * checked for a substring of `value`, otherwise
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * is used for equality comparisons. If `fromIndex` is negative, it's used as
	 * the offset from the end of `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} [fromIndex=0] The index to search from.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
	 * @returns {boolean} Returns `true` if `value` is found, else `false`.
	 * @example
	 *
	 * _.includes([1, 2, 3], 1);
	 * // => true
	 *
	 * _.includes([1, 2, 3], 1, 2);
	 * // => false
	 *
	 * _.includes({ 'a': 1, 'b': 2 }, 1);
	 * // => true
	 *
	 * _.includes('abcd', 'bc');
	 * // => true
	 */
	function includes(collection, value, fromIndex, guard) {
	  collection = isArrayLike(collection) ? collection : values(collection);
	  fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;
	
	  var length = collection.length;
	  if (fromIndex < 0) {
	    fromIndex = nativeMax(length + fromIndex, 0);
	  }
	  return isString(collection)
	    ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
	    : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
	}
	
	module.exports = includes;


/***/ },
/* 352 */
/***/ function(module, exports, __webpack_require__) {

	var baseFindIndex = __webpack_require__(342),
	    baseIsNaN = __webpack_require__(353),
	    strictIndexOf = __webpack_require__(354);
	
	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  return value === value
	    ? strictIndexOf(array, value, fromIndex)
	    : baseFindIndex(array, baseIsNaN, fromIndex);
	}
	
	module.exports = baseIndexOf;


/***/ },
/* 353 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.isNaN` without support for number objects.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 */
	function baseIsNaN(value) {
	  return value !== value;
	}
	
	module.exports = baseIsNaN;


/***/ },
/* 354 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.indexOf` which performs strict equality
	 * comparisons of values, i.e. `===`.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function strictIndexOf(array, value, fromIndex) {
	  var index = fromIndex - 1,
	      length = array.length;
	
	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	module.exports = strictIndexOf;


/***/ },
/* 355 */
/***/ function(module, exports, __webpack_require__) {

	var apply = __webpack_require__(31),
	    baseEach = __webpack_require__(326),
	    baseInvoke = __webpack_require__(196),
	    baseRest = __webpack_require__(28),
	    isArrayLike = __webpack_require__(37);
	
	/**
	 * Invokes the method at `path` of each element in `collection`, returning
	 * an array of the results of each invoked method. Any additional arguments
	 * are provided to each invoked method. If `path` is a function, it's invoked
	 * for, and `this` bound to, each element in `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Array|Function|string} path The path of the method to invoke or
	 *  the function invoked per iteration.
	 * @param {...*} [args] The arguments to invoke each method with.
	 * @returns {Array} Returns the array of results.
	 * @example
	 *
	 * _.invokeMap([[5, 1, 7], [3, 2, 1]], 'sort');
	 * // => [[1, 5, 7], [1, 2, 3]]
	 *
	 * _.invokeMap([123, 456], String.prototype.split, '');
	 * // => [['1', '2', '3'], ['4', '5', '6']]
	 */
	var invokeMap = baseRest(function(collection, path, args) {
	  var index = -1,
	      isFunc = typeof path == 'function',
	      result = isArrayLike(collection) ? Array(collection.length) : [];
	
	  baseEach(collection, function(value) {
	    result[++index] = isFunc ? apply(path, value, args) : baseInvoke(value, path, args);
	  });
	  return result;
	});
	
	module.exports = invokeMap;


/***/ },
/* 356 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(9),
	    createAggregator = __webpack_require__(323);
	
	/**
	 * Creates an object composed of keys generated from the results of running
	 * each element of `collection` thru `iteratee`. The corresponding value of
	 * each key is the last element responsible for generating the key. The
	 * iteratee is invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
	 * @returns {Object} Returns the composed aggregate object.
	 * @example
	 *
	 * var array = [
	 *   { 'dir': 'left', 'code': 97 },
	 *   { 'dir': 'right', 'code': 100 }
	 * ];
	 *
	 * _.keyBy(array, function(o) {
	 *   return String.fromCharCode(o.code);
	 * });
	 * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
	 *
	 * _.keyBy(array, 'dir');
	 * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
	 */
	var keyBy = createAggregator(function(result, value, key) {
	  baseAssignValue(result, key, value);
	});
	
	module.exports = keyBy;


/***/ },
/* 357 */
/***/ function(module, exports, __webpack_require__) {

	var baseOrderBy = __webpack_require__(358),
	    isArray = __webpack_require__(47);
	
	/**
	 * This method is like `_.sortBy` except that it allows specifying the sort
	 * orders of the iteratees to sort by. If `orders` is unspecified, all values
	 * are sorted in ascending order. Otherwise, specify an order of "desc" for
	 * descending or "asc" for ascending sort order of corresponding values.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Array[]|Function[]|Object[]|string[]} [iteratees=[_.identity]]
	 *  The iteratees to sort by.
	 * @param {string[]} [orders] The sort orders of `iteratees`.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
	 * @returns {Array} Returns the new sorted array.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'fred',   'age': 48 },
	 *   { 'user': 'barney', 'age': 34 },
	 *   { 'user': 'fred',   'age': 40 },
	 *   { 'user': 'barney', 'age': 36 }
	 * ];
	 *
	 * // Sort by `user` in ascending order and by `age` in descending order.
	 * _.orderBy(users, ['user', 'age'], ['asc', 'desc']);
	 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
	 */
	function orderBy(collection, iteratees, orders, guard) {
	  if (collection == null) {
	    return [];
	  }
	  if (!isArray(iteratees)) {
	    iteratees = iteratees == null ? [] : [iteratees];
	  }
	  orders = guard ? undefined : orders;
	  if (!isArray(orders)) {
	    orders = orders == null ? [] : [orders];
	  }
	  return baseOrderBy(collection, iteratees, orders);
	}
	
	module.exports = orderBy;


/***/ },
/* 358 */
/***/ function(module, exports, __webpack_require__) {

	var arrayMap = __webpack_require__(99),
	    baseIteratee = __webpack_require__(153),
	    baseMap = __webpack_require__(347),
	    baseSortBy = __webpack_require__(359),
	    baseUnary = __webpack_require__(53),
	    compareMultiple = __webpack_require__(360),
	    identity = __webpack_require__(29);
	
	/**
	 * The base implementation of `_.orderBy` without param guards.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
	 * @param {string[]} orders The sort orders of `iteratees`.
	 * @returns {Array} Returns the new sorted array.
	 */
	function baseOrderBy(collection, iteratees, orders) {
	  var index = -1;
	  iteratees = arrayMap(iteratees.length ? iteratees : [identity], baseUnary(baseIteratee));
	
	  var result = baseMap(collection, function(value, key, collection) {
	    var criteria = arrayMap(iteratees, function(iteratee) {
	      return iteratee(value);
	    });
	    return { 'criteria': criteria, 'index': ++index, 'value': value };
	  });
	
	  return baseSortBy(result, function(object, other) {
	    return compareMultiple(object, other, orders);
	  });
	}
	
	module.exports = baseOrderBy;


/***/ },
/* 359 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.sortBy` which uses `comparer` to define the
	 * sort order of `array` and replaces criteria objects with their corresponding
	 * values.
	 *
	 * @private
	 * @param {Array} array The array to sort.
	 * @param {Function} comparer The function to define sort order.
	 * @returns {Array} Returns `array`.
	 */
	function baseSortBy(array, comparer) {
	  var length = array.length;
	
	  array.sort(comparer);
	  while (length--) {
	    array[length] = array[length].value;
	  }
	  return array;
	}
	
	module.exports = baseSortBy;


/***/ },
/* 360 */
/***/ function(module, exports, __webpack_require__) {

	var compareAscending = __webpack_require__(361);
	
	/**
	 * Used by `_.orderBy` to compare multiple properties of a value to another
	 * and stable sort them.
	 *
	 * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
	 * specify an order of "desc" for descending or "asc" for ascending sort order
	 * of corresponding values.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {boolean[]|string[]} orders The order to sort by for each property.
	 * @returns {number} Returns the sort order indicator for `object`.
	 */
	function compareMultiple(object, other, orders) {
	  var index = -1,
	      objCriteria = object.criteria,
	      othCriteria = other.criteria,
	      length = objCriteria.length,
	      ordersLength = orders.length;
	
	  while (++index < length) {
	    var result = compareAscending(objCriteria[index], othCriteria[index]);
	    if (result) {
	      if (index >= ordersLength) {
	        return result;
	      }
	      var order = orders[index];
	      return result * (order == 'desc' ? -1 : 1);
	    }
	  }
	  // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
	  // that causes it, under certain circumstances, to provide the same value for
	  // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
	  // for more details.
	  //
	  // This also ensures a stable sort in V8 and other engines.
	  // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
	  return object.index - other.index;
	}
	
	module.exports = compareMultiple;


/***/ },
/* 361 */
/***/ function(module, exports, __webpack_require__) {

	var isSymbol = __webpack_require__(70);
	
	/**
	 * Compares values to sort them in ascending order.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {number} Returns the sort order indicator for `value`.
	 */
	function compareAscending(value, other) {
	  if (value !== other) {
	    var valIsDefined = value !== undefined,
	        valIsNull = value === null,
	        valIsReflexive = value === value,
	        valIsSymbol = isSymbol(value);
	
	    var othIsDefined = other !== undefined,
	        othIsNull = other === null,
	        othIsReflexive = other === other,
	        othIsSymbol = isSymbol(other);
	
	    if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
	        (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
	        (valIsNull && othIsDefined && othIsReflexive) ||
	        (!valIsDefined && othIsReflexive) ||
	        !valIsReflexive) {
	      return 1;
	    }
	    if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
	        (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
	        (othIsNull && valIsDefined && valIsReflexive) ||
	        (!othIsDefined && valIsReflexive) ||
	        !othIsReflexive) {
	      return -1;
	    }
	  }
	  return 0;
	}
	
	module.exports = compareAscending;


/***/ },
/* 362 */
/***/ function(module, exports, __webpack_require__) {

	var createAggregator = __webpack_require__(323);
	
	/**
	 * Creates an array of elements split into two groups, the first of which
	 * contains elements `predicate` returns truthy for, the second of which
	 * contains elements `predicate` returns falsey for. The predicate is
	 * invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the array of grouped elements.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney',  'age': 36, 'active': false },
	 *   { 'user': 'fred',    'age': 40, 'active': true },
	 *   { 'user': 'pebbles', 'age': 1,  'active': false }
	 * ];
	 *
	 * _.partition(users, function(o) { return o.active; });
	 * // => objects for [['fred'], ['barney', 'pebbles']]
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.partition(users, { 'age': 1, 'active': false });
	 * // => objects for [['pebbles'], ['barney', 'fred']]
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.partition(users, ['active', false]);
	 * // => objects for [['barney', 'pebbles'], ['fred']]
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.partition(users, 'active');
	 * // => objects for [['fred'], ['barney', 'pebbles']]
	 */
	var partition = createAggregator(function(result, value, key) {
	  result[key ? 0 : 1].push(value);
	}, function() { return [[], []]; });
	
	module.exports = partition;


/***/ },
/* 363 */
/***/ function(module, exports, __webpack_require__) {

	var arrayReduce = __webpack_require__(220),
	    baseEach = __webpack_require__(326),
	    baseIteratee = __webpack_require__(153),
	    baseReduce = __webpack_require__(364),
	    isArray = __webpack_require__(47);
	
	/**
	 * Reduces `collection` to a value which is the accumulated result of running
	 * each element in `collection` thru `iteratee`, where each successive
	 * invocation is supplied the return value of the previous. If `accumulator`
	 * is not given, the first element of `collection` is used as the initial
	 * value. The iteratee is invoked with four arguments:
	 * (accumulator, value, index|key, collection).
	 *
	 * Many lodash methods are guarded to work as iteratees for methods like
	 * `_.reduce`, `_.reduceRight`, and `_.transform`.
	 *
	 * The guarded methods are:
	 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
	 * and `sortBy`
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @returns {*} Returns the accumulated value.
	 * @see _.reduceRight
	 * @example
	 *
	 * _.reduce([1, 2], function(sum, n) {
	 *   return sum + n;
	 * }, 0);
	 * // => 3
	 *
	 * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
	 *   (result[value] || (result[value] = [])).push(key);
	 *   return result;
	 * }, {});
	 * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
	 */
	function reduce(collection, iteratee, accumulator) {
	  var func = isArray(collection) ? arrayReduce : baseReduce,
	      initAccum = arguments.length < 3;
	
	  return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEach);
	}
	
	module.exports = reduce;


/***/ },
/* 364 */
/***/ function(module, exports) {

	/**
	 * The base implementation of `_.reduce` and `_.reduceRight`, without support
	 * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} accumulator The initial value.
	 * @param {boolean} initAccum Specify using the first or last element of
	 *  `collection` as the initial value.
	 * @param {Function} eachFunc The function to iterate over `collection`.
	 * @returns {*} Returns the accumulated value.
	 */
	function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
	  eachFunc(collection, function(value, index, collection) {
	    accumulator = initAccum
	      ? (initAccum = false, value)
	      : iteratee(accumulator, value, index, collection);
	  });
	  return accumulator;
	}
	
	module.exports = baseReduce;


/***/ },
/* 365 */
/***/ function(module, exports, __webpack_require__) {

	var arrayReduceRight = __webpack_require__(366),
	    baseEachRight = __webpack_require__(333),
	    baseIteratee = __webpack_require__(153),
	    baseReduce = __webpack_require__(364),
	    isArray = __webpack_require__(47);
	
	/**
	 * This method is like `_.reduce` except that it iterates over elements of
	 * `collection` from right to left.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @returns {*} Returns the accumulated value.
	 * @see _.reduce
	 * @example
	 *
	 * var array = [[0, 1], [2, 3], [4, 5]];
	 *
	 * _.reduceRight(array, function(flattened, other) {
	 *   return flattened.concat(other);
	 * }, []);
	 * // => [4, 5, 2, 3, 0, 1]
	 */
	function reduceRight(collection, iteratee, accumulator) {
	  var func = isArray(collection) ? arrayReduceRight : baseReduce,
	      initAccum = arguments.length < 3;
	
	  return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEachRight);
	}
	
	module.exports = reduceRight;


/***/ },
/* 366 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.reduceRight` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initAccum] Specify using the last element of `array` as
	 *  the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduceRight(array, iteratee, accumulator, initAccum) {
	  var length = array == null ? 0 : array.length;
	  if (initAccum && length) {
	    accumulator = array[--length];
	  }
	  while (length--) {
	    accumulator = iteratee(accumulator, array[length], length, array);
	  }
	  return accumulator;
	}
	
	module.exports = arrayReduceRight;


/***/ },
/* 367 */
/***/ function(module, exports, __webpack_require__) {

	var arrayFilter = __webpack_require__(187),
	    baseFilter = __webpack_require__(338),
	    baseIteratee = __webpack_require__(153),
	    isArray = __webpack_require__(47),
	    negate = __webpack_require__(227);
	
	/**
	 * The opposite of `_.filter`; this method returns the elements of `collection`
	 * that `predicate` does **not** return truthy for.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 * @see _.filter
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'barney', 'age': 36, 'active': false },
	 *   { 'user': 'fred',   'age': 40, 'active': true }
	 * ];
	 *
	 * _.reject(users, function(o) { return !o.active; });
	 * // => objects for ['fred']
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.reject(users, { 'age': 40, 'active': true });
	 * // => objects for ['barney']
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.reject(users, ['active', false]);
	 * // => objects for ['fred']
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.reject(users, 'active');
	 * // => objects for ['barney']
	 */
	function reject(collection, predicate) {
	  var func = isArray(collection) ? arrayFilter : baseFilter;
	  return func(collection, negate(baseIteratee(predicate, 3)));
	}
	
	module.exports = reject;


/***/ },
/* 368 */
/***/ function(module, exports, __webpack_require__) {

	var arraySample = __webpack_require__(369),
	    baseSample = __webpack_require__(371),
	    isArray = __webpack_require__(47);
	
	/**
	 * Gets a random element from `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to sample.
	 * @returns {*} Returns the random element.
	 * @example
	 *
	 * _.sample([1, 2, 3, 4]);
	 * // => 2
	 */
	function sample(collection) {
	  var func = isArray(collection) ? arraySample : baseSample;
	  return func(collection);
	}
	
	module.exports = sample;


/***/ },
/* 369 */
/***/ function(module, exports, __webpack_require__) {

	var baseRandom = __webpack_require__(370);
	
	/**
	 * A specialized version of `_.sample` for arrays.
	 *
	 * @private
	 * @param {Array} array The array to sample.
	 * @returns {*} Returns the random element.
	 */
	function arraySample(array) {
	  var length = array.length;
	  return length ? array[baseRandom(0, length - 1)] : undefined;
	}
	
	module.exports = arraySample;


/***/ },
/* 370 */
/***/ function(module, exports) {

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeFloor = Math.floor,
	    nativeRandom = Math.random;
	
	/**
	 * The base implementation of `_.random` without support for returning
	 * floating-point numbers.
	 *
	 * @private
	 * @param {number} lower The lower bound.
	 * @param {number} upper The upper bound.
	 * @returns {number} Returns the random number.
	 */
	function baseRandom(lower, upper) {
	  return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
	}
	
	module.exports = baseRandom;


/***/ },
/* 371 */
/***/ function(module, exports, __webpack_require__) {

	var arraySample = __webpack_require__(369),
	    values = __webpack_require__(241);
	
	/**
	 * The base implementation of `_.sample`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to sample.
	 * @returns {*} Returns the random element.
	 */
	function baseSample(collection) {
	  return arraySample(values(collection));
	}
	
	module.exports = baseSample;


/***/ },
/* 372 */
/***/ function(module, exports, __webpack_require__) {

	var arraySampleSize = __webpack_require__(373),
	    baseSampleSize = __webpack_require__(375),
	    isArray = __webpack_require__(47),
	    isIterateeCall = __webpack_require__(36),
	    toInteger = __webpack_require__(280);
	
	/**
	 * Gets `n` random elements at unique keys from `collection` up to the
	 * size of `collection`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to sample.
	 * @param {number} [n=1] The number of elements to sample.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	 * @returns {Array} Returns the random elements.
	 * @example
	 *
	 * _.sampleSize([1, 2, 3], 2);
	 * // => [3, 1]
	 *
	 * _.sampleSize([1, 2, 3], 4);
	 * // => [2, 3, 1]
	 */
	function sampleSize(collection, n, guard) {
	  if ((guard ? isIterateeCall(collection, n, guard) : n === undefined)) {
	    n = 1;
	  } else {
	    n = toInteger(n);
	  }
	  var func = isArray(collection) ? arraySampleSize : baseSampleSize;
	  return func(collection, n);
	}
	
	module.exports = sampleSize;


/***/ },
/* 373 */
/***/ function(module, exports, __webpack_require__) {

	var baseClamp = __webpack_require__(311),
	    copyArray = __webpack_require__(128),
	    shuffleSelf = __webpack_require__(374);
	
	/**
	 * A specialized version of `_.sampleSize` for arrays.
	 *
	 * @private
	 * @param {Array} array The array to sample.
	 * @param {number} n The number of elements to sample.
	 * @returns {Array} Returns the random elements.
	 */
	function arraySampleSize(array, n) {
	  return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
	}
	
	module.exports = arraySampleSize;


/***/ },
/* 374 */
/***/ function(module, exports, __webpack_require__) {

	var baseRandom = __webpack_require__(370);
	
	/**
	 * A specialized version of `_.shuffle` which mutates and sets the size of `array`.
	 *
	 * @private
	 * @param {Array} array The array to shuffle.
	 * @param {number} [size=array.length] The size of `array`.
	 * @returns {Array} Returns `array`.
	 */
	function shuffleSelf(array, size) {
	  var index = -1,
	      length = array.length,
	      lastIndex = length - 1;
	
	  size = size === undefined ? length : size;
	  while (++index < size) {
	    var rand = baseRandom(index, lastIndex),
	        value = array[rand];
	
	    array[rand] = array[index];
	    array[index] = value;
	  }
	  array.length = size;
	  return array;
	}
	
	module.exports = shuffleSelf;


/***/ },
/* 375 */
/***/ function(module, exports, __webpack_require__) {

	var baseClamp = __webpack_require__(311),
	    shuffleSelf = __webpack_require__(374),
	    values = __webpack_require__(241);
	
	/**
	 * The base implementation of `_.sampleSize` without param guards.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to sample.
	 * @param {number} n The number of elements to sample.
	 * @returns {Array} Returns the random elements.
	 */
	function baseSampleSize(collection, n) {
	  var array = values(collection);
	  return shuffleSelf(array, baseClamp(n, 0, array.length));
	}
	
	module.exports = baseSampleSize;


/***/ },
/* 376 */
/***/ function(module, exports, __webpack_require__) {

	var arrayShuffle = __webpack_require__(377),
	    baseShuffle = __webpack_require__(378),
	    isArray = __webpack_require__(47);
	
	/**
	 * Creates an array of shuffled values, using a version of the
	 * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to shuffle.
	 * @returns {Array} Returns the new shuffled array.
	 * @example
	 *
	 * _.shuffle([1, 2, 3, 4]);
	 * // => [4, 1, 3, 2]
	 */
	function shuffle(collection) {
	  var func = isArray(collection) ? arrayShuffle : baseShuffle;
	  return func(collection);
	}
	
	module.exports = shuffle;


/***/ },
/* 377 */
/***/ function(module, exports, __webpack_require__) {

	var copyArray = __webpack_require__(128),
	    shuffleSelf = __webpack_require__(374);
	
	/**
	 * A specialized version of `_.shuffle` for arrays.
	 *
	 * @private
	 * @param {Array} array The array to shuffle.
	 * @returns {Array} Returns the new shuffled array.
	 */
	function arrayShuffle(array) {
	  return shuffleSelf(copyArray(array));
	}
	
	module.exports = arrayShuffle;


/***/ },
/* 378 */
/***/ function(module, exports, __webpack_require__) {

	var shuffleSelf = __webpack_require__(374),
	    values = __webpack_require__(241);
	
	/**
	 * The base implementation of `_.shuffle`.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to shuffle.
	 * @returns {Array} Returns the new shuffled array.
	 */
	function baseShuffle(collection) {
	  return shuffleSelf(values(collection));
	}
	
	module.exports = baseShuffle;


/***/ },
/* 379 */
/***/ function(module, exports, __webpack_require__) {

	var baseKeys = __webpack_require__(55),
	    getTag = __webpack_require__(139),
	    isArrayLike = __webpack_require__(37),
	    isString = __webpack_require__(297),
	    stringSize = __webpack_require__(380);
	
	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    setTag = '[object Set]';
	
	/**
	 * Gets the size of `collection` by returning its length for array-like
	 * values or the number of own enumerable string keyed properties for objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object|string} collection The collection to inspect.
	 * @returns {number} Returns the collection size.
	 * @example
	 *
	 * _.size([1, 2, 3]);
	 * // => 3
	 *
	 * _.size({ 'a': 1, 'b': 2 });
	 * // => 2
	 *
	 * _.size('pebbles');
	 * // => 7
	 */
	function size(collection) {
	  if (collection == null) {
	    return 0;
	  }
	  if (isArrayLike(collection)) {
	    return isString(collection) ? stringSize(collection) : collection.length;
	  }
	  var tag = getTag(collection);
	  if (tag == mapTag || tag == setTag) {
	    return collection.size;
	  }
	  return baseKeys(collection).length;
	}
	
	module.exports = size;


/***/ },
/* 380 */
/***/ function(module, exports, __webpack_require__) {

	var asciiSize = __webpack_require__(381),
	    hasUnicode = __webpack_require__(308),
	    unicodeSize = __webpack_require__(382);
	
	/**
	 * Gets the number of symbols in `string`.
	 *
	 * @private
	 * @param {string} string The string to inspect.
	 * @returns {number} Returns the string size.
	 */
	function stringSize(string) {
	  return hasUnicode(string)
	    ? unicodeSize(string)
	    : asciiSize(string);
	}
	
	module.exports = stringSize;


/***/ },
/* 381 */
/***/ function(module, exports, __webpack_require__) {

	var baseProperty = __webpack_require__(175);
	
	/**
	 * Gets the size of an ASCII `string`.
	 *
	 * @private
	 * @param {string} string The string inspect.
	 * @returns {number} Returns the string size.
	 */
	var asciiSize = baseProperty('length');
	
	module.exports = asciiSize;


/***/ },
/* 382 */
/***/ function(module, exports) {

	/** Used to compose unicode character classes. */
	var rsAstralRange = '\\ud800-\\udfff',
	    rsComboMarksRange = '\\u0300-\\u036f',
	    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
	    rsComboSymbolsRange = '\\u20d0-\\u20ff',
	    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
	    rsVarRange = '\\ufe0e\\ufe0f';
	
	/** Used to compose unicode capture groups. */
	var rsAstral = '[' + rsAstralRange + ']',
	    rsCombo = '[' + rsComboRange + ']',
	    rsFitz = '\\ud83c[\\udffb-\\udfff]',
	    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
	    rsNonAstral = '[^' + rsAstralRange + ']',
	    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
	    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
	    rsZWJ = '\\u200d';
	
	/** Used to compose unicode regexes. */
	var reOptMod = rsModifier + '?',
	    rsOptVar = '[' + rsVarRange + ']?',
	    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
	    rsSeq = rsOptVar + reOptMod + rsOptJoin,
	    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
	
	/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
	var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');
	
	/**
	 * Gets the size of a Unicode `string`.
	 *
	 * @private
	 * @param {string} string The string inspect.
	 * @returns {number} Returns the string size.
	 */
	function unicodeSize(string) {
	  var result = reUnicode.lastIndex = 0;
	  while (reUnicode.test(string)) {
	    ++result;
	  }
	  return result;
	}
	
	module.exports = unicodeSize;


/***/ },
/* 383 */
/***/ function(module, exports, __webpack_require__) {

	var arraySome = __webpack_require__(162),
	    baseIteratee = __webpack_require__(153),
	    baseSome = __webpack_require__(384),
	    isArray = __webpack_require__(47),
	    isIterateeCall = __webpack_require__(36);
	
	/**
	 * Checks if `predicate` returns truthy for **any** element of `collection`.
	 * Iteration is stopped once `predicate` returns truthy. The predicate is
	 * invoked with three arguments: (value, index|key, collection).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} [predicate=_.identity] The function invoked per iteration.
	 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 * @example
	 *
	 * _.some([null, 0, 'yes', false], Boolean);
	 * // => true
	 *
	 * var users = [
	 *   { 'user': 'barney', 'active': true },
	 *   { 'user': 'fred',   'active': false }
	 * ];
	 *
	 * // The `_.matches` iteratee shorthand.
	 * _.some(users, { 'user': 'barney', 'active': false });
	 * // => false
	 *
	 * // The `_.matchesProperty` iteratee shorthand.
	 * _.some(users, ['active', false]);
	 * // => true
	 *
	 * // The `_.property` iteratee shorthand.
	 * _.some(users, 'active');
	 * // => true
	 */
	function some(collection, predicate, guard) {
	  var func = isArray(collection) ? arraySome : baseSome;
	  if (guard && isIterateeCall(collection, predicate, guard)) {
	    predicate = undefined;
	  }
	  return func(collection, baseIteratee(predicate, 3));
	}
	
	module.exports = some;


/***/ },
/* 384 */
/***/ function(module, exports, __webpack_require__) {

	var baseEach = __webpack_require__(326);
	
	/**
	 * The base implementation of `_.some` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function baseSome(collection, predicate) {
	  var result;
	
	  baseEach(collection, function(value, index, collection) {
	    result = predicate(value, index, collection);
	    return !result;
	  });
	  return !!result;
	}
	
	module.exports = baseSome;


/***/ },
/* 385 */
/***/ function(module, exports, __webpack_require__) {

	var baseFlatten = __webpack_require__(103),
	    baseOrderBy = __webpack_require__(358),
	    baseRest = __webpack_require__(28),
	    isIterateeCall = __webpack_require__(36);
	
	/**
	 * Creates an array of elements, sorted in ascending order by the results of
	 * running each element in a collection thru each iteratee. This method
	 * performs a stable sort, that is, it preserves the original sort order of
	 * equal elements. The iteratees are invoked with one argument: (value).
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Collection
	 * @param {Array|Object} collection The collection to iterate over.
	 * @param {...(Function|Function[])} [iteratees=[_.identity]]
	 *  The iteratees to sort by.
	 * @returns {Array} Returns the new sorted array.
	 * @example
	 *
	 * var users = [
	 *   { 'user': 'fred',   'age': 48 },
	 *   { 'user': 'barney', 'age': 36 },
	 *   { 'user': 'fred',   'age': 40 },
	 *   { 'user': 'barney', 'age': 34 }
	 * ];
	 *
	 * _.sortBy(users, [function(o) { return o.user; }]);
	 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
	 *
	 * _.sortBy(users, ['user', 'age']);
	 * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
	 */
	var sortBy = baseRest(function(collection, iteratees) {
	  if (collection == null) {
	    return [];
	  }
	  var length = iteratees.length;
	  if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
	    iteratees = [];
	  } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
	    iteratees = [iteratees[0]];
	  }
	  return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
	});
	
	module.exports = sortBy;


/***/ },
/* 386 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'iconLoader' ],
	  iconLoader: [ 'type', __webpack_require__(387) ],
	  __depends__: [
	    __webpack_require__(429)
	  ]
	};

/***/ },
/* 387 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var forIn = __webpack_require__(6).forIn,
	  xml2js = __webpack_require__(388),
	  isUndefined = __webpack_require__(255).isUndefined
	  ;
	
	/**
	 * The icon loader module.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Icons} icons
	 * @param {Canvas} canvas
	 */
	function IconLoader(icons, canvas) {
	  this._icons = icons;
	  this._canvas = canvas;
	  this._processedIcons = {};
	
	  this._init();
	}
	
	IconLoader.$inject = [ 'icons', 'canvas' ];
	
	module.exports = IconLoader;
	
	IconLoader.prototype._createNode = function(iconKey, defsNode, parentNode, nodeObj, nodeType) {
	  var that = this,
	    attrs = nodeObj.$ || {},
	    thisNode = {};
	
	  if (isUndefined(attrs.id)) {
	    thisNode = parentNode.append(nodeType);
	    forIn(attrs, function(n, k){
	      thisNode.attr(k, n);
	    });
	  } else {
	    thisNode = defsNode.append(nodeType);
	    forIn(attrs, function(n, k){
	      thisNode.attr(k, n);
	    });
	    thisNode.attr('id', iconKey + '_' + attrs.id);
	  }
	  if (!isUndefined(attrs['xlink:href'])) {
	    thisNode.attr('xlink:href', attrs['xlink:href'].replace('#','#'+iconKey+'_'));
	  }
	  if (!isUndefined(attrs['clip-path'])) {
	    thisNode.attr('clip-path', attrs['clip-path'].replace('#','#'+iconKey+'_'));
	  }
	
	  forIn(nodeObj.$$, function(node){
	    if (node['#name']=='defs'){
	      forIn(node.$$, function (nodeDef){
	        that._createNode(iconKey, defsNode, defsNode, nodeDef, nodeDef['#name']);
	      });
	    } else {
	      that._createNode(iconKey, defsNode, thisNode, node, node['#name']);
	    }
	  });
	  return thisNode;
	};
	
	IconLoader.prototype._init = function() {
	  var svg = this._canvas.getSVG(),
	    iconObj = svg.append('defs'),
	    that = this;
	
	  // create the icons definitions
	  forIn(this._icons, function(icon, iconKey){
	    var parser = new xml2js.Parser({normalizeTags: true, preserveChildrenOrder: true, explicitChildren: true });
	    parser.parseString(icon, function (err, result) {
	      if (!err){
	        var iconNode = that._createNode(iconKey, iconObj, iconObj, result.svg, 'symbol');
	        iconNode.attr('id', iconKey + '_icon_def');
	        that._processedIcons[iconKey] = result.svg.$.viewBox || '';
	      }
	    });
	  });
	};

/***/ },
/* 388 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.10.0
	(function() {
	  "use strict";
	  var bom, builder, escapeCDATA, events, isEmpty, processName, processors, requiresCDATA, sax, setImmediate, wrapCDATA,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty,
	    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
	
	  sax = __webpack_require__(389);
	
	  events = __webpack_require__(395);
	
	  builder = __webpack_require__(410);
	
	  bom = __webpack_require__(427);
	
	  processors = __webpack_require__(428);
	
	  setImmediate = __webpack_require__(246).setImmediate;
	
	  isEmpty = function(thing) {
	    return typeof thing === "object" && (thing != null) && Object.keys(thing).length === 0;
	  };
	
	  processName = function(processors, processedName) {
	    var i, len, process;
	    for (i = 0, len = processors.length; i < len; i++) {
	      process = processors[i];
	      processedName = process(processedName);
	    }
	    return processedName;
	  };
	
	  requiresCDATA = function(entry) {
	    return entry.indexOf('&') >= 0 || entry.indexOf('>') >= 0 || entry.indexOf('<') >= 0;
	  };
	
	  wrapCDATA = function(entry) {
	    return "<![CDATA[" + (escapeCDATA(entry)) + "]]>";
	  };
	
	  escapeCDATA = function(entry) {
	    return entry.replace(']]>', ']]]]><![CDATA[>');
	  };
	
	  exports.processors = processors;
	
	  exports.defaults = {
	    "0.1": {
	      explicitCharkey: false,
	      trim: true,
	      normalize: true,
	      normalizeTags: false,
	      attrkey: "@",
	      charkey: "#",
	      explicitArray: false,
	      ignoreAttrs: false,
	      mergeAttrs: false,
	      explicitRoot: false,
	      validator: null,
	      xmlns: false,
	      explicitChildren: false,
	      childkey: '@@',
	      charsAsChildren: false,
	      includeWhiteChars: false,
	      async: false,
	      strict: true,
	      attrNameProcessors: null,
	      attrValueProcessors: null,
	      tagNameProcessors: null,
	      valueProcessors: null,
	      emptyTag: ''
	    },
	    "0.2": {
	      explicitCharkey: false,
	      trim: false,
	      normalize: false,
	      normalizeTags: false,
	      attrkey: "$",
	      charkey: "_",
	      explicitArray: true,
	      ignoreAttrs: false,
	      mergeAttrs: false,
	      explicitRoot: true,
	      validator: null,
	      xmlns: false,
	      explicitChildren: false,
	      preserveChildrenOrder: false,
	      childkey: '$$',
	      charsAsChildren: false,
	      includeWhiteChars: false,
	      async: false,
	      strict: true,
	      attrNameProcessors: null,
	      attrValueProcessors: null,
	      tagNameProcessors: null,
	      valueProcessors: null,
	      rootName: 'root',
	      xmldec: {
	        'version': '1.0',
	        'encoding': 'UTF-8',
	        'standalone': true
	      },
	      doctype: null,
	      renderOpts: {
	        'pretty': true,
	        'indent': '  ',
	        'newline': '\n'
	      },
	      headless: false,
	      chunkSize: 10000,
	      emptyTag: '',
	      cdata: false
	    }
	  };
	
	  exports.ValidationError = (function(superClass) {
	    extend(ValidationError, superClass);
	
	    function ValidationError(message) {
	      this.message = message;
	    }
	
	    return ValidationError;
	
	  })(Error);
	
	  exports.Builder = (function() {
	    function Builder(opts) {
	      var key, ref, value;
	      this.options = {};
	      ref = exports.defaults["0.2"];
	      for (key in ref) {
	        if (!hasProp.call(ref, key)) continue;
	        value = ref[key];
	        this.options[key] = value;
	      }
	      for (key in opts) {
	        if (!hasProp.call(opts, key)) continue;
	        value = opts[key];
	        this.options[key] = value;
	      }
	    }
	
	    Builder.prototype.buildObject = function(rootObj) {
	      var attrkey, charkey, render, rootElement, rootName;
	      attrkey = this.options.attrkey;
	      charkey = this.options.charkey;
	      if ((Object.keys(rootObj).length === 1) && (this.options.rootName === exports.defaults['0.2'].rootName)) {
	        rootName = Object.keys(rootObj)[0];
	        rootObj = rootObj[rootName];
	      } else {
	        rootName = this.options.rootName;
	      }
	      render = (function(_this) {
	        return function(element, obj) {
	          var attr, child, entry, index, key, value;
	          if (typeof obj !== 'object') {
	            if (_this.options.cdata && requiresCDATA(obj)) {
	              element.raw(wrapCDATA(obj));
	            } else {
	              element.txt(obj);
	            }
	          } else {
	            for (key in obj) {
	              if (!hasProp.call(obj, key)) continue;
	              child = obj[key];
	              if (key === attrkey) {
	                if (typeof child === "object") {
	                  for (attr in child) {
	                    value = child[attr];
	                    element = element.att(attr, value);
	                  }
	                }
	              } else if (key === charkey) {
	                if (_this.options.cdata && requiresCDATA(child)) {
	                  element = element.raw(wrapCDATA(child));
	                } else {
	                  element = element.txt(child);
	                }
	              } else if (Array.isArray(child)) {
	                for (index in child) {
	                  if (!hasProp.call(child, index)) continue;
	                  entry = child[index];
	                  if (typeof entry === 'string') {
	                    if (_this.options.cdata && requiresCDATA(entry)) {
	                      element = element.ele(key).raw(wrapCDATA(entry)).up();
	                    } else {
	                      element = element.ele(key, entry).up();
	                    }
	                  } else {
	                    element = render(element.ele(key), entry).up();
	                  }
	                }
	              } else if (typeof child === "object") {
	                element = render(element.ele(key), child).up();
	              } else {
	                if (typeof child === 'string' && _this.options.cdata && requiresCDATA(child)) {
	                  element = element.ele(key).raw(wrapCDATA(child)).up();
	                } else {
	                  if (child == null) {
	                    child = '';
	                  }
	                  element = element.ele(key, child.toString()).up();
	                }
	              }
	            }
	          }
	          return element;
	        };
	      })(this);
	      rootElement = builder.create(rootName, this.options.xmldec, this.options.doctype, {
	        headless: this.options.headless,
	        allowSurrogateChars: this.options.allowSurrogateChars
	      });
	      return render(rootElement, rootObj).end(this.options.renderOpts);
	    };
	
	    return Builder;
	
	  })();
	
	  exports.Parser = (function(superClass) {
	    extend(Parser, superClass);
	
	    function Parser(opts) {
	      this.parseString = bind(this.parseString, this);
	      this.reset = bind(this.reset, this);
	      this.assignOrPush = bind(this.assignOrPush, this);
	      this.processAsync = bind(this.processAsync, this);
	      var key, ref, value;
	      if (!(this instanceof exports.Parser)) {
	        return new exports.Parser(opts);
	      }
	      this.options = {};
	      ref = exports.defaults["0.2"];
	      for (key in ref) {
	        if (!hasProp.call(ref, key)) continue;
	        value = ref[key];
	        this.options[key] = value;
	      }
	      for (key in opts) {
	        if (!hasProp.call(opts, key)) continue;
	        value = opts[key];
	        this.options[key] = value;
	      }
	      if (this.options.xmlns) {
	        this.options.xmlnskey = this.options.attrkey + "ns";
	      }
	      if (this.options.normalizeTags) {
	        if (!this.options.tagNameProcessors) {
	          this.options.tagNameProcessors = [];
	        }
	        this.options.tagNameProcessors.unshift(processors.normalize);
	      }
	      this.reset();
	    }
	
	    Parser.prototype.processAsync = function() {
	      var chunk, err, error1;
	      try {
	        if (this.remaining.length <= this.options.chunkSize) {
	          chunk = this.remaining;
	          this.remaining = '';
	          this.saxParser = this.saxParser.write(chunk);
	          return this.saxParser.close();
	        } else {
	          chunk = this.remaining.substr(0, this.options.chunkSize);
	          this.remaining = this.remaining.substr(this.options.chunkSize, this.remaining.length);
	          this.saxParser = this.saxParser.write(chunk);
	          return setImmediate(this.processAsync);
	        }
	      } catch (error1) {
	        err = error1;
	        if (!this.saxParser.errThrown) {
	          this.saxParser.errThrown = true;
	          return this.emit(err);
	        }
	      }
	    };
	
	    Parser.prototype.assignOrPush = function(obj, key, newValue) {
	      if (!(key in obj)) {
	        if (!this.options.explicitArray) {
	          return obj[key] = newValue;
	        } else {
	          return obj[key] = [newValue];
	        }
	      } else {
	        if (!(obj[key] instanceof Array)) {
	          obj[key] = [obj[key]];
	        }
	        return obj[key].push(newValue);
	      }
	    };
	
	    Parser.prototype.reset = function() {
	      var attrkey, charkey, ontext, stack;
	      this.removeAllListeners();
	      this.saxParser = sax.parser(this.options.strict, {
	        trim: false,
	        normalize: false,
	        xmlns: this.options.xmlns
	      });
	      this.saxParser.errThrown = false;
	      this.saxParser.onerror = (function(_this) {
	        return function(error) {
	          _this.saxParser.resume();
	          if (!_this.saxParser.errThrown) {
	            _this.saxParser.errThrown = true;
	            return _this.emit("error", error);
	          }
	        };
	      })(this);
	      this.saxParser.onend = (function(_this) {
	        return function() {
	          if (!_this.saxParser.ended) {
	            _this.saxParser.ended = true;
	            return _this.emit("end", _this.resultObject);
	          }
	        };
	      })(this);
	      this.saxParser.ended = false;
	      this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
	      this.resultObject = null;
	      stack = [];
	      attrkey = this.options.attrkey;
	      charkey = this.options.charkey;
	      this.saxParser.onopentag = (function(_this) {
	        return function(node) {
	          var key, newValue, obj, processedKey, ref;
	          obj = {};
	          obj[charkey] = "";
	          if (!_this.options.ignoreAttrs) {
	            ref = node.attributes;
	            for (key in ref) {
	              if (!hasProp.call(ref, key)) continue;
	              if (!(attrkey in obj) && !_this.options.mergeAttrs) {
	                obj[attrkey] = {};
	              }
	              newValue = _this.options.attrValueProcessors ? processName(_this.options.attrValueProcessors, node.attributes[key]) : node.attributes[key];
	              processedKey = _this.options.attrNameProcessors ? processName(_this.options.attrNameProcessors, key) : key;
	              if (_this.options.mergeAttrs) {
	                _this.assignOrPush(obj, processedKey, newValue);
	              } else {
	                obj[attrkey][processedKey] = newValue;
	              }
	            }
	          }
	          obj["#name"] = _this.options.tagNameProcessors ? processName(_this.options.tagNameProcessors, node.name) : node.name;
	          if (_this.options.xmlns) {
	            obj[_this.options.xmlnskey] = {
	              uri: node.uri,
	              local: node.local
	            };
	          }
	          return stack.push(obj);
	        };
	      })(this);
	      this.saxParser.onclosetag = (function(_this) {
	        return function() {
	          var cdata, emptyStr, err, error1, key, node, nodeName, obj, objClone, old, s, xpath;
	          obj = stack.pop();
	          nodeName = obj["#name"];
	          if (!_this.options.explicitChildren || !_this.options.preserveChildrenOrder) {
	            delete obj["#name"];
	          }
	          if (obj.cdata === true) {
	            cdata = obj.cdata;
	            delete obj.cdata;
	          }
	          s = stack[stack.length - 1];
	          if (obj[charkey].match(/^\s*$/) && !cdata) {
	            emptyStr = obj[charkey];
	            delete obj[charkey];
	          } else {
	            if (_this.options.trim) {
	              obj[charkey] = obj[charkey].trim();
	            }
	            if (_this.options.normalize) {
	              obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
	            }
	            obj[charkey] = _this.options.valueProcessors ? processName(_this.options.valueProcessors, obj[charkey]) : obj[charkey];
	            if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
	              obj = obj[charkey];
	            }
	          }
	          if (isEmpty(obj)) {
	            obj = _this.options.emptyTag !== '' ? _this.options.emptyTag : emptyStr;
	          }
	          if (_this.options.validator != null) {
	            xpath = "/" + ((function() {
	              var i, len, results;
	              results = [];
	              for (i = 0, len = stack.length; i < len; i++) {
	                node = stack[i];
	                results.push(node["#name"]);
	              }
	              return results;
	            })()).concat(nodeName).join("/");
	            try {
	              obj = _this.options.validator(xpath, s && s[nodeName], obj);
	            } catch (error1) {
	              err = error1;
	              _this.emit("error", err);
	            }
	          }
	          if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === 'object') {
	            if (!_this.options.preserveChildrenOrder) {
	              node = {};
	              if (_this.options.attrkey in obj) {
	                node[_this.options.attrkey] = obj[_this.options.attrkey];
	                delete obj[_this.options.attrkey];
	              }
	              if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
	                node[_this.options.charkey] = obj[_this.options.charkey];
	                delete obj[_this.options.charkey];
	              }
	              if (Object.getOwnPropertyNames(obj).length > 0) {
	                node[_this.options.childkey] = obj;
	              }
	              obj = node;
	            } else if (s) {
	              s[_this.options.childkey] = s[_this.options.childkey] || [];
	              objClone = {};
	              for (key in obj) {
	                if (!hasProp.call(obj, key)) continue;
	                objClone[key] = obj[key];
	              }
	              s[_this.options.childkey].push(objClone);
	              delete obj["#name"];
	              if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
	                obj = obj[charkey];
	              }
	            }
	          }
	          if (stack.length > 0) {
	            return _this.assignOrPush(s, nodeName, obj);
	          } else {
	            if (_this.options.explicitRoot) {
	              old = obj;
	              obj = {};
	              obj[nodeName] = old;
	            }
	            _this.resultObject = obj;
	            _this.saxParser.ended = true;
	            return _this.emit("end", _this.resultObject);
	          }
	        };
	      })(this);
	      ontext = (function(_this) {
	        return function(text) {
	          var charChild, s;
	          s = stack[stack.length - 1];
	          if (s) {
	            s[charkey] += text;
	            if (_this.options.explicitChildren && _this.options.preserveChildrenOrder && _this.options.charsAsChildren && (_this.options.includeWhiteChars || text.replace(/\\n/g, '').trim() !== '')) {
	              s[_this.options.childkey] = s[_this.options.childkey] || [];
	              charChild = {
	                '#name': '__text__'
	              };
	              charChild[charkey] = text;
	              if (_this.options.normalize) {
	                charChild[charkey] = charChild[charkey].replace(/\s{2,}/g, " ").trim();
	              }
	              s[_this.options.childkey].push(charChild);
	            }
	            return s;
	          }
	        };
	      })(this);
	      this.saxParser.ontext = ontext;
	      return this.saxParser.oncdata = (function(_this) {
	        return function(text) {
	          var s;
	          s = ontext(text);
	          if (s) {
	            return s.cdata = true;
	          }
	        };
	      })(this);
	    };
	
	    Parser.prototype.parseString = function(str, cb) {
	      var err, error1;
	      if ((cb != null) && typeof cb === "function") {
	        this.on("end", function(result) {
	          this.reset();
	          return cb(null, result);
	        });
	        this.on("error", function(err) {
	          this.reset();
	          return cb(err);
	        });
	      }
	      try {
	        str = str.toString();
	        if (str.trim() === '') {
	          this.emit("end", null);
	          return true;
	        }
	        str = bom.stripBOM(str);
	        if (this.options.async) {
	          this.remaining = str;
	          setImmediate(this.processAsync);
	          return this.saxParser;
	        }
	        return this.saxParser.write(str).close();
	      } catch (error1) {
	        err = error1;
	        if (!(this.saxParser.errThrown || this.saxParser.ended)) {
	          this.emit('error', err);
	          return this.saxParser.errThrown = true;
	        } else if (this.saxParser.ended) {
	          throw err;
	        }
	      }
	    };
	
	    return Parser;
	
	  })(events.EventEmitter);
	
	  exports.parseString = function(str, a, b) {
	    var cb, options, parser;
	    if (b != null) {
	      if (typeof b === 'function') {
	        cb = b;
	      }
	      if (typeof a === 'object') {
	        options = a;
	      }
	    } else {
	      if (typeof a === 'function') {
	        cb = a;
	      }
	      options = {};
	    }
	    parser = new exports.Parser(options);
	    return parser.parseString(str, cb);
	  };
	
	}).call(this);


/***/ },
/* 389 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {;(function (sax) { // wrapper for non-node envs
	  sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
	  sax.SAXParser = SAXParser
	  sax.SAXStream = SAXStream
	  sax.createStream = createStream
	
	  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
	  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
	  // since that's the earliest that a buffer overrun could occur.  This way, checks are
	  // as rare as required, but as often as necessary to ensure never crossing this bound.
	  // Furthermore, buffers are only tested at most once per write(), so passing a very
	  // large string into write() might have undesirable effects, but this is manageable by
	  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
	  // edge case, result in creating at most one complete copy of the string passed in.
	  // Set to Infinity to have unlimited buffers.
	  sax.MAX_BUFFER_LENGTH = 64 * 1024
	
	  var buffers = [
	    'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
	    'procInstName', 'procInstBody', 'entity', 'attribName',
	    'attribValue', 'cdata', 'script'
	  ]
	
	  sax.EVENTS = [
	    'text',
	    'processinginstruction',
	    'sgmldeclaration',
	    'doctype',
	    'comment',
	    'opentagstart',
	    'attribute',
	    'opentag',
	    'closetag',
	    'opencdata',
	    'cdata',
	    'closecdata',
	    'error',
	    'end',
	    'ready',
	    'script',
	    'opennamespace',
	    'closenamespace'
	  ]
	
	  function SAXParser (strict, opt) {
	    if (!(this instanceof SAXParser)) {
	      return new SAXParser(strict, opt)
	    }
	
	    var parser = this
	    clearBuffers(parser)
	    parser.q = parser.c = ''
	    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
	    parser.opt = opt || {}
	    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
	    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase'
	    parser.tags = []
	    parser.closed = parser.closedRoot = parser.sawRoot = false
	    parser.tag = parser.error = null
	    parser.strict = !!strict
	    parser.noscript = !!(strict || parser.opt.noscript)
	    parser.state = S.BEGIN
	    parser.strictEntities = parser.opt.strictEntities
	    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES)
	    parser.attribList = []
	
	    // namespaces form a prototype chain.
	    // it always points at the current tag,
	    // which protos to its parent tag.
	    if (parser.opt.xmlns) {
	      parser.ns = Object.create(rootNS)
	    }
	
	    // mostly just for error reporting
	    parser.trackPosition = parser.opt.position !== false
	    if (parser.trackPosition) {
	      parser.position = parser.line = parser.column = 0
	    }
	    emit(parser, 'onready')
	  }
	
	  if (!Object.create) {
	    Object.create = function (o) {
	      function F () {}
	      F.prototype = o
	      var newf = new F()
	      return newf
	    }
	  }
	
	  if (!Object.keys) {
	    Object.keys = function (o) {
	      var a = []
	      for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
	      return a
	    }
	  }
	
	  function checkBufferLength (parser) {
	    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
	    var maxActual = 0
	    for (var i = 0, l = buffers.length; i < l; i++) {
	      var len = parser[buffers[i]].length
	      if (len > maxAllowed) {
	        // Text/cdata nodes can get big, and since they're buffered,
	        // we can get here under normal conditions.
	        // Avoid issues by emitting the text node now,
	        // so at least it won't get any bigger.
	        switch (buffers[i]) {
	          case 'textNode':
	            closeText(parser)
	            break
	
	          case 'cdata':
	            emitNode(parser, 'oncdata', parser.cdata)
	            parser.cdata = ''
	            break
	
	          case 'script':
	            emitNode(parser, 'onscript', parser.script)
	            parser.script = ''
	            break
	
	          default:
	            error(parser, 'Max buffer length exceeded: ' + buffers[i])
	        }
	      }
	      maxActual = Math.max(maxActual, len)
	    }
	    // schedule the next check for the earliest possible buffer overrun.
	    var m = sax.MAX_BUFFER_LENGTH - maxActual
	    parser.bufferCheckPosition = m + parser.position
	  }
	
	  function clearBuffers (parser) {
	    for (var i = 0, l = buffers.length; i < l; i++) {
	      parser[buffers[i]] = ''
	    }
	  }
	
	  function flushBuffers (parser) {
	    closeText(parser)
	    if (parser.cdata !== '') {
	      emitNode(parser, 'oncdata', parser.cdata)
	      parser.cdata = ''
	    }
	    if (parser.script !== '') {
	      emitNode(parser, 'onscript', parser.script)
	      parser.script = ''
	    }
	  }
	
	  SAXParser.prototype = {
	    end: function () { end(this) },
	    write: write,
	    resume: function () { this.error = null; return this },
	    close: function () { return this.write(null) },
	    flush: function () { flushBuffers(this) }
	  }
	
	  var Stream
	  try {
	    Stream = __webpack_require__(394).Stream
	  } catch (ex) {
	    Stream = function () {}
	  }
	
	  var streamWraps = sax.EVENTS.filter(function (ev) {
	    return ev !== 'error' && ev !== 'end'
	  })
	
	  function createStream (strict, opt) {
	    return new SAXStream(strict, opt)
	  }
	
	  function SAXStream (strict, opt) {
	    if (!(this instanceof SAXStream)) {
	      return new SAXStream(strict, opt)
	    }
	
	    Stream.apply(this)
	
	    this._parser = new SAXParser(strict, opt)
	    this.writable = true
	    this.readable = true
	
	    var me = this
	
	    this._parser.onend = function () {
	      me.emit('end')
	    }
	
	    this._parser.onerror = function (er) {
	      me.emit('error', er)
	
	      // if didn't throw, then means error was handled.
	      // go ahead and clear error, so we can write again.
	      me._parser.error = null
	    }
	
	    this._decoder = null
	
	    streamWraps.forEach(function (ev) {
	      Object.defineProperty(me, 'on' + ev, {
	        get: function () {
	          return me._parser['on' + ev]
	        },
	        set: function (h) {
	          if (!h) {
	            me.removeAllListeners(ev)
	            me._parser['on' + ev] = h
	            return h
	          }
	          me.on(ev, h)
	        },
	        enumerable: true,
	        configurable: false
	      })
	    })
	  }
	
	  SAXStream.prototype = Object.create(Stream.prototype, {
	    constructor: {
	      value: SAXStream
	    }
	  })
	
	  SAXStream.prototype.write = function (data) {
	    if (typeof Buffer === 'function' &&
	      typeof Buffer.isBuffer === 'function' &&
	      Buffer.isBuffer(data)) {
	      if (!this._decoder) {
	        var SD = __webpack_require__(403).StringDecoder
	        this._decoder = new SD('utf8')
	      }
	      data = this._decoder.write(data)
	    }
	
	    this._parser.write(data.toString())
	    this.emit('data', data)
	    return true
	  }
	
	  SAXStream.prototype.end = function (chunk) {
	    if (chunk && chunk.length) {
	      this.write(chunk)
	    }
	    this._parser.end()
	    return true
	  }
	
	  SAXStream.prototype.on = function (ev, handler) {
	    var me = this
	    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
	      me._parser['on' + ev] = function () {
	        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
	        args.splice(0, 0, ev)
	        me.emit.apply(me, args)
	      }
	    }
	
	    return Stream.prototype.on.call(me, ev, handler)
	  }
	
	  // character classes and tokens
	  var whitespace = '\r\n\t '
	
	  // this really needs to be replaced with character classes.
	  // XML allows all manner of ridiculous numbers and digits.
	  var number = '0124356789'
	  var letter = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	
	  // (Letter | "_" | ":")
	  var quote = '\'"'
	  var attribEnd = whitespace + '>'
	  var CDATA = '[CDATA['
	  var DOCTYPE = 'DOCTYPE'
	  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
	  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
	  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }
	
	  // turn all the string character sets into character class objects.
	  whitespace = charClass(whitespace)
	  number = charClass(number)
	  letter = charClass(letter)
	
	  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
	  // This implementation works on strings, a single character at a time
	  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
	  // without a significant breaking change to either this  parser, or the
	  // JavaScript language.  Implementation of an emoji-capable xml parser
	  // is left as an exercise for the reader.
	  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
	
	  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/
	
	  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
	  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/
	
	  quote = charClass(quote)
	  attribEnd = charClass(attribEnd)
	
	  function charClass (str) {
	    return str.split('').reduce(function (s, c) {
	      s[c] = true
	      return s
	    }, {})
	  }
	
	  function isRegExp (c) {
	    return Object.prototype.toString.call(c) === '[object RegExp]'
	  }
	
	  function is (charclass, c) {
	    return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
	  }
	
	  function not (charclass, c) {
	    return !is(charclass, c)
	  }
	
	  var S = 0
	  sax.STATE = {
	    BEGIN: S++, // leading byte order mark or whitespace
	    BEGIN_WHITESPACE: S++, // leading whitespace
	    TEXT: S++, // general stuff
	    TEXT_ENTITY: S++, // &amp and such.
	    OPEN_WAKA: S++, // <
	    SGML_DECL: S++, // <!BLARG
	    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
	    DOCTYPE: S++, // <!DOCTYPE
	    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
	    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
	    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
	    COMMENT_STARTING: S++, // <!-
	    COMMENT: S++, // <!--
	    COMMENT_ENDING: S++, // <!-- blah -
	    COMMENT_ENDED: S++, // <!-- blah --
	    CDATA: S++, // <![CDATA[ something
	    CDATA_ENDING: S++, // ]
	    CDATA_ENDING_2: S++, // ]]
	    PROC_INST: S++, // <?hi
	    PROC_INST_BODY: S++, // <?hi there
	    PROC_INST_ENDING: S++, // <?hi "there" ?
	    OPEN_TAG: S++, // <strong
	    OPEN_TAG_SLASH: S++, // <strong /
	    ATTRIB: S++, // <a
	    ATTRIB_NAME: S++, // <a foo
	    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
	    ATTRIB_VALUE: S++, // <a foo=
	    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
	    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
	    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
	    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
	    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
	    CLOSE_TAG: S++, // </a
	    CLOSE_TAG_SAW_WHITE: S++, // </a   >
	    SCRIPT: S++, // <script> ...
	    SCRIPT_ENDING: S++ // <script> ... <
	  }
	
	  sax.XML_ENTITIES = {
	    'amp': '&',
	    'gt': '>',
	    'lt': '<',
	    'quot': '"',
	    'apos': "'"
	  }
	
	  sax.ENTITIES = {
	    'amp': '&',
	    'gt': '>',
	    'lt': '<',
	    'quot': '"',
	    'apos': "'",
	    'AElig': 198,
	    'Aacute': 193,
	    'Acirc': 194,
	    'Agrave': 192,
	    'Aring': 197,
	    'Atilde': 195,
	    'Auml': 196,
	    'Ccedil': 199,
	    'ETH': 208,
	    'Eacute': 201,
	    'Ecirc': 202,
	    'Egrave': 200,
	    'Euml': 203,
	    'Iacute': 205,
	    'Icirc': 206,
	    'Igrave': 204,
	    'Iuml': 207,
	    'Ntilde': 209,
	    'Oacute': 211,
	    'Ocirc': 212,
	    'Ograve': 210,
	    'Oslash': 216,
	    'Otilde': 213,
	    'Ouml': 214,
	    'THORN': 222,
	    'Uacute': 218,
	    'Ucirc': 219,
	    'Ugrave': 217,
	    'Uuml': 220,
	    'Yacute': 221,
	    'aacute': 225,
	    'acirc': 226,
	    'aelig': 230,
	    'agrave': 224,
	    'aring': 229,
	    'atilde': 227,
	    'auml': 228,
	    'ccedil': 231,
	    'eacute': 233,
	    'ecirc': 234,
	    'egrave': 232,
	    'eth': 240,
	    'euml': 235,
	    'iacute': 237,
	    'icirc': 238,
	    'igrave': 236,
	    'iuml': 239,
	    'ntilde': 241,
	    'oacute': 243,
	    'ocirc': 244,
	    'ograve': 242,
	    'oslash': 248,
	    'otilde': 245,
	    'ouml': 246,
	    'szlig': 223,
	    'thorn': 254,
	    'uacute': 250,
	    'ucirc': 251,
	    'ugrave': 249,
	    'uuml': 252,
	    'yacute': 253,
	    'yuml': 255,
	    'copy': 169,
	    'reg': 174,
	    'nbsp': 160,
	    'iexcl': 161,
	    'cent': 162,
	    'pound': 163,
	    'curren': 164,
	    'yen': 165,
	    'brvbar': 166,
	    'sect': 167,
	    'uml': 168,
	    'ordf': 170,
	    'laquo': 171,
	    'not': 172,
	    'shy': 173,
	    'macr': 175,
	    'deg': 176,
	    'plusmn': 177,
	    'sup1': 185,
	    'sup2': 178,
	    'sup3': 179,
	    'acute': 180,
	    'micro': 181,
	    'para': 182,
	    'middot': 183,
	    'cedil': 184,
	    'ordm': 186,
	    'raquo': 187,
	    'frac14': 188,
	    'frac12': 189,
	    'frac34': 190,
	    'iquest': 191,
	    'times': 215,
	    'divide': 247,
	    'OElig': 338,
	    'oelig': 339,
	    'Scaron': 352,
	    'scaron': 353,
	    'Yuml': 376,
	    'fnof': 402,
	    'circ': 710,
	    'tilde': 732,
	    'Alpha': 913,
	    'Beta': 914,
	    'Gamma': 915,
	    'Delta': 916,
	    'Epsilon': 917,
	    'Zeta': 918,
	    'Eta': 919,
	    'Theta': 920,
	    'Iota': 921,
	    'Kappa': 922,
	    'Lambda': 923,
	    'Mu': 924,
	    'Nu': 925,
	    'Xi': 926,
	    'Omicron': 927,
	    'Pi': 928,
	    'Rho': 929,
	    'Sigma': 931,
	    'Tau': 932,
	    'Upsilon': 933,
	    'Phi': 934,
	    'Chi': 935,
	    'Psi': 936,
	    'Omega': 937,
	    'alpha': 945,
	    'beta': 946,
	    'gamma': 947,
	    'delta': 948,
	    'epsilon': 949,
	    'zeta': 950,
	    'eta': 951,
	    'theta': 952,
	    'iota': 953,
	    'kappa': 954,
	    'lambda': 955,
	    'mu': 956,
	    'nu': 957,
	    'xi': 958,
	    'omicron': 959,
	    'pi': 960,
	    'rho': 961,
	    'sigmaf': 962,
	    'sigma': 963,
	    'tau': 964,
	    'upsilon': 965,
	    'phi': 966,
	    'chi': 967,
	    'psi': 968,
	    'omega': 969,
	    'thetasym': 977,
	    'upsih': 978,
	    'piv': 982,
	    'ensp': 8194,
	    'emsp': 8195,
	    'thinsp': 8201,
	    'zwnj': 8204,
	    'zwj': 8205,
	    'lrm': 8206,
	    'rlm': 8207,
	    'ndash': 8211,
	    'mdash': 8212,
	    'lsquo': 8216,
	    'rsquo': 8217,
	    'sbquo': 8218,
	    'ldquo': 8220,
	    'rdquo': 8221,
	    'bdquo': 8222,
	    'dagger': 8224,
	    'Dagger': 8225,
	    'bull': 8226,
	    'hellip': 8230,
	    'permil': 8240,
	    'prime': 8242,
	    'Prime': 8243,
	    'lsaquo': 8249,
	    'rsaquo': 8250,
	    'oline': 8254,
	    'frasl': 8260,
	    'euro': 8364,
	    'image': 8465,
	    'weierp': 8472,
	    'real': 8476,
	    'trade': 8482,
	    'alefsym': 8501,
	    'larr': 8592,
	    'uarr': 8593,
	    'rarr': 8594,
	    'darr': 8595,
	    'harr': 8596,
	    'crarr': 8629,
	    'lArr': 8656,
	    'uArr': 8657,
	    'rArr': 8658,
	    'dArr': 8659,
	    'hArr': 8660,
	    'forall': 8704,
	    'part': 8706,
	    'exist': 8707,
	    'empty': 8709,
	    'nabla': 8711,
	    'isin': 8712,
	    'notin': 8713,
	    'ni': 8715,
	    'prod': 8719,
	    'sum': 8721,
	    'minus': 8722,
	    'lowast': 8727,
	    'radic': 8730,
	    'prop': 8733,
	    'infin': 8734,
	    'ang': 8736,
	    'and': 8743,
	    'or': 8744,
	    'cap': 8745,
	    'cup': 8746,
	    'int': 8747,
	    'there4': 8756,
	    'sim': 8764,
	    'cong': 8773,
	    'asymp': 8776,
	    'ne': 8800,
	    'equiv': 8801,
	    'le': 8804,
	    'ge': 8805,
	    'sub': 8834,
	    'sup': 8835,
	    'nsub': 8836,
	    'sube': 8838,
	    'supe': 8839,
	    'oplus': 8853,
	    'otimes': 8855,
	    'perp': 8869,
	    'sdot': 8901,
	    'lceil': 8968,
	    'rceil': 8969,
	    'lfloor': 8970,
	    'rfloor': 8971,
	    'lang': 9001,
	    'rang': 9002,
	    'loz': 9674,
	    'spades': 9824,
	    'clubs': 9827,
	    'hearts': 9829,
	    'diams': 9830
	  }
	
	  Object.keys(sax.ENTITIES).forEach(function (key) {
	    var e = sax.ENTITIES[key]
	    var s = typeof e === 'number' ? String.fromCharCode(e) : e
	    sax.ENTITIES[key] = s
	  })
	
	  for (var s in sax.STATE) {
	    sax.STATE[sax.STATE[s]] = s
	  }
	
	  // shorthand
	  S = sax.STATE
	
	  function emit (parser, event, data) {
	    parser[event] && parser[event](data)
	  }
	
	  function emitNode (parser, nodeType, data) {
	    if (parser.textNode) closeText(parser)
	    emit(parser, nodeType, data)
	  }
	
	  function closeText (parser) {
	    parser.textNode = textopts(parser.opt, parser.textNode)
	    if (parser.textNode) emit(parser, 'ontext', parser.textNode)
	    parser.textNode = ''
	  }
	
	  function textopts (opt, text) {
	    if (opt.trim) text = text.trim()
	    if (opt.normalize) text = text.replace(/\s+/g, ' ')
	    return text
	  }
	
	  function error (parser, er) {
	    closeText(parser)
	    if (parser.trackPosition) {
	      er += '\nLine: ' + parser.line +
	        '\nColumn: ' + parser.column +
	        '\nChar: ' + parser.c
	    }
	    er = new Error(er)
	    parser.error = er
	    emit(parser, 'onerror', er)
	    return parser
	  }
	
	  function end (parser) {
	    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag')
	    if ((parser.state !== S.BEGIN) &&
	      (parser.state !== S.BEGIN_WHITESPACE) &&
	      (parser.state !== S.TEXT)) {
	      error(parser, 'Unexpected end')
	    }
	    closeText(parser)
	    parser.c = ''
	    parser.closed = true
	    emit(parser, 'onend')
	    SAXParser.call(parser, parser.strict, parser.opt)
	    return parser
	  }
	
	  function strictFail (parser, message) {
	    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
	      throw new Error('bad call to strictFail')
	    }
	    if (parser.strict) {
	      error(parser, message)
	    }
	  }
	
	  function newTag (parser) {
	    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
	    var parent = parser.tags[parser.tags.length - 1] || parser
	    var tag = parser.tag = { name: parser.tagName, attributes: {} }
	
	    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
	    if (parser.opt.xmlns) {
	      tag.ns = parent.ns
	    }
	    parser.attribList.length = 0
	    emitNode(parser, 'onopentagstart', tag)
	  }
	
	  function qname (name, attribute) {
	    var i = name.indexOf(':')
	    var qualName = i < 0 ? [ '', name ] : name.split(':')
	    var prefix = qualName[0]
	    var local = qualName[1]
	
	    // <x "xmlns"="http://foo">
	    if (attribute && name === 'xmlns') {
	      prefix = 'xmlns'
	      local = ''
	    }
	
	    return { prefix: prefix, local: local }
	  }
	
	  function attrib (parser) {
	    if (!parser.strict) {
	      parser.attribName = parser.attribName[parser.looseCase]()
	    }
	
	    if (parser.attribList.indexOf(parser.attribName) !== -1 ||
	      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
	      parser.attribName = parser.attribValue = ''
	      return
	    }
	
	    if (parser.opt.xmlns) {
	      var qn = qname(parser.attribName, true)
	      var prefix = qn.prefix
	      var local = qn.local
	
	      if (prefix === 'xmlns') {
	        // namespace binding attribute. push the binding into scope
	        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
	          strictFail(parser,
	            'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
	            'Actual: ' + parser.attribValue)
	        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
	          strictFail(parser,
	            'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
	            'Actual: ' + parser.attribValue)
	        } else {
	          var tag = parser.tag
	          var parent = parser.tags[parser.tags.length - 1] || parser
	          if (tag.ns === parent.ns) {
	            tag.ns = Object.create(parent.ns)
	          }
	          tag.ns[local] = parser.attribValue
	        }
	      }
	
	      // defer onattribute events until all attributes have been seen
	      // so any new bindings can take effect. preserve attribute order
	      // so deferred events can be emitted in document order
	      parser.attribList.push([parser.attribName, parser.attribValue])
	    } else {
	      // in non-xmlns mode, we can emit the event right away
	      parser.tag.attributes[parser.attribName] = parser.attribValue
	      emitNode(parser, 'onattribute', {
	        name: parser.attribName,
	        value: parser.attribValue
	      })
	    }
	
	    parser.attribName = parser.attribValue = ''
	  }
	
	  function openTag (parser, selfClosing) {
	    if (parser.opt.xmlns) {
	      // emit namespace binding events
	      var tag = parser.tag
	
	      // add namespace info to tag
	      var qn = qname(parser.tagName)
	      tag.prefix = qn.prefix
	      tag.local = qn.local
	      tag.uri = tag.ns[qn.prefix] || ''
	
	      if (tag.prefix && !tag.uri) {
	        strictFail(parser, 'Unbound namespace prefix: ' +
	          JSON.stringify(parser.tagName))
	        tag.uri = qn.prefix
	      }
	
	      var parent = parser.tags[parser.tags.length - 1] || parser
	      if (tag.ns && parent.ns !== tag.ns) {
	        Object.keys(tag.ns).forEach(function (p) {
	          emitNode(parser, 'onopennamespace', {
	            prefix: p,
	            uri: tag.ns[p]
	          })
	        })
	      }
	
	      // handle deferred onattribute events
	      // Note: do not apply default ns to attributes:
	      //   http://www.w3.org/TR/REC-xml-names/#defaulting
	      for (var i = 0, l = parser.attribList.length; i < l; i++) {
	        var nv = parser.attribList[i]
	        var name = nv[0]
	        var value = nv[1]
	        var qualName = qname(name, true)
	        var prefix = qualName.prefix
	        var local = qualName.local
	        var uri = prefix === '' ? '' : (tag.ns[prefix] || '')
	        var a = {
	          name: name,
	          value: value,
	          prefix: prefix,
	          local: local,
	          uri: uri
	        }
	
	        // if there's any attributes with an undefined namespace,
	        // then fail on them now.
	        if (prefix && prefix !== 'xmlns' && !uri) {
	          strictFail(parser, 'Unbound namespace prefix: ' +
	            JSON.stringify(prefix))
	          a.uri = prefix
	        }
	        parser.tag.attributes[name] = a
	        emitNode(parser, 'onattribute', a)
	      }
	      parser.attribList.length = 0
	    }
	
	    parser.tag.isSelfClosing = !!selfClosing
	
	    // process the tag
	    parser.sawRoot = true
	    parser.tags.push(parser.tag)
	    emitNode(parser, 'onopentag', parser.tag)
	    if (!selfClosing) {
	      // special case for <script> in non-strict mode.
	      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
	        parser.state = S.SCRIPT
	      } else {
	        parser.state = S.TEXT
	      }
	      parser.tag = null
	      parser.tagName = ''
	    }
	    parser.attribName = parser.attribValue = ''
	    parser.attribList.length = 0
	  }
	
	  function closeTag (parser) {
	    if (!parser.tagName) {
	      strictFail(parser, 'Weird empty close tag.')
	      parser.textNode += '</>'
	      parser.state = S.TEXT
	      return
	    }
	
	    if (parser.script) {
	      if (parser.tagName !== 'script') {
	        parser.script += '</' + parser.tagName + '>'
	        parser.tagName = ''
	        parser.state = S.SCRIPT
	        return
	      }
	      emitNode(parser, 'onscript', parser.script)
	      parser.script = ''
	    }
	
	    // first make sure that the closing tag actually exists.
	    // <a><b></c></b></a> will close everything, otherwise.
	    var t = parser.tags.length
	    var tagName = parser.tagName
	    if (!parser.strict) {
	      tagName = tagName[parser.looseCase]()
	    }
	    var closeTo = tagName
	    while (t--) {
	      var close = parser.tags[t]
	      if (close.name !== closeTo) {
	        // fail the first time in strict mode
	        strictFail(parser, 'Unexpected close tag')
	      } else {
	        break
	      }
	    }
	
	    // didn't find it.  we already failed for strict, so just abort.
	    if (t < 0) {
	      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName)
	      parser.textNode += '</' + parser.tagName + '>'
	      parser.state = S.TEXT
	      return
	    }
	    parser.tagName = tagName
	    var s = parser.tags.length
	    while (s-- > t) {
	      var tag = parser.tag = parser.tags.pop()
	      parser.tagName = parser.tag.name
	      emitNode(parser, 'onclosetag', parser.tagName)
	
	      var x = {}
	      for (var i in tag.ns) {
	        x[i] = tag.ns[i]
	      }
	
	      var parent = parser.tags[parser.tags.length - 1] || parser
	      if (parser.opt.xmlns && tag.ns !== parent.ns) {
	        // remove namespace bindings introduced by tag
	        Object.keys(tag.ns).forEach(function (p) {
	          var n = tag.ns[p]
	          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n })
	        })
	      }
	    }
	    if (t === 0) parser.closedRoot = true
	    parser.tagName = parser.attribValue = parser.attribName = ''
	    parser.attribList.length = 0
	    parser.state = S.TEXT
	  }
	
	  function parseEntity (parser) {
	    var entity = parser.entity
	    var entityLC = entity.toLowerCase()
	    var num
	    var numStr = ''
	
	    if (parser.ENTITIES[entity]) {
	      return parser.ENTITIES[entity]
	    }
	    if (parser.ENTITIES[entityLC]) {
	      return parser.ENTITIES[entityLC]
	    }
	    entity = entityLC
	    if (entity.charAt(0) === '#') {
	      if (entity.charAt(1) === 'x') {
	        entity = entity.slice(2)
	        num = parseInt(entity, 16)
	        numStr = num.toString(16)
	      } else {
	        entity = entity.slice(1)
	        num = parseInt(entity, 10)
	        numStr = num.toString(10)
	      }
	    }
	    entity = entity.replace(/^0+/, '')
	    if (numStr.toLowerCase() !== entity) {
	      strictFail(parser, 'Invalid character entity')
	      return '&' + parser.entity + ';'
	    }
	
	    return String.fromCodePoint(num)
	  }
	
	  function beginWhiteSpace (parser, c) {
	    if (c === '<') {
	      parser.state = S.OPEN_WAKA
	      parser.startTagPosition = parser.position
	    } else if (not(whitespace, c)) {
	      // have to process this as a text node.
	      // weird, but happens.
	      strictFail(parser, 'Non-whitespace before first tag.')
	      parser.textNode = c
	      parser.state = S.TEXT
	    }
	  }
	
	  function charAt (chunk, i) {
	    var result = ''
	    if (i < chunk.length) {
	      result = chunk.charAt(i)
	    }
	    return result
	  }
	
	  function write (chunk) {
	    var parser = this
	    if (this.error) {
	      throw this.error
	    }
	    if (parser.closed) {
	      return error(parser,
	        'Cannot write after close. Assign an onready handler.')
	    }
	    if (chunk === null) {
	      return end(parser)
	    }
	    if (typeof chunk === 'object') {
	      chunk = chunk.toString()
	    }
	    var i = 0
	    var c = ''
	    while (true) {
	      c = charAt(chunk, i++)
	      parser.c = c
	      if (!c) {
	        break
	      }
	      if (parser.trackPosition) {
	        parser.position++
	        if (c === '\n') {
	          parser.line++
	          parser.column = 0
	        } else {
	          parser.column++
	        }
	      }
	      switch (parser.state) {
	        case S.BEGIN:
	          parser.state = S.BEGIN_WHITESPACE
	          if (c === '\uFEFF') {
	            continue
	          }
	          beginWhiteSpace(parser, c)
	          continue
	
	        case S.BEGIN_WHITESPACE:
	          beginWhiteSpace(parser, c)
	          continue
	
	        case S.TEXT:
	          if (parser.sawRoot && !parser.closedRoot) {
	            var starti = i - 1
	            while (c && c !== '<' && c !== '&') {
	              c = charAt(chunk, i++)
	              if (c && parser.trackPosition) {
	                parser.position++
	                if (c === '\n') {
	                  parser.line++
	                  parser.column = 0
	                } else {
	                  parser.column++
	                }
	              }
	            }
	            parser.textNode += chunk.substring(starti, i - 1)
	          }
	          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
	            parser.state = S.OPEN_WAKA
	            parser.startTagPosition = parser.position
	          } else {
	            if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot)) {
	              strictFail(parser, 'Text data outside of root node.')
	            }
	            if (c === '&') {
	              parser.state = S.TEXT_ENTITY
	            } else {
	              parser.textNode += c
	            }
	          }
	          continue
	
	        case S.SCRIPT:
	          // only non-strict
	          if (c === '<') {
	            parser.state = S.SCRIPT_ENDING
	          } else {
	            parser.script += c
	          }
	          continue
	
	        case S.SCRIPT_ENDING:
	          if (c === '/') {
	            parser.state = S.CLOSE_TAG
	          } else {
	            parser.script += '<' + c
	            parser.state = S.SCRIPT
	          }
	          continue
	
	        case S.OPEN_WAKA:
	          // either a /, ?, !, or text is coming next.
	          if (c === '!') {
	            parser.state = S.SGML_DECL
	            parser.sgmlDecl = ''
	          } else if (is(whitespace, c)) {
	            // wait for it...
	          } else if (is(nameStart, c)) {
	            parser.state = S.OPEN_TAG
	            parser.tagName = c
	          } else if (c === '/') {
	            parser.state = S.CLOSE_TAG
	            parser.tagName = ''
	          } else if (c === '?') {
	            parser.state = S.PROC_INST
	            parser.procInstName = parser.procInstBody = ''
	          } else {
	            strictFail(parser, 'Unencoded <')
	            // if there was some whitespace, then add that in.
	            if (parser.startTagPosition + 1 < parser.position) {
	              var pad = parser.position - parser.startTagPosition
	              c = new Array(pad).join(' ') + c
	            }
	            parser.textNode += '<' + c
	            parser.state = S.TEXT
	          }
	          continue
	
	        case S.SGML_DECL:
	          if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
	            emitNode(parser, 'onopencdata')
	            parser.state = S.CDATA
	            parser.sgmlDecl = ''
	            parser.cdata = ''
	          } else if (parser.sgmlDecl + c === '--') {
	            parser.state = S.COMMENT
	            parser.comment = ''
	            parser.sgmlDecl = ''
	          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
	            parser.state = S.DOCTYPE
	            if (parser.doctype || parser.sawRoot) {
	              strictFail(parser,
	                'Inappropriately located doctype declaration')
	            }
	            parser.doctype = ''
	            parser.sgmlDecl = ''
	          } else if (c === '>') {
	            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl)
	            parser.sgmlDecl = ''
	            parser.state = S.TEXT
	          } else if (is(quote, c)) {
	            parser.state = S.SGML_DECL_QUOTED
	            parser.sgmlDecl += c
	          } else {
	            parser.sgmlDecl += c
	          }
	          continue
	
	        case S.SGML_DECL_QUOTED:
	          if (c === parser.q) {
	            parser.state = S.SGML_DECL
	            parser.q = ''
	          }
	          parser.sgmlDecl += c
	          continue
	
	        case S.DOCTYPE:
	          if (c === '>') {
	            parser.state = S.TEXT
	            emitNode(parser, 'ondoctype', parser.doctype)
	            parser.doctype = true // just remember that we saw it.
	          } else {
	            parser.doctype += c
	            if (c === '[') {
	              parser.state = S.DOCTYPE_DTD
	            } else if (is(quote, c)) {
	              parser.state = S.DOCTYPE_QUOTED
	              parser.q = c
	            }
	          }
	          continue
	
	        case S.DOCTYPE_QUOTED:
	          parser.doctype += c
	          if (c === parser.q) {
	            parser.q = ''
	            parser.state = S.DOCTYPE
	          }
	          continue
	
	        case S.DOCTYPE_DTD:
	          parser.doctype += c
	          if (c === ']') {
	            parser.state = S.DOCTYPE
	          } else if (is(quote, c)) {
	            parser.state = S.DOCTYPE_DTD_QUOTED
	            parser.q = c
	          }
	          continue
	
	        case S.DOCTYPE_DTD_QUOTED:
	          parser.doctype += c
	          if (c === parser.q) {
	            parser.state = S.DOCTYPE_DTD
	            parser.q = ''
	          }
	          continue
	
	        case S.COMMENT:
	          if (c === '-') {
	            parser.state = S.COMMENT_ENDING
	          } else {
	            parser.comment += c
	          }
	          continue
	
	        case S.COMMENT_ENDING:
	          if (c === '-') {
	            parser.state = S.COMMENT_ENDED
	            parser.comment = textopts(parser.opt, parser.comment)
	            if (parser.comment) {
	              emitNode(parser, 'oncomment', parser.comment)
	            }
	            parser.comment = ''
	          } else {
	            parser.comment += '-' + c
	            parser.state = S.COMMENT
	          }
	          continue
	
	        case S.COMMENT_ENDED:
	          if (c !== '>') {
	            strictFail(parser, 'Malformed comment')
	            // allow <!-- blah -- bloo --> in non-strict mode,
	            // which is a comment of " blah -- bloo "
	            parser.comment += '--' + c
	            parser.state = S.COMMENT
	          } else {
	            parser.state = S.TEXT
	          }
	          continue
	
	        case S.CDATA:
	          if (c === ']') {
	            parser.state = S.CDATA_ENDING
	          } else {
	            parser.cdata += c
	          }
	          continue
	
	        case S.CDATA_ENDING:
	          if (c === ']') {
	            parser.state = S.CDATA_ENDING_2
	          } else {
	            parser.cdata += ']' + c
	            parser.state = S.CDATA
	          }
	          continue
	
	        case S.CDATA_ENDING_2:
	          if (c === '>') {
	            if (parser.cdata) {
	              emitNode(parser, 'oncdata', parser.cdata)
	            }
	            emitNode(parser, 'onclosecdata')
	            parser.cdata = ''
	            parser.state = S.TEXT
	          } else if (c === ']') {
	            parser.cdata += ']'
	          } else {
	            parser.cdata += ']]' + c
	            parser.state = S.CDATA
	          }
	          continue
	
	        case S.PROC_INST:
	          if (c === '?') {
	            parser.state = S.PROC_INST_ENDING
	          } else if (is(whitespace, c)) {
	            parser.state = S.PROC_INST_BODY
	          } else {
	            parser.procInstName += c
	          }
	          continue
	
	        case S.PROC_INST_BODY:
	          if (!parser.procInstBody && is(whitespace, c)) {
	            continue
	          } else if (c === '?') {
	            parser.state = S.PROC_INST_ENDING
	          } else {
	            parser.procInstBody += c
	          }
	          continue
	
	        case S.PROC_INST_ENDING:
	          if (c === '>') {
	            emitNode(parser, 'onprocessinginstruction', {
	              name: parser.procInstName,
	              body: parser.procInstBody
	            })
	            parser.procInstName = parser.procInstBody = ''
	            parser.state = S.TEXT
	          } else {
	            parser.procInstBody += '?' + c
	            parser.state = S.PROC_INST_BODY
	          }
	          continue
	
	        case S.OPEN_TAG:
	          if (is(nameBody, c)) {
	            parser.tagName += c
	          } else {
	            newTag(parser)
	            if (c === '>') {
	              openTag(parser)
	            } else if (c === '/') {
	              parser.state = S.OPEN_TAG_SLASH
	            } else {
	              if (not(whitespace, c)) {
	                strictFail(parser, 'Invalid character in tag name')
	              }
	              parser.state = S.ATTRIB
	            }
	          }
	          continue
	
	        case S.OPEN_TAG_SLASH:
	          if (c === '>') {
	            openTag(parser, true)
	            closeTag(parser)
	          } else {
	            strictFail(parser, 'Forward-slash in opening tag not followed by >')
	            parser.state = S.ATTRIB
	          }
	          continue
	
	        case S.ATTRIB:
	          // haven't read the attribute name yet.
	          if (is(whitespace, c)) {
	            continue
	          } else if (c === '>') {
	            openTag(parser)
	          } else if (c === '/') {
	            parser.state = S.OPEN_TAG_SLASH
	          } else if (is(nameStart, c)) {
	            parser.attribName = c
	            parser.attribValue = ''
	            parser.state = S.ATTRIB_NAME
	          } else {
	            strictFail(parser, 'Invalid attribute name')
	          }
	          continue
	
	        case S.ATTRIB_NAME:
	          if (c === '=') {
	            parser.state = S.ATTRIB_VALUE
	          } else if (c === '>') {
	            strictFail(parser, 'Attribute without value')
	            parser.attribValue = parser.attribName
	            attrib(parser)
	            openTag(parser)
	          } else if (is(whitespace, c)) {
	            parser.state = S.ATTRIB_NAME_SAW_WHITE
	          } else if (is(nameBody, c)) {
	            parser.attribName += c
	          } else {
	            strictFail(parser, 'Invalid attribute name')
	          }
	          continue
	
	        case S.ATTRIB_NAME_SAW_WHITE:
	          if (c === '=') {
	            parser.state = S.ATTRIB_VALUE
	          } else if (is(whitespace, c)) {
	            continue
	          } else {
	            strictFail(parser, 'Attribute without value')
	            parser.tag.attributes[parser.attribName] = ''
	            parser.attribValue = ''
	            emitNode(parser, 'onattribute', {
	              name: parser.attribName,
	              value: ''
	            })
	            parser.attribName = ''
	            if (c === '>') {
	              openTag(parser)
	            } else if (is(nameStart, c)) {
	              parser.attribName = c
	              parser.state = S.ATTRIB_NAME
	            } else {
	              strictFail(parser, 'Invalid attribute name')
	              parser.state = S.ATTRIB
	            }
	          }
	          continue
	
	        case S.ATTRIB_VALUE:
	          if (is(whitespace, c)) {
	            continue
	          } else if (is(quote, c)) {
	            parser.q = c
	            parser.state = S.ATTRIB_VALUE_QUOTED
	          } else {
	            strictFail(parser, 'Unquoted attribute value')
	            parser.state = S.ATTRIB_VALUE_UNQUOTED
	            parser.attribValue = c
	          }
	          continue
	
	        case S.ATTRIB_VALUE_QUOTED:
	          if (c !== parser.q) {
	            if (c === '&') {
	              parser.state = S.ATTRIB_VALUE_ENTITY_Q
	            } else {
	              parser.attribValue += c
	            }
	            continue
	          }
	          attrib(parser)
	          parser.q = ''
	          parser.state = S.ATTRIB_VALUE_CLOSED
	          continue
	
	        case S.ATTRIB_VALUE_CLOSED:
	          if (is(whitespace, c)) {
	            parser.state = S.ATTRIB
	          } else if (c === '>') {
	            openTag(parser)
	          } else if (c === '/') {
	            parser.state = S.OPEN_TAG_SLASH
	          } else if (is(nameStart, c)) {
	            strictFail(parser, 'No whitespace between attributes')
	            parser.attribName = c
	            parser.attribValue = ''
	            parser.state = S.ATTRIB_NAME
	          } else {
	            strictFail(parser, 'Invalid attribute name')
	          }
	          continue
	
	        case S.ATTRIB_VALUE_UNQUOTED:
	          if (not(attribEnd, c)) {
	            if (c === '&') {
	              parser.state = S.ATTRIB_VALUE_ENTITY_U
	            } else {
	              parser.attribValue += c
	            }
	            continue
	          }
	          attrib(parser)
	          if (c === '>') {
	            openTag(parser)
	          } else {
	            parser.state = S.ATTRIB
	          }
	          continue
	
	        case S.CLOSE_TAG:
	          if (!parser.tagName) {
	            if (is(whitespace, c)) {
	              continue
	            } else if (not(nameStart, c)) {
	              if (parser.script) {
	                parser.script += '</' + c
	                parser.state = S.SCRIPT
	              } else {
	                strictFail(parser, 'Invalid tagname in closing tag.')
	              }
	            } else {
	              parser.tagName = c
	            }
	          } else if (c === '>') {
	            closeTag(parser)
	          } else if (is(nameBody, c)) {
	            parser.tagName += c
	          } else if (parser.script) {
	            parser.script += '</' + parser.tagName
	            parser.tagName = ''
	            parser.state = S.SCRIPT
	          } else {
	            if (not(whitespace, c)) {
	              strictFail(parser, 'Invalid tagname in closing tag')
	            }
	            parser.state = S.CLOSE_TAG_SAW_WHITE
	          }
	          continue
	
	        case S.CLOSE_TAG_SAW_WHITE:
	          if (is(whitespace, c)) {
	            continue
	          }
	          if (c === '>') {
	            closeTag(parser)
	          } else {
	            strictFail(parser, 'Invalid characters in closing tag')
	          }
	          continue
	
	        case S.TEXT_ENTITY:
	        case S.ATTRIB_VALUE_ENTITY_Q:
	        case S.ATTRIB_VALUE_ENTITY_U:
	          var returnState
	          var buffer
	          switch (parser.state) {
	            case S.TEXT_ENTITY:
	              returnState = S.TEXT
	              buffer = 'textNode'
	              break
	
	            case S.ATTRIB_VALUE_ENTITY_Q:
	              returnState = S.ATTRIB_VALUE_QUOTED
	              buffer = 'attribValue'
	              break
	
	            case S.ATTRIB_VALUE_ENTITY_U:
	              returnState = S.ATTRIB_VALUE_UNQUOTED
	              buffer = 'attribValue'
	              break
	          }
	
	          if (c === ';') {
	            parser[buffer] += parseEntity(parser)
	            parser.entity = ''
	            parser.state = returnState
	          } else if (is(parser.entity.length ? entityBody : entityStart, c)) {
	            parser.entity += c
	          } else {
	            strictFail(parser, 'Invalid character in entity name')
	            parser[buffer] += '&' + parser.entity + c
	            parser.entity = ''
	            parser.state = returnState
	          }
	
	          continue
	
	        default:
	          throw new Error(parser, 'Unknown state: ' + parser.state)
	      }
	    } // while
	
	    if (parser.position >= parser.bufferCheckPosition) {
	      checkBufferLength(parser)
	    }
	    return parser
	  }
	
	  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
	  if (!String.fromCodePoint) {
	    (function () {
	      var stringFromCharCode = String.fromCharCode
	      var floor = Math.floor
	      var fromCodePoint = function () {
	        var MAX_SIZE = 0x4000
	        var codeUnits = []
	        var highSurrogate
	        var lowSurrogate
	        var index = -1
	        var length = arguments.length
	        if (!length) {
	          return ''
	        }
	        var result = ''
	        while (++index < length) {
	          var codePoint = Number(arguments[index])
	          if (
	            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
	            codePoint < 0 || // not a valid Unicode code point
	            codePoint > 0x10FFFF || // not a valid Unicode code point
	            floor(codePoint) !== codePoint // not an integer
	          ) {
	            throw RangeError('Invalid code point: ' + codePoint)
	          }
	          if (codePoint <= 0xFFFF) { // BMP code point
	            codeUnits.push(codePoint)
	          } else { // Astral code point; split in surrogate halves
	            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	            codePoint -= 0x10000
	            highSurrogate = (codePoint >> 10) + 0xD800
	            lowSurrogate = (codePoint % 0x400) + 0xDC00
	            codeUnits.push(highSurrogate, lowSurrogate)
	          }
	          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
	            result += stringFromCharCode.apply(null, codeUnits)
	            codeUnits.length = 0
	          }
	        }
	        return result
	      }
	      if (Object.defineProperty) {
	        Object.defineProperty(String, 'fromCodePoint', {
	          value: fromCodePoint,
	          configurable: true,
	          writable: true
	        })
	      } else {
	        String.fromCodePoint = fromCodePoint
	      }
	    }())
	  }
	})( false ? this.sax = {} : exports)
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(390).Buffer))

/***/ },
/* 390 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */
	
	'use strict'
	
	var base64 = __webpack_require__(391)
	var ieee754 = __webpack_require__(392)
	var isArray = __webpack_require__(393)
	
	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	
	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.
	
	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()
	
	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	exports.kMaxLength = kMaxLength()
	
	function typedArraySupport () {
	  try {
	    var arr = new Uint8Array(1)
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}
	
	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}
	
	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length)
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length)
	    }
	    that.length = length
	  }
	
	  return that
	}
	
	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */
	
	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }
	
	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}
	
	Buffer.poolSize = 8192 // not used by this implementation
	
	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype
	  return arr
	}
	
	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }
	
	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }
	
	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }
	
	  return fromObject(that, value)
	}
	
	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	}
	
	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	  if (typeof Symbol !== 'undefined' && Symbol.species &&
	      Buffer[Symbol.species] === Buffer) {
	    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	    Object.defineProperty(Buffer, Symbol.species, {
	      value: null,
	      configurable: true
	    })
	  }
	}
	
	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}
	
	function alloc (that, size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}
	
	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	}
	
	function allocUnsafe (that, size) {
	  assertSize(size)
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0
	    }
	  }
	  return that
	}
	
	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	}
	
	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8'
	  }
	
	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }
	
	  var length = byteLength(string, encoding) | 0
	  that = createBuffer(that, length)
	
	  var actual = that.write(string, encoding)
	
	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual)
	  }
	
	  return that
	}
	
	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  that = createBuffer(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}
	
	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength // this throws if `array` is not a valid ArrayBuffer
	
	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }
	
	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }
	
	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array)
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset)
	  } else {
	    array = new Uint8Array(array, byteOffset, length)
	  }
	
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array)
	  }
	  return that
	}
	
	function fromObject (that, obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0
	    that = createBuffer(that, len)
	
	    if (that.length === 0) {
	      return that
	    }
	
	    obj.copy(that, 0, 0, len)
	    return that
	  }
	
	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }
	
	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }
	
	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}
	
	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}
	
	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0
	  }
	  return Buffer.alloc(+length)
	}
	
	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}
	
	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }
	
	  if (a === b) return 0
	
	  var x = a.length
	  var y = b.length
	
	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i]
	      y = b[i]
	      break
	    }
	  }
	
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}
	
	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}
	
	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }
	
	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }
	
	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length
	    }
	  }
	
	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i]
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos)
	    pos += buf.length
	  }
	  return buffer
	}
	
	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string
	  }
	
	  var len = string.length
	  if (len === 0) return 0
	
	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength
	
	function slowToString (encoding, start, end) {
	  var loweredCase = false
	
	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.
	
	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }
	
	  if (end === undefined || end > this.length) {
	    end = this.length
	  }
	
	  if (end <= 0) {
	    return ''
	  }
	
	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0
	
	  if (end <= start) {
	    return ''
	  }
	
	  if (!encoding) encoding = 'utf8'
	
	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)
	
	      case 'ascii':
	        return asciiSlice(this, start, end)
	
	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)
	
	      case 'base64':
	        return base64Slice(this, start, end)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true
	
	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}
	
	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1)
	  }
	  return this
	}
	
	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3)
	    swap(this, i + 1, i + 2)
	  }
	  return this
	}
	
	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7)
	    swap(this, i + 1, i + 6)
	    swap(this, i + 2, i + 5)
	    swap(this, i + 3, i + 4)
	  }
	  return this
	}
	
	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}
	
	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}
	
	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}
	
	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }
	
	  if (start === undefined) {
	    start = 0
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
	    thisStart = 0
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length
	  }
	
	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }
	
	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }
	
	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0
	
	  if (this === target) return 0
	
	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)
	
	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)
	
	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i]
	      y = targetCopy[i]
	      break
	    }
	  }
	
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}
	
	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1
	
	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset
	    byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1)
	  }
	
	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0
	    else return -1
	  }
	
	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding)
	  }
	
	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }
	
	  throw new TypeError('val must be string, number or Buffer')
	}
	
	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length
	
	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase()
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2
	      arrLength /= 2
	      valLength /= 2
	      byteOffset /= 2
	    }
	  }
	
	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }
	
	  var i
	  if (dir) {
	    var foundIndex = -1
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex
	        foundIndex = -1
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false
	          break
	        }
	      }
	      if (found) return i
	    }
	  }
	
	  return -1
	}
	
	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}
	
	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}
	
	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}
	
	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }
	
	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')
	
	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed
	  }
	  return i
	}
	
	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}
	
	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}
	
	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}
	
	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }
	
	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining
	
	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }
	
	  if (!encoding) encoding = 'utf8'
	
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)
	
	      case 'ascii':
	        return asciiWrite(this, string, offset, length)
	
	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)
	
	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}
	
	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}
	
	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []
	
	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1
	
	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint
	
	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }
	
	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }
	
	    res.push(codePoint)
	    i += bytesPerSequence
	  }
	
	  return decodeCodePointsArray(res)
	}
	
	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000
	
	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }
	
	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}
	
	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}
	
	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}
	
	function hexSlice (buf, start, end) {
	  var len = buf.length
	
	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len
	
	  var out = ''
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i])
	  }
	  return out
	}
	
	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}
	
	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end
	
	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }
	
	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }
	
	  if (end < start) end = start
	
	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end)
	    newBuf.__proto__ = Buffer.prototype
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start]
	    }
	  }
	
	  return newBuf
	}
	
	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}
	
	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }
	
	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}
	
	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}
	
	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}
	
	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}
	
	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}
	
	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}
	
	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}
	
	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}
	
	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}
	
	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}
	
	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}
	
	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}
	
	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}
	
	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }
	
	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }
	
	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}
	
	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}
	
	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}
	
	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}
	
	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}
	
	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}
	
	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}
	
	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}
	
	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}
	
	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}
	
	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}
	
	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start
	
	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0
	
	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')
	
	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }
	
	  var len = end - start
	  var i
	
	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    )
	  }
	
	  return len
	}
	
	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start
	      start = 0
	      end = this.length
	    } else if (typeof end === 'string') {
	      encoding = end
	      end = this.length
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0)
	      if (code < 256) {
	        val = code
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255
	  }
	
	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }
	
	  if (end <= start) {
	    return this
	  }
	
	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0
	
	  if (!val) val = 0
	
	  var i
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString())
	    var len = bytes.length
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len]
	    }
	  }
	
	  return this
	}
	
	// HELPER FUNCTIONS
	// ================
	
	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
	
	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}
	
	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}
	
	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}
	
	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []
	
	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i)
	
	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }
	
	        // valid lead
	        leadSurrogate = codePoint
	
	        continue
	      }
	
	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }
	
	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }
	
	    leadSurrogate = null
	
	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }
	
	  return bytes
	}
	
	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}
	
	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break
	
	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }
	
	  return byteArray
	}
	
	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}
	
	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}
	
	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(390).Buffer, (function() { return this; }())))

/***/ },
/* 391 */
/***/ function(module, exports) {

	'use strict'
	
	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray
	
	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
	
	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}
	
	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63
	
	function placeHoldersCount (b64) {
	  var len = b64.length
	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }
	
	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}
	
	function byteLength (b64) {
	  // base64 is 4/3 + up to two characters of the original data
	  return b64.length * 3 / 4 - placeHoldersCount(b64)
	}
	
	function toByteArray (b64) {
	  var i, j, l, tmp, placeHolders, arr
	  var len = b64.length
	  placeHolders = placeHoldersCount(b64)
	
	  arr = new Arr(len * 3 / 4 - placeHolders)
	
	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len
	
	  var L = 0
	
	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
	    arr[L++] = (tmp >> 16) & 0xFF
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[L++] = tmp & 0xFF
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  return arr
	}
	
	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}
	
	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}
	
	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var output = ''
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3
	
	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }
	
	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    output += lookup[tmp >> 2]
	    output += lookup[(tmp << 4) & 0x3F]
	    output += '=='
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
	    output += lookup[tmp >> 10]
	    output += lookup[(tmp >> 4) & 0x3F]
	    output += lookup[(tmp << 2) & 0x3F]
	    output += '='
	  }
	
	  parts.push(output)
	
	  return parts.join('')
	}


/***/ },
/* 392 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]
	
	  i += d
	
	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}
	
	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
	
	  value = Math.abs(value)
	
	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }
	
	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }
	
	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
	
	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
	
	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 393 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 394 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	module.exports = Stream;
	
	var EE = __webpack_require__(395).EventEmitter;
	var inherits = __webpack_require__(2);
	
	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(396);
	Stream.Writable = __webpack_require__(406);
	Stream.Duplex = __webpack_require__(407);
	Stream.Transform = __webpack_require__(408);
	Stream.PassThrough = __webpack_require__(409);
	
	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;
	
	
	
	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.
	
	function Stream() {
	  EE.call(this);
	}
	
	Stream.prototype.pipe = function(dest, options) {
	  var source = this;
	
	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }
	
	  source.on('data', ondata);
	
	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }
	
	  dest.on('drain', ondrain);
	
	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }
	
	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;
	
	    dest.end();
	  }
	
	
	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;
	
	    if (typeof dest.destroy === 'function') dest.destroy();
	  }
	
	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }
	
	  source.on('error', onerror);
	  dest.on('error', onerror);
	
	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);
	
	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);
	
	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);
	
	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);
	
	    dest.removeListener('close', cleanup);
	  }
	
	  source.on('end', cleanup);
	  source.on('close', cleanup);
	
	  dest.on('close', cleanup);
	
	  dest.emit('pipe', source);
	
	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 395 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	
	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 396 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {exports = module.exports = __webpack_require__(397);
	exports.Stream = __webpack_require__(394);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(402);
	exports.Duplex = __webpack_require__(401);
	exports.Transform = __webpack_require__(404);
	exports.PassThrough = __webpack_require__(405);
	if (!process.browser && process.env.READABLE_STREAM === 'disable') {
	  module.exports = __webpack_require__(394);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(245)))

/***/ },
/* 397 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	module.exports = Readable;
	
	/*<replacement>*/
	var isArray = __webpack_require__(398);
	/*</replacement>*/
	
	
	/*<replacement>*/
	var Buffer = __webpack_require__(390).Buffer;
	/*</replacement>*/
	
	Readable.ReadableState = ReadableState;
	
	var EE = __webpack_require__(395).EventEmitter;
	
	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/
	
	var Stream = __webpack_require__(394);
	
	/*<replacement>*/
	var util = __webpack_require__(399);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/
	
	var StringDecoder;
	
	
	/*<replacement>*/
	var debug = __webpack_require__(400);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/
	
	
	util.inherits(Readable, Stream);
	
	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(401);
	
	  options = options || {};
	
	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;
	
	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;
	
	  this.buffer = [];
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;
	
	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;
	
	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	
	
	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;
	
	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.readableObjectMode;
	
	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';
	
	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;
	
	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;
	
	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;
	
	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder)
	      StringDecoder = __webpack_require__(403).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}
	
	function Readable(options) {
	  var Duplex = __webpack_require__(401);
	
	  if (!(this instanceof Readable))
	    return new Readable(options);
	
	  this._readableState = new ReadableState(options, this);
	
	  // legacy
	  this.readable = true;
	
	  Stream.call(this);
	}
	
	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function(chunk, encoding) {
	  var state = this._readableState;
	
	  if (util.isString(chunk) && !state.objectMode) {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = new Buffer(chunk, encoding);
	      encoding = '';
	    }
	  }
	
	  return readableAddChunk(this, state, chunk, encoding, false);
	};
	
	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function(chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};
	
	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (util.isNullOrUndefined(chunk)) {
	    state.reading = false;
	    if (!state.ended)
	      onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var e = new Error('stream.unshift() after end event');
	      stream.emit('error', e);
	    } else {
	      if (state.decoder && !addToFront && !encoding)
	        chunk = state.decoder.write(chunk);
	
	      if (!addToFront)
	        state.reading = false;
	
	      // if we want the data now, just emit it.
	      if (state.flowing && state.length === 0 && !state.sync) {
	        stream.emit('data', chunk);
	        stream.read(0);
	      } else {
	        // update the buffer info.
	        state.length += state.objectMode ? 1 : chunk.length;
	        if (addToFront)
	          state.buffer.unshift(chunk);
	        else
	          state.buffer.push(chunk);
	
	        if (state.needReadable)
	          emitReadable(stream);
	      }
	
	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }
	
	  return needMoreData(state);
	}
	
	
	
	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended &&
	         (state.needReadable ||
	          state.length < state.highWaterMark ||
	          state.length === 0);
	}
	
	// backwards compatibility.
	Readable.prototype.setEncoding = function(enc) {
	  if (!StringDecoder)
	    StringDecoder = __webpack_require__(403).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};
	
	// Don't raise the hwm > 128MB
	var MAX_HWM = 0x800000;
	function roundUpToNextPowerOf2(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2
	    n--;
	    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
	    n++;
	  }
	  return n;
	}
	
	function howMuchToRead(n, state) {
	  if (state.length === 0 && state.ended)
	    return 0;
	
	  if (state.objectMode)
	    return n === 0 ? 0 : 1;
	
	  if (isNaN(n) || util.isNull(n)) {
	    // only flow one buffer at a time
	    if (state.flowing && state.buffer.length)
	      return state.buffer[0].length;
	    else
	      return state.length;
	  }
	
	  if (n <= 0)
	    return 0;
	
	  // If we're asking for more than the target buffer level,
	  // then raise the water mark.  Bump up to the next highest
	  // power of 2, to prevent increasing it excessively in tiny
	  // amounts.
	  if (n > state.highWaterMark)
	    state.highWaterMark = roundUpToNextPowerOf2(n);
	
	  // don't have that much.  return null, unless we've ended.
	  if (n > state.length) {
	    if (!state.ended) {
	      state.needReadable = true;
	      return 0;
	    } else
	      return state.length;
	  }
	
	  return n;
	}
	
	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function(n) {
	  debug('read', n);
	  var state = this._readableState;
	  var nOrig = n;
	
	  if (!util.isNumber(n) || n > 0)
	    state.emittedReadable = false;
	
	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 &&
	      state.needReadable &&
	      (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended)
	      endReadable(this);
	    else
	      emitReadable(this);
	    return null;
	  }
	
	  n = howMuchToRead(n, state);
	
	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0)
	      endReadable(this);
	    return null;
	  }
	
	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.
	
	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);
	
	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }
	
	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  }
	
	  if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0)
	      state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	  }
	
	  // If _read pushed data synchronously, then `reading` will be false,
	  // and we need to re-evaluate how much data we can return to the user.
	  if (doRead && !state.reading)
	    n = howMuchToRead(nOrig, state);
	
	  var ret;
	  if (n > 0)
	    ret = fromList(n, state);
	  else
	    ret = null;
	
	  if (util.isNull(ret)) {
	    state.needReadable = true;
	    n = 0;
	  }
	
	  state.length -= n;
	
	  // If we have nothing in the buffer, then we want to know
	  // as soon as we *do* get something into the buffer.
	  if (state.length === 0 && !state.ended)
	    state.needReadable = true;
	
	  // If we tried to read() past the EOF, then emit end on the next tick.
	  if (nOrig !== n && state.ended && state.length === 0)
	    endReadable(this);
	
	  if (!util.isNull(ret))
	    this.emit('data', ret);
	
	  return ret;
	};
	
	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}
	
	
	function onEofChunk(stream, state) {
	  if (state.decoder && !state.ended) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;
	
	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}
	
	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync)
	      process.nextTick(function() {
	        emitReadable_(stream);
	      });
	    else
	      emitReadable_(stream);
	  }
	}
	
	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}
	
	
	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    process.nextTick(function() {
	      maybeReadMore_(stream, state);
	    });
	  }
	}
	
	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended &&
	         state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;
	    else
	      len = state.length;
	  }
	  state.readingMore = false;
	}
	
	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function(n) {
	  this.emit('error', new Error('not implemented'));
	};
	
	Readable.prototype.pipe = function(dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;
	
	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
	
	  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
	              dest !== process.stdout &&
	              dest !== process.stderr;
	
	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted)
	    process.nextTick(endFn);
	  else
	    src.once('end', endFn);
	
	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }
	
	  function onend() {
	    debug('onend');
	    dest.end();
	  }
	
	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);
	
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);
	
	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain &&
	        (!dest._writableState || dest._writableState.needDrain))
	      ondrain();
	  }
	
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    var ret = dest.write(chunk);
	    if (false === ret) {
	      debug('false write response, pause',
	            src._readableState.awaitDrain);
	      src._readableState.awaitDrain++;
	      src.pause();
	    }
	  }
	
	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EE.listenerCount(dest, 'error') === 0)
	      dest.emit('error', er);
	  }
	  // This is a brutally ugly hack to make sure that our error handler
	  // is attached before any userland ones.  NEVER DO THIS.
	  if (!dest._events || !dest._events.error)
	    dest.on('error', onerror);
	  else if (isArray(dest._events.error))
	    dest._events.error.unshift(onerror);
	  else
	    dest._events.error = [onerror, dest._events.error];
	
	
	
	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);
	
	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }
	
	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);
	
	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }
	
	  return dest;
	};
	
	function pipeOnDrain(src) {
	  return function() {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain)
	      state.awaitDrain--;
	    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}
	
	
	Readable.prototype.unpipe = function(dest) {
	  var state = this._readableState;
	
	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0)
	    return this;
	
	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes)
	      return this;
	
	    if (!dest)
	      dest = state.pipes;
	
	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest)
	      dest.emit('unpipe', this);
	    return this;
	  }
	
	  // slow case. multiple pipe destinations.
	
	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	
	    for (var i = 0; i < len; i++)
	      dests[i].emit('unpipe', this);
	    return this;
	  }
	
	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1)
	    return this;
	
	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1)
	    state.pipes = state.pipes[0];
	
	  dest.emit('unpipe', this);
	
	  return this;
	};
	
	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function(ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);
	
	  // If listening to data, and it has not explicitly been paused,
	  // then call resume to start the flow of data on the next tick.
	  if (ev === 'data' && false !== this._readableState.flowing) {
	    this.resume();
	  }
	
	  if (ev === 'readable' && this.readable) {
	    var state = this._readableState;
	    if (!state.readableListening) {
	      state.readableListening = true;
	      state.emittedReadable = false;
	      state.needReadable = true;
	      if (!state.reading) {
	        var self = this;
	        process.nextTick(function() {
	          debug('readable nexttick read 0');
	          self.read(0);
	        });
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }
	
	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;
	
	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function() {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    if (!state.reading) {
	      debug('resume read 0');
	      this.read(0);
	    }
	    resume(this, state);
	  }
	  return this;
	};
	
	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    process.nextTick(function() {
	      resume_(stream, state);
	    });
	  }
	}
	
	function resume_(stream, state) {
	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading)
	    stream.read(0);
	}
	
	Readable.prototype.pause = function() {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};
	
	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  if (state.flowing) {
	    do {
	      var chunk = stream.read();
	    } while (null !== chunk && state.flowing);
	  }
	}
	
	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function(stream) {
	  var state = this._readableState;
	  var paused = false;
	
	  var self = this;
	  stream.on('end', function() {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length)
	        self.push(chunk);
	    }
	
	    self.push(null);
	  });
	
	  stream.on('data', function(chunk) {
	    debug('wrapped data');
	    if (state.decoder)
	      chunk = state.decoder.write(chunk);
	    if (!chunk || !state.objectMode && !chunk.length)
	      return;
	
	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });
	
	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
	      this[i] = function(method) { return function() {
	        return stream[method].apply(stream, arguments);
	      }}(i);
	    }
	  }
	
	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function(ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });
	
	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function(n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };
	
	  return self;
	};
	
	
	
	// exposed for testing purposes only.
	Readable._fromList = fromList;
	
	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	function fromList(n, state) {
	  var list = state.buffer;
	  var length = state.length;
	  var stringMode = !!state.decoder;
	  var objectMode = !!state.objectMode;
	  var ret;
	
	  // nothing in the list, definitely empty.
	  if (list.length === 0)
	    return null;
	
	  if (length === 0)
	    ret = null;
	  else if (objectMode)
	    ret = list.shift();
	  else if (!n || n >= length) {
	    // read it all, truncate the array.
	    if (stringMode)
	      ret = list.join('');
	    else
	      ret = Buffer.concat(list, length);
	    list.length = 0;
	  } else {
	    // read just some of it.
	    if (n < list[0].length) {
	      // just take a part of the first list item.
	      // slice is the same for buffers and strings.
	      var buf = list[0];
	      ret = buf.slice(0, n);
	      list[0] = buf.slice(n);
	    } else if (n === list[0].length) {
	      // first list is a perfect match
	      ret = list.shift();
	    } else {
	      // complex case.
	      // we have enough to cover it, but it spans past the first buffer.
	      if (stringMode)
	        ret = '';
	      else
	        ret = new Buffer(n);
	
	      var c = 0;
	      for (var i = 0, l = list.length; i < l && c < n; i++) {
	        var buf = list[0];
	        var cpy = Math.min(n - c, buf.length);
	
	        if (stringMode)
	          ret += buf.slice(0, cpy);
	        else
	          buf.copy(ret, c, 0, cpy);
	
	        if (cpy < buf.length)
	          list[0] = buf.slice(cpy);
	        else
	          list.shift();
	
	        c += cpy;
	      }
	    }
	  }
	
	  return ret;
	}
	
	function endReadable(stream) {
	  var state = stream._readableState;
	
	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0)
	    throw new Error('endReadable called on non-empty stream');
	
	  if (!state.endEmitted) {
	    state.ended = true;
	    process.nextTick(function() {
	      // Check that we didn't get one last unshift.
	      if (!state.endEmitted && state.length === 0) {
	        state.endEmitted = true;
	        stream.readable = false;
	        stream.emit('end');
	      }
	    });
	  }
	}
	
	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}
	
	function indexOf (xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(245)))

/***/ },
/* 398 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 399 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	
	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = Buffer.isBuffer;
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(390).Buffer))

/***/ },
/* 400 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 401 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.
	
	module.exports = Duplex;
	
	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}
	/*</replacement>*/
	
	
	/*<replacement>*/
	var util = __webpack_require__(399);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/
	
	var Readable = __webpack_require__(397);
	var Writable = __webpack_require__(402);
	
	util.inherits(Duplex, Readable);
	
	forEach(objectKeys(Writable.prototype), function(method) {
	  if (!Duplex.prototype[method])
	    Duplex.prototype[method] = Writable.prototype[method];
	});
	
	function Duplex(options) {
	  if (!(this instanceof Duplex))
	    return new Duplex(options);
	
	  Readable.call(this, options);
	  Writable.call(this, options);
	
	  if (options && options.readable === false)
	    this.readable = false;
	
	  if (options && options.writable === false)
	    this.writable = false;
	
	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false)
	    this.allowHalfOpen = false;
	
	  this.once('end', onend);
	}
	
	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended)
	    return;
	
	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  process.nextTick(this.end.bind(this));
	}
	
	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(245)))

/***/ },
/* 402 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, cb), and it'll handle all
	// the drain event emission and buffering.
	
	module.exports = Writable;
	
	/*<replacement>*/
	var Buffer = __webpack_require__(390).Buffer;
	/*</replacement>*/
	
	Writable.WritableState = WritableState;
	
	
	/*<replacement>*/
	var util = __webpack_require__(399);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/
	
	var Stream = __webpack_require__(394);
	
	util.inherits(Writable, Stream);
	
	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}
	
	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(401);
	
	  options = options || {};
	
	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;
	
	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;
	
	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.writableObjectMode;
	
	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;
	
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;
	
	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;
	
	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';
	
	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;
	
	  // a flag to see when we're in the middle of a write.
	  this.writing = false;
	
	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;
	
	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;
	
	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;
	
	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function(er) {
	    onwrite(stream, er);
	  };
	
	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;
	
	  // the amount that is being written when _write is called.
	  this.writelen = 0;
	
	  this.buffer = [];
	
	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;
	
	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;
	
	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;
	}
	
	function Writable(options) {
	  var Duplex = __webpack_require__(401);
	
	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex))
	    return new Writable(options);
	
	  this._writableState = new WritableState(options, this);
	
	  // legacy.
	  this.writable = true;
	
	  Stream.call(this);
	}
	
	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function() {
	  this.emit('error', new Error('Cannot pipe. Not readable.'));
	};
	
	
	function writeAfterEnd(stream, state, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  process.nextTick(function() {
	    cb(er);
	  });
	}
	
	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    var er = new TypeError('Invalid non-string/buffer chunk');
	    stream.emit('error', er);
	    process.nextTick(function() {
	      cb(er);
	    });
	    valid = false;
	  }
	  return valid;
	}
	
	Writable.prototype.write = function(chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	
	  if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }
	
	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  else if (!encoding)
	    encoding = state.defaultEncoding;
	
	  if (!util.isFunction(cb))
	    cb = function() {};
	
	  if (state.ended)
	    writeAfterEnd(this, state, cb);
	  else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }
	
	  return ret;
	};
	
	Writable.prototype.cork = function() {
	  var state = this._writableState;
	
	  state.corked++;
	};
	
	Writable.prototype.uncork = function() {
	  var state = this._writableState;
	
	  if (state.corked) {
	    state.corked--;
	
	    if (!state.writing &&
	        !state.corked &&
	        !state.finished &&
	        !state.bufferProcessing &&
	        state.buffer.length)
	      clearBuffer(this, state);
	  }
	};
	
	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode &&
	      state.decodeStrings !== false &&
	      util.isString(chunk)) {
	    chunk = new Buffer(chunk, encoding);
	  }
	  return chunk;
	}
	
	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);
	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;
	
	  state.length += len;
	
	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret)
	    state.needDrain = true;
	
	  if (state.writing || state.corked)
	    state.buffer.push(new WriteReq(chunk, encoding, cb));
	  else
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	
	  return ret;
	}
	
	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev)
	    stream._writev(chunk, state.onwrite);
	  else
	    stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}
	
	function onwriteError(stream, state, sync, er, cb) {
	  if (sync)
	    process.nextTick(function() {
	      state.pendingcb--;
	      cb(er);
	    });
	  else {
	    state.pendingcb--;
	    cb(er);
	  }
	
	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}
	
	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}
	
	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;
	
	  onwriteStateUpdate(state);
	
	  if (er)
	    onwriteError(stream, state, sync, er, cb);
	  else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(stream, state);
	
	    if (!finished &&
	        !state.corked &&
	        !state.bufferProcessing &&
	        state.buffer.length) {
	      clearBuffer(stream, state);
	    }
	
	    if (sync) {
	      process.nextTick(function() {
	        afterWrite(stream, state, finished, cb);
	      });
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}
	
	function afterWrite(stream, state, finished, cb) {
	  if (!finished)
	    onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}
	
	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}
	
	
	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	
	  if (stream._writev && state.buffer.length > 1) {
	    // Fast case, write everything using _writev()
	    var cbs = [];
	    for (var c = 0; c < state.buffer.length; c++)
	      cbs.push(state.buffer[c].callback);
	
	    // count the one we are adding, as well.
	    // TODO(isaacs) clean this up
	    state.pendingcb++;
	    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
	      for (var i = 0; i < cbs.length; i++) {
	        state.pendingcb--;
	        cbs[i](err);
	      }
	    });
	
	    // Clear buffer
	    state.buffer = [];
	  } else {
	    // Slow case, write chunks one-by-one
	    for (var c = 0; c < state.buffer.length; c++) {
	      var entry = state.buffer[c];
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;
	
	      doWrite(stream, state, false, len, chunk, encoding, cb);
	
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        c++;
	        break;
	      }
	    }
	
	    if (c < state.buffer.length)
	      state.buffer = state.buffer.slice(c);
	    else
	      state.buffer.length = 0;
	  }
	
	  state.bufferProcessing = false;
	}
	
	Writable.prototype._write = function(chunk, encoding, cb) {
	  cb(new Error('not implemented'));
	
	};
	
	Writable.prototype._writev = null;
	
	Writable.prototype.end = function(chunk, encoding, cb) {
	  var state = this._writableState;
	
	  if (util.isFunction(chunk)) {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }
	
	  if (!util.isNullOrUndefined(chunk))
	    this.write(chunk, encoding);
	
	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }
	
	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished)
	    endWritable(this, state, cb);
	};
	
	
	function needFinish(stream, state) {
	  return (state.ending &&
	          state.length === 0 &&
	          !state.finished &&
	          !state.writing);
	}
	
	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}
	
	function finishMaybe(stream, state) {
	  var need = needFinish(stream, state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else
	      prefinish(stream, state);
	  }
	  return need;
	}
	
	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished)
	      process.nextTick(cb);
	    else
	      stream.once('finish', cb);
	  }
	  state.ended = true;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(245)))

/***/ },
/* 403 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var Buffer = __webpack_require__(390).Buffer;
	
	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }
	
	
	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}
	
	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }
	
	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};
	
	
	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;
	
	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;
	
	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }
	
	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);
	
	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
	
	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;
	
	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }
	
	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);
	
	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }
	
	  charStr += buffer.toString(this.encoding, 0, end);
	
	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }
	
	  // or just emit the charStr
	  return charStr;
	};
	
	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;
	
	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];
	
	    // See http://en.wikipedia.org/wiki/UTF-8#Description
	
	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }
	
	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }
	
	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};
	
	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);
	
	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }
	
	  return res;
	};
	
	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}
	
	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}
	
	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ },
/* 404 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	
	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.
	
	module.exports = Transform;
	
	var Duplex = __webpack_require__(401);
	
	/*<replacement>*/
	var util = __webpack_require__(399);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/
	
	util.inherits(Transform, Duplex);
	
	
	function TransformState(options, stream) {
	  this.afterTransform = function(er, data) {
	    return afterTransform(stream, er, data);
	  };
	
	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	}
	
	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;
	
	  var cb = ts.writecb;
	
	  if (!cb)
	    return stream.emit('error', new Error('no writecb in Transform class'));
	
	  ts.writechunk = null;
	  ts.writecb = null;
	
	  if (!util.isNullOrUndefined(data))
	    stream.push(data);
	
	  if (cb)
	    cb(er);
	
	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}
	
	
	function Transform(options) {
	  if (!(this instanceof Transform))
	    return new Transform(options);
	
	  Duplex.call(this, options);
	
	  this._transformState = new TransformState(options, this);
	
	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;
	
	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;
	
	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;
	
	  this.once('prefinish', function() {
	    if (util.isFunction(this._flush))
	      this._flush(function(er) {
	        done(stream, er);
	      });
	    else
	      done(stream);
	  });
	}
	
	Transform.prototype.push = function(chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};
	
	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function(chunk, encoding, cb) {
	  throw new Error('not implemented');
	};
	
	Transform.prototype._write = function(chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform ||
	        rs.needReadable ||
	        rs.length < rs.highWaterMark)
	      this._read(rs.highWaterMark);
	  }
	};
	
	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function(n) {
	  var ts = this._transformState;
	
	  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};
	
	
	function done(stream, er) {
	  if (er)
	    return stream.emit('error', er);
	
	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;
	
	  if (ws.length)
	    throw new Error('calling transform done when ws.length != 0');
	
	  if (ts.transforming)
	    throw new Error('calling transform done when still transforming');
	
	  return stream.push(null);
	}


/***/ },
/* 405 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.
	
	module.exports = PassThrough;
	
	var Transform = __webpack_require__(404);
	
	/*<replacement>*/
	var util = __webpack_require__(399);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/
	
	util.inherits(PassThrough, Transform);
	
	function PassThrough(options) {
	  if (!(this instanceof PassThrough))
	    return new PassThrough(options);
	
	  Transform.call(this, options);
	}
	
	PassThrough.prototype._transform = function(chunk, encoding, cb) {
	  cb(null, chunk);
	};


/***/ },
/* 406 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(402)


/***/ },
/* 407 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(401)


/***/ },
/* 408 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(404)


/***/ },
/* 409 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(405)


/***/ },
/* 410 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLBuilder, assign;
	
	  assign = __webpack_require__(7);
	
	  XMLBuilder = __webpack_require__(411);
	
	  module.exports.create = function(name, xmldec, doctype, options) {
	    options = assign({}, xmldec, doctype, options);
	    return new XMLBuilder(name, options).root();
	  };
	
	}).call(this);


/***/ },
/* 411 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLBuilder, XMLDeclaration, XMLDocType, XMLElement, XMLStringifier;
	
	  XMLStringifier = __webpack_require__(412);
	
	  XMLDeclaration = __webpack_require__(413);
	
	  XMLDocType = __webpack_require__(420);
	
	  XMLElement = __webpack_require__(415);
	
	  module.exports = XMLBuilder = (function() {
	    function XMLBuilder(name, options) {
	      var root, temp;
	      if (name == null) {
	        throw new Error("Root element needs a name");
	      }
	      if (options == null) {
	        options = {};
	      }
	      this.options = options;
	      this.stringify = new XMLStringifier(options);
	      temp = new XMLElement(this, 'doc');
	      root = temp.element(name);
	      root.isRoot = true;
	      root.documentObject = this;
	      this.rootObject = root;
	      if (!options.headless) {
	        root.declaration(options);
	        if ((options.pubID != null) || (options.sysID != null)) {
	          root.doctype(options);
	        }
	      }
	    }
	
	    XMLBuilder.prototype.root = function() {
	      return this.rootObject;
	    };
	
	    XMLBuilder.prototype.end = function(options) {
	      return this.toString(options);
	    };
	
	    XMLBuilder.prototype.toString = function(options) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      r = '';
	      if (this.xmldec != null) {
	        r += this.xmldec.toString(options);
	      }
	      if (this.doctype != null) {
	        r += this.doctype.toString(options);
	      }
	      r += this.rootObject.toString(options);
	      if (pretty && r.slice(-newline.length) === newline) {
	        r = r.slice(0, -newline.length);
	      }
	      return r;
	    };
	
	    return XMLBuilder;
	
	  })();
	
	}).call(this);


/***/ },
/* 412 */
/***/ function(module, exports) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLStringifier,
	    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
	    hasProp = {}.hasOwnProperty;
	
	  module.exports = XMLStringifier = (function() {
	    function XMLStringifier(options) {
	      this.assertLegalChar = bind(this.assertLegalChar, this);
	      var key, ref, value;
	      this.allowSurrogateChars = options != null ? options.allowSurrogateChars : void 0;
	      this.noDoubleEncoding = options != null ? options.noDoubleEncoding : void 0;
	      ref = (options != null ? options.stringify : void 0) || {};
	      for (key in ref) {
	        if (!hasProp.call(ref, key)) continue;
	        value = ref[key];
	        this[key] = value;
	      }
	    }
	
	    XMLStringifier.prototype.eleName = function(val) {
	      val = '' + val || '';
	      return this.assertLegalChar(val);
	    };
	
	    XMLStringifier.prototype.eleText = function(val) {
	      val = '' + val || '';
	      return this.assertLegalChar(this.elEscape(val));
	    };
	
	    XMLStringifier.prototype.cdata = function(val) {
	      val = '' + val || '';
	      if (val.match(/]]>/)) {
	        throw new Error("Invalid CDATA text: " + val);
	      }
	      return this.assertLegalChar(val);
	    };
	
	    XMLStringifier.prototype.comment = function(val) {
	      val = '' + val || '';
	      if (val.match(/--/)) {
	        throw new Error("Comment text cannot contain double-hypen: " + val);
	      }
	      return this.assertLegalChar(val);
	    };
	
	    XMLStringifier.prototype.raw = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.attName = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.attValue = function(val) {
	      val = '' + val || '';
	      return this.attEscape(val);
	    };
	
	    XMLStringifier.prototype.insTarget = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.insValue = function(val) {
	      val = '' + val || '';
	      if (val.match(/\?>/)) {
	        throw new Error("Invalid processing instruction value: " + val);
	      }
	      return val;
	    };
	
	    XMLStringifier.prototype.xmlVersion = function(val) {
	      val = '' + val || '';
	      if (!val.match(/1\.[0-9]+/)) {
	        throw new Error("Invalid version number: " + val);
	      }
	      return val;
	    };
	
	    XMLStringifier.prototype.xmlEncoding = function(val) {
	      val = '' + val || '';
	      if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-]|-)*$/)) {
	        throw new Error("Invalid encoding: " + val);
	      }
	      return val;
	    };
	
	    XMLStringifier.prototype.xmlStandalone = function(val) {
	      if (val) {
	        return "yes";
	      } else {
	        return "no";
	      }
	    };
	
	    XMLStringifier.prototype.dtdPubID = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.dtdSysID = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.dtdElementValue = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.dtdAttType = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.dtdAttDefault = function(val) {
	      if (val != null) {
	        return '' + val || '';
	      } else {
	        return val;
	      }
	    };
	
	    XMLStringifier.prototype.dtdEntityValue = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.dtdNData = function(val) {
	      return '' + val || '';
	    };
	
	    XMLStringifier.prototype.convertAttKey = '@';
	
	    XMLStringifier.prototype.convertPIKey = '?';
	
	    XMLStringifier.prototype.convertTextKey = '#text';
	
	    XMLStringifier.prototype.convertCDataKey = '#cdata';
	
	    XMLStringifier.prototype.convertCommentKey = '#comment';
	
	    XMLStringifier.prototype.convertRawKey = '#raw';
	
	    XMLStringifier.prototype.assertLegalChar = function(str) {
	      var chars, chr;
	      if (this.allowSurrogateChars) {
	        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/;
	      } else {
	        chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
	      }
	      chr = str.match(chars);
	      if (chr) {
	        throw new Error("Invalid character (" + chr + ") in string: " + str + " at index " + chr.index);
	      }
	      return str;
	    };
	
	    XMLStringifier.prototype.elEscape = function(str) {
	      var ampregex;
	      ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
	      return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
	    };
	
	    XMLStringifier.prototype.attEscape = function(str) {
	      var ampregex;
	      ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
	      return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	    };
	
	    return XMLStringifier;
	
	  })();
	
	}).call(this);


/***/ },
/* 413 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLDeclaration, XMLNode, create, isObject,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  isObject = __webpack_require__(20);
	
	  XMLNode = __webpack_require__(414);
	
	  module.exports = XMLDeclaration = (function(superClass) {
	    extend(XMLDeclaration, superClass);
	
	    function XMLDeclaration(parent, version, encoding, standalone) {
	      var ref;
	      XMLDeclaration.__super__.constructor.call(this, parent);
	      if (isObject(version)) {
	        ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
	      }
	      if (!version) {
	        version = '1.0';
	      }
	      this.version = this.stringify.xmlVersion(version);
	      if (encoding != null) {
	        this.encoding = this.stringify.xmlEncoding(encoding);
	      }
	      if (standalone != null) {
	        this.standalone = this.stringify.xmlStandalone(standalone);
	      }
	    }
	
	    XMLDeclaration.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<?xml';
	      r += ' version="' + this.version + '"';
	      if (this.encoding != null) {
	        r += ' encoding="' + this.encoding + '"';
	      }
	      if (this.standalone != null) {
	        r += ' standalone="' + this.standalone + '"';
	      }
	      r += '?>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLDeclaration;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 414 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLElement, XMLNode, XMLRaw, XMLText, isEmpty, isFunction, isObject,
	    hasProp = {}.hasOwnProperty;
	
	  isObject = __webpack_require__(20);
	
	  isFunction = __webpack_require__(13);
	
	  isEmpty = __webpack_require__(274);
	
	  XMLElement = null;
	
	  XMLCData = null;
	
	  XMLComment = null;
	
	  XMLDeclaration = null;
	
	  XMLDocType = null;
	
	  XMLRaw = null;
	
	  XMLText = null;
	
	  module.exports = XMLNode = (function() {
	    function XMLNode(parent) {
	      this.parent = parent;
	      this.options = this.parent.options;
	      this.stringify = this.parent.stringify;
	      if (XMLElement === null) {
	        XMLElement = __webpack_require__(415);
	        XMLCData = __webpack_require__(418);
	        XMLComment = __webpack_require__(419);
	        XMLDeclaration = __webpack_require__(413);
	        XMLDocType = __webpack_require__(420);
	        XMLRaw = __webpack_require__(425);
	        XMLText = __webpack_require__(426);
	      }
	    }
	
	    XMLNode.prototype.element = function(name, attributes, text) {
	      var childNode, item, j, k, key, lastChild, len, len1, ref, val;
	      lastChild = null;
	      if (attributes == null) {
	        attributes = {};
	      }
	      attributes = attributes.valueOf();
	      if (!isObject(attributes)) {
	        ref = [attributes, text], text = ref[0], attributes = ref[1];
	      }
	      if (name != null) {
	        name = name.valueOf();
	      }
	      if (Array.isArray(name)) {
	        for (j = 0, len = name.length; j < len; j++) {
	          item = name[j];
	          lastChild = this.element(item);
	        }
	      } else if (isFunction(name)) {
	        lastChild = this.element(name.apply());
	      } else if (isObject(name)) {
	        for (key in name) {
	          if (!hasProp.call(name, key)) continue;
	          val = name[key];
	          if (isFunction(val)) {
	            val = val.apply();
	          }
	          if ((isObject(val)) && (isEmpty(val))) {
	            val = null;
	          }
	          if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
	            lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
	          } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && key.indexOf(this.stringify.convertPIKey) === 0) {
	            lastChild = this.instruction(key.substr(this.stringify.convertPIKey.length), val);
	          } else if (!this.options.separateArrayItems && Array.isArray(val)) {
	            for (k = 0, len1 = val.length; k < len1; k++) {
	              item = val[k];
	              childNode = {};
	              childNode[key] = item;
	              lastChild = this.element(childNode);
	            }
	          } else if (isObject(val)) {
	            lastChild = this.element(key);
	            lastChild.element(val);
	          } else {
	            lastChild = this.element(key, val);
	          }
	        }
	      } else {
	        if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
	          lastChild = this.text(text);
	        } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
	          lastChild = this.cdata(text);
	        } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
	          lastChild = this.comment(text);
	        } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
	          lastChild = this.raw(text);
	        } else {
	          lastChild = this.node(name, attributes, text);
	        }
	      }
	      if (lastChild == null) {
	        throw new Error("Could not create any elements with: " + name);
	      }
	      return lastChild;
	    };
	
	    XMLNode.prototype.insertBefore = function(name, attributes, text) {
	      var child, i, removed;
	      if (this.isRoot) {
	        throw new Error("Cannot insert elements at root level");
	      }
	      i = this.parent.children.indexOf(this);
	      removed = this.parent.children.splice(i);
	      child = this.parent.element(name, attributes, text);
	      Array.prototype.push.apply(this.parent.children, removed);
	      return child;
	    };
	
	    XMLNode.prototype.insertAfter = function(name, attributes, text) {
	      var child, i, removed;
	      if (this.isRoot) {
	        throw new Error("Cannot insert elements at root level");
	      }
	      i = this.parent.children.indexOf(this);
	      removed = this.parent.children.splice(i + 1);
	      child = this.parent.element(name, attributes, text);
	      Array.prototype.push.apply(this.parent.children, removed);
	      return child;
	    };
	
	    XMLNode.prototype.remove = function() {
	      var i, ref;
	      if (this.isRoot) {
	        throw new Error("Cannot remove the root element");
	      }
	      i = this.parent.children.indexOf(this);
	      [].splice.apply(this.parent.children, [i, i - i + 1].concat(ref = [])), ref;
	      return this.parent;
	    };
	
	    XMLNode.prototype.node = function(name, attributes, text) {
	      var child, ref;
	      if (name != null) {
	        name = name.valueOf();
	      }
	      if (attributes == null) {
	        attributes = {};
	      }
	      attributes = attributes.valueOf();
	      if (!isObject(attributes)) {
	        ref = [attributes, text], text = ref[0], attributes = ref[1];
	      }
	      child = new XMLElement(this, name, attributes);
	      if (text != null) {
	        child.text(text);
	      }
	      this.children.push(child);
	      return child;
	    };
	
	    XMLNode.prototype.text = function(value) {
	      var child;
	      child = new XMLText(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLNode.prototype.cdata = function(value) {
	      var child;
	      child = new XMLCData(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLNode.prototype.comment = function(value) {
	      var child;
	      child = new XMLComment(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLNode.prototype.raw = function(value) {
	      var child;
	      child = new XMLRaw(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLNode.prototype.declaration = function(version, encoding, standalone) {
	      var doc, xmldec;
	      doc = this.document();
	      xmldec = new XMLDeclaration(doc, version, encoding, standalone);
	      doc.xmldec = xmldec;
	      return doc.root();
	    };
	
	    XMLNode.prototype.doctype = function(pubID, sysID) {
	      var doc, doctype;
	      doc = this.document();
	      doctype = new XMLDocType(doc, pubID, sysID);
	      doc.doctype = doctype;
	      return doctype;
	    };
	
	    XMLNode.prototype.up = function() {
	      if (this.isRoot) {
	        throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
	      }
	      return this.parent;
	    };
	
	    XMLNode.prototype.root = function() {
	      var child;
	      if (this.isRoot) {
	        return this;
	      }
	      child = this.parent;
	      while (!child.isRoot) {
	        child = child.parent;
	      }
	      return child;
	    };
	
	    XMLNode.prototype.document = function() {
	      return this.root().documentObject;
	    };
	
	    XMLNode.prototype.end = function(options) {
	      return this.document().toString(options);
	    };
	
	    XMLNode.prototype.prev = function() {
	      var i;
	      if (this.isRoot) {
	        throw new Error("Root node has no siblings");
	      }
	      i = this.parent.children.indexOf(this);
	      if (i < 1) {
	        throw new Error("Already at the first node");
	      }
	      return this.parent.children[i - 1];
	    };
	
	    XMLNode.prototype.next = function() {
	      var i;
	      if (this.isRoot) {
	        throw new Error("Root node has no siblings");
	      }
	      i = this.parent.children.indexOf(this);
	      if (i === -1 || i === this.parent.children.length - 1) {
	        throw new Error("Already at the last node");
	      }
	      return this.parent.children[i + 1];
	    };
	
	    XMLNode.prototype.importXMLBuilder = function(xmlbuilder) {
	      var clonedRoot;
	      clonedRoot = xmlbuilder.root().clone();
	      clonedRoot.parent = this;
	      clonedRoot.isRoot = false;
	      this.children.push(clonedRoot);
	      return this;
	    };
	
	    XMLNode.prototype.ele = function(name, attributes, text) {
	      return this.element(name, attributes, text);
	    };
	
	    XMLNode.prototype.nod = function(name, attributes, text) {
	      return this.node(name, attributes, text);
	    };
	
	    XMLNode.prototype.txt = function(value) {
	      return this.text(value);
	    };
	
	    XMLNode.prototype.dat = function(value) {
	      return this.cdata(value);
	    };
	
	    XMLNode.prototype.com = function(value) {
	      return this.comment(value);
	    };
	
	    XMLNode.prototype.doc = function() {
	      return this.document();
	    };
	
	    XMLNode.prototype.dec = function(version, encoding, standalone) {
	      return this.declaration(version, encoding, standalone);
	    };
	
	    XMLNode.prototype.dtd = function(pubID, sysID) {
	      return this.doctype(pubID, sysID);
	    };
	
	    XMLNode.prototype.e = function(name, attributes, text) {
	      return this.element(name, attributes, text);
	    };
	
	    XMLNode.prototype.n = function(name, attributes, text) {
	      return this.node(name, attributes, text);
	    };
	
	    XMLNode.prototype.t = function(value) {
	      return this.text(value);
	    };
	
	    XMLNode.prototype.d = function(value) {
	      return this.cdata(value);
	    };
	
	    XMLNode.prototype.c = function(value) {
	      return this.comment(value);
	    };
	
	    XMLNode.prototype.r = function(value) {
	      return this.raw(value);
	    };
	
	    XMLNode.prototype.u = function() {
	      return this.up();
	    };
	
	    return XMLNode;
	
	  })();
	
	}).call(this);


/***/ },
/* 415 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLAttribute, XMLElement, XMLNode, XMLProcessingInstruction, create, every, isFunction, isObject,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  isObject = __webpack_require__(20);
	
	  isFunction = __webpack_require__(13);
	
	  every = __webpack_require__(334);
	
	  XMLNode = __webpack_require__(414);
	
	  XMLAttribute = __webpack_require__(416);
	
	  XMLProcessingInstruction = __webpack_require__(417);
	
	  module.exports = XMLElement = (function(superClass) {
	    extend(XMLElement, superClass);
	
	    function XMLElement(parent, name, attributes) {
	      XMLElement.__super__.constructor.call(this, parent);
	      if (name == null) {
	        throw new Error("Missing element name");
	      }
	      this.name = this.stringify.eleName(name);
	      this.children = [];
	      this.instructions = [];
	      this.attributes = {};
	      if (attributes != null) {
	        this.attribute(attributes);
	      }
	    }
	
	    XMLElement.prototype.clone = function() {
	      var att, attName, clonedSelf, i, len, pi, ref, ref1;
	      clonedSelf = create(XMLElement.prototype, this);
	      if (clonedSelf.isRoot) {
	        clonedSelf.documentObject = null;
	      }
	      clonedSelf.attributes = {};
	      ref = this.attributes;
	      for (attName in ref) {
	        if (!hasProp.call(ref, attName)) continue;
	        att = ref[attName];
	        clonedSelf.attributes[attName] = att.clone();
	      }
	      clonedSelf.instructions = [];
	      ref1 = this.instructions;
	      for (i = 0, len = ref1.length; i < len; i++) {
	        pi = ref1[i];
	        clonedSelf.instructions.push(pi.clone());
	      }
	      clonedSelf.children = [];
	      this.children.forEach(function(child) {
	        var clonedChild;
	        clonedChild = child.clone();
	        clonedChild.parent = clonedSelf;
	        return clonedSelf.children.push(clonedChild);
	      });
	      return clonedSelf;
	    };
	
	    XMLElement.prototype.attribute = function(name, value) {
	      var attName, attValue;
	      if (name != null) {
	        name = name.valueOf();
	      }
	      if (isObject(name)) {
	        for (attName in name) {
	          if (!hasProp.call(name, attName)) continue;
	          attValue = name[attName];
	          this.attribute(attName, attValue);
	        }
	      } else {
	        if (isFunction(value)) {
	          value = value.apply();
	        }
	        if (!this.options.skipNullAttributes || (value != null)) {
	          this.attributes[name] = new XMLAttribute(this, name, value);
	        }
	      }
	      return this;
	    };
	
	    XMLElement.prototype.removeAttribute = function(name) {
	      var attName, i, len;
	      if (name == null) {
	        throw new Error("Missing attribute name");
	      }
	      name = name.valueOf();
	      if (Array.isArray(name)) {
	        for (i = 0, len = name.length; i < len; i++) {
	          attName = name[i];
	          delete this.attributes[attName];
	        }
	      } else {
	        delete this.attributes[name];
	      }
	      return this;
	    };
	
	    XMLElement.prototype.instruction = function(target, value) {
	      var i, insTarget, insValue, instruction, len;
	      if (target != null) {
	        target = target.valueOf();
	      }
	      if (value != null) {
	        value = value.valueOf();
	      }
	      if (Array.isArray(target)) {
	        for (i = 0, len = target.length; i < len; i++) {
	          insTarget = target[i];
	          this.instruction(insTarget);
	        }
	      } else if (isObject(target)) {
	        for (insTarget in target) {
	          if (!hasProp.call(target, insTarget)) continue;
	          insValue = target[insTarget];
	          this.instruction(insTarget, insValue);
	        }
	      } else {
	        if (isFunction(value)) {
	          value = value.apply();
	        }
	        instruction = new XMLProcessingInstruction(this, target, value);
	        this.instructions.push(instruction);
	      }
	      return this;
	    };
	
	    XMLElement.prototype.toString = function(options, level) {
	      var att, child, i, indent, instruction, j, len, len1, name, newline, offset, pretty, r, ref, ref1, ref2, ref3, ref4, ref5, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      ref3 = this.instructions;
	      for (i = 0, len = ref3.length; i < len; i++) {
	        instruction = ref3[i];
	        r += instruction.toString(options, level);
	      }
	      if (pretty) {
	        r += space;
	      }
	      r += '<' + this.name;
	      ref4 = this.attributes;
	      for (name in ref4) {
	        if (!hasProp.call(ref4, name)) continue;
	        att = ref4[name];
	        r += att.toString(options);
	      }
	      if (this.children.length === 0 || every(this.children, function(e) {
	        return e.value === '';
	      })) {
	        r += '/>';
	        if (pretty) {
	          r += newline;
	        }
	      } else if (pretty && this.children.length === 1 && (this.children[0].value != null)) {
	        r += '>';
	        r += this.children[0].value;
	        r += '</' + this.name + '>';
	        r += newline;
	      } else {
	        r += '>';
	        if (pretty) {
	          r += newline;
	        }
	        ref5 = this.children;
	        for (j = 0, len1 = ref5.length; j < len1; j++) {
	          child = ref5[j];
	          r += child.toString(options, level + 1);
	        }
	        if (pretty) {
	          r += space;
	        }
	        r += '</' + this.name + '>';
	        if (pretty) {
	          r += newline;
	        }
	      }
	      return r;
	    };
	
	    XMLElement.prototype.att = function(name, value) {
	      return this.attribute(name, value);
	    };
	
	    XMLElement.prototype.ins = function(target, value) {
	      return this.instruction(target, value);
	    };
	
	    XMLElement.prototype.a = function(name, value) {
	      return this.attribute(name, value);
	    };
	
	    XMLElement.prototype.i = function(target, value) {
	      return this.instruction(target, value);
	    };
	
	    return XMLElement;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 416 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLAttribute, create;
	
	  create = __webpack_require__(106);
	
	  module.exports = XMLAttribute = (function() {
	    function XMLAttribute(parent, name, value) {
	      this.stringify = parent.stringify;
	      if (name == null) {
	        throw new Error("Missing attribute name of element " + parent.name);
	      }
	      if (value == null) {
	        throw new Error("Missing attribute value for attribute " + name + " of element " + parent.name);
	      }
	      this.name = this.stringify.attName(name);
	      this.value = this.stringify.attValue(value);
	    }
	
	    XMLAttribute.prototype.clone = function() {
	      return create(XMLAttribute.prototype, this);
	    };
	
	    XMLAttribute.prototype.toString = function(options, level) {
	      return ' ' + this.name + '="' + this.value + '"';
	    };
	
	    return XMLAttribute;
	
	  })();
	
	}).call(this);


/***/ },
/* 417 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLProcessingInstruction, create;
	
	  create = __webpack_require__(106);
	
	  module.exports = XMLProcessingInstruction = (function() {
	    function XMLProcessingInstruction(parent, target, value) {
	      this.stringify = parent.stringify;
	      if (target == null) {
	        throw new Error("Missing instruction target");
	      }
	      this.target = this.stringify.insTarget(target);
	      if (value) {
	        this.value = this.stringify.insValue(value);
	      }
	    }
	
	    XMLProcessingInstruction.prototype.clone = function() {
	      return create(XMLProcessingInstruction.prototype, this);
	    };
	
	    XMLProcessingInstruction.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<?';
	      r += this.target;
	      if (this.value) {
	        r += ' ' + this.value;
	      }
	      r += '?>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLProcessingInstruction;
	
	  })();
	
	}).call(this);


/***/ },
/* 418 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLCData, XMLNode, create,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  XMLNode = __webpack_require__(414);
	
	  module.exports = XMLCData = (function(superClass) {
	    extend(XMLCData, superClass);
	
	    function XMLCData(parent, text) {
	      XMLCData.__super__.constructor.call(this, parent);
	      if (text == null) {
	        throw new Error("Missing CDATA text");
	      }
	      this.text = this.stringify.cdata(text);
	    }
	
	    XMLCData.prototype.clone = function() {
	      return create(XMLCData.prototype, this);
	    };
	
	    XMLCData.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<![CDATA[' + this.text + ']]>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLCData;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 419 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLComment, XMLNode, create,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  XMLNode = __webpack_require__(414);
	
	  module.exports = XMLComment = (function(superClass) {
	    extend(XMLComment, superClass);
	
	    function XMLComment(parent, text) {
	      XMLComment.__super__.constructor.call(this, parent);
	      if (text == null) {
	        throw new Error("Missing comment text");
	      }
	      this.text = this.stringify.comment(text);
	    }
	
	    XMLComment.prototype.clone = function() {
	      return create(XMLComment.prototype, this);
	    };
	
	    XMLComment.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!-- ' + this.text + ' -->';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLComment;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 420 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLProcessingInstruction, create, isObject;
	
	  create = __webpack_require__(106);
	
	  isObject = __webpack_require__(20);
	
	  XMLCData = __webpack_require__(418);
	
	  XMLComment = __webpack_require__(419);
	
	  XMLDTDAttList = __webpack_require__(421);
	
	  XMLDTDEntity = __webpack_require__(422);
	
	  XMLDTDElement = __webpack_require__(423);
	
	  XMLDTDNotation = __webpack_require__(424);
	
	  XMLProcessingInstruction = __webpack_require__(417);
	
	  module.exports = XMLDocType = (function() {
	    function XMLDocType(parent, pubID, sysID) {
	      var ref, ref1;
	      this.documentObject = parent;
	      this.stringify = this.documentObject.stringify;
	      this.children = [];
	      if (isObject(pubID)) {
	        ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
	      }
	      if (sysID == null) {
	        ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1];
	      }
	      if (pubID != null) {
	        this.pubID = this.stringify.dtdPubID(pubID);
	      }
	      if (sysID != null) {
	        this.sysID = this.stringify.dtdSysID(sysID);
	      }
	    }
	
	    XMLDocType.prototype.element = function(name, value) {
	      var child;
	      child = new XMLDTDElement(this, name, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
	      var child;
	      child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.entity = function(name, value) {
	      var child;
	      child = new XMLDTDEntity(this, false, name, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.pEntity = function(name, value) {
	      var child;
	      child = new XMLDTDEntity(this, true, name, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.notation = function(name, value) {
	      var child;
	      child = new XMLDTDNotation(this, name, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.cdata = function(value) {
	      var child;
	      child = new XMLCData(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.comment = function(value) {
	      var child;
	      child = new XMLComment(this, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.instruction = function(target, value) {
	      var child;
	      child = new XMLProcessingInstruction(this, target, value);
	      this.children.push(child);
	      return this;
	    };
	
	    XMLDocType.prototype.root = function() {
	      return this.documentObject.root();
	    };
	
	    XMLDocType.prototype.document = function() {
	      return this.documentObject;
	    };
	
	    XMLDocType.prototype.toString = function(options, level) {
	      var child, i, indent, len, newline, offset, pretty, r, ref, ref1, ref2, ref3, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!DOCTYPE ' + this.root().name;
	      if (this.pubID && this.sysID) {
	        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
	      } else if (this.sysID) {
	        r += ' SYSTEM "' + this.sysID + '"';
	      }
	      if (this.children.length > 0) {
	        r += ' [';
	        if (pretty) {
	          r += newline;
	        }
	        ref3 = this.children;
	        for (i = 0, len = ref3.length; i < len; i++) {
	          child = ref3[i];
	          r += child.toString(options, level + 1);
	        }
	        r += ']';
	      }
	      r += '>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    XMLDocType.prototype.ele = function(name, value) {
	      return this.element(name, value);
	    };
	
	    XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
	      return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
	    };
	
	    XMLDocType.prototype.ent = function(name, value) {
	      return this.entity(name, value);
	    };
	
	    XMLDocType.prototype.pent = function(name, value) {
	      return this.pEntity(name, value);
	    };
	
	    XMLDocType.prototype.not = function(name, value) {
	      return this.notation(name, value);
	    };
	
	    XMLDocType.prototype.dat = function(value) {
	      return this.cdata(value);
	    };
	
	    XMLDocType.prototype.com = function(value) {
	      return this.comment(value);
	    };
	
	    XMLDocType.prototype.ins = function(target, value) {
	      return this.instruction(target, value);
	    };
	
	    XMLDocType.prototype.up = function() {
	      return this.root();
	    };
	
	    XMLDocType.prototype.doc = function() {
	      return this.document();
	    };
	
	    return XMLDocType;
	
	  })();
	
	}).call(this);


/***/ },
/* 421 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLDTDAttList, create;
	
	  create = __webpack_require__(106);
	
	  module.exports = XMLDTDAttList = (function() {
	    function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
	      this.stringify = parent.stringify;
	      if (elementName == null) {
	        throw new Error("Missing DTD element name");
	      }
	      if (attributeName == null) {
	        throw new Error("Missing DTD attribute name");
	      }
	      if (!attributeType) {
	        throw new Error("Missing DTD attribute type");
	      }
	      if (!defaultValueType) {
	        throw new Error("Missing DTD attribute default");
	      }
	      if (defaultValueType.indexOf('#') !== 0) {
	        defaultValueType = '#' + defaultValueType;
	      }
	      if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
	        throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT");
	      }
	      if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
	        throw new Error("Default value only applies to #FIXED or #DEFAULT");
	      }
	      this.elementName = this.stringify.eleName(elementName);
	      this.attributeName = this.stringify.attName(attributeName);
	      this.attributeType = this.stringify.dtdAttType(attributeType);
	      this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
	      this.defaultValueType = defaultValueType;
	    }
	
	    XMLDTDAttList.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!ATTLIST ' + this.elementName + ' ' + this.attributeName + ' ' + this.attributeType;
	      if (this.defaultValueType !== '#DEFAULT') {
	        r += ' ' + this.defaultValueType;
	      }
	      if (this.defaultValue) {
	        r += ' "' + this.defaultValue + '"';
	      }
	      r += '>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLDTDAttList;
	
	  })();
	
	}).call(this);


/***/ },
/* 422 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLDTDEntity, create, isObject;
	
	  create = __webpack_require__(106);
	
	  isObject = __webpack_require__(20);
	
	  module.exports = XMLDTDEntity = (function() {
	    function XMLDTDEntity(parent, pe, name, value) {
	      this.stringify = parent.stringify;
	      if (name == null) {
	        throw new Error("Missing entity name");
	      }
	      if (value == null) {
	        throw new Error("Missing entity value");
	      }
	      this.pe = !!pe;
	      this.name = this.stringify.eleName(name);
	      if (!isObject(value)) {
	        this.value = this.stringify.dtdEntityValue(value);
	      } else {
	        if (!value.pubID && !value.sysID) {
	          throw new Error("Public and/or system identifiers are required for an external entity");
	        }
	        if (value.pubID && !value.sysID) {
	          throw new Error("System identifier is required for a public external entity");
	        }
	        if (value.pubID != null) {
	          this.pubID = this.stringify.dtdPubID(value.pubID);
	        }
	        if (value.sysID != null) {
	          this.sysID = this.stringify.dtdSysID(value.sysID);
	        }
	        if (value.nData != null) {
	          this.nData = this.stringify.dtdNData(value.nData);
	        }
	        if (this.pe && this.nData) {
	          throw new Error("Notation declaration is not allowed in a parameter entity");
	        }
	      }
	    }
	
	    XMLDTDEntity.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!ENTITY';
	      if (this.pe) {
	        r += ' %';
	      }
	      r += ' ' + this.name;
	      if (this.value) {
	        r += ' "' + this.value + '"';
	      } else {
	        if (this.pubID && this.sysID) {
	          r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
	        } else if (this.sysID) {
	          r += ' SYSTEM "' + this.sysID + '"';
	        }
	        if (this.nData) {
	          r += ' NDATA ' + this.nData;
	        }
	      }
	      r += '>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLDTDEntity;
	
	  })();
	
	}).call(this);


/***/ },
/* 423 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLDTDElement, create;
	
	  create = __webpack_require__(106);
	
	  module.exports = XMLDTDElement = (function() {
	    function XMLDTDElement(parent, name, value) {
	      this.stringify = parent.stringify;
	      if (name == null) {
	        throw new Error("Missing DTD element name");
	      }
	      if (!value) {
	        value = '(#PCDATA)';
	      }
	      if (Array.isArray(value)) {
	        value = '(' + value.join(',') + ')';
	      }
	      this.name = this.stringify.eleName(name);
	      this.value = this.stringify.dtdElementValue(value);
	    }
	
	    XMLDTDElement.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!ELEMENT ' + this.name + ' ' + this.value + '>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLDTDElement;
	
	  })();
	
	}).call(this);


/***/ },
/* 424 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLDTDNotation, create;
	
	  create = __webpack_require__(106);
	
	  module.exports = XMLDTDNotation = (function() {
	    function XMLDTDNotation(parent, name, value) {
	      this.stringify = parent.stringify;
	      if (name == null) {
	        throw new Error("Missing notation name");
	      }
	      if (!value.pubID && !value.sysID) {
	        throw new Error("Public or system identifiers are required for an external entity");
	      }
	      this.name = this.stringify.eleName(name);
	      if (value.pubID != null) {
	        this.pubID = this.stringify.dtdPubID(value.pubID);
	      }
	      if (value.sysID != null) {
	        this.sysID = this.stringify.dtdSysID(value.sysID);
	      }
	    }
	
	    XMLDTDNotation.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += '<!NOTATION ' + this.name;
	      if (this.pubID && this.sysID) {
	        r += ' PUBLIC "' + this.pubID + '" "' + this.sysID + '"';
	      } else if (this.pubID) {
	        r += ' PUBLIC "' + this.pubID + '"';
	      } else if (this.sysID) {
	        r += ' SYSTEM "' + this.sysID + '"';
	      }
	      r += '>';
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLDTDNotation;
	
	  })();
	
	}).call(this);


/***/ },
/* 425 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLNode, XMLRaw, create,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  XMLNode = __webpack_require__(414);
	
	  module.exports = XMLRaw = (function(superClass) {
	    extend(XMLRaw, superClass);
	
	    function XMLRaw(parent, text) {
	      XMLRaw.__super__.constructor.call(this, parent);
	      if (text == null) {
	        throw new Error("Missing raw text");
	      }
	      this.value = this.stringify.raw(text);
	    }
	
	    XMLRaw.prototype.clone = function() {
	      return create(XMLRaw.prototype, this);
	    };
	
	    XMLRaw.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += this.value;
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLRaw;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 426 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.9.1
	(function() {
	  var XMLNode, XMLText, create,
	    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    hasProp = {}.hasOwnProperty;
	
	  create = __webpack_require__(106);
	
	  XMLNode = __webpack_require__(414);
	
	  module.exports = XMLText = (function(superClass) {
	    extend(XMLText, superClass);
	
	    function XMLText(parent, text) {
	      XMLText.__super__.constructor.call(this, parent);
	      if (text == null) {
	        throw new Error("Missing element text");
	      }
	      this.value = this.stringify.eleText(text);
	    }
	
	    XMLText.prototype.clone = function() {
	      return create(XMLText.prototype, this);
	    };
	
	    XMLText.prototype.toString = function(options, level) {
	      var indent, newline, offset, pretty, r, ref, ref1, ref2, space;
	      pretty = (options != null ? options.pretty : void 0) || false;
	      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
	      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
	      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
	      level || (level = 0);
	      space = new Array(level + offset + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      r += this.value;
	      if (pretty) {
	        r += newline;
	      }
	      return r;
	    };
	
	    return XMLText;
	
	  })(XMLNode);
	
	}).call(this);


/***/ },
/* 427 */
/***/ function(module, exports) {

	// Generated by CoffeeScript 1.10.0
	(function() {
	  "use strict";
	  exports.stripBOM = function(str) {
	    if (str[0] === '\uFEFF') {
	      return str.substring(1);
	    } else {
	      return str;
	    }
	  };
	
	}).call(this);


/***/ },
/* 428 */
/***/ function(module, exports) {

	// Generated by CoffeeScript 1.10.0
	(function() {
	  "use strict";
	  var prefixMatch;
	
	  prefixMatch = new RegExp(/(?!xmlns)^.*:/);
	
	  exports.normalize = function(str) {
	    return str.toLowerCase();
	  };
	
	  exports.firstCharLowerCase = function(str) {
	    return str.charAt(0).toLowerCase() + str.slice(1);
	  };
	
	  exports.stripPrefix = function(str) {
	    return str.replace(prefixMatch, '');
	  };
	
	  exports.parseNumbers = function(str) {
	    if (!isNaN(str)) {
	      str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
	    }
	    return str;
	  };
	
	  exports.parseBooleans = function(str) {
	    if (/^(?:true|false)$/i.test(str)) {
	      str = str.toLowerCase() === 'true';
	    }
	    return str;
	  };
	
	}).call(this);


/***/ },
/* 429 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'icons' ],
	  icons: [ 'type', __webpack_require__(430) ]
	};


/***/ },
/* 430 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	function Icons(){
	  return {
	    'default': __webpack_require__(431)
	  };
	}
	
	module.exports = Icons;

/***/ },
/* 431 */
/***/ function(module, exports) {

	module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#87868A\" d=\"M87.5,0h-75C5.597,0,0,5.597,0,12.5v68.75v3.125V87.5C0,94.403,5.597,100,12.5,100h75 c6.903,0,12.5-5.597,12.5-12.5v-3.05v-0.075V81.25V12.5C100,5.597,94.403,0,87.5,0z\"></path></svg>"

/***/ },
/* 432 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'axes' ],
	  axes: [ 'type', __webpack_require__(433) ]
	};

/***/ },
/* 433 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(313),
	  _merge = __webpack_require__(6).merge,
	  _svg = null,
	  _x = null,
	  _y = null,
	  _xAxis = null,
	  _yAxis = null,
	  _gX = null,
	  _gY = null
	  ;
	
	/**
	 * The axes drawing module.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Object} options
	 * @param {Canvas} Canvas
	 * @param {EventBus} EventBus
	 */
	function Axes(options, canvas, eventBus) {
	
	  this._options = _merge(
	    {
	      gridSize: 25,
	      gridLinesColor: '#ddd',
	      gridLinesWidth: 1,
	      showGridLines: true
	    },
	    options);
	
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	
	  this._init();
	}
	
	Axes.$inject = [ 'd3polytree.options', 'canvas', 'eventBus' ];
	
	module.exports = Axes;
	
	Axes.prototype._init = function() {
	  var that = this;
	
	  this._eventBus.on('canvas.resized', function(){
	    that._rescale();
	  });
	  this._eventBus.on('canvas.zoomed', function(){
	    that._rescale();
	  });
	
	  this._draw();
	};
	
	Axes.prototype._rescale = function(){
	  var canvasSize = this._canvas.getSize(),
	    currentTransform = this._canvas.getTransform(),
	    scaleX = currentTransform.a,
	    scaleY = currentTransform.d,
	    height = canvasSize.height / scaleY,
	    width = canvasSize.width / scaleX,
	    zoomTransform = d3.zoomIdentity
	      .translate(currentTransform.e, currentTransform.f)
	      .scale(currentTransform.a)
	    ;
	  _gX.call(
	    _xAxis
	      .scale(
	        zoomTransform.rescaleX(_x)
	      )
	      .ticks(width / this._options.gridSize)
	  );
	  _gY.call(
	    _yAxis
	      .scale(
	        zoomTransform.rescaleY(_y)
	      )
	      .ticks(height / this._options.gridSize)
	  );
	
	  _gX.selectAll('line, path')
	    .style('stroke', this._options.gridLinesColor);
	  _gY.selectAll('line, path')
	    .style('stroke', this._options.gridLinesColor);
	};
	
	Axes.prototype._draw = function() {
	  if (_svg){
	    _svg.remove();
	  }
	
	  _svg = this._canvas.getDrawingLayer()
	    .insert('g', ':first-child') // send to the background
	    .attr('class', 'axis')
	  ;
	
	  var canvasSize = this._canvas.getSize(),
	    svgTransform = this._canvas.getTransform(),
	    scaleX = svgTransform.a,
	    scaleY = svgTransform.d,
	    height = canvasSize.height / scaleY,
	    width = canvasSize.width / scaleX
	    ;
	
	  _x = d3.scaleLinear()
	    .domain([-1, width - 1])
	    .range([-1, width - 1])
	    ;
	  _y = d3.scaleLinear()
	    .domain([-1, height - 1])
	    .range([-1, height - 1])
	    ;
	
	  _xAxis = d3.axisBottom(_x)
	    .tickSize(height);
	  _yAxis = d3.axisRight(_y)
	    .tickSize(width);
	
	  _gX = _svg.append('g')
	    .attr('class', 'axis axis--x')
	    .call(_xAxis);
	  _gY = _svg.append('g')
	    .attr('class', 'axis axis--y')
	    .call(_yAxis);
	
	};


/***/ },
/* 434 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: [ 'force' ],
	  force: [ 'type', __webpack_require__(435) ],
	  __depends__: [
	    __webpack_require__(319)
	  ]
	};

/***/ },
/* 435 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(313);
	
	/**
	 * The D3 force handler.
	 *
	 * @class
	 * @constructor
	 *
	 * @param {Object} options
	 * @param {EventBus} eventBus
	 */
	function Force(canvas, eventBus, nodes) {
	
	  this._force = {};
	
	  this._canvas = canvas;
	  this._eventBus = eventBus;
	  this._nodes = nodes;
	
	  this._init();
	}
	
	Force.$inject = [ 'canvas', 'eventBus', 'nodes' ];
	
	module.exports = Force;
	
	Force.prototype._init = function() {
	
	  var that = this;
	
	  this._force = d3.forceSimulation(this._nodes._nodes);
	
	  this._links = d3.forceLink(this._nodes._links);
	
	  this._force.on('tick', function(){
	    that._eventBus.emit('force.tick');
	    //that._force.stop();
	  });
	
	  that._eventBus.emit('force.init');
	};

/***/ }
/******/ ]);
//# sourceMappingURL=D3P.Commons.js.map