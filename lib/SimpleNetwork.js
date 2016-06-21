'use strict';

var assign = require('lodash/object').assign,
  isString = require('lodash/lang').isString,
  isUndefined = require('lodash/lang').isUndefined,
  cloneDeep = require('lodash/lang').cloneDeep,
  toSafeInteger = require('lodash/lang').toSafeInteger,
  forIn = require('lodash/object').forIn,
  forEach = require('lodash/collection').forEach,
  keys = require('lodash/object').keys,
  values = require('lodash/object').values,
  noop = require('lodash/util').noop,
  d3js = require('d3'),
  lightBox = require('./utils/lightBox'),
  dblClick = require('./utils/dblClick'),
  domQuery = require('min-dom/lib/query'),
  DEFAULT_OPTIONS = {
    width: '100%',
    height: '100%',
    position: 'relative',
    container: 'body',
    translateX: '0',
    translateY: '0',
    scale: '1',
    nodes: {
      adjacencyList: {
        nodeId: {
          label: ''
        }
      }
    },
    draggable: true,
    bgColor: 'white',
    gridSize: 25,
    gridLinesColor: '#ddd',
    gridLinesWidth: 1,
    showGridLines: true,
    fontColor: '#333',
    groups: {}
  },
  ICONS = require('./utils/icons.js'),
  helper = require('./utils/helper');

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
  this.container.style.backgroundColor = this.options.bgColor;

  this.nodes = cloneDeep(options.nodes);

  this.onNodeClick = function(evt, node){
    var cb = that.options.onNodeClick;
    if (cb !== undefined) {
      var cbPromise = cb.call(undefined, node);
      if (cbPromise !== undefined){
        cbPromise.then(
          function (content) {
            lightBox.open(content);
          },
          noop
        );
      }
    }
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
      .style('stroke-width', this.options.gridLinesWidth + 'px')
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
      .style('stroke-width', this.options.gridLinesWidth + 'px')
      .attr('class', 'gridline');
};

SimpleNetwork.prototype.calculateGroupBoundaries = function(groupNodes, label){
  var that = this,
      xArr = [],
      yArr = [],
      hasLabel = !isUndefined(label);
  forIn(groupNodes, function(n, k){
    var pos = that.nodes[k].position;
    if (isUndefined(pos)){
      pos = {x: 0, y: 0};
    }
    xArr.push(pos.x);
    yArr.push(pos.y);
  });
  var x = d3js.min(xArr) - 32,
      width = d3js.max(xArr) - x + 32,
      y = d3js.min(yArr) - 32 - (hasLabel ? 6 : 0),
      height = d3js.max(yArr) - y + 42;
  return {
    x: x,
    y: y,
    width: width,
    height: height
  };
};

SimpleNetwork.prototype.drawGroups= function(){
  var that = this;
  // get the groups
  var groupsArray = values(this.options.groups);
  // create the groups
  var groups = this.SVG
    .selectAll('.group')
    .data(groupsArray)
    .enter()
    .append('g');
  this.groups = groups
    .append('rect')
      .attr('coords', function(d) {
        d.coords = that.calculateGroupBoundaries(d.nodes, d.label);
        return null;
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
      .attr('class', 'node-groups');

  this.groupsLabels = groups
    .append('text')
      .attr('x', function (d) {
        return d.coords.x + 3;
      })
      .attr('y', function (d) {
        return d.coords.y + 10;
      })
      .style('font-size', '8px')
      .style('font-weight', 'bold')
      .style('fill', function(d){
        return d.color;
      })
      .text(function(d){
        return isUndefined(d.label)?null:d.label;
      });
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
        'width': this.options.width,
        'height': this.options.height,
        'pointer-events': 'all',
        'viewBox': '0 0 ' + this.options.width + ' ' + this.options.height,
        'fill': 'transparent'
      });

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
    .attr('y', -1*this.options.height*2);

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
          var newLink = assign({}, DEFAULT_OPTIONS.nodes.adjacencyList.nodeId, v || {});
          newLink.source= nodeIdx;
          newLink.target= that.levels[targetLevel][nnk].position;
          links.push(newLink);
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
      node.x = node.positionX;
      node.y = node.positionY;
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

    that.linkNotes
      .attr('text-anchor', helper.calculateLinkNoteAnchor)
      .attr('transform', helper.calculateLinkNotePosition);

    // fix the groups
    that.groups
      .attr('coords', function(d) {
        d.coords = that.calculateGroupBoundaries(d.nodes, d.label);
        return null;
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
      });

    that.groupsLabels
      .attr('x', function (d) {
        return d.coords.x + 3;
      })
      .attr('y', function (d) {
        return d.coords.y + 10;
      });

    that.link
      .attr('marker-end', function() {
        // hack for IE10, IE11
        var curr = this.getAttribute('marker-end')+'';
        var hasA = curr.lastIndexOf('A') > -1;
        return hasA?'url(#end)':'url(#endA)';
      })
      .attr('d', helper.calculateLinkPath);

    that.sublink
      .attr('d', helper.calculateLinkPath);
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
      .style('fill', 'white')
      .style('stroke', 'black')
      .attr({
        'id': 'end',
        'viewBox': '-4 -8 15 15',
        'refX': 7,
        'refY': 0,
        'markerWidth': 4,
        'markerHeight': 4,
        'orient': 'auto'
      })
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5Z');

  defs
    .append('marker')    // This section adds in the arrows
      .style('fill', 'white')
      .style('stroke', 'black')
      .attr({
        'id': 'endA',
        'viewBox': '-4 -8 15 15',
        'refX': 7,
        'refY': 0,
        'markerWidth': 4,
        'markerHeight': 4,
        'orient': 'auto'
      })
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5Z');

  // define the icons
  this.defineIcons();

  // draw the groups
  this.drawGroups();

  // create the links paths and marker
  this.linkg = this.SVG
    .append('g')
      .selectAll('.link')
      .data(this.force.links())
      .enter()
    .append('g');

  this.link = this.linkg
    .append('path')
      .attr({
        'class': 'link',
        'marker-end': 'url(#end)'
      });

  this.sublink = this.linkg
    .append('path')
      .attr({
        'class': 'inner-link'
      });

  this.linkNotes = this.linkg
    .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', this.options.fontColor)
      .style('font-weight', 'bold')
      .style('font-size', '7px')
      .text(function(d){
        return d.label;
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
  this.node
    .append('rect')
    .attr({
      'width': 50,
      'height': 50,
      'x': -25,
      'y': -25,
      'rx': 9
    })
    .attr('fill', 'white');

  // append the icon to the nodes
  this.node
    .append('svg')
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
  this.labels = this.node
    .append('text')
      .attr({
        'text-anchor': 'middle',
        'y': 37,
        'fill': this.options.fontColor
      })
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

  // set node double-click listener
  var dblClickListener = dblClick();
  this.node.call(dblClickListener);
  dblClickListener.on('dblclick', this.onNodeClick);

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
