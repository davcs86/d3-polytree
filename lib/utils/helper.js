'use strict';

var forEach = require('lodash/collection').forEach,
  forIn = require('lodash/object').forIn,
  sortBy = require('lodash/collection').sortBy;

function D3SNHelpers(){
}

D3SNHelpers.prototype.calculateLinkNoteAnchor = function(d) {
  var anchor = 'end',
    sourcePoint = {x: d.source.x, y: d.source.y},
    targetPoint = {x: d.target.x, y: d.target.y};

  this.adjustSidePoint(sourcePoint, d.source.sides, d.target.nodeId, {idx:0});
  this.adjustSidePoint(targetPoint, d.target.sides, d.source.nodeId, {idx:0});

  if (targetPoint.x < sourcePoint.x){
    anchor = 'start';
  }

  return anchor;
};

D3SNHelpers.prototype.calculateLinkNotePosition = function(d) {
  var position = 'translate(',
    targetId = d.target.nodeId,
    sourceSide = {idx:0},
    targetSide = {idx:0},
    sourcePoint = {x: d.source.x, y: d.source.y},
    midPoint = {},
    sourceId = d.source.nodeId,
    targetPoint = {x: d.target.x, y: d.target.y},
    x = 0,
    y = 0;

  this.adjustSidePoint(sourcePoint, d.source.sides, targetId, sourceSide);
  this.adjustSidePoint(targetPoint, d.target.sides, sourceId, targetSide);

  midPoint = {
    x: (targetPoint.x + sourcePoint.x) / 2,
    y: (targetPoint.y + sourcePoint.y) / 2
  };

  if (sourceSide.idx === 1 || sourceSide.idx == 3){
    if (targetSide.idx === 0 || targetSide.idx === 2){
      x = targetPoint.x;
      y = sourcePoint.y;
    } else {
      x = midPoint.x;
      y = midPoint.y;
    }
  } else {
    if (targetSide.idx === 1 || targetSide.idx === 3){
      x = targetPoint.x;
      y = targetPoint.y;
    } else {
      x = midPoint.x;
      y = midPoint.y;
    }
  }
  // fix coords
  x += ((targetPoint.x > sourcePoint.x ? -1 : 1) * 10);
  y += ((targetPoint.y > sourcePoint.y ? 1 : -1) * 10);
  position += x + ',' + y + ')';
  return position;
};

D3SNHelpers.prototype.calculateAngle = function(a, b){
  var dotProduct = (a.x * b.x) + (a.y * b.y);
  var vectorAModule = Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
  var vectorBModule = Math.sqrt(Math.pow(b.x, 2) + Math.pow(b.y, 2));
  return Math.acos(dotProduct / (vectorAModule * vectorBModule));
};

D3SNHelpers.prototype.sortSide = function(sides, sideIdx, s){
  // set reference vector and angle factor
  var vector = {x:1, y:1},
    factor = 1.0,
    that = this;
  switch(sideIdx){
    case 0:
      vector.x = -1.0;
      break;
    case 1:
      factor = -1.0;
      break;
    case 2:
      vector.y = -1.0;
      break;
    case 3:
      vector.x = -1.0;
      vector.y = -1.0;
      factor = -1.0;
      break;
  }
  return sortBy(sides[sideIdx], function(o){
    var vectorB = {
      x : o.pos.x - s.x,
      y : o.pos.y - s.y
    };
    return factor*that.calculateAngle(vector, vectorB);
  });
};

