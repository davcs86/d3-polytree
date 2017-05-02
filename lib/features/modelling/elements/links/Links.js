'use strict';

var inherits = require('inherits'),
    base = require('../base'),
    forEach = require('lodash/collection').forEach,
    sortBy = require('lodash/collection').sortBy;

function Links(definitions, moddle, links, eventBus, drawingRegistry, notifications, modellingLabels) {
  base.call(this, definitions, links, drawingRegistry, notifications, eventBus);
  this._moddle = moddle;
  this._links = links;
  this._eventBus = eventBus;
  this._drawingRegistry = drawingRegistry;
  this._modellingLabels = modellingLabels;
  this._eventBus = eventBus;
  this.init();
}

Links.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'links',
  'eventBus',
  'drawingRegistry',
  'notifications',
  'modellingLabels'
];

module.exports = Links;

inherits(Links, base);

Links.prototype.create = function (nodeADef, nodeBDef) {
  var x = nodeADef.position.x + (nodeADef.size / 2),
      y = nodeADef.position.y + (nodeADef.size / 2),
      x1 = nodeBDef.position.x + (nodeBDef.size / 2),
      y1 = nodeBDef.position.y + (nodeBDef.size / 2);
  
  var waypoint1 = this._moddle.create('pfdn:Coordinates', {x: x, y: y}),
      waypoint2 = this._moddle.create('pfdn:Coordinates', {x: x1, y: y1}),
      newLinkDef = this._moddle.create('pfdn:Link', {
        source: nodeADef,
        target: nodeBDef,
        waypoint: [
          waypoint1,
          waypoint2
        ],
        status: 1
      });
  this._links._builder(newLinkDef);
  var targetElem = this._drawingRegistry.get(newLinkDef.target.id);
  this.updateNodeLinks(targetElem, newLinkDef.target);
  var sourceElem = this._drawingRegistry.get(newLinkDef.source.id);
  this.updateNodeLinks(sourceElem, newLinkDef.source);

  // create the associated
  var linkLabel = this._modellingLabels.create({
    position: {
      x: (waypoint1.x + waypoint2.x) / 2.0,
      y: (waypoint1.y + waypoint2.y) / 2.0
    }
  });
  linkLabel.set('text', newLinkDef.id);
  linkLabel.isReadOnly = true;
  newLinkDef.label = linkLabel;
  //console.log(newLinkDef);
  this._modellingLabels._labels._builder(linkLabel) ;
  // return the element
  return newLinkDef;
};

Links.prototype.init = function () {
  var updateLinksFn = function (element, definition) {
    this.updateNodeLinks(element, definition);
  }.bind(this);
  this._eventBus.on('node.created', updateLinksFn);
  this._eventBus.on('node.moved', updateLinksFn);
  this._eventBus.on('node.updated', updateLinksFn);
};

Links.prototype._calculateAngle = function (a, b) {
  // angle between 2 vectors (lines)
  var dotProduct = (a.x * b.x) + (a.y * b.y);
  var vectorAModule = Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
  var vectorBModule = Math.sqrt(Math.pow(b.x, 2) + Math.pow(b.y, 2));
  return Math.acos(dotProduct / (vectorAModule * vectorBModule));
};

Links.prototype._sortSide = function (sides, sideIdx, s) {
  // set reference vector and angle factor
  var vector = {x: 1, y: 1},
      factor = 1.0,
      that = this;
  if (sideIdx === 0) {
    vector.x = -1.0;
  } else if (sideIdx === 1) {
    factor = -1.0;
  } else if (sideIdx === 2) {
    vector.y = -1.0;
    factor = -1.0;
  } else if (sideIdx === 3) {
    vector.x = -1.0;
    vector.y = -1.0;
  }
  return sortBy(sides[sideIdx], function (o) {
    var vectorB = {
      x: o.pos.x - s.x,
      y: o.pos.y - s.y
    };
    return factor * that._calculateAngle(vector, vectorB);
  });
};

Links.prototype._setQuadrants = function (sides, s, t, toSave, isTarget) {
  var sideIdx = false;
  if (t.x >= s.x && t.y >= s.y) {
    if (Math.abs(t.x - s.x) >= Math.abs(t.y - s.y)) {
      // left side
      sideIdx = 3;
      if (isTarget && Math.abs(t.y - s.y) > 80)
        sideIdx = 0;
    } else {
      // upside
      sideIdx = 0;
      if (isTarget && Math.abs(t.x - s.x) > 80)
        sideIdx = 3;
    }
  } else if (t.x < s.x && t.y >= s.y) {
    if (Math.abs(t.x - s.x) >= Math.abs(t.y - s.y)) {
      // right side
      sideIdx = 1;
      if (isTarget && Math.abs(t.y - s.y) > 80)
        sideIdx = 0;
    } else {
      // upside
      sideIdx = 0;
      if (isTarget && Math.abs(t.x - s.x) > 80)
        sideIdx = 1;
    }
  } else if (t.x >= s.x && t.y < s.y) {
    if (Math.abs(t.x - s.x) >= Math.abs(t.y - s.y)) {
      // right side
      sideIdx = 3;
      if (isTarget && Math.abs(t.y - s.y) > 80)
        sideIdx = 2;
    } else {
      // downside
      sideIdx = 2;
      if (isTarget && Math.abs(t.x - s.x) > 80)
        sideIdx = 3;
    }
  } else if (t.x < s.x && t.y < s.y) {
    if (Math.abs(t.x - s.x) >= Math.abs(t.y - s.y)) {
      // right side
      sideIdx = 1;
      if (isTarget && Math.abs(t.y - s.y) > 80)
        sideIdx = 2;
    } else {
      // downside
      sideIdx = 2;
      if (isTarget && Math.abs(t.x - s.x) > 80)
        sideIdx = 1;
    }
  }
  
  if (sideIdx === false) {
    return;
  }
  sides[sideIdx].push({
    obj: toSave,
    pos: s
  });
  sides[sideIdx] = this._sortSide(sides, sideIdx, t);
  
};

