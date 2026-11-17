"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/lib/host.js");
require("../src/lib/palette.js");
require("../src/lib/settings.js");
require("../src/lib/dark-detect.js");
const DS = globalThis.DarkSwitch;

test("normalizeHost folds case and www", () => {
  assert.equal(DS.normalizeHost("WWW.GitHub.com"), "github.com");
  assert.throws(() => DS.normalizeHost(""), /non-empty hostname/);
});

test("topHostname prefers the top origin inside iframes", () => {
  assert.equal(DS.topHostname({ hostname: "a.com", ancestorOrigins: [] }), "a.com");
  assert.equal(DS.topHostname({ hostname: "ads.net", ancestorOrigins: ["https://b.com", "https://top.com"] }), "top.com");
  assert.equal(DS.topHostname({ hostname: "" }), "");
});

test("resolvePalette layers default < global < site and drops bad values", () => {
  const p = DS.resolvePalette({ bg: "#000000", text: "red" }, { bg: "#111111" });
  assert.equal(p.bg, "#111111");
  assert.equal(p.text, DS.DEFAULT_PALETTE.text);
});

test("buildThemeCss is empty when off and picks the mode", () => {
  assert.equal(DS.buildThemeCss({ enabled: false }, {}), "");
  assert.match(DS.buildThemeCss({ enabled: true, mode: "invert" }, {}), /invert\(1\)/);
  assert.match(DS.buildThemeCss({ enabled: true, mode: "palette", palette: null }, { bg: "#010203" }), /--ds-bg:#010203/);
});

test("buildHiddenCss emits one rule per valid selector", () => {
  const css = DS.buildHiddenCss([".ad", "bad{", "#x"], (s) => !s.includes("{"));
  assert.equal(css, ".ad{display:none!important}\n#x{display:none!important}");
});

test("normalizeSite fills defaults and filters junk", () => {
  const site = DS.normalizeSite({ mode: "weird", hidden: [".a", 3, ""], enabled: "yes" });
  assert.deepEqual(site, { enabled: false, mode: "palette", overrideDark: false, hidden: [".a"], palette: null });
});

test("addHidden trims and dedupes; removeHidden removes", () => {
  const site = DS.addHidden(DS.addHidden(DS.normalizeSite(null), " .ad "), ".ad");
  assert.deepEqual(site.hidden, [".ad"]);
  assert.deepEqual(DS.removeHidden(site, ".ad").hidden, []);
});

test("parseRgb and looksDark", () => {
  assert.deepEqual(DS.parseRgb("rgba(1, 2, 3, 0.5)"), { r: 1, g: 2, b: 3, a: 0.5 });
  assert.equal(DS.parseRgb("red"), null);
  assert.equal(DS.looksDark(["rgba(0, 0, 0, 0)", "rgb(17, 17, 17)"]), true);
  assert.equal(DS.looksDark(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]), false);
  assert.equal(DS.looksDark(["rgb(255, 255, 255)"]), false);
});
