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

	module.exports = __webpack_require__(2878);


/***/ }),

/***/ 1608:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['zoomScroll'],
	  zoomScroll: ['type', __webpack_require__(1609)]
	};

/***/ }),

/***/ 1609:
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

/***/ 1610:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['mouseEvents'],
	  mouseEvents: ['type', __webpack_require__(1611)],
	  __depends__: [
	    __webpack_require__(1492)
	  ]
	};


/***/ }),

/***/ 1611:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(555),
	  getLocalName = __webpack_require__(1561);
	
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
	  // this._canvas.getRootLayer().on('mousedown', function(){
	  //   console.log('_canvas.getRootLayer()on(\'click\')', arguments);
	  //   if (d3.event.eventPhase === 2) {
	  //     that._eventBus.emit('background.click');
	  //   }
	  // });
	};

/***/ }),

/***/ 1687:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['sideTabs', 'sideTabsProvider'],
	  sideTabs: ['type', __webpack_require__(1688)],
	  sideTabsProvider: ['type', __webpack_require__(2002)],
	  __depends__: [
	    //''
	  ]
	};


/***/ }),

/***/ 1688:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var forEach = __webpack_require__(1689).forEach,
	  isFunction = __webpack_require__(1902).isFunction,
	  isUndefined = __webpack_require__(1902).isUndefined,
	  toSafeInteger = __webpack_require__(1902).toSafeInteger,
	  domify = __webpack_require__(1984),
	  domQuery = __webpack_require__(1986),
	  domAttr = __webpack_require__(1988),
	  domClear = __webpack_require__(1989),
	  domClasses = __webpack_require__(1990),
	  domDelegate = __webpack_require__(1993)
	  ;
	
	__webpack_require__(1998);
	
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

/***/ 1689:
[3132, 1690, 1815, 1819, 1825, 1829, 1831, 1838, 1840, 1845, 1846, 1816, 1820, 1847, 1848, 1855, 1867, 1843, 1868, 1873, 1874, 1877, 1879, 1881, 1885, 1891, 1894, 1899, 1901],

/***/ 1690:
[3133, 1691, 1707],

/***/ 1691:
[2903, 1692],

/***/ 1692:
[2904, 1693],

/***/ 1693:
[2905, 1694, 1706],

/***/ 1694:
[2906, 1695, 1703, 1702, 1705],

/***/ 1695:
[2907, 1696, 1702],

/***/ 1696:
[2908, 1697, 1700, 1701],

/***/ 1697:
[2909, 1698],

/***/ 1698:
[2910, 1699],

/***/ 1699:
17,

/***/ 1700:
[2911, 1697],

/***/ 1701:
19,

/***/ 1702:
20,

/***/ 1703:
[2912, 1704],

/***/ 1704:
[2913, 1698],

/***/ 1705:
23,

/***/ 1706:
24,

/***/ 1707:
[3134, 1708, 1709, 1735, 1720],

/***/ 1708:
581,

/***/ 1709:
[3135, 1710],

/***/ 1710:
[3136, 1711, 1734],

/***/ 1711:
[3012, 1712, 1714],

/***/ 1712:
[2986, 1713],

/***/ 1713:
122,

/***/ 1714:
[2922, 1715, 1729, 1733],

/***/ 1715:
[2923, 1716, 1717, 1720, 1721, 1723, 1724],

/***/ 1716:
43,

/***/ 1717:
[2924, 1718, 1719],

/***/ 1718:
[2925, 1696, 1719],

/***/ 1719:
46,

/***/ 1720:
47,

/***/ 1721:
[2926, 1698, 1722],

/***/ 1722:
50,

/***/ 1723:
39,

/***/ 1724:
[2927, 1725, 1727, 1728],

/***/ 1725:
[2928, 1696, 1726, 1719],

/***/ 1726:
38,

/***/ 1727:
53,

/***/ 1728:
[2929, 1699],

