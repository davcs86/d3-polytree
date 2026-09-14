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
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2980);


/***/ }),

/***/ 1731:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['zoomScroll'],
	  zoomScroll: ['type', __webpack_require__(1732)]
	};

/***/ }),

/***/ 1732:
/***/ (function(module, exports) {

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


/***/ }),

/***/ 1733:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['mouseEvents'],
	  mouseEvents: ['type', __webpack_require__(1734)],
	  __depends__: [
	    __webpack_require__(1581)
	  ]
	};


/***/ }),

/***/ 1734:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(644),
	  getLocalName = __webpack_require__(1650);
	
	/**
	 * MouseEvents description
	 *
	 * @class
	 * @constructor
	 *
	 * @param {EventEmitter} eventBus
	 * @param canvas
	 */
	
	function MouseEvents(eventBus, canvas) {
	  
	  this._eventBus = eventBus;
	  this._canvas = canvas;
	  this._init();
	}
	
	MouseEvents.$inject = [
	  'eventBus',
	  'canvas'
	];
	
	module.exports = MouseEvents;
	
	MouseEvents.prototype._addListeners = function (element, definition, className) {
	  var type = className ? className: getLocalName(definition),
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

/***/ }),

/***/ 1789:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['sideTabs', 'sideTabsProvider'],
	  sideTabs: ['type', __webpack_require__(1790)],
	  sideTabsProvider: ['type', __webpack_require__(2104)],
	  __depends__: [
	    //''
	  ]
	};


/***/ }),

/***/ 1790:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var forEach = __webpack_require__(1791).forEach,
	  isFunction = __webpack_require__(2004).isFunction,
	  isUndefined = __webpack_require__(2004).isUndefined,
	  toSafeInteger = __webpack_require__(2004).toSafeInteger,
	  domify = __webpack_require__(2086),
	  domQuery = __webpack_require__(2088),
	  domAttr = __webpack_require__(2090),
	  domClear = __webpack_require__(2091),
	  domClasses = __webpack_require__(2092),
	  domDelegate = __webpack_require__(2095)
	  ;
	
	__webpack_require__(2100);
	
	function SideTabs(canvas, sideTabsProvider, eventBus) {
	  this._canvas = canvas;
	  this._sideTabsProvider = sideTabsProvider;
	  this._eventBus = eventBus;
	  this._init();
	}
	
	SideTabs.$inject = [
	  'canvas',
	  'sideTabsProvider',
	  'eventBus'
	];
	
	
	SideTabs.prototype._init = function () {
	  var that = this;
	  this._drawContainer();
	  this._update();
	  this._eventBus.on('sidetab.registered', function () {
	    that._update();
	  });
	  this._createDelegates();
	};
	
	SideTabs.prototype._createDelegates = function () {
	  // create delegates
	  var that = this;
	
	  domDelegate.bind(this._sidetabsEntries, '.pfdjs-st-tab', 'click', function (event) {
	    that.trigger('click', event);
	    event.stopImmediatePropagation();
	  });
	
	  domDelegate.bind(this._sidetabsContents, '.icon-cancel', 'click', function (event) {
	    that.trigger('close', event);
	    event.stopImmediatePropagation();
	  });
	
	};
	
	SideTabs.prototype._readjustTabs = function(id) {
	  var that = this;
	  if (isUndefined(id)){
	    id = null;
	    domClasses(this._sidetabsContainer).remove('open');
	  } else {
	    id = toSafeInteger(id);
	    domClasses(this._sidetabsContainer).add('open');
	  }
	  forEach(this._actions, function (action, n) {
	    var tab = domQuery('[data-action="' + n + '"]', that._sidetabsEntries);
	    var content = domQuery('.pfdjs-st-content[data-action="' + n + '"]', that._sidetabsContents);
	    if (n === id) {
	      domClasses(tab).add('active');
	      domClasses(content).remove('hidden');
	    } else {
	      domClasses(tab).remove('active');
	      domClasses(content).add('hidden');
	    }
	  });
	};
	
	SideTabs.prototype.trigger = function (action, event, targetId) {
	  var entries = this._actions,
	    entry,
	    handler,
	    content,
	    button = event ? (event.delegateTarget || event.target) : false;
	
	  if (!button && action !== 'created') {
	    return event.preventDefault();
	  }
	
	  var id = button ? domAttr(button, 'data-action') : targetId;
	
	  entry = entries[id];
	
	  if (!entry) {
	    return;
	  }
	
	  if (action === 'click'){
	    this._readjustTabs(id);
	  } else if (action === 'close'){
	    this._readjustTabs();
	  }
	
	  handler = entry.action;
	
	  content = domQuery('.pfdjs-st-content[data-action="' + id + '"] > .content-body', this._sidetabsContents);
	
	  // simple action (via callback function)
	  if (isFunction(handler)) {
	    if (action === 'click') {
	      handler(content);
	    }
	  } else {
	    if (handler[action]) {
	      handler[action](content);
	    }
	  }
	
	};
	
	SideTabs.prototype._drawContainer = function () {
	  var container = this._canvas.getContainer();
	
	  this._sidetabsContainer = domify(SideTabs.HTML_MARKUP);
	
	  container.insertBefore(this._sidetabsContainer, container.childNodes[0]);
	
	  this._sidetabsEntries = domQuery('.pfdjs-st-tabs', this._sidetabsContainer);
	  this._sidetabsContents = domQuery('.pfdjs-st-contents', this._sidetabsContainer);
	};
	
	SideTabs.prototype._drawEntry = function (entry, id) {
	
	  // draw tab
	
	  var control = domify('<div class="pfdjs-st-tab"></div>');
	  this._sidetabsEntries.appendChild(control);
	
	  domAttr(control, 'data-action', id);
	
	  if (entry.title) {
	    domAttr(control, 'title', entry.title);
	  }
	
	  if (entry.iconClassName) {
	    control.appendChild(domify('<span class="' + entry.iconClassName + '"/>'));
	  }
	
	  // draw container
	  control = domify('<div class="pfdjs-st-content hidden">' +
	    '  <div class="content-title">' +
	    '    <span class="content-title-span">' + entry.title + '</span>' +
	    '    <span class="icon-cancel" title="Close"></span>' +
	    '    <span>&nbsp;</span>' +
	    '  </div>' +
	    '  <div class="content-body" ></div>' +
	    '</div>');
	  this._sidetabsContents.appendChild(control);
	
	  domAttr(control, 'data-action', id);
	
	  // close button
	  control = domQuery('.icon-cancel', control);
	  domAttr(control, 'data-action', id);
	
	  this.trigger('created', null, id);
	
	};
	
	SideTabs.prototype._drawEntries = function () {
	  var that = this,
	    actions = this._actions = this._sideTabsProvider.getSideTabsEntries();
	  forEach(actions, function (action, n) {
	    that._drawEntry.call(that, action, n);
	  });
	};
	
	SideTabs.prototype._update = function () {
	  if (this._sidetabsEntries) {
	    domClear(this._sidetabsEntries);
	    domClear(this._sidetabsContents);
	  }
	  this._drawEntries();
	};
	
	/* markup definition */
	
	SideTabs.HTML_MARKUP =
	  '<div class="pfdjs-st-container">' +
	  '  <div class="pfdjs-st-tabs">' +
	  '  </div>' +
	  '  <div class="pfdjs-st-contents">' +
	  '  </div>' +
	  '</div>';
	
	module.exports = SideTabs;

/***/ }),

/***/ 1791:
[3297, 1792, 1917, 1921, 1927, 1931, 1933, 1940, 1942, 1947, 1948, 1918, 1922, 1949, 1950, 1957, 1969, 1945, 1970, 1975, 1976, 1979, 1981, 1983, 1987, 1993, 1996, 2001, 2003],

/***/ 1792:
[3298, 1793, 1809],

/***/ 1793:
[2992, 1794],

/***/ 1794:
[2993, 1795],

/***/ 1795:
[2994, 1796, 1808],

/***/ 1796:
[2995, 1797, 1805, 1804, 1807],

/***/ 1797:
[2996, 1798, 1804],

/***/ 1798:
[2997, 1799, 1802, 1803],

/***/ 1799:
[2998, 1800],

/***/ 1800:
[2999, 1801],

/***/ 1801:
17,

/***/ 1802:
[3000, 1799],

/***/ 1803:
19,

/***/ 1804:
20,

/***/ 1805:
[3001, 1806],

/***/ 1806:
[3002, 1800],

/***/ 1807:
23,

/***/ 1808:
24,

/***/ 1809:
[3299, 1810, 1811, 1837, 1822],

/***/ 1810:
670,

/***/ 1811:
[3300, 1812],

/***/ 1812:
[3301, 1813, 1836],

/***/ 1813:
[3101, 1814, 1816],

/***/ 1814:
[3075, 1815],

/***/ 1815:
122,

/***/ 1816:
[3011, 1817, 1831, 1835],

/***/ 1817:
[3012, 1818, 1819, 1822, 1823, 1825, 1826],

/***/ 1818:
43,

/***/ 1819:
[3013, 1820, 1821],

/***/ 1820:
[3014, 1798, 1821],

/***/ 1821:
46,

/***/ 1822:
47,

/***/ 1823:
[3015, 1800, 1824],

/***/ 1824:
50,

/***/ 1825:
39,

/***/ 1826:
[3016, 1827, 1829, 1830],

/***/ 1827:
[3017, 1798, 1828, 1821],

/***/ 1828:
38,

/***/ 1829:
53,

/***/ 1830:
[3018, 1801],

/***/ 1831:
[3019, 1832, 1833],

/***/ 1832:
40,

/***/ 1833:
[3020, 1834],

/***/ 1834:
57,

/***/ 1835:
[3010, 1797, 1828],

/***/ 1836:
[3302, 1835],

/***/ 1837:
[3102, 1838, 1897, 1913, 1822, 1914],

/***/ 1838:
[3103, 1839, 1894, 1896],

