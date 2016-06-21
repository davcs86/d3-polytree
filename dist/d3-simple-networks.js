/*!
 * d3-simple-networks - d3-simple-networks v1.0.0

 * Copyright 2016 David Castillo
 *
 * Released under the MIT license
 * https://github.com/davcs86/d3-simple-networks/blob/master/LICENSE
 *
 * Source Code: https://github.com/davcs86/d3-simple-networks
 *
 * Date: 2016-06-21
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D3SimpleNetwork = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(284).assign,
  isString = _dereq_(274).isString,
  isUndefined = _dereq_(274).isUndefined,
  cloneDeep = _dereq_(274).cloneDeep,
  toSafeInteger = _dereq_(274).toSafeInteger,
  forIn = _dereq_(284).forIn,
  forEach = _dereq_(192).forEach,
  keys = _dereq_(284).keys,
  values = _dereq_(284).values,
  //noop = require('lodash/util').noop,
  d3js = _dereq_(13),
  lightBox = _dereq_(5),
  dblClick = _dereq_(2),
  domQuery = _dereq_(322),
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
    showGridLines: true,
    groups: {}
  },
  ICONS = _dereq_(4),
  helper = _dereq_(3);

_dereq_(6);

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
          function (){
            console.log('promise rejected');
          });
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
      .attr('text-anchor', 'middle')
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

},{"13":13,"192":192,"2":2,"274":274,"284":284,"3":3,"322":322,"4":4,"5":5,"6":6}],2:[function(_dereq_,module,exports){
'use strict';

// based on http://bl.ocks.org/couchand/6394506

var d3js = _dereq_(13);

function dblClick() {
  var event = d3js.dispatch('click', 'dblclick');
  function cc(selection) {
    var down,
      tolerance = 5,
      last,
      wait = null;
    // euclidean distance
    function dist(a, b) {
      return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
    }
    selection.on('mousedown', function() {
      down = d3js.mouse(document.body);
      last = +new Date();
    });
    selection.on('mouseup', function() {
      var data = this.__data__;
      if (dist(down, d3js.mouse(document.body)) <= tolerance) {
        if (wait) {
          window.clearTimeout(wait);
          wait = null;
          event.dblclick(d3js.event, data);
        } else {
          wait = window.setTimeout((function (e, d) {
            return function () {
              event.click(e, d);
              wait = null;
            };
          })(d3js.event, data), 300);
        }
      }
    });
  }
  return d3js.rebind(cc, event, 'on');
}

module.exports = dblClick;
},{"13":13}],3:[function(_dereq_,module,exports){
'use strict';

var d3js = _dereq_(13);

function D3SNHelpers(){
}

D3SNHelpers.prototype.calculateLinkNoteAnchor = function(d) {
  var anchor = 'middle',
      xDiffAbs = Math.abs(d.target.x - d.source.x);
  if (xDiffAbs <= 57) {
    anchor = 'start';
  }
  return anchor;
};

D3SNHelpers.prototype.calculateLinkNotePosition = function(d) {
  var position = 'translate(',
      x = 0,
      y = 0,
      yDiff = d.target.y - d.source.y,
      yDiffAbs = Math.abs(yDiff),
      xDiff = d.target.x - d.source.x,
      xDiffAbs = Math.abs(xDiff);
  if (xDiffAbs > 57) {
    x = (d.source.x + ((d.target.x - d.source.x) / 2));
    if (yDiffAbs > 57) {
      x += (xDiff > 0) ? 27 : -27;
    }
    if (yDiff < 0 && yDiffAbs > 57) {
      y = d.source.y + 9.5;
    } else {
      y = d3js.min([d.source.y, d.target.y]) - 4;
    }
  } else {
    y = (d.source.y + ((d.target.y - d.source.y) / 2));
    x = (xDiff > 0) ? d.source.x + 6 : d.target.x + 6;
    if (yDiff < 0){
      y += (xDiff > 0) ? 10 : -6;
    } else {
      y += (xDiff > 0) ? -6 : 10;
    }
  }
  position += x + ',' + y + ')';
  return position;
};

D3SNHelpers.prototype.calculateLinkPath = function(d){
  var linePath = '',
    midPoint, endX, endY;
  if (Math.abs(d.target.x - d.source.x) < 57){
    if (d.source.y < d.target.y){
      linePath = 'M ' + d.source.x + ',' + (d.source.y + 44);
    } else {
      linePath = 'M ' + d.source.x + ',' + (d.source.y - 29);
    }
  }
  else if (d.source.x > d.target.x){
    linePath = 'M ' + (d.source.x - 29) + ',' + d.source.y;
  } else {
    linePath = 'M ' + (d.source.x + 29) + ',' + d.source.y;
  }
  if (d.target.y == d.source.y){
    // straight line
    if (d.source.x > d.target.x){
      linePath += 'L' + (d.target.x + 29) + ',' + d.target.y;
    } else {
      linePath += 'L' + (d.target.x - 29) + ',' + d.target.y;
    }
  } else if (Math.abs(d.target.y - d.source.y) < 57){
    // angular line (horizontal)
    midPoint = (d.source.x + ((d.target.x - d.source.x) / 2));
    endX = midPoint;
    endY = midPoint;
    if (d.source.x > d.target.x){
      endX += 10;
      if (endX > (d.source.x - 29)){ endX = (d.source.x - 29); }
      endY -= 10;
      if (endY < (d.target.x - 29)){ endY = (d.target.x - 29); }
    } else {
      endX -= 10;
      if (endX < (d.source.x + 29)){ endX = (d.source.x + 29); }
      endY += 10;
      if (endY > (d.target.x + 29)){ endY = (d.target.x + 29); }
    }
    linePath += 'L' + endX + ',' + d.source.y;
    linePath += 'Q' + midPoint + ' ' + d.source.y;
    linePath += ' ' + midPoint;
    linePath += ' ' + (d.source.y + ((d.target.y - d.source.y) / 2));

    linePath += 'Q' + midPoint + ' ' + d.target.y;
    linePath += ' ' + endY;
    linePath += ' ' + d.target.y;

    if (d.source.x > d.target.x){
      linePath += 'L' + (d.target.x + 29) + ',' + d.target.y;
    } else {
      linePath += 'L' + (d.target.x - 29) + ',' + d.target.y;
    }
  } else if (Math.abs(d.target.x - d.source.x) < 57){
    // angular line (vertical)
    midPoint = (d.source.y + ((d.target.y - d.source.y) / 2));
    endX = midPoint;
    endY = midPoint;
    if (d.source.y > d.target.y){
      endX += 10;
      if (endX > (d.source.y - 29)){ endX = (d.source.y - 29); }
      endY -= 10;
      if (endY < (d.target.y - 29)){ endY = (d.target.y - 29); }
    } else {
      endX -= 10;
      if (endX < (d.source.y + 29)){ endX = (d.source.y + 29); }
      endY += 10;
      if (endY > (d.target.y + 29)){ endY = (d.target.y + 29); }
    }

    linePath += 'L' + d.source.x + ',' + endX;
    linePath += 'Q' + d.source.x + ' ' + midPoint;
    linePath += ' ' + (d.source.x + ((d.target.x - d.source.x) / 2));
    linePath += ' ' + midPoint;
    //
    linePath += 'Q' + d.target.x + ' ' + midPoint;
    linePath += ' ' + d.target.x;
    linePath += ' ' + endY;

    if (d.source.y < d.target.y){
      linePath += 'L' + d.target.x + ',' + (d.target.y - 29);
    } else {
      linePath += 'L' + d.target.x + ',' + (d.target.y + 44);
    }
  } else {
    // angular line
    endX = d.target.x;
    endY = d.source.y;
    if (d.source.x > d.target.x){
      endX += 10;
      if (endX > (d.source.x - 29)){ endX = (d.source.x - 29); }
    } else {
      endX -= 10;
      if (endX < (d.source.x + 29)){ endX = (d.source.x + 29); }
    }
    linePath += 'L' + endX + ',' + d.source.y;
    linePath += 'Q' + d.target.x + ' ' + d.source.y;
    if (d.source.y < d.target.y) {
      endY += 10;
      if (endY > (d.target.y - 29)){ endY = (d.target.y - 29); }
      linePath += ' ' + d.target.x + ' ' + endY;
      linePath += 'L' + d.target.x + ',' + (d.target.y - 29);
    } else {
      endY -= 10;
      if (endY < (d.target.y + 44)){ endY = (d.target.y + 44); }
      linePath += ' ' + d.target.x + ' ' + endY;
      linePath += 'L' + d.target.x + ',' + (d.target.y + 44);
    }
  }
  return linePath;
};

module.exports = new D3SNHelpers();
},{"13":13}],4:[function(_dereq_,module,exports){
'use strict';

module.exports = {
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
  'asignacion': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M85.5 86.5H73.18l-3.01-16h5.33v-6h-6.083l-3.388-18h2.47v-5h-16v5h3.24l-3.386 18H45.5v6h6.1l-3.01 16H35'+
          '.5v17h50v-17zM58.477 47.222l2.65 4.94 2.648-4.94 1.75 10.27-4.4-5.015-4.4 5.016 1.752-10.27zM52.64 85.'+
          '615l2.504-14.688 3.938 7.342-6.443 7.345zm7.86-11.808l-4.9-8.905 5.29-6.8 5.385 6.584-5.775 8.906v.215'+
          'zm2.877 4.463l3.94-7.342 2.506 14.688-6.446-7.346z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M12.5 93.5h94v10h-94z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z'
        });
      icon
        .append('circle')
        .attr({
          'fill': '#C1272D',
          'cx': '25.167',
          'cy': '21.499',
          'r': '6.5'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'd': 'M36.33 88.016l-.66 6.968'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M25.166 70.5l7-29.333-7-19.667M48.833 30.833L32.167 44.167'
        });
      icon
        .append('circle')
        .attr({
          'fill': '#E6A9AB',
          'cx': '48.833',
          'cy': '30.833',
          'r': '4.167'
        });
      icon
        .append('circle')
        .attr({
          'fill': '#CD5257',
          'cx': '32.167',
          'cy': '44.167',
          'r': '8.167'
        });
      icon
        .append('circle')
        .attr({
          'fill': '#CD5257',
          'cx': '25.5',
          'cy': '72.5',
          'r': '10.5'
        });
    }
  },
  'baterias': {
    viewPort: '11 12 100 100.25',
    fn: function (icon) {
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M95.5 43.5h6v57h-6zm-30.152.834v-.02.02z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#911D22',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M24.5 78h9.15C36.4 78 39 75.25 39 72.5v-22c0-2.75 1.9-4.5 4.65-4.5h36.932C83.332 46 86 47.75 86 50.5v33'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#911D22',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M39.5 54h27.906c1.65 0 2.594.85 2.594 2.5v12c0 1.65 1.756 3.5 3.406 3.5H84.5m-36 4h21.67c1.65 0 2.83.' +
          '85 2.83 2.5v6c0 1.65 1.52 3.5 3.17 3.5h8.33'
        });
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M94.5 92.5c0 2.76-2.24 5-5 5h-7c-2.76 0-5-2.24-5-5v-23c0-2.76 2.24-5 5-5h7c2.76 0 5 2.24 5 5v23zM63.8' +
          '27 39c-1.78-4.137-5.345-7-9.73-7-4.382 0-8.437 2.863-10.22 7-.695 1.616-1.376 3.42-1.376 5.334V93.5h2' +
          '2V44.314c0-1.906.02-3.704-.67-5.314zM34.88 64.5c-.587-5-3.486-8-6.98-8h-2.366c-3.496 0-7.034 2.497-8.' +
          '034 7.042V95.5h17v-31h.38zm70.755-15.764l-13.864.145 3.145 10.62h7.636'
        })
        .attr();
      var lg = icon
        .append('linearGradient')
        .attr({
          'id': 'a',
          'gradientUnits': 'userSpaceOnUse',
          'x1': '59',
          'y1': '94.166',
          'x2': '59',
          'y2': '103.902'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0',
          'stop-color': '#C1272D'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.146',
          'stop-color': '#BD262C'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.29',
          'stop-color': '#B12429'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.434',
          'stop-color': '#9D2025'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.577',
          'stop-color': '#811A1E'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.721',
          'stop-color': '#5D1316'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.862',
          'stop-color': '#320A0C'
        });
      lg
        .append('stop')
        .attr('offset', '1');
      icon
        .append('path')
        .attr({
          'fill': 'url(#a)',
          'd': 'M11.5 93.5h95v10h-95z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#DA7D81',
          'd': 'M11.5 93.5h95v3h-95z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#911D22',
          'stroke-width': '4',
          'stroke-miterlimit': '10',
          'stroke-linecap': 'round',
          'd': 'M41.5 68.5h24m-24 15h24'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z'
        });
    }
  },
  'entrega': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr({
          'fill': '#CCE9DA',
          'd': 'M81.5,75.5c0,5.523-4.477,10-10,10h-25c-5.523,0-10-4.477-10-10v-25c0-5.523,4.477-10,10-10h25c5.523,0,'+
          '10,4.477,10,10V75.5z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#61C46E',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M82,75c0,5.5-4.5,10-10,10H47c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10h25c5.5,0,10,4.5,10,10V75z'
        });
    }
  },
  'entrega-cpg': {
    viewPort: '0 0 100 100.25',
    fn: function (icon) {
      icon
        .append('path')
        .attr('fill', '#FFF')
        .attr('d', 'M99.5 87.625c0 5.522-4.478 10-10 10h-76c-5.523 0-10-4.478-10-10v-76c0-5.523 4.477-10 10-10h76c5.52'+
          '2 0 10 4.477 10 10v76z');

      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#61C46E')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M100 88.125c0 5.522-4.478 10-10 10H14c-5.523 0-10-4.478-10-10v-76c0-5.523 4.477-10 10-10h76c5.522'+
          ' 0 10 4.477 10 10v76z');

      icon
        .append('path')
        .attr('fill', '#006837')
        .attr('d', 'M58.5 69.625h17v9h-17zM77.5 70.625h13v8h-13z');

      icon
        .append('path')
        .attr('fill', '#2B8838')
        .attr('d', 'M19.5 68.032l-2-.032v-6.56c0-.635.253-1.815-.547-1.815H4.5v-2h12.453c2.328 1 2.547 1.75 2.547 3.65'+
          '6v6.752z');

      icon
        .append('path')
        .attr('fill', '#39B54A')
        .attr('d', 'M89.5 41.625v-1h-2v-5.287c0-.703.227-1.37-.03-1.966-.655-1.534-1.858-2.594-3.472-2.594s-3.22 1.06-'+
          '3.877 2.594c-.254.597-.62 1.266-.62 1.974V69.625h8v-7h2v-2h-2v-5h2v-1h-2v-6h2v-1h-2v-6h2z');

      icon
        .append('path')
        .attr('fill', '#39B54A')
        .attr('d', 'M81.303 25.625H72.5v-5.643c0-1.003.054-1.95-.3-2.798-.902-2.18-2.692-3.687-4.917-3.687-2.227 0-4.7'+
          '3 1.508-5.636 3.687-.354.85-1.147 1.8-1.147 2.808V48.64c2 2.34 2.303 5.064 2.303 7.986S62.5 62.27 60.5 64.6'+
          '1v3.015h12v-5h4v-3h-4v-4h4v-2h-4v-5h4v-2h-4v-5h4v-3h-4v-5h4v-2h-4v-4h8.803c.68 0 .197 1.077.197 1.713v.837c'+
          '1-.344 1.123-.55 1.824-.55.11 0 .176.018.176.027v-.314c0-1.905-.16-3.713-2.197-3.713z');

      icon
        .append('path')
        .attr('fill', '#2B8838')
        .attr('d', 'M64.07 7.625H52.743c-2.223 0-4.242 2.635-4.242 4.857v13.824c0 2.252 1.805 4.032 3.977 4.055l2.727.'+
          '027c.283.002.297.458.297.598v12.02c1 .717 2 1.593 3 2.602V30.985c0-2.328-1.278-4.032-3.437-4.054l-2.926-.02'+
          '6c-.354-.003-.637-.378-.637-.598V12.482c0-.313 1.28-1.857 1.594-1.857h10.78c.38 0 .626 1.616.626 1.857v1.54'+
          '4c0-.43 1.427-.68 2.317-.68.312 0 .683.035.683.093v-.958c0-2.186-1.14-4.857-3.43-4.857z');

      icon
        .append('path')
        .attr('fill', '#006837')
        .attr('d', 'M50.5 78.625h3V72.98c-1 .34-2 .63-3 .864v4.78z');

      icon
        .append('path')
        .attr('fill', '#2B8838')
        .attr('d', 'M61.504 57.626c0-8.21-7.004-14.926-15.004-15.56v-2.44h1v-1h-6v1h1v2.53c-8 1.016-13.813 7.062-13.81'+
          '3 14.984 0 1.74.61 3.484 1.156 4.484H43.1s.147.498.267.498c3.08 0 5.578 3.076 5.578 6.572 0 1.582-.53 3.146'+
          '-1.377 4.257 7.883-1.083 13.936-7.455 13.936-15.324z');

      icon
        .append('path')
        .attr('fill', '#006837')
        .attr('d', 'M41.798 63.625c-.114 0 0 0 0 0H27.5v-1h1v-2h-5v2h1v1H12.997h.09c-2.303 0-5.127 3.027-5.127 6.053 0'+
          ' 3.03 2.733 5.947 5.037 5.947h.503v3h3v-3h21v3h3V75.38c0 .007.707.037.822.037 1.625 0 3.36-.77 4.347-1.98.8'+
          '13-1 1.495-2.437 1.495-3.865 0-3.15-2.4-5.95-5.367-5.95z');

      var lg = icon
        .append('linearGradient')
        .attr({
          'id': 'a',
          'gradientUnits': 'userSpaceOnUse',
          'x1': '51',
          'y1': '81.225',
          'x2': '51',
          'y2': '89.987'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0',
          'stop-color': '#39B54A'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.151',
          'stop-color': '#38B148'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.3',
          'stop-color': '#34A544'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.448',
          'stop-color': '#2E913B'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.596',
          'stop-color': '#257530'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.744',
          'stop-color': '#1A5221'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.889',
          'stop-color': '#0C2610'
        });
      lg
        .append('stop')
        .attr({
          'offset': '1'
        });

      lg = icon
        .append('linearGradient')
        .attr({
          'id': 'b',
          'gradientUnits': 'userSpaceOnUse',
          'x1': '51',
          'y1': '82.892',
          'x2': '51',
          'y2': '101.389'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0',
          'stop-color': '#39B54A'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.151',
          'stop-color': '#38B148'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.3',
          'stop-color': '#34A544'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.448',
          'stop-color': '#2E913B'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.596',
          'stop-color': '#257530'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.744',
          'stop-color': '#1A5221'
        });
      lg
        .append('stop')
        .attr({
          'offset': '.889',
          'stop-color': '#0C2610'
        });
      lg
        .append('stop')
        .attr({
          'offset': '1'
        });

      icon
        .append('path')
        .attr('fill', 'url(#a)')
        .attr('d', 'M4.5 80.625h93v9h-93z');

      icon
        .append('path')
        .attr('fill', 'url(#b)')
        .attr('d', 'M13.5 97.625h76c4.687 0 8-3.438 8-8.125v-7.875h-93V89.5c0 4.687 4.313 8.125 9 8.125z');

      icon
        .append('path')
        .attr('fill', '#88D392')
        .attr('d', 'M4.5 80.625h93v3h-93z');
    }
  },
  'mezcla': {
    viewPort: '0 0 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr('fill', '#FFF')
        .attr('d', 'M98.5 87.625c0 5.522-4.478 10-10 10h-76c-5.523 0-10-4.478-10-10v-76c0-5.523 4.477-10 10-10h76c5.52'+
          '2 0 10 4.477 10 10v76z');

      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#61C46E')
        .attr('stroke-width', '3')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M99 88.125c0 5.522-4.478 10-10 10H13c-5.523 0-10-4.478-10-10v-76c0-5.523 4.477-10 10-10h76c5.522 0'+
          ' 10 4.477 10 10v76z');

      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#006837')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M37.877 37.5l10.623.666 8.875 4.795M38.295 43.295L49 37.96M66.877 17.877l7.623 8.79 5.834-13.04M87'+
          '.877 34.877L75.125 27.5');

      icon
        .append('path')
        .attr('fill', '#1D5B25')
        .attr('d', 'M97.5 65.625v-16h-95v16h31.61l-19.518 32h18.742l19.52-32');

      icon
        .append('path')
        .attr('fill', '#2B8838')
        .attr('d', 'M24.5 49.625c0-1.104-.896-2-2-2h-3c-1.104 0-2 .896-2 2v16c0 1.104.896 2 2 2h3c1.104 0 2-.896 2-2v-'+
          '16zM69.5 49.625c0-1.104-.896-2-2-2h-3c-1.104 0-2 .896-2 2v16c0 1.104.896 2 2 2h3c1.104 0 2-.896 2-2v-16zM39'+
          '.755 87.735c.963.53 2.186.178 2.717-.786l1.237-2.245c.53-.964.177-2.187-.787-2.718L28.91 74.264c-.963-.53-2'+
          '.186-.178-2.717.786l-1.237 2.244c-.53.964-.178 2.187.786 2.718l14.013 7.723z');

      icon
        .append('path')
        .attr('fill', '#88D392')
        .attr('d', 'M24 48.625l.03 18h9.345l-4.345 7.518 14.027 7.636 9.193-15.155h9.625l.125-18');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '79.961')
        .attr('cy', '13.961')
        .attr('r', '3.295');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '66.877')
        .attr('cy', '17.877')
        .attr('r', '2.211');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '87.877')
        .attr('cy', '34.877')
        .attr('r', '2.211');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '38.295')
        .attr('cy', '43.295')
        .attr('r', '2.629');

      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#009245')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M15.96 9.96L23.5 22.5l8.794-8.872M14.294 27.628l9.206-5.46');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '15.961')
        .attr('cy', '9.96')
        .attr('r', '3.295');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '32.294')
        .attr('cy', '13.628')
        .attr('r', '1.962');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '14.294')
        .attr('cy', '28.628')
        .attr('r', '1.962');

      icon
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#006837')
        .attr('stroke-miterlimit', '10')
        .attr('d', 'M23.5 22.5l25 15.666 26-10.666');

      icon
        .append('circle')
        .attr('fill', '#1D5B25')
        .attr('cx', '48.5')
        .attr('cy', '37.5')
        .attr('r', '5.833');

      icon
        .append('circle')
        .attr('fill', '#1D5B25')
        .attr('cx', '74.5')
        .attr('cy', '27.5')
        .attr('r', '5.833');

      icon
        .append('circle')
        .attr('fill', '#1D5B25')
        .attr('cx', '23.5')
        .attr('cy', '22.5')
        .attr('r', '5.833');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '57.961')
        .attr('cy', '42.961')
        .attr('r', '3.295');

      icon
        .append('circle')
        .attr('fill', '#39B54A')
        .attr('cx', '37.877')
        .attr('cy', '36.877')
        .attr('r', '2.211');
    }
  },
  'mezclaOld': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      icon
        .append('path')
        .attr({
          'fill': '#CCFFD9',
          'd': 'M14.848 107.014c1.082 1.042 4.27 2.486 4.27 2.486H61.5v-94H20.817s-3.626.71-5.01 2.04c-1.44 1.39-3.308'+
          ' 4.99-3.308 4.99v81.23s1.387 2.327 2.347 3.254z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#61C46E',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#006837',
          'd': 'M105.25 61.46l-7.375-7.21.125.25H53.5v15h44v-.583'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#006837',
          'stroke-width': '14',
          'stroke-miterlimit': '10',
          'd': 'M14.5 41.5h27.833c5.5 0 10.167 4 10.167 9.5v22.834c0 5.5-4.667 9.666-10.167 9.666H14.5'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.3',
          'fill': '#39B54A',
          'd': 'M66.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.5',
          'fill': '#39B54A',
          'd': 'M77.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.8',
          'fill': '#39B54A',
          'd': 'M88.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333'
        });
      icon
        .append('path')
        .attr({
          'fill': '#39B54A',
          'd': 'M98.5 54.25v.25h-5v-.25l7.5 7.334-7.5 7.333v.583h5v-.583l7.5-7.333M18.5 79.25v.25h-4v-.25l5 4.848-5 4.'+
          '846v.556h3v-.556l5.5-4.846'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.5',
          'fill': '#39B54A',
          'd': 'M27.5 79.25v.25h-4v-.25l5 4.848-5 4.846v.556h3v-.556l5.5-4.846'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.2',
          'fill': '#39B54A',
          'd': 'M35.5 79.25v.25h-4v-.25l5 4.848-5 4.846v.556h3v-.556l5.5-4.846'
        });
      icon
        .append('circle')
        .attr({
          'fill': '#2B8838',
          'cx': '53.083',
          'cy': '61.916',
          'r': '6.917'
        });
      icon
        .append('path')
        .attr({
          'opacity': '0.2',
          'fill': '#39B54A',
          'd': 'M43.203 78.307l-3.244.766 6.01 3.69-3.723 5.987.012.055 2.92-.69-.014-.054 3.884-6.025'
        });
      var g = icon
        .append('path')
        .attr('fill', '#39B54A');
      g
        .append('path')
        .attr('d', 'M18.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896');
      g
        .append('path')
        .attr({
          'opacity': '0.5',
          'd': 'M27.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896'
        })
        .attr();
      g
        .append('path')
        .attr({
          'opacity': '0.2',
          'd': 'M35.5 46.152v.348h-3v-.348l5-4.894-5-4.896v.138h3v-.138l5 4.896M44.203 47l-3.244-.767 6.01-3.688-3.723'+
          '-5.988.012-.055 2.92.69-.014.054 3.884 6.026'
        });
    }
  },
  'transporte': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      var lg = icon
        .append('linearGradient')
        .attr({
          'id': 'a',
          'x1': '60.5',
          'y1': '87.794',
          'x2': '60.5',
          'y2': '31.496'
        });
      lg
        .append('stop')
        .attr('offset', '0');
      lg
        .append('stop')
        .attr({
          'offset': '0.046',
          'stop-color': '#070202'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.116',
          'stop-color': '#1C0607'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.2',
          'stop-color': '#3E0C0E'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.295',
          'stop-color': '#6D1619'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.399',
          'stop-color': '#A82227'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.44',
          'stop-color': '#C1272D'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.584',
          'stop-color': '#76181C'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.719',
          'stop-color': '#360B0D'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.816',
          'stop-color': '#0F0303'
        });
      lg
        .append('stop')
        .attr('offset', '0.867');
      icon
        .append('path')
        .attr({
          'fill': 'url(#a)',
          'd': 'M17.5 53.5h86v22h-86z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#4A1214',
          'd': 'M44.5 50.5h31v2h-31zm0 13h31v2h-31zm0 13h31v2h-31z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#6F1B1E',
          'd': 'M48.5 46.5h7v35h-7zm15 0h8v35h-8z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M72.5 49.5h-2m-22 14h-3m0-3h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M48.5 63h-3m3 4h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M48.5 50.5h-3m0-3h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M48.5 49h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M71.5 47.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M74.5 49h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M71.5 60.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M74.5 62h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M71.5 72.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M74.5 73h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M45.5 72.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M48.5 73h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M99.5 50.5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#4A1214',
          'd': 'M96.5 50.5h11v3h-11zm0 13h11v3h-11z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M100.5 63.5h-3m0-3h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M100.5 63h-3m3 4h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M97.5 47.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M100.5 49h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#4A1214',
          'd': 'M96.5 75.5h11v3h-11z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M97.5 72.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M100.5 73h-3m3 5h-3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#6F1B1E',
          'd': 'M100.5 46.5h7v35h-7z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#4A1214',
          'd': 'M14.5 75.5h11v3h-11zm0-13h11v3h-11z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M21.5 65.5h3m-3-5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M21.5 66h3m-3-4h3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M21.5 73.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M21.5 80h3m-3-5h3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#4A1214',
          'd': 'M14.5 50.5h11v3h-11z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#CD5257',
          'd': 'M21.5 48.5h3v8h-3z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-miterlimit': '10',
          'd': 'M21.5 56h3m-3-5h3'
        });
      icon
        .append('path')
        .attr({
          'fill': '#6F1B1E',
          'd': 'M14.5 47.5h7v35h-7z'
        });
    }
  },
  'compresor': {
    viewPort: '11 12 100 100.25',
    fn: function(icon){
      var lg = icon
        .append('linearGradient')
        .attr({
          'id': 'a',
          'gradientUnits': 'userSpaceOnUse',
          'x1': '60.',
          'y1': '95.166',
          'x2': '60',
          'y2': '104.902'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0',
          'stop-color': '#C1272D'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.146',
          'stop-color': '#BD262C'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.29',
          'stop-color': '#B12429'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.434',
          'stop-color': '#9D2025'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.577',
          'stop-color': '#811A1E'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.721',
          'stop-color': '#5D1316'
        });
      lg
        .append('stop')
        .attr({
          'offset': '0.862',
          'stop-color': '#320A0C'
        });
      lg
        .append('stop')
        .attr('offset', '1');
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M31.5 86.5h3v8h-3zm26-39h48v47h-48z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#C1272D',
          'd': 'M19.758 60.222c-2.964 2.194-5.015 6.53-5.015 11.93 0 5.4 2.05 10.427 5.015 12.622 1.158.857 2.45 1.727'+
          ' 3.82 1.727H55.5v-27H23.566c-1.366 0-2.653-.13-3.808.73z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-width': '4',
          'stroke-miterlimit': '10',
          'd': 'M66.5 93.5V75.625c0-1.65-1.35-3.125-3-3.125h-52'
        });
      icon
        .append('path')
        .attr({
          'fill': 'url(#a)',
          'd': 'M11.5 94.5h97v10h-97z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#DA7D81',
          'd': 'M11.5 94.5h97v3h-97z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#C1272D',
          'stroke-width': '3',
          'stroke-miterlimit': '10',
          'd': 'M109 100c0 5.5-4.5 10-10 10H23c-5.5 0-10-4.5-10-10V24c0-5.5 4.5-10 10-10h76c5.5 0 10 4.5 10 10v76z'
        });
      icon
        .append('path')
        .attr({
          'fill': '#911D22',
          'd': 'M48.5 58.5h7v29h-7z'
        });
      icon
        .append('path')
        .attr({
          'fill-rule': 'evenodd',
          'clip-rule': 'evenodd',
          'fill': '#F0CBCD',
          'd': 'M82.604 48c12.53.056 22.402 10.057 22.333 22.625-.067 12.35-10.144 22.198-22.633 22.12-12.268-.076-22.'+
          '16-10.13-22.11-22.47.05-12.37 10.072-22.33 22.41-22.275zm-21.3 22.317c-.045 11.766 9.424 21.28 21.212 '+
          '21.317 11.784.036 21.24-9.37 21.31-21.193.07-11.75-9.404-21.28-21.194-21.32-11.777-.04-21.282 9.41-21.'+
          '327 21.2z'
        });
      icon
        .append('path')
        .attr({
          'fill-rule': 'evenodd',
          'clip-rule': 'evenodd',
          'fill': '#E6A9AB',
          'd': 'M73.726 51.835c.736 1.15 1.264 2.354 2.12 3.238 1.99 2.056 2.953 4.514 3.346 7.265.128.893.217 1.79.32'+
          '5 2.688.867-.153.893-.165.788-1.08-.292-2.542-1-4.96-2.394-7.124-.92-1.438-1.95-2.813-2.96-4.262 1.05-'+
          '1.3 2.39-2.157 4.18-2.467-.12 1.584.38 2.93 1.12 4.213 1.38 2.397 1.42 5 1.13 7.646-.09.833-.23 1.66-.'+
          '36 2.543.67.102.92-.123 1.03-.755.63-3.828-.06-7.45-1.61-10.953-.21-.483-.42-.97-.62-1.45 1.06-1.067 2'+
          '.97-1.647 4.67-1.37-.61 1.63-.22 3.22.14 4.835.51 2.28 0 4.468-.81 6.597-.36.95-.79 1.89-1.2 2.87.63.3'+
          '1.94.08 1.2-.51 1.51-3.32 1.83-6.78 1.33-10.35l-.3-2.19c1.56-.74 3.45-.77 4.87-.09-.85 1.26-1.1 2.68-1'+
          '.1 4.17.01 2.34-.89 4.38-2.2 6.26-.69 1-1.46 1.94-2.22 2.94.48.41.82.36 1.27-.17 2.54-3.04 3.68-6.62 4'+
          '.1-10.48.05-.47.12-.93.18-1.45 1.74-.22 3.29.14 4.77 1.16-1.24 1.07-1.81 2.46-2.24 3.95-.7 2.44-2.31 4'+
          '.24-4.25 5.79-.75.6-1.54 1.17-2.3 1.75.32.68.7.58 1.22.21 3.13-2.2 5.14-5.23 6.54-8.72l.65-1.64c1.63.0'+
          '9 3.18.92 4.3 2.33-1.6.71-2.46 2.11-3.36 3.51-1.37 2.13-3.46 3.37-5.74 4.33-.79.34-1.6.65-2.4.97.25.67'+
          '.62.72 1.19.5 3.41-1.29 6.1-3.5 8.27-6.38l1.36-1.78c1.53.49 2.91 1.8 3.52 3.37-1.72.29-2.91 1.41-4.13 '+
          '2.53-1.83 1.65-4.1 2.32-6.48 2.66-.89.12-1.79.21-2.69.32.195.88.24.9 1.304.77 3.07-.38 5.85-1.48 8.35-'+
          '3.3.91-.66 1.8-1.35 2.77-2.08 1.34 1.06 2.19 2.42 2.47 3.92-1.32.41-2.65.6-3.74 1.21-2.6 1.46-5.32 1.6'+
          '5-8.17 1.3-.8-.1-1.6-.22-2.4-.33-.02.88-.013.87.73.99 3.65.61 7.14.02 10.51-1.44.63-.27 1.26-.53 1.96-'+
          '.83 1.028 1.39 1.51 2.9 1.32 4.73-1.6-.59-3.11-.3-4.64.07-2.72.66-5.252-.093-7.74-1.11-.66-.27-1.31-.5'+
          '7-1.96-.86-.35.69-.03.97.54 1.23 3.29 1.49 6.73 1.797 10.27 1.323.31-.04.62-.087.928-.12 1.57-.187 1.6'+
          '7-.17 1.8 1.42.09 1.06-.07 2.14-.14 3.42-1.62-1.077-3.16-1.23-4.77-1.28-2.82-.08-5.11-1.47-7.25-3.15-.'+
          '513-.4-1.02-.82-1.57-1.26-.46.49-.4.83.117 1.27 3.04 2.53 6.6 3.69 10.47 4.1.49.05.97.13 1.48.2.2 1.74'+
          '-.177 3.27-1.176 4.75-1.12-1.33-2.64-1.85-4.2-2.33-2.43-.74-4.18-2.43-5.71-4.376-.552-.71-1.08-1.44-1.'+
          '68-2.23l-.49.726c2.52 4.11 6.44 6.26 10.82 7.81-.34 1.7-.99 3.13-2.4 4.32-.86-1.904-2.643-2.694-4.14-3'+
          '.832-2.23-1.696-3.31-4.16-4.292-6.68l-.4-1.03c-.7.25-.73.65-.5 1.244 1.17 3.007 2.98 5.53 5.53 7.52.88'+
          '.69 1.75 1.39 2.67 2.11-.68 1.585-1.8 2.747-3.45 3.564-.22-1.61-1.075-2.74-2.11-3.76-1.92-1.89-2.665-4'+
          '.31-3.064-6.877-.147-.92-.24-1.84-.35-2.79-.75.02-.85.42-.79.99.3 2.81 1.13 5.43 2.73 7.77.84 1.24 1.7'+
          '2 2.45 2.64 3.75-1.02 1.31-2.39 2.16-4.19 2.49.15-1.67-.43-3.05-1.18-4.39-1.34-2.38-1.33-4.96-1.03-7.5'+
          '7.09-.8.22-1.594.348-2.46-.62-.07-.91.076-1.01.69-.57 3.68-.09 7.21 1.46 10.6.287.62.516 1.27.8 1.98-1'+
          '.36 1.04-2.88 1.49-4.69 1.33.55-1.67.29-3.237-.11-4.827-.576-2.277-.04-4.46.75-6.59.37-.99.81-1.956 1.'+
          '23-2.95-.64-.31-.94-.06-1.21.53-1.52 3.35-1.82 6.84-1.31 10.44.044.31.08.62.12.93.17 1.325.18 1.42-1.1'+
          '3 1.57-1.15.13-2.324.01-3.777 0 1.27-1.876 1.23-3.68 1.37-5.47.14-1.81.89-3.44 1.9-4.927.76-1.13 1.61-'+
          '2.2 2.45-3.323-.43-.28-.75-.44-1.17.08-2.23 2.73-3.567 5.82-3.967 9.33-.1.89-.26 1.78-.39 2.65-1.85.26'+
          '6-3.45-.13-4.72-1.16 1.186-1.02 1.756-2.375 2.17-3.84.687-2.41 2.24-4.22 4.16-5.754.8-.64 1.63-1.25 2.'+
          '53-1.94l-.7-.5c-4.084 2.523-6.27 6.413-7.78 10.75-1.7-.11-3.29-.974-4.31-2.34 1.51-.71 2.39-2 3.23-3.3'+
          '6 1.27-2.05 3.19-3.31 5.34-4.27.94-.414 1.9-.77 2.85-1.16-.13-.76-.533-.75-1.13-.524-3.48 1.3-6.18 3.5'+
          '9-8.39 6.52l-1.273 1.7c-1.582-.71-2.754-1.788-3.54-3.44 1.71-.29 2.887-1.32 4.056-2.406 2.25-2.09 5.09'+
          '-2.66 8.01-2.98.457-.04.91-.11 1.368-.16-.137-1.09-.88-.79-1.44-.724-2.91.35-5.566 1.37-7.96 3.057-1.0'+
          '46.74-2.056 1.52-3.12 2.3-1.33-1.08-2.18-2.43-2.51-4.21 1.67.15 3.05-.44 4.4-1.19 2.38-1.334 4.97-1.32'+
          ' 7.57-1.026.8.09 1.6.223 2.46.35.06-.69-.18-.92-.8-1.02-3.63-.6-7.08-.01-10.43 1.4-.652.278-1.31.56-2.'+
          '02.87-1.042-1.39-1.5-2.91-1.34-4.73 1.61.58 3.12.3 4.65-.074 2.34-.576 4.59-.087 6.78.74.99.37 1.95.81'+
          ' 2.94 1.224.31-.65.04-.95-.54-1.21-3.32-1.5-6.785-1.82-10.356-1.32-.31.05-.62.09-.93.13-1.47.17-1.56.1'+
          '7-1.7-1.32-.1-1.09.058-2.206.108-3.555 1.71 1.17 3.367 1.23 5.05 1.326 3.13.17 5.54 1.93 7.864 3.82.22'+
          '.17.433.35.65.53.02.01.057 0 .1 0 .46-.51.28-.85-.22-1.27-3-2.48-6.51-3.62-10.304-4.05-.52-.06-1.04-.1'+
          '3-1.59-.2-.205-1.76.16-3.31 1.18-4.76 1.01 1.184 2.29 1.78 3.7 2.164 2.56.69 4.446 2.33 6.05 4.35.6.75'+
          '7 1.17 1.538 1.75 2.305.65-.343.566-.72.197-1.24-2.2-3.125-5.22-5.14-8.72-6.53l-1.63-.65c.09-1.62.957-'+
          '3.226 2.34-4.29.72 1.55 2.06 2.42 3.44 3.293 2.205 1.4 3.466 3.55 4.44 5.89.31.75.596 1.5.926 2.34l.71'+
          '-.49c-1.39-4.6-4.58-7.71-8.37-10.3.42-1.47 1.785-2.93 3.1-3.46zM86.876 70.4c.014-2.335-1.932-4.312-4.2'+
          '6-4.327-2.396-.016-4.362 1.938-4.352 4.324.01 2.337 1.97 4.29 4.3 4.288 2.34-.003 4.3-1.95 4.312-4.284z'
        });
      icon
        .append('path')
        .attr({
          'fill': 'none',
          'stroke': '#611417',
          'stroke-miterlimit': '10',
          'd': 'M48.5 66h-33m33 11h-34m34 7h-30m30-14h-34m34 10h-33m33-18h-31'
        });
    }
  }
};

},{}],5:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(321);

var domDelegate = _dereq_(320);

function css(attrs) {
  return attrs.join(';');
}

var LIGHTBOX_STYLES = css([
  'z-index: 1001',
  'position: fixed',
  'top: 0',
  'left: 0',
  'right: 0',
  'bottom: 0'
]);

var BACKDROP_STYLES = css([
  'width: 100%',
  'height: 100%',
  'background: rgba(0,0,0,0.3)'
]);

var NOTICE_STYLES = css([
  'position: absolute',
  'left: 50%',
  'top: 50%',
  'margin: -12.5% -13% !important',
  'width: 26% !important',
  'height: 50%',
  'overflow-y: auto',
  'text-align: center',
  'padding: 10px',
  'background: white',
  'border: solid 1px #AAA',
  'border-radius: 3px',
  'font-family: Helvetica, Arial, sans-serif',
  'font-size: 14px',
  'line-height: 1.2em'
]);

var LIGHTBOX_MARKUP =
  '<div style="' + LIGHTBOX_STYLES + '">' +
    '<div class="backdrop" style="' + BACKDROP_STYLES + '"></div>' +
    '<div class="notice" style="' + NOTICE_STYLES + '">{0}</div>' +
  '</div>';


var lightBox;

function open(content) {
  if (!lightBox) {
    lightBox = domify(LIGHTBOX_MARKUP.replace('{0}', content));

    domDelegate.bind(lightBox, '.backdrop', 'click', function() {
      document.body.removeChild(lightBox);
      lightBox = false;
    });
  }
  document.body.appendChild(lightBox);
}

module.exports.open = open;
},{"320":320,"321":321}],6:[function(_dereq_,module,exports){
module.exports = _dereq_(323).byUrl('data:text/css;base64,LmQzc24tY29udGFpbmVyIC5ub2RlIHsKICBjdXJzb3I6IHBvaW50ZXI7IH0KCi5kM3NuLWNvbnRhaW5lciAubm9kZS1ncm91cHMgewogIHN0cm9rZS13aWR0aDogMnB4OwogIGZpbGwtb3BhY2l0eTogMC4zOyB9CgouZDNzbi1jb250YWluZXIgLmxpbmsgewogIHN0cm9rZTogYmxhY2s7CiAgZmlsbDogbm9uZTsKICBzdHJva2Utd2lkdGg6IDRweDsKICBzdHJva2UtbGluZWNhcDogcm91bmQ7IH0KCi5kM3NuLWNvbnRhaW5lciAuaW5uZXItbGluayB7CiAgc3Ryb2tlOiB3aGl0ZTsKICBmaWxsOiBub25lOwogIHN0cm9rZS13aWR0aDogMS41cHg7CiAgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyB9CgouZDNzbi1jb250YWluZXIgLm1hcmtlciB7CiAgc3Ryb2tlOiBibGFjazsKICBmaWxsOiB3aGl0ZTsgfQoKLmQzc24tY29udGFpbmVyIC5ncmlkbGluZSB7CiAgZmlsbDogbm9uZTsKICBzdHJva2Utd2lkdGg6IDFweDsgfQoKLmQzc24tY29udGFpbmVyID4gKiB7CiAgZm9udC1mYW1pbHk6ICJIZWx2ZXRpY2EgTmV1ZSIsSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWYgIWltcG9ydGFudDsKICBmb250LXNpemU6IDEwcHggIWltcG9ydGFudDsgfQoKLmQzc24tY29udGFpbmVyIC50YWJsZS1jb25kZW5zZWQgPiB0aGVhZCA+IHRyID4gdGgsIC5kM3NuLWNvbnRhaW5lciAudGFibGUtY29uZGVuc2VkID4gdGJvZHkgPiB0ciA+IHRkIHsKICBwYWRkaW5nOiAycHggM3B4ICFpbXBvcnRhbnQ7IH0KCi5kM3NuLWNvbnRhaW5lciAubW91c2Vtb3ZlIHsKICBjdXJzb3I6IG1vdmU7IH0KCi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXdvSkluWmxjbk5wYjI0aU9pQXpMQW9KSW1acGJHVWlPaUFpYzNSNWJHVnpMbk5qYzNNaUxBb0pJbk52ZFhKalpYTWlPaUJiQ2drSkluTjBlV3hsY3k1elkzTnpJZ29KWFN3S0NTSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNklGc0tDUWtpTG1RemMyNHRZMjl1ZEdGcGJtVnlJSHRjY2x4dVhISmNiaUFnTG01dlpHVWdlMXh5WEc0Z0lDQWdZM1Z5YzI5eU9pQndiMmx1ZEdWeU8xeHlYRzRnSUgxY2NseHVYSEpjYmlBZ0xtNXZaR1V0WjNKdmRYQnpJSHRjY2x4dUlDQWdJSE4wY205clpTMTNhV1IwYURvZ01uQjRPMXh5WEc0Z0lDQWdabWxzYkMxdmNHRmphWFI1T2lBd0xqTTdYSEpjYmlBZ2ZWeHlYRzVjY2x4dUlDQXViR2x1YXlCN1hISmNiaUFnSUNBZ2MzUnliMnRsT2lCaWJHRmphenRjY2x4dUlDQWdJQ0JtYVd4c09pQnViMjVsTzF4eVhHNGdJQ0FnSUhOMGNtOXJaUzEzYVdSMGFEb2dOSEI0TzF4eVhHNGdJQ0FnSUhOMGNtOXJaUzFzYVc1bFkyRndPaUJ5YjNWdVpEdGNjbHh1SUNCOVhISmNibHh5WEc0Z0lDNXBibTVsY2kxc2FXNXJJSHRjY2x4dUlDQWdJSE4wY205clpUb2dkMmhwZEdVN1hISmNiaUFnSUNCbWFXeHNPaUJ1YjI1bE8xeHlYRzRnSUNBZ2MzUnliMnRsTFhkcFpIUm9PaUF4TGpWd2VEdGNjbHh1SUNBZ0lITjBjbTlyWlMxc2FXNWxZMkZ3T2lCeWIzVnVaRHRjY2x4dUlDQjlYSEpjYmx4eVhHNGdJQzV0WVhKclpYSWdlMXh5WEc0Z0lDQWdjM1J5YjJ0bE9pQmliR0ZqYXp0Y2NseHVJQ0FnSUdacGJHdzZJSGRvYVhSbE8xeHlYRzRnSUgxY2NseHVYSEpjYmlBZ0xtZHlhV1JzYVc1bElIdGNjbHh1SUNBZ0lHWnBiR3c2SUc1dmJtVTdYSEpjYmlBZ0lDQnpkSEp2YTJVdGQybGtkR2c2SURGd2VEdGNjbHh1SUNCOVhISmNibHh5WEc0Z0lDWWdQaUFxSUh0Y2NseHVJQ0FnSUdadmJuUXRabUZ0YVd4NU9pQmNJa2hsYkhabGRHbGpZU0JPWlhWbFhDSXNTR1ZzZG1WMGFXTmhMRUZ5YVdGc0xITmhibk10YzJWeWFXWWdJV2x0Y0c5eWRHRnVkRHRjY2x4dUlDQWdJR1p2Ym5RdGMybDZaVG9nTVRCd2VDQWhhVzF3YjNKMFlXNTBPMXh5WEc0Z0lIMWNjbHh1WEhKY2JpQWdMblJoWW14bExXTnZibVJsYm5ObFpDQStJSFJvWldGa0lENGdkSElnUGlCMGFDd2dMblJoWW14bExXTnZibVJsYm5ObFpDQStJSFJpYjJSNUlENGdkSElnUGlCMFpDQjdYSEpjYmlBZ0lDQndZV1JrYVc1bk9pQXljSGdnTTNCNElDRnBiWEJ2Y25SaGJuUTdYSEpjYmlBZ2ZWeHlYRzVjY2x4dUlDQXViVzkxYzJWdGIzWmxJSHRjY2x4dUlDQWdJR04xY25OdmNqb2diVzkyWlR0Y2NseHVJQ0I5WEhKY2JuMWNjbHh1SWdvSlhTd0tDU0p0WVhCd2FXNW5jeUk2SUNKQlFVRkJMR1ZCUVdVc1EwRkZZaXhMUVVGTExFTkJRVU03UlVGRFNpeE5RVUZOTEVWQlFVVXNUMEZCVVN4SFFVTnFRanM3UVVGS1NDeGxRVUZsTEVOQlRXSXNXVUZCV1N4RFFVRkRPMFZCUTFnc1dVRkJXU3hGUVVGRkxFZEJRVWs3UlVGRGJFSXNXVUZCV1N4RlFVRkZMRWRCUVVrc1IwRkRia0k3TzBGQlZFZ3NaVUZCWlN4RFFWZGlMRXRCUVVzc1EwRkJRenRGUVVOSUxFMUJRVTBzUlVGQlJTeExRVUZOTzBWQlEyUXNTVUZCU1N4RlFVRkZMRWxCUVVzN1JVRkRXQ3haUVVGWkxFVkJRVVVzUjBGQlNUdEZRVU5zUWl4alFVRmpMRVZCUVVVc1MwRkJUU3hIUVVONFFqczdRVUZvUWtnc1pVRkJaU3hEUVd0Q1lpeFhRVUZYTEVOQlFVTTdSVUZEVml4TlFVRk5MRVZCUVVVc1MwRkJUVHRGUVVOa0xFbEJRVWtzUlVGQlJTeEpRVUZMTzBWQlExZ3NXVUZCV1N4RlFVRkZMRXRCUVUwN1JVRkRjRUlzWTBGQll5eEZRVUZGTEV0QlFVMHNSMEZEZGtJN08wRkJka0pJTEdWQlFXVXNRMEY1UW1Jc1QwRkJUeXhEUVVGRE8wVkJRMDRzVFVGQlRTeEZRVUZGTEV0QlFVMDdSVUZEWkN4SlFVRkpMRVZCUVVVc1MwRkJUU3hIUVVOaU96dEJRVFZDU0N4bFFVRmxMRU5CT0VKaUxGTkJRVk1zUTBGQlF6dEZRVU5TTEVsQlFVa3NSVUZCUlN4SlFVRkxPMFZCUTFnc1dVRkJXU3hGUVVGRkxFZEJRVWtzUjBGRGJrSTdPMEZCYWtOSUxHVkJRV1VzUjBGdFExUXNRMEZCUXl4RFFVRkRPMFZCUTBvc1YwRkJWeXhGUVVGRkxITkVRVUYxUkR0RlFVTndSU3hUUVVGVExFVkJRVVVzWlVGQlowSXNSMEZETlVJN08wRkJkRU5JTEdWQlFXVXNRMEYzUTJJc1owSkJRV2RDTEVkQlFVY3NTMEZCU3l4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFVkJlRU53UXl4bFFVRmxMRU5CZDBOMVFpeG5Ra0ZCWjBJc1IwRkJSeXhMUVVGTExFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXp0RlFVTnlSU3hQUVVGUExFVkJRVVVzYTBKQlFXMUNMRWRCUXpkQ096dEJRVEZEU0N4bFFVRmxMRU5CTkVOaUxGVkJRVlVzUTBGQlF6dEZRVU5VTEUxQlFVMHNSVUZCUlN4SlFVRkxMRWRCUTJRaUxBb0pJbTVoYldWeklqb2dXMTBLZlE9PSAqLw==');;
},{"323":323}],7:[function(_dereq_,module,exports){
var matches = _dereq_(10)

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

},{"10":10}],8:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

try {
  var closest = _dereq_(7);
} catch(err) {
  var closest = _dereq_(7);
}

try {
  var event = _dereq_(9);
} catch(err) {
  var event = _dereq_(9);
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

},{"7":7,"9":9}],9:[function(_dereq_,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],10:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

try {
  var query = _dereq_(11);
} catch (err) {
  var query = _dereq_(11);
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

},{"11":11}],11:[function(_dereq_,module,exports){
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

},{}],12:[function(_dereq_,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],13:[function(_dereq_,module,exports){
!function() {
  var d3 = {
    version: "3.5.16"
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = this.document;
  function d3_documentElement(node) {
    return node && (node.ownerDocument || node.document || node).documentElement;
  }
  function d3_window(node) {
    return node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
  }
  if (d3_document) {
    try {
      d3_array(d3_document.documentElement.childNodes)[0].nodeType;
    } catch (e) {
      d3_array = function(list) {
        var i = list.length, array = new Array(i);
        while (i--) array[i] = list[i];
        return array;
      };
    }
  }
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  if (d3_document) {
    try {
      d3_document.createElement("DIV").style.setProperty("opacity", 0, "");
    } catch (error) {
      var d3_element_prototype = this.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = this.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
      d3_element_prototype.setAttribute = function(name, value) {
        d3_element_setAttribute.call(this, name, value + "");
      };
      d3_element_prototype.setAttributeNS = function(space, local, value) {
        d3_element_setAttributeNS.call(this, space, local, value + "");
      };
      d3_style_prototype.setProperty = function(name, value, priority) {
        d3_style_setProperty.call(this, name, value + "", priority);
      };
    }
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  function d3_number(x) {
    return x === null ? NaN : +x;
  }
  function d3_numeric(x) {
    return !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) s += a; else --j;
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) s += a; else --j;
    }
    if (j) return s / j;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    var numbers = [], n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) numbers.push(a);
    }
    if (numbers.length) return d3.quantile(numbers.sort(d3_ascending), .5);
  };
  d3.variance = function(array, f) {
    var n = array.length, m = 0, a, d, s = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) {
        if (d3_numeric(a = d3_number(array[i]))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    } else {
      while (++i < n) {
        if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }
    if (j > 1) return s / (j - 1);
  };
  d3.deviation = function() {
    var v = d3.variance.apply(this, arguments);
    return v ? Math.sqrt(v) : v;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array, i0, i1) {
    if ((m = arguments.length) < 3) {
      i1 = array.length;
      if (m < 2) i0 = 0;
    }
    var m = i1 - i0, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.transpose = function(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = d3.min(matrix, d3_transposeLength), transpose = new Array(m); ++i < m; ) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n; ) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  };
  function d3_transposeLength(d) {
    return d.length;
  }
  d3.zip = function() {
    return d3.transpose(arguments);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  }
  d3.map = function(object, f) {
    var map = new d3_Map();
    if (object instanceof d3_Map) {
      object.forEach(function(key, value) {
        map.set(key, value);
      });
    } else if (Array.isArray(object)) {
      var i = -1, n = object.length, o;
      if (arguments.length === 1) while (++i < n) map.set(i, object[i]); else while (++i < n) map.set(f.call(object, o = object[i], i), o);
    } else {
      for (var key in object) map.set(key, object[key]);
    }
    return map;
  };
  function d3_Map() {
    this._ = Object.create(null);
  }
  var d3_map_proto = "__proto__", d3_map_zero = "\x00";
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this._[d3_map_escape(key)];
    },
    set: function(key, value) {
      return this._[d3_map_escape(key)] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      for (var key in this._) values.push(this._[key]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var key in this._) entries.push({
        key: d3_map_unescape(key),
        value: this._[key]
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
    }
  });
  function d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  function d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }
  function d3_map_has(key) {
    return d3_map_escape(key) in this._;
  }
  function d3_map_remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  function d3_map_keys() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this._) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this._) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {
    this._ = Object.create(null);
  }
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(key) {
      this._[d3_map_escape(key += "")] = true;
      return key;
    },
    remove: d3_map_remove,
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key));
    }
  });
  d3.behavior = {};
  function d3_identity(d) {
    return d;
  }
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.slice(i + 1);
      type = type.slice(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatches = function(n, s) {
    var d3_selectMatcher = n.matches || n[d3_vendorSymbol(n, "matchesSelector")];
    d3_selectMatches = function(n, s) {
      return d3_selectMatcher.call(n, s);
    };
    return d3_selectMatches(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3.select(d3_document.documentElement);
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsXhtml = "http://www.w3.org/1999/xhtml";
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: d3_nsXhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return (name + "").trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) {
        var node = this.node();
        return d3_window(node).getComputedStyle(node, null).getPropertyValue(name);
      }
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    function create() {
      var document = this.ownerDocument, namespace = this.namespaceURI;
      return namespace === d3_nsXhtml && document.documentElement.namespaceURI === d3_nsXhtml ? document.createElement(name) : document.createElementNS(namespace, name);
    }
    function createNS() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    }
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? createNS : create;
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(d3_selectionRemove);
  };
  function d3_selectionRemove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), keyValues = new Array(n), keyValue;
        for (i = -1; ++i < n; ) {
          if (node = group[i]) {
            if (nodeByKeyValue.has(keyValue = key.call(node, node.__data__, i))) {
              exitNodes[i] = node;
            } else {
              nodeByKeyValue.set(keyValue, node);
            }
            keyValues[i] = keyValue;
          }
        }
        for (i = -1; ++i < m; ) {
          if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          } else if (node !== true) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          }
          nodeByKeyValue.set(keyValue, true);
        }
        for (i = -1; ++i < n; ) {
          if (i in keyValues && nodeByKeyValue.get(keyValues[i]) !== true) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    d3_selection_each(this, function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3.select = function(node) {
    var group;
    if (typeof node === "string") {
      group = [ d3_select(node, d3_document) ];
      group.parentNode = d3_document.documentElement;
    } else {
      group = [ node ];
      group.parentNode = d3_documentElement(node);
    }
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group;
    if (typeof nodes === "string") {
      group = d3_array(d3_selectAll(nodes, d3_document));
      group.parentNode = d3_document.documentElement;
    } else {
      group = d3_array(nodes);
      group.parentNode = null;
    }
    return d3_selection([ group ]);
  };
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.slice(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  if (d3_document) {
    d3_selection_onFilters.forEach(function(k) {
      if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
    });
  }
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect, d3_event_dragId = 0;
  function d3_event_dragSuppress(node) {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window(node)).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect == null) {
      d3_event_dragSelect = "onselectstart" in node ? false : d3_vendorSymbol(node.style, "userSelect");
    }
    if (d3_event_dragSelect) {
      var style = d3_documentElement(node).style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        var off = function() {
          w.on(click, null);
        };
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = this.navigator && /WebKit/.test(this.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0) {
        var window = d3_window(container);
        if (window.scrollX || window.scrollY) {
          svg = d3.select("body").append("svg").style({
            position: "absolute",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            border: "none"
          }, "important");
          var ctm = svg[0][0].getScreenCTM();
          d3_mouse_bug44083 = !(ctm.f || ctm.e);
          svg.remove();
        }
      }
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, 
      point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_window, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_identity, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target.correspondingElement || d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject(target)).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(target), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  var ε = 1e-6, ε2 = ε * ε, π = Math.PI, τ = 2 * π, τε = τ - ε, halfπ = π / 2, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < ε2) {
      S = Math.log(w1 / w0) / ρ;
      i = function(t) {
        return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * t * S) ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / ρ;
      i = function(t) {
        var s = t * S, coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      };
    }
    i.duration = S * 1e3;
    return i;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, duration = 250, zooming = 0, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    if (!d3_behavior_zoomWheel) {
      d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
      }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return d3.event.wheelDelta;
      }, "mousewheel") : (d3_behavior_zoomDelta = function() {
        return -d3.event.detail;
      }, "MozMousePixelScroll");
    }
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = center0 ? center0[0] : dx / 2, cy = center0 ? center0[1] : dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("interrupt.zoom", function() {
            zoomended(dispatch);
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: null
      };
      scaleTo(+_);
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.duration = function(_) {
      if (!arguments.length) return duration;
      duration = +_;
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function zoomTo(that, p, l, k) {
      that.__chart__ = {
        x: view.x,
        y: view.y,
        k: view.k
      };
      scaleTo(Math.pow(2, k));
      translateTo(center0 = p, l);
      that = d3.select(that);
      if (duration > 0) that = that.transition().duration(duration);
      that.call(zoom.event);
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      if (!zooming++) dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      if (!--zooming) dispatch({
        type: "zoomend"
      }), center0 = null;
    }
    function mousedowned() {
      var that = this, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window(that)).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress(that);
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, null).on(mouseup, null);
        dragRestore(dragged);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, targets = [], subject = d3.select(that), dragRestore = d3_event_dragSuppress(that);
      started();
      zoomstarted(dispatch);
      subject.on(mousedown, null).on(touchstart, started);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var target = d3.event.target;
        d3.select(target).on(touchmove, moved).on(touchend, ended);
        targets.push(target);
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0];
            zoomTo(that, p, locations0[p.identifier], Math.floor(Math.log(view.k) / Math.LN2) + 1);
            d3_eventPreventDefault();
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        d3_selection_interrupt.call(that);
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        d3.selectAll(targets).on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      translate0 = location(center0 = center || d3.mouse(this)), zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(center0, translate0);
      zoomed(dispatch);
    }
    function dblclicked() {
      var p = d3.mouse(this), k = Math.log(view.k) / Math.LN2;
      zoomTo(this, p, location(p), d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ], d3_behavior_zoomDelta, d3_behavior_zoomWheel;
  d3.color = d3_color;
  function d3_color() {}
  d3_color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = d3_hsl;
  function d3_hsl(h, s, l) {
    return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l) : arguments.length < 2 ? h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : new d3_hsl(h, s, l);
  }
  var d3_hslPrototype = d3_hsl.prototype = new d3_color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = d3_hcl;
  function d3_hcl(h, c, l) {
    return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l) : arguments.length < 2 ? h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l) : h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : new d3_hcl(h, c, l);
  }
  var d3_hclPrototype = d3_hcl.prototype = new d3_color();
  d3_hclPrototype.brighter = function(k) {
    return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = d3_lab;
  function d3_lab(l, a, b) {
    return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b) : arguments.length < 2 ? l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b) : l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l) : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b) : new d3_lab(l, a, b);
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_lab.prototype = new d3_color();
  d3_labPrototype.brighter = function(k) {
    return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return new d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : new d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = d3_rgb;
  function d3_rgb(r, g, b) {
    return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b) : arguments.length < 2 ? r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : new d3_rgb(r, g, b);
  }
  function d3_rgbNumber(value) {
    return new d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  var d3_rgbPrototype = d3_rgb.prototype = new d3_color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return new d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_rgb(k * this.r, k * this.g, k * this.b);
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/.exec(format = format.toLowerCase());
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) {
      return rgb(color.r, color.g, color.b);
    }
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (this.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  function d3_xhrHasResponse(request) {
    var type = request.responseType;
    return type && type !== "text" ? request.response : request.responseText;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }
        return text.slice(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_frame = this[d3_vendorSymbol(this, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function() {
    d3_timer.apply(this, arguments);
  };
  function d3_timer(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
    return timer;
  }
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now(), timer = d3_timer_queueHead;
    while (timer) {
      if (now >= timer.t && timer.c(now - timer.t)) timer.c = null;
      timer = timer.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.c) {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      } else {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value = +value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping && locale_thousands ? function(value, width) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "-", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false, exponent = true;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
        exponent = false;

       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before, after;
        if (i < 0) {
          var j = exponent ? value.lastIndexOf("e") : -1;
          if (j < 0) before = value, after = ""; else before = value.substring(0, j), after = value.substring(j);
        } else {
          before = value.substring(0, i);
          after = locale_decimal + value.substring(i + 1);
        }
        if (!zfill && comma) before = formatGroup(before, Infinity);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.slice(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.slice(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "W" in d ? 1 : 0;
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = abs(z) / 60 | 0, zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x + pointRadius, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ _[1], -_[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return rotate([ 0, 0, 90 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym, i = below << 1 | right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = xm; else x2 = xm;
        if (below) y1 = ym; else y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      root.find = function(point) {
        return d3_geom_quadtreeFind(root, point[0], point[1], x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  function d3_geom_quadtreeFind(root, x, y, x0, y0, x3, y3) {
    var minDistance2 = Infinity, closestPoint;
    (function find(node, x1, y1, x2, y2) {
      if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;
      if (point = node.point) {
        var point, dx = x - node.x, dy = y - node.y, distance2 = dx * dx + dy * dy;
        if (distance2 < minDistance2) {
          var distance = Math.sqrt(minDistance2 = distance2);
          x0 = x - distance, y0 = y - distance;
          x3 = x + distance, y3 = y + distance;
          closestPoint = point;
        }
      }
      var children = node.nodes, xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym;
      for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
        if (node = children[i & 3]) switch (i & 3) {
         case 0:
          find(node, x1, y1, xm, ym);
          break;

         case 1:
          find(node, xm, y1, x2, ym);
          break;

         case 2:
          find(node, x1, ym, xm, y2);
          break;

         case 3:
          find(node, xm, ym, x2, y2);
          break;
        }
      }
    })(root, x0, y0, x3, y3);
    return closestPoint;
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    a = +a, b = +b;
    return function(t) {
      return a * (1 - t) + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b.toLowerCase()) || /^(#|rgb\(|hsl\()/i.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.slice(0, i) : name, m = i >= 0 ? name.slice(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransformPop(s) {
    return s.length ? s.pop() + "," : "";
  }
  function d3_interpolateTranslate(ta, tb, s, q) {
    if (ta[0] !== tb[0] || ta[1] !== tb[1]) {
      var i = s.push("translate(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    }
  }
  function d3_interpolateRotate(ra, rb, s, q) {
    if (ra !== rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(d3_interpolateTransformPop(s) + "rotate(" + rb + ")");
    }
  }
  function d3_interpolateSkew(wa, wb, s, q) {
    if (wa !== wb) {
      q.push({
        i: s.push(d3_interpolateTransformPop(s) + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(d3_interpolateTransformPop(s) + "skewX(" + wb + ")");
    }
  }
  function d3_interpolateScale(ka, kb, s, q) {
    if (ka[0] !== kb[0] || ka[1] !== kb[1]) {
      var i = s.push(d3_interpolateTransformPop(s) + "scale(", null, ",", null, ")");
      q.push({
        i: i - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: i - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] !== 1 || kb[1] !== 1) {
      s.push(d3_interpolateTransformPop(s) + "scale(" + kb + ")");
    }
  }
  function d3_interpolateTransform(a, b) {
    var s = [], q = [];
    a = d3.transform(a), b = d3.transform(b);
    d3_interpolateTranslate(a.translate, b.translate, s, q);
    d3_interpolateRotate(a.rotate, b.rotate, s, q);
    d3_interpolateSkew(a.skew, b.skew, s, q);
    d3_interpolateScale(a.scale, b.scale, s, q);
    a = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return (x - a) / b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) / b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: groupSums[di]
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), timer, size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        timer = null;
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight + t.weight ? s.weight / (s.weight + t.weight) : .5);
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) {
          alpha = x;
        } else {
          timer.c = null, timer.t = NaN, timer = null;
          event.end({
            type: "end",
            alpha: alpha = 0
          });
        }
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        timer = d3_timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, l = candidates.length, x;
        while (++j < l) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ, padAngle = 0;
    function pie(data) {
      var n = data.length, values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      }), a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle), da = (typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a, p = Math.min(Math.abs(da) / n, +(typeof padAngle === "function" ? padAngle.apply(this, arguments) : padAngle)), pa = p * (da < 0 ? -1 : 1), sum = d3.sum(values), k = sum ? (da - n * pa) / sum : 0, index = d3.range(n), arcs = [], v;
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      index.forEach(function(i) {
        arcs[i] = {
          data: data[i],
          value: v = values[i],
          startAngle: a,
          endAngle: a += v * k + pa,
          padAngle: p
        };
      });
      return arcs;
    }
    pie.value = function(_) {
      if (!arguments.length) return value;
      value = _;
      return pie;
    };
    pie.sort = function(_) {
      if (!arguments.length) return sort;
      sort = _;
      return pie;
    };
    pie.startAngle = function(_) {
      if (!arguments.length) return startAngle;
      startAngle = _;
      return pie;
    };
    pie.endAngle = function(_) {
      if (!arguments.length) return endAngle;
      endAngle = _;
      return pie;
    };
    pie.padAngle = function(_) {
      if (!arguments.length) return padAngle;
      padAngle = _;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      if (!(n = data.length)) return data;
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var m = series[0].length, n, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = null;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root0 = nodes[0], root1 = wrapTree(root0);
      d3_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      d3_layout_hierarchyVisitBefore(root1, secondWalk);
      if (nodeSize) d3_layout_hierarchyVisitBefore(root0, sizeNode); else {
        var left = root0, right = root0, bottom = root0;
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return nodes;
    }
    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        d3_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null ? sizeNode : null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) == null ? null : sizeNode;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function d3_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function d3_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function d3_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function d3_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_hierarchyVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = root.y = 0;
      if (root.value) root.dx = size[0], root.dy = size[1]; else root.dx = root.dy = 0;
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
    d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
    return domain;
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(1, base * n / scale.ticks().length);
      return function(d) {
        var i = d / pow(Math.round(log(d)));
        if (i * base < base - .5) i *= base;
        return i <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = (start + stop) / 2, 
      0) : (stop - start) / (domain.length - 1 + padding);
      range = steps(start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundPoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = stop = Math.round((start + stop) / 2), 
      0) : (stop - start) / (domain.length - 1 + padding) | 0;
      range = steps(start + Math.round(step * padding / 2 + (stop - start - (domain.length - 1 + padding) * step) / 2), step);
      rangeBand = 0;
      ranger = {
        t: "rangeRoundPoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding));
      range = steps(start + Math.round((stop - start - (domain.length - padding) * step) / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(d3_number).filter(d3_numeric).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  function d3_zero() {
    return 0;
  }
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, cornerRadius = d3_zero, padRadius = d3_svg_arcAuto, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle, padAngle = d3_svg_arcPadAngle;
    function arc() {
      var r0 = Math.max(0, +innerRadius.apply(this, arguments)), r1 = Math.max(0, +outerRadius.apply(this, arguments)), a0 = startAngle.apply(this, arguments) - halfπ, a1 = endAngle.apply(this, arguments) - halfπ, da = Math.abs(a1 - a0), cw = a0 > a1 ? 0 : 1;
      if (r1 < r0) rc = r1, r1 = r0, r0 = rc;
      if (da >= τε) return circleSegment(r1, cw) + (r0 ? circleSegment(r0, 1 - cw) : "") + "Z";
      var rc, cr, rp, ap, p0 = 0, p1 = 0, x0, y0, x1, y1, x2, y2, x3, y3, path = [];
      if (ap = (+padAngle.apply(this, arguments) || 0) / 2) {
        rp = padRadius === d3_svg_arcAuto ? Math.sqrt(r0 * r0 + r1 * r1) : +padRadius.apply(this, arguments);
        if (!cw) p1 *= -1;
        if (r1) p1 = d3_asin(rp / r1 * Math.sin(ap));
        if (r0) p0 = d3_asin(rp / r0 * Math.sin(ap));
      }
      if (r1) {
        x0 = r1 * Math.cos(a0 + p1);
        y0 = r1 * Math.sin(a0 + p1);
        x1 = r1 * Math.cos(a1 - p1);
        y1 = r1 * Math.sin(a1 - p1);
        var l1 = Math.abs(a1 - a0 - 2 * p1) <= π ? 0 : 1;
        if (p1 && d3_svg_arcSweep(x0, y0, x1, y1) === cw ^ l1) {
          var h1 = (a0 + a1) / 2;
          x0 = r1 * Math.cos(h1);
          y0 = r1 * Math.sin(h1);
          x1 = y1 = null;
        }
      } else {
        x0 = y0 = 0;
      }
      if (r0) {
        x2 = r0 * Math.cos(a1 - p0);
        y2 = r0 * Math.sin(a1 - p0);
        x3 = r0 * Math.cos(a0 + p0);
        y3 = r0 * Math.sin(a0 + p0);
        var l0 = Math.abs(a0 - a1 + 2 * p0) <= π ? 0 : 1;
        if (p0 && d3_svg_arcSweep(x2, y2, x3, y3) === 1 - cw ^ l0) {
          var h0 = (a0 + a1) / 2;
          x2 = r0 * Math.cos(h0);
          y2 = r0 * Math.sin(h0);
          x3 = y3 = null;
        }
      } else {
        x2 = y2 = 0;
      }
      if (da > ε && (rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments))) > .001) {
        cr = r0 < r1 ^ cw ? 0 : 1;
        var rc1 = rc, rc0 = rc;
        if (da < π) {
          var oc = x3 == null ? [ x2, y2 ] : x1 == null ? [ x0, y0 ] : d3_geom_polygonIntersect([ x0, y0 ], [ x3, y3 ], [ x1, y1 ], [ x2, y2 ]), ax = x0 - oc[0], ay = y0 - oc[1], bx = x1 - oc[0], by = y1 - oc[1], kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2), lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
          rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
        }
        if (x1 != null) {
          var t30 = d3_svg_arcCornerTangents(x3 == null ? [ x2, y2 ] : [ x3, y3 ], [ x0, y0 ], r1, rc1, cw), t12 = d3_svg_arcCornerTangents([ x1, y1 ], [ x2, y2 ], r1, rc1, cw);
          if (rc === rc1) {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 0,", cr, " ", t30[1], "A", r1, ",", r1, " 0 ", 1 - cw ^ d3_svg_arcSweep(t30[1][0], t30[1][1], t12[1][0], t12[1][1]), ",", cw, " ", t12[1], "A", rc1, ",", rc1, " 0 0,", cr, " ", t12[0]);
          } else {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 1,", cr, " ", t12[0]);
          }
        } else {
          path.push("M", x0, ",", y0);
        }
        if (x3 != null) {
          var t03 = d3_svg_arcCornerTangents([ x0, y0 ], [ x3, y3 ], r0, -rc0, cw), t21 = d3_svg_arcCornerTangents([ x2, y2 ], x1 == null ? [ x0, y0 ] : [ x1, y1 ], r0, -rc0, cw);
          if (rc === rc0) {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t21[1], "A", r0, ",", r0, " 0 ", cw ^ d3_svg_arcSweep(t21[1][0], t21[1][1], t03[1][0], t03[1][1]), ",", 1 - cw, " ", t03[1], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          } else {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          }
        } else {
          path.push("L", x2, ",", y2);
        }
      } else {
        path.push("M", x0, ",", y0);
        if (x1 != null) path.push("A", r1, ",", r1, " 0 ", l1, ",", cw, " ", x1, ",", y1);
        path.push("L", x2, ",", y2);
        if (x3 != null) path.push("A", r0, ",", r0, " 0 ", l0, ",", 1 - cw, " ", x3, ",", y3);
      }
      path.push("Z");
      return path.join("");
    }
    function circleSegment(r1, cw) {
      return "M0," + r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + -r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + r1;
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.cornerRadius = function(v) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = d3_functor(v);
      return arc;
    };
    arc.padRadius = function(v) {
      if (!arguments.length) return padRadius;
      padRadius = v == d3_svg_arcAuto ? d3_svg_arcAuto : d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.padAngle = function(v) {
      if (!arguments.length) return padAngle;
      padAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcAuto = "auto";
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_arcPadAngle(d) {
    return d && d.padAngle;
  }
  function d3_svg_arcSweep(x0, y0, x1, y1) {
    return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
  }
  function d3_svg_arcCornerTangents(p0, p1, r1, rc, cw) {
    var x01 = p0[0] - p1[0], y01 = p0[1] - p1[1], lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x1 = p0[0] + ox, y1 = p0[1] + oy, x2 = p1[0] + ox, y2 = p1[1] + oy, x3 = (x1 + x2) / 2, y3 = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy, r = r1 - rc, D = x1 * y2 - x2 * y1, d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)), cx0 = (D * dy - dx * d) / d2, cy0 = (-D * dx - dy * d) / d2, cx1 = (D * dy + dx * d) / d2, cy1 = (-D * dx + dy * d) / d2, dx0 = cx0 - x3, dy0 = cy0 - y3, dx1 = cx1 - x3, dy1 = cy1 - y3;
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
    return [ [ cx0 - ox, cy0 - oy ], [ cx0 * r1 / r, cy0 * r1 / r ] ];
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.length > 1 ? points.join("L") : points + "Z";
  }
  function d3_svg_lineLinearClosed(points) {
    return points.join("L") + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, -1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinearClosed(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] - halfπ;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) - halfπ, a1 = endAngle.call(self, subgroup, i) - halfπ;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] - halfπ;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  d3_selectionPrototype.transition = function(name) {
    var id = d3_transitionInheritId || ++d3_transitionId, ns = d3_transitionNamespace(name), subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, ns, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_selectionPrototype.interrupt = function(name) {
    return this.each(name == null ? d3_selection_interrupt : d3_selection_interruptNS(d3_transitionNamespace(name)));
  };
  var d3_selection_interrupt = d3_selection_interruptNS(d3_transitionNamespace());
  function d3_selection_interruptNS(ns) {
    return function() {
      var lock, activeId, active;
      if ((lock = this[ns]) && (active = lock[activeId = lock.active])) {
        active.timer.c = null;
        active.timer.t = NaN;
        if (--lock.count) delete lock[activeId]; else delete this[ns];
        lock.active += .5;
        active.event && active.event.interrupt.call(this, this.__data__, active.index);
      }
    };
  }
  function d3_transition(groups, ns, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.namespace = ns;
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection, name) {
    return selection && selection.transition ? d3_transitionInheritId ? selection.transition(name) : selection : d3.selection().transition(selection);
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, ns, id, node[ns][id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node[ns][id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, ns, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.namespace, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) return this.node()[ns][id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node[ns][id].tween.remove(name);
    } : function(node) {
      node[ns][id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id, ns = groups.namespace;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node[ns][id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node[ns][id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window(this).getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window(this).getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    var ns = this.namespace;
    return this.each("end.transition", function() {
      var p;
      if (this[ns].count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node[ns][id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node[ns][id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node[ns][id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      try {
        d3_transitionInheritId = id;
        d3_selection_each(this, function(node, i, j) {
          d3_transitionInherit = node[ns][id];
          type.call(node, node.__data__, i, j);
        });
      } finally {
        d3_transitionInherit = inherit;
        d3_transitionInheritId = inheritId;
      }
    } else {
      d3_selection_each(this, function(node) {
        var transition = node[ns][id];
        (transition.event || (transition.event = d3.dispatch("start", "end", "interrupt"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, ns = this.namespace, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = node[ns][id0];
          d3_transitionNode(node, i, ns, id1, {
            time: transition.time,
            ease: transition.ease,
            delay: transition.delay + transition.duration,
            duration: transition.duration
          });
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id1);
  };
  function d3_transitionNamespace(name) {
    return name == null ? "__transition__" : "__transition_" + name + "__";
  }
  function d3_transitionNode(node, i, ns, id, inherit) {
    var lock = node[ns] || (node[ns] = {
      active: 0,
      count: 0
    }), transition = lock[id], time, timer, duration, ease, tweens;
    function schedule(elapsed) {
      var delay = transition.delay;
      timer.t = delay + time;
      if (delay <= elapsed) return start(elapsed - delay);
      timer.c = start;
    }
    function start(elapsed) {
      var activeId = lock.active, active = lock[activeId];
      if (active) {
        active.timer.c = null;
        active.timer.t = NaN;
        --lock.count;
        delete lock[activeId];
        active.event && active.event.interrupt.call(node, node.__data__, active.index);
      }
      for (var cancelId in lock) {
        if (+cancelId < id) {
          var cancel = lock[cancelId];
          cancel.timer.c = null;
          cancel.timer.t = NaN;
          --lock.count;
          delete lock[cancelId];
        }
      }
      timer.c = tick;
      d3_timer(function() {
        if (timer.c && tick(elapsed || 1)) {
          timer.c = null;
          timer.t = NaN;
        }
        return 1;
      }, 0, time);
      lock.active = id;
      transition.event && transition.event.start.call(node, node.__data__, i);
      tweens = [];
      transition.tween.forEach(function(key, value) {
        if (value = value.call(node, node.__data__, i)) {
          tweens.push(value);
        }
      });
      ease = transition.ease;
      duration = transition.duration;
    }
    function tick(elapsed) {
      var t = elapsed / duration, e = ease(t), n = tweens.length;
      while (n > 0) {
        tweens[--n].call(node, e);
      }
      if (t >= 1) {
        transition.event && transition.event.end.call(node, node.__data__, i);
        if (--lock.count) delete lock[id]; else delete node[ns];
        return 1;
      }
    }
    if (!transition) {
      time = inherit.time;
      timer = d3_timer(schedule, 0, time);
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        timer: timer,
        delay: inherit.delay,
        duration: inherit.duration,
        ease: inherit.ease,
        index: i
      };
      inherit = null;
      ++lock.count;
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickSpacing = Math.max(innerTickSize, 0) + tickPadding, tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text"), sign = orient === "top" || orient === "left" ? -1 : 1, x1, x2, y1, y2;
        if (orient === "bottom" || orient === "top") {
          tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
          text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
        } else {
          tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
          text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
          pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
        }
        lineEnter.attr(y2, sign * innerTickSize);
        textEnter.attr(y1, sign * tickSpacing);
        lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
        textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1, scale0);
        }
        tickEnter.call(tickTransform, scale0, scale1);
        tickUpdate.call(tickTransform, scale1, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = d3_array(arguments);
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x0, x1) {
    selection.attr("transform", function(d) {
      var v0 = x0(d);
      return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y0, y1) {
    selection.attr("transform", function(d) {
      var v0 = y0(d);
      return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(target), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window(target)).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) this.d3 = d3, define(d3); else if (typeof module === "object" && module.exports) module.exports = d3; else this.d3 = d3;
}();
},{}],14:[function(_dereq_,module,exports){

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

},{}],15:[function(_dereq_,module,exports){
var getNative = _dereq_(134),
    root = _dereq_(170);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;

},{"134":134,"170":170}],16:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(167);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @returns {Object} Returns the new hash object.
 */
