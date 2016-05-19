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
  d3js = require('d3'),
  domQuery = require('min-dom/lib/query'),
  DEFAULT_OPTIONS = {
    width: '100%',
    height: '100%',
    position: 'relative',
    container: 'body',
    translateX: '0',
    translateY: '0',
    scale: '1',
    nodes: {},
    draggable: true,
    bgColor: 'white',
    gridSize: 25,
    gridLinesColor: '#ddd',
    showGridLines: true
  },
  ICONS = require('./utils/icons.js');

require('./utils/styles.scss');

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

SimpleNetwork.prototype.drawGridLines = function(){
  var that = this;
  // create the grid lines
  var horizontalLines = Math.ceil(this.options.height / this.options.gridSize);
  this.origSVG // horizontal lines
    .selectAll('.hline')
    .data(d3js.range(horizontalLines))
    .enter()
    .append('line')
      .attr('y1', function (d) {
        return d * that.options.gridSize;
      })
      .attr('y2', function (d) {
        return d * that.options.gridSize;
      })
      .attr('x1', function () {
        return 0;
      })
      .attr('x2', function () {
        return that.options.width;
      })
      .style('stroke', this.options.gridLinesColor)
      .attr('class', 'gridline');
  var verticalLines = Math.ceil(this.options.width / this.options.gridSize);
  this.origSVG // vertical lines
    .selectAll('.vline')
    .data(d3js.range(verticalLines))
    .enter()
    .append('line')
      .attr('x1', function (d) {
        return d * that.options.gridSize;
      })
      .attr('x2', function (d) {
        return d * that.options.gridSize;
      })
      .attr('y1', function () {
        return 0;
      })
      .attr('y2', function () {
        return that.options.height;
      })
      .style('stroke', this.options.gridLinesColor)
      .attr('class', 'gridline');
};

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
      .attr({
        'onContextMenu': 'return false;',
        'class': 'd3sn-container',
        'width': '100%',
        'height': '100%',
        'pointer-events': 'all'
      })
      .attr('viewBox', '0 0 ' + this.options.width + ' ' + this.options.height);

  if (this.options.showGridLines){
    this.drawGridLines();
  }

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

    that.link
      .attr('marker-end', function() {
        var curr = this.getAttribute('marker-end')+'';
        var hasA = curr.lastIndexOf('A') > -1;
        return hasA?'url(#end)':'url(#endA)';
      })
      .attr('x1', function(d) { return d.source.x; })
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
  var defs = this.SVG
    .append('defs');

  defs
    .append('marker')    // This section adds in the arrows
      .attr('id', 'end')
      .attr({
        'viewBox': '0 -5 10 10',
        'refX': 10,
        'refY': 0,
        'markerWidth': 6,
        'markerHeight': 6,
        'orient': 'auto'
      })
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

  defs
    .append('marker')    // This section adds in the arrows
      .attr('id', 'endA')
      .attr({
        'viewBox': '0 -5 10 10',
        'refX': 10,
        'refY': 0,
        'markerWidth': 6,
        'markerHeight': 6,
        'orient': 'auto'
      })
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
      .attr({
        'class': 'link',
        'marker-end': 'url(#end)'
      });

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
    .attr({
      'width': 50,
      'height': 50,
      'x': -25,
      'y': -25
    })
    .attr('fill', this.options.bgColor);

  // append the icon to the nodes
  this.node.append('svg')
    .attr({
      'width': 50,
      'height': 50,
      'x': -25,
      'y': -25
    })
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