/***/ 1839:
[3104, 1840, 1870],

/***/ 1840:
[3071, 1841, 1849, 1850, 1851, 1852, 1853],

/***/ 1841:
[3044, 1842, 1843, 1846, 1847, 1848],

/***/ 1842:
84,

/***/ 1843:
[3045, 1844],

/***/ 1844:
[3046, 1845],

/***/ 1845:
25,

/***/ 1846:
[3047, 1844],

/***/ 1847:
[3048, 1844],

/***/ 1848:
[3049, 1844],

/***/ 1849:
[3072, 1841],

/***/ 1850:
116,

/***/ 1851:
117,

/***/ 1852:
118,

/***/ 1853:
[3073, 1841, 1854, 1855],

/***/ 1854:
[3050, 1795, 1800],

/***/ 1855:
[3036, 1856, 1864, 1867, 1868, 1869],

/***/ 1856:
[3037, 1857, 1841, 1854],

/***/ 1857:
[3038, 1858, 1860, 1861, 1862, 1863],

/***/ 1858:
[3039, 1859],

/***/ 1859:
[3040, 1795],

/***/ 1860:
79,

/***/ 1861:
[3041, 1859],

/***/ 1862:
[3042, 1859],

/***/ 1863:
[3043, 1859],

/***/ 1864:
[3051, 1865],

/***/ 1865:
[3052, 1866],

/***/ 1866:
93,

/***/ 1867:
[3053, 1865],

/***/ 1868:
[3054, 1865],

/***/ 1869:
[3055, 1865],

/***/ 1870:
[3105, 1871, 1821],

/***/ 1871:
[3106, 1840, 1872, 1878, 1882, 1889, 1822, 1823, 1826],

/***/ 1872:
[3107, 1873, 1876, 1877],

/***/ 1873:
[3108, 1855, 1874, 1875],

/***/ 1874:
160,

/***/ 1875:
161,

/***/ 1876:
162,

/***/ 1877:
163,

/***/ 1878:
[3109, 1799, 1879, 1845, 1872, 1880, 1881],

/***/ 1879:
[3080, 1800],

/***/ 1880:
144,

/***/ 1881:
165,

/***/ 1882:
[3110, 1883],

/***/ 1883:
[3111, 1884, 1886, 1816],

/***/ 1884:
[3112, 1885, 1822],

/***/ 1885:
104,

/***/ 1886:
[3113, 1887, 1888],

/***/ 1887:
170,

/***/ 1888:
171,

/***/ 1889:
[3091, 1890, 1854, 1891, 1892, 1893, 1798, 1807],

/***/ 1890:
[3092, 1795, 1800],

/***/ 1891:
[3093, 1795, 1800],

/***/ 1892:
[3094, 1795, 1800],

/***/ 1893:
[3095, 1795, 1800],

/***/ 1894:
[3114, 1895, 1816],

/***/ 1895:
[3115, 1804],

/***/ 1896:
174,

/***/ 1897:
[3116, 1870, 1898, 1910, 1901, 1895, 1896, 1909],

/***/ 1898:
[3028, 1899],

/***/ 1899:
[3029, 1900, 1909],

/***/ 1900:
[3030, 1822, 1901, 1903, 1906],

/***/ 1901:
[3031, 1822, 1902],

/***/ 1902:
[3032, 1798, 1821],

/***/ 1903:
[3033, 1904],

/***/ 1904:
[3034, 1905],

/***/ 1905:
[3035, 1855],

/***/ 1906:
[3056, 1907],

/***/ 1907:
[3057, 1799, 1908, 1822, 1902],

/***/ 1908:
99,

/***/ 1909:
[3058, 1902],

/***/ 1910:
[3117, 1911, 1912],

/***/ 1911:
177,

/***/ 1912:
[3118, 1900, 1819, 1822, 1825, 1828, 1909],

/***/ 1913:
29,

/***/ 1914:
[3119, 1915, 1916, 1901, 1909],

/***/ 1915:
180,

/***/ 1916:
[3120, 1899],

/***/ 1917:
[3303, 1918],

/***/ 1918:
[3304, 1919, 1812, 1920, 1822],

/***/ 1919:
209,

/***/ 1920:
[3125, 1913],

/***/ 1921:
[3305, 1922],

/***/ 1922:
[3306, 1923, 1924, 1920, 1822],

/***/ 1923:
783,

/***/ 1924:
[3307, 1925, 1836],

/***/ 1925:
[3122, 1926, 1816],

/***/ 1926:
[3123, 1815],

/***/ 1927:
[3308, 1928, 1929, 1837, 1822, 1930],

/***/ 1928:
788,

/***/ 1929:
[3309, 1812],

/***/ 1930:
[3009, 1845, 1835, 1825, 1804],

/***/ 1931:
[3310, 1887, 1932, 1837, 1822],

/***/ 1932:
[3311, 1812],

/***/ 1933:
[3312, 1934, 1935],

/***/ 1934:
[3313, 1837, 1835, 1816],

/***/ 1935:
[3237, 1936, 1837, 1937],

/***/ 1936:
563,

/***/ 1937:
[3197, 1938],

/***/ 1938:
[3198, 1939],

/***/ 1939:
[3183, 1804, 1902],

/***/ 1940:
[3314, 1934, 1941],

/***/ 1941:
[3238, 1936, 1837, 1937],

/***/ 1942:
[3315, 1943, 1945],

/***/ 1943:
[3061, 1885, 1944],

/***/ 1944:
[3062, 1799, 1819, 1822],

/***/ 1945:
[3316, 1908, 1837, 1946, 1822],

/***/ 1946:
[3317, 1812, 1835],

/***/ 1947:
[3318, 1943, 1945],

/***/ 1948:
[3319, 1943, 1945, 1937],

/***/ 1949:
[3320, 1793, 1809],

/***/ 1950:
[3321, 1951, 1835, 1954, 1937, 1955],

/***/ 1951:
[3227, 1936, 1952, 1953],

/***/ 1952:
564,

/***/ 1953:
565,

/***/ 1954:
[3212, 1798, 1822, 1821],

/***/ 1955:
[3171, 1956, 1816],

/***/ 1956:
[3172, 1908],

/***/ 1957:
[3322, 1958, 1812, 1959, 1963, 1835],

/***/ 1958:
31,

/***/ 1959:
[3138, 1958, 1900, 1960, 1961, 1909],

/***/ 1960:
201,

/***/ 1961:
[3139, 1899, 1962],

/***/ 1962:
203,

/***/ 1963:
[3005, 1913, 1964, 1965],

/***/ 1964:
[3006, 1958],

/***/ 1965:
[3007, 1966, 1968],

/***/ 1966:
[3008, 1967, 1794, 1913],

/***/ 1967:
34,

/***/ 1968:
35,

/***/ 1969:
[3323, 1793, 1809],

/***/ 1970:
[3324, 1971, 1822],

/***/ 1971:
[3325, 1908, 1837, 1946, 1972, 1829, 1973, 1913],

/***/ 1972:
832,

/***/ 1973:
[3326, 1974],

/***/ 1974:
[3259, 1902],

/***/ 1975:
[3327, 1809],

/***/ 1976:
[3328, 1977, 1812, 1837, 1978, 1822],

/***/ 1977:
220,

/***/ 1978:
838,

/***/ 1979:
[3329, 1980, 1924, 1837, 1978, 1822],

/***/ 1980:
840,

/***/ 1981:
[3330, 1887, 1932, 1837, 1822, 1982],

/***/ 1982:
228,

/***/ 1983:
[3331, 1984, 1986, 1822],

/***/ 1984:
[3332, 1985],

/***/ 1985:
845,

/***/ 1986:
[3333, 1984, 1955],

/***/ 1987:
[3334, 1988, 1992, 1822, 1930, 1937],

/***/ 1988:
[3335, 1989, 1990, 1991],

/***/ 1989:
443,

/***/ 1990:
128,

/***/ 1991:
[3336, 1985],

/***/ 1992:
[3337, 1989, 1991, 1955],

/***/ 1993:
[3338, 1994, 1995, 1822],

/***/ 1994:
[3339, 1990, 1991],

/***/ 1995:
[3340, 1991, 1955],

/***/ 1996:
[3341, 1831, 1889, 1835, 1954, 1997],

/***/ 1997:
[3342, 1998, 1999, 2000],

/***/ 1998:
[3343, 1915],

/***/ 1999:
437,

/***/ 2000:
860,

/***/ 2001:
[3344, 1876, 1837, 2002, 1822, 1930],

/***/ 2002:
[3345, 1812],

/***/ 2003:
[3346, 1943, 1971, 1963, 1930],

/***/ 2004:
[3174, 2005, 2006, 2034, 2035, 2036, 2037, 1845, 2039, 2042, 1819, 1822, 2043, 1835, 2045, 2046, 1823, 2047, 2049, 2051, 2052, 2053, 2054, 2055, 1797, 2056, 1828, 2057, 2059, 2060, 2061, 2063, 2065, 2066, 2062, 1804, 1821, 2050, 2067, 2069, 2070, 1954, 1902, 1826, 2072, 2073, 2074, 2075, 2077, 2078, 1938, 1937, 2083, 1939, 2084, 2085, 1906],

/***/ 2005:
[3175, 1822],

/***/ 2006:
[3176, 2007],

/***/ 2007:
[3144, 1840, 1919, 2008, 2009, 2011, 2015, 1990, 2016, 2017, 1883, 2020, 1889, 2021, 2022, 2032, 1822, 1823, 1804, 1816],

/***/ 2008:
[2991, 1793, 1845],

/***/ 2009:
[3064, 2010, 1816],

/***/ 2010:
[3003, 2008, 1793],

/***/ 2011:
[3145, 2010, 2012],

/***/ 2012:
[3022, 1817, 2013, 1835],

/***/ 2013:
[3023, 1804, 1832, 2014],

/***/ 2014:
61,

/***/ 2015:
[3077, 1800],