function Hash() {}

// Avoid inheriting from `Object.prototype` when possible.
Hash.prototype = nativeCreate ? nativeCreate(null) : objectProto;

module.exports = Hash;

},{"167":167}],17:[function(_dereq_,module,exports){
var getNative = _dereq_(134),
    root = _dereq_(170);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"134":134,"170":170}],18:[function(_dereq_,module,exports){
var mapClear = _dereq_(159),
    mapDelete = _dereq_(160),
    mapGet = _dereq_(161),
    mapHas = _dereq_(162),
    mapSet = _dereq_(163);

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function MapCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.clear();
  while (++index < length) {
    var entry = values[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapClear;
MapCache.prototype['delete'] = mapDelete;
MapCache.prototype.get = mapGet;
MapCache.prototype.has = mapHas;
MapCache.prototype.set = mapSet;

module.exports = MapCache;

},{"159":159,"160":160,"161":161,"162":162,"163":163}],19:[function(_dereq_,module,exports){
var getNative = _dereq_(134),
    root = _dereq_(170);

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;

},{"134":134,"170":170}],20:[function(_dereq_,module,exports){
var root = _dereq_(170);

/** Built-in value references. */
var Reflect = root.Reflect;

module.exports = Reflect;

},{"170":170}],21:[function(_dereq_,module,exports){
var getNative = _dereq_(134),
    root = _dereq_(170);

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;

},{"134":134,"170":170}],22:[function(_dereq_,module,exports){
var MapCache = _dereq_(18),
    cachePush = _dereq_(105);

/**
 *
 * Creates a set cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.push(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

},{"105":105,"18":18}],23:[function(_dereq_,module,exports){
var stackClear = _dereq_(172),
    stackDelete = _dereq_(173),
    stackGet = _dereq_(174),
    stackHas = _dereq_(175),
    stackSet = _dereq_(176);

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function Stack(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.clear();
  while (++index < length) {
    var entry = values[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;

},{"172":172,"173":173,"174":174,"175":175,"176":176}],24:[function(_dereq_,module,exports){
var root = _dereq_(170);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"170":170}],25:[function(_dereq_,module,exports){
var root = _dereq_(170);

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;

},{"170":170}],26:[function(_dereq_,module,exports){
var getNative = _dereq_(134),
    root = _dereq_(170);

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;

},{"134":134,"170":170}],27:[function(_dereq_,module,exports){
/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `Map#set` because it doesn't return the map instance in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

module.exports = addMapEntry;

},{}],28:[function(_dereq_,module,exports){
/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
  set.add(value);
  return set;
}

module.exports = addSetEntry;

},{}],29:[function(_dereq_,module,exports){
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
  var length = args.length;
  switch (length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],30:[function(_dereq_,module,exports){
/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}

module.exports = arrayAggregator;

},{}],31:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],32:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEachRight` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEachRight(array, iteratee) {
  var length = array.length;

  while (length--) {
    if (iteratee(array[length], length, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEachRight;

},{}],33:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.every` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 */
function arrayEvery(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],34:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
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

},{}],35:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(73);

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  return !!array.length && baseIndexOf(array, value, 0) > -1;
}

module.exports = arrayIncludes;

},{"73":73}],36:[function(_dereq_,module,exports){
/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

module.exports = arrayIncludesWith;

},{}],37:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],38:[function(_dereq_,module,exports){
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

},{}],39:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],40:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.reduceRight` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the last element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduceRight(array, iteratee, accumulator, initAccum) {
  var length = array.length;
  if (initAccum && length) {
    accumulator = array[--length];
  }
  while (length--) {
    accumulator = iteratee(accumulator, array[length], length, array);
  }
  return accumulator;
}

module.exports = arrayReduceRight;

},{}],41:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],42:[function(_dereq_,module,exports){
var eq = _dereq_(202);

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

},{"202":202}],43:[function(_dereq_,module,exports){
var eq = _dereq_(202);

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
      (typeof key == 'number' && value === undefined && !(key in object))) {
    object[key] = value;
  }
}

module.exports = assignMergeValue;

},{"202":202}],44:[function(_dereq_,module,exports){
var eq = _dereq_(202);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
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
    object[key] = value;
  }
}

module.exports = assignValue;

},{"202":202}],45:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(48);

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the associative array.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function assocDelete(array, key) {
  var index = assocIndexOf(array, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = array.length - 1;
  if (index == lastIndex) {
    array.pop();
  } else {
    splice.call(array, index, 1);
  }
  return true;
}

module.exports = assocDelete;

},{"48":48}],46:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(48);

/**
 * Gets the associative array value for `key`.
 *
 * @private
 * @param {Array} array The array to query.
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function assocGet(array, key) {
  var index = assocIndexOf(array, key);
  return index < 0 ? undefined : array[index][1];
}

module.exports = assocGet;

},{"48":48}],47:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(48);

/**
 * Checks if an associative array value for `key` exists.
 *
 * @private
 * @param {Array} array The array to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function assocHas(array, key) {
  return assocIndexOf(array, key) > -1;
}

module.exports = assocHas;

},{"48":48}],48:[function(_dereq_,module,exports){
var eq = _dereq_(202);

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to search.
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

},{"202":202}],49:[function(_dereq_,module,exports){
var assocIndexOf = _dereq_(48);

/**
 * Sets the associative array `key` to `value`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 */
function assocSet(array, key, value) {
  var index = assocIndexOf(array, key);
  if (index < 0) {
    array.push([key, value]);
  } else {
    array[index][1] = value;
  }
}

module.exports = assocSet;

},{"48":48}],50:[function(_dereq_,module,exports){
var baseEach = _dereq_(57);

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

},{"57":57}],51:[function(_dereq_,module,exports){
var copyObject = _dereq_(120),
    keys = _dereq_(272);

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

},{"120":120,"272":272}],52:[function(_dereq_,module,exports){
var get = _dereq_(222);

/**
 * The base implementation of `_.at` without support for individual paths.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {string[]} paths The property paths of elements to pick.
 * @returns {Array} Returns the new array of picked elements.
 */
function baseAt(object, paths) {
  var index = -1,
      isNil = object == null,
      length = paths.length,
      result = Array(length);

  while (++index < length) {
    result[index] = isNil ? undefined : get(object, paths[index]);
  }
  return result;
}

module.exports = baseAt;

},{"222":222}],53:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.clamp` which doesn't coerce arguments to numbers.
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

},{}],54:[function(_dereq_,module,exports){
var Stack = _dereq_(23),
    arrayEach = _dereq_(31),
    assignValue = _dereq_(44),
    baseAssign = _dereq_(51),
    cloneBuffer = _dereq_(110),
    copyArray = _dereq_(119),
    copySymbols = _dereq_(121),
    getAllKeys = _dereq_(130),
    getTag = _dereq_(138),
    initCloneArray = _dereq_(146),
    initCloneByTag = _dereq_(147),
    initCloneObject = _dereq_(148),
    isArray = _dereq_(235),
    isBuffer = _dereq_(240),
    isHostObject = _dereq_(151),
    isObject = _dereq_(259),
    keys = _dereq_(272);

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
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {boolean} [isFull] Specify a clone including symbols.
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
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
      if (isHostObject(value)) {
        return object ? value : {};
      }
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
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

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys(value);
  }
  // Recursively populate clone (susceptible to call stack limits).
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;

},{"110":110,"119":119,"121":121,"130":130,"138":138,"146":146,"147":147,"148":148,"151":151,"23":23,"235":235,"240":240,"259":259,"272":272,"31":31,"44":44,"51":51}],55:[function(_dereq_,module,exports){
var isObject = _dereq_(259);

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(proto) {
  return isObject(proto) ? objectCreate(proto) : {};
}

module.exports = baseCreate;

},{"259":259}],56:[function(_dereq_,module,exports){
var SetCache = _dereq_(22),
    arrayIncludes = _dereq_(35),
    arrayIncludesWith = _dereq_(36),
    arrayMap = _dereq_(37),
    baseUnary = _dereq_(100),
    cacheHas = _dereq_(104);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap(values, baseUnary(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  }
  else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"100":100,"104":104,"22":22,"35":35,"36":36,"37":37}],57:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(65),
    createBaseEach = _dereq_(124);

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

},{"124":124,"65":65}],58:[function(_dereq_,module,exports){
var baseForOwnRight = _dereq_(66),
    createBaseEach = _dereq_(124);

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

},{"124":124,"66":66}],59:[function(_dereq_,module,exports){
var baseEach = _dereq_(57);

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

},{"57":57}],60:[function(_dereq_,module,exports){
var baseEach = _dereq_(57);

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

},{"57":57}],61:[function(_dereq_,module,exports){
/**
 * The base implementation of methods like `_.find` and `_.findKey`, without
 * support for iteratee shorthands, which iterates over `collection` using
 * `eachFunc`.
 *
 * @private
 * @param {Array|Object} collection The collection to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @param {boolean} [retKey] Specify returning the key of the found element
 *  instead of the element itself.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFind(collection, predicate, eachFunc, retKey) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = retKey ? key : value;
      return false;
    }
  });
  return result;
}

module.exports = baseFind;

},{}],62:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromRight) {
  var length = array.length,
      index = fromRight ? length : -1;

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],63:[function(_dereq_,module,exports){
var arrayPush = _dereq_(38),
    isFlattenable = _dereq_(149);

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

},{"149":149,"38":38}],64:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(125);

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

},{"125":125}],65:[function(_dereq_,module,exports){
var baseFor = _dereq_(64),
    keys = _dereq_(272);

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

},{"272":272,"64":64}],66:[function(_dereq_,module,exports){
var baseForRight = _dereq_(67),
    keys = _dereq_(272);

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

},{"272":272,"67":67}],67:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(125);

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

},{"125":125}],68:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(34),
    isFunction = _dereq_(248);

/**
 * The base implementation of `_.functions` which creates an array of
 * `object` function property names filtered from `props`.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} props The property names to filter.
 * @returns {Array} Returns the new array of filtered property names.
 */
function baseFunctions(object, props) {
  return arrayFilter(props, function(key) {
    return isFunction(object[key]);
  });
}

module.exports = baseFunctions;

},{"248":248,"34":34}],69:[function(_dereq_,module,exports){
var castPath = _dereq_(107),
    isKey = _dereq_(154);

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"107":107,"154":154}],70:[function(_dereq_,module,exports){
var arrayPush = _dereq_(38),
    isArray = _dereq_(235);

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
  return isArray(object)
    ? result
    : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

},{"235":235,"38":38}],71:[function(_dereq_,module,exports){
var getPrototype = _dereq_(135);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object, key) {
  // Avoid a bug in IE 10-11 where objects with a [[Prototype]] of `null`,
  // that are composed entirely of index properties, return `false` for
  // `hasOwnProperty` checks of them.
  return hasOwnProperty.call(object, key) ||
    (typeof object == 'object' && key in object && getPrototype(object) === null);
}

module.exports = baseHas;

},{"135":135}],72:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return key in Object(object);
}