/***/ 1729:
[2930, 1730, 1731],

/***/ 1730:
40,

/***/ 1731:
[2931, 1732],

/***/ 1732:
57,

/***/ 1733:
[2921, 1695, 1726],

/***/ 1734:
[3137, 1733],

/***/ 1735:
[3013, 1736, 1795, 1811, 1720, 1812],

/***/ 1736:
[3014, 1737, 1792, 1794],

/***/ 1737:
[3015, 1738, 1768],

/***/ 1738:
[2982, 1739, 1747, 1748, 1749, 1750, 1751],

/***/ 1739:
[2955, 1740, 1741, 1744, 1745, 1746],

/***/ 1740:
84,

/***/ 1741:
[2956, 1742],

/***/ 1742:
[2957, 1743],

/***/ 1743:
25,

/***/ 1744:
[2958, 1742],

/***/ 1745:
[2959, 1742],

/***/ 1746:
[2960, 1742],

/***/ 1747:
[2983, 1739],

/***/ 1748:
116,

/***/ 1749:
117,

/***/ 1750:
118,

/***/ 1751:
[2984, 1739, 1752, 1753],

/***/ 1752:
[2961, 1693, 1698],

/***/ 1753:
[2947, 1754, 1762, 1765, 1766, 1767],

/***/ 1754:
[2948, 1755, 1739, 1752],

/***/ 1755:
[2949, 1756, 1758, 1759, 1760, 1761],

/***/ 1756:
[2950, 1757],

/***/ 1757:
[2951, 1693],

/***/ 1758:
79,

/***/ 1759:
[2952, 1757],

/***/ 1760:
[2953, 1757],

/***/ 1761:
[2954, 1757],

/***/ 1762:
[2962, 1763],

/***/ 1763:
[2963, 1764],

/***/ 1764:
93,

/***/ 1765:
[2964, 1763],

/***/ 1766:
[2965, 1763],

/***/ 1767:
[2966, 1763],

/***/ 1768:
[3016, 1769, 1719],

/***/ 1769:
[3017, 1738, 1770, 1776, 1780, 1787, 1720, 1721, 1724],

/***/ 1770:
[3018, 1771, 1774, 1775],

/***/ 1771:
[3019, 1753, 1772, 1773],

/***/ 1772:
160,

/***/ 1773:
161,

/***/ 1774:
162,

/***/ 1775:
163,

/***/ 1776:
[3020, 1697, 1777, 1743, 1770, 1778, 1779],

/***/ 1777:
[2991, 1698],

/***/ 1778:
144,

/***/ 1779:
165,

/***/ 1780:
[3021, 1781],

/***/ 1781:
[3022, 1782, 1784, 1714],

/***/ 1782:
[3023, 1783, 1720],

/***/ 1783:
104,

/***/ 1784:
[3024, 1785, 1786],

/***/ 1785:
170,

/***/ 1786:
171,

/***/ 1787:
[3002, 1788, 1752, 1789, 1790, 1791, 1696, 1705],

/***/ 1788:
[3003, 1693, 1698],

/***/ 1789:
[3004, 1693, 1698],

/***/ 1790:
[3005, 1693, 1698],

/***/ 1791:
[3006, 1693, 1698],

/***/ 1792:
[3025, 1793, 1714],

/***/ 1793:
[3026, 1702],

/***/ 1794:
174,

/***/ 1795:
[3027, 1768, 1796, 1808, 1799, 1793, 1794, 1807],

/***/ 1796:
[2939, 1797],

/***/ 1797:
[2940, 1798, 1807],

/***/ 1798:
[2941, 1720, 1799, 1801, 1804],

/***/ 1799:
[2942, 1720, 1800],

/***/ 1800:
[2943, 1696, 1719],

/***/ 1801:
[2944, 1802],

/***/ 1802:
[2945, 1803],

/***/ 1803:
[2946, 1753],

/***/ 1804:
[2967, 1805],