/***/ 2016:
[3146, 2010, 1886],

/***/ 2017:
[3147, 2010, 2018],

/***/ 2018:
[3148, 1885, 2019, 1886, 1888],

/***/ 2019:
[3082, 1834],

/***/ 2020:
[3149, 1884, 2018, 2012],

/***/ 2021:
215,

/***/ 2022:
[3150, 2023, 2024, 2025, 2027, 2028, 2030, 2031],

/***/ 2023:
[3079, 1879],

/***/ 2024:
[3151, 2023],

/***/ 2025:
[3152, 2026, 1977, 1880],

/***/ 2026:
219,

/***/ 2027:
221,

/***/ 2028:
[3153, 2029, 1977, 1881],

/***/ 2029:
223,

/***/ 2030:
[3154, 1799],

/***/ 2031:
[3078, 2023],

/***/ 2032:
[3081, 2033, 2019, 1832],

/***/ 2033:
[3065, 1804],

/***/ 2034:
[3177, 2007],

/***/ 2035:
[3178, 2007],

/***/ 2036:
[3179, 2007],

/***/ 2037:
[3180, 2038, 1816],

/***/ 2038:
375,

/***/ 2039:
[3181, 2040, 2041],

/***/ 2040:
377,

/***/ 2041:
[3182, 1939],

/***/ 2042:
[3184, 2041],

/***/ 2043:
[3185, 2044, 1829, 1830],

/***/ 2044:
[3186, 1798, 1821],

/***/ 2045:
[3083, 1835, 1821],

/***/ 2046:
[3187, 1798, 1821],

/***/ 2047:
[3188, 2048, 1829, 1830],

/***/ 2048:
[3189, 1798, 1821],

/***/ 2049:
[3190, 1821, 2050],

/***/ 2050:
[3084, 1798, 2019, 1821],

/***/ 2051:
[3191, 1831, 1889, 1819, 1822, 1835, 1823, 1832, 1826],

/***/ 2052:
[3192, 1870],

/***/ 2053:
[3193, 1870],

/***/ 2054:
[3194, 1798, 1821, 2050],

/***/ 2055:
[3195, 1800],

/***/ 2056:
[3196, 1937],

/***/ 2057:
[3199, 2058, 1829, 1830],

/***/ 2058:
[3200, 1889, 1821],

/***/ 2059:
[3201, 1839, 1894],

/***/ 2060:
[3202, 1839, 1894],

/***/ 2061:
[3203, 2062],

/***/ 2062:
[3204, 1798, 1821],

/***/ 2063:
[3205, 1796, 2064],

/***/ 2064:
[3206, 1806, 1797, 1824],

/***/ 2065:
419,

/***/ 2066:
420,

/***/ 2067:
[3207, 2068, 1829, 1830],

/***/ 2068:
[3208, 1798, 1821],

/***/ 2069:
[3209, 2056],

/***/ 2070:
[3210, 2071, 1829, 1830],

/***/ 2071:
[3211, 1889, 1821],

/***/ 2072:
427,

/***/ 2073:
[3213, 1889, 1821],

/***/ 2074:
[3214, 1798, 1821],

/***/ 2075:
[3215, 2076, 2041],

/***/ 2076:
431,

/***/ 2077:
[3216, 2041],

/***/ 2078:
[3217, 1799, 1990, 1889, 1835, 1954, 2079, 1880, 1881, 2080, 1955],

/***/ 2079:
434,

/***/ 2080:
[3218, 2081, 1999, 2082],

/***/ 2081:
436,

/***/ 2082:
438,

/***/ 2083:
[3219, 1989, 1937],

/***/ 2084:
[3085, 2010, 2012],

/***/ 2085:
[3220, 1989, 1937],

/***/ 2086:
[3400, 2087],

/***/ 2087:
1726,

/***/ 2088:
[2988, 2089],

/***/ 2089:
5,

/***/ 2090:
1715,

/***/ 2091:
1719,

/***/ 2092:
[3394, 2093],

/***/ 2093:
[3395, 2094, 2094],

/***/ 2094:
1718,

/***/ 2095:
[3398, 2096],

/***/ 2096:
[3399, 2097, 2097, 2099, 2099],

/***/ 2097:
[3396, 2098],

/***/ 2098:
[3397, 2089, 2089],

/***/ 2099:
1093,

/***/ 2100:
[2987, 2101, 2103],

/***/ 2101:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(2102)();
	// imports
	
	
	// module
	exports.push([module.id, ".pfdjs-container .pfdjs-palette {\n  margin: 6px 64px 6px 6px; }\n\n.pfdjs-container .pfdjs-st-container {\n  width: 0;\n  z-index: 2;\n  position: absolute;\n  right: -3px;\n  top: 0;\n  bottom: 0;\n  background: #fafafa;\n  border: solid 1px #cccccc;\n  border-left: solid 2px #cccccc; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs {\n    position: absolute;\n    width: 36px;\n    top: 6px;\n    bottom: 6px;\n    left: -37px; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab {\n      overflow: hidden;\n      height: 40px;\n      margin-bottom: 5px;\n      background: #fafafa;\n      border: solid 1px #cccccc;\n      border-radius: 3px;\n      border-bottom-right-radius: 0;\n      border-top-right-radius: 0;\n      box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.3); }\n      .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab span {\n        font-size: 26px;\n        top: 4.25px;\n        position: relative;\n        cursor: pointer; }\n      .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab.active span {\n        color: #ff4800; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content.hidden {\n    display: none !important; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-body {\n    position: absolute;\n    left: 0;\n    top: 20px;\n    right: 0;\n    bottom: 0;\n    overflow-y: auto; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title {\n    background-color: #5990bd;\n    color: white;\n    font-size: 12px;\n    line-height: 18px;\n    border: solid 1px #ccc;\n    position: absolute;\n    left: 0;\n    right: 0; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title .content-title-span {\n      vertical-align: top;\n      float: left;\n      margin-left: 6px; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title .icon-cancel {\n      font-size: 18px;\n      cursor: pointer;\n      float: right; }\n  .pfdjs-container .pfdjs-st-container.open {\n    right: 0; }\n    .pfdjs-container .pfdjs-st-container.open .pfdjs-st-tabs .pfdjs-st-tab.active {\n      left: 1px;\n      position: relative;\n      box-shadow: none;\n      border-width: 2px;\n      border-right: 0; }\n    @media (max-width: 800px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 400px;\n        width: 50%; } }\n    @media (max-width: 400px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 100%;\n        width: 100%; } }\n    @media (min-width: 801px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 400px;\n        width: 35%; } }\n", ""]);
	
	// exports


/***/ }),

/***/ 2102:
1574,

/***/ 2103:
1575,

/***/ 2104:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var isUndefined = __webpack_require__(2004).isUndefined;
	
	function SideTabsProvider(eventBus){
	  this._registeredSideTabs = [];
	  this._eventBus = eventBus;
	  this._init();
	}
	
	SideTabsProvider.$inject = [
	  'eventBus'
	];
	
	SideTabsProvider.prototype._init = function(){
	  this._setDefaultTabs();
	};
	
	SideTabsProvider.prototype._setDefaultTabs = function(){
	  this._registeredSideTabs = [];
	};
	
	SideTabsProvider.prototype.registerSideTab = function(sideTab, index){
	  if (isUndefined(index)){
	    this._registeredSideTabs.push(sideTab);
	  } else {
	    this._registeredSideTabs.splice(index, 0, sideTab);
	  }
	  this._eventBus.emit('sidetab.registered', sideTab);
	};
	
	SideTabsProvider.prototype.getSideTabsEntries = function(){
	  return this._registeredSideTabs;
	};
	
	module.exports = SideTabsProvider;

/***/ }),

/***/ 2105:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['searchPanel'],
	  searchPanel: ['type', __webpack_require__(2106)],
	  __depends__: [
	  ]
	};


/***/ }),

/***/ 2106:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var domClear = __webpack_require__(2107),
	  domify = __webpack_require__(2108),
	  domDelegate = __webpack_require__(2110),
	  domAttr = __webpack_require__(2116),
	  List = __webpack_require__(2117)
	  ;
	
	__webpack_require__(2137);
	
	function SearchPanel(sideTabsProvider, eventBus){
	  this._sideTabsProvider = sideTabsProvider;
	  this._eventBus = eventBus;
	  //this._elementsList = [];
	  this._form = null;
	  this._list = null;
	  this._init();
	}
	
	SearchPanel.$inject = [
	  'sideTabsProvider',
	  'eventBus'
	];
	
	SearchPanel.prototype.addOrUpdateItem = function(values){
	  if (this._list) {
	    if (values && values.name !== '') {
	      var item = this._list.get('id', values.id)[0];
	      if (item) {
	        // update
	        item.values(values);
	      } else {
	        // add
	        this._list.add(values);
	      }
	
	    }
	  }
	};
	
	SearchPanel.prototype._init = function(){
	  var that = this;
	  this._registerSideTab();
	  this._eventBus.on('node.created', function(element, definition){
	    that.addOrUpdateItem({
	      'id': definition.id,
	      'name': definition.label ? definition.label.text: '',
	      'elementType': 'Node',
	      'elementSubType': definition.type,
	      '__element': element,
	      '__definition': definition
	    });
	  });
	  this._eventBus.on('link.created', function(element, definition){
	    that.addOrUpdateItem({
	      'id': definition.id,
	      'name': definition.label ? definition.label.text: '',
	      'elementType': 'Connection',
	      'elementSubType': '',
	      '__element': element,
	      '__definition': definition
	    });
	  });
	  this._eventBus.on('node.deleted', function(element, definition){
	    if (that._list) {
	      that._list.remove('id', definition.id);
	    }
	  });
	  this._eventBus.on('link.deleted', function(element, definition){
	    if (that._list) {
	      that._list.remove('id', definition.id);
	    }
	  });
	};
	
	SearchPanel.prototype._drawForm = function(content){
	  var that = this;
	  domClear(content);
	  this._form = domify(SearchPanel.HTML_MARKUP);
	  content.appendChild(this._form);
	  var options = {
	    indexAsync: true,
	    valueNames: [
	      'name',
	      'elementType',
	      'elementSubType',
	      '__element',
	      '__definition',
	      { data: ['id'] },
	    ],
	    item: '<li data-id="true">' +
	      '<h3 class="name"></h3>' +
	      '<p><span class="elementType"></span>' +
	      '&nbsp;&nbsp;<span class="elementSubType"></span></p>' +
	      '</li>'
	  };
	  this._list = new List(this._form, options);
	  this._list.alphabet = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvXxYyZz0123456789';
	  domDelegate.bind(this._form, 'li', 'click', function (event) {
	    var itemId = domAttr(event.delegateTarget, 'data-id');
	    var item = that._list.get('id', itemId)[0];
	    if (item) {
	      var itemValues = item.values();
	      that._eventBus.emit('zoom.to.element', itemValues.__element, itemValues.__definition);
	      var clickEventName = itemValues.__definition.$descriptor.ns.localName.toLowerCase()+'.mousedown';
	      that._eventBus.emit(clickEventName, itemValues.__element, itemValues.__definition, null);
	    }
	    event.stopImmediatePropagation();
	  });
	};
	
	SearchPanel.prototype._registerSideTab = function(){
	  var that = this;
	  this._sideTabsProvider.
	    registerSideTab({
	      title: 'Search element',
	      iconClassName: 'icon-glass',
	      action: {
	        created: function (content) {
	          that._drawForm(content);
	        },
	        click: function () {
	          if (that._list) {
	            that._list.sort('name', {order: 'asc'});
	          }
	        },
	        // close: function () {
	        //   console.log('search panel close');
	        // }
	      },
	    }, 0);
	};
	
	/* markup definition */
	
	SearchPanel.HTML_MARKUP =
	  '<div id="pfdjs-searchpanel">' +
	  '  <input class="search" placeholder="Search" />' +
	  '  <ul class="list"></ul>' +
	  '</div>';
	
	module.exports = SearchPanel;