module.exports = baseHasIn;

},{}],73:[function(_dereq_,module,exports){
var indexOfNaN = _dereq_(145);

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"145":145}],74:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(65);

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

},{"65":65}],75:[function(_dereq_,module,exports){
var apply = _dereq_(29),
    castPath = _dereq_(107),
    isKey = _dereq_(154),
    last = _dereq_(275),
    parent = _dereq_(168);

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
  if (!isKey(path, object)) {
    path = castPath(path);
    object = parent(object, path);
    path = last(path);
  }
  var func = object == null ? object : object[path];
  return func == null ? undefined : apply(func, object, args);
}

module.exports = baseInvoke;

},{"107":107,"154":154,"168":168,"275":275,"29":29}],76:[function(_dereq_,module,exports){
var baseIsEqualDeep = _dereq_(77),
    isObject = _dereq_(259),
    isObjectLike = _dereq_(260);

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {boolean} [bitmask] The bitmask of comparison flags.
 *  The bitmask may be composed of the following flags:
 *     1 - Unordered comparison
 *     2 - Partial comparison
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, bitmask, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
}

module.exports = baseIsEqual;

},{"259":259,"260":260,"77":77}],77:[function(_dereq_,module,exports){
var Stack = _dereq_(23),
    equalArrays = _dereq_(127),
    equalByTag = _dereq_(128),
    equalObjects = _dereq_(129),
    getTag = _dereq_(138),
    isArray = _dereq_(235),
    isHostObject = _dereq_(151),
    isTypedArray = _dereq_(267);

/** Used to compose bitmasks for comparison styles. */
var PARTIAL_COMPARE_FLAG = 2;

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
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
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
  var objIsObj = objTag == objectTag && !isHostObject(object),
      othIsObj = othTag == objectTag && !isHostObject(other),
      isSameTag = objTag == othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
}

module.exports = baseIsEqualDeep;

},{"127":127,"128":128,"129":129,"138":138,"151":151,"23":23,"235":235,"267":267}],78:[function(_dereq_,module,exports){
var Stack = _dereq_(23),
    baseIsEqual = _dereq_(76);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

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
            ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"23":23,"76":76}],79:[function(_dereq_,module,exports){
var baseMatches = _dereq_(83),
    baseMatchesProperty = _dereq_(84),
    identity = _dereq_(228),
    isArray = _dereq_(235),
    property = _dereq_(291);

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

},{"228":228,"235":235,"291":291,"83":83,"84":84}],80:[function(_dereq_,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = Object.keys;

/**
 * The base implementation of `_.keys` which doesn't skip the constructor
 * property of prototypes or treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  return nativeKeys(Object(object));
}

module.exports = baseKeys;

},{}],81:[function(_dereq_,module,exports){
var Reflect = _dereq_(20),
    iteratorToArray = _dereq_(158);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var enumerate = Reflect ? Reflect.enumerate : undefined,
    propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * The base implementation of `_.keysIn` which doesn't skip the constructor
 * property of prototypes or treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  object = object == null ? object : Object(object);

  var result = [];
  for (var key in object) {
    result.push(key);
  }
  return result;
}

// Fallback for IE < 9 with es6-shim.
if (enumerate && !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf')) {
  baseKeysIn = function(object) {
    return iteratorToArray(enumerate(object));
  };
}

module.exports = baseKeysIn;

},{"158":158,"20":20}],82:[function(_dereq_,module,exports){
var baseEach = _dereq_(57),
    isArrayLike = _dereq_(237);

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

},{"237":237,"57":57}],83:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(78),
    getMatchData = _dereq_(133),
    matchesStrictComparable = _dereq_(165);

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
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

},{"133":133,"165":165,"78":78}],84:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(76),
    get = _dereq_(222),
    hasIn = _dereq_(227),
    isKey = _dereq_(154),
    isStrictComparable = _dereq_(157),
    matchesStrictComparable = _dereq_(165);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(path, srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
  };
}

module.exports = baseMatchesProperty;

},{"154":154,"157":157,"165":165,"222":222,"227":227,"76":76}],85:[function(_dereq_,module,exports){
var Stack = _dereq_(23),
    arrayEach = _dereq_(31),
    assignMergeValue = _dereq_(43),
    baseMergeDeep = _dereq_(86),
    isArray = _dereq_(235),
    isObject = _dereq_(259),
    isTypedArray = _dereq_(267),
    keysIn = _dereq_(273);

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
  if (!(isArray(source) || isTypedArray(source))) {
    var props = keysIn(source);
  }
  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
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
  });
}

module.exports = baseMerge;

},{"23":23,"235":235,"259":259,"267":267,"273":273,"31":31,"43":43,"86":86}],86:[function(_dereq_,module,exports){
var assignMergeValue = _dereq_(43),
    baseClone = _dereq_(54),
    copyArray = _dereq_(119),
    isArguments = _dereq_(234),
    isArray = _dereq_(235),
    isArrayLikeObject = _dereq_(238),
    isFunction = _dereq_(248),
    isObject = _dereq_(259),
    isPlainObject = _dereq_(261),
    isTypedArray = _dereq_(267),
    toPlainObject = _dereq_(311);

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
    newValue = srcValue;
    if (isArray(srcValue) || isTypedArray(srcValue)) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
      else {
        newValue = objValue;
      }
    }
    else {
      isCommon = false;
    }
  }
  stack.set(srcValue, newValue);

  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
  }
  stack['delete'](srcValue);
  assignMergeValue(object, key, newValue);
}

module.exports = baseMergeDeep;

},{"119":119,"234":234,"235":235,"238":238,"248":248,"259":259,"261":261,"267":267,"311":311,"43":43,"54":54}],87:[function(_dereq_,module,exports){
var arrayMap = _dereq_(37),
    baseIteratee = _dereq_(79),
    baseMap = _dereq_(82),
    baseSortBy = _dereq_(97),
    baseUnary = _dereq_(100),
    compareMultiple = _dereq_(118),
    identity = _dereq_(228);

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

},{"100":100,"118":118,"228":228,"37":37,"79":79,"82":82,"97":97}],88:[function(_dereq_,module,exports){
var arrayReduce = _dereq_(39);

/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property identifiers to pick.
 * @returns {Object} Returns the new object.
 */
function basePick(object, props) {
  object = Object(object);
  return arrayReduce(props, function(result, key) {
    if (key in object) {
      result[key] = object[key];
    }
    return result;
  }, {});
}

module.exports = basePick;

},{"39":39}],89:[function(_dereq_,module,exports){
var getAllKeysIn = _dereq_(131);

/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */
function basePickBy(object, predicate) {
  var index = -1,
      props = getAllKeysIn(object),
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index],
        value = object[key];

    if (predicate(value, key)) {
      result[key] = value;
    }
  }
  return result;
}