D3SNHelpers.prototype.setQuadrants = function(sides, s, t, toSave, isTarget){
  var sideIdx = false;
  if (t.x >= s.x && t.y >= s.y){
    if (Math.abs(t.x - s.x)>=Math.abs(t.y - s.y)){
      // left side
      sideIdx = 3;
      if (isTarget && Math.abs(t.y - s.y)>80)
        sideIdx = 0;
    } else {
      // upside
      sideIdx = 0;
      if (isTarget && Math.abs(t.x - s.x)>80)
        sideIdx=3;
    }
  } else if (t.x < s.x && t.y >= s.y){
    if (Math.abs(t.x - s.x)>=Math.abs(t.y - s.y)){
      // right side
      sideIdx = 1;
      if (isTarget && Math.abs(t.y - s.y)>80)
        sideIdx=0;
    } else {
      // upside
      sideIdx = 0;
      if(isTarget && Math.abs(t.x - s.x)>80)
        sideIdx=1;
    }
  } else if (t.x >= s.x && t.y < s.y){
    if (Math.abs(t.x - s.x)>=Math.abs(t.y - s.y)){
      // right side
      sideIdx = 3;
      if(isTarget && Math.abs(t.y - s.y)>80)
        sideIdx=2;
    } else {
      // downside
      sideIdx = 2;
      if(isTarget && Math.abs(t.x - s.x)>80)
        sideIdx=3;
    }
  } else if (t.x < s.x && t.y < s.y){
    if (Math.abs(t.x - s.x)>=Math.abs(t.y - s.y)){
      // right side
      sideIdx = 1;
      if(isTarget && Math.abs(t.y - s.y)>80)
        sideIdx=2;
    } else {
      // downside
      sideIdx = 2;
      if(isTarget && Math.abs(t.x - s.x)>80)
        sideIdx=1;
    }
  }
  if (sideIdx === false){return;}
  sides[sideIdx].push({
    obj: toSave,
    pos: s
  });
  sides[sideIdx] = this.sortSide(sides, sideIdx, t);
};

D3SNHelpers.prototype.setSideConnectors = function(s, n, isTarget){
  var sides = [[],[],[],[]],
    that =  this;
  forIn(s.predecessorList, function(v, t){
    that.setQuadrants(sides, n[t].position, n[s.nodeId].position, t, isTarget);
  });
  forIn(s.adjacencyList, function(v, t){
    that.setQuadrants(sides, n[t].position, n[s.nodeId].position, t, false);
  });
  s.sides = sides;
};

D3SNHelpers.prototype.adjustSidePoint = function(point, sides, referencePoint, saveIndex){
  var found = false;
  forEach(sides, function(side, sideIdx){
    var sideLen = side.length;
    if (found || sideLen===0){return;}
    var distBtwArrows = 50 * 0.8 / (sideLen + 1);
    var origin = -1.0 * (distBtwArrows * (sideLen + 1) / 2);
    forEach(side, function(v) {
      origin += distBtwArrows;
      if (v.obj == referencePoint){
        saveIndex.idx = sideIdx;
        switch(sideIdx){
          case 0:
            point.x += origin;
            point.y -= 29;
            break;
          case 1:
            point.x += 29;
            point.y += origin;
            break;
          case 2:
            point.x -= origin;
            point.y += 44;
            break;
          case 3:
            point.x -= 29;
            point.y -= origin;
            break;
        }
        found = true;
      }
    });
  });
};