/***/ 1805:
[2968, 1697, 1806, 1720, 1800],

/***/ 1806:
99,

/***/ 1807:
[2969, 1800],

/***/ 1808:
[3028, 1809, 1810],

/***/ 1809:
177,

/***/ 1810:
[3029, 1798, 1717, 1720, 1723, 1726, 1807],

/***/ 1811:
29,

/***/ 1812:
[3030, 1813, 1814, 1799, 1807],

/***/ 1813:
180,

/***/ 1814:
[3031, 1797],

/***/ 1815:
[3138, 1816],

/***/ 1816:
[3139, 1817, 1710, 1818, 1720],

/***/ 1817:
209,

/***/ 1818:
[3036, 1811],

/***/ 1819:
[3140, 1820],

/***/ 1820:
[3141, 1821, 1822, 1818, 1720],

/***/ 1821:
694,

/***/ 1822:
[3142, 1823, 1734],

/***/ 1823:
[3033, 1824, 1714],

/***/ 1824:
[3034, 1713],

/***/ 1825:
[3143, 1826, 1827, 1735, 1720, 1828],

/***/ 1826:
699,

/***/ 1827:
[3144, 1710],

/***/ 1828:
[2920, 1743, 1733, 1723, 1702],

/***/ 1829:
[3145, 1785, 1830, 1735, 1720],

/***/ 1830:
[3146, 1710],

/***/ 1831:
[3147, 1832, 1833],

/***/ 1832:
[3148, 1735, 1733, 1714],

/***/ 1833:
[3149, 1834, 1735, 1835],

/***/ 1834:
707,

/***/ 1835:
[3108, 1836],

/***/ 1836:
[3109, 1837],

/***/ 1837:
[3094, 1702, 1800],

/***/ 1838:
[3150, 1832, 1839],

/***/ 1839:
[3151, 1834, 1735, 1835],

/***/ 1840:
[3152, 1841, 1843],

/***/ 1841:
[2972, 1783, 1842],

/***/ 1842:
[2973, 1697, 1717, 1720],

/***/ 1843:
[3153, 1806, 1735, 1844, 1720],

/***/ 1844:
[3154, 1710, 1733],

/***/ 1845:
[3155, 1841, 1843],

/***/ 1846:
[3156, 1841, 1843, 1835],

/***/ 1847:
[3157, 1691, 1707],

/***/ 1848:
[3158, 1849, 1733, 1852, 1835, 1853],

/***/ 1849:
[3159, 1834, 1850, 1851],

/***/ 1850:
723,

/***/ 1851:
724,

/***/ 1852:
[3123, 1696, 1720, 1719],

/***/ 1853:
[3082, 1854, 1714],

/***/ 1854:
[3083, 1806],

/***/ 1855:
[3160, 1856, 1710, 1857, 1861, 1733],

/***/ 1856:
31,

/***/ 1857:
[3049, 1856, 1798, 1858, 1859, 1807],

/***/ 1858:
201,

/***/ 1859:
[3050, 1797, 1860],

/***/ 1860:
203,

/***/ 1861:
[2916, 1811, 1862, 1863],

/***/ 1862:
[2917, 1856],

/***/ 1863:
[2918, 1864, 1866],

/***/ 1864:
[2919, 1865, 1692, 1811],

/***/ 1865:
34,

/***/ 1866:
35,

/***/ 1867:
[3161, 1691, 1707],

/***/ 1868:
[3162, 1869, 1720],

/***/ 1869:
[3163, 1806, 1735, 1844, 1870, 1727, 1871, 1811],

/***/ 1870:
743,

/***/ 1871:
[3164, 1872],

/***/ 1872:
[3165, 1800],

/***/ 1873:
[3166, 1707],

/***/ 1874:
[3167, 1875, 1710, 1735, 1876, 1720],

/***/ 1875:
220,

/***/ 1876:
749,

/***/ 1877:
[3168, 1878, 1822, 1735, 1876, 1720],