module.exports = basePickBy;

},{"131":131}],90:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],91:[function(_dereq_,module,exports){
var baseGet = _dereq_(69);

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

module.exports = basePropertyDeep;

},{"69":69}],92:[function(_dereq_,module,exports){
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

},{}],93:[function(_dereq_,module,exports){
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

},{}],94:[function(_dereq_,module,exports){
var assignValue = _dereq_(44),
    castPath = _dereq_(107),
    isIndex = _dereq_(152),
    isKey = _dereq_(154),
    isObject = _dereq_(259);

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = path[index];
    if (isObject(nested)) {
      var newValue = value;
      if (index != lastIndex) {
        var objValue = nested[key];
        newValue = customizer ? customizer(objValue, key, nested) : undefined;
        if (newValue === undefined) {
          newValue = objValue == null
            ? (isIndex(path[index + 1]) ? [] : {})
            : objValue;
        }
      }
      assignValue(nested, key, newValue);
    }
    nested = nested[key];
  }
  return object;
}

module.exports = baseSet;

},{"107":107,"152":152,"154":154,"259":259,"44":44}],95:[function(_dereq_,module,exports){
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

},{}],96:[function(_dereq_,module,exports){
var baseEach = _dereq_(57);

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

},{"57":57}],97:[function(_dereq_,module,exports){
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

},{}],98:[function(_dereq_,module,exports){
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

},{}],99:[function(_dereq_,module,exports){
var arrayMap = _dereq_(37);

/**
 * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
 * of key-value pairs for `object` corresponding to the property names of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the new array of key-value pairs.
 */
function baseToPairs(object, props) {
  return arrayMap(props, function(key) {
    return [key, object[key]];
  });
}

module.exports = baseToPairs;

},{"37":37}],100:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.unary` without support for storing wrapper metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;

},{}],101:[function(_dereq_,module,exports){
var castPath = _dereq_(107),
    has = _dereq_(226),
    isKey = _dereq_(154),
    last = _dereq_(275),
    parent = _dereq_(168);

/**
 * The base implementation of `_.unset`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 */
function baseUnset(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);
  object = parent(object, path);
  var key = last(path);
  return (object != null && has(object, key)) ? delete object[key] : true;
}

module.exports = baseUnset;

},{"107":107,"154":154,"168":168,"226":226,"275":275}],102:[function(_dereq_,module,exports){
var baseGet = _dereq_(69),
    baseSet = _dereq_(94);

/**
 * The base implementation of `_.update`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to update.
 * @param {Function} updater The function to produce the updated value.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseUpdate(object, path, updater, customizer) {
  return baseSet(object, path, updater(baseGet(object, path)), customizer);
}

module.exports = baseUpdate;

},{"69":69,"94":94}],103:[function(_dereq_,module,exports){
var arrayMap = _dereq_(37);

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

},{"37":37}],104:[function(_dereq_,module,exports){
var isKeyable = _dereq_(155);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Checks if `value` is in `cache`.
 *
 * @private
 * @param {Object} cache The set cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function cacheHas(cache, value) {
  var map = cache.__data__;
  if (isKeyable(value)) {
    var data = map.__data__,
        hash = typeof value == 'string' ? data.string : data.hash;

    return hash[value] === HASH_UNDEFINED;
  }
  return map.has(value);
}

module.exports = cacheHas;

},{"155":155}],105:[function(_dereq_,module,exports){
var isKeyable = _dereq_(155);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the set cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var map = this.__data__;
  if (isKeyable(value)) {
    var data = map.__data__,
        hash = typeof value == 'string' ? data.string : data.hash;

    hash[value] = HASH_UNDEFINED;
  }
  else {
    map.set(value, HASH_UNDEFINED);
  }
}

module.exports = cachePush;

},{"155":155}],106:[function(_dereq_,module,exports){
var identity = _dereq_(228);

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

},{"228":228}],107:[function(_dereq_,module,exports){
var isArray = _dereq_(235),
    stringToPath = _dereq_(179);

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

module.exports = castPath;

},{"179":179,"235":235}],108:[function(_dereq_,module,exports){
/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

module.exports = checkGlobal;

},{}],109:[function(_dereq_,module,exports){
var Uint8Array = _dereq_(25);

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

},{"25":25}],110:[function(_dereq_,module,exports){
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
  var result = new buffer.constructor(buffer.length);
  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

},{}],111:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(109);

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

},{"109":109}],112:[function(_dereq_,module,exports){
var addMapEntry = _dereq_(27),
    arrayReduce = _dereq_(39),
    mapToArray = _dereq_(164);

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
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

module.exports = cloneMap;

},{"164":164,"27":27,"39":39}],113:[function(_dereq_,module,exports){
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

},{}],114:[function(_dereq_,module,exports){
var addSetEntry = _dereq_(28),
    arrayReduce = _dereq_(39),
    setToArray = _dereq_(171);

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
  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

module.exports = cloneSet;

},{"171":171,"28":28,"39":39}],115:[function(_dereq_,module,exports){
var Symbol = _dereq_(24);

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

},{"24":24}],116:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(109);

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

},{"109":109}],117:[function(_dereq_,module,exports){
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
    var valIsNull = value === null,
        valIsUndef = value === undefined,
        valIsReflexive = value === value;

    var othIsNull = other === null,
        othIsUndef = other === undefined,
        othIsReflexive = other === other;

    if ((value > other && !othIsNull) || !valIsReflexive ||
        (valIsNull && !othIsUndef && othIsReflexive) ||
        (valIsUndef && othIsReflexive)) {
      return 1;
    }
    if ((value < other && !valIsNull) || !othIsReflexive ||
        (othIsNull && !valIsUndef && valIsReflexive) ||
        (othIsUndef && valIsReflexive)) {
      return -1;
    }
  }
  return 0;
}

module.exports = compareAscending;

},{}],118:[function(_dereq_,module,exports){
var compareAscending = _dereq_(117);

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

},{"117":117}],119:[function(_dereq_,module,exports){
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

},{}],120:[function(_dereq_,module,exports){
var assignValue = _dereq_(44);

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
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : source[key];

    assignValue(object, key, newValue);
  }
  return object;
}

module.exports = copyObject;

},{"44":44}],121:[function(_dereq_,module,exports){
var copyObject = _dereq_(120),
    getSymbols = _dereq_(136);

/**
 * Copies own symbol properties of `source` to `object`.
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

},{"120":120,"136":136}],122:[function(_dereq_,module,exports){
var arrayAggregator = _dereq_(30),
    baseAggregator = _dereq_(50),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

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

    return func(collection, setter, baseIteratee(iteratee), accumulator);
  };
}

module.exports = createAggregator;

},{"235":235,"30":30,"50":50,"79":79}],123:[function(_dereq_,module,exports){
var isIterateeCall = _dereq_(153),
    rest = _dereq_(295);

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return rest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = typeof customizer == 'function'
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

},{"153":153,"295":295}],124:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(237);

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

},{"237":237}],125:[function(_dereq_,module,exports){
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

},{}],126:[function(_dereq_,module,exports){
var baseInverter = _dereq_(74);

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

},{"74":74}],127:[function(_dereq_,module,exports){
var arraySome = _dereq_(41);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
  var index = -1,
      isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      isUnordered = bitmask & UNORDERED_COMPARE_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked) {
    return stacked == other;
  }
  var result = true;
  stack.set(array, other);

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
    if (isUnordered) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue ||
              equalFunc(arrValue, othValue, customizer, bitmask, stack);
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, customizer, bitmask, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  return result;
}

module.exports = equalArrays;

},{"41":41}],128:[function(_dereq_,module,exports){
var Symbol = _dereq_(24),
    Uint8Array = _dereq_(25),
    equalArrays = _dereq_(127),
    mapToArray = _dereq_(164),
    setToArray = _dereq_(171);

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

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
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
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
      // Coerce dates and booleans to numbers, dates to milliseconds and
      // booleans to `1` or `0` treating invalid dates coerced to `NaN` as
      // not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object) ? other != +other : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/6.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;
      stack.set(object, other);

      // Recursively compare objects (susceptible to call stack limits).
      return equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

module.exports = equalByTag;

},{"127":127,"164":164,"171":171,"24":24,"25":25}],129:[function(_dereq_,module,exports){
var baseHas = _dereq_(71),
    keys = _dereq_(272);

/** Used to compose bitmasks for comparison styles. */
var PARTIAL_COMPARE_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
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
    if (!(isPartial ? key in other : baseHas(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);

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
          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
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
  return result;
}

module.exports = equalObjects;

},{"272":272,"71":71}],130:[function(_dereq_,module,exports){
var baseGetAllKeys = _dereq_(70),
    getSymbols = _dereq_(136),
    keys = _dereq_(272);

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

},{"136":136,"272":272,"70":70}],131:[function(_dereq_,module,exports){
var baseGetAllKeys = _dereq_(70),
    getSymbolsIn = _dereq_(137),
    keysIn = _dereq_(273);

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

},{"137":137,"273":273,"70":70}],132:[function(_dereq_,module,exports){
var baseProperty = _dereq_(90);

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a
 * [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792) that affects
 * Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"90":90}],133:[function(_dereq_,module,exports){
var isStrictComparable = _dereq_(157),
    toPairs = _dereq_(309);

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = toPairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"157":157,"309":309}],134:[function(_dereq_,module,exports){
var isNative = _dereq_(255);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"255":255}],135:[function(_dereq_,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetPrototype = Object.getPrototypeOf;

/**
 * Gets the `[[Prototype]]` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {null|Object} Returns the `[[Prototype]]`.
 */
function getPrototype(value) {
  return nativeGetPrototype(Object(value));
}

module.exports = getPrototype;

},{}],136:[function(_dereq_,module,exports){
/** Built-in value references. */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbol properties of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
function getSymbols(object) {
  // Coerce `object` to an object to avoid non-object errors in V8.
  // See https://bugs.chromium.org/p/v8/issues/detail?id=3443 for more details.
  return getOwnPropertySymbols(Object(object));
}

// Fallback for IE < 11.
if (!getOwnPropertySymbols) {
  getSymbols = function() {
    return [];
  };
}

module.exports = getSymbols;

},{}],137:[function(_dereq_,module,exports){
var arrayPush = _dereq_(38),
    getPrototype = _dereq_(135),
    getSymbols = _dereq_(136);

/** Built-in value references. */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbol properties
 * of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !getOwnPropertySymbols ? getSymbols : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;

},{"135":135,"136":136,"38":38}],138:[function(_dereq_,module,exports){
var DataView = _dereq_(15),
    Map = _dereq_(17),
    Promise = _dereq_(19),
    Set = _dereq_(21),
    WeakMap = _dereq_(26),
    toSource = _dereq_(181);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
function getTag(value) {
  return objectToString.call(value);
}

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge, and promises in Node.js.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

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

},{"15":15,"17":17,"181":181,"19":19,"21":21,"26":26}],139:[function(_dereq_,module,exports){
var castPath = _dereq_(107),
    isArguments = _dereq_(234),
    isArray = _dereq_(235),
    isIndex = _dereq_(152),
    isKey = _dereq_(154),
    isLength = _dereq_(250),
    isString = _dereq_(265);

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
  path = isKey(path, object) ? [path] : castPath(path);

  var result,
      index = -1,
      length = path.length;

  while (++index < length) {
    var key = path[index];
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result) {
    return result;
  }
  var length = object ? object.length : 0;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isString(object) || isArguments(object));
}

module.exports = hasPath;

},{"107":107,"152":152,"154":154,"234":234,"235":235,"250":250,"265":265}],140:[function(_dereq_,module,exports){
var hashHas = _dereq_(142);

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(hash, key) {
  return hashHas(hash, key) && delete hash[key];
}

module.exports = hashDelete;

},{"142":142}],141:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(167);

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
 * @param {Object} hash The hash to query.
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(hash, key) {
  if (nativeCreate) {
    var result = hash[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(hash, key) ? hash[key] : undefined;
}

module.exports = hashGet;

},{"167":167}],142:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(167);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @param {Object} hash The hash to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(hash, key) {
  return nativeCreate ? hash[key] !== undefined : hasOwnProperty.call(hash, key);
}

module.exports = hashHas;

},{"167":167}],143:[function(_dereq_,module,exports){
var nativeCreate = _dereq_(167);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 */
function hashSet(hash, key, value) {
  hash[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
}

module.exports = hashSet;

},{"167":167}],144:[function(_dereq_,module,exports){
var baseTimes = _dereq_(98),
    isArguments = _dereq_(234),
    isArray = _dereq_(235),
    isLength = _dereq_(250),
    isString = _dereq_(265);

/**
 * Creates an array of index keys for `object` values of arrays,
 * `arguments` objects, and strings, otherwise `null` is returned.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array|null} Returns index keys, else `null`.
 */
function indexKeys(object) {
  var length = object ? object.length : undefined;
  if (isLength(length) &&
      (isArray(object) || isString(object) || isArguments(object))) {
    return baseTimes(length, String);
  }
  return null;
}

module.exports = indexKeys;

},{"234":234,"235":235,"250":250,"265":265,"98":98}],145:[function(_dereq_,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],146:[function(_dereq_,module,exports){
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

},{}],147:[function(_dereq_,module,exports){
var cloneArrayBuffer = _dereq_(109),
    cloneDataView = _dereq_(111),
    cloneMap = _dereq_(112),
    cloneRegExp = _dereq_(113),
    cloneSet = _dereq_(114),
    cloneSymbol = _dereq_(115),
    cloneTypedArray = _dereq_(116);

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

},{"109":109,"111":111,"112":112,"113":113,"114":114,"115":115,"116":116}],148:[function(_dereq_,module,exports){
var baseCreate = _dereq_(55),
    getPrototype = _dereq_(135),
    isPrototype = _dereq_(156);

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

},{"135":135,"156":156,"55":55}],149:[function(_dereq_,module,exports){
var isArguments = _dereq_(234),
    isArray = _dereq_(235),
    isArrayLikeObject = _dereq_(238);

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArrayLikeObject(value) && (isArray(value) || isArguments(value));
}

module.exports = isFlattenable;

},{"234":234,"235":235,"238":238}],150:[function(_dereq_,module,exports){
var isArray = _dereq_(235),
    isFunction = _dereq_(248);

/**
 * Checks if `value` is a flattenable array and not a `_.matchesProperty`
 * iteratee shorthand.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenableIteratee(value) {
  return isArray(value) && !(value.length == 2 && !isFunction(value[0]));
}

module.exports = isFlattenableIteratee;

},{"235":235,"248":248}],151:[function(_dereq_,module,exports){
/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

module.exports = isHostObject;

},{}],152:[function(_dereq_,module,exports){
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
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],153:[function(_dereq_,module,exports){
var eq = _dereq_(202),
    isArrayLike = _dereq_(237),
    isIndex = _dereq_(152),
    isObject = _dereq_(259);

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

},{"152":152,"202":202,"237":237,"259":259}],154:[function(_dereq_,module,exports){
var isArray = _dereq_(235),
    isSymbol = _dereq_(266);

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
  var type = typeof value;
  if (type == 'number' || type == 'symbol') {
    return true;
  }
  return !isArray(value) &&
    (isSymbol(value) || reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object)));
}

module.exports = isKey;

},{"235":235,"266":266}],155:[function(_dereq_,module,exports){
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return type == 'number' || type == 'boolean' ||
    (type == 'string' && value != '__proto__') || value == null;
}

module.exports = isKeyable;

},{}],156:[function(_dereq_,module,exports){
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

},{}],157:[function(_dereq_,module,exports){
var isObject = _dereq_(259);

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

},{"259":259}],158:[function(_dereq_,module,exports){
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

},{}],159:[function(_dereq_,module,exports){
var Hash = _dereq_(16),
    Map = _dereq_(17);

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': Map ? new Map : [],
    'string': new Hash
  };
}

module.exports = mapClear;

},{"16":16,"17":17}],160:[function(_dereq_,module,exports){
var Map = _dereq_(17),
    assocDelete = _dereq_(45),
    hashDelete = _dereq_(140),
    isKeyable = _dereq_(155);

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapDelete(key) {
  var data = this.__data__;
  if (isKeyable(key)) {
    return hashDelete(typeof key == 'string' ? data.string : data.hash, key);
  }
  return Map ? data.map['delete'](key) : assocDelete(data.map, key);
}

module.exports = mapDelete;

},{"140":140,"155":155,"17":17,"45":45}],161:[function(_dereq_,module,exports){
var Map = _dereq_(17),
    assocGet = _dereq_(46),
    hashGet = _dereq_(141),
    isKeyable = _dereq_(155);

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapGet(key) {
  var data = this.__data__;
  if (isKeyable(key)) {
    return hashGet(typeof key == 'string' ? data.string : data.hash, key);
  }
  return Map ? data.map.get(key) : assocGet(data.map, key);
}

module.exports = mapGet;

},{"141":141,"155":155,"17":17,"46":46}],162:[function(_dereq_,module,exports){
var Map = _dereq_(17),
    assocHas = _dereq_(47),
    hashHas = _dereq_(142),
    isKeyable = _dereq_(155);

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapHas(key) {
  var data = this.__data__;
  if (isKeyable(key)) {
    return hashHas(typeof key == 'string' ? data.string : data.hash, key);
  }
  return Map ? data.map.has(key) : assocHas(data.map, key);
}

module.exports = mapHas;

},{"142":142,"155":155,"17":17,"47":47}],163:[function(_dereq_,module,exports){
var Map = _dereq_(17),
    assocSet = _dereq_(49),
    hashSet = _dereq_(143),
    isKeyable = _dereq_(155);

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
function mapSet(key, value) {
  var data = this.__data__;
  if (isKeyable(key)) {
    hashSet(typeof key == 'string' ? data.string : data.hash, key, value);
  } else if (Map) {
    data.map.set(key, value);
  } else {
    assocSet(data.map, key, value);
  }
  return this;
}

module.exports = mapSet;

},{"143":143,"155":155,"17":17,"49":49}],164:[function(_dereq_,module,exports){
/**
 * Converts `map` to an array.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the converted array.
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

},{}],165:[function(_dereq_,module,exports){
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new function.
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

},{}],166:[function(_dereq_,module,exports){
var baseMerge = _dereq_(85),
    isObject = _dereq_(259);

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
    baseMerge(objValue, srcValue, undefined, mergeDefaults, stack.set(srcValue, objValue));
  }
  return objValue;
}

module.exports = mergeDefaults;

},{"259":259,"85":85}],167:[function(_dereq_,module,exports){
var getNative = _dereq_(134);

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"134":134}],168:[function(_dereq_,module,exports){
var baseGet = _dereq_(69),
    baseSlice = _dereq_(95);

/**
 * Gets the parent value at `path` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path to get the parent value of.
 * @returns {*} Returns the parent value.
 */
function parent(object, path) {
  return path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
}

module.exports = parent;

},{"69":69,"95":95}],169:[function(_dereq_,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasComplexSymbol = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

module.exports = reHasComplexSymbol;

},{}],170:[function(_dereq_,module,exports){
(function (global){
var checkGlobal = _dereq_(108);

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

module.exports = root;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"108":108}],171:[function(_dereq_,module,exports){
/**
 * Converts `set` to an array.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the converted array.
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

},{}],172:[function(_dereq_,module,exports){
/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = { 'array': [], 'map': null };
}

module.exports = stackClear;

},{}],173:[function(_dereq_,module,exports){
var assocDelete = _dereq_(45);

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
      array = data.array;

  return array ? assocDelete(array, key) : data.map['delete'](key);
}

module.exports = stackDelete;

},{"45":45}],174:[function(_dereq_,module,exports){
var assocGet = _dereq_(46);

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
  var data = this.__data__,
      array = data.array;

  return array ? assocGet(array, key) : data.map.get(key);
}

module.exports = stackGet;

},{"46":46}],175:[function(_dereq_,module,exports){
var assocHas = _dereq_(47);

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
  var data = this.__data__,
      array = data.array;

  return array ? assocHas(array, key) : data.map.has(key);
}

module.exports = stackHas;

},{"47":47}],176:[function(_dereq_,module,exports){
var MapCache = _dereq_(18),
    assocSet = _dereq_(49);

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
  var data = this.__data__,
      array = data.array;

  if (array) {
    if (array.length < (LARGE_ARRAY_SIZE - 1)) {
      assocSet(array, key, value);
    } else {
      data.array = null;
      data.map = new MapCache(array);
    }
  }
  var map = data.map;
  if (map) {
    map.set(key, value);
  }
  return this;
}

module.exports = stackSet;

},{"18":18,"49":49}],177:[function(_dereq_,module,exports){
var reHasComplexSymbol = _dereq_(169);

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
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
var reComplexSymbol = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Gets the number of symbols in `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the string size.
 */
