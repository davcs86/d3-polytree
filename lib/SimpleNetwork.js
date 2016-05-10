'use strict';

var assign = require('lodash/object').assign,

  isString = require('lodash/lang').isString,
  isUndefined = require('lodash/lang').isUndefined,
  cloneDeep = require('lodash/lang').cloneDeep,
  toSafeInteger = require('lodash/lang').toSafeInteger,
  forIn = require('lodash/object').forIn,
  forEach = require('lodash/collection').forEach,
  keys = require('lodash/object').keys,
  noop = require('lodash/util').noop,

  d3js = require('d3');

var domQuery = require('min-dom/lib/query');

var DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  position: 'relative',
  container: 'body',
  translateX: '0',
  translateY: '0',
  scale: '1',
  nodes: {},
  draggable: true,
  bgColor: 'white'
};

var ICONS = {
  'default': {
    viewPort: '0 0 402 402',
    fn: function(icon){
      return icon
        .append('path')
        .attr('d','M377.87,24.126C361.786,8.042,342.417,0,319.769,0H82.227C59.579,0,40.211,8.042,24.125,24.126'+
          'C8.044,40.212,0.002,59.576,0.002,82.228v237.543c0,22.647,8.042,42.014,24.123,58.101c16.086,'+
          '16.085,35.454,24.127,58.102,24.127h237.542c22.648,0,42.011-8.042,58.102-24.127c16.085-16.087,'+
          '24.126-35.453,24.126-58.101V82.228C401.993,59.58,393.951,40.212,377.87,24.126z M365.448,319.771'+
          'c0,12.559-4.47,23.314-13.415,32.264c-8.945,8.945-19.698,13.411-32.265,13.411H82.227c-12.563,0-'+
          '23.317-4.466-32.264-13.411c-8.945-8.949-13.418-19.705-13.418-32.264V82.228c0-12.562,4.473-23.316,'+
          '13.418-32.264c8.947-8.946,19.701-13.418,32.264-13.418h237.542c12.566,0,23.319,4.473,32.265,13.418'+
          'c8.945,8.947,13.415,19.701,13.415,32.264V319.771L365.448,319.771z');
    }
  },
  'field': {
    viewPort: '0 0 223 223',
    fn: function(icon){
      icon
        .append('path')
        .attr('d','M216.488,142h-45.316l-20.82-122h14.292v18h39.199V0h-39.199v0h-17.705v0h-70.9l0,0H58.333v0H19.134v38'+
          'h39.199V20h14.293L51.804,142H6.488v35h13.167v12.513h11.792v33.464h31.416v-33.464h11.792V177h73.667v12.513h1'+
          '1.791v33.464h31.417v-33.464h11.792V177h13.166V142z M98.408,142l13.08-13.048L124.569,142H98.408z M125.649,11'+
          '4.827l17.6-17.557l7.222,42.318L125.649,114.827zM111.489,100.702L95.173,84.426l16.316-17.798l16.316,17.798L1'+
          '11.489,100.702z M137.882,65.823L125.055,51.83l8.801-9.6L137.882,65.823z M111.489,37.032L95.875,20h31.227L11'+
          '1.489,37.032z M97.922,51.83L85.094,65.824l4.027-23.595L97.922,51.83zM79.727,97.269l17.601,17.558l-24.823,24'+
          '.762L79.727,97.269z');
    }
  },
  'storage': {
    viewPort: '0 0 427.551 427.551',
    fn: function(icon){
      icon
        .append('path')
        .attr('d','M309.215 267.63l-43.49 6.8v17.23l43.49-6.8M309.215 104.94c-16.043.127-30.924.816-43.49 1.922v16.55l'+
          '43.49-6.8v-11.67zM309.215 183.533l-43.49 6.8v17.175l43.49-6.8M309.215 127.43l-43.49 6.8v17.233l43.49-6.8M30'+
          '9.215 155.482l-43.49 6.8v17.23l43.49-6.8M309.215 239.578l-43.49 6.8v17.23l43.49-6.8M309.215 211.585l-43.49 '+
          '6.798v17.175l43.49-6.8M82.3 250.266l-32.013 5.006v12.64L82.3 262.91M82.3 270.872l-32.013 5.005v12.684l32.01'+
          '3-5.005M82.3 171.848c-12.213.608-23.12 1.563-32.014 2.773v10.742l32.014-5.005v-8.51zM82.3 229.617l-32.013 5'+
          '.005v12.642L82.3 242.26M82.3 188.32l-32.013 5.006v12.682l32.013-5.005M82.3 208.97l-32.013 5.004v12.684l32.0'+
          '13-5.005');
      icon
        .append('path')
        .attr('d','M401.93 307.696L402 116.38c0-6.116-36.582-11.112-82.646-11.443v202.76h-10.14V295.68l-43.49 6.8v5.21'+
          '8h-10.14V107.904c-17.577 2.096-28.61 5.118-28.61 8.475 0 .128.082 136.666.117 191.315h-26.276l.072-125.13c0'+
          '-6.332-39.18-11.462-87.514-11.462-8.182 0-16.098.148-23.61.422v136.17H59.97l22.33-3.49V291.52l-32.014 5.005'+
          'v11.17h-7.46V175.782c-10.665 1.9-16.966 4.245-16.966 6.782l.107 125.13H0v23.978h427.55v-23.976h-25.62z');
    }
  },
  'transfer': {
    viewPort: '0 0 430 430',
    fn: function(icon){
      icon
        .append('path')
          .attr('d','M290.819,142.003h-32.65v-40.27h-32.494V77.154c15.978-0.313,31.964-1.315,47.998-3.03c17.703-10.063'+
            ',17.701-17.105,0-27.167c-16.034-1.716-32.021-2.716-47.998-3.029v-7.547h-21.35v7.547c-15.977,0.313-31.964,'+
            '1.313-47.998,3.029c-17.702,10.062-17.702,17.104,0,27.167c16.034,1.715,32.021,2.718,47.998,3.03v24.579h-32'+
            '.494v40.27h-32.65v23.383h151.638V142.003L290.819,142.003z M192.216,122.119h45.567v19.885h-45.567V122.119L'+
            '192.216,122.119z');
      icon
        .append('path')
          .attr('d','M357.962,276.374h-67.535c-10.01-0.209-18.092-8.402-18.092-18.462V231.61c0-10.195,8.291-18.486,18.'+
            '483-18.486v-2.967v-9.021v-14.362H139.181v14.362v9.021v2.967c10.192,0,18.483,8.291,18.483,18.486v26.302c0,'+
            '10.06-8.082,18.253-18.092,18.462H72.037V260.52h-25.3v133.098h25.3v-16.186h285.925v16.186h25.3V260.52h-25.'+
            '3V276.374L357.962,276.374z');
      icon
        .append('rect')
          .attr('x', '404.7')
          .attr('y', '260.52')
          .attr('width', '25.3')
          .attr('height', '133.099');
      icon
        .append('rect')
          .attr('y', '260.52')
          .attr('width', '25.3')
          .attr('height', '133.099');
    }
  },
  'asignacion': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M85.5 86.5H73.18l-3.01-16h5.33v-6h-6.083l-3.388-18h2.47v-5h-16v5h3.24l-3.386 18H45.5v6h6.1l-3.01 1'+
          '6H35.5v17h50v-17zM58.477 47.222l2.65 4.94 2.648-4.94 1.75 10.27-4.4-5.015-4.4 5.016 1.752-10.27zM52.64 85.6'+
          '15l2.504-14.688 3.938 7.342-6.443 7.345zm7.86-11.808l-4.9-8.905 5.29-6.8 5.385 6.584-5.775 8.906v.215zm2.87'+
          '7 4.463l3.94-7.342 2.506 14.688-6.446-7.346z');
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M12.5 93.5h94v10h-94z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76'+
          'z');
      icon
        .append('circle')
        .attr('fill', '#C1272D')
        .attr('cx', '25.167')
        .attr('cy', '21.499')
        .attr('r', '6.5');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('d', 'M36.33 88.016l-.66 6.968');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M25.166 70.5l7-29.333-7-19.667M48.833 30.833L32.167 44.167');
      icon
        .append('circle')
        .attr('fill', '#E6A9AB')
        .attr('cx', '48.833')
        .attr('cy', '30.833')
        .attr('r', '4.167');
      icon
        .append('circle')
        .attr('fill', '#CD5257')
        .attr('cx', '32.167')
        .attr('cy', '44.167')
        .attr('r', '8.167');
      icon
        .append('circle')
        .attr('fill', '#CD5257')
        .attr('cx', '25.5')
        .attr('cy', '72.5')
        .attr('r', '10.5');
    }
  },
  'baterias': {
    viewPort: '11 12 100 100.25',
    fn: function (icon) {
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M95.5 43.5h6v57h-6zm-30.152.834v-.02.02z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#911D22')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M24.5 78h9.15C36.4 78 39 75.25 39 72.5v-22c0-2.75 1.9-4.5 4.65-4.5h36.932C83.332 46 86 47.75 86 50'+
          '.5v33');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#911D22')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M39.5 54h27.906c1.65 0 2.594.85 2.594 2.5v12c0 1.65 1.756 3.5 3.406 3.5H84.5m-36 4h21.67c1.65 0 2' +
          '.83.85 2.83 2.5v6c0 1.65 1.52 3.5 3.17 3.5h8.33');
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M94.5 92.5c0 2.76-2.24 5-5 5h-7c-2.76 0-5-2.24-5-5v-23c0-2.76 2.24-5 5-5h7c2.76 0 5 2.24 5 5v23zM' +
          '63.827 39c-1.78-4.137-5.345-7-9.73-7-4.382 0-8.437 2.863-10.22 7-.695 1.616-1.376 3.42-1.376 5.334V93.5h22' +
          'V44.314c0-1.906.02-3.704-.67-5.314zM34.88 64.5c-.587-5-3.486-8-6.98-8h-2.366c-3.496 0-7.034 2.497-8.034 7.' +
          '042V95.5h17v-31h.38zm70.755-15.764l-13.864.145 3.145 10.62h7.636');
      var lg = icon
        .append('linearGradient')
        .attr('id', 'a')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '59')
        .attr('y1', '94.166')
        .attr('x2', '59')
        .attr('y2', '103.902');
      lg
        .append('stop')
        .attr('offset', '0')
        .attr('stop-color', '#C1272D');
      lg
        .append('stop')
        .attr('offset', '0.146')
        .attr('stop-color', '#BD262C');
      lg
        .append('stop')
        .attr('offset', '0.29')
        .attr('stop-color', '#B12429');
      lg
        .append('stop')
        .attr('offset', '0.434')
        .attr('stop-color', '#9D2025');
      lg
        .append('stop')
        .attr('offset', '0.577')
        .attr('stop-color', '#811A1E');
      lg
        .append('stop')
        .attr('offset', '0.721')
        .attr('stop-color', '#5D1316');
      lg
        .append('stop')
        .attr('offset', '0.862')
        .attr('stop-color', '#320A0C');
      lg
        .append('stop')
        .attr('offset', '1');
      icon
        .append('path')
        .attr('fill', 'url(#a)')
        .attr('d', 'M11.5 93.5h95v10h-95z');
      icon
        .append('path')
        .attr('fill', '#DA7D81')
        .attr('d', 'M11.5 93.5h95v3h-95z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#911D22')
        .attr('stroke-width', '4')
        .attr('stroke-miterlimit', '10')
        .attr('stroke-linecap', 'round')
        .attr('d', 'M41.5 68.5h24m-24 15h24');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76' +
          'z');
    }
  },
  'entrega': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
          .attr('fill', '#CCE9DA')
          .attr('d','M81.5,75.5c0,5.523-4.477,10-10,10h-25c-5.523,0-10-4.477-10-10v-25c0-5.523,4.477-10,10-10h25c5.523'+
          ',0,10,4.477,10,10V75.5z');
      icon
        .append('path')
          .attr('fill', 'none')
          .attr('stroke', '#61C46E')
          .attr('stroke-width', '3')
          .attr('stroke-miterlimit', '10')
          .attr('d','M82,75c0,5.5-4.5,10-10,10H47c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10h25c5.5,0,10,4.5,10,10V75z');
    }
  },
  'mezcla': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr('fill', '#CCFFD9')
        .attr('d','M14.848 107.014c1.082 1.042 4.27 2.486 4.27 2.486H61.5v-94H20.817s-3.626.71-5.01 2.04c-1.44 1.39-3.'+
          '308 4.99-3.308 4.99v81.23s1.387 2.327 2.347 3.254z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#61C46E')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d','M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z');
      icon
        .append('path')
        .attr('fill', '#006837')
        .attr('d','M105.25 61.46l-7.375-7.21.125.25H53.5v15h44v-.583');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#006837')
        .attr('stroke-width', '14')
        .attr('stroke-miterlimit', '10')
        .attr('d','M14.5 41.5h27.833c5.5 0 10.167 4 10.167 9.5v22.834c0 5.5-4.667 9.666-10.167 9.666H14.5');
      icon
        .append('path')
        .attr('opacity', '0.3')
        .attr('fill', '#39B54A')
        .attr('d','M66.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333');
      icon
        .append('path')
        .attr('opacity', '0.5')
        .attr('fill', '#39B54A')
        .attr('d','M77.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333');
      icon
        .append('path')
        .attr('opacity', '0.8')
        .attr('fill', '#39B54A')
        .attr('d','M88.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333');
      icon
        .append('path')
        .attr('fill', '#39B54A')
        .attr('d','M98.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333M18.5 79.25v.25h-4v-.25l5 4.848-5'+
          ' 4.846v.556h3v-.556l5.5-4.846');
      icon
        .append('path')
        .attr('opacity', '0.5')
        .attr('fill', '#39B54A')
        .attr('d','M27.5 79.25v.25h-4v-.25l5 4.848-5 4.846v.556h3v-.556l5.5-4.846');
      icon
        .append('path')
        .attr('opacity', '0.2')
        .attr('fill', '#39B54A')
        .attr('d','M35.5 79.25v.25h-4v-.25l5 4.848-5 4.846v.556h3v-.556l5.5-4.846');
      icon
        .append('circle')
        .attr('fill', '#2B8838')
        .attr('cx', '53.083')
        .attr('cy', '61.916')
        .attr('r', '6.917');
      icon
        .append('path')
        .attr('opacity', '0.2')
        .attr('fill', '#39B54A')
        .attr('d','M43.203 78.307l-3.244.766 6.01 3.69-3.723 5.987.012.055 2.92-.69-.014-.054 3.884-6.025');
      var g = icon
        .append('path')
        .attr('fill', '#39B54A');
      g
        .append('path')
        .attr('d', 'M18.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896');
      g
        .append('path')
        .attr('opacity', '0.5')
        .attr('d','M27.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896');
      g
        .append('path')
        .attr('opacity', '0.2')
        .attr('d','M35.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896M44.203 47l-3.244-.767 6.01-3.688-3.'+
          '723-5.988.012-.055 2.92.69-.014.054 3.884 6.026');
    }
  },
  'transporte': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      var lg = icon
        .append('linearGradient')
        .attr('id', 'a')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '60.5')
        .attr('y1', '87.794')
        .attr('x2', '60.5')
        .attr('y2', '31.496');
      lg
        .append('stop')
        .attr('offset', '0');
      lg
        .append('stop')
        .attr('offset', '0.046')
        .attr('stop-color', '#070202');
      lg
        .append('stop')
        .attr('offset', '0.116')
        .attr('stop-color', '#1C0607');
      lg
        .append('stop')
        .attr('offset', '0.2')
        .attr('stop-color', '#3E0C0E');
      lg
        .append('stop')
        .attr('offset', '0.295')
        .attr('stop-color', '#6D1619');
      lg
        .append('stop')
        .attr('offset', '0.399')
        .attr('stop-color', '#A82227');
      lg
        .append('stop')
        .attr('offset', '0.44')
        .attr('stop-color', '#C1272D');
      lg
        .append('stop')
        .attr('offset', '0.584')
        .attr('stop-color', '#76181C');
      lg
        .append('stop')
        .attr('offset', '0.719')
        .attr('stop-color', '#360B0D');
      lg
        .append('stop')
        .attr('offset', '0.816')
        .attr('stop-color', '#0F0303');
      lg
        .append('stop')
        .attr('offset', '0.867');
      icon
        .append('path')
        .attr('fill', 'url(#a)')
        .attr('d', 'M17.5 53.5h86v22h-86z');
      icon
        .append('path')
        .attr('fill', '#4A1214')
        .attr('d', 'M44.5 50.5h31v2h-31zm0 13h31v2h-31zm0 13h31v2h-31z');
      icon
        .append('path')
        .attr('fill', '#6F1B1E')
        .attr('d', 'M48.5 46.5h7v35h-7zm15 0h8v35h-8z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M72.5 49.5h-2m-22 14h-3m0-3h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M48.5 63h-3m3 4h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M48.5 50.5h-3m0-3h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M48.5 49h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76'+
          'z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M71.5 47.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M74.5 49h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M71.5 60.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M74.5 62h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M71.5 72.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M74.5 73h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M45.5 72.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M48.5 73h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M99.5 50.5h-3');
      icon
        .append('path')
        .attr('fill', '#4A1214')
        .attr('d', 'M96.5 50.5h11v3h-11zm0 13h11v3h-11z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M100.5 63.5h-3m0-3h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M100.5 63h-3m3 4h-3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M97.5 47.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M100.5 49h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#4A1214')
        .attr('d', 'M96.5 75.5h11v3h-11z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M97.5 72.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M100.5 73h-3m3 5h-3');
      icon
        .append('path')
        .attr('fill', '#6F1B1E')
        .attr('d', 'M100.5 46.5h7v35h-7z');
      icon
        .append('path')
        .attr('fill', '#4A1214')
        .attr('d', 'M14.5 75.5h11v3h-11zm0-13h11v3h-11z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M21.5 65.5h3m-3-5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M21.5 66h3m-3-4h3');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M21.5 73.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M21.5 80h3m-3-5h3');
      icon
        .append('path')
        .attr('fill', '#4A1214')
        .attr('d', 'M14.5 50.5h11v3h-11z');
      icon
        .append('path')
        .attr('fill', '#CD5257')
        .attr('d', 'M21.5 48.5h3v8h-3z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M21.5 56h3m-3-5h3');
      icon
        .append('path')
        .attr('fill', '#6F1B1E')
        .attr('d', 'M14.5 47.5h7v35h-7z');
    }
  },
  'compresor': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      var lg = icon
        .append('linearGradient')
        .attr('id', 'a')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '60.')
        .attr('y1', '95.166')
        .attr('x2', '60')
        .attr('y2', '104.902');
      lg
        .append('stop')
        .attr('offset', '0')
        .attr('stop-color', '#C1272D');
      lg
        .append('stop')
        .attr('offset', '0.146')
        .attr('stop-color', '#BD262C');
      lg
        .append('stop')
        .attr('offset', '0.29')
        .attr('stop-color', '#B12429');
      lg
        .append('stop')
        .attr('offset', '0.434')
        .attr('stop-color', '#9D2025');
      lg
        .append('stop')
        .attr('offset', '0.577')
        .attr('stop-color', '#811A1E');
      lg
        .append('stop')
        .attr('offset', '0.721')
        .attr('stop-color', '#5D1316');
      lg
        .append('stop')
        .attr('offset', '0.862')
        .attr('stop-color', '#320A0C');
      lg
        .append('stop')
        .attr('offset', '1');
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M31.5 86.5h3v8h-3zm26-39h48v47h-48z');
      icon
        .append('path')
        .attr('fill', '#C1272D')
        .attr('d', 'M19.758 60.222c-2.964 2.194-5.015 6.53-5.015 11.93 0 5.4 2.05 10.427 5.015 12.622 1.158.857 2.45 1'+
          '.727 3.82 1.727H55.5v-27H23.566c-1.366 0-2.653-.13-3.808.73z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-width', '4')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M66.5 93.5V75.625c0-1.65-1.35-3.125-3-3.125h-52');
      icon
        .append('path')
        .attr('fill', 'url(#a)')
        .attr('d', 'M11.5 94.5h97v10h-97z');
      icon
        .append('path')
        .attr('fill', '#DA7D81')
        .attr('d', 'M11.5 94.5h97v3h-97z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#C1272D')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76'+
          'z');
      icon
        .append('path')
        .attr('fill', '#911D22')
        .attr('d', 'M48.5 58.5h7v29h-7z');
      icon
        .append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        .attr('fill', '#F0CBCD')
        .attr('d', 'M82.604 48c12.53.056 22.402 10.057 22.333 22.625-.067 12.35-10.144 22.198-22.633 22.12-12.268-.076'+
          '-22.16-10.13-22.11-22.47.05-12.37 10.072-22.33 22.41-22.275zm-21.3 22.317c-.045 11.766 9.424 21.28 21.212 2'+
          '1.317 11.784.036 21.24-9.37 21.31-21.193.07-11.75-9.404-21.28-21.194-21.32-11.777-.04-21.282 9.41-21.327 21'+
          '.2z');
      icon
        .append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        .attr('fill', '#E6A9AB')
        .attr('d', 'M73.726 51.835c.736 1.15 1.264 2.354 2.12 3.238 1.99 2.056 2.953 4.514 3.346 7.265.128.893.217 1.7'+
          '9.325 2.688.867-.153.893-.165.788-1.08-.292-2.542-1-4.96-2.394-7.124-.92-1.438-1.95-2.813-2.96-4.262 1.05-1'+
          '.3 2.39-2.157 4.18-2.467-.12 1.584.38 2.93 1.12 4.213 1.38 2.397 1.42 5 1.13 7.646-.09.833-.23 1.66-.36 2.5'+
          '43.67.102.92-.123 1.03-.755.63-3.828-.06-7.45-1.61-10.953-.21-.483-.42-.97-.62-1.45 1.06-1.067 2.97-1.647 4'+
          '.67-1.37-.61 1.63-.22 3.22.14 4.835.51 2.28 0 4.468-.81 6.597-.36.95-.79 1.89-1.2 2.87.63.31.94.08 1.2-.51 '+
          '1.51-3.32 1.83-6.78 1.33-10.35l-.3-2.19c1.56-.74 3.45-.77 4.87-.09-.85 1.26-1.1 2.68-1.1 4.17.01 2.34-.89 4'+
          '.38-2.2 6.26-.69 1-1.46 1.94-2.22 2.94.48.41.82.36 1.27-.17 2.54-3.04 3.68-6.62 4.1-10.48.05-.47.12-.93.18-'+
          '1.45 1.74-.22 3.29.14 4.77 1.16-1.24 1.07-1.81 2.46-2.24 3.95-.7 2.44-2.31 4.24-4.25 5.79-.75.6-1.54 1.17-2'+
          '.3 1.75.32.68.7.58 1.22.21 3.13-2.2 5.14-5.23 6.54-8.72l.65-1.64c1.63.09 3.18.92 4.3 2.33-1.6.71-2.46 2.11-'+
          '3.36 3.51-1.37 2.13-3.46 3.37-5.74 4.33-.79.34-1.6.65-2.4.97.25.67.62.72 1.19.5 3.41-1.29 6.1-3.5 8.27-6.38'+
          'l1.36-1.78c1.53.49 2.91 1.8 3.52 3.37-1.72.29-2.91 1.41-4.13 2.53-1.83 1.65-4.1 2.32-6.48 2.66-.89.12-1.79.'+
          '21-2.69.32.195.88.24.9 1.304.77 3.07-.38 5.85-1.48 8.35-3.3.91-.66 1.8-1.35 2.77-2.08 1.34 1.06 2.19 2.42 2'+
          '.47 3.92-1.32.41-2.65.6-3.74 1.21-2.6 1.46-5.32 1.65-8.17 1.3-.8-.1-1.6-.22-2.4-.33-.02.88-.013.87.73.99 3.'+
          '65.61 7.14.02 10.51-1.44.63-.27 1.26-.53 1.96-.83 1.028 1.39 1.51 2.9 1.32 4.73-1.6-.59-3.11-.3-4.64.07-2.7'+
          '2.66-5.252-.093-7.74-1.11-.66-.27-1.31-.57-1.96-.86-.35.69-.03.97.54 1.23 3.29 1.49 6.73 1.797 10.27 1.323.'+
          '31-.04.62-.087.928-.12 1.57-.187 1.67-.17 1.8 1.42.09 1.06-.07 2.14-.14 3.42-1.62-1.077-3.16-1.23-4.77-1.28'+
          '-2.82-.08-5.11-1.47-7.25-3.15-.513-.4-1.02-.82-1.57-1.26-.46.49-.4.83.117 1.27 3.04 2.53 6.6 3.69 10.47 4.1'+
          '.49.05.97.13 1.48.2.2 1.74-.177 3.27-1.176 4.75-1.12-1.33-2.64-1.85-4.2-2.33-2.43-.74-4.18-2.43-5.71-4.376-'+
          '.552-.71-1.08-1.44-1.68-2.23l-.49.726c2.52 4.11 6.44 6.26 10.82 7.81-.34 1.7-.99 3.13-2.4 4.32-.86-1.904-2.'+
          '643-2.694-4.14-3.832-2.23-1.696-3.31-4.16-4.292-6.68l-.4-1.03c-.7.25-.73.65-.5 1.244 1.17 3.007 2.98 5.53 5'+
          '.53 7.52.88.69 1.75 1.39 2.67 2.11-.68 1.585-1.8 2.747-3.45 3.564-.22-1.61-1.075-2.74-2.11-3.76-1.92-1.89-2'+
          '.665-4.31-3.064-6.877-.147-.92-.24-1.84-.35-2.79-.75.02-.85.42-.79.99.3 2.81 1.13 5.43 2.73 7.77.84 1.24 1.'+
          '72 2.45 2.64 3.75-1.02 1.31-2.39 2.16-4.19 2.49.15-1.67-.43-3.05-1.18-4.39-1.34-2.38-1.33-4.96-1.03-7.57.09'+
          '-.8.22-1.594.348-2.46-.62-.07-.91.076-1.01.69-.57 3.68-.09 7.21 1.46 10.6.287.62.516 1.27.8 1.98-1.36 1.04-'+
          '2.88 1.49-4.69 1.33.55-1.67.29-3.237-.11-4.827-.576-2.277-.04-4.46.75-6.59.37-.99.81-1.956 1.23-2.95-.64-.3'+
          '1-.94-.06-1.21.53-1.52 3.35-1.82 6.84-1.31 10.44.044.31.08.62.12.93.17 1.325.18 1.42-1.13 1.57-1.15.13-2.32'+
          '4.01-3.777 0 1.27-1.876 1.23-3.68 1.37-5.47.14-1.81.89-3.44 1.9-4.927.76-1.13 1.61-2.2 2.45-3.323-.43-.28-.'+
          '75-.44-1.17.08-2.23 2.73-3.567 5.82-3.967 9.33-.1.89-.26 1.78-.39 2.65-1.85.266-3.45-.13-4.72-1.16 1.186-1.'+
          '02 1.756-2.375 2.17-3.84.687-2.41 2.24-4.22 4.16-5.754.8-.64 1.63-1.25 2.53-1.94l-.7-.5c-4.084 2.523-6.27 6'+
          '.413-7.78 10.75-1.7-.11-3.29-.974-4.31-2.34 1.51-.71 2.39-2 3.23-3.36 1.27-2.05 3.19-3.31 5.34-4.27.94-.414'+
          ' 1.9-.77 2.85-1.16-.13-.76-.533-.75-1.13-.524-3.48 1.3-6.18 3.59-8.39 6.52l-1.273 1.7c-1.582-.71-2.754-1.78'+
          '8-3.54-3.44 1.71-.29 2.887-1.32 4.056-2.406 2.25-2.09 5.09-2.66 8.01-2.98.457-.04.91-.11 1.368-.16-.137-1.0'+
          '9-.88-.79-1.44-.724-2.91.35-5.566 1.37-7.96 3.057-1.046.74-2.056 1.52-3.12 2.3-1.33-1.08-2.18-2.43-2.51-4.2'+
          '1 1.67.15 3.05-.44 4.4-1.19 2.38-1.334 4.97-1.32 7.57-1.026.8.09 1.6.223 2.46.35.06-.69-.18-.92-.8-1.02-3.6'+
          '3-.6-7.08-.01-10.43 1.4-.652.278-1.31.56-2.02.87-1.042-1.39-1.5-2.91-1.34-4.73 1.61.58 3.12.3 4.65-.074 2.3'+
          '4-.576 4.59-.087 6.78.74.99.37 1.95.81 2.94 1.224.31-.65.04-.95-.54-1.21-3.32-1.5-6.785-1.82-10.356-1.32-.3'+
          '1.05-.62.09-.93.13-1.47.17-1.56.17-1.7-1.32-.1-1.09.058-2.206.108-3.555 1.71 1.17 3.367 1.23 5.05 1.326 3.1'+
          '3.17 5.54 1.93 7.864 3.82.22.17.433.35.65.53.02.01.057 0 .1 0 .46-.51.28-.85-.22-1.27-3-2.48-6.51-3.62-10.3'+
          '04-4.05-.52-.06-1.04-.13-1.59-.2-.205-1.76.16-3.31 1.18-4.76 1.01 1.184 2.29 1.78 3.7 2.164 2.56.69 4.446 2'+
          '.33 6.05 4.35.6.757 1.17 1.538 1.75 2.305.65-.343.566-.72.197-1.24-2.2-3.125-5.22-5.14-8.72-6.53l-1.63-.65c'+
          '.09-1.62.957-3.226 2.34-4.29.72 1.55 2.06 2.42 3.44 3.293 2.205 1.4 3.466 3.55 4.44 5.89.31.75.596 1.5.926 '+
          '2.34l.71-.49c-1.39-4.6-4.58-7.71-8.37-10.3.42-1.47 1.785-2.93 3.1-3.46zM86.876 70.4c.014-2.335-1.932-4.312-'+
          '4.26-4.327-2.396-.016-4.362 1.938-4.352 4.324.01 2.337 1.97 4.29 4.3 4.288 2.34-.003 4.3-1.95 4.312-4.284z');
      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#611417')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M48.5 66h-33m33 11h-34m34 7h-30m30-14h-34m34 10h-33m33-18h-31');
    }
  }
};