/***/ 1878:
751,

/***/ 1879:
[3169, 1785, 1830, 1735, 1720, 1880],

/***/ 1880:
228,

/***/ 1881:
[3170, 1882, 1884, 1720],

/***/ 1882:
[3171, 1883],

/***/ 1883:
756,

/***/ 1884:
[3172, 1882, 1853],

/***/ 1885:
[3173, 1886, 1890, 1720, 1828, 1835],

/***/ 1886:
[3174, 1887, 1888, 1889],

/***/ 1887:
443,

/***/ 1888:
128,

/***/ 1889:
[3175, 1883],

/***/ 1890:
[3176, 1887, 1889, 1853],

/***/ 1891:
[3177, 1892, 1893, 1720],

/***/ 1892:
[3178, 1888, 1889],

/***/ 1893:
[3179, 1889, 1853],

/***/ 1894:
[3180, 1729, 1787, 1733, 1852, 1895],

/***/ 1895:
[3181, 1896, 1897, 1898],

/***/ 1896:
[3182, 1813],

/***/ 1897:
437,

/***/ 1898:
771,

/***/ 1899:
[3183, 1774, 1735, 1900, 1720, 1828],

/***/ 1900:
[3184, 1710],

/***/ 1901:
[3185, 1841, 1869, 1861, 1828],

/***/ 1902:
[3085, 1903, 1904, 1932, 1933, 1934, 1935, 1743, 1937, 1940, 1717, 1720, 1941, 1733, 1943, 1944, 1721, 1945, 1947, 1949, 1950, 1951, 1952, 1953, 1695, 1954, 1726, 1955, 1957, 1958, 1959, 1961, 1963, 1964, 1960, 1702, 1719, 1948, 1965, 1967, 1968, 1852, 1800, 1724, 1970, 1971, 1972, 1973, 1975, 1976, 1836, 1835, 1981, 1837, 1982, 1983, 1804],

/***/ 1903:
[3086, 1720],

/***/ 1904:
[3087, 1905],

/***/ 1905:
[3055, 1738, 1817, 1906, 1907, 1909, 1913, 1888, 1914, 1915, 1781, 1918, 1787, 1919, 1920, 1930, 1720, 1721, 1702, 1714],

/***/ 1906:
[2902, 1691, 1743],

/***/ 1907:
[2975, 1908, 1714],

/***/ 1908:
[2914, 1906, 1691],

/***/ 1909:
[3056, 1908, 1910],

/***/ 1910:
[2933, 1715, 1911, 1733],

/***/ 1911:
[2934, 1702, 1730, 1912],

/***/ 1912:
61,

/***/ 1913:
[2988, 1698],

/***/ 1914:
[3057, 1908, 1784],

/***/ 1915:
[3058, 1908, 1916],

/***/ 1916:
[3059, 1783, 1917, 1784, 1786],

/***/ 1917:
[2993, 1732],

/***/ 1918:
[3060, 1782, 1916, 1910],

/***/ 1919:
215,

/***/ 1920:
[3061, 1921, 1922, 1923, 1925, 1926, 1928, 1929],

/***/ 1921:
[2990, 1777],

/***/ 1922:
[3062, 1921],

/***/ 1923:
[3063, 1924, 1875, 1778],

/***/ 1924:
219,

/***/ 1925:
221,

/***/ 1926:
[3064, 1927, 1875, 1779],

/***/ 1927:
223,

/***/ 1928:
[3065, 1697],

/***/ 1929:
[2989, 1921],

/***/ 1930:
[2992, 1931, 1917, 1730],

/***/ 1931:
[2976, 1702],

/***/ 1932:
[3088, 1905],

/***/ 1933:
[3089, 1905],

/***/ 1934:
[3090, 1905],

/***/ 1935:
[3091, 1936, 1714],

/***/ 1936:
375,

/***/ 1937:
[3092, 1938, 1939],

/***/ 1938:
377,