function stringSize(string) {
  if (!(string && reHasComplexSymbol.test(string))) {
    return string.length;
  }
  var result = reComplexSymbol.lastIndex = 0;
  while (reComplexSymbol.test(string)) {
    result++;
  }
  return result;
}

module.exports = stringSize;

},{"169":169}],178:[function(_dereq_,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
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
var reComplexSymbol = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return string.match(reComplexSymbol);
}

module.exports = stringToArray;

},{}],179:[function(_dereq_,module,exports){
var memoize = _dereq_(281),
    toString = _dereq_(313);

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  var result = [];
  toString(string).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

module.exports = stringToPath;

},{"281":281,"313":313}],180:[function(_dereq_,module,exports){
var isSymbol = _dereq_(266);

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(key) {
  return (typeof key == 'string' || isSymbol(key)) ? key : (key + '');
}

module.exports = toKey;

},{"266":266}],181:[function(_dereq_,module,exports){
/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
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

},{}],182:[function(_dereq_,module,exports){
var assignValue = _dereq_(44),
    copyObject = _dereq_(120),
    createAssigner = _dereq_(123),
    isArrayLike = _dereq_(237),
    isPrototype = _dereq_(156),
    keys = _dereq_(272);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

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
 * @example
 *
 * function Foo() {
 *   this.c = 3;
 * }
 *
 * function Bar() {
 *   this.e = 5;
 * }
 *
 * Foo.prototype.d = 4;
 * Bar.prototype.f = 6;
 *
 * _.assign({ 'a': 1 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3, 'e': 5 }
 */
var assign = createAssigner(function(object, source) {
  if (nonEnumShadows || isPrototype(source) || isArrayLike(source)) {
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

},{"120":120,"123":123,"156":156,"237":237,"272":272,"44":44}],183:[function(_dereq_,module,exports){
var assignValue = _dereq_(44),
    copyObject = _dereq_(120),
    createAssigner = _dereq_(123),
    isArrayLike = _dereq_(237),
    isPrototype = _dereq_(156),
    keysIn = _dereq_(273);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

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
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * function Bar() {
 *   this.d = 4;
 * }
 *
 * Foo.prototype.c = 3;
 * Bar.prototype.e = 5;
 *
 * _.assignIn({ 'a': 1 }, new Foo, new Bar);
 * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5 }
 */
var assignIn = createAssigner(function(object, source) {
  if (nonEnumShadows || isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keysIn(source), object);
    return;
  }
  for (var key in source) {
    assignValue(object, key, source[key]);
  }
});

module.exports = assignIn;

},{"120":120,"123":123,"156":156,"237":237,"273":273,"44":44}],184:[function(_dereq_,module,exports){
var copyObject = _dereq_(120),
    createAssigner = _dereq_(123),
    keysIn = _dereq_(273);

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

},{"120":120,"123":123,"273":273}],185:[function(_dereq_,module,exports){
var copyObject = _dereq_(120),
    createAssigner = _dereq_(123),
    keys = _dereq_(272);

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

},{"120":120,"123":123,"272":272}],186:[function(_dereq_,module,exports){
var baseAt = _dereq_(52),
    baseFlatten = _dereq_(63),
    rest = _dereq_(295);

/**
 * Creates an array of values corresponding to `paths` of `object`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {...(string|string[])} [paths] The property paths of elements to pick.
 * @returns {Array} Returns the new array of picked elements.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
 *
 * _.at(object, ['a[0].b.c', 'a[1]']);
 * // => [3, 4]
 *
 * _.at(['a', 'b', 'c'], 0, 2);
 * // => ['a', 'c']
 */
var at = rest(function(object, paths) {
  return baseAt(object, baseFlatten(paths, 1));
});

module.exports = at;

},{"295":295,"52":52,"63":63}],187:[function(_dereq_,module,exports){
var isArray = _dereq_(235);

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

},{"235":235}],188:[function(_dereq_,module,exports){
var baseClone = _dereq_(54);

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
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return baseClone(value, false, true);
}

module.exports = clone;

},{"54":54}],189:[function(_dereq_,module,exports){
var baseClone = _dereq_(54);

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, true, true);
}

module.exports = cloneDeep;

},{"54":54}],190:[function(_dereq_,module,exports){
var baseClone = _dereq_(54);

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
  return baseClone(value, true, true, customizer);
}

module.exports = cloneDeepWith;

},{"54":54}],191:[function(_dereq_,module,exports){
var baseClone = _dereq_(54);

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
  return baseClone(value, false, true, customizer);
}

module.exports = cloneWith;

},{"54":54}],192:[function(_dereq_,module,exports){
module.exports = {
  'at': _dereq_(186),
  'countBy': _dereq_(194),
  'each': _dereq_(198),
  'eachRight': _dereq_(199),
  'every': _dereq_(203),
  'filter': _dereq_(206),
  'find': _dereq_(207),
  'findLast': _dereq_(209),
  'flatMap': _dereq_(211),
  'flatMapDeep': _dereq_(212),
  'flatMapDepth': _dereq_(213),
  'forEach': _dereq_(214),
  'forEachRight': _dereq_(215),
  'groupBy': _dereq_(223),
  'includes': _dereq_(229),
  'invokeMap': _dereq_(233),
  'keyBy': _dereq_(271),
  'map': _dereq_(278),
  'orderBy': _dereq_(287),
  'partition': _dereq_(288),
  'reduce': _dereq_(292),
  'reduceRight': _dereq_(293),
  'reject': _dereq_(294),
  'sample': _dereq_(297),
  'sampleSize': _dereq_(298),
  'shuffle': _dereq_(301),
  'size': _dereq_(302),
  'some': _dereq_(303),
  'sortBy': _dereq_(304)
};

},{"186":186,"194":194,"198":198,"199":199,"203":203,"206":206,"207":207,"209":209,"211":211,"212":212,"213":213,"214":214,"215":215,"223":223,"229":229,"233":233,"271":271,"278":278,"287":287,"288":288,"292":292,"293":293,"294":294,"297":297,"298":298,"301":301,"302":302,"303":303,"304":304}],193:[function(_dereq_,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var getter = _.constant(object);
 *
 * getter() === object;
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],194:[function(_dereq_,module,exports){
var createAggregator = _dereq_(122);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * _.countBy([6.1, 4.2, 6.3], Math.floor);
 * // => { '4': 1, '6': 2 }
 *
 * _.countBy(['one', 'two', 'three'], 'length');
 * // => { '3': 2, '5': 1 }
 */
var countBy = createAggregator(function(result, value, key) {
  hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
});

module.exports = countBy;

},{"122":122}],195:[function(_dereq_,module,exports){
var baseAssign = _dereq_(51),
    baseCreate = _dereq_(55);

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
  return properties ? baseAssign(result, properties) : result;
}

module.exports = create;

},{"51":51,"55":55}],196:[function(_dereq_,module,exports){
var apply = _dereq_(29),
    assignInDefaults = _dereq_(42),
    assignInWith = _dereq_(184),
    rest = _dereq_(295);

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
 * @example
 *
 * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var defaults = rest(function(args) {
  args.push(undefined, assignInDefaults);
  return apply(assignInWith, undefined, args);
});

module.exports = defaults;

},{"184":184,"29":29,"295":295,"42":42}],197:[function(_dereq_,module,exports){
var apply = _dereq_(29),
    mergeDefaults = _dereq_(166),
    mergeWith = _dereq_(283),
    rest = _dereq_(295);

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
 * @example
 *
 * _.defaultsDeep({ 'user': { 'name': 'barney' } }, { 'user': { 'name': 'fred', 'age': 36 } });
 * // => { 'user': { 'name': 'barney', 'age': 36 } }
 *
 */
var defaultsDeep = rest(function(args) {
  args.push(undefined, mergeDefaults);
  return apply(mergeWith, undefined, args);
});

module.exports = defaultsDeep;

},{"166":166,"283":283,"29":29,"295":295}],198:[function(_dereq_,module,exports){
module.exports = _dereq_(214);

},{"214":214}],199:[function(_dereq_,module,exports){
module.exports = _dereq_(215);

},{"215":215}],200:[function(_dereq_,module,exports){
module.exports = _dereq_(309);

},{"309":309}],201:[function(_dereq_,module,exports){
module.exports = _dereq_(310);

},{"310":310}],202:[function(_dereq_,module,exports){
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
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
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
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

},{}],203:[function(_dereq_,module,exports){
var arrayEvery = _dereq_(33),
    baseEvery = _dereq_(59),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235),
    isIterateeCall = _dereq_(153);

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`.
 * Iteration is stopped once `predicate` returns falsey. The predicate is
 * invoked with three arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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

},{"153":153,"235":235,"33":33,"59":59,"79":79}],204:[function(_dereq_,module,exports){
module.exports = _dereq_(183);

},{"183":183}],205:[function(_dereq_,module,exports){
module.exports = _dereq_(184);

},{"184":184}],206:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(34),
    baseFilter = _dereq_(60),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
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

},{"235":235,"34":34,"60":60,"79":79}],207:[function(_dereq_,module,exports){
var baseEach = _dereq_(57),
    baseFind = _dereq_(61),
    baseFindIndex = _dereq_(62),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to search.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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
function find(collection, predicate) {
  predicate = baseIteratee(predicate, 3);
  if (isArray(collection)) {
    var index = baseFindIndex(collection, predicate);
    return index > -1 ? collection[index] : undefined;
  }
  return baseFind(collection, predicate, baseEach);
}

module.exports = find;

},{"235":235,"57":57,"61":61,"62":62,"79":79}],208:[function(_dereq_,module,exports){
var baseFind = _dereq_(61),
    baseForOwn = _dereq_(65),
    baseIteratee = _dereq_(79);

/**
 * This method is like `_.find` except that it returns the key of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Object
 * @param {Object} object The object to search.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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
  return baseFind(object, baseIteratee(predicate, 3), baseForOwn, true);
}

module.exports = findKey;

},{"61":61,"65":65,"79":79}],209:[function(_dereq_,module,exports){
var baseEachRight = _dereq_(58),
    baseFind = _dereq_(61),
    baseFindIndex = _dereq_(62),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

/**
 * This method is like `_.find` except that it iterates over elements of
 * `collection` from right to left.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Collection
 * @param {Array|Object} collection The collection to search.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * _.findLast([1, 2, 3, 4], function(n) {
 *   return n % 2 == 1;
 * });
 * // => 3
 */
function findLast(collection, predicate) {
  predicate = baseIteratee(predicate, 3);
  if (isArray(collection)) {
    var index = baseFindIndex(collection, predicate, true);
    return index > -1 ? collection[index] : undefined;
  }
  return baseFind(collection, predicate, baseEachRight);
}

module.exports = findLast;

},{"235":235,"58":58,"61":61,"62":62,"79":79}],210:[function(_dereq_,module,exports){
var baseFind = _dereq_(61),
    baseForOwnRight = _dereq_(66),
    baseIteratee = _dereq_(79);

/**
 * This method is like `_.findKey` except that it iterates over elements of
 * a collection in the opposite order.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Object
 * @param {Object} object The object to search.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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
  return baseFind(object, baseIteratee(predicate, 3), baseForOwnRight, true);
}

module.exports = findLastKey;

},{"61":61,"66":66,"79":79}],211:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(63),
    map = _dereq_(278);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
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

},{"278":278,"63":63}],212:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(63),
    map = _dereq_(278);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
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

},{"278":278,"63":63}],213:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(63),
    map = _dereq_(278),
    toInteger = _dereq_(306);

/**
 * This method is like `_.flatMap` except that it recursively flattens the
 * mapped results up to `depth` times.
 *
 * @static
 * @memberOf _
 * @since 4.7.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
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

},{"278":278,"306":306,"63":63}],214:[function(_dereq_,module,exports){
var arrayEach = _dereq_(31),
    baseEach = _dereq_(57),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

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
 * @example
 *
 * _([1, 2]).forEach(function(value) {
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
  return (typeof iteratee == 'function' && isArray(collection))
    ? arrayEach(collection, iteratee)
    : baseEach(collection, baseIteratee(iteratee));
}

module.exports = forEach;

},{"235":235,"31":31,"57":57,"79":79}],215:[function(_dereq_,module,exports){
var arrayEachRight = _dereq_(32),
    baseEachRight = _dereq_(58),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

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
 * @example
 *
 * _.forEachRight([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `2` then `1`.
 */
function forEachRight(collection, iteratee) {
  return (typeof iteratee == 'function' && isArray(collection))
    ? arrayEachRight(collection, iteratee)
    : baseEachRight(collection, baseIteratee(iteratee));
}

module.exports = forEachRight;

},{"235":235,"32":32,"58":58,"79":79}],216:[function(_dereq_,module,exports){
var baseFor = _dereq_(64),
    baseIteratee = _dereq_(79),
    keysIn = _dereq_(273);

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
    : baseFor(object, baseIteratee(iteratee), keysIn);
}

module.exports = forIn;

},{"273":273,"64":64,"79":79}],217:[function(_dereq_,module,exports){
var baseForRight = _dereq_(67),
    baseIteratee = _dereq_(79),
    keysIn = _dereq_(273);

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
    : baseForRight(object, baseIteratee(iteratee), keysIn);
}

module.exports = forInRight;

},{"273":273,"67":67,"79":79}],218:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(65),
    baseIteratee = _dereq_(79);

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
  return object && baseForOwn(object, baseIteratee(iteratee));
}

module.exports = forOwn;

},{"65":65,"79":79}],219:[function(_dereq_,module,exports){
var baseForOwnRight = _dereq_(66),
    baseIteratee = _dereq_(79);

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
  return object && baseForOwnRight(object, baseIteratee(iteratee));
}

module.exports = forOwnRight;

},{"66":66,"79":79}],220:[function(_dereq_,module,exports){
var baseFunctions = _dereq_(68),
    keys = _dereq_(272);

/**
 * Creates an array of function property names from own enumerable properties
 * of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the new array of property names.
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

},{"272":272,"68":68}],221:[function(_dereq_,module,exports){
var baseFunctions = _dereq_(68),
    keysIn = _dereq_(273);

/**
 * Creates an array of function property names from own and inherited
 * enumerable properties of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the new array of property names.
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

},{"273":273,"68":68}],222:[function(_dereq_,module,exports){
var baseGet = _dereq_(69);

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is used in its place.
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

},{"69":69}],223:[function(_dereq_,module,exports){
var createAggregator = _dereq_(122);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The iteratee to transform keys.
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
    result[key] = [value];
  }
});

module.exports = groupBy;

},{"122":122}],224:[function(_dereq_,module,exports){
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
function gt(value, other) {
  return value > other;
}

module.exports = gt;

},{}],225:[function(_dereq_,module,exports){
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
function gte(value, other) {
  return value >= other;
}

module.exports = gte;

},{}],226:[function(_dereq_,module,exports){
var baseHas = _dereq_(71),
    hasPath = _dereq_(139);

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

},{"139":139,"71":71}],227:[function(_dereq_,module,exports){
var baseHasIn = _dereq_(72),
    hasPath = _dereq_(139);

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

},{"139":139,"72":72}],228:[function(_dereq_,module,exports){
/**
 * This method returns the first argument given to it.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],229:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(73),
    isArrayLike = _dereq_(237),
    isString = _dereq_(265),
    toInteger = _dereq_(306),
    values = _dereq_(318);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * is used for equality comparisons. If `fromIndex` is negative, it's used as
 * the offset from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
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
 * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
 * // => true
 *
 * _.includes('pebbles', 'eb');
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

},{"237":237,"265":265,"306":306,"318":318,"73":73}],230:[function(_dereq_,module,exports){
var constant = _dereq_(193),
    createInverter = _dereq_(126),
    identity = _dereq_(228);

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

},{"126":126,"193":193,"228":228}],231:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    createInverter = _dereq_(126);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The iteratee invoked per element.
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

},{"126":126,"79":79}],232:[function(_dereq_,module,exports){
var baseInvoke = _dereq_(75),
    rest = _dereq_(295);

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
var invoke = rest(baseInvoke);

module.exports = invoke;

},{"295":295,"75":75}],233:[function(_dereq_,module,exports){
var apply = _dereq_(29),
    baseEach = _dereq_(57),
    baseInvoke = _dereq_(75),
    isArrayLike = _dereq_(237),
    isKey = _dereq_(154),
    rest = _dereq_(295);

/**
 * Invokes the method at `path` of each element in `collection`, returning
 * an array of the results of each invoked method. Any additional arguments
 * are provided to each invoked method. If `methodName` is a function, it's
 * invoked for and `this` bound to, each element in `collection`.
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
var invokeMap = rest(function(collection, path, args) {
  var index = -1,
      isFunc = typeof path == 'function',
      isProp = isKey(path),
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value) {
    var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
    result[++index] = func ? apply(func, value, args) : baseInvoke(value, path, args);
  });
  return result;
});

module.exports = invokeMap;

},{"154":154,"237":237,"29":29,"295":295,"57":57,"75":75}],234:[function(_dereq_,module,exports){
var isArrayLikeObject = _dereq_(238);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

module.exports = isArguments;

},{"238":238}],235:[function(_dereq_,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @type {Function}
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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

},{}],236:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

var arrayBufferTag = '[object ArrayBuffer]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as an `ArrayBuffer` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isArrayBuffer(new ArrayBuffer(2));
 * // => true
 *
 * _.isArrayBuffer(new Array(2));
 * // => false
 */
function isArrayBuffer(value) {
  return isObjectLike(value) && objectToString.call(value) == arrayBufferTag;
}

module.exports = isArrayBuffer;

},{"260":260}],237:[function(_dereq_,module,exports){
var getLength = _dereq_(132),
    isFunction = _dereq_(248),
    isLength = _dereq_(250);

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
  return value != null && isLength(getLength(value)) && !isFunction(value);
}

module.exports = isArrayLike;

},{"132":132,"248":248,"250":250}],238:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(237),
    isObjectLike = _dereq_(260);

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

},{"237":237,"260":260}],239:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var boolTag = '[object Boolean]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
    (isObjectLike(value) && objectToString.call(value) == boolTag);
}

module.exports = isBoolean;

},{"260":260}],240:[function(_dereq_,module,exports){
var constant = _dereq_(193),
    root = _dereq_(170);

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = (freeModule && freeModule.exports === freeExports)
  ? freeExports
  : undefined;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

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
var isBuffer = !Buffer ? constant(false) : function(value) {
  return value instanceof Buffer;
};

module.exports = isBuffer;

},{"170":170,"193":193}],241:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var dateTag = '[object Date]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Date` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isDate(new Date);
 * // => true
 *
 * _.isDate('Mon April 23 2012');
 * // => false
 */
function isDate(value) {
  return isObjectLike(value) && objectToString.call(value) == dateTag;
}

module.exports = isDate;

},{"260":260}],242:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260),
    isPlainObject = _dereq_(261);