require('./styles.scss');

function SimpleNetwork(options) {
  var that = this;

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

  this.container = parent;

  /**
    * get the nodes
    * nodes: {
    *   nodeId: {
    *     adjacencyList: [],
    *     label: ''
    *     iconType: 'default|field|storage|transfer|transport',
    *     attachedData: {
    *       Data1: [Col1Value, Col2Value]
    *     }
    *   }
    * }
    *
   **/

  this.nodes = cloneDeep(options.nodes);

  this.onNodeClick = function(node){
    var cb = that.options.onNodeClick || noop;
    cb.call(this, node);
  };
  this.destroy();
  this.init(true);
}

SimpleNetwork.prototype.initSVG = function(){
  var that = this;
  this.rescale = function () {
    if (!that.mousedown_node) {
      var trans = d3js.event.translate;
      var scale = d3js.event.scale;
      that.SVG.attr('transform', 'translate(' + trans + ') scale(' + scale + ')');
    }
  };
  this.origSVG = d3js.select(this.container)
    .append('svg')
      .attr('onContextMenu', 'return false;')
      .attr('class', 'd3sn-container')
      .attr('viewBox', '0 0 ' + this.options.width + ' ' + this.options.height)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('pointer-events', 'all');
  
  var zoom = d3js
    .behavior
    .zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', this.rescale);

  this.SVG = this.origSVG
    .append('g')
    .call(zoom)
    .on('dblclick.zoom', null)
    .append('g');

  zoom
    .translate([this.options.translateX, this.options.translateY])
    .scale(this.options.scale);
  zoom.event(this.SVG); // apply zoom

  // white background
  this.SVG.append('rect')
    .attr('width', this.options.width*5)
    .attr('height', this.options.height*5)
    .attr('x', -1*this.options.width*2)
    .attr('y', -1*this.options.height*2)
    .attr('fill', this.options.bgColor);

};