/***/ }),

/***/ 2107:
1719,

/***/ 2108:
[3400, 2109],

/***/ 2109:
1726,

/***/ 2110:
[3398, 2111],

/***/ 2111:
[3399, 2112, 2112, 2115, 2115],

/***/ 2112:
[3396, 2113],

/***/ 2113:
[3397, 2114, 2114],

/***/ 2114:
5,

/***/ 2115:
1093,

/***/ 2116:
1715,

/***/ 2117:
/***/ (function(module, exports, __webpack_require__) {

	var naturalSort = __webpack_require__(2118),
	  getByClass = __webpack_require__(2119),
	  extend = __webpack_require__(2120),
	  indexOf = __webpack_require__(2121),
	  events = __webpack_require__(2122),
	  toString = __webpack_require__(2124),
	  classes = __webpack_require__(2125),
	  getAttribute = __webpack_require__(2126),
	  toArray = __webpack_require__(2123);
	
	module.exports = function(id, options, values) {
	
	  var self = this,
	    init,
	    Item = __webpack_require__(2127)(self),
	    addAsync = __webpack_require__(2128)(self),
	    initPagination = __webpack_require__(2129)(self);
	
	  init = {
	    start: function() {
	      self.listClass      = "list";
	      self.searchClass    = "search";
	      self.sortClass      = "sort";
	      self.page           = 10000;
	      self.i              = 1;
	      self.items          = [];
	      self.visibleItems   = [];
	      self.matchingItems  = [];
	      self.searched       = false;
	      self.filtered       = false;
	      self.searchColumns  = undefined;
	      self.handlers       = { 'updated': [] };
	      self.valueNames     = [];
	      self.utils          = {
	        getByClass: getByClass,
	        extend: extend,
	        indexOf: indexOf,
	        events: events,
	        toString: toString,
	        naturalSort: naturalSort,
	        classes: classes,
	        getAttribute: getAttribute,
	        toArray: toArray
	      };
	
	      self.utils.extend(self, options);
	
	      self.listContainer = (typeof(id) === 'string') ? document.getElementById(id) : id;
	      if (!self.listContainer) { return; }
	      self.list       = getByClass(self.listContainer, self.listClass, true);
	
	      self.parse        = __webpack_require__(2130)(self);
	      self.templater    = __webpack_require__(2131)(self);
	      self.search       = __webpack_require__(2132)(self);
	      self.filter       = __webpack_require__(2133)(self);
	      self.sort         = __webpack_require__(2134)(self);
	      self.fuzzySearch  = __webpack_require__(2135)(self, options.fuzzySearch);
	
	      this.handlers();
	      this.items();
	      this.pagination();
	
	      self.update();
	    },
	    handlers: function() {
	      for (var handler in self.handlers) {
	        if (self[handler]) {
	          self.on(handler, self[handler]);
	        }
	      }
	    },
	    items: function() {
	      self.parse(self.list);
	      if (values !== undefined) {
	        self.add(values);
	      }
	    },
	    pagination: function() {
	      if (options.pagination !== undefined) {
	        if (options.pagination === true) {
	          options.pagination = [{}];
	        }
	        if (options.pagination[0] === undefined){
	          options.pagination = [options.pagination];
	        }
	        for (var i = 0, il = options.pagination.length; i < il; i++) {
	          initPagination(options.pagination[i]);
	        }
	      }
	    }
	  };
	
	  /*
	  * Re-parse the List, use if html have changed
	  */
	  this.reIndex = function() {
	    self.items          = [];
	    self.visibleItems   = [];
	    self.matchingItems  = [];
	    self.searched       = false;
	    self.filtered       = false;
	    self.parse(self.list);
	  };
	
	  this.toJSON = function() {
	    var json = [];
	    for (var i = 0, il = self.items.length; i < il; i++) {
	      json.push(self.items[i].values());
	    }
	    return json;
	  };
	
	
	  /*
	  * Add object to list
	  */
	  this.add = function(values, callback) {
	    if (values.length === 0) {
	      return;
	    }
	    if (callback) {
	      addAsync(values, callback);
	      return;
	    }
	    var added = [],
	      notCreate = false;
	    if (values[0] === undefined){
	      values = [values];
	    }
	    for (var i = 0, il = values.length; i < il; i++) {
	      var item = null;
	      notCreate = (self.items.length > self.page) ? true : false;
	      item = new Item(values[i], undefined, notCreate);
	      self.items.push(item);
	      added.push(item);
	    }
	    self.update();
	    return added;
	  };
	
		this.show = function(i, page) {
			this.i = i;
			this.page = page;
			self.update();
	    return self;
		};
	
	  /* Removes object from list.
	  * Loops through the list and removes objects where
	  * property "valuename" === value
	  */
	  this.remove = function(valueName, value, options) {
	    var found = 0;
	    for (var i = 0, il = self.items.length; i < il; i++) {
	      if (self.items[i].values()[valueName] == value) {
	        self.templater.remove(self.items[i], options);
	        self.items.splice(i,1);
	        il--;
	        i--;
	        found++;
	      }
	    }
	    self.update();
	    return found;
	  };
	
	  /* Gets the objects in the list which
	  * property "valueName" === value
	  */
	  this.get = function(valueName, value) {
	    var matchedItems = [];
	    for (var i = 0, il = self.items.length; i < il; i++) {
	      var item = self.items[i];
	      if (item.values()[valueName] == value) {
	        matchedItems.push(item);
	      }
	    }
	    return matchedItems;
	  };
	
	  /*
	  * Get size of the list
	  */
	  this.size = function() {
	    return self.items.length;
	  };
	
	  /*
	  * Removes all items from the list
	  */
	  this.clear = function() {
	    self.templater.clear();
	    self.items = [];
	    return self;
	  };
	
	  this.on = function(event, callback) {
	    self.handlers[event].push(callback);
	    return self;
	  };
	
	  this.off = function(event, callback) {
	    var e = self.handlers[event];
	    var index = indexOf(e, callback);
	    if (index > -1) {
	      e.splice(index, 1);
	    }
	    return self;
	  };
	
	  this.trigger = function(event) {
	    var i = self.handlers[event].length;
	    while(i--) {
	      self.handlers[event][i](self);
	    }
	    return self;
	  };
	
	  this.reset = {
	    filter: function() {
	      var is = self.items,
	        il = is.length;
	      while (il--) {
	        is[il].filtered = false;
	      }
	      return self;
	    },
	    search: function() {
	      var is = self.items,
	        il = is.length;
	      while (il--) {
	        is[il].found = false;
	      }
	      return self;
	    }
	  };
	
	  this.update = function() {
	    var is = self.items,
				il = is.length;
	
	    self.visibleItems = [];
	    self.matchingItems = [];
	    self.templater.clear();
	    for (var i = 0; i < il; i++) {
	      if (is[i].matching() && ((self.matchingItems.length+1) >= self.i && self.visibleItems.length < self.page)) {
	        is[i].show();
	        self.visibleItems.push(is[i]);
	        self.matchingItems.push(is[i]);
	      } else if (is[i].matching()) {
	        self.matchingItems.push(is[i]);
	        is[i].hide();
	      } else {
	        is[i].hide();
	      }
	    }
	    self.trigger('updated');
	    return self;
	  };
	
	  init.start();
	};


/***/ }),

