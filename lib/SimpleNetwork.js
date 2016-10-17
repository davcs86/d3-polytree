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
  tooltipHelper = require('d3-tip'),
  utf8 = require('utf8'),
  btoa64 = require('base-64'),
  DEFAULT_OPTIONS = {
    width: '1300',
    height: '800',
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
    groups: {},
    floatingLabels: []
  },
  xml2js = require('xml2js'),
  rawIcons = require('./icons'),
  processedIcons = {},
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
  // init the d3-tip plugin
  tooltipHelper(d3js);
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

SimpleNetwork.prototype.saveSVG = function(){
  var html = this.origSVG
    .attr('version', 1.2)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    .node().parentNode.innerHTML;
  return 'data:image/svg+xml;base64,' + btoa64.encode(utf8.encode(html));
};

SimpleNetwork.prototype.drawGroups = function(){
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
      .style('stroke-width', '2px')
      .style('fill-opacity', '0.3');

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
      })
      .on('mouseover', function(){
        var transform = d3js.transform(that.SVG.attr('transform')),
            zoom = transform.scale[0];
        if (zoom < 0.8){
          that.tooltip.show.apply(this, arguments);
        }
      })
      .on('mouseout', this.tooltip.hide);
};

SimpleNetwork.prototype.drawFloatingLabels = function(){
  // get the floating labels
  var floatingLabelsArray = values(this.options.floatingLabels);
  // create the floating labels
  var floatingLabels = this.SVG
    .append('g')
    .attr('class', 'floating-labels-container')
    .selectAll('.floatingLabels')
    .data(floatingLabelsArray)
    .enter()
    .append('text');

  this.floatingLabels = floatingLabels
    .attr('x', function (d) {
      return d.x;
    })
    .attr('label-id', function (d) {
      return d.id;
    })
    .attr('y', function (d) {
      return d.y;
    })
    .style('font-size', function (d) {
        return isUndefined(d.fontSize)?'60':d.fontSize;
    })
    .style('fill', function(d){
      return isUndefined(d.color)?'black':d.color;
    })
    .text(function(d){
      return isUndefined(d.label)?null:d.label;
    });
    // .on('mouseover', function(){
    //   var transform = d3js.transform(that.SVG.attr('transform')),
    //       zoom = transform.scale[0];
    //   if (zoom < 0.8){
    //     that.tooltip.show.apply(this, arguments);
    //   }
    // })
    // .on('mouseout', this.tooltip.hide);
};

SimpleNetwork.prototype.initSVG = function(){
  var that = this;
  this.rescale = function () {
      var trans = d3js.event.translate;
      var scale = d3js.event.scale;
      that.SVG.attr('transform', 'translate(' + trans + ') scale(' + scale + ')');

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
        'fill': 'transparent',
        'version': 1.2
      });

  if (this.options.showGridLines){
    this.drawGridLines();
  }

  var zoom = d3js
    .behavior
    .zoom()
    .scaleExtent([0.05, 10])
    .on('zoom', this.rescale);

  this.SVG = this.origSVG
    //.append('g')
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

  // tooltip
  this.tooltip = d3js.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return isUndefined(d.label)?'':d.label;
    });
  this.origSVG.call(this.tooltip);
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
        adjacencyList: that.nodes[nk].adjacencyList,
        positionX: level[nk].positionX,
        positionY: level[nk].positionY,
        overridePosition: level[nk].overridePosition,
        fixed: true,
        divisor: (levelNodeIds.length+1),
        iconType: level[nk].iconType || 'default',
        predecessorList: {}
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
          nodes[that.levels[targetLevel][nnk].position].predecessorList[nk]=1;
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

SimpleNetwork.prototype.createNode = function(iconKey, defsNode, parentNode, nodeObj, nodeType){
  var that = this;
  var attrs = nodeObj.$ || {};
  var thisNode = {};
  if (isUndefined(attrs.id)) {
    thisNode = parentNode.append(nodeType)
      .attr(attrs);
  } else {
    thisNode = defsNode.append(nodeType)
      .attr(attrs);
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
        that.createNode(iconKey, defsNode, defsNode, nodeDef, nodeDef['#name']);
      });
    } else {
      that.createNode(iconKey, defsNode, thisNode, node, node['#name']);
    }
  });
  return thisNode;
};

SimpleNetwork.prototype.defineIcons = function(){
  // create the icons definitions
  var that = this;
  forIn(rawIcons, function(icon, iconKey){
    var parser = new xml2js.Parser({normalizeTags: true, preserveChildrenOrder: true, explicitChildren: true });
    parser.parseString(icon, function (err, result) {
      if (!err){
        var iconObj = that.origSVG.select('defs');
        var iconNode = that.createNode(iconKey, iconObj, iconObj, result.svg, 'symbol');
        iconNode.attr('id', iconKey + '_icon_def');
        processedIcons[iconKey] = result.svg.$.viewBox || '';
      }
    });
  });
};