SimpleNetwork.prototype.destroy = function(){
  d3js.select(this.container).select('svg.d3sn-container').remove();
};

SimpleNetwork.prototype.calculateLevels = function() {
  var levels = [{}],
      nodesDict = {},
      found = true,
      level = 0;

  forIn(this.nodes, function(n, k){nodesDict[k]=cloneDeep(n);});

  while(found) {
    found = false;
    /*jshint -W083 */
    var nodesDictLoop = cloneDeep(nodesDict);
    forIn(nodesDictLoop, function (node, nodeKey) {
      if (node.adjacencyList === null || keys(node.adjacencyList).length === 0) {
        found=true;
        levels[level][nodeKey]=node;
        delete nodesDict[nodeKey];
        forIn(nodesDict, function(vk, nk){
          if (nodesDict[nk].adjacencyList !== null && nodesDict[nk].adjacencyList[nodeKey]){
            delete nodesDict[nk].adjacencyList[nodeKey];
          }
        });
      }
    });
    /*jshint +W083 */
    if (found){
      level++;
      levels.push({});
    }
  }
  levels.pop();
  this.levels = levels;
};

SimpleNetwork.prototype.calculateNodes = function() {
  var levelNum = this.levels.length,
      nodeIdx = 0,
      that = this,
      links = [],
      nodes = [],
      totalWidth = toSafeInteger(this.options.width.replace('px','')),
      totalHeight = toSafeInteger(this.options.height.replace('px','')),
      maxItemsPerLevel = 0;

  forEach(this.levels, function(level, levelIdx){
    var levelNodeIds = keys(level);
    maxItemsPerLevel = Math.max(maxItemsPerLevel, levelNodeIds.length);
    forEach(levelNodeIds, function(nk, i){
      // create the nodes
      nodes.push({
        nodeId: nk,
        x: (levelNum-levelIdx)*totalWidth/(levelNum+1),
        y: (i+1)*totalHeight/(levelNodeIds.length+1),
        label: level[nk].label,
        positionX: level[nk].positionX,
        positionY: level[nk].positionY,
        overridePosition: level[nk].overridePosition,
        fixed: true,
        divisor: (levelNodeIds.length+1),
        iconType: level[nk].iconType || 'default'
      });
      that.levels[levelIdx][nk].position = nodeIdx;
      // create the links
      if (that.nodes[nk].adjacencyList){
        forIn(that.nodes[nk].adjacencyList, function(v, nnk){
          // search in the previous levels
          var targetLevel = levelIdx-1;
          for (var i = targetLevel; i >= 0; i--){
            if (!isUndefined(that.levels[i][nnk])){
              targetLevel = i;
              break;
            }
          }
          links.push({
            source: nodeIdx,
            target: that.levels[targetLevel][nnk].position
          });
        });
      }
      nodeIdx++;
    });
  });
  // fix the node distribution
  forEach(nodes, function(node){
    node.y = node.y*node.divisor/(maxItemsPerLevel+1);
  });
  // fix with the settings
  forEach(nodes, function(node){
    if (node.overridePosition){
      node.x = node.positionX;//*totalWidth;
      node.y = node.positionY;//*totalHeight;
    }
  });
  this._nodes = nodes;
  this._links = links;
};