/***/ 2118:
/***/ (function(module, exports) {

	'use strict';
	
	var alphabet;
	var alphabetIndexMap;
	var alphabetIndexMapLength = 0;
	
	function isNumberCode(code) {
	  return code >= 48 && code <= 57;
	}
	
	function naturalCompare(a, b) {
	  var lengthA = (a += '').length;
	  var lengthB = (b += '').length;
	  var aIndex = 0;
	  var bIndex = 0;
	
	  while (aIndex < lengthA && bIndex < lengthB) {
	    var charCodeA = a.charCodeAt(aIndex);
	    var charCodeB = b.charCodeAt(bIndex);
	
	    if (isNumberCode(charCodeA)) {
	      if (!isNumberCode(charCodeB)) {
	        return charCodeA - charCodeB;
	      }
	
	      var numStartA = aIndex;
	      var numStartB = bIndex;
	
	      while (charCodeA === 48 && ++numStartA < lengthA) {
	        charCodeA = a.charCodeAt(numStartA);
	      }
	      while (charCodeB === 48 && ++numStartB < lengthB) {
	        charCodeB = b.charCodeAt(numStartB);
	      }
	
	      var numEndA = numStartA;
	      var numEndB = numStartB;
	
	      while (numEndA < lengthA && isNumberCode(a.charCodeAt(numEndA))) {
	        ++numEndA;
	      }
	      while (numEndB < lengthB && isNumberCode(b.charCodeAt(numEndB))) {
	        ++numEndB;
	      }
	
	      var difference = numEndA - numStartA - numEndB + numStartB; // numA length - numB length
	      if (difference) {
	        return difference;
	      }
	
	      while (numStartA < numEndA) {
	        difference = a.charCodeAt(numStartA++) - b.charCodeAt(numStartB++);
	        if (difference) {
	          return difference;
	        }
	      }
	
	      aIndex = numEndA;
	      bIndex = numEndB;
	      continue;
	    }
	
	    if (charCodeA !== charCodeB) {
	      if (
	        charCodeA < alphabetIndexMapLength &&
	        charCodeB < alphabetIndexMapLength &&
	        alphabetIndexMap[charCodeA] !== -1 &&
	        alphabetIndexMap[charCodeB] !== -1
	      ) {
	        return alphabetIndexMap[charCodeA] - alphabetIndexMap[charCodeB];
	      }
	
	      return charCodeA - charCodeB;
	    }
	
	    ++aIndex;
	    ++bIndex;
	  }
	
	  return lengthA - lengthB;
	}
	
	naturalCompare.caseInsensitive = naturalCompare.i = function(a, b) {
	  return naturalCompare(('' + a).toLowerCase(), ('' + b).toLowerCase());
	};
	
	Object.defineProperties(naturalCompare, {
	  alphabet: {
	    get: function() {
	      return alphabet;
	    },
	    set: function(value) {
	      alphabet = value;
	      alphabetIndexMap = [];
	      var i = 0;
	      if (alphabet) {
	        for (; i < alphabet.length; i++) {
	          alphabetIndexMap[alphabet.charCodeAt(i)] = i;
	        }
	      }
	      alphabetIndexMapLength = alphabetIndexMap.length;
	      for (i = 0; i < alphabetIndexMapLength; i++) {
	        if (alphabetIndexMap[i] === undefined) {
	          alphabetIndexMap[i] = -1;
	        }
	      }
	    },
	  },
	});
	
	module.exports = naturalCompare;


/***/ }),

/***/ 2119:
/***/ (function(module, exports) {

	/**
	 * A cross-browser implementation of getElementsByClass.
	 * Heavily based on Dustin Diaz's function: http://dustindiaz.com/getelementsbyclass.
	 *
	 * Find all elements with class `className` inside `container`.
	 * Use `single = true` to increase performance in older browsers
	 * when only one element is needed.
	 *
	 * @param {String} className
	 * @param {Element} container
	 * @param {Boolean} single
	 * @api public
	 */
	
	var getElementsByClassName = function(container, className, single) {
	  if (single) {
	    return container.getElementsByClassName(className)[0];
	  } else {
	    return container.getElementsByClassName(className);
	  }
	};
	
	var querySelector = function(container, className, single) {
	  className = '.' + className;
	  if (single) {
	    return container.querySelector(className);
	  } else {
	    return container.querySelectorAll(className);
	  }
	};
	
	var polyfill = function(container, className, single) {
	  var classElements = [],
	    tag = '*';
	
	  var els = container.getElementsByTagName(tag);
	  var elsLen = els.length;
	  var pattern = new RegExp("(^|\\s)"+className+"(\\s|$)");
	  for (var i = 0, j = 0; i < elsLen; i++) {
	    if ( pattern.test(els[i].className) ) {
	      if (single) {
	        return els[i];
	      } else {
	        classElements[j] = els[i];
	        j++;
	      }
	    }
	  }
	  return classElements;
	};
	
	module.exports = (function() {
	  return function(container, className, single, options) {
	    options = options || {};
	    if ((options.test && options.getElementsByClassName) || (!options.test && document.getElementsByClassName)) {
	      return getElementsByClassName(container, className, single);
	    } else if ((options.test && options.querySelector) || (!options.test && document.querySelector)) {
	      return querySelector(container, className, single);
	    } else {
	      return polyfill(container, className, single);
	    }
	  };
	})();


/***/ }),

/***/ 2120:
/***/ (function(module, exports) {

	/*
	 * Source: https://github.com/segmentio/extend
	 */
	
	module.exports = function extend (object) {
	    // Takes an unlimited number of extenders.
	    var args = Array.prototype.slice.call(arguments, 1);
	
	    // For each extender, copy their properties on our object.
	    for (var i = 0, source; source = args[i]; i++) {
	        if (!source) continue;
	        for (var property in source) {
	            object[property] = source[property];
	        }
	    }
	
	    return object;
	};


/***/ }),

/***/ 2121:
/***/ (function(module, exports) {

	var indexOf = [].indexOf;
	
	module.exports = function(arr, obj){
	  if (indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};


/***/ }),

/***/ 2122:
/***/ (function(module, exports, __webpack_require__) {

	var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
	    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
	    prefix = bind !== 'addEventListener' ? 'on' : '',
	    toArray = __webpack_require__(2123);
	
	/**
	 * Bind `el` event `type` to `fn`.
	 *
	 * @param {Element} el, NodeList, HTMLCollection or Array
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @api public
	 */
	
	exports.bind = function(el, type, fn, capture){
	  el = toArray(el);
	  for ( var i = 0; i < el.length; i++ ) {
	    el[i][bind](prefix + type, fn, capture || false);
	  }
	};
	
	/**
	 * Unbind `el` event `type`'s callback `fn`.
	 *
	 * @param {Element} el, NodeList, HTMLCollection or Array
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @api public
	 */
	
	exports.unbind = function(el, type, fn, capture){
	  el = toArray(el);
	  for ( var i = 0; i < el.length; i++ ) {
	    el[i][unbind](prefix + type, fn, capture || false);
	  }
	};


/***/ }),

/***/ 2123:
/***/ (function(module, exports) {

	/**
	 * Source: https://github.com/timoxley/to-array
	 *
	 * Convert an array-like object into an `Array`.
	 * If `collection` is already an `Array`, then will return a clone of `collection`.
	 *
	 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`
	 * @return {Array} Naive conversion of `collection` to a new `Array`.
	 * @api public
	 */
	
	module.exports = function toArray(collection) {
	  if (typeof collection === 'undefined') return [];
	  if (collection === null) return [null];
	  if (collection === window) return [window];
	  if (typeof collection === 'string') return [collection];
	  if (isArray(collection)) return collection;
	  if (typeof collection.length != 'number') return [collection];
	  if (typeof collection === 'function' && collection instanceof Function) return [collection];
	
	  var arr = [];
	  for (var i = 0; i < collection.length; i++) {
	    if (Object.prototype.hasOwnProperty.call(collection, i) || i in collection) {
	      arr.push(collection[i]);
	    }
	  }
	  if (!arr.length) return [];
	  return arr;
	};
	
	function isArray(arr) {
	  return Object.prototype.toString.call(arr) === "[object Array]";
	}


/***/ }),

/***/ 2124:
/***/ (function(module, exports) {

	module.exports = function(s) {
	  s = (s === undefined) ? "" : s;
	  s = (s === null) ? "" : s;
	  s = s.toString();
	  return s;
	};


/***/ }),

/***/ 2125:
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var index = __webpack_require__(2121);
	
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
	  return this.list ? this.list.contains(name) : !! ~index(this.array(), name);
	};


/***/ }),

/***/ 2126:
/***/ (function(module, exports) {

	/**
	 * A cross-browser implementation of getAttribute.
	 * Source found here: http://stackoverflow.com/a/3755343/361337 written by Vivin Paliath
	 *
	 * Return the value for `attr` at `element`.
	 *
	 * @param {Element} el
	 * @param {String} attr
	 * @api public
	 */
	
	module.exports = function(el, attr) {
	  var result = (el.getAttribute && el.getAttribute(attr)) || null;
	  if( !result ) {
	    var attrs = el.attributes;
	    var length = attrs.length;
	    for(var i = 0; i < length; i++) {
	      if (attr[i] !== undefined) {
	        if(attr[i].nodeName === attr) {
	          result = attr[i].nodeValue;
	        }
	      }
	    }
	  }
	  return result;
	};


/***/ }),

/***/ 2127:
/***/ (function(module, exports) {

	module.exports = function(list) {
	  return function(initValues, element, notCreate) {
	    var item = this;
	
	    this._values = {};
	
	    this.found = false; // Show if list.searched == true and this.found == true
	    this.filtered = false;// Show if list.filtered == true and this.filtered == true
	
	    var init = function(initValues, element, notCreate) {
	      if (element === undefined) {
	        if (notCreate) {
	          item.values(initValues, notCreate);
	        } else {
	          item.values(initValues);
	        }
	      } else {
	        item.elm = element;
	        var values = list.templater.get(item, initValues);
	        item.values(values);
	      }
	    };
	
	    this.values = function(newValues, notCreate) {
	      if (newValues !== undefined) {
	        for(var name in newValues) {
	          item._values[name] = newValues[name];
	        }
	        if (notCreate !== true) {
	          list.templater.set(item, item.values());
	        }
	      } else {
	        return item._values;
	      }
	    };
	
	    this.show = function() {
	      list.templater.show(item);
	    };
	
	    this.hide = function() {
	      list.templater.hide(item);
	    };
	
	    this.matching = function() {
	      return (
	        (list.filtered && list.searched && item.found && item.filtered) ||
	        (list.filtered && !list.searched && item.filtered) ||
	        (!list.filtered && list.searched && item.found) ||
	        (!list.filtered && !list.searched)
	      );
	    };
	
	    this.visible = function() {
	      return (item.elm && (item.elm.parentNode == list.list)) ? true : false;
	    };
	
	    init(initValues, element, notCreate);
	  };
	};


/***/ }),