/**
 * Checks if `value` is likely a DOM element.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a DOM element,
 *  else `false`.
 * @example
 *
 * _.isElement(document.body);
 * // => true
 *
 * _.isElement('<body>');
 * // => false
 */
function isElement(value) {
  return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
}

module.exports = isElement;

},{"260":260,"261":261}],243:[function(_dereq_,module,exports){
var getTag = _dereq_(138),
    isArguments = _dereq_(234),
    isArray = _dereq_(235),
    isArrayLike = _dereq_(237),
    isBuffer = _dereq_(240),
    isFunction = _dereq_(248),
    isObjectLike = _dereq_(260),
    isString = _dereq_(265),
    keys = _dereq_(272);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

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
  if (isArrayLike(value) &&
      (isArray(value) || isString(value) || isFunction(value.splice) ||
        isArguments(value) || isBuffer(value))) {
    return !value.length;
  }
  if (isObjectLike(value)) {
    var tag = getTag(value);
    if (tag == mapTag || tag == setTag) {
      return !value.size;
    }
  }
  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return !(nonEnumShadows && keys(value).length);
}

module.exports = isEmpty;

},{"138":138,"234":234,"235":235,"237":237,"240":240,"248":248,"260":260,"265":265,"272":272}],244:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(76);

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
 * @returns {boolean} Returns `true` if the values are equivalent,
 *  else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
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

},{"76":76}],245:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(76);

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
 * @returns {boolean} Returns `true` if the values are equivalent,
 *  else `false`.
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
  return result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqualWith;

},{"76":76}],246:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var errorTag = '[object Error]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
 * `SyntaxError`, `TypeError`, or `URIError` object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an error object,
 *  else `false`.
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
  return (objectToString.call(value) == errorTag) ||
    (typeof value.message == 'string' && typeof value.name == 'string');
}