SimpleNetwork.prototype.setAttachedData= function() {
  var that = this;
  forIn(this._nodes, function(node){
    node.attachedData = that.nodes[node.nodeId].attachedData || {};
  });
};

SimpleNetwork.prototype.defineIcons = function(){
  // create the icons definitions
  var that = this;
  forIn(ICONS, function(icon, iconKey){
    var iconObj = that.SVG.select('defs').append('g')
      .attr('id', 'icon_'+iconKey);
    icon.fn.call(this, iconObj);
  });
};

SimpleNetwork.prototype.restart = function(recalculate){
  var that = this;

  var tick = function() {
    // fix elements positions
    that.node
      .attr('transform', function(d) {
        that.nodes[d.nodeId].position = {x: d.x, y: d.y};
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    that.labels
      .attr('dx', function(){
        var offset;
        try {
          offset = (this.getBBox().width/2);
        } catch(ex){
          offset = 0;
        }
        return '-'+offset;
      });

    that.link.attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; })
      .attr('d', function(d) {
        var linePath = '';
        if (d.source.x>d.target.x){
          linePath = 'M ' + (d.source.x - 27) + ',' + d.source.y;
        } else {
          linePath = 'M ' + (d.source.x + 27) + ',' + d.source.y;
        }
        if (d.target.y == d.source.y){
          // straight line
          if (d.source.x>d.target.x){
            linePath += 'L'+(d.target.x + 27)+','+d.target.y;
          } else {
            linePath += 'L'+(d.target.x - 27)+','+d.target.y;
          }
        } else if (Math.abs(d.target.y - d.source.y) < 50){
          // angular line (forward)
          linePath += 'L'+(d.source.x + ((d.target.x - d.source.x)/2))+','+d.source.y;
          linePath += 'L'+(d.source.x + ((d.target.x - d.source.x)/2))+','+d.target.y;
          if (d.source.x>d.target.x){
            linePath += 'L'+(d.target.x + 27)+','+d.target.y;
          } else {
            linePath += 'L'+(d.target.x - 27)+','+d.target.y;
          }
        } else {
          // angular line
          linePath += 'L'+d.target.x+','+d.source.y;
          if (d.source.y<d.target.y) {
            linePath += 'L' + d.target.x + ',' + (d.target.y - 27);
          } else {
            linePath += 'L' + d.target.x + ',' + (d.target.y + 42);
          }
        }
        return linePath;
      });
  };

  if (recalculate) {
    this.calculateLevels();
    // create the nodes (with their coordinates)
    this.calculateNodes();
  }
  // set node's attached data
  this.setAttachedData();
  // set the force
  this.force = d3js.layout.force()
    .size([this.options.width.replace('px',''), this.options.height.replace('px','')])
    .nodes(this._nodes)
    .links(this._links);

  // build the arrow.
  this.SVG
    .append('defs')
      .selectAll('marker')
      .data(['end'])      // Different link/path types can be defined here
      .enter()
    .append('svg:marker')    // This section adds in the arrows
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

  // define the icons
  this.defineIcons();

  // create the links paths and marker
  this.link = this.SVG
    .append('g')
      .selectAll('path')
      .data(this.force.links())
      .enter()
    .append('path')
      .attr('class', 'link')
      .attr('marker-end', 'url(#end)');

  // create the nodes
  this.node = this.SVG
    .selectAll('.node')
    .data(this.force.nodes())
    .enter()
    .append('g')
      .attr('class', 'node')
      .attr('node-id', function(d){
        return d.nodeId;
      });

  // add an empty rect to increase the dragging area
  this.node.append('rect')
    .attr('width', 50)
    .attr('height', 50)
    .attr('x', -25)
    .attr('y', -25)
    .attr('fill', this.options.bgColor);

  // append the icon to the nodes
  this.node.append('svg')
    .attr('width', 50)
    .attr('height', 50)
    .attr('x', -25)
    .attr('y', -25)
    .attr('viewBox', function(d) {
      if (!isUndefined(ICONS[d.iconType])) return ICONS[d.iconType].viewPort;
      return ICONS['default'].viewPort;
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
      .attr('xlink:href', function(d) {
        if (!isUndefined(ICONS[d.iconType])) return '#icon_'+d.iconType;
        return '#icon_default';
      });

  // append the label to the node
  this.labels = this.node.append('text')
    .attr('y', 37)
    .text(function(d) {
      return d.label;
    });

  // append the attached data table
  this.node.append('foreignObject')
    .attr({
      'x': 8,
      'y': 42,
      'width': 120
    }).append('xhtml:div')
    .html(function (d) {
      var attachedData = d.attachedData || {},
          table = '<table class="table table-striped table-condensed table-bordered">';
      table += '<thead><tr>';
      forEach(that.options.tableHeaders, function(v){
        table += '<th>'+v+'</th>';
      });
      table += '</tr></thead>';
      table += '<tbody>';
      forIn(attachedData, function(v,k){
        table += '<tr><td>'+k+':</td>';
          forEach(v, function (vv){
            table += '<td class="text-right">'+vv+'</td>';
          });
        table += '</tr>';
      });
      table += '</tbody>';
      return table+'</table>';
    });

  // set node click listener
  this.node.on('click', this.onNodeClick);

  if (this.options.draggable) {
    var drag = d3js.behavior.drag()
      .origin(function(d) { return d; })
      .on('dragstart', function (d) {
        d3js.event.sourceEvent.stopPropagation();
        that.force.stop();
        that.mousedown_node = d;
        if (that.mousedown_node == that.selected_node) that.selected_node = null;
        else that.selected_node = that.mousedown_node;
      })
      .on('drag', function(d){
        d.px += d3js.event.dx;
        d.py += d3js.event.dy;
        d.x += d3js.event.dx;
        d.y += d3js.event.dy;
        tick();
      })
      .on('dragend', function () {
        d3js.select(this).classed('mousemove', false);
        that.selected_node = null;
        that.mousedown_node = null;
        tick();
        that.force.resume();
      });
    // set the node dragging
    this.node.call(drag);
  }

  this.force.on('tick', tick);
  this.force.start();
};

SimpleNetwork.prototype.getNodesPosition = function(){
  var canvasTransform = d3js.transform(this.SVG.attr('transform'));
  return {
    translate: canvasTransform.translate,
    scale: canvasTransform.scale[0],
    nodes: this.nodes
  };
};

SimpleNetwork.prototype.init = function(recalculate){
  // init d3 svg
  this.initSVG();
  // process the nodes
  recalculate = !!recalculate;
  this.restart(recalculate);
};

module.exports = SimpleNetwork;