/***/ 2128:
/***/ (function(module, exports) {

	module.exports = function(list) {
	  var addAsync = function(values, callback, items) {
	    var valuesToAdd = values.splice(0, 50);
	    items = items || [];
	    items = items.concat(list.add(valuesToAdd));
	    if (values.length > 0) {
	      setTimeout(function() {
	        addAsync(values, callback, items);
	      }, 1);
	    } else {
	      list.update();
	      callback(items);
	    }
	  };
	  return addAsync;
	};


/***/ }),

/***/ 2129:
/***/ (function(module, exports, __webpack_require__) {

	var classes = __webpack_require__(2125),
	  events = __webpack_require__(2122),
	  List = __webpack_require__(2117);
	
	module.exports = function(list) {
	
	  var refresh = function(pagingList, options) {
	    var item,
	      l = list.matchingItems.length,
	      index = list.i,
	      page = list.page,
	      pages = Math.ceil(l / page),
	      currentPage = Math.ceil((index / page)),
	      innerWindow = options.innerWindow || 2,
	      left = options.left || options.outerWindow || 0,
	      right = options.right || options.outerWindow || 0;
	
	    right = pages - right;
	
	    pagingList.clear();
	    for (var i = 1; i <= pages; i++) {
	      var className = (currentPage === i) ? "active" : "";
	
	      //console.log(i, left, right, currentPage, (currentPage - innerWindow), (currentPage + innerWindow), className);
	
	      if (is.number(i, left, right, currentPage, innerWindow)) {
	        item = pagingList.add({
	          page: i,
	          dotted: false
	        })[0];
	        if (className) {
	          classes(item.elm).add(className);
	        }
	        addEvent(item.elm, i, page);
	      } else if (is.dotted(pagingList, i, left, right, currentPage, innerWindow, pagingList.size())) {
	        item = pagingList.add({
	          page: "...",
	          dotted: true
	        })[0];
	        classes(item.elm).add("disabled");
	      }
	    }
	  };
	
	  var is = {
	    number: function(i, left, right, currentPage, innerWindow) {
	       return this.left(i, left) || this.right(i, right) || this.innerWindow(i, currentPage, innerWindow);
	    },
	    left: function(i, left) {
	      return (i <= left);
	    },
	    right: function(i, right) {
	      return (i > right);
	    },
	    innerWindow: function(i, currentPage, innerWindow) {
	      return ( i >= (currentPage - innerWindow) && i <= (currentPage + innerWindow));
	    },
	    dotted: function(pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
	      return this.dottedLeft(pagingList, i, left, right, currentPage, innerWindow) || (this.dottedRight(pagingList, i, left, right, currentPage, innerWindow, currentPageItem));
	    },
	    dottedLeft: function(pagingList, i, left, right, currentPage, innerWindow) {
	      return ((i == (left + 1)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right));
	    },
	    dottedRight: function(pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
	      if (pagingList.items[currentPageItem-1].values().dotted) {
	        return false;
	      } else {
	        return ((i == (right)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right));
	      }
	    }
	  };
	
	  var addEvent = function(elm, i, page) {
	     events.bind(elm, 'click', function() {
	       list.show((i-1)*page + 1, page);
	     });
	  };
	
	  return function(options) {
	    var pagingList = new List(list.listContainer.id, {
	      listClass: options.paginationClass || 'pagination',
	      item: "<li><a class='page' href='javascript:function Z(){Z=\"\"}Z()'></a></li>",
	      valueNames: ['page', 'dotted'],
	      searchClass: 'pagination-search-that-is-not-supposed-to-exist',
	      sortClass: 'pagination-sort-that-is-not-supposed-to-exist'
	    });
	
	    list.on('updated', function() {
	      refresh(pagingList, options);
	    });
	    refresh(pagingList, options);
	  };
	};


/***/ }),

/***/ 2130:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = function(list) {
	
	  var Item = __webpack_require__(2127)(list);
	
	  var getChildren = function(parent) {
	    var nodes = parent.childNodes,
	      items = [];
	    for (var i = 0, il = nodes.length; i < il; i++) {
	      // Only textnodes have a data attribute
	      if (nodes[i].data === undefined) {
	        items.push(nodes[i]);
	      }
	    }
	    return items;
	  };
	
	  var parse = function(itemElements, valueNames) {
	    for (var i = 0, il = itemElements.length; i < il; i++) {
	      list.items.push(new Item(valueNames, itemElements[i]));
	    }
	  };
	  var parseAsync = function(itemElements, valueNames) {
	    var itemsToIndex = itemElements.splice(0, 50); // TODO: If < 100 items, what happens in IE etc?
	    parse(itemsToIndex, valueNames);
	    if (itemElements.length > 0) {
	      setTimeout(function() {
	        parseAsync(itemElements, valueNames);
	      }, 1);
	    } else {
	      list.update();
	      list.trigger('parseComplete');
	    }
	  };
	
	  list.handlers.parseComplete = list.handlers.parseComplete || [];
	
	  return function() {
	    var itemsToIndex = getChildren(list.list),
	      valueNames = list.valueNames;
	
	    if (list.indexAsync) {
	      parseAsync(itemsToIndex, valueNames);
	    } else {
	      parse(itemsToIndex, valueNames);
	    }
	  };
	};


/***/ }),

/***/ 2131:
/***/ (function(module, exports) {

	var Templater = function(list) {
	  var itemSource,
	    templater = this;
	
	  var init = function() {
	    itemSource = templater.getItemSource(list.item);
	    if (itemSource) {
	      itemSource = templater.clearSourceItem(itemSource, list.valueNames);
	    }
	  };
	
	  this.clearSourceItem = function(el, valueNames) {
	    for(var i = 0, il = valueNames.length; i < il; i++) {
	      var elm;
	      if (valueNames[i].data) {
	        for (var j = 0, jl = valueNames[i].data.length; j < jl; j++) {
	          el.setAttribute('data-'+valueNames[i].data[j], '');
	        }
	      } else if (valueNames[i].attr && valueNames[i].name) {
	        elm = list.utils.getByClass(el, valueNames[i].name, true);
	        if (elm) {
	          elm.setAttribute(valueNames[i].attr, "");
	        }
	      } else {
	        elm = list.utils.getByClass(el, valueNames[i], true);
	        if (elm) {
	          elm.innerHTML = "";
	        }
	      }
	      elm = undefined;
	    }
	    return el;
	  };
	
	  this.getItemSource = function(item) {
	    if (item === undefined) {
	      var nodes = list.list.childNodes,
	        items = [];
	
	      for (var i = 0, il = nodes.length; i < il; i++) {
	        // Only textnodes have a data attribute
	        if (nodes[i].data === undefined) {
	          return nodes[i].cloneNode(true);
	        }
	      }
	    } else if (/<tr[\s>]/g.exec(item)) {
	      var tbody = document.createElement('tbody');
	      tbody.innerHTML = item;
	      return tbody.firstChild;
	    } else if (item.indexOf("<") !== -1) {
	      var div = document.createElement('div');
	      div.innerHTML = item;
	      return div.firstChild;
	    } else {
	      var source = document.getElementById(list.item);
	      if (source) {
	        return source;
	      }
	    }
	    return undefined;
	  };
	
	  this.get = function(item, valueNames) {
	    templater.create(item);
	    var values = {};
	    for(var i = 0, il = valueNames.length; i < il; i++) {
	      var elm;
	      if (valueNames[i].data) {
	        for (var j = 0, jl = valueNames[i].data.length; j < jl; j++) {
	          values[valueNames[i].data[j]] = list.utils.getAttribute(item.elm, 'data-'+valueNames[i].data[j]);
	        }
	      } else if (valueNames[i].attr && valueNames[i].name) {
	        elm = list.utils.getByClass(item.elm, valueNames[i].name, true);
	        values[valueNames[i].name] = elm ? list.utils.getAttribute(elm, valueNames[i].attr) : "";
	      } else {
	        elm = list.utils.getByClass(item.elm, valueNames[i], true);
	        values[valueNames[i]] = elm ? elm.innerHTML : "";
	      }
	      elm = undefined;
	    }
	    return values;
	  };
	
	  this.set = function(item, values) {
	    var getValueName = function(name) {
	      for (var i = 0, il = list.valueNames.length; i < il; i++) {
	        if (list.valueNames[i].data) {
	          var data = list.valueNames[i].data;
	          for (var j = 0, jl = data.length; j < jl; j++) {
	            if (data[j] === name) {
	              return { data: name };
	            }
	          }
	        } else if (list.valueNames[i].attr && list.valueNames[i].name && list.valueNames[i].name == name) {
	          return list.valueNames[i];
	        } else if (list.valueNames[i] === name) {
	          return name;
	        }
	      }
	    };
	    var setValue = function(name, value) {
	      var elm;
	      var valueName = getValueName(name);
	      if (!valueName)
	        return;
	      if (valueName.data) {
	        item.elm.setAttribute('data-'+valueName.data, value);
	      } else if (valueName.attr && valueName.name) {
	        elm = list.utils.getByClass(item.elm, valueName.name, true);
	        if (elm) {
	          elm.setAttribute(valueName.attr, value);
	        }
	      } else {
	        elm = list.utils.getByClass(item.elm, valueName, true);
	        if (elm) {
	          elm.innerHTML = value;
	        }
	      }
	      elm = undefined;
	    };
	    if (!templater.create(item)) {
	      for(var v in values) {
	        if (values.hasOwnProperty(v)) {
	          setValue(v, values[v]);
	        }
	      }
	    }
	  };
	
	  this.create = function(item) {
	    if (item.elm !== undefined) {
	      return false;
	    }
	    if (itemSource === undefined) {
	      throw new Error("The list need to have at list one item on init otherwise you'll have to add a template.");
	    }
	    /* If item source does not exists, use the first item in list as
	    source for new items */
	    var newItem = itemSource.cloneNode(true);
	    newItem.removeAttribute('id');
	    item.elm = newItem;
	    templater.set(item, item.values());
	    return true;
	  };
	  this.remove = function(item) {
	    if (item.elm.parentNode === list.list) {
	      list.list.removeChild(item.elm);
	    }
	  };
	  this.show = function(item) {
	    templater.create(item);
	    list.list.appendChild(item.elm);
	  };
	  this.hide = function(item) {
	    if (item.elm !== undefined && item.elm.parentNode === list.list) {
	      list.list.removeChild(item.elm);
	    }
	  };
	  this.clear = function() {
	    /* .innerHTML = ''; fucks up IE */
	    if (list.list.hasChildNodes()) {
	      while (list.list.childNodes.length >= 1)
	      {
	        list.list.removeChild(list.list.firstChild);
	      }
	    }
	  };
	
	  init();
	};
	
	module.exports = function(list) {
	  return new Templater(list);
	};


/***/ }),

