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
  bgColor: "green"
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
          .attr('x', "404.7")
          .attr('y', "260.52")
          .attr('width', "25.3")
          .attr('height', "133.099");
      icon
        .append('rect')
          .attr('y', "260.52")
          .attr('width', "25.3")
          .attr('height', "133.099");
    }
  },
  'transport': {
    viewPort: '0 0 444.045 444.045',
    fn: function(icon){
      icon
        .append('path')
        .attr('d','M422.504,346.229v-68.306h-16.678v-24.856c0-21.863-16.199-39.935-37.254-42.882v-0.798c0-26.702-21.72'+
          '3-48.426-48.426-48.426h-1.609c-26.699,0-48.426,21.724-48.426,48.426v87.633h-23.641v-93.169c0-6.083-3.248-11'+
          '.394-8.096-14.333c5.662-1.667,9.799-6.896,9.799-13.098c0-7.544-6.117-13.661-13.662-13.661h-10.981v-12.727h-'+
          '17v12.727h-10.984c-7.545,0-13.66,6.116-13.66,13.661c0,6.202,4.137,11.431,9.799,13.098c-4.848,2.94-8.098,8.2'+
          '5-8.098,14.333v93.169h-23v-85.596c0-4.458-3.613-8.071-8.07-8.071h-16.412v-87.591c0-16.03-13.041-29.071-29.0'+
          '7-29.071v-1.267c0-23.608-19.139-42.748-42.748-42.748S21.54,61.817,21.54,85.425v260.805H0v55.139h444.045v-55'+
          '.139H422.504z M286.256,209.387c0-17.801,14.48-32.284,32.281-32.284h1.609c17.803,0,32.285,14.483,32.285,32.2'+
          '84v1.559c-19.059,4.545-33.232,21.673-33.232,42.124v24.855h-16.676v19.098h-16.27v-87.635H286.256z M302.525,3'+
          '13.162v33.067h-16.27v-33.067H302.525z M270.113,313.162v33.067h-23.641v-33.067H270.113z M144.447,219.496v85.'+
          '596c0,4.458,3.613,8.071,8.07,8.071h31.07v33.068h-47.482V219.496H144.447z M107.035,102.834c7.129,0,12.93,5.8'+
          ',12.93,12.929v87.591h-12.93V102.834z M107.035,219.496h12.93v126.733h-12.93V219.496z');
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
      that.SVG.attr("transform",
        "translate(" + trans + ")"
        + " scale(" + scale + ")");
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
    .append("g")
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
  d3js.select(this.container).select("svg.d3sn-container").remove();
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
          links.push({
            source: nodeIdx,
            target: that.levels[(levelIdx-1)][nnk].position
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
    var iconObj = that.SVG.select("defs").append("g")
      .attr("id", 'icon_'+iconKey);
    icon.fn.call(this, iconObj);
  });
};

SimpleNetwork.prototype.restart = function(recalculate){
  var that = this;

  var tick = function() {
    // fix elements positions
    that.node
      .attr("transform", function(d) {
        that.nodes[d.nodeId].position = {x: d.x, y: d.y};
        return "translate(" + d.x + "," + d.y + ")";
      });

    that.labels
      .attr("dx", function(){
        return '-'+(this.getBBox().width/2);
      });

    that.link.attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; })
      .attr('d', function(d) {

        if (d.source.x>d.target.x){
          var linePath = "M " + (d.source.x - 27) + "," + d.source.y;
        } else {
          var linePath = "M " + (d.source.x + 27) + "," + d.source.y;
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
  this.SVG.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  // define the icons
  this.defineIcons();

  // create the links paths and marker
  this.link = this.SVG.append("svg:g").selectAll("path")
    .data(this.force.links())
    .enter().append("svg:path")
    .attr("class", "link")
    .attr("marker-end", "url(#end)");

  // create the nodes
  this.node = this.SVG.selectAll('.node')
    .data(this.force.nodes())
    .enter().append("g")
    .attr('class', 'node')
    .attr('node-id', function(d){
      return d.nodeId;
    });

  // add an empty rect to increase the dragging area
  this.node.append('rect')
    .attr("width", 50)
    .attr("height", 50)
    .attr("x", -25)
    .attr("y", -25)
    .attr("fill", this.options.bgColor);

  // append the icon to the nodes
  this.node.append("svg")
    .attr("width", 50)
    .attr("height", 50)
    .attr("x", -25)
    .attr("y", -25)
    .attr("viewBox", function(d) {
      if (!isUndefined(ICONS[d.iconType])) return ICONS[d.iconType].viewPort;
      return ICONS['default'].viewPort;
    })
    .attr("preserveAspectRatio", "xMaxYMax meet")
    .append("use")
    .attr("xlink:href", function(d) {
      if (!isUndefined(ICONS[d.iconType])) return "#icon_"+d.iconType;
      return "#icon_default";
    });

  // append the label to the node
  this.labels = this.node.append("text")
    .attr("y", 37)
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
  this.node.on("click", this.onNodeClick);

  if (this.options.draggable) {
    var drag = d3js.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function (d) {
        d3js.event.sourceEvent.stopPropagation();
        that.force.stop();
        that.mousedown_node = d;
        if (that.mousedown_node == that.selected_node) that.selected_node = null;
        else that.selected_node = that.mousedown_node;
      })
      .on("drag", function(d){
        d.px += d3js.event.dx;
        d.py += d3js.event.dy;
        d.x += d3js.event.dx;
        d.y += d3js.event.dy;
        tick();
      })
      .on("dragend", function () {
        d3js.select(this).classed("mousemove", false);
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
  var canvasBBox = this.SVG[0][0].parentElement.getBBox();
  var settings = {
    translate: canvasTransform.translate,
    scale: canvasTransform.scale[0],
    nodes: this.nodes,
    canvasBox: canvasBBox
  };
  return settings;
};

SimpleNetwork.prototype.init = function(recalculate){
  // init d3 svg
  this.initSVG();
  // process the nodes
  recalculate = !!recalculate;
  this.restart(recalculate);
};

module.exports = SimpleNetwork;