module.exports = isError;

},{"260":260}],247:[function(_dereq_,module,exports){
var root = _dereq_(170);

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
 * @returns {boolean} Returns `true` if `value` is a finite number,
 *  else `false`.
 * @example
 *
 * _.isFinite(3);
 * // => true
 *
 * _.isFinite(Number.MAX_VALUE);
 * // => true
 *
 * _.isFinite(3.14);
 * // => true
 *
 * _.isFinite(Infinity);
 * // => false
 */
function isFinite(value) {
  return typeof value == 'number' && nativeIsFinite(value);
}

module.exports = isFinite;

},{"170":170}],248:[function(_dereq_,module,exports){
var isObject = _dereq_(259);

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"259":259}],249:[function(_dereq_,module,exports){
var toInteger = _dereq_(306);

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

},{"306":306}],250:[function(_dereq_,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length,
 *  else `false`.
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

},{}],251:[function(_dereq_,module,exports){
var getTag = _dereq_(138),
    isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
function isMap(value) {
  return isObjectLike(value) && getTag(value) == mapTag;
}

module.exports = isMap;

},{"138":138,"260":260}],252:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(78),
    getMatchData = _dereq_(133);

/**
 * Performs a partial deep comparison between `object` and `source` to
 * determine if `object` contains equivalent property values. This method is
 * equivalent to a `_.matches` function when `source` is partially applied.
 *
 * **Note:** This method supports comparing the same values as `_.isEqual`.
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
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.isMatch(object, { 'age': 40 });
 * // => true
 *
 * _.isMatch(object, { 'age': 36 });
 * // => false
 */
function isMatch(object, source) {
  return object === source || baseIsMatch(object, source, getMatchData(source));
}

module.exports = isMatch;

},{"133":133,"78":78}],253:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(78),
    getMatchData = _dereq_(133);

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

},{"133":133,"78":78}],254:[function(_dereq_,module,exports){
var isNumber = _dereq_(258);

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

},{"258":258}],255:[function(_dereq_,module,exports){
var isFunction = _dereq_(248),
    isHostObject = _dereq_(151),
    isObject = _dereq_(259),
    toSource = _dereq_(181);

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
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
  if (!isObject(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = isNative;

},{"151":151,"181":181,"248":248,"259":259}],256:[function(_dereq_,module,exports){
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

},{}],257:[function(_dereq_,module,exports){
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

},{}],258:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
    (isObjectLike(value) && objectToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"260":260}],259:[function(_dereq_,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],260:[function(_dereq_,module,exports){
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
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],261:[function(_dereq_,module,exports){
var getPrototype = _dereq_(135),
    isHostObject = _dereq_(151),
    isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object,
 *  else `false`.
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
  if (!isObjectLike(value) ||
      objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

module.exports = isPlainObject;

},{"135":135,"151":151,"260":260}],262:[function(_dereq_,module,exports){
var isObject = _dereq_(259);

/** `Object#toString` result references. */
var regexpTag = '[object RegExp]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `RegExp` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isRegExp(/abc/);
 * // => true
 *
 * _.isRegExp('/abc/');
 * // => false
 */
function isRegExp(value) {
  return isObject(value) && objectToString.call(value) == regexpTag;
}

module.exports = isRegExp;

},{"259":259}],263:[function(_dereq_,module,exports){
var isInteger = _dereq_(249);

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
 * @returns {boolean} Returns `true` if `value` is a safe integer,
 *  else `false`.
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

},{"249":249}],264:[function(_dereq_,module,exports){
var getTag = _dereq_(138),
    isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
function isSet(value) {
  return isObjectLike(value) && getTag(value) == setTag;
}

module.exports = isSet;

},{"138":138,"260":260}],265:[function(_dereq_,module,exports){
var isArray = _dereq_(235),
    isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
}

module.exports = isString;

},{"235":235,"260":260}],266:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

module.exports = isSymbol;

},{"260":260}],267:[function(_dereq_,module,exports){
var isLength = _dereq_(250),
    isObjectLike = _dereq_(260);

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

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

module.exports = isTypedArray;

},{"250":250,"260":260}],268:[function(_dereq_,module,exports){
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

},{}],269:[function(_dereq_,module,exports){
var getTag = _dereq_(138),
    isObjectLike = _dereq_(260);

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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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

},{"138":138,"260":260}],270:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(260);

/** `Object#toString` result references. */
var weakSetTag = '[object WeakSet]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `WeakSet` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isWeakSet(new WeakSet);
 * // => true
 *
 * _.isWeakSet(new Set);
 * // => false
 */
function isWeakSet(value) {
  return isObjectLike(value) && objectToString.call(value) == weakSetTag;
}

module.exports = isWeakSet;

},{"260":260}],271:[function(_dereq_,module,exports){
var createAggregator = _dereq_(122);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The iteratee to transform keys.
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
  result[key] = value;
});