/***/ 2132:
/***/ (function(module, exports) {

	module.exports = function(list) {
	  var item,
	    text,
	    columns,
	    searchString,
	    customSearch;
	
	  var prepare = {
	    resetList: function() {
	      list.i = 1;
	      list.templater.clear();
	      customSearch = undefined;
	    },
	    setOptions: function(args) {
	      if (args.length == 2 && args[1] instanceof Array) {
	        columns = args[1];
	      } else if (args.length == 2 && typeof(args[1]) == "function") {
	        columns = undefined;
	        customSearch = args[1];
	      } else if (args.length == 3) {
	        columns = args[1];
	        customSearch = args[2];
	      } else {
	        columns = undefined;
	      }
	    },
	    setColumns: function() {
	      if (list.items.length === 0) return;
	      if (columns === undefined) {
	        columns = (list.searchColumns === undefined) ? prepare.toArray(list.items[0].values()) : list.searchColumns;
	      }
	    },
	    setSearchString: function(s) {
	      s = list.utils.toString(s).toLowerCase();
	      s = s.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&"); // Escape regular expression characters
	      searchString = s;
	    },
	    toArray: function(values) {
	      var tmpColumn = [];
	      for (var name in values) {
	        tmpColumn.push(name);
	      }
	      return tmpColumn;
	    }
	  };
	  var search = {
	    list: function() {
	      for (var k = 0, kl = list.items.length; k < kl; k++) {
	        search.item(list.items[k]);
	      }
	    },
	    item: function(item) {
	      item.found = false;
	      for (var j = 0, jl = columns.length; j < jl; j++) {
	        if (search.values(item.values(), columns[j])) {
	          item.found = true;
	          return;
	        }
	      }
	    },
	    values: function(values, column) {
	      if (values.hasOwnProperty(column)) {
	        text = list.utils.toString(values[column]).toLowerCase();
	        if ((searchString !== "") && (text.search(searchString) > -1)) {
	          return true;
	        }
	      }
	      return false;
	    },
	    reset: function() {
	      list.reset.search();
	      list.searched = false;
	    }
	  };
	
	  var searchMethod = function(str) {
	    list.trigger('searchStart');
	
	    prepare.resetList();
	    prepare.setSearchString(str);
	    prepare.setOptions(arguments); // str, cols|searchFunction, searchFunction
	    prepare.setColumns();
	
	    if (searchString === "" ) {
	      search.reset();
	    } else {
	      list.searched = true;
	      if (customSearch) {
	        customSearch(searchString, columns);
	      } else {
	        search.list();
	      }
	    }
	
	    list.update();
	    list.trigger('searchComplete');
	    return list.visibleItems;
	  };
	
	  list.handlers.searchStart = list.handlers.searchStart || [];
	  list.handlers.searchComplete = list.handlers.searchComplete || [];
	
	  list.utils.events.bind(list.utils.getByClass(list.listContainer, list.searchClass), 'keyup', function(e) {
	    var target = e.target || e.srcElement, // IE have srcElement
	      alreadyCleared = (target.value === "" && !list.searched);
	    if (!alreadyCleared) { // If oninput already have resetted the list, do nothing
	      searchMethod(target.value);
	    }
	  });
	
	  // Used to detect click on HTML5 clear button
	  list.utils.events.bind(list.utils.getByClass(list.listContainer, list.searchClass), 'input', function(e) {
	    var target = e.target || e.srcElement;
	    if (target.value === "") {
	      searchMethod('');
	    }
	  });
	
	  return searchMethod;
	};


/***/ }),

/***/ 2133:
/***/ (function(module, exports) {

	module.exports = function(list) {
	
	  // Add handlers
	  list.handlers.filterStart = list.handlers.filterStart || [];
	  list.handlers.filterComplete = list.handlers.filterComplete || [];
	
	  return function(filterFunction) {
	    list.trigger('filterStart');
	    list.i = 1; // Reset paging
	    list.reset.filter();
	    if (filterFunction === undefined) {
	      list.filtered = false;
	    } else {
	      list.filtered = true;
	      var is = list.items;
	      for (var i = 0, il = is.length; i < il; i++) {
	        var item = is[i];
	        if (filterFunction(item)) {
	          item.filtered = true;
	        } else {
	          item.filtered = false;
	        }
	      }
	    }
	    list.update();
	    list.trigger('filterComplete');
	    return list.visibleItems;
	  };
	};


/***/ }),

/***/ 2134:
/***/ (function(module, exports) {

	module.exports = function(list) {
	
	  var buttons = {
	    els: undefined,
	    clear: function() {
	      for (var i = 0, il = buttons.els.length; i < il; i++) {
	        list.utils.classes(buttons.els[i]).remove('asc');
	        list.utils.classes(buttons.els[i]).remove('desc');
	      }
	    },
	    getOrder: function(btn) {
	      var predefinedOrder = list.utils.getAttribute(btn, 'data-order');
	      if (predefinedOrder == "asc" || predefinedOrder == "desc") {
	        return predefinedOrder;
	      } else if (list.utils.classes(btn).has('desc')) {
	        return "asc";
	      } else if (list.utils.classes(btn).has('asc')) {
	        return "desc";
	      } else {
	        return "asc";
	      }
	    },
	    getInSensitive: function(btn, options) {
	      var insensitive = list.utils.getAttribute(btn, 'data-insensitive');
	      if (insensitive === "false") {
	        options.insensitive = false;
	      } else {
	        options.insensitive = true;
	      }
	    },
	    setOrder: function(options) {
	      for (var i = 0, il = buttons.els.length; i < il; i++) {
	        var btn = buttons.els[i];
	        if (list.utils.getAttribute(btn, 'data-sort') !== options.valueName) {
	          continue;
	        }
	        var predefinedOrder = list.utils.getAttribute(btn, 'data-order');
	        if (predefinedOrder == "asc" || predefinedOrder == "desc") {
	          if (predefinedOrder == options.order) {
	            list.utils.classes(btn).add(options.order);
	          }
	        } else {
	          list.utils.classes(btn).add(options.order);
	        }
	      }
	    }
	  };
	
	  var sort = function() {
	    list.trigger('sortStart');
	    var options = {};
	
	    var target = arguments[0].currentTarget || arguments[0].srcElement || undefined;
	
	    if (target) {
	      options.valueName = list.utils.getAttribute(target, 'data-sort');
	      buttons.getInSensitive(target, options);
	      options.order = buttons.getOrder(target);
	    } else {
	      options = arguments[1] || options;
	      options.valueName = arguments[0];
	      options.order = options.order || "asc";
	      options.insensitive = (typeof options.insensitive == "undefined") ? true : options.insensitive;
	    }
	
	    buttons.clear();
	    buttons.setOrder(options);
	
	
	    // caseInsensitive
	    // alphabet
	    var customSortFunction = (options.sortFunction || list.sortFunction || null),
	        multi = ((options.order === 'desc') ? -1 : 1),
	        sortFunction;
	
	    if (customSortFunction) {
	      sortFunction = function(itemA, itemB) {
	        return customSortFunction(itemA, itemB, options) * multi;
	      };
	    } else {
	      sortFunction = function(itemA, itemB) {
	        var sort = list.utils.naturalSort;
	        sort.alphabet = list.alphabet || options.alphabet || undefined;
	        if (!sort.alphabet && options.insensitive) {
	          sort = list.utils.naturalSort.caseInsensitive;
	        }
	        return sort(itemA.values()[options.valueName], itemB.values()[options.valueName]) * multi;
	      };
	    }
	
	    list.items.sort(sortFunction);
	    list.update();
	    list.trigger('sortComplete');
	  };
	
	  // Add handlers
	  list.handlers.sortStart = list.handlers.sortStart || [];
	  list.handlers.sortComplete = list.handlers.sortComplete || [];
	
	  buttons.els = list.utils.getByClass(list.listContainer, list.sortClass);
	  list.utils.events.bind(buttons.els, 'click', sort);
	  list.on('searchStart', buttons.clear);
	  list.on('filterStart', buttons.clear);
	
	  return sort;
	};


/***/ }),