SimpleNetwork.prototype.createMarkerDef = function(strokeColor, suffix){
  this.defs
    .append('marker')
    .attr({
      'stroke': strokeColor,
      'id': strokeColor+'_markerEnd'+suffix,
      fill: 'white',
      'viewBox': '-4 -8 15 15',
      'refX': 7,
      'refY': 0,
      'markerWidth': 4,
      'markerHeight': 4,
      'orient': 'auto'
    })
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5Z');

  return strokeColor+'_markerEnd';
};

SimpleNetwork.prototype.createMarker = function(strokeColor){
  if (isUndefined(this.markerDefs[strokeColor])) {
    this.createMarkerDef(strokeColor, '');
    this.markerDefs[strokeColor] = this.createMarkerDef(strokeColor, 'A');
  }
  return this.markerDefs[strokeColor];
};

SimpleNetwork.prototype.restart = function(recalculate){
  var that = this;

  this.tick = function() {
    // fix elements positions
    that.node
      .attr('transform', function(d) {
        that.nodes[d.nodeId].position = {x: d.x, y: d.y};
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    // save the floating labels positions
    that.floatingLabels
      .attr('label-id', function(d) {
        d.x = this.attributes.x.value;
        d.y = this.attributes.y.value;
        return d.id;
      });

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
         var hasA = curr.charAt(curr.length-2) === 'A';
         var currPrefix = curr.substr(0, curr.length-1);
         return currPrefix+(hasA?'':'A')+')';
      })
      .attr('d', function(d){
        return helper.calculateLinkPath(d, that.nodes);
      });

    that.sublink
      .attr('d', function(d){
        return helper.calculateLinkPath(d, that.nodes);
      });

    that.linkNotes
      .attr('text-anchor', function(d){
        return helper.calculateLinkNoteAnchor(d);
      })
      .attr('transform', function(d){
        return helper.calculateLinkNotePosition(d);
      });

    that.force.stop();
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
  this.defs = this.origSVG
    .append('defs');
  this.markerDefs = {};

  // define the icons
  this.defineIcons();

  // draw the groups
  this.drawGroups();

  // draw the floatingLabels
  this.drawFloatingLabels();

  // create the links paths and marker
  this.linkg = this.SVG
      .selectAll('.link')
      .data(this.force.links())
      .enter()
    .append('g');

  this.link = this.linkg
    .append('path')
      .attr({
         'marker-end': function(d){
           return 'url(#'+that.createMarker((isUndefined(d.color) || d.color===null)?'black':d.color)+')';
         }
      })
      .attr('stroke', function(d){
         return (isUndefined(d.color) || d.color===null)?'black':d.color;
      })
      .style({
        'fill': 'none',
        'stroke-width': '4px',
        'stroke-linecap': 'round'
      });

  this.sublink = this.linkg
    .append('path')
      .style({
        'stroke': 'white',
        'fill': 'none',
        'stroke-width': '1.5px',
        'stroke-linecap': 'round'
      });

  this.linkNotes = this.linkg
    .append('text')
      .attr('text-anchor', 'end')
      .attr('fill', this.options.fontColor)
      .style({
        'stroke': 'none',
        'font-weight': 'bold',
        'font-size': '8px',
        'font-family': '"Helvetica Neue",Helvetica,Arial,sans-serif !important'
      })
      .text(function(d){
        return (isUndefined(d.label) || d.label===null)?'':d.label;
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
    })
    .on('mouseover', function(){
      var transform = d3js.transform(that.SVG.attr('transform')),
        zoom = transform.scale[0];
      if (zoom < 0.8){
        that.tooltip.show.apply(this, arguments);
      }
    })
    .on('mouseout', this.tooltip.hide);

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
      if (!isUndefined(processedIcons[d.iconType])) return processedIcons[d.iconType];
      return processedIcons['default'];
    })
    .attr('preserveAspectRatio', 'xMaxYMax meet')
    .append('use')
      .attr('xlink:href', function(d) {
        if (!isUndefined(processedIcons[d.iconType])) return '#'+d.iconType+'_icon_def';
        return '#default_icon_def';
      });

  // append the label to the node
  this.labels = this.node
    .append('text')
      .attr({
        'text-anchor': 'middle',
        'y': 37,
        'fill': this.options.fontColor
      })
      .style({
        'font-family': '"Helvetica Neue",Helvetica,Arial,sans-serif !important'
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
        that.tick();
      })
      .on('dragend', function () {
        d3js.select(this).classed('mousemove', false);
        that.selected_node = null;
        that.mousedown_node = null;
        that.tick();
        that.force.resume();
      });
    // set the node dragging
    this.node.call(drag);
  }

  this.force.on('tick', this.tick);
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

SimpleNetwork.prototype.getFloatingLabelsPosition = function(){
  // update data with the last position
  this.tick();
  return this.floatingLabels.data();
};

SimpleNetwork.prototype.init = function(recalculate){
  // init d3 svg
  this.initSVG();
  // process the nodes
  recalculate = !!recalculate;
  this.restart(recalculate);
};

module.exports = SimpleNetwork;
