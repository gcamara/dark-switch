// Decides whether a page already ships a dark theme, from the computed background of body/html.
(function (root) {
  "use strict";

  // Below this relative luminance the background reads as dark (#2e2e2e ~ 0.027, #808080 ~ 0.216).
  const DARK_LUMINANCE = 0.18;

  /** Example: parseRgb("rgba(0, 0, 0, 0.5)") -> {r:0,g:0,b:0,a:0.5}; parseRgb("red") -> null */
  function parseRgb(value) {
    const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(value || "");
    if (!match) return null;
    const [, r, g, b, alpha] = match;
    const a = alpha === undefined ? 1 : alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha);
    return { r: Number(r), g: Number(g), b: Number(b), a };
  }

  function channel(value) {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /** WCAG relative luminance, 0 (black) to 1 (white). */
  function relativeLuminance({ r, g, b }) {
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  /** First opaque colour wins; all-transparent means the canvas default, which is white. */
  function looksDark(backgroundColors) {
    const solid = backgroundColors.map(parseRgb).find((c) => c && c.a > 0);
    if (!solid) return false;
    return relativeLuminance(solid) < DARK_LUMINANCE;
  }

  /** Example: detectPageDark(document, window) -> true on a site with a #111 body */
  function detectPageDark(doc, win) {
    const elements = [doc.body, doc.documentElement].filter(Boolean);
    return looksDark(elements.map((el) => win.getComputedStyle(el).backgroundColor));
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, {
    parseRgb,
    relativeLuminance,
    looksDark,
    detectPageDark,
  });
})(globalThis);