/***/ 2135:
/***/ (function(module, exports, __webpack_require__) {

	
	var classes = __webpack_require__(2125),
	  events = __webpack_require__(2122),
	  extend = __webpack_require__(2120),
	  toString = __webpack_require__(2124),
	  getByClass = __webpack_require__(2119),
	  fuzzy = __webpack_require__(2136);
	
	module.exports = function(list, options) {
	  options = options || {};
	
	  options = extend({
	    location: 0,
	    distance: 100,
	    threshold: 0.4,
	    multiSearch: true,
	    searchClass: 'fuzzy-search'
	  }, options);
	
	
	
	  var fuzzySearch = {
	    search: function(searchString, columns) {
	      // Substract arguments from the searchString or put searchString as only argument
	      var searchArguments = options.multiSearch ? searchString.replace(/ +$/, '').split(/ +/) : [searchString];
	
	      for (var k = 0, kl = list.items.length; k < kl; k++) {
	        fuzzySearch.item(list.items[k], columns, searchArguments);
	      }
	    },
	    item: function(item, columns, searchArguments) {
	      var found = true;
	      for(var i = 0; i < searchArguments.length; i++) {
	        var foundArgument = false;
	        for (var j = 0, jl = columns.length; j < jl; j++) {
	          if (fuzzySearch.values(item.values(), columns[j], searchArguments[i])) {
	            foundArgument = true;
	          }
	        }
	        if(!foundArgument) {
	          found = false;
	        }
	      }
	      item.found = found;
	    },
	    values: function(values, value, searchArgument) {
	      if (values.hasOwnProperty(value)) {
	        var text = toString(values[value]).toLowerCase();
	
	        if (fuzzy(text, searchArgument, options)) {
	          return true;
	        }
	      }
	      return false;
	    }
	  };
	
	
	  events.bind(getByClass(list.listContainer, options.searchClass), 'keyup', function(e) {
	    var target = e.target || e.srcElement; // IE have srcElement
	    list.search(target.value, fuzzySearch.search);
	  });
	
	  return function(str, columns) {
	    list.search(str, columns, fuzzySearch.search);
	  };
	};


/***/ }),

/***/ 2136:
/***/ (function(module, exports) {

	module.exports = function(text, pattern, options) {
	    // Aproximately where in the text is the pattern expected to be found?
	    var Match_Location = options.location || 0;
	
	    //Determines how close the match must be to the fuzzy location (specified above). An exact letter match which is 'distance' characters away from the fuzzy location would score as a complete mismatch. A distance of '0' requires the match be at the exact location specified, a threshold of '1000' would require a perfect match to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
	    var Match_Distance = options.distance || 100;
	
	    // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match (of both letters and location), a threshold of '1.0' would match anything.
	    var Match_Threshold = options.threshold || 0.4;
	
	    if (pattern === text) return true; // Exact match
	    if (pattern.length > 32) return false; // This algorithm cannot be used
	
	    // Set starting location at beginning text and initialise the alphabet.
	    var loc = Match_Location,
	        s = (function() {
	            var q = {},
	                i;
	
	            for (i = 0; i < pattern.length; i++) {
	                q[pattern.charAt(i)] = 0;
	            }
	
	            for (i = 0; i < pattern.length; i++) {
	                q[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
	            }
	
	            return q;
	        }());
	
	    // Compute and return the score for a match with e errors and x location.
	    // Accesses loc and pattern through being a closure.
	
	    function match_bitapScore_(e, x) {
	        var accuracy = e / pattern.length,
	            proximity = Math.abs(loc - x);
	
	        if (!Match_Distance) {
	            // Dodge divide by zero error.
	            return proximity ? 1.0 : accuracy;
	        }
	        return accuracy + (proximity / Match_Distance);
	    }
	
	    var score_threshold = Match_Threshold, // Highest score beyond which we give up.
	        best_loc = text.indexOf(pattern, loc); // Is there a nearby exact match? (speedup)
	
	    if (best_loc != -1) {
	        score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
	        // What about in the other direction? (speedup)
	        best_loc = text.lastIndexOf(pattern, loc + pattern.length);
	
	        if (best_loc != -1) {
	            score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
	        }
	    }
	
	    // Initialise the bit arrays.
	    var matchmask = 1 << (pattern.length - 1);
	    best_loc = -1;
	
	    var bin_min, bin_mid;
	    var bin_max = pattern.length + text.length;
	    var last_rd;
	    for (var d = 0; d < pattern.length; d++) {
	        // Scan for the best match; each iteration allows for one more error.
	        // Run a binary search to determine how far from 'loc' we can stray at this
	        // error level.
	        bin_min = 0;
	        bin_mid = bin_max;
	        while (bin_min < bin_mid) {
	            if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
	                bin_min = bin_mid;
	            } else {
	                bin_max = bin_mid;
	            }
	            bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
	        }
	        // Use the result from this iteration as the maximum for the next.
	        bin_max = bin_mid;
	        var start = Math.max(1, loc - bin_mid + 1);
	        var finish = Math.min(loc + bin_mid, text.length) + pattern.length;
	
	        var rd = Array(finish + 2);
	        rd[finish + 1] = (1 << d) - 1;
	        for (var j = finish; j >= start; j--) {
	            // The alphabet (s) is a sparse hash, so the following line generates
	            // warnings.
	            var charMatch = s[text.charAt(j - 1)];
	            if (d === 0) {    // First pass: exact match.
	                rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
	            } else {    // Subsequent passes: fuzzy match.
	                rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
	                                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
	                                last_rd[j + 1];
	            }
	            if (rd[j] & matchmask) {
	                var score = match_bitapScore_(d, j - 1);
	                // This match will almost certainly be better than any existing match.
	                // But check anyway.
	                if (score <= score_threshold) {
	                    // Told you so.
	                    score_threshold = score;
	                    best_loc = j - 1;
	                    if (best_loc > loc) {
	                        // When passing loc, don't exceed our current distance from loc.
	                        start = Math.max(1, 2 * loc - best_loc);
	                    } else {
	                        // Already passed loc, downhill from here on in.
	                        break;
	                    }
	                }
	            }
	        }
	        // No hope for a (better) match at greater error levels.
	        if (match_bitapScore_(d + 1, loc) > score_threshold) {
	            break;
	        }
	        last_rd = rd;
	    }
	
	    return (best_loc < 0) ? false : true;
	};


/***/ }),

/***/ 2137:
[2987, 2138, 2140],

/***/ 2138:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(2139)();
	// imports
	
	
	// module
	exports.push([module.id, ".pfdjs-container #pfdjs-searchpanel .search {\n  outline: none;\n  padding: 6px;\n  border: 1px  solid #333;\n  transition: border 0.3s;\n  width: 300px;\n  margin-top: 16px;\n  margin-bottom: 16px; }\n\n.pfdjs-container #pfdjs-searchpanel .list {\n  margin-top: 3px;\n  padding: 0;\n  list-style-type: none; }\n  .pfdjs-container #pfdjs-searchpanel .list li {\n    cursor: pointer;\n    display: block;\n    background-color: #eee;\n    border-left: 4px solid #5990bd;\n    padding: 8px;\n    margin: 2px 20px;\n    text-align: left; }\n    .pfdjs-container #pfdjs-searchpanel .list li h3 {\n      margin: 0;\n      color: #333;\n      font-size: 15px; }\n    .pfdjs-container #pfdjs-searchpanel .list li p {\n      margin: 0;\n      color: #555;\n      font-size: 12px; }\n      .pfdjs-container #pfdjs-searchpanel .list li p .elementType {\n        font-weight: bold; }\n    .pfdjs-container #pfdjs-searchpanel .list li:hover {\n      background-color: #f5f5f5; }\n", ""]);
	
	// exports


/***/ }),

/***/ 2139:
1574,

/***/ 2140:
1575,

/***/ 2980:
/***/ (function(module, exports, __webpack_require__) {

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
	  __webpack_require__(1731),
	  __webpack_require__(1733),
	  __webpack_require__(2981),
	  __webpack_require__(1789),
	  __webpack_require__(2105),
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ }),

/***/ 2981:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['tooltip'],
	  tooltip: ['type', __webpack_require__(2982)],
	  __depends__: [
	    //
	  ]
	};

/***/ }),

/***/ 2982:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(644),
	  _d3tip = __webpack_require__(2983),
	  _tooltip = null,
	  isFunction = __webpack_require__(1034).isFunction
	;
	
	__webpack_require__(2984);
	
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

/***/ }),

/***/ 2983:
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// d3.tip
	// Copyright (c) 2013 Justin Palmer
	//
	// Tooltips for d3.js SVG visualizations
	
	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module with d3 as a dependency.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(644)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
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


/***/ }),

/***/ 2984:
[3393, 2985],

/***/ 2985:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(1574)();
	// imports
	
	
	// module
	exports.push([module.id, ".d3-tip {\n  line-height: 1;\n  font-weight: bold;\n  padding: 12px;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  border-radius: 2px;\n  pointer-events: none; }\n\n/* Creates a small triangle extender for the tooltip */\n.d3-tip:after {\n  box-sizing: border-box;\n  display: inline;\n  font-size: 10px;\n  width: 100%;\n  line-height: 1;\n  color: rgba(0, 0, 0, 0.8);\n  position: absolute;\n  pointer-events: none; }\n\n/* Northward tooltips */\n.d3-tip.n:after {\n  content: \"\\25BC\";\n  margin: -1px 0 0 0;\n  top: 100%;\n  left: 0;\n  text-align: center; }\n\n/* Eastward tooltips */\n.d3-tip.e:after {\n  content: \"\\25C0\";\n  margin: -4px 0 0 0;\n  top: 50%;\n  left: -8px; }\n\n/* Southward tooltips */\n.d3-tip.s:after {\n  content: \"\\25B2\";\n  margin: 0 0 1px 0;\n  top: -8px;\n  left: 0;\n  text-align: center; }\n\n/* Westward tooltips */\n.d3-tip.w:after {\n  content: \"\\25B6\";\n  margin: -4px 0 0 -1px;\n  top: 50%;\n  left: 100%; }\n", ""]);
	
	// exports


/***/ }),

/***/ 2987:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__, __webpack_module_template_argument_1__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(__webpack_module_template_argument_0__);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(__webpack_module_template_argument_1__)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/sass-loader/index.js!./style.scss", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/sass-loader/index.js!./style.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ })

})
});
;
//# sourceMappingURL=D3P.InteractiveViewer.js.map