D3SNHelpers.prototype.calculateLinkPath = function(d, n){
  this.setSideConnectors(d.source, n, false);
  this.setSideConnectors(d.target, n, true);

  var linePath,
    targetId = d.target.nodeId,
    sourceSide = {idx:0},
    targetSide = {idx:0},
    sourcePoint = {x: d.source.x, y: d.source.y},
    curve1StartPoint = false,
    curve1RefPoint = false,
    curve1EndPoint = false,
    curve2StartPoint = false,
    curve2RefPoint = false,
    curve2EndPoint = false,
    midPoint = {},
    sourceId = d.source.nodeId,
    targetPoint = {x: d.target.x, y: d.target.y};

  this.adjustSidePoint(sourcePoint, d.source.sides, targetId, sourceSide);
  this.adjustSidePoint(targetPoint, d.target.sides, sourceId, targetSide);

  linePath = 'M ' + sourcePoint.x + ' ' + sourcePoint.y;
  if (sourceSide.idx === 1 || sourceSide.idx == 3){
    // source point starts from left or right
    if (targetSide.idx === 0 || targetSide.idx === 2){
      // target point arrives to top or bottom, draw a curve line
      curve1StartPoint = {
        x: targetPoint.x + ((targetPoint.x > sourcePoint.x ? -1 : 1) * 10),
        y: sourcePoint.y
      };
      curve1RefPoint = {
        x: targetPoint.x,
        y: sourcePoint.y
      };
      curve1EndPoint = {
        x: targetPoint.x,
        y: sourcePoint.y + ((targetPoint.y > sourcePoint.y ? 1 : -1) * 10)
      };
    } else {
      if (Math.abs(sourcePoint.y - targetPoint.y) > 20) {
        // if distance allows to create a quadratic bezier curve, then draw it; else, show a straight line
        midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1StartPoint = {
          x: midPoint.x + ((targetPoint.x > sourcePoint.x ? -1 : 1) * 10),
          y: sourcePoint.y
        };
        curve1RefPoint = {
          x: midPoint.x,
          y: sourcePoint.y
        };
        curve1EndPoint = {
          x: midPoint.x,
          y: sourcePoint.y + ((targetPoint.y > sourcePoint.y ? 1 : -1) * 10)
        };
        /* - - - */
        curve2StartPoint = {
          x: midPoint.x,
          y: targetPoint.y + ((targetPoint.y > sourcePoint.y ? -1 : 1) * 10)
        };
        curve2RefPoint = {
          x: midPoint.x,
          y: targetPoint.y
        };
        curve2EndPoint = {
          x: midPoint.x + ((targetPoint.x > sourcePoint.x ? 1 : -1) * 10),
          y: targetPoint.y
        };
      }
    }
  } else {
    // source point starts from top or bottom
    if (targetSide.idx === 1 || targetSide.idx === 3){
      // target point arrives to left or right, draw a curve line
      curve1StartPoint = {
        x: sourcePoint.x,
        y: targetPoint.y + ((targetPoint.y > sourcePoint.y ? -1 : 1) * 10)
      };
      curve1RefPoint = {
        x: sourcePoint.x,
        y: targetPoint.y
      };
      curve1EndPoint = {
        x: sourcePoint.x + ((targetPoint.x > sourcePoint.x ? 1 : -1) * 10),
        y: targetPoint.y
      };
    } else {
      if (Math.abs(sourcePoint.x - targetPoint.x) > 20) {
        // if distance allows to create a quadratic bezier curve, then draw it; else, show a straight line
        midPoint = {
          x: (targetPoint.x + sourcePoint.x) / 2,
          y: (targetPoint.y + sourcePoint.y) / 2
        };
        curve1StartPoint = {
          x: sourcePoint.x,
          y: midPoint.y + ((targetPoint.y > sourcePoint.y ? -1 : 1) * 10)
        };
        curve1RefPoint = {
          x: sourcePoint.x,
          y: midPoint.y
        };
        curve1EndPoint = {
          x: sourcePoint.x + ((targetPoint.x > sourcePoint.x ? 1 : -1) * 10),
          y: midPoint.y
        };
        /* - - - */
        curve2StartPoint = {
          x: targetPoint.x + ((targetPoint.x > sourcePoint.x ? -1 : 1) * 10),
          y: midPoint.y
        };
        curve2RefPoint = {
          x: targetPoint.x,
          y: midPoint.y
        };
        curve2EndPoint = {
          x: targetPoint.x,
          y: midPoint.y + ((targetPoint.y > sourcePoint.y ? 1 : -1) * 10)
        };
      }
    }
  }
  if (curve1StartPoint !== false){
    linePath += ' L ' + curve1StartPoint.x + ' ' + curve1StartPoint.y;
    linePath += ' Q ' + curve1RefPoint.x + ' ' + curve1RefPoint.y;
    linePath += ' ' + curve1EndPoint.x + ' ' + curve1EndPoint.y;
  }
  if (curve2StartPoint !== false){
    linePath += ' L ' + curve2StartPoint.x + ' ' + curve2StartPoint.y;
    linePath += ' Q ' + curve2RefPoint.x + ' ' + curve2RefPoint.y;
    linePath += ' ' + curve2EndPoint.x + ' ' + curve2EndPoint.y;
  }
  linePath += ' L ' + targetPoint.x + ' ' + targetPoint.y;

  return linePath;
};

module.exports = new D3SNHelpers();