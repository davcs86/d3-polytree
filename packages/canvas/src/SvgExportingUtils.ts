/**
 * Serialize an SVG node to a string with the CSS rules that apply to it (and its
 * descendants) inlined, so the exported SVG renders standalone.
 *
 * Ported from the original `d3-canvas` util. Fixes a latent bug where the
 * selector-match predicate never returned a value (so no CSS was ever inlined),
 * and drops debug `console.log`s.
 */
export function getSvgString(svgNode: SVGSVGElement): string {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  appendCSS(getCSSStyles(svgNode), svgNode);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // root xlink ns
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari ns fix
  return svgString;
}

function escapeRegExp(str: string): string {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}

function contains(str: string, matchers: RegExp[]): boolean {
  return matchers.some((re) => str.match(re) !== null);
}

function getCSSStyles(parentElement: SVGSVGElement): string {
  const sels = '[\\.,#\\s\\*>+~\\[=:]';
  const createRegExp = (str: string): RegExp =>
    new RegExp(`.*${sels}${escapeRegExp(str)}${sels}.*`, 'gi');

  const matchers: RegExp[] = [];
  const pushSelector = (selector: string): void => {
    if (!contains(selector, matchers)) {
      matchers.push(createRegExp(selector));
    }
  };

  pushSelector(`#${parentElement.id}`);
  parentElement.classList.forEach((cls) => pushSelector(`.${cls}`));

  const nodes = parentElement.getElementsByTagName('*');
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as Element;
    if (node.id) {
      pushSelector(`#${node.id}`);
    }
    node.classList.forEach((cls) => pushSelector(`.${cls}`));
  }

  let extractedCSSText = '';
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      if ((e as DOMException).name !== 'SecurityError') {
        throw e;
      }
      continue;
    }
    if (!rules) {
      continue;
    }
    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r] as CSSStyleRule;
      if (rule.selectorText && contains(`${rule.selectorText} `, matchers)) {
        extractedCSSText += rule.cssText;
      }
    }
  }

  return extractedCSSText;
}

function appendCSS(cssText: string, element: SVGSVGElement): void {
  const styleElement = document.createElement('style');
  styleElement.setAttribute('type', 'text/css');
  styleElement.textContent = cssText;
  const refNode = element.hasChildNodes() ? element.children[0] : null;
  element.insertBefore(styleElement, refNode);
}