module.exports = keyBy;

},{"122":122}],272:[function(_dereq_,module,exports){
var baseHas = _dereq_(71),
    baseKeys = _dereq_(80),
    indexKeys = _dereq_(144),
    isArrayLike = _dereq_(237),
    isIndex = _dereq_(152),
    isPrototype = _dereq_(156);

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
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
  var isProto = isPrototype(object);
  if (!(isProto || isArrayLike(object))) {
    return baseKeys(object);
  }
  var indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  for (var key in object) {
    if (baseHas(object, key) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(isProto && key == 'constructor')) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keys;

},{"144":144,"152":152,"156":156,"237":237,"71":71,"80":80}],273:[function(_dereq_,module,exports){
var baseKeysIn = _dereq_(81),
    indexKeys = _dereq_(144),
    isIndex = _dereq_(152),
    isPrototype = _dereq_(156);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

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
  var index = -1,
      isProto = isPrototype(object),
      props = baseKeysIn(object),
      propsLength = props.length,
      indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  while (++index < propsLength) {
    var key = props[index];
    if (!(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"144":144,"152":152,"156":156,"81":81}],274:[function(_dereq_,module,exports){
module.exports = {
  'castArray': _dereq_(187),
  'clone': _dereq_(188),
  'cloneDeep': _dereq_(189),
  'cloneDeepWith': _dereq_(190),
  'cloneWith': _dereq_(191),
  'eq': _dereq_(202),
  'gt': _dereq_(224),
  'gte': _dereq_(225),
  'isArguments': _dereq_(234),
  'isArray': _dereq_(235),
  'isArrayBuffer': _dereq_(236),
  'isArrayLike': _dereq_(237),
  'isArrayLikeObject': _dereq_(238),
  'isBoolean': _dereq_(239),
  'isBuffer': _dereq_(240),
  'isDate': _dereq_(241),
  'isElement': _dereq_(242),
  'isEmpty': _dereq_(243),
  'isEqual': _dereq_(244),
  'isEqualWith': _dereq_(245),
  'isError': _dereq_(246),
  'isFinite': _dereq_(247),
  'isFunction': _dereq_(248),
  'isInteger': _dereq_(249),
  'isLength': _dereq_(250),
  'isMap': _dereq_(251),
  'isMatch': _dereq_(252),
  'isMatchWith': _dereq_(253),
  'isNaN': _dereq_(254),
  'isNative': _dereq_(255),
  'isNil': _dereq_(256),
  'isNull': _dereq_(257),
  'isNumber': _dereq_(258),
  'isObject': _dereq_(259),
  'isObjectLike': _dereq_(260),
  'isPlainObject': _dereq_(261),
  'isRegExp': _dereq_(262),
  'isSafeInteger': _dereq_(263),
  'isSet': _dereq_(264),
  'isString': _dereq_(265),
  'isSymbol': _dereq_(266),
  'isTypedArray': _dereq_(267),
  'isUndefined': _dereq_(268),
  'isWeakMap': _dereq_(269),
  'isWeakSet': _dereq_(270),
  'lt': _dereq_(276),
  'lte': _dereq_(277),
  'toArray': _dereq_(305),
  'toInteger': _dereq_(306),
  'toLength': _dereq_(307),
  'toNumber': _dereq_(308),
  'toPlainObject': _dereq_(311),
  'toSafeInteger': _dereq_(312),
  'toString': _dereq_(313)
};

},{"187":187,"188":188,"189":189,"190":190,"191":191,"202":202,"224":224,"225":225,"234":234,"235":235,"236":236,"237":237,"238":238,"239":239,"240":240,"241":241,"242":242,"243":243,"244":244,"245":245,"246":246,"247":247,"248":248,"249":249,"250":250,"251":251,"252":252,"253":253,"254":254,"255":255,"256":256,"257":257,"258":258,"259":259,"260":260,"261":261,"262":262,"263":263,"264":264,"265":265,"266":266,"267":267,"268":268,"269":269,"270":270,"276":276,"277":277,"305":305,"306":306,"307":307,"308":308,"311":311,"312":312,"313":313}],275:[function(_dereq_,module,exports){
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
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],276:[function(_dereq_,module,exports){
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
function lt(value, other) {
  return value < other;
}

module.exports = lt;

},{}],277:[function(_dereq_,module,exports){
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
function lte(value, other) {
  return value <= other;
}

module.exports = lte;

},{}],278:[function(_dereq_,module,exports){
var arrayMap = _dereq_(37),
    baseIteratee = _dereq_(79),
    baseMap = _dereq_(82),
    isArray = _dereq_(235);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
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

},{"235":235,"37":37,"79":79,"82":82}],279:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(65),
    baseIteratee = _dereq_(79);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
 * @returns {Object} Returns the new mapped object.
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
    result[iteratee(value, key, object)] = value;
  });
  return result;
}

module.exports = mapKeys;

},{"65":65,"79":79}],280:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(65),
    baseIteratee = _dereq_(79);

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
 * @param {Array|Function|Object|string} [iteratee=_.identity]
 *  The function invoked per iteration.
 * @returns {Object} Returns the new mapped object.
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
    result[key] = iteratee(value, key, object);
  });
  return result;
}

module.exports = mapValues;

},{"65":65,"79":79}],281:[function(_dereq_,module,exports){
var MapCache = _dereq_(18);

/** Used as the `TypeError` message for "Functions" methods. */
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
 * [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoizing function.
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
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
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
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"18":18}],282:[function(_dereq_,module,exports){
var baseMerge = _dereq_(85),
    createAssigner = _dereq_(123);

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively.Other objects and value types are overridden by
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
 * var users = {
 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
 * };
 *
 * var ages = {
 *   'data': [{ 'age': 36 }, { 'age': 40 }]
 * };
 *
 * _.merge(users, ages);
 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

module.exports = merge;

},{"123":123,"85":85}],283:[function(_dereq_,module,exports){
var baseMerge = _dereq_(85),
    createAssigner = _dereq_(123);

/**
 * This method is like `_.merge` except that it accepts `customizer` which
 * is invoked to produce the merged values of the destination and source
 * properties. If `customizer` returns `undefined`, merging is handled by the
 * method instead. The `customizer` is invoked with seven arguments:
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
 * var object = {
 *   'fruits': ['apple'],
 *   'vegetables': ['beet']
 * };
 *
 * var other = {
 *   'fruits': ['banana'],
 *   'vegetables': ['carrot']
 * };
 *
 * _.mergeWith(object, other, customizer);
 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
 */
var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});

module.exports = mergeWith;

},{"123":123,"85":85}],284:[function(_dereq_,module,exports){
module.exports = {
  'assign': _dereq_(182),
  'assignIn': _dereq_(183),
  'assignInWith': _dereq_(184),
  'assignWith': _dereq_(185),
  'create': _dereq_(195),
  'defaults': _dereq_(196),
  'defaultsDeep': _dereq_(197),
  'entries': _dereq_(200),
  'entriesIn': _dereq_(201),
  'extend': _dereq_(204),
  'extendWith': _dereq_(205),
  'findKey': _dereq_(208),
  'findLastKey': _dereq_(210),
  'forIn': _dereq_(216),
  'forInRight': _dereq_(217),
  'forOwn': _dereq_(218),
  'forOwnRight': _dereq_(219),
  'functions': _dereq_(220),
  'functionsIn': _dereq_(221),
  'get': _dereq_(222),
  'has': _dereq_(226),
  'hasIn': _dereq_(227),
  'invert': _dereq_(230),
  'invertBy': _dereq_(231),
  'invoke': _dereq_(232),
  'keys': _dereq_(272),
  'keysIn': _dereq_(273),
  'mapKeys': _dereq_(279),
  'mapValues': _dereq_(280),
  'merge': _dereq_(282),
  'mergeWith': _dereq_(283),
  'omit': _dereq_(285),
  'omitBy': _dereq_(286),
  'pick': _dereq_(289),
  'pickBy': _dereq_(290),
  'result': _dereq_(296),
  'set': _dereq_(299),
  'setWith': _dereq_(300),
  'toPairs': _dereq_(309),
  'toPairsIn': _dereq_(310),
  'transform': _dereq_(314),
  'unset': _dereq_(315),
  'update': _dereq_(316),
  'updateWith': _dereq_(317),
  'values': _dereq_(318),
  'valuesIn': _dereq_(319)
};

},{"182":182,"183":183,"184":184,"185":185,"195":195,"196":196,"197":197,"200":200,"201":201,"204":204,"205":205,"208":208,"210":210,"216":216,"217":217,"218":218,"219":219,"220":220,"221":221,"222":222,"226":226,"227":227,"230":230,"231":231,"232":232,"272":272,"273":273,"279":279,"280":280,"282":282,"283":283,"285":285,"286":286,"289":289,"290":290,"296":296,"299":299,"300":300,"309":309,"310":310,"314":314,"315":315,"316":316,"317":317,"318":318,"319":319}],285:[function(_dereq_,module,exports){
var arrayMap = _dereq_(37),
    baseDifference = _dereq_(56),
    baseFlatten = _dereq_(63),
    basePick = _dereq_(88),
    getAllKeysIn = _dereq_(131),
    rest = _dereq_(295),
    toKey = _dereq_(180);

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable string keyed properties of `object` that are
 * not omitted.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [props] The property identifiers to omit.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omit(object, ['a', 'c']);
 * // => { 'b': '2' }
 */
var omit = rest(function(object, props) {
  if (object == null) {
    return {};
  }
  props = arrayMap(baseFlatten(props, 1), toKey);
  return basePick(object, baseDifference(getAllKeysIn(object), props));
});

module.exports = omit;

},{"131":131,"180":180,"295":295,"37":37,"56":56,"63":63,"88":88}],286:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    basePickBy = _dereq_(89);

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
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omitBy(object, _.isNumber);
 * // => { 'b': '2' }
 */
function omitBy(object, predicate) {
  predicate = baseIteratee(predicate);
  return basePickBy(object, function(value, key) {
    return !predicate(value, key);
  });
}

module.exports = omitBy;

},{"79":79,"89":89}],287:[function(_dereq_,module,exports){
var baseOrderBy = _dereq_(87),
    isArray = _dereq_(235);

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

},{"235":235,"87":87}],288:[function(_dereq_,module,exports){
var createAggregator = _dereq_(122);

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
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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

},{"122":122}],289:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(63),
    basePick = _dereq_(88),
    rest = _dereq_(295);

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [props] The property identifiers to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */
var pick = rest(function(object, props) {
  return object == null ? {} : basePick(object, baseFlatten(props, 1));
});

module.exports = pick;

},{"295":295,"63":63,"88":88}],290:[function(_dereq_,module,exports){
var baseIteratee = _dereq_(79),
    basePickBy = _dereq_(89);

/**
 * Creates an object composed of the `object` properties `predicate` returns
 * truthy for. The predicate is invoked with two arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pickBy(object, _.isNumber);
 * // => { 'a': 1, 'c': 3 }
 */
function pickBy(object, predicate) {
  return object == null ? {} : basePickBy(object, baseIteratee(predicate));
}

module.exports = pickBy;

},{"79":79,"89":89}],291:[function(_dereq_,module,exports){
var baseProperty = _dereq_(90),
    basePropertyDeep = _dereq_(91),
    isKey = _dereq_(154);

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
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
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"154":154,"90":90,"91":91}],292:[function(_dereq_,module,exports){
var arrayReduce = _dereq_(39),
    baseEach = _dereq_(57),
    baseIteratee = _dereq_(79),
    baseReduce = _dereq_(93),
    isArray = _dereq_(235);

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

},{"235":235,"39":39,"57":57,"79":79,"93":93}],293:[function(_dereq_,module,exports){
var arrayReduceRight = _dereq_(40),
    baseEachRight = _dereq_(58),
    baseIteratee = _dereq_(79),
    baseReduce = _dereq_(93),
    isArray = _dereq_(235);

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

},{"235":235,"40":40,"58":58,"79":79,"93":93}],294:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(34),
    baseFilter = _dereq_(60),
    baseIteratee = _dereq_(79),
    isArray = _dereq_(235);

/**
 * The opposite of `_.filter`; this method returns the elements of `collection`
 * that `predicate` does **not** return truthy for.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
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
  predicate = baseIteratee(predicate, 3);
  return func(collection, function(value, index, collection) {
    return !predicate(value, index, collection);
  });
}

module.exports = reject;

},{"235":235,"34":34,"60":60,"79":79}],295:[function(_dereq_,module,exports){
var apply = _dereq_(29),
    toInteger = _dereq_(306);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as
 * an array.
 *
 * **Note:** This method is based on the
 * [rest parameter](https://mdn.io/rest_parameters).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.rest(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function rest(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, array);
      case 1: return func.call(this, args[0], array);
      case 2: return func.call(this, args[0], args[1], array);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

module.exports = rest;

},{"29":29,"306":306}],296:[function(_dereq_,module,exports){
var castPath = _dereq_(107),
    isFunction = _dereq_(248),
    isKey = _dereq_(154);

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
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length;

  // Ensure the loop is entered when path is empty.
  if (!length) {
    object = undefined;
    length = 1;
  }
  while (++index < length) {
    var value = object == null ? undefined : object[path[index]];
    if (value === undefined) {
      index = length;
      value = defaultValue;
    }
    object = isFunction(value) ? value.call(object) : value;
  }
  return object;
}

module.exports = result;

},{"107":107,"154":154,"248":248}],297:[function(_dereq_,module,exports){
var baseRandom = _dereq_(92),
    isArrayLike = _dereq_(237),
    values = _dereq_(318);

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
  var array = isArrayLike(collection) ? collection : values(collection),
      length = array.length;

  return length > 0 ? array[baseRandom(0, length - 1)] : undefined;
}

module.exports = sample;

},{"237":237,"318":318,"92":92}],298:[function(_dereq_,module,exports){
var baseClamp = _dereq_(53),
    baseRandom = _dereq_(92),
    isIterateeCall = _dereq_(153),
    toArray = _dereq_(305),
    toInteger = _dereq_(306);

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
  var index = -1,
      result = toArray(collection),
      length = result.length,
      lastIndex = length - 1;

  if ((guard ? isIterateeCall(collection, n, guard) : n === undefined)) {
    n = 1;
  } else {
    n = baseClamp(toInteger(n), 0, length);
  }
  while (++index < n) {
    var rand = baseRandom(index, lastIndex),
        value = result[rand];

    result[rand] = result[index];
    result[index] = value;
  }
  result.length = n;
  return result;
}

module.exports = sampleSize;

},{"153":153,"305":305,"306":306,"53":53,"92":92}],299:[function(_dereq_,module,exports){
var baseSet = _dereq_(94);

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

},{"94":94}],300:[function(_dereq_,module,exports){
var baseSet = _dereq_(94);

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

},{"94":94}],301:[function(_dereq_,module,exports){
var sampleSize = _dereq_(298);

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

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
  return sampleSize(collection, MAX_ARRAY_LENGTH);
}

module.exports = shuffle;

},{"298":298}],302:[function(_dereq_,module,exports){
var getTag = _dereq_(138),
    isArrayLike = _dereq_(237),
    isObjectLike = _dereq_(260),
    isString = _dereq_(265),
    keys = _dereq_(272),
    stringSize = _dereq_(177);

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
 * @param {Array|Object} collection The collection to inspect.
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
    var result = collection.length;
    return (result && isString(collection)) ? stringSize(collection) : result;
  }
  if (isObjectLike(collection)) {
    var tag = getTag(collection);
    if (tag == mapTag || tag == setTag) {
      return collection.size;
    }
  }
  return keys(collection).length;
}

module.exports = size;

},{"138":138,"177":177,"237":237,"260":260,"265":265,"272":272}],303:[function(_dereq_,module,exports){
var arraySome = _dereq_(41),
    baseIteratee = _dereq_(79),
    baseSome = _dereq_(96),
    isArray = _dereq_(235),
    isIterateeCall = _dereq_(153);

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
 * @param {Array|Function|Object|string} [predicate=_.identity]
 *  The function invoked per iteration.
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

},{"153":153,"235":235,"41":41,"79":79,"96":96}],304:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(63),
    baseOrderBy = _dereq_(87),
    isArray = _dereq_(235),
    isFlattenableIteratee = _dereq_(150),
    isIterateeCall = _dereq_(153),
    rest = _dereq_(295);

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
 * @param {...(Array|Array[]|Function|Function[]|Object|Object[]|string|string[])}
 *  [iteratees=[_.identity]] The iteratees to sort by.
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
 * _.sortBy(users, function(o) { return o.user; });
 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
 *
 * _.sortBy(users, ['user', 'age']);
 * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
 *
 * _.sortBy(users, 'user', function(o) {
 *   return Math.floor(o.age / 10);
 * });
 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
 */
var sortBy = rest(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var length = iteratees.length;
  if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
    iteratees = [];
  } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
    iteratees = [iteratees[0]];
  }
  iteratees = (iteratees.length == 1 && isArray(iteratees[0]))
    ? iteratees[0]
    : baseFlatten(iteratees, 1, isFlattenableIteratee);

  return baseOrderBy(collection, iteratees, []);
});

module.exports = sortBy;

},{"150":150,"153":153,"235":235,"295":295,"63":63,"87":87}],305:[function(_dereq_,module,exports){
var Symbol = _dereq_(24),
    copyArray = _dereq_(119),
    getTag = _dereq_(138),
    isArrayLike = _dereq_(237),
    isString = _dereq_(265),
    iteratorToArray = _dereq_(158),
    mapToArray = _dereq_(164),
    setToArray = _dereq_(171),
    stringToArray = _dereq_(178),
    values = _dereq_(318);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Built-in value references. */
var iteratorSymbol = typeof (iteratorSymbol = Symbol && Symbol.iterator) == 'symbol' ? iteratorSymbol : undefined;

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
  if (iteratorSymbol && value[iteratorSymbol]) {
    return iteratorToArray(value[iteratorSymbol]());
  }
  var tag = getTag(value),
      func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);

  return func(value);
}

module.exports = toArray;

},{"119":119,"138":138,"158":158,"164":164,"171":171,"178":178,"237":237,"24":24,"265":265,"318":318}],306:[function(_dereq_,module,exports){
var toNumber = _dereq_(308);

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to an integer.
 *
 * **Note:** This function is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3');
 * // => 3
 */
function toInteger(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  var remainder = value % 1;
  return value === value ? (remainder ? value - remainder : value) : 0;
}

module.exports = toInteger;

},{"308":308}],307:[function(_dereq_,module,exports){
var baseClamp = _dereq_(53),
    toInteger = _dereq_(306);

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Converts `value` to an integer suitable for use as the length of an
 * array-like object.
 *
 * **Note:** This method is based on
 * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toLength(3);
 * // => 3
 *
 * _.toLength(Number.MIN_VALUE);
 * // => 0
 *
 * _.toLength(Infinity);
 * // => 4294967295
 *
 * _.toLength('3');
 * // => 3
 */
function toLength(value) {
  return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
}

module.exports = toLength;

},{"306":306,"53":53}],308:[function(_dereq_,module,exports){
var isFunction = _dereq_(248),
    isObject = _dereq_(259),
    isSymbol = _dereq_(266);

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
 * _.toNumber(3);
 * // => 3
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3');
 * // => 3
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
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

},{"248":248,"259":259,"266":266}],309:[function(_dereq_,module,exports){
var baseToPairs = _dereq_(99),
    keys = _dereq_(272);

/**
 * Creates an array of own enumerable string keyed-value pairs for `object`
 * which can be consumed by `_.fromPairs`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias entries
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
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
function toPairs(object) {
  return baseToPairs(object, keys(object));
}

module.exports = toPairs;

},{"272":272,"99":99}],310:[function(_dereq_,module,exports){
var baseToPairs = _dereq_(99),
    keysIn = _dereq_(273);

/**
 * Creates an array of own and inherited enumerable string keyed-value pairs
 * for `object` which can be consumed by `_.fromPairs`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias entriesIn
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
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
 * // => [['a', 1], ['b', 2], ['c', 1]] (iteration order is not guaranteed)
 */
function toPairsIn(object) {
  return baseToPairs(object, keysIn(object));
}

module.exports = toPairsIn;

},{"273":273,"99":99}],311:[function(_dereq_,module,exports){
var copyObject = _dereq_(120),
    keysIn = _dereq_(273);

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

},{"120":120,"273":273}],312:[function(_dereq_,module,exports){
var baseClamp = _dereq_(53),
    toInteger = _dereq_(306);

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
 * _.toSafeInteger(3);
 * // => 3
 *
 * _.toSafeInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toSafeInteger(Infinity);
 * // => 9007199254740991
 *
 * _.toSafeInteger('3');
 * // => 3
 */
function toSafeInteger(value) {
  return baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
}

module.exports = toSafeInteger;

},{"306":306,"53":53}],313:[function(_dereq_,module,exports){
var Symbol = _dereq_(24),
    isSymbol = _dereq_(266);

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
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
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toString;

},{"24":24,"266":266}],314:[function(_dereq_,module,exports){
var arrayEach = _dereq_(31),
    baseCreate = _dereq_(55),
    baseForOwn = _dereq_(65),
    baseIteratee = _dereq_(79),
    getPrototype = _dereq_(135),
    isArray = _dereq_(235),
    isFunction = _dereq_(248),
    isObject = _dereq_(259),
    isTypedArray = _dereq_(267);

/**
 * An alternative to `_.reduce`; this method transforms `object` to a new
 * `accumulator` object which is the result of running each of its own
 * enumerable string keyed properties thru `iteratee`, with each invocation
 * potentially mutating the `accumulator` object. The iteratee is invoked
 * with four arguments: (accumulator, value, key, object). Iteratee functions
 * may exit iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 1.3.0
 * @category Object
 * @param {Array|Object} object The object to iterate over.
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
  var isArr = isArray(object) || isTypedArray(object);
  iteratee = baseIteratee(iteratee, 4);

  if (accumulator == null) {
    if (isArr || isObject(object)) {
      var Ctor = object.constructor;
      if (isArr) {
        accumulator = isArray(object) ? new Ctor : [];
      } else {
        accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
      }
    } else {
      accumulator = {};
    }
  }
  (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
    return iteratee(accumulator, value, index, object);
  });
  return accumulator;
}

module.exports = transform;

},{"135":135,"235":235,"248":248,"259":259,"267":267,"31":31,"55":55,"65":65,"79":79}],315:[function(_dereq_,module,exports){
var baseUnset = _dereq_(101);

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

},{"101":101}],316:[function(_dereq_,module,exports){
var baseUpdate = _dereq_(102),
    castFunction = _dereq_(106);

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

},{"102":102,"106":106}],317:[function(_dereq_,module,exports){
var baseUpdate = _dereq_(102),
    castFunction = _dereq_(106);

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

},{"102":102,"106":106}],318:[function(_dereq_,module,exports){
var baseValues = _dereq_(103),
    keys = _dereq_(272);

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
  return object ? baseValues(object, keys(object)) : [];
}

module.exports = values;

},{"103":103,"272":272}],319:[function(_dereq_,module,exports){
var baseValues = _dereq_(103),
    keysIn = _dereq_(273);

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

},{"103":103,"273":273}],320:[function(_dereq_,module,exports){
module.exports = _dereq_(8);
},{"8":8}],321:[function(_dereq_,module,exports){
module.exports = _dereq_(14);
},{"14":14}],322:[function(_dereq_,module,exports){
module.exports = _dereq_(11);
},{"11":11}],323:[function(_dereq_,module,exports){
module.exports = _dereq_(12);
},{"12":12}]},{},[1])(1)
});
//# sourceMappingURL=d3-simple-networks.js.map