Links.prototype._setSideConnectors = function (definition, isTarget) {
  var sides = [[], [], [], []],
      that = this,
      element = this._drawingRegistry.get(definition.id);
  if (element) {
    this._fillPredAndSuc(element, definition);
    forEach(element.predecessorList, function (link) {
      var sourceData = link.source;
      that._setQuadrants(sides, sourceData.position, definition.position, sourceData.id, isTarget);
    });
    forEach(element.sucessorList, function (link) {
      var targetData = link.target;
      that._setQuadrants(sides, targetData.position, definition.position, targetData.id, false);
    });
    element.sides = sides;
  }
};

Links.prototype.updateNodeLinks = function (element, definition) {
  var that = this;
  
  // update the positions of the links related to the node.
  this._fillPredAndSuc(element, definition);

  forEach(element.predecessorList, function (link) {
    that._updateLink(link);
  });

  forEach(element.sucessorList, function (link) {
    that._updateLink(link);
  });
};

Links.prototype._createWaypoint = function(x, y) {
  return this._moddle.create('pfdn:Coordinates', {x: x, y: y});
};

Links.prototype._updateLink = function (link) {
  // update the positions of the links related to the node.
  this._setSideConnectors(link.source, false);
  this._setSideConnectors(link.target, true);

  var sourcePoint = {x: link.source.position.x, y: link.source.position.y},
      targetPoint = {x: link.target.position.x, y: link.target.position.y},
      sourceElem = this._drawingRegistry.get(link.source.id),
      targetElem = this._drawingRegistry.get(link.target.id),
      sourceSide = {idx: 0},
      targetSide = {idx: 0},
      waypoints = [],
      curve1RefPoint = false,
      curve2RefPoint = false,
      midPoint = false;
  
  this._adjustSidePoint(sourcePoint, sourceElem.sides, link.target.id,  link.source.size, sourceSide);
  this._adjustSidePoint(targetPoint, targetElem.sides, link.source.id,  link.target.size, targetSide);
  
  waypoints.push(this._createWaypoint(sourcePoint.x, sourcePoint.y));
  if (sourceSide.idx === 1 || sourceSide.idx === 3){
    // source point starts from left or right
    if (targetSide.idx === 0 || targetSide.idx === 2){
      // target point arrives to top or bottom, draw a curve line
      curve1RefPoint = {
        x: targetPoint.x,
        y: sourcePoint.y
      };
    } else {
      if (Math.abs(sourcePoint.y - targetPoint.y) > 20) {
        // if distance allows to create a quadratic bezier curve, then draw it; else, show a straight line
        midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1RefPoint = {
          x: midPoint.x,
          y: sourcePoint.y
        };
        curve2RefPoint = {
          x: midPoint.x,
          y: targetPoint.y
        };
      }
    }
  } else {
    // source point starts from top or bottom
    if (targetSide.idx === 1 || targetSide.idx === 3){
      // target point arrives to left or right, draw a curve line
      curve1RefPoint = {
        x: sourcePoint.x,
        y: targetPoint.y
      };
    } else {
      if (Math.abs(sourcePoint.x - targetPoint.x) > 20) {
        // if distance allows to create a quadratic bezier curve, then draw it; else, show a straight line
        midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1RefPoint = {
          x: sourcePoint.x,
          y: midPoint.y
        };
        curve2RefPoint = {
          x: targetPoint.x,
          y: midPoint.y
        };
      }
    }
  }
  
  if (curve1RefPoint !== false){
    waypoints.push(this._createWaypoint(curve1RefPoint.x, curve1RefPoint.y));
  }
  if (curve2RefPoint !== false){
    waypoints.push(this._createWaypoint(curve2RefPoint.x, curve2RefPoint.y));
  }
  waypoints.push(this._createWaypoint(targetPoint.x, targetPoint.y));


  link.waypoint = waypoints;
  this._links._builder(link);
};

Links.prototype._adjustSidePoint = function(point, sides, referencePoint, elemSize, saveIndex){
  var found = false;
  elemSize = elemSize * 1.0;
  forEach(sides, function(side, sideIdx){
    var sideLen = side.length;
    if (found || sideLen===0){return;}
    var distBtwArrows = elemSize * 0.8 / (sideLen + 1);
    var origin = (elemSize / 2.0) - (distBtwArrows * (sideLen + 1) / 2);
    forEach(side, function(v) {
      origin += distBtwArrows;
      if (v.obj === referencePoint){
        saveIndex.idx = sideIdx;
        if (sideIdx === 0) {
          point.x += origin;
          point.y -= 5;
          //point.y -= elemSize / 2.0;
        } else if (sideIdx === 1) {
          point.x += elemSize + 5;
          point.y += origin;
        } else if (sideIdx === 2) {
          point.x += origin;
          point.y += elemSize + 5;
        } else if (sideIdx === 3) {
          //point.x += elemSize / 2.0;
          point.x -= 5;
          point.y += origin;
        }
        found = true;
      }
    });
  });
};

Links.prototype._fillPredAndSuc = function (element, definition) {
  element.predecessorList = [];
  element.sucessorList = [];
  
  forEach(this._links.getAll(), function (link) {
    if (link.target === definition) {
      element.predecessorList.push(link);
    }
    if (link.source === definition) {
      element.sucessorList.push(link);
    }
  });
};

