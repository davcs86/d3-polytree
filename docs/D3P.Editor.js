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
return webpackJsonpD3P([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
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
	  __webpack_require__(848)
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

/***/ }
])
});
;
//# sourceMappingURL=D3P.Editor.js.map