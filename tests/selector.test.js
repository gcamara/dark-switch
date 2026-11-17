"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { FakeElement } = require("./fakes.js");
require("../src/lib/selector.js");
const DS = globalThis.DarkSwitch;

const escape = (s) => s;

function tree() {
  const html = new FakeElement("html");
  const body = new FakeElement("body");
  const main = new FakeElement("main", { id: "main" });
  const first = new FakeElement("div", { classes: ["card", "css-1ab23c"] });
  const second = new FakeElement("div", { classes: ["card"] });
  html.append(body.append(main.append(first, second)));
  return { main, first, second };
}

test("isStableName rejects generated class names", () => {
  assert.equal(DS.isStableName("card"), true);
  assert.equal(DS.isStableName("css-1ab23c"), false);
  assert.equal(DS.isStableName("x12345"), false);
});

test("segmentFor adds stable classes and nth-of-type among same-tag siblings", () => {
  const { first } = tree();
  assert.equal(DS.segmentFor(first, escape), "div.card:nth-of-type(1)");
});

test("buildSelector uses the element's own stable id", () => {
  const { main } = tree();
  assert.equal(DS.buildSelector(main, { escape, matchesOnly: (s) => s === "#main" }), "#main");
});

test("buildSelector anchors on an ancestor id when the bare path is ambiguous", () => {
  const { second } = tree();
  const expected = "#main > div.card:nth-of-type(2)";
  assert.equal(DS.buildSelector(second, { escape, matchesOnly: (s) => s === expected }), expected);
});

test("buildSelector returns the shortest unique path", () => {
  const { second } = tree();
  const sel = DS.buildSelector(second, { escape, matchesOnly: (s) => s === "div.card:nth-of-type(2)" });
  assert.equal(sel, "div.card:nth-of-type(2)");
});