/***/ 1939:
[3093, 1837],

/***/ 1940:
[3095, 1939],

/***/ 1941:
[3096, 1942, 1727, 1728],

/***/ 1942:
[3097, 1696, 1719],

/***/ 1943:
[2994, 1733, 1719],

/***/ 1944:
[3098, 1696, 1719],

/***/ 1945:
[3099, 1946, 1727, 1728],

/***/ 1946:
[3100, 1696, 1719],

/***/ 1947:
[3101, 1719, 1948],

/***/ 1948:
[2995, 1696, 1917, 1719],

/***/ 1949:
[3102, 1729, 1787, 1717, 1720, 1733, 1721, 1730, 1724],

/***/ 1950:
[3103, 1768],

/***/ 1951:
[3104, 1768],

/***/ 1952:
[3105, 1696, 1719, 1948],

/***/ 1953:
[3106, 1698],

/***/ 1954:
[3107, 1835],

/***/ 1955:
[3110, 1956, 1727, 1728],

/***/ 1956:
[3111, 1787, 1719],

/***/ 1957:
[3112, 1737, 1792],

/***/ 1958:
[3113, 1737, 1792],

/***/ 1959:
[3114, 1960],

/***/ 1960:
[3115, 1696, 1719],

/***/ 1961:
[3116, 1694, 1962],

/***/ 1962:
[3117, 1704, 1695, 1722],

/***/ 1963:
419,

/***/ 1964:
420,

/***/ 1965:
[3118, 1966, 1727, 1728],

/***/ 1966:
[3119, 1696, 1719],

/***/ 1967:
[3120, 1954],

/***/ 1968:
[3121, 1969, 1727, 1728],

/***/ 1969:
[3122, 1787, 1719],

/***/ 1970:
427,

/***/ 1971:
[3124, 1787, 1719],

/***/ 1972:
[3125, 1696, 1719],

/***/ 1973:
[3126, 1974, 1939],

/***/ 1974:
431,

/***/ 1975:
[3127, 1939],

/***/ 1976:
[3128, 1697, 1888, 1787, 1733, 1852, 1977, 1778, 1779, 1978, 1853],

/***/ 1977:
434,

/***/ 1978:
[3129, 1979, 1897, 1980],

/***/ 1979:
436,

/***/ 1980:
438,

/***/ 1981:
[3130, 1887, 1835],

/***/ 1982:
[2996, 1908, 1910],

/***/ 1983:
[3131, 1887, 1835],

/***/ 1984:
[2893, 1985],

/***/ 1985:
/***/ (function(module, exports) {

	
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


/***/ }),

/***/ 1986:
[2899, 1987],

/***/ 1987:
5,

/***/ 1988:
/***/ (function(module, exports) {

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

/***/ }),

/***/ 1989:
/***/ (function(module, exports) {

	module.exports = function(el) {
	
	  var c;
	
	  while (el.childNodes.length) {
	    c = el.childNodes[0];
	    el.removeChild(c);
	  }
	
	  return el;
	};

/***/ }),

/***/ 1990:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1991);

/***/ }),

/***/ 1991:
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var index = __webpack_require__(1992);
	} catch (err) {
	  var index = __webpack_require__(1992);
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


/***/ }),

