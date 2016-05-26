'use strict';

function D3SNHelpers(){
}

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