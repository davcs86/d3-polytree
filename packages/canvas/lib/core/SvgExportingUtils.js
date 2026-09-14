var _findIndex = require('lodash/array').findIndex;

module.exports = function ( svgNode ) {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  var cssStyleText = getCSSStyles( svgNode );
  appendCSS(cssStyleText, svgNode);

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

  return svgString;

  function getCSSStyles( parentElement ) {
    var selectorTextArr = [],
        sels = '[\\.,#\\s\\*>+~\\[=:]',
        escapeRegExp = function (str) {
          return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        },
        createRegExp = function(str){
          return new RegExp('.*'+sels+escapeRegExp(str)+sels+'.*', 'gi');
        };

    // Add Parent element Id and Classes to the list
    selectorTextArr.push( createRegExp('#'+parentElement.id) );
    for (var c = 0; c < parentElement.classList.length; c++)
      if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
        selectorTextArr.push( createRegExp('.'+parentElement.classList[c]) );

    // Add Children element Ids and Classes to the list
    var nodes = parentElement.getElementsByTagName('*');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if ( !contains('#'+id, selectorTextArr) )
        selectorTextArr.push( createRegExp('#' + id) );

      var classes = nodes[i].classList;
      for (var c = 0; c < classes.length; c++)
        if ( !contains('.'+classes[c], selectorTextArr) )
          selectorTextArr.push( createRegExp('.'+classes[c]) );
    }

    console.log(selectorTextArr);

    // Extract CSS Rules
    var extractedCSSText = '';
    for (var i = 0; i < document.styleSheets.length; i++) {
      var s = document.styleSheets[i];

      try {
        if(!s.cssRules) continue;
      } catch( e ) {
        if(e.name !== 'SecurityError') throw e; // for Firefox
        continue;
      }

      var cssRules = s.cssRules;

      for (var r = 0; r < cssRules.length; r++) {
        console.log(cssRules[r].selectorText);
        if ( cssRules[r].selectorText && contains( cssRules[r].selectorText+' ', selectorTextArr ) )
          extractedCSSText += cssRules[r].cssText;
      }
    }

    return extractedCSSText;

    function contains(str,arr) {
      return _findIndex(arr, function(s){
        str.match(s);
      }) !== -1;
    }

  }

  function appendCSS( cssText, element ) {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type','text/css');
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore( styleElement, refNode );
    if (refNode && refNode.tagName.toLowerCase()==='style'){
      refNode.parentNode.removeChild(refNode);
    }
  }
};