/***/ 1992:
/***/ (function(module, exports) {

	module.exports = function(arr, obj){
	  if (arr.indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};

/***/ }),

/***/ 1993:
[2894, 1994],

/***/ 1994:
[2895, 1995, 1995, 1997, 1997],

/***/ 1995:
[2896, 1996],

/***/ 1996:
[2897, 1987, 1987],

/***/ 1997:
1004,

/***/ 1998:
[2898, 1999, 2001],

/***/ 1999:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(2000)();
	// imports
	
	
	// module
	exports.push([module.id, ".pfdjs-container .pfdjs-palette {\n  margin: 6px 64px 6px 6px; }\n\n.pfdjs-container .pfdjs-st-container {\n  width: 0;\n  z-index: 2;\n  position: absolute;\n  right: -3px;\n  top: 0;\n  bottom: 0;\n  background: #fafafa;\n  border: solid 1px #cccccc;\n  border-left: solid 2px #cccccc; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs {\n    position: absolute;\n    width: 36px;\n    top: 6px;\n    bottom: 6px;\n    left: -37px; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab {\n      overflow: hidden;\n      height: 40px;\n      margin-bottom: 5px;\n      background: #fafafa;\n      border: solid 1px #cccccc;\n      border-radius: 3px;\n      border-bottom-right-radius: 0;\n      border-top-right-radius: 0;\n      box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.3); }\n      .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab span {\n        font-size: 26px;\n        top: 4.25px;\n        position: relative;\n        cursor: pointer; }\n      .pfdjs-container .pfdjs-st-container .pfdjs-st-tabs .pfdjs-st-tab.active span {\n        color: #ff4800; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content.hidden {\n    display: none !important; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-body {\n    position: absolute;\n    left: 0;\n    top: 20px;\n    right: 0;\n    bottom: 0;\n    overflow-y: auto; }\n  .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title {\n    background-color: #5990bd;\n    color: white;\n    font-size: 12px;\n    line-height: 18px;\n    border: solid 1px #ccc;\n    position: absolute;\n    left: 0;\n    right: 0; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title .content-title-span {\n      vertical-align: top;\n      float: left;\n      margin-left: 6px; }\n    .pfdjs-container .pfdjs-st-container .pfdjs-st-contents .pfdjs-st-content .content-title .icon-cancel {\n      font-size: 18px;\n      cursor: pointer;\n      float: right; }\n  .pfdjs-container .pfdjs-st-container.open {\n    right: 0; }\n    .pfdjs-container .pfdjs-st-container.open .pfdjs-st-tabs .pfdjs-st-tab.active {\n      left: 1px;\n      position: relative;\n      box-shadow: none;\n      border-width: 2px;\n      border-right: 0; }\n    @media (max-width: 800px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 400px;\n        width: 50%; } }\n    @media (max-width: 400px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 100%;\n        width: 100%; } }\n    @media (min-width: 801px) {\n      .pfdjs-container .pfdjs-st-container.open {\n        min-width: 400px;\n        width: 35%; } }\n", ""]);
	
	// exports


/***/ }),

/***/ 2000:
1485,

/***/ 2001:
1486,

/***/ 2002:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var isUndefined = __webpack_require__(1902).isUndefined;
	
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

/***/ 2003:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['searchPanel'],
	  searchPanel: ['type', __webpack_require__(2004)],
	  __depends__: [
	  ]
	};


/***/ }),

/***/ 2004:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var domClear = __webpack_require__(2005),
	  domify = __webpack_require__(2006),
	  domDelegate = __webpack_require__(2008),
	  domAttr = __webpack_require__(2014),
	  List = __webpack_require__(2015)
	  ;
	
	__webpack_require__(2035);
	
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

/***/ 2005:
1989,

/***/ 2006:
[2893, 2007],

/***/ 2007:
1985,

/***/ 2008:
[2894, 2009],

/***/ 2009:
[2895, 2010, 2010, 2013, 2013],

/***/ 2010:
[2896, 2011],

/***/ 2011:
[2897, 2012, 2012],

/***/ 2012:
5,

/***/ 2013:
1004,

/***/ 2014:
1988,

