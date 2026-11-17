// Builds a CSS selector that matches exactly one picked element, short enough to survive reloads.
(function (root) {
  "use strict";

  // Hashed/generated names (css-1x2y3z, sc-AbC12, jsx-123) change between builds, so they are skipped.
  function isStableName(name) {
    return name.length > 0 && name.length < 32 && !/\d{2,}|^(css|sc|jsx|svelte)-|[:[\]]/.test(name);
  }

  function stableClasses(el) {
    return Array.from(el.classList || []).filter(isStableName).slice(0, 2);
  }

  function nthOfType(el) {
    const parent = el.parentElement;
    if (!parent) return "";
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
    if (sameTag.length === 1) return "";
    return `:nth-of-type(${sameTag.indexOf(el) + 1})`;
  }

  /** Example: segmentFor(<li class="item">, esc) -> "li.item:nth-of-type(3)" */
  function segmentFor(el, escape) {
    const classes = stableClasses(el).map((c) => "." + escape(c)).join("");
    return el.tagName.toLowerCase() + classes + nthOfType(el);
  }

  function idSelector(el, escape) {
    return el.id && isStableName(el.id) ? "#" + escape(el.id) : "";
  }

  /**
   * Walks up from el, prepending one segment per ancestor, until matchesOnly(selector) is true.
   * An ancestor with a stable id anchors the path. deps = { matchesOnly(sel) -> bool, escape(str) -> str }.
   * Example: buildSelector(adBanner, {matchesOnly, escape: CSS.escape}) -> "#main > div.ad"
   */
  function buildSelector(el, deps) {
    const own = idSelector(el, deps.escape);
    if (own && deps.matchesOnly(own)) return own;
    const path = [segmentFor(el, deps.escape)];
    for (let node = el.parentElement; node && node.tagName.toLowerCase() !== "html"; node = node.parentElement) {
      if (deps.matchesOnly(path.join(" > "))) return path.join(" > ");
      const anchor = idSelector(node, deps.escape);
      if (anchor && deps.matchesOnly(`${anchor} > ${path.join(" > ")}`)) return `${anchor} > ${path.join(" > ")}`;
      path.unshift(segmentFor(node, deps.escape));
    }
    return path.join(" > ");
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, { isStableName, segmentFor, buildSelector });
})(globalThis);