/***/ 2015:
/***/ (function(module, exports, __webpack_require__) {

	var naturalSort = __webpack_require__(2016),
	  getByClass = __webpack_require__(2017),
	  extend = __webpack_require__(2018),
	  indexOf = __webpack_require__(2019),
	  events = __webpack_require__(2020),
	  toString = __webpack_require__(2022),
	  classes = __webpack_require__(2023),
	  getAttribute = __webpack_require__(2024),
	  toArray = __webpack_require__(2021);
	
	module.exports = function(id, options, values) {
	
	  var self = this,
	    init,
	    Item = __webpack_require__(2025)(self),
	    addAsync = __webpack_require__(2026)(self),
	    initPagination = __webpack_require__(2027)(self);
	
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
	
	      self.parse        = __webpack_require__(2028)(self);
	      self.templater    = __webpack_require__(2029)(self);
	      self.search       = __webpack_require__(2030)(self);
	      self.filter       = __webpack_require__(2031)(self);
	      self.sort         = __webpack_require__(2032)(self);
	      self.fuzzySearch  = __webpack_require__(2033)(self, options.fuzzySearch);
	
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

/***/ 2016:
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

/***/ 2017:
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

/***/ 2018:
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

/***/ 2019:
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

/***/ 2020:
/***/ (function(module, exports, __webpack_require__) {

	var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
	    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
	    prefix = bind !== 'addEventListener' ? 'on' : '',
	    toArray = __webpack_require__(2021);
	
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

/***/ 2021:
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

/***/ 2022:
/***/ (function(module, exports) {

	module.exports = function(s) {
	  s = (s === undefined) ? "" : s;
	  s = (s === null) ? "" : s;
	  s = s.toString();
	  return s;
	};


/***/ }),

/***/ 2023:
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var index = __webpack_require__(2019);
	
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

/***/ 2024:
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

/***/ 2025:
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

/***/ 2026:
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

/***/ 2027:
/***/ (function(module, exports, __webpack_require__) {

	var classes = __webpack_require__(2023),
	  events = __webpack_require__(2020),
	  List = __webpack_require__(2015);
	
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

/***/ 2028:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = function(list) {
	
	  var Item = __webpack_require__(2025)(list);
	
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

/***/ 2029:
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

/***/ 2030:
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

/***/ 2031:
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

/***/ 2032:
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

/***/ 2033:
/***/ (function(module, exports, __webpack_require__) {

	
	var classes = __webpack_require__(2023),
	  events = __webpack_require__(2020),
	  extend = __webpack_require__(2018),
	  toString = __webpack_require__(2022),
	  getByClass = __webpack_require__(2017),
	  fuzzy = __webpack_require__(2034);
	
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

/***/ 2034:
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

/***/ 2035:
[2898, 2036, 2038],

/***/ 2036:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(2037)();
	// imports
	
	
	// module
	exports.push([module.id, ".pfdjs-container #pfdjs-searchpanel .search {\n  outline: none;\n  padding: 6px;\n  border: 1px  solid #333;\n  transition: border 0.3s;\n  width: 300px;\n  margin-top: 16px;\n  margin-bottom: 16px; }\n\n.pfdjs-container #pfdjs-searchpanel .list {\n  margin-top: 3px;\n  padding: 0;\n  list-style-type: none; }\n  .pfdjs-container #pfdjs-searchpanel .list li {\n    cursor: pointer;\n    display: block;\n    background-color: #eee;\n    border-left: 4px solid #5990bd;\n    padding: 8px;\n    margin: 2px 20px;\n    text-align: left; }\n    .pfdjs-container #pfdjs-searchpanel .list li h3 {\n      margin: 0;\n      color: #333;\n      font-size: 15px; }\n    .pfdjs-container #pfdjs-searchpanel .list li p {\n      margin: 0;\n      color: #555;\n      font-size: 12px; }\n      .pfdjs-container #pfdjs-searchpanel .list li p .elementType {\n        font-weight: bold; }\n    .pfdjs-container #pfdjs-searchpanel .list li:hover {\n      background-color: #f5f5f5; }\n", ""]);
	
	// exports


/***/ }),

/***/ 2037:
1485,

/***/ 2038:
1486,

/***/ 2878:
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
	  __webpack_require__(1608),
	  __webpack_require__(1610),
	  __webpack_require__(2879),
	  __webpack_require__(1687),
	  __webpack_require__(2003),
	];
	
	InteractiveViewer.prototype._modules = [].concat(
	  InteractiveViewer.prototype._modules,
	  InteractiveViewer.prototype._interactionModules
	);

/***/ }),

/***/ 2879:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = {
	  __init__: ['tooltip'],
	  tooltip: ['type', __webpack_require__(2880)],
	  __depends__: [
	    //
	  ]
	};

/***/ }),

/***/ 2880:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(555),
	  _d3tip = __webpack_require__(2881),
	  _tooltip = null,
	  isFunction = __webpack_require__(945).isFunction
	;
	
	__webpack_require__(2882);
	
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

/***/ 2881:
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// d3.tip
	// Copyright (c) 2013 Justin Palmer
	//
	// Tooltips for d3.js SVG visualizations
	
	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module with d3 as a dependency.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(555)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
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

/***/ 2882:
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(2883);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(1486)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../../../node_modules/css-loader/index.js!../../../node_modules/sass-loader/index.js!./style.scss", function() {
				var newContent = require("!!../../../node_modules/css-loader/index.js!../../../node_modules/sass-loader/index.js!./style.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),

/***/ 2883:
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(1485)();
	// imports
	
	
	// module
	exports.push([module.id, ".d3-tip {\n  line-height: 1;\n  font-weight: bold;\n  padding: 12px;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  border-radius: 2px;\n  pointer-events: none; }\n\n/* Creates a small triangle extender for the tooltip */\n.d3-tip:after {\n  box-sizing: border-box;\n  display: inline;\n  font-size: 10px;\n  width: 100%;\n  line-height: 1;\n  color: rgba(0, 0, 0, 0.8);\n  position: absolute;\n  pointer-events: none; }\n\n/* Northward tooltips */\n.d3-tip.n:after {\n  content: \"\\25BC\";\n  margin: -1px 0 0 0;\n  top: 100%;\n  left: 0;\n  text-align: center; }\n\n/* Eastward tooltips */\n.d3-tip.e:after {\n  content: \"\\25C0\";\n  margin: -4px 0 0 0;\n  top: 50%;\n  left: -8px; }\n\n/* Southward tooltips */\n.d3-tip.s:after {\n  content: \"\\25B2\";\n  margin: 0 0 1px 0;\n  top: -8px;\n  left: 0;\n  text-align: center; }\n\n/* Westward tooltips */\n.d3-tip.w:after {\n  content: \"\\25B6\";\n  margin: -4px 0 0 -1px;\n  top: 50%;\n  left: 100%; }\n", ""]);
	
	// exports


/***/ }),

/***/ 2893:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	module.exports = __webpack_require__(__webpack_module_template_argument_0__);

/***/ }),

/***/ 2894:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	module.exports = __webpack_require__(__webpack_module_template_argument_0__);

/***/ }),

/***/ 2895:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__, __webpack_module_template_argument_1__, __webpack_module_template_argument_2__, __webpack_module_template_argument_3__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var closest = __webpack_require__(__webpack_module_template_argument_0__);
	} catch(err) {
	  var closest = __webpack_require__(__webpack_module_template_argument_1__);
	}
	
	try {
	  var event = __webpack_require__(__webpack_module_template_argument_2__);
	} catch(err) {
	  var event = __webpack_require__(__webpack_module_template_argument_3__);
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


/***/ }),

/***/ 2896:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	var matches = __webpack_require__(__webpack_module_template_argument_0__)
	
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


/***/ }),

/***/ 2897:
/***/ (function(module, exports, __webpack_require__, __webpack_module_template_argument_0__, __webpack_module_template_argument_1__) {

	/**
	 * Module dependencies.
	 */
	
	try {
	  var query = __webpack_require__(__webpack_module_template_argument_0__);
	} catch (err) {
	  var query = __webpack_require__(__webpack_module_template_argument_1__);
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


/***/ }),

/***/ 2898:
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